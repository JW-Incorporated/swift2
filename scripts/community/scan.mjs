#!/usr/bin/env node
// community-scan.yml — daily RSS hot-thread scan (Community Engine plan,
// docs/proposals/2026-09-06-community-engine-plan.md §2.2 Flow E2, card
// P1-2). Zero-LLM: reads `community_watchlist` (scan=true, platform=reddit),
// fetches each subreddit's top-of-day and hot RSS feeds via the shared
// scripts/lib/reddit-rss.mjs adapter (no keys, no auth), keeps the top N by
// rank, skips anything already known (either as an existing
// `engagement_lead` or an already-posted `community_post_ledger` row), and
// inserts the rest as `engagement_lead` rows with `kind='hot_thread'`.
//
// Nothing here drafts a reply, screens redlines, or posts anywhere — that is
// the Answerer desk's job (§2.5, card P1-4). This script only ever writes
// `status: 'new'`, `redline_ok: false` rows (the schema's own defaults) for
// the Answerer to pick up later.
//
// §6.3 guardrail: comment BODIES are never persisted. `postComments` is used
// only to count how many top comments were observed — never to store any
// comment text — so `context` stays a deterministic, our-words sentence
// ("N comments observed"), never a quote.
//
// Kill switch (§4's workflow table + plan §8/P1-7): gated by the repo
// VARIABLE `COMMUNITY_SCAN_ENABLED` (same pattern as `SOCIAL_FREEZE` /
// `COMMUNITY_CRAWL_ENABLED` — checked in the workflow before checkout, and
// re-checked here, belt and suspenders). Defaults to disabled: P1-7's
// end-to-end dry run flips it to `true` only after a human reads a rendered
// sample email.
//
// Facebook is deliberately out of scope here — §2.4's FB export ingest is a
// separate script (`fb-export-ingest.mjs`, P1-3) triggered by a human export
// landing, not a scheduled RSS poll (decisions.md 2026-08-11: no FB crawler,
// ever).

import { fetchSubredditPosts, topPosts, postComments } from '../lib/reddit-rss.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { isSchemaPending, runMain } from '../lib/cli.mjs';

export const DEFAULT_TOP_N = 10;
export const DEFAULT_COMMENT_LIMIT = 25;
const DUPLICATE_KEY_ERROR = '23505';

/** True unless the flag is explicitly falsy — mirrors SOCIAL_FREEZE's posture, inverted (this is an enable, not a freeze). */
export function scanEnabled(env = process.env) {
  const flag = env.COMMUNITY_SCAN_ENABLED;
  return flag === 'true' || flag === '1';
}

/**
 * Merges a subreddit's `top&t=day` and `hot` RSS listings into one
 * rank-ordered, deduped-by-id array (§2.2: "fetch ... top/.rss?t=day and
 * /hot/.rss ... keep the top N"). A post appearing in both feeds keeps its
 * best (lowest) rank; feed position is the only rank signal RSS carries
 * (see reddit-rss.mjs header — no score field).
 */
export function mergeRankedPosts(topOfDayPosts, hotPosts) {
  const byId = new Map();
  for (const post of [...topOfDayPosts, ...hotPosts]) {
    if (!post?.id) continue;
    const existing = byId.get(post.id);
    if (!existing || post.rank < existing.rank) byId.set(post.id, post);
  }
  return [...byId.values()].sort((a, b) => a.rank - b.rank);
}

/** Keeps only posts whose id is not already known (lead or ledger). */
export function filterUnseenPosts(posts, seenThreadIds) {
  return posts.filter((post) => post?.id && !seenThreadIds.has(post.id));
}

/** Deterministic, comment-body-free context sentence (§6.3). */
export function buildContext(commentCount, subreddit) {
  const noun = commentCount === 1 ? 'comment' : 'comments';
  return `Hot thread in r/${subreddit} — ${commentCount} top ${noun} observed (hot-thread scan, no bodies stored).`;
}

/** Shapes one `engagement_lead` insert row for a scanned Reddit post. */
export function buildLeadRow({ subreddit, post, commentCount }) {
  return {
    platform: 'reddit',
    community: subreddit,
    kind: 'hot_thread',
    thread_id: post.id,
    url: post.permalink,
    title: post.title ?? null,
    context: buildContext(commentCount, subreddit),
    matched_doc_ids: [],
    status: 'new',
    redline_ok: false,
  };
}

/**
 * Every reddit thread_id already known to this repo, from either
 * `engagement_lead` or `community_post_ledger` (§2.2: "skip anything already
 * in engagement_lead or community_post_ledger").
 */
export async function fetchKnownThreadIds(supabase) {
  const known = new Set();
  const [leads, ledger] = await Promise.all([
    supabase
      .from('engagement_lead')
      .select('thread_id')
      .eq('platform', 'reddit')
      .not('thread_id', 'is', null),
    supabase
      .from('community_post_ledger')
      .select('thread_id')
      .eq('platform', 'reddit')
      .not('thread_id', 'is', null),
  ]);
  if (leads.error && !isSchemaPending(leads.error)) throw leads.error;
  if (ledger.error && !isSchemaPending(ledger.error)) throw ledger.error;
  for (const row of leads.data ?? []) if (row.thread_id) known.add(row.thread_id);
  for (const row of ledger.data ?? []) if (row.thread_id) known.add(row.thread_id);
  return known;
}

