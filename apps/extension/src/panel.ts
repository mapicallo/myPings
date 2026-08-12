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
import { refreshGithub } from './lib/github.js';
import { refreshIcs } from './lib/ics.js';
import {
  isSourceSilenced,
  loadPings,
  loadSources,
  markPingRead,
  mergePings,
  newId,
  removeSourceAndPings,
  saveSources,
  silenceSource,
  unsilenceSource,
} from './lib/storage.js';
import { APP_VERSION, type PingCategory, type PingItem, type PingSource, type SourceType } from './lib/types.js';

const localeSelect = document.getElementById('locale-select') as HTMLSelectElement;
const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;
const addSourceBtn = document.getElementById('add-source-btn') as HTMLButtonElement;
const addPanel = document.getElementById('add-panel')!;
const confirmAddBtn = document.getElementById('confirm-add-btn') as HTMLButtonElement;
const cancelAddBtn = document.getElementById('cancel-add-btn') as HTMLButtonElement;
const feedUrlInput = document.getElementById('feed-url') as HTMLInputElement;
const feedCategory = document.getElementById('feed-category') as HTMLSelectElement;
const sourceTypeSelect = document.getElementById('source-type') as HTMLSelectElement;
const fieldFeedUrl = document.getElementById('field-feed-url')!;
const fieldGhToken = document.getElementById('field-gh-token')!;
const ghTokenInput = document.getElementById('gh-token') as HTMLInputElement;
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
  if (!msg) { statusLine.hidden = true; statusLine.textContent = ''; return; }
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
  const filtered = activeTab === 'all' ? pings : pings.filter((p) => p.category === activeTab);
  return filtered.slice().sort((a, b) => {
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
    .map((s) => {
      const silenced = isSourceSilenced(s);
      const silenceBadge = silenced
        ? `<span class="badge muted">${t('silencedUntil')} ${new Date(s.silencedUntil!).toLocaleTimeString()}</span>`
        : '';
      const silenceBtn = silenced
        ? `<button type="button" class="btn tiny ghost" data-action="unsilence">${t('unsilenceSource')}</button>`
        : `<button type="button" class="btn tiny ghost" data-action="silence" data-hours="1">${t('silence1h')}</button>
           <button type="button" class="btn tiny ghost" data-action="silence" data-hours="8">${t('silence8h')}</button>
           <button type="button" class="btn tiny ghost" data-action="silence" data-hours="24">${t('silence24h')}</button>`;
      return `
      <li data-source-id="${s.id}">
        <div class="source-meta">
          <div class="source-title">${escapeHtml(s.title)} <span class="badge">${s.type}</span> ${silenceBadge}</div>
          <div class="source-url">${escapeHtml(s.url)}</div>
        </div>
        <div class="source-actions">
          ${silenceBtn}
          <button type="button" class="btn tiny secondary" data-action="remove-source">${t('removeSource')}</button>
        </div>
      </li>`;
    })
    .join('');
}

function renderPings(): void {
  const list = visiblePings();
  emptyState.hidden = list.length > 0;
  pingList.hidden = list.length === 0;
  if (!list.length) { pingList.innerHTML = ''; return; }
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
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
  if (!sources.length) { setStatus(t('noSources')); return; }
  busy = true;
  refreshBtn.disabled = true;
  refreshBtn.textContent = t('refreshing');
  try {
    const batches: PingItem[] = [];
    for (const source of sources) {
      if (isSourceSilenced(source)) continue;
      try {
        if (source.type === 'rss') {
          const ok = await ensureFeedPermission(source.url);
          if (!ok) { showError(t('errorPermission')); continue; }
          batches.push(...await refreshSource(source));
        } else if (source.type === 'github') {
          batches.push(...await refreshGithub(source));
        } else if (source.type === 'ics') {
          const ok = await ensureFeedPermission(source.url);
          if (!ok) { showError(t('errorPermission')); continue; }
          batches.push(...await refreshIcs(source));
        }
      } catch (e) {
        console.warn('[My Pings] refresh source', source.url, e);
        const errKey = source.type === 'github' ? 'errorGithub' : source.type === 'ics' ? 'errorIcs' : 'errorFeed';
        showError(`${t(errKey)} (${source.title})`);
      }
    }
    if (batches.length) pings = await mergePings(batches);
    setStatus(`${t('lastRefresh')}: ${new Date().toLocaleTimeString()}`);
    renderAll();
  } finally {
    busy = false;
    refreshBtn.disabled = false;
    refreshBtn.textContent = t('refresh');
  }
}

function syncAddForm(): void {
  const st = sourceTypeSelect.value as SourceType;
  fieldGhToken.hidden = st !== 'github';
  if (st === 'github') {
    feedUrlInput.placeholder = t('ghUrlPlaceholder');
    feedCategory.value = 'dev';
  } else if (st === 'ics') {
    feedUrlInput.placeholder = t('icsUrlPlaceholder');
    feedCategory.value = 'calendar';
  } else {
    feedUrlInput.placeholder = t('feedUrlPlaceholder');
  }
}

async function addFeed(): Promise<void> {
  clearError();
  const url = feedUrlInput.value.trim();
  if (!url) { showError(t('errorFeed')); return; }
  const st = sourceTypeSelect.value as SourceType;
  const category = feedCategory.value as PingSource['category'];
  confirmAddBtn.disabled = true;
  try {
    if (st === 'rss') {
      const ok = await ensureFeedPermission(url);
      if (!ok) { showError(t('errorPermission')); return; }
      const { source, pings: fresh } = await probeAndBuildSource(url, category);
      if (sources.some((s) => s.url === source.url)) { showError(t('errorFeed')); return; }
      sources = [...sources, source];
      await saveSources(sources);
      pings = await mergePings(fresh);
    } else if (st === 'github') {
      const source: PingSource = {
        id: newId(), type: 'github', url, title: ghTitleFromUrl(url),
        category: category === 'all' ? 'dev' : category,
        createdAt: new Date().toISOString(),
        token: ghTokenInput.value.trim() || undefined,
        ghEvents: ['issues', 'pulls', 'releases', 'mentions'],
      };
      if (sources.some((s) => s.url === source.url)) { showError(t('errorGithub')); return; }
      const fresh = await refreshGithub(source);
      sources = [...sources, source];
      await saveSources(sources);
      pings = await mergePings(fresh);
    } else if (st === 'ics') {
      const ok = await ensureFeedPermission(url);
      if (!ok) { showError(t('errorPermission')); return; }
      const source: PingSource = {
        id: newId(), type: 'ics', url, title: icsTitleFromUrl(url),
        category: category === 'all' ? 'calendar' : category,
        createdAt: new Date().toISOString(),
      };
      if (sources.some((s) => s.url === source.url)) { showError(t('errorIcs')); return; }
      const fresh = await refreshIcs(source);
      sources = [...sources, source];
      await saveSources(sources);
      pings = await mergePings(fresh);
    }
    feedUrlInput.value = '';
    ghTokenInput.value = '';
    addPanel.hidden = true;
    setStatus(t('addedOk'));
    renderAll();
  } catch (e) {
    console.warn('[My Pings] add source', e);
    showError(t('errorGeneric'));
  } finally {
    confirmAddBtn.disabled = false;
  }
}

function ghTitleFromUrl(url: string): string {
  try {
    const parts = new URL(url).pathname.split('/').filter(Boolean);
    if (parts[0] === 'repos' && parts.length >= 3) return `${parts[1]}/${parts[2]}`;
    if (parts[0] === 'users' && parts.length >= 2) return `@${parts[1]}`;
  } catch { /* ignore */ }
  return 'GitHub';
}

function icsTitleFromUrl(url: string): string {
  try { return new URL(url).hostname; } catch { return 'Calendar'; }
}

function bindTabs(): void {
  document.querySelectorAll<HTMLButtonElement>('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = (btn.dataset.tab || 'all') as PingCategory;
      document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderPings();
    });
  });
}

