export type PingCategory = 'all' | 'news' | 'dev' | 'calendar' | 'email' | 'custom';

export type SourceType = 'rss' | 'github' | 'ics' | 'hn' | 'reddit' | 'gmail';

export type PingSource = {
  id: string;
  type: SourceType;
  url: string;
  title: string;
  category: Exclude<PingCategory, 'all'>;
  createdAt: string;
  /** GitHub personal access token (stored locally). */
  token?: string;
  /** GitHub: event types to include. */
  ghEvents?: GithubEventFilter[];
  /** Keywords that mark matching pings as high priority. */
  priorityKeywords?: string[];
  /** ISO timestamp — source silenced until this time (null = active). */
  silencedUntil?: string | null;
};

export type GithubEventFilter = 'issues' | 'pulls' | 'releases' | 'mentions';

export type PingItem = {
  id: string;
  sourceId: string;
  sourceTitle: string;
  category: Exclude<PingCategory, 'all'>;
  title: string;
  url: string;
  publishedAt: string | null;
  receivedAt: string;
  read: boolean;
};

export const APP_VERSION = '0.3.0';
