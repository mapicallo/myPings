import type { GithubEventFilter, PingItem, PingSource } from './types.js';
import { newId } from './storage.js';

interface GhEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: Record<string, unknown>;
  actor?: { login: string };
}

/**
 * Fetches recent GitHub events for a user or repo, filtered by
 * the source's `ghEvents` setting, and returns PingItems.
 *
 * `source.url` must be one of:
 *   - https://api.github.com/users/{user}/received_events
 *   - https://api.github.com/repos/{owner}/{repo}/events
 */
export async function refreshGithub(source: PingSource): Promise<PingItem[]> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (source.token) headers['Authorization'] = `Bearer ${source.token}`;

  const res = await fetch(source.url, { headers });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const events: GhEvent[] = await res.json();

  const filters = source.ghEvents ?? (['issues', 'pulls', 'releases', 'mentions'] satisfies GithubEventFilter[]);

  return events
    .filter((e) => matchesFilter(e, filters))
    .slice(0, 50)
    .map((e) => eventToPing(e, source));
}

function matchesFilter(e: GhEvent, filters: GithubEventFilter[]): boolean {
  const t = e.type;
  if (filters.includes('issues') && (t === 'IssuesEvent' || t === 'IssueCommentEvent')) return true;
  if (filters.includes('pulls') && (t === 'PullRequestEvent' || t === 'PullRequestReviewEvent' || t === 'PullRequestReviewCommentEvent')) return true;
  if (filters.includes('releases') && t === 'ReleaseEvent') return true;
  if (filters.includes('mentions') && t === 'IssueCommentEvent') return true;
  return false;
}

function eventToPing(e: GhEvent, source: PingSource): PingItem {
  const { title, url } = summarise(e);
  return {
    id: `gh_${e.id}`,
    sourceId: source.id,
    sourceTitle: source.title,
    category: 'dev',
    title,
    url,
    publishedAt: e.created_at,
    receivedAt: new Date().toISOString(),
    read: false,
  };
}

function summarise(e: GhEvent): { title: string; url: string } {
  const repo = e.repo.name;
  const p = e.payload as Record<string, any>;

  switch (e.type) {
    case 'IssuesEvent': {
      const issue = p['issue'] ?? {};
      return { title: `[${repo}] Issue ${p['action']}: ${issue['title'] ?? ''}`, url: issue['html_url'] ?? '' };
    }
    case 'IssueCommentEvent': {
      const comment = p['comment'] ?? {};
      return { title: `[${repo}] Comment on #${(p['issue'] ?? {})['number'] ?? '?'}`, url: comment['html_url'] ?? '' };
    }
    case 'PullRequestEvent': {
      const pr = p['pull_request'] ?? {};
      return { title: `[${repo}] PR ${p['action']}: ${pr['title'] ?? ''}`, url: pr['html_url'] ?? '' };
    }
    case 'PullRequestReviewEvent':
    case 'PullRequestReviewCommentEvent': {
      const pr2 = p['pull_request'] ?? {};
      return { title: `[${repo}] PR review activity`, url: pr2['html_url'] ?? '' };
    }
    case 'ReleaseEvent': {
      const rel = p['release'] ?? {};
      return { title: `[${repo}] Release ${rel['tag_name'] ?? ''}`, url: rel['html_url'] ?? '' };
    }
    default:
      return { title: `[${repo}] ${e.type}`, url: `https://github.com/${repo}` };
  }
}
