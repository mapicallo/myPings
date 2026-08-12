export type Locale = 'en' | 'es';

export type MessageKey =
  | 'appName'
  | 'tagline'
  | 'byAi4Context'
  | 'langLabel'
  | 'footerByPrefix'
  | 'footerSupport'
  | 'privacy'
  | 'helpOnDemand'
  | 'tabAll'
  | 'tabNews'
  | 'tabDev'
  | 'tabCalendar'
  | 'tabCustom'
  | 'refresh'
  | 'refreshing'
  | 'addSource'
  | 'sourcesTitle'
  | 'feedUrlLabel'
  | 'feedUrlPlaceholder'
  | 'sourceTypeLabel'
  | 'sourceTypeRss'
  | 'sourceTypeGithub'
  | 'sourceTypeIcs'
  | 'ghUrlPlaceholder'
  | 'ghTokenLabel'
  | 'ghTokenPlaceholder'
  | 'icsUrlPlaceholder'
  | 'categoryLabel'
  | 'catNews'
  | 'catDev'
  | 'catCalendar'
  | 'catCustom'
  | 'addFeed'
  | 'cancel'
  | 'emptyTitle'
  | 'emptyHint'
  | 'open'
  | 'markRead'
  | 'markUnread'
  | 'removeSource'
  | 'silenceSource'
  | 'unsilenceSource'
  | 'silence1h'
  | 'silence8h'
  | 'silence24h'
  | 'silencedUntil'
  | 'errorGeneric'
  | 'errorPermission'
  | 'errorFeed'
  | 'errorGithub'
  | 'errorIcs'
  | 'addedOk'
  | 'lastRefresh'
  | 'unreadBadge'
  | 'noSources';

export type Messages = Record<MessageKey, string>;

export const LOCALES: Locale[] = ['en', 'es'];

export function isLocale(v: unknown): v is Locale {
  return typeof v === 'string' && (LOCALES as string[]).includes(v);
}

export function detectLocaleFromNavigator(): Locale {
  const nav = (navigator.language ?? 'en').toLowerCase();
  if (nav.startsWith('es')) return 'es';
  return 'en';
}
