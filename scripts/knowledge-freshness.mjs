#!/usr/bin/env node
// Knowledge engine — freshness SLO (PLAN.md Stage 12, proposal §7 eval
// bullet item 2): "max(updated_at) where tier='current' in knowledge_doc"
// should be < 24h.
//
// Uses the SAME `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` credential the
// worker already reads (`apps/worker/src/db/client.ts`) — already a real
// GitHub Actions secret pair (`news-worker.yml`), so this needs no new
// secret and no HUMAN-ACTIONS item. Degrades to a clear skip, never a crash,
// when unset — same pattern as every other DB-dependent script tonight.
//
// REPORT, NOT A HARD FAIL (deliberate choice, see .github/workflows/
// watchdog.yml's own "Facebook export freshness" / cadence-check steps for
// the precedent): a real ingestion cadence takes hours to prove itself out —
// the Current tier has ZERO rows until Stage 3's extract stage has a live
// `ANTHROPIC_API_KEY` (HUMAN-ACTIONS.md #13, still open) and runs at least
// once. Hard-failing `build` on this would block every PR merge in this repo
// on an ops step no PR touches. This script's own exit code still
// distinguishes stale (1) from fresh (0) from skip/no-data (2) so a human
// or a script CAN gate on it deliberately — `watchdog.yml` is where that
// happens, via the standing open/close-an-issue pattern every other
// freshness check there already uses, not a `build`-blocking step.
//
//   node scripts/knowledge-freshness.mjs
//   node scripts/knowledge-freshness.mjs --max-age-hours 24

import { createWorkerDbClient } from '../apps/worker/src/db/client.ts';

const ARGV = process.argv.slice(2);
function flagValue(name) {
  const eq = ARGV.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(`--${name}=`.length);
  const i = ARGV.indexOf(`--${name}`);
  if (i !== -1 && ARGV[i + 1] && !ARGV[i + 1].startsWith('--')) return ARGV[i + 1];
  return null;
}
const MAX_AGE_HOURS = flagValue('max-age-hours') ? Number(flagValue('max-age-hours')) : 24;

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log(
      'knowledge-freshness: SKIPPING — SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set ' +
        '(expected in apps/worker/.env locally, or the news-worker GitHub Actions secrets in CI). ' +
        'Nothing was queried.',
    );
    return 2;
  }

  const db = createWorkerDbClient();
  const { data, error } = await db
    .from('knowledge_doc')
    .select('updated_at')
    .eq('tier', 'current')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error(`knowledge-freshness: query failed — ${error.message}`);
    return 2;
  }

  if (!data || data.length === 0) {
    console.log(
      "knowledge-freshness: no tier='current' rows exist yet — expected until the extract stage has a live " +
        'ANTHROPIC_API_KEY (HUMAN-ACTIONS.md #13) and runs at least once. Not itself evidence of staleness.',
    );
    return 2;
  }

  const newest = new Date(data[0].updated_at);
  const ageHours = (Date.now() - newest.getTime()) / (1000 * 60 * 60);
  const fresh = ageHours <= MAX_AGE_HOURS;

  console.log(
    `knowledge-freshness: newest tier='current' row updated ${ageHours.toFixed(1)}h ago ` +
      `(${newest.toISOString()}), SLO ${MAX_AGE_HOURS}h — ${fresh ? 'OK' : 'STALE'}.`,
  );

  return fresh ? 0 : 1;
}

process.exitCode = await main();
