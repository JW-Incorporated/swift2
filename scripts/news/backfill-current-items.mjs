#!/usr/bin/env node
// Content fix 5/6 backfill (content-fix-cards.md Card 5): re-enrich every
// existing, live `current_item` — resolve a missing image (Card 1/#5628),
// rewrite thin copy from the full article (Card 2/#5627), re-run the
// shared publish gate (Card 3/#5629) — via
// `apps/worker/src/extract/backfill-run.ts`'s `runBackfill`, which reuses the
// exact same pipeline code the ordinary worker cycle calls. Nothing here
// deduplicates stories — that is content-fix/7-llm-dedupe's job; this
// script only ever touches one row's own image/copy/quality fields, and
// never deletes a row: an item still failing after rewriting stays held
// (`redline_ok=false`, `quality_hold_reason` set), same as a fresh
// extraction's own write path.
//
// Usage:
//   node scripts/news/backfill-current-items.mjs            # dry run (default)
//   node scripts/news/backfill-current-items.mjs --no-dry-run
// Force mode (BACKFILL_MODE=force) also takes --days N (BACKFILL_DAYS; default = the
// live feed's own window) and --retire-below-floor (BACKFILL_RETIRE_BELOW_FLOOR=true):
// rows failing the worth-a-post floor are hidden, never deleted (undo: restore-copy-snapshot.mjs --clear-retired);
// --retire-unwritable (BACKFILL_RETIRE_UNWRITABLE=true) does the same for rows ending no_facts or writing_hold.
// Rewrite mode (BACKFILL_MODE=rewrite) re-runs the writer on live rows that already have facts (optional
// BACKFILL_IDS=<uuid,uuid>, plus days/limit); it never retires and rejects both retire flags.
//
// Needs SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (degrades to a clean
// no-op, same contract as every other privileged Community Engine script —
// scripts/lib/supabase.mjs's header). CLAUDE_CODE_OAUTH_TOKEN is optional:
// unset means every thin item's rewrite step defers (reported, not an error),
// same as the live extract stage's own missing-subscription posture.
//
// DRY RUN NEVER WRITES current_item (or snapshot) rows, though LLM budget rows in usage_daily are incremented: every row is still resolved/rewritten/re-screened
// for real (so the printed report reflects the real would-be outcome, not
// a guess) — `runBackfill`'s `dryRun: true` only skips the final
// `current_item` update.

import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseDays, parseIds, parseLimit } from './backfill-args.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { runMain } from '../lib/cli.mjs';
import { runBackfill } from '../../apps/worker/src/extract/backfill-run.ts';

function parseDryRun(argv) {
  if (argv.includes('--no-dry-run')) return false;
  if (argv.includes('--dry-run')) return true;
  // Matches merch-audit-detect.yml's workflow_dispatch input contract: an
  // explicit env var lets the Actions workflow pass its boolean `dry_run`
  // input through without the caller needing to construct argv flags.
  if (process.env.BACKFILL_DRY_RUN === 'false') return false;
  if (process.env.BACKFILL_DRY_RUN === 'true') return true;
  return true; // default true — "do no harm" until a human opts into a real run
}

function reportLine(r) {
  const img = `image ${r.imageBefore ? 'had' : 'none'}->${r.imageAfter ? 'has' : 'none'}`;
  const len = `summary ${r.summaryLenBefore}->${r.summaryLenAfter} chars`;
  const copy = r.rewroteCopy ? 'rewrote copy' : r.deferred ? 'rewrite deferred' : 'copy unchanged';
  const verdict = r.finalOk ? 'PASS' : `HOLD (${r.holdReason})`;
  return `  [${r.id}] "${r.headline}" — ${img}, ${len}, ${copy} — ${verdict}`;
}

