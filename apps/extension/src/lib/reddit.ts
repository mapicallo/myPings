import type { PingItem, PingSource } from './types.js';

const UA = 'MyPings/0.3.0 (Chrome Extension; +https://github.com/mapicallo/myPings)';

interface RedditPost {
  data: {
    id: string;
    title: string;
    permalink: string;
    url: string;
    created_utc: number;
    subreddit: string;
    score: number;
    num_comments: number;
  };
}

export function redditSubFromInput(input: string): string {
  const raw = input.trim();
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://www.reddit.com/r/${raw}`);
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('r');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
  } catch {
    /* plain subreddit name */
  }
  return raw.replace(/^r\//i, '').split('/')[0];
}

export function redditTitleFromInput(input: string): string {
  return `r/${redditSubFromInput(input)}`;
}

export async function refreshReddit(source: PingSource): Promise<PingItem[]> {
  const sub = redditSubFromInput(source.url);
  const apiUrl = `https://www.reddit.com/r/${encodeURIComponent(sub)}/new.json?limit=25`;
  const res = await fetch(apiUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`Reddit API ${res.status}`);
  const data = (await res.json()) as { data: { children: RedditPost[] } };

  return (data.data?.children ?? []).map((child) => {
    const p = child.data;
    const link = p.url.startsWith('http') ? p.url : `https://www.reddit.com${p.permalink}`;
    return {
      id: `reddit_${p.id}`,
      sourceId: source.id,
      sourceTitle: source.title,
      category: source.category,
      title: `${p.title} (${p.score}↑ · ${p.num_comments}💬)`,
      url: link,
      publishedAt: new Date(p.created_utc * 1000).toISOString(),
      receivedAt: new Date().toISOString(),
      read: false,
    };
  });
}
