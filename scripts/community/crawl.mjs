#!/usr/bin/env node
// Community Engine — C1 year-deep top-post crawl (community-crawl.yml, P2-1).
// docs/proposals/2026-09-06-community-engine-plan.md §3.2. Kill-switch OFF by
// default per the 2026-09-06 founder directive: this is the one Community
// Engine component with real risk (scraping volume/pace), so it must never
// run unless a human deliberately flips the repo VARIABLE
// `COMMUNITY_CRAWL_ENABLED` to `true` — checked as the very first thing this
// script does, before any network call. `COMMUNITY_CRAWL_BUDGET` caps how
// many home-relay full-tree fetches this run may make (threads/run, not a
// post count), so a founder can run it "a little bit here and there" instead
// of only a binary full-speed/off choice.
//
// WHAT THIS DOES, zero LLM, zero writes to the repo or the database:
//   1. Reads `community_watchlist` (read-only DB connection) for every
//      `platform='reddit', crawl=true` row.
//   2. For each, walks the subreddit's top-of-year RSS feed
//      (`topPosts(sub, { time: 'year', limit: 100 })`,
//      scripts/lib/reddit-rss.mjs) — the plan's "month windows walked back
//      12x" framing does not survive contact with Reddit's actual `.rss`
//      surface: `t=month` always means "the trailing 30 days from now," not
//      an arbitrary historical month, and the adapter has no cursor/`after`
//      parameter to page further back. `t=year&limit=100` is the real ceiling
//      this zero-key adapter can reach — documented here rather than
//      pretending to implement a windowing scheme Reddit's RSS doesn't
//      support. See `docs/community/README.md` for the operator-facing note.
//   3. For the top 20% by rank (this run's `heatTierCount`), attempts a
//      bounded full comment-tree fetch via the operator's home-relay
//      (skill `home-relay`, `/svc/shreddit/comments/r/<sub>/t3_<id>`),
//      probe-before-use, mandatory randomized 1-11s pacing before every
//      relay request, never retried in-run on 403/429. Every other post
//      (below the heat tier, or when the relay is unreachable/unbudgeted)
//      gets its top-15-25 comments from the same RSS adapter instead and is
//      marked `depth: 'partial'`.
//   4. Writes one JSON bundle to a local file — the caller (this repo's
//      community-crawl.yml) uploads it as a transient 24h Actions artifact.
//      This script itself never touches supabase/** or the repo tree.
//
// HOME_RELAY_URL is deliberately optional and unset by default: the plan's
// own §4 cost table says this workflow needs **no new secret**, but reaching
// the operator's home PC over Tailscale from a GitHub-hosted runner (as
// opposed to an agent sandbox already on the tailnet) needs one — a
// Tailscale-reachable relay endpoint is a separate, later provisioning step,
// not assumed here. Until that secret exists, `probeHomeRelay` correctly
// reports "not configured" and every post falls back to the RSS partial
// path, exactly the plan's own documented degrade behaviour (§3.2: "otherwise
// it just uses the RSS slice and marks depth='partial'").
//
// Author hashing happens here, not deferred to the Theory Miner (P2-2): this
// script's own JSON bundle is the first point anything is written out of
// memory, so it hashes every comment author before that write per §6.3's
// "hashed authors" guardrail — cheap, and it means a bug in a downstream
// consumer can never leak a raw handle from this artifact.

import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { makeClient } from '../lib/pg.mjs';
import { runMain } from '../lib/cli.mjs';
import { topPosts, postComments, parseShredditComments } from '../lib/reddit-rss.mjs';

/* global AbortSignal */ // Node 18+ global, same pragma as scripts/lib/gh.mjs

// RSS's real ceiling for `sort=top&t=year` (see module header above).
export const YEAR_LIMIT = 100;
// "top 20% by rank" (§3.2) gets considered for a full-tree relay fetch.
export const HEAT_TIER_FRACTION = 0.2;
// Conservative default threads/run cap — well under the plan's ≤40/day
// home-relay ceiling (§6.4) even if this ever ran more than once a day.
export const DEFAULT_BUDGET = 15;
export const RSS_COMMENT_LIMIT = 25;
export const RELAY_PROBE_TIMEOUT_MS = 5_000;
// Mandatory pacing rule (home-relay skill, "Scheduled/bulk automation is now
// allowed" section): a fresh random 1-11s delay before EVERY relay request,
// never a fixed interval.
export const RELAY_PACING_MIN_S = 1;
export const RELAY_PACING_MAX_S = 11;

