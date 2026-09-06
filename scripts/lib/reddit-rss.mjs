// Reddit adapter for plain .mjs scripts (E5 fan-made discovery) — same
// proven no-key posture as apps/worker/src/sources/reddit-rss.ts, extracted
// here so both the TypeScript knowledge-engine adapter and this JS script
// share the verified technical path instead of drifting apart:
//
// - `.json` on `r/<sub>/new` and on a post permalink returns a 403
//   bot-challenge regardless of User-Agent (confirmed 2026-08-24/2026-08-25
//   in reddit-rss.ts's header comment; re-confirmed 2026-09-06 for this
//   script — `fanmade-discovery.mjs`'s old `discoverReddit()` silently
//   `continue`d past that 403 for every run since it shipped).
// - `.rss?limit=N[&t=<range>]` on `r/<sub>/<sort>` (or `.rss?limit=N&sort=top`
//   on a post permalink) returns 200 with a descriptive User-Agent and no
//   auth at all.
// - The feed carries no score/comment-count field — nothing JSON-only to
//   miss — so a rank signal has to come from Reddit's own server-side sort
//   order instead: request `sort: 'top', time: 'week'` and treat feed
//   position as `rank` (1-based, lower is more-hyped this week).
//
// A 429 backs off and returns zero posts rather than retrying — retry-
// storming a 429'd feed is how it gets permanently blocked (same posture as
// the TS adapter). Callers own deciding what "zero posts, no error" means
// for their own run (fanmade-discovery.mjs logs a counted warning).

import Parser from 'rss-parser';

const DEFAULT_USER_AGENT =
  'Swift2FanmadeDiscovery/1.0 (+https://longlivets.com; contact via github.com/JW-Incorporated/swift2/issues)';

const parser = new Parser({ timeout: 10_000 });

function feedUrl(subreddit, { sort, time, limit }) {
  const url = new URL(`https://www.reddit.com/r/${subreddit}/${sort}/.rss`);
  url.searchParams.set('limit', String(limit));
  if (time) url.searchParams.set('t', time);
  return url.href;
}

// A link post's Atom <content> embeds `<span><a href="...">[link]</a></span>`
// pointing at the outbound URL (verified against a live fetch 2026-09-06).
// Self-text posts have no such span, so `outboundUrl` returns null and the
// caller falls back to the post's own permalink — which fails the shop-
// domain allowlist and is dropped, matching the old JSON path's behaviour
// where a self-post's `url` field is just its own permalink.
function outboundUrl(contentHtml) {
  const match = typeof contentHtml === 'string' ? contentHtml.match(/<span><a href="([^"]+)">\[link\]<\/a><\/span>/) : null;
  return match ? match[1].replace(/&amp;/g, '&') : null;
}

function postIdFromAtomId(atomId) {
  const match = typeof atomId === 'string' ? atomId.match(/^t3_([\w-]+)$/) : null;
  return match ? match[1] : null;
}

/**
 * Fetches a subreddit's public RSS/Atom feed. Returns `{ posts, status }` on
 * success (including a 429 back-off, which yields `posts: []`); throws with
 * `error.status` set for any other non-2xx response so callers can decide
 * how to log/count it.
 */
export async function fetchSubredditPosts(
  subreddit,
  { sort = 'new', time, limit = 100, userAgent = DEFAULT_USER_AGENT, fetchImpl = fetch } = {},
) {
  const requestUrl = feedUrl(subreddit, { sort, time, limit });
  const response = await fetchImpl(requestUrl, { headers: { 'User-Agent': userAgent } });
  if (response.status === 429) return { posts: [], status: 429 };
  if (!response.ok) {
    const error = new Error(`reddit-rss fetch failed for r/${subreddit} (${response.status})`);
    error.status = response.status;
    throw error;
  }
  const xml = await response.text();
  const feed = await parser.parseString(xml);
  const posts = (feed.items ?? [])
    .map((item, index) => {
      const id = postIdFromAtomId(item.id);
      if (!id || !item.link) return null;
      return {
        id,
        title: item.title ?? null,
        permalink: item.link,
        url: outboundUrl(item.content) || item.link,
        createdAt: item.isoDate ?? null,
        rank: index + 1,
      };
    })
    .filter((post) => post !== null);
  return { posts, status: response.status };
}
