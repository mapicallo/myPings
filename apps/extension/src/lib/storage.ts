import { storageGet, storageSet } from './platform.js';
import type { PingItem, PingSource } from './types.js';

const SOURCES_KEY = 'mp_sources';
const PINGS_KEY = 'mp_pings';
const MAX_PINGS = 400;

function uid(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function newId(): string {
  return uid();
}

export async function loadSources(): Promise<PingSource[]> {
  const data = await storageGet<Record<string, unknown>>(SOURCES_KEY);
  const raw = data[SOURCES_KEY];
  return Array.isArray(raw) ? (raw as PingSource[]) : [];
}

export async function saveSources(sources: PingSource[]): Promise<void> {
  await storageSet({ [SOURCES_KEY]: sources });
}

export async function loadPings(): Promise<PingItem[]> {
  const data = await storageGet<Record<string, unknown>>(PINGS_KEY);
  const raw = data[PINGS_KEY];
  return Array.isArray(raw) ? (raw as PingItem[]) : [];
}

export async function savePings(pings: PingItem[]): Promise<void> {
  const trimmed = pings
    .slice()
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
    .slice(0, MAX_PINGS);
  await storageSet({ [PINGS_KEY]: trimmed });
}

/** Merge new items by id; keep existing read flags. */
export async function mergePings(incoming: PingItem[]): Promise<PingItem[]> {
  const existing = await loadPings();
  const byId = new Map(existing.map((p) => [p.id, p]));
  for (const item of incoming) {
    const prev = byId.get(item.id);
    if (prev) {
      byId.set(item.id, { ...item, read: prev.read, receivedAt: prev.receivedAt });
    } else {
      byId.set(item.id, item);
    }
  }
  const merged = [...byId.values()];
  await savePings(merged);
  return merged;
}

export async function markPingRead(id: string, read = true): Promise<PingItem[]> {
  const pings = await loadPings();
  const next = pings.map((p) => (p.id === id ? { ...p, read } : p));
  await savePings(next);
  return next;
}

export async function silenceSource(sourceId: string, hours: number): Promise<PingSource[]> {
  const sources = await loadSources();
  const until = new Date(Date.now() + hours * 3_600_000).toISOString();
  const next = sources.map((s) => (s.id === sourceId ? { ...s, silencedUntil: until } : s));
  await saveSources(next);
  return next;
}

export async function unsilenceSource(sourceId: string): Promise<PingSource[]> {
  const sources = await loadSources();
  const next = sources.map((s) => (s.id === sourceId ? { ...s, silencedUntil: null } : s));
  await saveSources(next);
  return next;
}

export function isSourceSilenced(source: PingSource): boolean {
  if (!source.silencedUntil) return false;
  return new Date(source.silencedUntil).getTime() > Date.now();
}

export async function removeSourceAndPings(sourceId: string): Promise<{ sources: PingSource[]; pings: PingItem[] }> {
  const sources = (await loadSources()).filter((s) => s.id !== sourceId);
  const pings = (await loadPings()).filter((p) => p.sourceId !== sourceId);
  await saveSources(sources);
  await savePings(pings);
  return { sources, pings };
}
