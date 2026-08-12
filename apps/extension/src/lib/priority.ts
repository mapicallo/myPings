import type { PingItem, PingSource } from './types.js';

/** Returns true if any keyword matches title (case-insensitive). */
export function matchesPriority(title: string, keywords: string[] | undefined): boolean {
  if (!keywords?.length) return false;
  const lower = title.toLowerCase();
  return keywords.some((kw) => kw.trim() && lower.includes(kw.trim().toLowerCase()));
}

/** Sort: high-priority unread first, then by date. */
export function sortWithPriority(items: PingItem[], sources: PingSource[]): PingItem[] {
  const kwBySource = new Map(sources.map((s) => [s.id, s.priorityKeywords ?? []]));

  return items.slice().sort((a, b) => {
    const aPri = matchesPriority(a.title, kwBySource.get(a.sourceId)) ? 1 : 0;
    const bPri = matchesPriority(b.title, kwBySource.get(b.sourceId)) ? 1 : 0;
    if (aPri !== bPri) return bPri - aPri;
    const ta = a.publishedAt || a.receivedAt;
    const tb = b.publishedAt || b.receivedAt;
    return ta < tb ? 1 : -1;
  });
}

export function isHighPriority(item: PingItem, sources: PingSource[]): boolean {
  const source = sources.find((s) => s.id === item.sourceId);
  return matchesPriority(item.title, source?.priorityKeywords);
}
