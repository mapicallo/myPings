import {
  applyStaticTranslations,
  initI18n,
  setLocale,
  t,
  type Locale,
  type MessageKey,
} from './lib/i18n/index.js';
import { connectGmail } from './lib/gmail.js';
import { hnTitleFromInput } from './lib/hn.js';
import { isHighPriority, sortWithPriority } from './lib/priority.js';
import { errorKeyForType, PermissionError, refreshPingSource } from './lib/refresh.js';
import { redditTitleFromInput } from './lib/reddit.js';
import { ensureFeedPermission, probeAndBuildSource } from './lib/rss.js';
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

type Screen = 'inbox' | 'sources';

const localeSelect = document.getElementById('locale-select') as HTMLSelectElement;
const viewInbox = document.getElementById('view-inbox')!;
const viewSources = document.getElementById('view-sources')!;
const refreshBtn = document.getElementById('refresh-btn') as HTMLButtonElement;
const confirmAddBtn = document.getElementById('confirm-add-btn') as HTMLButtonElement;
const feedUrlInput = document.getElementById('feed-url') as HTMLInputElement;
const feedCategory = document.getElementById('feed-category') as HTMLSelectElement;
const sourceTypeSelect = document.getElementById('source-type') as HTMLSelectElement;
const fieldFeedUrl = document.getElementById('field-feed-url')!;
const fieldGhToken = document.getElementById('field-gh-token')!;
const ghTokenInput = document.getElementById('gh-token') as HTMLInputElement;
const priorityKeywordsInput = document.getElementById('priority-keywords') as HTMLInputElement;
const sourceTypeGuide = document.getElementById('source-type-guide')!;
const fieldUrlHint = document.getElementById('field-url-hint')!;
const formError = document.getElementById('form-error')!;
const statusLine = document.getElementById('status-line')!;
const sourcesList = document.getElementById('sources-list')!;
const pingList = document.getElementById('ping-list')!;
const emptyState = document.getElementById('empty-state')!;
const emptyGoSources = document.getElementById('empty-go-sources') as HTMLButtonElement;
const versionStrip = document.getElementById('version-strip')!;
const privacyLink = document.getElementById('privacy-link') as HTMLAnchorElement;

const GUIDE_KEYS: Record<SourceType, MessageKey> = {
  rss: 'sourceGuideRss',
  github: 'sourceGuideGithub',
  ics: 'sourceGuideIcs',
  hn: 'sourceGuideHn',
  reddit: 'sourceGuideReddit',
  gmail: 'sourceGuideGmail',
};

const URL_HINT_KEYS: Partial<Record<SourceType, MessageKey>> = {
  rss: 'fieldUrlHintRss',
  github: 'fieldUrlHintGithub',
  ics: 'fieldUrlHintIcs',
  hn: 'fieldUrlHintHn',
  reddit: 'fieldUrlHintReddit',
};

let sources: PingSource[] = [];
let pings: PingItem[] = [];
let activeTab: PingCategory = 'all';
let activeScreen: Screen = 'inbox';
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

function parseKeywords(raw: string): string[] | undefined {
  const list = raw.split(',').map((k) => k.trim()).filter(Boolean);
  return list.length ? list : undefined;
}

function visiblePings(): PingItem[] {
  const filtered = activeTab === 'all' ? pings : pings.filter((p) => p.category === activeTab);
  return sortWithPriority(filtered, sources);
}

