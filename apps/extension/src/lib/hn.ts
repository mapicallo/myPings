import type { PingItem, PingSource } from './types.js';

const ALGOLIA = 'https://hn.algolia.com/api/v1';

/** Preset tags: front_page | newest | show_hn | ask_hn */
const PRESETS: Record<string, string> = {
  front_page: 'front_page',
  newest: 'story',
  show_hn: 'show_hn',
  ask_hn: 'ask_hn',
};

interface HnHit {
  objectID: string;
  title: string;
  url?: string;
  story_url?: string;
  created_at_i: number;
  author: string;
  points?: number;
  num_comments?: number;
}

export function hnTitleFromInput(input: string): string {
  const tag = normaliseTag(input);
  const labels: Record<string, string> = {
    front_page: 'HN Front Page',
    story: 'HN Newest',
    show_hn: 'HN Show HN',
    ask_hn: 'HN Ask HN',
  };
  return labels[tag] ?? `HN (${tag})`;
}

function normaliseTag(input: string): string {
  const raw = input.trim().toLowerCase().replace(/^hn[:\s]*/i, '');
  return PRESETS[raw] ?? (raw || 'front_page');
}

export async function refreshHn(source: PingSource): Promise<PingItem[]> {
  const tag = normaliseTag(source.url);
  const params = new URLSearchParams({ tags: tag, hitsPerPage: '30' });
  const res = await fetch(`${ALGOLIA}/search?${params}`);
  if (!res.ok) throw new Error(`HN API ${res.status}`);
  const data = (await res.json()) as { hits: HnHit[] };

  return (data.hits ?? []).map((hit) => {
    const url = hit.url || hit.story_url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
    const pts = hit.points != null ? ` (${hit.points} pts)` : '';
    return {
      id: `hn_${hit.objectID}`,
      sourceId: source.id,
      sourceTitle: source.title,
      category: source.category,
      title: `${hit.title}${pts}`,
      url,
      publishedAt: new Date(hit.created_at_i * 1000).toISOString(),
      receivedAt: new Date().toISOString(),
      read: false,
    };
  });
}