/** Reddit rows from `community_watchlist` with `scan = true`. */
export async function fetchScanWatchlist(supabase) {
  const { data, error } = await supabase
    .from('community_watchlist')
    .select('id, name')
    .eq('platform', 'reddit')
    .eq('scan', true);
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, subreddit: row.name }));
}

/**
 * Inserts leads, tolerating a unique-constraint collision on the
 * `(platform, coalesce(thread_id, locator), kind)` index (§5) as a benign
 * race rather than a failure — a concurrent run or a lead that landed via
 * another flow (E1/E3) between the dedupe read above and this write is not
 * an error, it's exactly the case the dedupe key exists to catch.
 */
export async function insertLeads(supabase, rows) {
  if (rows.length === 0) return { inserted: 0, duplicates: 0 };
  const bulk = await supabase.from('engagement_lead').insert(rows);
  if (!bulk.error) return { inserted: rows.length, duplicates: 0 };
  if (bulk.error.code !== DUPLICATE_KEY_ERROR) throw bulk.error;
  // Fall back to one-at-a-time so a single collision doesn't drop the whole
  // batch (mirrors reddit-rss.mjs's "never retry-storm, degrade per-item").
  let inserted = 0;
  let duplicates = 0;
  for (const row of rows) {
    const result = await supabase.from('engagement_lead').insert(row);
    if (!result.error) inserted += 1;
    else if (result.error.code === DUPLICATE_KEY_ERROR) duplicates += 1;
    else throw result.error;
  }
  return { inserted, duplicates };
}

/**
 * Full scan for one subreddit: fetch both feeds, merge/rank, cap at
 * `topN`. Returns the ranked candidate posts (pre-dedupe against the DB —
 * dedupe happens once, across all subreddits, in `runScan`).
 */
export async function scanSubreddit(subreddit, { topN = DEFAULT_TOP_N, fetchImpl } = {}) {
  const [topOfDay, hot] = await Promise.all([
    topPosts(subreddit, { time: 'day', limit: topN, fetchImpl }).catch((error) =>
      error?.status ? { posts: [], status: error.status } : Promise.reject(error),
    ),
    fetchSubredditPosts(subreddit, { sort: 'hot', limit: topN, fetchImpl }).catch((error) =>
      error?.status ? { posts: [], status: error.status } : Promise.reject(error),
    ),
  ]);
  return mergeRankedPosts(topOfDay.posts, hot.posts).slice(0, topN);
}

/**
 * Orchestrates the whole run: watchlist -> per-sub scan -> dedupe -> comment
 * counts for context -> insert. `fetchComments` defaults to `postComments`;
 * a failure fetching comments for one post degrades that post's context to
 * "count unknown" rather than dropping the lead (best-effort, same posture
 * as the rest of the reddit-rss adapter).
 */
export async function runScan({
  supabase,
  topN = DEFAULT_TOP_N,
  commentLimit = DEFAULT_COMMENT_LIMIT,
  fetchImpl,
  fetchComments = postComments,
  warn = console.warn,
} = {}) {
  const watchlist = await fetchScanWatchlist(supabase);
  const knownThreadIds = await fetchKnownThreadIds(supabase);

  const perSubreddit = [];
  for (const { subreddit } of watchlist) {
    let ranked;
    try {
      ranked = await scanSubreddit(subreddit, { topN, fetchImpl });
    } catch (error) {
      warn(
        `community-scan: r/${subreddit} failed (${error?.status ?? error?.message ?? error}) — skipping this subreddit this run.`,
      );
      perSubreddit.push({ subreddit, scanned: 0, newLeads: 0 });
      continue;
    }
    const unseen = filterUnseenPosts(ranked, knownThreadIds);
    const rows = [];
    for (const post of unseen) {
      let commentCount;
      try {
        const { comments } = await fetchComments(post.permalink, commentLimit, { fetchImpl });
        commentCount = comments.length;
      } catch {
        // Best-effort context only — a comment-fetch failure must not drop
        // the lead itself, it just can't state a count.
        commentCount = 0;
      }
      rows.push(buildLeadRow({ subreddit, post, commentCount }));
      knownThreadIds.add(post.id); // guard against duplicate ranks across feeds within this run
    }
    const { inserted, duplicates } = await insertLeads(supabase, rows);
    perSubreddit.push({ subreddit, scanned: ranked.length, newLeads: inserted, duplicates });
  }

  return {
    subredditsScanned: watchlist.length,
    totalNewLeads: perSubreddit.reduce((sum, s) => sum + (s.newLeads ?? 0), 0),
    perSubreddit,
  };
}

async function main() {
  if (!scanEnabled()) {
    console.log(
      'community-scan: COMMUNITY_SCAN_ENABLED is not set — skipping this run entirely. Kill switch, not a fault.',
    );
    return 0;
  }
  const supabase = serviceClient();
  if (!supabase) {
    console.log(
      'community-scan: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — skipping (degraded, not a crash).',
    );
    return 0;
  }
  const topN = Number(process.env.COMMUNITY_SCAN_TOP_N) || DEFAULT_TOP_N;
  const result = await runScan({ supabase, topN });
  console.log(
    `community-scan: scanned ${result.subredditsScanned} subreddit(s), inserted ${result.totalNewLeads} new lead(s).`,
  );
  for (const s of result.perSubreddit) {
    console.log(
      `  r/${s.subreddit}: ${s.scanned} ranked, ${s.newLeads} new lead(s)${s.duplicates ? `, ${s.duplicates} duplicate(s) skipped` : ''}.`,
    );
  }
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/community/scan.mjs')
) {
  runMain(main, { name: 'community-scan' });
}
