import { newId } from './storage.js';
import type { PingItem, PingSource } from './types.js';

export async function ensureFeedPermission(feedUrl: string): Promise<boolean> {
  let originPattern: string;
  try {
    const u = new URL(feedUrl);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    originPattern = `${u.protocol}//${u.host}/*`;
  } catch {
    return false;
  }

  try {
    if (await chrome.permissions.contains({ origins: [originPattern] })) return true;
    return await chrome.permissions.request({ origins: [originPattern] });
  } catch (e) {
    console.warn('[My Pings] permission', e);
    return false;
  }
}

function textOf(el: Element | null): string {
  return (el?.textContent ?? '').trim();
}

function firstLink(el: Element | null): string {
  if (!el) return '';
  const atom = el.getAttribute('href');
  if (atom) return atom.trim();
  return textOf(el);
}

function stablePingId(sourceId: string, link: string, title: string, published: string | null): string {
  const key = `${sourceId}|${link || title}|${published ?? ''}`;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  return `rss_${(h >>> 0).toString(16)}`;
}

function parseRssOrAtom(xml: string, source: PingSource): PingItem[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Invalid feed XML');
  }

  const now = new Date().toISOString();
  const items: PingItem[] = [];

  const rssItems = [...doc.querySelectorAll('channel > item')];
  if (rssItems.length) {
    for (const item of rssItems.slice(0, 40)) {
      const title = textOf(item.querySelector('title')) || '(no title)';
      const link = textOf(item.querySelector('link')) || firstLink(item.querySelector('guid'));
      const pub =
        textOf(item.querySelector('pubDate')) ||
        textOf(item.querySelector('dc\\:date')) ||
        null;
      let publishedAt: string | null = null;
      if (pub) {
        const d = new Date(pub);
        publishedAt = Number.isNaN(d.getTime()) ? pub : d.toISOString();
      }
      items.push({
        id: stablePingId(source.id, link, title, publishedAt),
        sourceId: source.id,
        sourceTitle: source.title,
        category: source.category,
        title,
        url: link,
        publishedAt,
        receivedAt: now,
        read: false,
      });
    }
    return items;
  }

  const entries = [...doc.querySelectorAll('entry')];
  for (const entry of entries.slice(0, 40)) {
    const title = textOf(entry.querySelector('title')) || '(no title)';
    const linkEl =
      entry.querySelector('link[rel="alternate"]') ||
      entry.querySelector('link[href]') ||
      entry.querySelector('link');
    const link = firstLink(linkEl);
    const pub =
      textOf(entry.querySelector('updated')) ||
      textOf(entry.querySelector('published')) ||
      null;
    let publishedAt: string | null = null;
    if (pub) {
      const d = new Date(pub);
      publishedAt = Number.isNaN(d.getTime()) ? pub : d.toISOString();
    }
    items.push({
      id: stablePingId(source.id, link, title, publishedAt),
      sourceId: source.id,
      sourceTitle: source.title,
      category: source.category,
      title,
      url: link,
      publishedAt,
      receivedAt: now,
      read: false,
    });
  }
  return items;
}

function feedTitleFromXml(xml: string, fallback: string): string {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const t =
    textOf(doc.querySelector('channel > title')) ||
    textOf(doc.querySelector('feed > title'));
  return t || fallback;
}

export async function fetchFeedXml(feedUrl: string): Promise<string> {
  const res = await fetch(feedUrl, {
    method: 'GET',
    headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export async function probeAndBuildSource(
  feedUrl: string,
  category: PingSource['category']
): Promise<{ source: PingSource; pings: PingItem[] }> {
  const trimmed = feedUrl.trim();
  const xml = await fetchFeedXml(trimmed);
  const host = (() => {
    try {
      return new URL(trimmed).hostname;
    } catch {
      return 'feed';
    }
  })();
  const title = feedTitleFromXml(xml, host);
  const source: PingSource = {
    id: newId(),
    type: 'rss',
    url: trimmed,
    title,
    category,
    createdAt: new Date().toISOString(),
  };
  const pings = parseRssOrAtom(xml, source);
  return { source, pings };
}

export async function refreshSource(source: PingSource): Promise<PingItem[]> {
  const xml = await fetchFeedXml(source.url);
  return parseRssOrAtom(xml, source);
}