function setScreen(screen: Screen): void {
  activeScreen = screen;
  viewInbox.classList.toggle('view-active', screen === 'inbox');
  viewInbox.hidden = screen !== 'inbox';
  viewSources.classList.toggle('view-active', screen === 'sources');
  viewSources.hidden = screen !== 'sources';

  document.querySelectorAll<HTMLButtonElement>('.nav-primary-btn').forEach((btn) => {
    const isActive = btn.dataset.screen === screen;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  if (screen === 'sources') clearError();
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
      const kwBadge = s.priorityKeywords?.length
        ? `<span class="badge">⚡ ${escapeHtml(s.priorityKeywords.join(', '))}</span>`
        : '';
      const silenceBtn = silenced
        ? `<button type="button" class="btn tiny ghost" data-action="unsilence">${t('unsilenceSource')}</button>`
        : `<button type="button" class="btn tiny ghost" data-action="silence" data-hours="1">${t('silence1h')}</button>
           <button type="button" class="btn tiny ghost" data-action="silence" data-hours="8">${t('silence8h')}</button>
           <button type="button" class="btn tiny ghost" data-action="silence" data-hours="24">${t('silence24h')}</button>`;
      return `
      <li data-source-id="${s.id}">
        <div class="source-meta">
          <div class="source-title">${escapeHtml(s.title)} <span class="badge">${s.type}</span> ${kwBadge} ${silenceBadge}</div>
          <div class="source-url">${escapeHtml(s.url || s.type)}</div>
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
      const pri = isHighPriority(p, sources) ? ` · ${t('priorityBadge')}` : '';
      return `
      <li class="${p.read ? 'read' : ''}${isHighPriority(p, sources) ? ' priority' : ''}" data-ping-id="${p.id}">
        <div class="ping-top">
          <span>${escapeHtml(p.sourceTitle)} · ${escapeHtml(p.category)}</span>
          <span>${escapeHtml(when)}${p.read ? '' : ` · ${t('unreadBadge')}`}${pri}</span>
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

function syncAddForm(): void {
  const st = sourceTypeSelect.value as SourceType;
  fieldGhToken.hidden = st !== 'github';
  fieldFeedUrl.hidden = st === 'gmail';

  sourceTypeGuide.textContent = t(GUIDE_KEYS[st]);
  const hintKey = URL_HINT_KEYS[st];
  fieldUrlHint.textContent = hintKey ? t(hintKey) : '';

  if (st === 'github') {
    feedUrlInput.placeholder = t('ghUrlPlaceholder');
    feedCategory.value = 'dev';
  } else if (st === 'ics') {
    feedUrlInput.placeholder = t('icsUrlPlaceholder');
    feedCategory.value = 'calendar';
  } else if (st === 'hn') {
    feedUrlInput.placeholder = t('hnUrlPlaceholder');
    if (!feedUrlInput.value) feedUrlInput.value = 'front_page';
    feedCategory.value = 'news';
  } else if (st === 'reddit') {
    feedUrlInput.placeholder = t('redditUrlPlaceholder');
    feedCategory.value = 'news';
  } else if (st === 'gmail') {
    feedCategory.value = 'email';
  } else {
    feedUrlInput.placeholder = t('feedUrlPlaceholder');
  }
}

function renderAll(): void {
  renderSources();
  renderPings();
  syncAddForm();
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
    setScreen('sources');
    return;
  }
  busy = true;
  refreshBtn.disabled = true;
  refreshBtn.textContent = t('refreshing');
  try {
    const batches: PingItem[] = [];
    for (const source of sources) {
      if (isSourceSilenced(source)) continue;
      try {
        batches.push(...await refreshPingSource(source));
      } catch (e) {
        console.warn('[My Pings] refresh source', source.url, e);
        if (e instanceof PermissionError) {
          showError(t('errorPermission'));
        } else {
          showError(`${t(errorKeyForType(source.type))} (${source.title})`);
        }
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

async function addFeed(): Promise<void> {
  clearError();
  const st = sourceTypeSelect.value as SourceType;
  const url = feedUrlInput.value.trim();
  const category = feedCategory.value as PingSource['category'];
  const priorityKeywords = parseKeywords(priorityKeywordsInput.value);

  if (st !== 'gmail' && !url) { showError(t('errorFeed')); return; }

  confirmAddBtn.disabled = true;
  try {
    let source: PingSource;
    let fresh: PingItem[] = [];

    if (st === 'rss') {
      const ok = await ensureFeedPermission(url);
      if (!ok) { showError(t('errorPermission')); return; }
      const built = await probeAndBuildSource(url, category);
      source = { ...built.source, priorityKeywords };
      fresh = built.pings;
    } else if (st === 'github') {
      source = {
        id: newId(), type: 'github', url, title: ghTitleFromUrl(url),
        category,
        createdAt: new Date().toISOString(),
        token: ghTokenInput.value.trim() || undefined,
        ghEvents: ['issues', 'pulls', 'releases', 'mentions'],
        priorityKeywords,
      };
      fresh = await refreshPingSource(source);
    } else if (st === 'ics') {
      const ok = await ensureFeedPermission(url);
      if (!ok) { showError(t('errorPermission')); return; }
      source = {
        id: newId(), type: 'ics', url, title: icsTitleFromUrl(url),
        category,
        createdAt: new Date().toISOString(),
        priorityKeywords,
      };
      fresh = await refreshPingSource(source);
    } else if (st === 'hn') {
      const tag = url || 'front_page';
      const ok = await ensureFeedPermission('https://hn.algolia.com/');
      if (!ok) { showError(t('errorPermission')); return; }
      source = {
        id: newId(), type: 'hn', url: tag, title: hnTitleFromInput(tag),
        category,
        createdAt: new Date().toISOString(),
        priorityKeywords,
      };
      fresh = await refreshPingSource(source);
    } else if (st === 'reddit') {
      const ok = await ensureFeedPermission('https://www.reddit.com/');
      if (!ok) { showError(t('errorPermission')); return; }
      source = {
        id: newId(), type: 'reddit', url, title: redditTitleFromInput(url),
        category,
        createdAt: new Date().toISOString(),
        priorityKeywords,
      };
      fresh = await refreshPingSource(source);
    } else if (st === 'gmail') {
      await connectGmail();
      source = {
        id: newId(), type: 'gmail', url: 'gmail', title: 'Gmail',
        category: 'email',
        createdAt: new Date().toISOString(),
        priorityKeywords,
      };
      if (sources.some((s) => s.type === 'gmail')) { showError(t('errorGmail')); return; }
      fresh = await refreshPingSource(source);
    } else {
      showError(t('errorGeneric'));
      return;
    }

    const dedupeKey = source.type === 'gmail' ? 'gmail' : source.url;
    if (sources.some((s) => (s.type === 'gmail' ? 'gmail' : s.url) === dedupeKey)) {
      showError(t(errorKeyForType(source.type)));
      return;
    }

    sources = [...sources, source];
    await saveSources(sources);
    pings = await mergePings(fresh);
    feedUrlInput.value = '';
    ghTokenInput.value = '';
    priorityKeywordsInput.value = '';
    setStatus(t('addedGoInbox'));
    setScreen('inbox');
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

function bindCategoryTabs(): void {
  document.querySelectorAll<HTMLButtonElement>('.category-tabs .tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeTab = (btn.dataset.tab || 'all') as PingCategory;
      document.querySelectorAll('.category-tabs .tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderPings();
    });
  });
}

function bindPrimaryNav(): void {
  document.querySelectorAll<HTMLButtonElement>('.nav-primary-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const screen = (btn.dataset.screen || 'inbox') as Screen;
      setScreen(screen);
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
confirmAddBtn.addEventListener('click', () => void addFeed());
sourceTypeSelect.addEventListener('change', syncAddForm);
emptyGoSources.addEventListener('click', () => setScreen('sources'));

localeSelect.addEventListener('change', () => {
  void setLocale(localeSelect.value as Locale).then(() => renderAll());
});

privacyLink.addEventListener('click', (e) => {
  e.preventDefault();
  window.open(chrome.runtime.getURL('privacy.html'), '_blank', 'noopener,noreferrer');
});

bindCategoryTabs();
bindPrimaryNav();

void (async () => {
  const locale = await initI18n();
  localeSelect.value = locale;
  setScreen('inbox');
  applyStaticTranslations();
  versionStrip.textContent = `v${APP_VERSION}`;
  await reloadState();
})();
