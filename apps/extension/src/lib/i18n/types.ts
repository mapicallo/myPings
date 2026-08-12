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
  | 'tabEmail'
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
  | 'sourceTypeHn'
  | 'sourceTypeReddit'
  | 'sourceTypeGmail'
  | 'ghUrlPlaceholder'
  | 'ghTokenLabel'
  | 'ghTokenPlaceholder'
  | 'icsUrlPlaceholder'
  | 'hnUrlPlaceholder'
  | 'redditUrlPlaceholder'
  | 'gmailConnect'
  | 'gmailConnected'
  | 'priorityKeywordsLabel'
  | 'priorityKeywordsPlaceholder'
  | 'priorityBadge'
  | 'categoryLabel'
  | 'catNews'
  | 'catDev'
  | 'catCalendar'
  | 'catEmail'
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
  | 'errorHn'
  | 'errorReddit'
  | 'errorGmail'
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