sourcesList.addEventListener('click', (ev) => {
  const btn = (ev.target as HTMLElement).closest('button[data-action]') as HTMLButtonElement | null;
  if (!btn) return;
  const li = btn.closest('li[data-source-id]') as HTMLElement | null;
  const id = li?.dataset.sourceId;
  if (!id) return;
  const action = btn.dataset.action;

  if (action === 'remove-source') {
    void (async () => {
      const next = await removeSourceAndPings(id);
      sources = next.sources;
      pings = next.pings;
      renderAll();
    })();
  } else if (action === 'silence') {
    const hours = +(btn.dataset.hours ?? 1);
    void silenceSource(id, hours).then((s) => { sources = s; renderAll(); });
  } else if (action === 'unsilence') {
    void unsilenceSource(id).then((s) => { sources = s; renderAll(); });
  }
});

pingList.addEventListener('click', (ev) => {
  const btn = (ev.target as HTMLElement).closest('button[data-action]') as HTMLButtonElement | null;
  if (!btn) return;
  const li = btn.closest('li[data-ping-id]') as HTMLElement | null;
  const id = li?.dataset.pingId;
  if (!id) return;
  const ping = pings.find((p) => p.id === id);
  if (!ping) return;

  if (btn.dataset.action === 'open' && ping.url) {
    void chrome.tabs.create({ url: ping.url, active: true });
    void markPingRead(id, true).then((next) => { pings = next; renderPings(); });
    return;
  }
  if (btn.dataset.action === 'toggle-read') {
    void markPingRead(id, !ping.read).then((next) => { pings = next; renderPings(); });
  }
});

refreshBtn.addEventListener('click', () => void refreshAll());
addSourceBtn.addEventListener('click', () => { addPanel.hidden = !addPanel.hidden; clearError(); syncAddForm(); });
cancelAddBtn.addEventListener('click', () => { addPanel.hidden = true; clearError(); });
confirmAddBtn.addEventListener('click', () => void addFeed());
sourceTypeSelect.addEventListener('change', syncAddForm);

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
