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
// Post title/permalink/published_at + a HASHED author handle only — no
// self-post body (Reddit's Atom feed puts the full self-post body in
// <content>/<summary>, confirmed 2026-08-24; that reads as "the body," not a
// press teaser, so it is dropped rather than truncated). The feed also
// carries no score field at all (that's JSON-API data Reddit doesn't expose
// via RSS) — nothing to include even if wanted.
//
// COMMENT BODIES (docs/decisions.md, 2026-08-25 "Reversed: Reddit fan-source
// posture now includes comment bodies", PR #3279): now in scope for the
// fan-signal/theory-detection pipeline — every other privacy safeguard
// (hashed author, no location beyond what a post already discloses) stays in
// force, this reverses only the no-comment-bodies clause. `fetchPostComments`
// below is that fetch primitive.
//
// Technical path, verified with real fetches 2026-08-25 (do not re-attempt
// the alternatives — both are dead ends): Reddit's `.json` endpoint on a
// public post (`www.reddit.com/.../[id]/.json` and `api.reddit.com/...`)
// returns a 403 bot-challenge page regardless of User-Agent — this is a
// different (stricter) gate than the RSS 403, not a UA problem.
// `old.reddit.com/.../.json` 302s to a login wall. What DOES work, using the
// exact same no-auth/UA-gated mechanism already proven for subreddit feeds:
// appending `.rss?limit=N&sort=top` to a post's own permalink returns an
// Atom feed whose first entry is the post itself (`id` starts with `t3_`)
// followed by up to N comments (`id` starts with `t1_`), each with its own
// `author`/`content/contentSnippet`/`isoDate` — sorted server-side by
// `sort=top`, so no separate score field is needed to bound to "top N."
//
// `fetchPostComments` is exported and independently tested but NOT wired
// into the pipeline yet — teaching the extract stage to actually read
// comment context for Easter-egg/theory detection is scoped as a follow-up
// (issue #3284) rather than rushed into this change alongside the fetch
// primitive.

import Parser from 'rss-parser';
import type { NormalizedNewsItem } from '@swift2/shared/news';
import type { NewsSourceRow, SourceAdapter } from './types';
import { hashHandle } from './hash-handle';

const USER_AGENT =
  'Swift2KnowledgeEngine/1.0 (+https://longlivets.com; contact via github.com/JW-Incorporated/swift2/issues)';
const MAX_ITEMS_PER_SOURCE = 30;
// "top 10-20 comments per post by score" (decisions.md's "still to be
// engineered" scope note) — not the entire thread. Reddit's RSS carries no
// score field, so `sort=top` does the ranking server-side; this just bounds
// how many of that server-sorted list we ever keep.
const MAX_COMMENTS_PER_POST = 15;

const parser = new Parser<unknown, { author?: string; id?: string }>({ timeout: 10_000 });

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

export interface RedditComment {
  /** Comment's own Reddit fullname, e.g. "t1_p5ptlr3" — not a fan-facing id. */
  id: string;
  /** Hashed per hashHandle's convention — same as a post's author, never raw. */
  author?: string;
  body: string;
  publishedAt?: string;
}

function commentsFeedUrl(postUrl: string, limit: number): string {
  const base = postUrl.endsWith('/') ? postUrl : `${postUrl}/`;
  return `${base}.rss?limit=${limit}&sort=top`;
}

/**
 * Fetches up to `limit` top comments on a single Reddit post via the same
 * no-auth `.rss` mechanism as `fetchSubredditRss` (module header has the
 * verified technical path — the `.json` endpoint is a dead end). Intended
 * for posts that have already clustered into a real story, not every raw
 * item ingested — comment fetching is one extra request per post, so callers
 * should call this selectively, not per-item at ingest time.
 *
 * Best-effort by design: a 429 backs off (same never-retry-storm posture as
 * the post feed) and returns an empty list rather than throwing, since a
 * missing comment thread should degrade a story's context, not fail it.
 */
export async function fetchPostComments(
  postUrl: string,
  limit: number = MAX_COMMENTS_PER_POST,
  fetchImpl: typeof fetch = fetch,
): Promise<RedditComment[]> {
  const boundedLimit = Math.min(limit, MAX_COMMENTS_PER_POST);
  const res = await fetchImpl(commentsFeedUrl(postUrl, boundedLimit), {
    headers: { 'User-Agent': USER_AGENT },
  });
  if (res.status === 429) {
    console.error(`reddit-rss comment fetch backed off: ${postUrl} returned 429`);
    return [];
  }
  if (!res.ok) {
    console.error(`reddit-rss comment fetch failed for ${postUrl} (${res.status})`);
    return [];
  }
  const xml = await res.text();
  const feed = await parser.parseString(xml);
  return (feed.items ?? [])
    // The feed's first entry is the post itself ("t3_..."); comments are
    // "t1_...". Reddit's RSS carries no explicit depth field, so this can't
    // distinguish top-level comments from nested replies — both come back
    // as "t1_" entries, ordered by `sort=top`.
    .filter((item): item is (typeof feed.items)[number] & { id: string } =>
      typeof item.id === 'string' && item.id.startsWith('t1_'),
    )
    .slice(0, boundedLimit)
    .map((item): RedditComment | null => {
      const body = (item.contentSnippet ?? '').trim();
      if (!body) return null;
      const rawAuthor = item.creator ?? item.author;
      return {
        id: item.id,
        author: rawAuthor ? hashHandle(rawAuthor) : undefined,
        body,
        publishedAt: item.isoDate,
      };
    })
    .filter((c): c is RedditComment => c !== null);
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
