import { refreshGmail } from './gmail.js';
import { refreshGithub } from './github.js';
import { refreshHn } from './hn.js';
import { refreshIcs } from './ics.js';
import { refreshReddit } from './reddit.js';
import { ensureFeedPermission, refreshSource } from './rss.js';
import type { PingItem, PingSource } from './types.js';

export type RefreshErrorKey = 'errorFeed' | 'errorGithub' | 'errorIcs' | 'errorHn' | 'errorReddit' | 'errorGmail' | 'errorPermission';

export function errorKeyForType(type: PingSource['type']): RefreshErrorKey {
  switch (type) {
    case 'github': return 'errorGithub';
    case 'ics': return 'errorIcs';
    case 'hn': return 'errorHn';
    case 'reddit': return 'errorReddit';
    case 'gmail': return 'errorGmail';
    default: return 'errorFeed';
  }
}

export async function refreshPingSource(source: PingSource): Promise<PingItem[]> {
  switch (source.type) {
    case 'rss': {
      const ok = await ensureFeedPermission(source.url);
      if (!ok) throw new PermissionError();
      return refreshSource(source);
    }
    case 'github':
      return refreshGithub(source);
    case 'ics': {
      const ok = await ensureFeedPermission(source.url);
      if (!ok) throw new PermissionError();
      return refreshIcs(source);
    }
    case 'hn': {
      const ok = await ensureFeedPermission('https://hn.algolia.com/');
      if (!ok) throw new PermissionError();
      return refreshHn(source);
    }
    case 'reddit': {
      const ok = await ensureFeedPermission('https://www.reddit.com/');
      if (!ok) throw new PermissionError();
      return refreshReddit(source);
    }
    case 'gmail':
      return refreshGmail(source);
    default:
      return [];
  }
}

export class PermissionError extends Error {
  constructor() {
    super('permission denied');
    this.name = 'PermissionError';
  }
}