async function main() {
  const dryRun = parseDryRun(process.argv.slice(2));
  const db = serviceClient();
  if (!db) {
    console.log(
      'backfill-current-items: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — degrading to no-op.',
    );
    return 0;
  }

  console.log(`backfill-current-items: starting (${dryRun ? 'DRY RUN — no current_item or snapshot writes; LLM budget counters still increment' : 'LIVE — writing back'})`);
  const mode = ['force', 'rewrite'].includes(process.env.BACKFILL_MODE) ? process.env.BACKFILL_MODE : 'floors';
  const argv = process.argv.slice(2);
  const daysArg = argv.indexOf('--days');
  const retireBelowFloor = argv.includes('--retire-below-floor') || process.env.BACKFILL_RETIRE_BELOW_FLOOR === 'true';
  const retireUnwritable = argv.includes('--retire-unwritable') || process.env.BACKFILL_RETIRE_UNWRITABLE === 'true';
  let limit;
  let days;
  let ids;
  try {
    limit = parseLimit(process.env.BACKFILL_LIMIT);
    days = parseDays(daysArg >= 0 ? argv[daysArg + 1] : process.env.BACKFILL_DAYS);
    ids = parseIds(process.env.BACKFILL_IDS);
    if (mode === 'rewrite' && (retireBelowFloor || retireUnwritable)) {
      throw new Error('rewrite mode never retires: retire_below_floor and retire_unwritable are not allowed');
    }
    if (ids && mode !== 'rewrite') throw new Error('ids is only valid with mode=rewrite');
  } catch (err) {
    console.error(`backfill-current-items: ${err.message}`);
    return 1;
  }
  const result = await runBackfill(db, {
    dryRun,
    mode,
    ...(limit > 0 ? { limit } : {}),
    ...(mode !== 'floors' && days !== undefined ? { days } : {}),
    ...(mode === 'rewrite' && ids ? { ids } : {}),
    ...(mode === 'force' && retireBelowFloor ? { retireBelowFloor } : {}),
    ...(mode === 'force' && retireUnwritable ? { retireUnwritable } : {}),
    ...(mode !== 'floors' ? { reportDir: process.env.BACKFILL_REPORT_DIR || join(process.env.RUNNER_TEMP || tmpdir(), 'backfill-report') } : {}),
  });
  if (result.force) {
    const f = result.force;
    console.log(
      `backfill-current-items: force mode — ${f.eligible} eligible, ${f.processed} processed, ${f.passed} pass, ` +
        `${f.held} held (copy untouched unless retired), ${f.retired} retired below floor, ` +
        `${f.duplicateGroups.length} duplicate group(s) (${f.retiredDuplicates} retired as duplicate, ${f.duplicatesFound} found), ` +
        `${f.retiredUnwritable} retired unwritable (${f.unwritableFound} found), ${f.skippedWriteFailures} write failure(s), ` +
        `${f.skippedUnservable} skipped_unservable${Object.keys(f.skippedUnservableReasons).length ? ` (${Object.entries(f.skippedUnservableReasons).map(([k, v]) => `${k}: ${v}`).join(', ')})` : ''}, ` +
        `${f.deferred ? `deferred with ${f.remaining} remaining (re-run continues)` : 'not deferred'}.`,
    );
  }

  console.log('');
  console.log('Per-item report:');
  for (const r of result.reports) console.log(reportLine(r));
  console.log('');
  console.log(
    `backfill-current-items: ${result.considered} considered, ${result.rewritten} copy rewrite(s), ` +
      `${result.imagesResolved} image(s) newly resolved, ${result.nowPassing} now passing, ` +
      `${result.stillHeld} still held, ${result.deferred} deferred (no budget/key), ` +
      `${result.wroteBack} written back.`,
  );
  if (result.errors.length > 0) {
    console.error(`backfill-current-items: ${result.errors.length} error(s):`);
    for (const e of result.errors) console.error(`  • ${e}`);
  }
  return 0;
}

if (
  process.argv[1] &&
  process.argv[1].split('\\').join('/').endsWith('scripts/news/backfill-current-items.mjs')
) {
  runMain(main, { name: 'backfill-current-items' });
}
