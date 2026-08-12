import { newId } from './storage.js';
import { APP_VERSION, type PingSource, type SourceType } from './types.js';

export const TRANSFER_FORMAT = 'my-pings-sources';
export const TRANSFER_VERSION = 1;

export type SourceExportEntry = {
  type: SourceType;
  url: string;
  title: string;
  category: PingSource['category'];
  ghEvents?: PingSource['ghEvents'];
  priorityKeywords?: string[];
};

export type SourceExportBundle = {
  format: typeof TRANSFER_FORMAT;
  version: number;
  exportedAt: string;
  appVersion: string;
  sources: SourceExportEntry[];
};

const VALID_TYPES: SourceType[] = ['rss', 'github', 'ics', 'hn', 'reddit', 'gmail'];

function sourceDedupeKey(s: Pick<PingSource, 'type' | 'url'>): string {
  if (s.type === 'gmail') return 'gmail';
  return `${s.type}|${s.url.trim().toLowerCase()}`;
}

function toExportEntry(s: PingSource): SourceExportEntry {
  const entry: SourceExportEntry = {
    type: s.type,
    url: s.url,
    title: s.title,
    category: s.category,
  };
  if (s.ghEvents?.length) entry.ghEvents = s.ghEvents;
  if (s.priorityKeywords?.length) entry.priorityKeywords = s.priorityKeywords;
  return entry;
}

export function buildExportBundle(sources: PingSource[]): SourceExportBundle {
  return {
    format: TRANSFER_FORMAT,
    version: TRANSFER_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    sources: sources.map(toExportEntry),
  };
}

export function downloadSourcesExport(sources: PingSource[]): void {
  const bundle = buildExportBundle(sources);
  const date = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `my-pings-sources-${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function isValidCategory(v: unknown): v is PingSource['category'] {
  return v === 'news' || v === 'dev' || v === 'calendar' || v === 'email' || v === 'custom';
}

function parseEntry(raw: unknown): SourceExportEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const type = o.type;
  if (typeof type !== 'string' || !VALID_TYPES.includes(type as SourceType)) return null;
  if (typeof o.title !== 'string' || !o.title.trim()) return null;
  if (!isValidCategory(o.category)) return null;

  const url = typeof o.url === 'string' ? o.url.trim() : type === 'gmail' ? 'gmail' : '';
  if (type !== 'gmail' && !url) return null;

  const entry: SourceExportEntry = {
    type: type as SourceType,
    url: type === 'gmail' ? 'gmail' : url,
    title: o.title.trim(),
    category: o.category,
  };

  if (Array.isArray(o.ghEvents)) {
    entry.ghEvents = o.ghEvents.filter((e): e is NonNullable<PingSource['ghEvents']>[number] =>
      typeof e === 'string'
    ) as PingSource['ghEvents'];
  }
  if (Array.isArray(o.priorityKeywords)) {
    entry.priorityKeywords = o.priorityKeywords
      .filter((k): k is string => typeof k === 'string' && k.trim().length > 0)
      .map((k) => k.trim());
  }
  return entry;
}

function extractEntries(parsed: unknown): SourceExportEntry[] | null {
  if (Array.isArray(parsed)) {
    const entries = parsed.map(parseEntry).filter((e): e is SourceExportEntry => e !== null);
    return entries.length ? entries : null;
  }
  if (!parsed || typeof parsed !== 'object') return null;
  const o = parsed as Record<string, unknown>;
  if (o.format !== TRANSFER_FORMAT || !Array.isArray(o.sources)) return null;
  const entries = o.sources.map(parseEntry).filter((e): e is SourceExportEntry => e !== null);
  return entries.length ? entries : null;
}

export function entryToSource(entry: SourceExportEntry): PingSource {
  return {
    id: newId(),
    type: entry.type,
    url: entry.url,
    title: entry.title,
    category: entry.category,
    createdAt: new Date().toISOString(),
    ghEvents: entry.ghEvents,
    priorityKeywords: entry.priorityKeywords,
    silencedUntil: null,
  };
}

export type ImportResult = {
  added: PingSource[];
  skipped: number;
};

/** Merge imported sources; skip duplicates already present. Tokens are never imported. */
export function mergeImportedSources(existing: PingSource[], jsonText: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('INVALID_JSON');
  }

  const entries = extractEntries(parsed);
  if (!entries?.length) throw new Error('INVALID_FORMAT');

  const known = new Set(existing.map(sourceDedupeKey));
  const added: PingSource[] = [];
  let skipped = 0;

  for (const entry of entries) {
    const key = sourceDedupeKey(entry);
    if (known.has(key)) {
      skipped++;
      continue;
    }
    const source = entryToSource(entry);
    added.push(source);
    known.add(key);
  }

  return { added, skipped };
}
