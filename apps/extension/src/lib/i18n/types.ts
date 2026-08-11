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
  | 'tabCustom'
  | 'refresh'
  | 'refreshing'
  | 'addSource'
  | 'sourcesTitle'
  | 'feedUrlLabel'
  | 'feedUrlPlaceholder'
  | 'categoryLabel'
  | 'catNews'
  | 'catCustom'
  | 'addFeed'
  | 'cancel'
  | 'emptyTitle'
  | 'emptyHint'
  | 'open'
  | 'markRead'
  | 'markUnread'
  | 'removeSource'
  | 'errorGeneric'
  | 'errorPermission'
  | 'errorFeed'
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
