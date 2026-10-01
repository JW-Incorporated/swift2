#!/usr/bin/env node
// Awareness image-reply lane — discovery (owner direction 2026-10-01,
// docs/strategy/growth-strategy.md bet 2). Zero-LLM. Reads the committed sub
// list (awareness-subs.json), pulls each sub's hot + new RSS feeds through
// the shared reddit-rss adapter, applies the discovery filters
// (awareness-filters.mjs), checks whether the sub allows image comments
// (awareness-eligibility.mjs), picks a deterministic site visual
// (awareness-image.mjs) and inserts `engagement_lead(kind='awareness_reply',
// status='new')` rows. The awareness answerer routine then writes the reply
// text; awareness-deliver.mjs sends it to Discord. The OWNER posts — nothing
// here (or anywhere in this lane) calls a Reddit/Facebook write API.
//
// Facebook: the weekly export ingest (fb-export-ingest.mjs) lands
// `hot_thread` leads with platform='facebook'; this script adopts the recent
// screened ones as awareness rows (image support unknown) without touching
// the exporter.
//
// Kill switch: repo VARIABLE `AWARENESS_LANE_ENABLED=false` stops the lane
// (workflow checks it first; re-checked here). Unset means ON — the owner
// asked for this lane.
//
//   npx tsx scripts/community/awareness-scan.mjs [--dry-run]   # dry-run: no DB, prints per-sub volume
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchSubredditPosts } from '../lib/reddit-rss.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { isSchemaPending, runMain } from '../lib/cli.mjs';
import { fetchKnownThreadIds, insertLeads } from './scan.mjs';
import {
  AWARENESS_KIND,
  applyCandidateCaps,
  evaluateThread,
  scoreCandidate,
} from './awareness-filters.mjs';
import { fetchSubAbout, resolveImageComments } from './awareness-eligibility.mjs';
import { adoptFacebookLeads } from './awareness-facebook.mjs';
import { loadCatalog, pickImageRef } from './awareness-image.mjs';

const CONFIG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'awareness-subs.json');
export const RUN_CAP = 8;
// Reddit answers anonymous feed requests with 429 after only a few in quick succession
// (seen 2026-10-01), so every request in a run is spaced out; a 429 is never retried.
export const PACING_MS = 6000;

export function awarenessEnabled(env = process.env) {
  return env.AWARENESS_LANE_ENABLED !== 'false' && env.AWARENESS_LANE_ENABLED !== '0';
}

export function loadConfig(file = CONFIG_PATH) {
  const config = JSON.parse(readFileSync(file, 'utf8'));
  return { defaults: config.defaults ?? {}, subs: config.subs ?? [] };
}

export function utcDayStart(now = new Date()) {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  ).toISOString();
}

export function contextFor(subreddit, types, ageHours, rank) {
  return `Awareness candidate in r/${subreddit} (${types.join('/')}), about ${Math.round(ageHours)}h old, feed rank ${rank} (title-only scan, no bodies stored).`;
}

export function buildAwarenessRow({ subreddit, post, types, ageHours, imageRef, imageComments }) {
  return {
    platform: 'reddit',
    community: subreddit,
    kind: AWARENESS_KIND,
    thread_id: post.id,
    url: post.permalink,
    title: post.title,
    context: contextFor(subreddit, types, ageHours, post.rank),
    matched_doc_ids: [],
    status: 'new',
    redline_ok: true, // screenTopic ran on the title in evaluateThread
    image_ref: imageRef,
    image_comments: imageComments,
    thread_type: types[0],
  };
}

/** Per-sub candidates created so far today (UTC), from existing awareness rows. */
export async function fetchTodaysCandidateCounts(supabase, now = new Date()) {
  const { data, error } = await supabase
    .from('engagement_lead')
    .select('community')
    .eq('kind', AWARENESS_KIND)
    .eq('platform', 'reddit')
    .gte('created_at', utcDayStart(now));
  if (error) {
    if (isSchemaPending(error)) return {};
    throw error;
  }
  const counts = {};
  for (const row of data ?? []) counts[row.community] = (counts[row.community] ?? 0) + 1;
  return counts;
}

