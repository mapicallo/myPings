import {
  applyStaticTranslations,
  initI18n,
  setLocale,
  t,
  type Locale,
} from './lib/i18n/index.js';
import {
  ensureFeedPermission,
  probeAndBuildSource,
  refreshSource,
} from './lib/rss.js';
import {
  loadPings,
  loadSources,
  markPingRead,
  mergePings,
  removeSourceAndPings,
  saveSources,
} from './lib/storage.js';
import { APP_VERSION, type PingCategory, type PingItem, type PingSource } from './lib/types.js';

const localeSelect = document.getElementById('locale-select') as HTMLSelectElement;
const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;
const addSourceBtn = document.getElementById('add-source-btn') as HTMLButtonElement;
const addPanel = document.getElementById('add-panel')!;
const confirmAddBtn = document.getElementById('confirm-add-btn') as HTMLButtonElement;
const cancelAddBtn = document.getElementById('cancel-add-btn') as HTMLButtonElement;
const feedUrlInput = document.getElementById('feed-url') as HTMLInputElement;
const feedCategory = document.getElementById('feed-category') as HTMLSelectElement;
const formError = document.getElementById('form-error')!;
const statusLine = document.getElementById('status-line')!;
const sourcesList = document.getElementById('sources-list')!;
const pingList = document.getElementById('ping-list')!;
const emptyState = document.getElementById('empty-state')!;
const versionStrip = document.getElementById('version-strip')!;
const privacyLink = document.getElementById('privacy-link') as HTMLAnchorElement;

let sources: PingSource[] = [];
let pings: PingItem[] = [];
let activeTab: PingCategory = 'all';
let busy = false;

function showError(msg: string): void {
  formError.hidden = false;
  formError.textContent = msg;
}

function clearError(): void {
  formError.hidden = true;
  formError.textContent = '';
}

function setStatus(msg: string | null): void {
  if (!msg) {
    statusLine.hidden = true;
    statusLine.textContent = '';
    return;
  }
  statusLine.hidden = false;
  statusLine.textContent = msg;
}

function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const t0 = new Date(iso).getTime();
  if (Number.isNaN(t0)) return iso;
  const diff = Date.now() - t0;
  const m = Math.round(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  const d = Math.round(h / 24);
  return `${d}d`;
}

function visiblePings(): PingItem[] {
  const filtered =
    activeTab === 'all' ? pings : pings.filter((p) => p.category === activeTab);
  return filtered
    .slice()
    .sort((a, b) => {
      const ta = a.publishedAt || a.receivedAt;
      const tb = b.publishedAt || b.receivedAt;
      return ta < tb ? 1 : -1;
    });
}

function renderSources(): void {
  if (!sources.length) {
    sourcesList.innerHTML = `<li class="muted">${t('noSources')}</li>`;
    return;
  }
  sourcesList.innerHTML = sources
    .map(
      (s) => `
      <li data-source-id="${s.id}">
        <div class="source-meta">
          <div class="source-title">${escapeHtml(s.title)}</div>
          <div class="source-url">${escapeHtml(s.url)}</div>
        </div>
        <button type="button" class="btn tiny secondary" data-action="remove-source">${t('removeSource')}</button>
      </li>`
    )
    .join('');
}

