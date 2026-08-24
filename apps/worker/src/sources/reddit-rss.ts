// Reddit adapter — interim RSS posture (no Data API key yet, proposal §4.4
// / PLAN.md Stage 6 / HUMAN-ACTIONS.md #15). Public per-subreddit RSS/Atom
// feeds, no auth, but Reddit actively blocks a bare default user agent
// (confirmed 2026-08-24: default curl UA -> 403; a descriptive UA -> 200)
// and rate-limits aggressive polling with 429 — this adapter backs off and
// skips on 429, never retries in the same run (retry-storming a 429'd feed
// is exactly how it gets permanently blocked). Feature-flagged via
// REDDIT_RSS_ENABLED so the day Reddit's Data API is approved this whole
// source type disables in one place, in the same PR that wires OAuth.
//
// Deliberately conservative on content: title + permalink + published_at +
// a HASHED author handle only. Verified 2026-08-24 that Reddit's Atom feed
// puts the full self-post body in <content>/<summary> — that reads as "the
// body," not a press teaser, so it is dropped entirely rather than
// truncated (a later stage summarizes in our own words if an item is ever
// promoted). The feed also carries no score field at all (that's JSON-API
// data Reddit doesn't expose via RSS) — nothing to include even if wanted.

import Parser from 'rss-parser';
import type { NormalizedNewsItem } from '@swift2/shared/news';
import type { NewsSourceRow, SourceAdapter } from './types';
import { hashHandle } from './hash-handle';

const USER_AGENT =
  'Swift2KnowledgeEngine/1.0 (+https://longlivets.com; contact via github.com/JW-Incorporated/swift2/issues)';
const MAX_ITEMS_PER_SOURCE = 30;

const parser = new Parser<unknown, { author?: string }>({ timeout: 10_000 });

export type RedditSort = 'new' | 'top-day';

function feedUrl(subreddit: string, sort: RedditSort): string {
  return sort === 'top-day'
    ? `https://www.reddit.com/r/${subreddit}/top/.rss?t=day&limit=${MAX_ITEMS_PER_SOURCE}`
    : `https://www.reddit.com/r/${subreddit}/new/.rss?limit=${MAX_ITEMS_PER_SOURCE}`;
}

export async function fetchSubredditRss(
  subreddit: string,
  sort: RedditSort = 'new',
  fetchImpl: typeof fetch = fetch,
): Promise<NormalizedNewsItem[]> {
  const res = await fetchImpl(feedUrl(subreddit, sort), {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (res.status === 429) {
    // Back off, never retry-storm — the next scheduled run tries again.
    console.error(`reddit-rss backed off: r/${subreddit} returned 429`);
    return [];
  }
  if (!res.ok) {
    throw new Error(`reddit-rss fetch failed for r/${subreddit} (${res.status})`);
  }
  const xml = await res.text();
  const feed = await parser.parseString(xml);
  return (feed.items ?? [])
    .slice(0, MAX_ITEMS_PER_SOURCE)
    .map((item): NormalizedNewsItem | null => {
      if (!item.link || !item.title) return null;
      const rawAuthor = item.creator ?? item.author;
      return {
        externalId: item.guid ?? item.link,
        url: item.link,
        title: item.title,
        snippet: '', // deliberately empty — see module header
        author: rawAuthor ? hashHandle(rawAuthor) : undefined,
        publishedAt: item.isoDate,
      };
    })
    .filter((i): i is NormalizedNewsItem => i !== null);
}

export const redditRssAdapter: SourceAdapter = {
  async fetch(source: NewsSourceRow): Promise<NormalizedNewsItem[]> {
    if (process.env.REDDIT_RSS_ENABLED === 'false') return [];
    const subreddit = source.config.subreddit;
    if (typeof subreddit !== 'string' || !subreddit) {
      throw new Error(`reddit-rss source "${source.name}" has no config.subreddit`);
    }
    const sort: RedditSort = source.config.sort === 'top-day' ? 'top-day' : 'new';
    return fetchSubredditRss(subreddit, sort);
  },
};