/** Same truthy convention as SOCIAL_FREEZE (scripts/social/post-queue.mjs). */
export function isEnabled(value) {
  return Boolean(value) && value !== 'false' && value !== '0';
}

/** How many of a subreddit's top-of-year posts fall in the "heat tier". */
export function heatTierCount(totalPosts) {
  return Math.max(0, Math.ceil(totalPosts * HEAT_TIER_FRACTION));
}

/** Deterministic, non-reversible author handle for anything persisted. */
export function hashAuthor(author) {
  if (!author) return null;
  return createHash('sha256').update(String(author)).digest('hex').slice(0, 16);
}

function randomPacingMs(random = Math.random) {
  const span = RELAY_PACING_MAX_S - RELAY_PACING_MIN_S + 1;
  const seconds = Math.floor(random() * span) + RELAY_PACING_MIN_S;
  return seconds * 1_000;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 5-second reachability probe (`HOME_RELAY_REACHABLE` in the plan). `false`
 * when the relay isn't configured at all (no secret yet — see module header)
 * or doesn't answer in time; never throws.
 */
export async function probeHomeRelay(
  relayUrl,
  { fetchImpl = fetch, timeoutMs = RELAY_PROBE_TIMEOUT_MS } = {},
) {
  if (!relayUrl) return false;
  try {
    const response = await fetchImpl(relayUrl, { signal: AbortSignal.timeout(timeoutMs) });
    return response.status < 500;
  } catch {
    return false;
  }
}

function subredditName(watchlistId) {
  return watchlistId.startsWith('reddit:') ? watchlistId.slice('reddit:'.length) : watchlistId;
}

/**
 * One bounded full-tree fetch through the relay. Never retries on 403/429
 * (home-relay skill: "never retried in-run" — retry-storming is how a feed
 * gets permanently blocked) — degrades to `{ comments: [], status }` instead,
 * so the caller can fall back to the RSS slice for that post.
 */
export async function fetchFullTree(
  relayUrl,
  subreddit,
  postId,
  { fetchImpl = fetch, sleepImpl = wait, random = Math.random } = {},
) {
  await sleepImpl(randomPacingMs(random));
  const target = `https://www.reddit.com/svc/shreddit/comments/r/${subreddit}/t3_${postId}`;
  const requestUrl = `${relayUrl.replace(/\/$/, '')}/${target}`;
  let response;
  try {
    response = await fetchImpl(requestUrl);
  } catch {
    return { comments: [], status: null };
  }
  if (response.status === 429 || response.status === 403 || !response.ok) {
    return { comments: [], status: response.status };
  }
  const html = await response.text();
  return { comments: parseShredditComments(html), status: response.status };
}

function normalizeComments(comments) {
  return comments.map((c) => ({
    author: hashAuthor(c.author),
    body: c.body ?? null,
    score: c.score ?? null,
    depth: typeof c.depth === 'number' ? c.depth : null,
    publishedAt: c.publishedAt ?? null,
  }));
}

/** Resolves one post's comments + depth, given the heat/relay/budget decision. */
async function resolvePostComments(
  post,
  { isHeat, relayReachable, budgetLeft, relayUrl, sub, fetchImpl, sleepImpl, random },
) {
  if (isHeat && relayReachable && budgetLeft > 0) {
    const full = await fetchFullTree(relayUrl, sub, post.id, { fetchImpl, sleepImpl, random });
    if (full.comments.length > 0) {
      return { comments: full.comments, depth: 'full', relaySpent: true };
    }
    const rss = await postComments(post.permalink, RSS_COMMENT_LIMIT, { fetchImpl });
    return { comments: rss.comments, depth: 'partial', relaySpent: true };
  }
  const rss = await postComments(post.permalink, RSS_COMMENT_LIMIT, { fetchImpl });
  return { comments: rss.comments, depth: 'partial', relaySpent: false };
}

/**
 * Crawls one watchlist subreddit: top-of-year posts, comments for each
 * (full tree via relay for the heat tier when budget/reachability allow,
 * RSS slice otherwise). `budgetRemaining` is the run-wide relay budget left
 * when this subreddit's turn starts; the caller accumulates `relayUsed`
 * across subreddits so the run-wide cap (`COMMUNITY_CRAWL_BUDGET`) is never
 * exceeded regardless of how many subreddits are on the watchlist.
 */
export async function crawlSubreddit(
  watchlistEntry,
  {
    relayReachable,
    relayUrl,
    budgetRemaining,
    fetchImpl = fetch,
    sleepImpl = wait,
    random = Math.random,
    warn = console.warn,
  },
) {
  const sub = subredditName(watchlistEntry.id);
  const { posts, status } = await topPosts(sub, { time: 'year', limit: YEAR_LIMIT, fetchImpl });
  if (status === 429) {
    warn(`community-crawl: r/${sub} RSS returned 429 — skipping this subreddit this run.`);
    return { subreddit: watchlistEntry.id, posts: [], relayUsed: 0 };
  }

  const heatCount = heatTierCount(posts.length);
  let relayUsed = 0;
  const bundles = [];

  for (const post of posts) {
    const isHeat = post.rank <= heatCount;
    const budgetLeft = budgetRemaining - relayUsed;
    const { comments, depth, relaySpent } = await resolvePostComments(post, {
      isHeat,
      relayReachable,
      budgetLeft,
      relayUrl,
      sub,
      fetchImpl,
      sleepImpl,
      random,
    });
    if (relaySpent) relayUsed += 1;

    bundles.push({
      subreddit: watchlistEntry.id,
      postId: post.id,
      title: post.title,
      permalink: post.permalink,
      createdAt: post.createdAt,
      rank: post.rank,
      depth,
      comments: normalizeComments(comments),
    });
  }

  return { subreddit: watchlistEntry.id, posts: bundles, relayUsed };
}

/** Every `platform='reddit', crawl=true` watchlist row, read-only. */
export async function fetchCrawlWatchlist(client) {
  const { rows } = await client.query(
    `select id, name from public.community_watchlist where platform = 'reddit' and crawl = true order by id`,
  );
  return rows;
}

async function main() {
  if (!isEnabled(process.env.COMMUNITY_CRAWL_ENABLED)) {
    console.log(
      'community-crawl: COMMUNITY_CRAWL_ENABLED is not "true" — kill switch OFF, skipping this run entirely. ' +
        'See docs/community/README.md for how to turn it on.',
    );
    return 0;
  }

  const budget =
    Number(process.env.COMMUNITY_CRAWL_BUDGET) > 0
      ? Number(process.env.COMMUNITY_CRAWL_BUDGET)
      : DEFAULT_BUDGET;
  const relayUrl = process.env.HOME_RELAY_URL || '';
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('community-crawl: SUPABASE_DB_URL not set — cannot read community_watchlist.');
    return 1;
  }

  const client = makeClient(connectionString, { readOnly: true });
  await client.connect();
  let watchlist;
  try {
    watchlist = await fetchCrawlWatchlist(client);
  } finally {
    await client.end();
  }

  if (watchlist.length === 0) {
    console.log(
      'community-crawl: no `crawl=true` reddit rows in community_watchlist — nothing to do.',
    );
    return 0;
  }

  const relayReachable = await probeHomeRelay(relayUrl);
  console.log(
    `community-crawl: home-relay ${relayUrl ? (relayReachable ? 'reachable' : 'configured but unreachable') : 'not configured'} — ` +
      `full-tree fetch ${relayReachable ? 'enabled' : 'disabled'} this run (budget ${budget} thread(s)).`,
  );

  const results = [];
  let relayUsedTotal = 0;
  for (const entry of watchlist) {
    const result = await crawlSubreddit(entry, {
      relayReachable,
      relayUrl,
      budgetRemaining: budget - relayUsedTotal,
    });
    relayUsedTotal += result.relayUsed;
    results.push(result);
  }

  const outputPath = process.env.COMMUNITY_CRAWL_OUTPUT || '.artifacts/community-crawl.json';
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        budget,
        relayUsedTotal,
        subreddits: results,
      },
      null,
      2,
    ),
  );

  const totalPosts = results.reduce((sum, r) => sum + r.posts.length, 0);
  console.log(
    `community-crawl: wrote ${totalPosts} post bundle(s) across ${results.length} subreddit(s) ` +
      `(${relayUsedTotal} full-tree fetch(es) via home-relay) to ${outputPath}`,
  );
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/community/crawl.mjs')
) {
  runMain(main, { name: 'community-crawl' });
}
