#!/usr/bin/env node
// Theory merge/promote pass (Community Engine plan §3.3, Phase 2 card
// P2-3). docs/proposals/2026-09-06-community-engine-plan.md. Parents: P0-1
// (schema, merged) and P2-2 (Theory Miner extract, merged, PR #3962).
//
// WHAT THIS DOES: reads every `fan_theory_candidate` still
// `status='candidate'`, merges near-duplicates via the same deterministic
// name-similarity + symbol-overlap rule the live-news extract pipeline
// already uses (apps/worker/src/extract/theory-match.ts), and promotes any
// cluster that clears `PROMOTION_MENTION_THRESHOLD` mentions into
// `live_theory` (origin='fan', persistent=true) unless the fandom itself
// has debunked it. See apps/worker/src/extract/theory-promote.ts's header
// for the documented "deterministic, not a second LLM" scope decision.
//
// Weekly, per the plan's §4 workflow table ("weekly ... merge pass"). Zero
// writes to Reddit or Facebook — same "a human always posts" guardrail as
// every other Community Engine component.
//
//   node scripts/community/theory-promote.mjs
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Missing credentials
// degrade to a clean no-op log line, matching every other Community Engine
// script's scripts/lib/supabase.mjs contract.

import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';
import { runTheoryPromotePass } from '../../apps/worker/src/extract/write-theory-promotion.ts';

async function main() {
  const db = serviceClient();
  if (!db) {
    console.log(
      'theory-promote: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — degrading to no-op.',
    );
    return 0;
  }

  const result = await runTheoryPromotePass(db);

  console.log(
    `theory-promote: ${result.candidatesConsidered} candidate(s) considered, ` +
      `${result.clustersFormed} cluster(s) formed, ${result.promoted} promoted, ` +
      `${result.rejected} rejected, ${result.held} held (below mention threshold), ` +
      `${result.mergedRowsMarked} row(s) marked merged.`,
  );
  if (result.errors.length > 0) {
    console.error(`theory-promote: ${result.errors.length} error(s):`);
    for (const e of result.errors) console.error(`  • ${e}`);
  }
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/community/theory-promote.mjs')
) {
  runMain(main, { name: 'theory-promote' });
}
