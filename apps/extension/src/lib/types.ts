export type PingCategory = 'all' | 'news' | 'custom';

export type SourceType = 'rss';

export type PingSource = {
  id: string;
  type: SourceType;
  url: string;
  title: string;
  category: Exclude<PingCategory, 'all'>;
  createdAt: string;
};

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

export const APP_VERSION = '0.1.0';