/** Scans one sub: both feeds, merged by id (best rank wins), filtered. Never throws on an HTTP failure. */
export async function scanSub(
  sub,
  defaults,
  { fetchImpl, now, catalog, warn = console.warn, sleep = async () => {} },
) {
  const limit = defaults.feedLimit ?? 25;
  const stats = { fetched: 0, rateLimited: 0, rejected: {} };
  const byId = new Map();
  for (const sort of ['hot', 'new']) {
    try {
      const { posts, status } = await fetchSubredditPosts(sub.name, { sort, limit, fetchImpl });
      if (status === 429) stats.rateLimited += 1;
      for (const post of posts) {
        const prior = byId.get(post.id);
        if (!prior || post.rank < prior.rank) byId.set(post.id, post);
      }
    } catch (error) {
      warn(
        `awareness-scan: r/${sub.name} ${sort} feed failed (${error?.status ?? error?.message ?? error}).`,
      );
    }
    await sleep(PACING_MS);
  }
  stats.fetched = byId.size;
  const candidates = [];
  for (const post of byId.values()) {
    const verdict = evaluateThread(post, sub, { now, maxAgeHours: defaults.maxAgeHours });
    if (!verdict.ok) {
      stats.rejected[verdict.reason] = (stats.rejected[verdict.reason] ?? 0) + 1;
      continue;
    }
    const score = scoreCandidate(
      { types: verdict.types, rank: post.rank, ageHours: verdict.ageHours },
      sub,
    );
    const { ref } = pickImageRef(post.title, catalog);
    candidates.push({
      subreddit: sub.name,
      post,
      types: verdict.types,
      ageHours: verdict.ageHours,
      imageRef: ref,
      score,
    });
  }
  return { candidates, stats };
}

export async function runAwarenessScan({
  supabase = null,
  config = loadConfig(),
  catalog,
  fetchImpl,
  fetchAbout = fetchSubAbout,
  now = new Date(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  warn = console.warn,
  dryRun = false,
} = {}) {
  const { defaults, subs } = config;
  const known = supabase ? await fetchKnownThreadIds(supabase) : new Set();
  const today = supabase ? await fetchTodaysCandidateCounts(supabase, now) : {};
  const remainingToday = {};
  const all = [];
  const perSub = [];
  let aboutBlocked = false; // a 403 on about.json is a bot block, not a per-sub answer: stop asking this run
  for (const sub of subs) {
    let about = { imageComments: 'unknown', over18: false };
    if (!aboutBlocked) {
      about = await fetchAbout(sub.name, { fetchImpl });
      aboutBlocked = String(about.error ?? '').includes('403');
      await sleep(PACING_MS);
    }
    if (about.over18) {
      perSub.push({ subreddit: sub.name, skipped: 'over18' });
      continue;
    }
    const imageComments = resolveImageComments(sub, about);
    const { candidates, stats } = await scanSub(sub, defaults, {
      fetchImpl,
      now,
      catalog,
      warn,
      sleep,
    });
    await sleep(PACING_MS);
    remainingToday[sub.name] = Math.max(
      0,
      (defaults.perSubDailyCandidateCap ?? 4) - (today[sub.name] ?? 0),
    );
    const fresh = candidates
      .filter((c) => !known.has(c.post.id))
      .map((c) => ({ ...c, imageComments }));
    all.push(...fresh);
    perSub.push({
      subreddit: sub.name,
      imageComments,
      fetched: stats.fetched,
      rateLimited: stats.rateLimited,
      passed: candidates.length,
      unseen: fresh.length,
      rejected: stats.rejected,
    });
  }
  const kept = applyCandidateCaps(all, {
    perSubScanCap: defaults.perSubScanCapPerRun ?? 2,
    remainingToday,
    runCap: RUN_CAP,
  });
  const rows = kept.map((c) =>
    buildAwarenessRow({
      subreddit: c.subreddit,
      post: c.post,
      types: c.types,
      ageHours: c.ageHours,
      imageRef: c.imageRef,
      imageComments: c.imageComments,
    }),
  );
  const facebookRows = supabase ? await adoptFacebookLeads(supabase, { catalog, now }) : [];
  let inserted = 0;
  if (!dryRun && supabase) {
    inserted =
      (await insertLeads(supabase, rows)).inserted +
      (await insertLeads(supabase, facebookRows)).inserted;
  }
  return {
    perSub,
    candidates: all.length,
    kept: rows.length,
    facebook: facebookRows.length,
    inserted,
    rows,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  if (!awarenessEnabled()) {
    console.log(
      'awareness-scan: AWARENESS_LANE_ENABLED=false — skipping. Kill switch, not a fault.',
    );
    return 0;
  }
  const supabase = serviceClient();
  if (!supabase && !dryRun) {
    console.log(
      'awareness-scan: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY unset — skipping (degraded, not a crash).',
    );
    return 0;
  }
  const result = await runAwarenessScan({ supabase, catalog: await loadCatalog(), dryRun });
  console.log(
    `awareness-scan: ${result.candidates} candidate(s) passed filters, ${result.kept} kept under caps, ${result.facebook} Facebook adopted, ${result.inserted} inserted${dryRun ? ' (dry-run: nothing written)' : ''}.`,
  );
  for (const s of result.perSub) console.log(`  r/${s.subreddit}: ${JSON.stringify(s)}`);
  return 0;
}

if (process.argv[1]?.split(/[\\/]/).pop() === 'awareness-scan.mjs') {
  runMain(main, { name: 'awareness-scan' });
}