function renderPings(): void {
  const list = visiblePings();
  emptyState.hidden = list.length > 0;
  pingList.hidden = list.length === 0;
  if (!list.length) {
    pingList.innerHTML = '';
    return;
  }
  pingList.innerHTML = list
    .map((p) => {
      const when = relativeTime(p.publishedAt || p.receivedAt);
      return `
      <li class="${p.read ? 'read' : ''}" data-ping-id="${p.id}">
        <div class="ping-top">
          <span>${escapeHtml(p.sourceTitle)} · ${escapeHtml(p.category)}</span>
          <span>${escapeHtml(when)}${p.read ? '' : ` · ${t('unreadBadge')}`}</span>
        </div>
        <p class="ping-title">${escapeHtml(p.title)}</p>
        <div class="ping-actions">
          <button type="button" class="btn tiny primary" data-action="open" ${p.url ? '' : 'disabled'}>${t('open')}</button>
          <button type="button" class="btn tiny secondary" data-action="toggle-read">${p.read ? t('markUnread') : t('markRead')}</button>
        </div>
      </li>`;
    })
    .join('');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderAll(): void {
  renderSources();
  renderPings();
  applyStaticTranslations();
  versionStrip.textContent = `v${APP_VERSION}`;
}

async function reloadState(): Promise<void> {
  sources = await loadSources();
  pings = await loadPings();
  renderAll();
}

async function refreshAll(): Promise<void> {
  if (busy) return;
  clearError();
  if (!sources.length) {
    setStatus(t('noSources'));
    return;
  }
  busy = true;
  refreshBtn.disabled = true;
  refreshBtn.textContent = t('refreshing');
  try {
    const batches: PingItem[] = [];
    for (const source of sources) {
      const ok = await ensureFeedPermission(source.url);
      if (!ok) {
        showError(t('errorPermission'));
        continue;
      }
      try {
        const items = await refreshSource(source);
        batches.push(...items);
      } catch (e) {
        console.warn('[My Pings] refresh source', source.url, e);
        showError(`${t('errorFeed')} (${source.title})`);
      }
    }
    if (batches.length) {
      pings = await mergePings(batches);
    }
    setStatus(`${t('lastRefresh')}: ${new Date().toLocaleTimeString()}`);
    renderAll();
  } finally {
    busy = false;
    refreshBtn.disabled = false;
    refreshBtn.textContent = t('refresh');
  }
}

async function addFeed(): Promise<void> {
  clearError();
  const url = feedUrlInput.value.trim();
  if (!url) {
    showError(t('errorFeed'));
    return;
  }
  const category = (feedCategory.value === 'custom' ? 'custom' : 'news') as PingSource['category'];
  const ok = await ensureFeedPermission(url);
  if (!ok) {
    showError(t('errorPermission'));
    return;
  }
  confirmAddBtn.disabled = true;
  try {
    const { source, pings: fresh } = await probeAndBuildSource(url, category);
    if (sources.some((s) => s.url === source.url)) {
      showError(t('errorFeed'));
      return;
    }
    sources = [...sources, source];
    await saveSources(sources);
    pings = await mergePings(fresh);
    feedUrlInput.value = '';
    addPanel.hidden = true;
    setStatus(t('addedOk'));
    renderAll();
  } catch (e) {
    console.warn('[My Pings] add feed', e);
    showError(t('errorFeed'));
  } finally {
    confirmAddBtn.disabled = false;
  }
}

function bindTabs(): void {
  document.querySelectorAll<HTMLButtonElement>('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = (btn.dataset.tab || 'all') as PingCategory;
      activeTab = tab;
      document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderPings();
    });
  });
}

sourcesList.addEventListener('click', (ev) => {
  const btn = (ev.target as HTMLElement).closest('button[data-action="remove-source"]');
  if (!btn) return;
  const li = btn.closest('li[data-source-id]') as HTMLElement | null;
  const id = li?.dataset.sourceId;
  if (!id) return;
  void (async () => {
    const next = await removeSourceAndPings(id);
    sources = next.sources;
    pings = next.pings;
    renderAll();
  })();
});

pingList.addEventListener('click', (ev) => {
  const target = ev.target as HTMLElement;
  const btn = target.closest('button[data-action]') as HTMLButtonElement | null;
  if (!btn) return;
  const li = btn.closest('li[data-ping-id]') as HTMLElement | null;
  const id = li?.dataset.pingId;
  if (!id) return;
  const ping = pings.find((p) => p.id === id);
  if (!ping) return;

  if (btn.dataset.action === 'open' && ping.url) {
    void chrome.tabs.create({ url: ping.url, active: true });
    void markPingRead(id, true).then((next) => {
      pings = next;
      renderPings();
    });
    return;
  }
  if (btn.dataset.action === 'toggle-read') {
    void markPingRead(id, !ping.read).then((next) => {
      pings = next;
      renderPings();
    });
  }
});

refreshBtn.addEventListener('click', () => {
  void refreshAll();
});

addSourceBtn.addEventListener('click', () => {
  addPanel.hidden = !addPanel.hidden;
  clearError();
});

cancelAddBtn.addEventListener('click', () => {
  addPanel.hidden = true;
  clearError();
});

confirmAddBtn.addEventListener('click', () => {
  void addFeed();
});

localeSelect.addEventListener('change', () => {
  void setLocale(localeSelect.value as Locale).then(() => renderAll());
});

privacyLink.addEventListener('click', (e) => {
  e.preventDefault();
  window.open(chrome.runtime.getURL('privacy.html'), '_blank', 'noopener,noreferrer');
});

bindTabs();

void (async () => {
  const locale = await initI18n();
  localeSelect.value = locale;
  applyStaticTranslations();
  versionStrip.textContent = `v${APP_VERSION}`;
  await reloadState();
})();
