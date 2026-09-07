#!/usr/bin/env node
// Theory Miner (C2) — Community Engine plan §3.3, Phase 2 card P2-2.
// docs/proposals/2026-09-06-community-engine-plan.md. Parents: P0-1
// (schema, merged) and P2-1 (community-crawl.yml, merged — note
// COMMUNITY_CRAWL_ENABLED is OFF by default, so this stage has nothing to
// consume until a founder turns crawling on; that is expected, not a
// fault, and this script degrades to a clean no-op in that case).
//
// WHAT THIS DOES: reads the transient JSON bundle community-crawl.yml
// (P2-1) uploaded as a 24h Actions artifact — one post + comment-thread
// bundle per crawled subreddit post, hashed authors, no raw handles (see
// crawl.mjs's own header) — and, for every bundle, makes one Haiku call
// via apps/worker/src/extract/theory-haiku-client.ts's forced
// `record_fan_theories` tool. Every theory the model finds is screened
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
// No separate kill switch: the crawl's own COMMUNITY_CRAWL_ENABLED
// (default OFF) is the real gate — when it's off, community-crawl.yml
// produces no artifact for this workflow to download, so this script has
// nothing to do and exits 0 with a log line. When the crawl IS enabled but
// this run finds no artifact (e.g. a manual dispatch with no preceding
// crawl this cycle), that is the SAME clean no-op, not a failure.
//
//   node scripts/community/theory-miner.mjs --artifact .artifacts/community-crawl.json
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (read symbol_lexicon,
// write fan_theory_candidate) and ANTHROPIC_API_KEY (Haiku extract calls;
// already exists per the plan's §4 workflow table — "ANTHROPIC_API_KEY
// already exists"). Missing Supabase creds degrade to a clean no-op log
// line, matching every other Community Engine script's
// scripts/lib/supabase.mjs contract; a missing ANTHROPIC_API_KEY is
// per-bundle (theory-haiku-client.ts's extractFanTheories returns null,
// counted as `deferred`), not a whole-run failure.

import { readFileSync, existsSync } from 'node:fs';
import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';
import { runTheoryMinerStage } from '../../apps/worker/src/extract/run-theory-miner-stage.ts';

function parseArgs(argv) {
  const out = {
    artifact: process.env.COMMUNITY_CRAWL_ARTIFACT || '.artifacts/community-crawl.json',
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

async function main() {
  const { artifact } = parseArgs(process.argv.slice(2));

  if (!existsSync(artifact)) {
    console.log(
      `theory-miner: no crawl artifact at ${artifact} — nothing to mine this run ` +
        '(expected when COMMUNITY_CRAWL_ENABLED is off, or no crawl ran this cycle). Not a failure.',
    );
    return 0;
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(artifact, 'utf8'));
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

  const db = serviceClient();
  if (!db) {
    console.log(
      'theory-miner: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — degrading to no-op.',
    );
    return 0;
  }

  const result = await runTheoryMinerStage(db, { subreddits });

  console.log(
    `theory-miner: ${result.bundlesConsidered} bundle(s) considered, ` +
      `${result.theoriesFound} theory(ies) found, ${result.theoriesUpserted} upserted, ` +
      `${result.theoriesScreenedOut} screened out, ${result.skipped} skipped (no theory), ` +
      `${result.deferred} deferred (no key/cap reserved out).`,
  );
  if (result.errors.length > 0) {
    console.error(`theory-miner: ${result.errors.length} error(s):`);
    for (const e of result.errors) console.error(`  • ${e}`);
  }
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/community/theory-miner.mjs')
) {
  runMain(main, { name: 'theory-miner' });
}
