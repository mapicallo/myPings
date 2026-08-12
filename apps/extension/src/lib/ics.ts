import type { PingItem, PingSource } from './types.js';

/**
 * Fetches an ICS (iCalendar) URL, parses VEVENT blocks, and returns
 * upcoming events (within the next 7 days) as PingItems.
 */
export async function refreshIcs(source: PingSource): Promise<PingItem[]> {
  const res = await fetch(source.url);
  if (!res.ok) throw new Error(`ICS fetch ${res.status}`);
  const text = await res.text();
  return parseIcs(text, source);
}

function parseIcs(raw: string, source: PingSource): PingItem[] {
  const events: PingItem[] = [];
  const blocks = raw.split('BEGIN:VEVENT');
  const now = Date.now();
  const horizon = now + 7 * 86_400_000;

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0];
    const summary = icalProp(block, 'SUMMARY') ?? '(no title)';
    const dtStart = icalDate(icalProp(block, 'DTSTART'));
    const uid = icalProp(block, 'UID') ?? `ics_${i}_${source.id}`;
    const location = icalProp(block, 'LOCATION');

    if (!dtStart || dtStart.getTime() > horizon || dtStart.getTime() < now - 86_400_000) continue;

    const title = location ? `${summary} @ ${location}` : summary;

    events.push({
      id: `ics_${uid}`,
      sourceId: source.id,
      sourceTitle: source.title,
      category: 'calendar',
      title,
      url: '',
      publishedAt: dtStart.toISOString(),
      receivedAt: new Date().toISOString(),
      read: false,
    });
  }

  return events;
}

function icalProp(block: string, key: string): string | null {
  const re = new RegExp(`^${key}[;:](.*)`, 'm');
  const m = block.match(re);
  if (!m) return null;
  return m[1]
    .replace(/\\n/g, ' ')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .trim();
}

function icalDate(raw: string | null): Date | null {
  if (!raw) return null;
  // Strip VALUE=DATE: or TZID=...: prefixes
  const val = raw.replace(/^[^:]*:/g, '').trim();
  // 20260812T100000Z or 20260812
  const m = val.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +(h ?? 0), +(mi ?? 0), +(s ?? 0)));
}
