#!/usr/bin/env node
// Theory Miner (C2) — P1-21 consumes the home reader's new/hot thread bundle;
// the older GitHub top-of-year crawl remains an explicitly configured fallback.
//
// WHAT THIS DOES: reads author-free post + comment-tree bundles, skips a
// completed bundle:<thread>:<comment bucket>, then asks capped Jev q_theory.
// Only positives make a Haiku 5.5 call through the logged Claude-subscription
// wrapper. Every theory the model finds is screened
// (screenTopic(), same redline gate every other pipeline in this repo
// uses) and upserted into `fan_theory_candidate`, deduped by `theory_key`.
// A screen failure means the candidate is NEVER stored (see write-theory-
// candidate.ts's header — unlike current_item/fan_signal, this table has
// no "written but unservable" state; it never reaches the browser at all).
//
// Zero writes to Reddit or Facebook. This script never posts, replies, or
// interacts with either platform — same "a human always posts" guardrail
// as every other Community Engine component (plan header, §6.1).
//
// A missing or empty bundle is a clean no-op, including while the home
// reader's breaker is backing off.
//
// Needs Supabase service credentials, TYPESAFE_API_KEY and the Claude
// subscription token. Missing model availability is retryable per bundle.

import { readFileSync, existsSync } from 'node:fs';
import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';
import { getLoggedClaudeCaller } from '../lib/llm-usage.mjs';
import { createTheoryPrefilter } from './theory-bundles.mjs';

async function loadTheoryMinerStage() {
  return import(new URL('../../apps/worker/src/extract/run-theory-miner-stage.ts', import.meta.url).href);
}

function parseArgs(argv) {
  const out = {
    artifact: process.env.COMMUNITY_CRAWL_ARTIFACT || '.artifacts/home-reddit-crawl.json',
  };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--artifact' && argv[i + 1]) {
      out.artifact = argv[i + 1];
      i++;
    }
  }
  return out;
}

export { parseArgs };

export async function loadFacebookTheoryBundles(db) {
  const { data, error } = await db
    .from('fan_signal')
    .select('id, community, summary, volume, window_end')
    .eq('platform', 'facebook')
    .order('window_end', { ascending: false })
    .limit(50);
  if (error) throw new Error(`facebook theory summaries failed: ${error.message}`);
  const groups = new Map();
  for (const row of data ?? []) {
    if (!row.summary) continue;
    if (!groups.has(row.community)) groups.set(row.community, []);
    groups.get(row.community).push({
      postId: `facebook-${row.id}`,
      title: 'Facebook discussion summary',
      permalink: undefined,
      numComments: row.volume,
      comments: [{ author: null, body: row.summary }],
    });
  }
  return [...groups].map(([subreddit, posts]) => ({ subreddit, posts }));
}

export async function runTheoryMiner({
  argv = process.argv.slice(2),
  exists = existsSync,
  readFile = readFileSync,
  createServiceClient = serviceClient,
  loadStage = loadTheoryMinerStage,
  createPrefilter = createTheoryPrefilter,
  loadFacebookBundles = loadFacebookTheoryBundles,
  createLoggedClaudeCaller = getLoggedClaudeCaller,
} = {}) {
  const { artifact } = parseArgs(argv);

  if (!exists(artifact)) {
    console.log(
      `theory-miner: no crawl artifact at ${artifact} — nothing to mine this run ` +
        '(expected when COMMUNITY_CRAWL_ENABLED is off, or no crawl ran this cycle). Not a failure.',
    );
    return 0;
  }

  let parsed;
  try {
    parsed = JSON.parse(readFile(artifact, 'utf8'));
  } catch (err) {
    console.error(`theory-miner: could not parse crawl artifact at ${artifact}: ${err.message}`);
    return 1;
  }

  const subreddits = Array.isArray(parsed?.subreddits) ? parsed.subreddits : [];
  const totalPosts = subreddits.reduce((sum, s) => sum + (s.posts?.length ?? 0), 0);
  if (totalPosts === 0) {
    console.log('theory-miner: crawl artifact has zero post bundles — nothing to mine this run.');
    return 0;
  }

  const db = createServiceClient();
  if (!db) {
    console.log(
      'theory-miner: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — degrading to no-op.',
    );
    return 0;
  }

  let prefilter;
  try {
    prefilter = createPrefilter(db);
  } catch (error) {
    console.log(
      `theory-miner: Jev prefilter unavailable (${error.message}) — no bundles mined this run.`,
    );
    return 0;
  }

  let facebook = [];
  try {
    facebook = await loadFacebookBundles(db);
  } catch (error) {
    console.warn(`theory-miner: ${error.message}; continuing with Reddit bundles.`);
  }

  const { runTheoryMinerStage } = await loadStage();
  const claude = createLoggedClaudeCaller();
  const result = await runTheoryMinerStage(
    db,
    { subreddits: [...subreddits, ...facebook] },
    { priority: 'P3', shouldMine: prefilter.shouldMine, claude },
  );
  const jev = prefilter.stats();

  console.log(
    `theory-miner: ${result.bundlesConsidered} bundle(s) considered, ` +
      `${result.theoriesFound} theory(ies) found, ${result.theoriesUpserted} upserted, ` +
      `${result.theoriesScreenedOut} screened out, ${result.unchanged} unchanged, ` +
      `${result.prefiltered} Jev-negative, ${result.skipped} skipped (no theory), ` +
      `${result.deferred} deferred (subscription unavailable/cap reserved out).`,
  );
  console.log(`theory-miner: Jev ${jev.calls}/${jev.cap} call cap used; ${jev.capped} deferred.`);
  if (result.errors.length > 0) {
    console.error(`theory-miner: ${result.errors.length} error(s):`);
    for (const e of result.errors) console.error(`  • ${e}`);
  }
  return 0;
}

async function main() {
  return runTheoryMiner();
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/community/theory-miner.mjs')
) {
  runMain(main, { name: 'theory-miner' });
}
