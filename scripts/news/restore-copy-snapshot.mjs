#!/usr/bin/env node
// Restores current_item copy from current_item_copy_snapshot (the backfill's
// reversal path, docs/decisions.md 2026-11-03 §5). For each item the LATEST
// snapshot's headline/summary/detail is written back. A snapshot that carries
// facts (BACKFILL_MODE=rewrite) also restores facts and writing_score; one
// without (force/floors snapshots) sets both null, as before.
//
// Usage:
//   node scripts/news/restore-copy-snapshot.mjs --id <current_item_id>
//   node scripts/news/restore-copy-snapshot.mjs --since <iso>
//   node scripts/news/restore-copy-snapshot.mjs --clear-retired [--id <current_item_id>] [--since <iso>]
//     un-hides rows the force backfill retired (quality_hold_reason 'retired_below_floor', 'retired_duplicate' or 'retired_unwritable').
//   add --no-dry-run to write; dry run is the default.

import { serviceClient } from '../lib/supabase.mjs';
import { parseIsoDate } from './backfill-args.mjs';
import { runMain } from '../lib/cli.mjs';

export async function restoreSnapshots(db, { id, since, dryRun = true }) {
  if (!id && !since) throw new Error('restoreSnapshots needs id or since');
  let query = db.from('current_item_copy_snapshot')
    .select('id,current_item_id,headline,summary,detail,facts,writing_score,snapshot_at');
  query = id ? query.eq('current_item_id', id) : query.gte('snapshot_at', since);
  const { data, error } = await query.order('snapshot_at', { ascending: false });
  if (error) throw new Error(`snapshot load failed: ${error.message}`);

  const latest = new Map();
  for (const row of data ?? []) if (!latest.has(row.current_item_id)) latest.set(row.current_item_id, row);

  const result = { found: latest.size, restored: 0, errors: [] };
  for (const [itemId, snap] of latest) {
    if (dryRun) continue;
    const { error: updateError } = await db.from('current_item')
      .update({
        headline: snap.headline, summary: snap.summary, detail: snap.detail,
        facts: snap.facts ?? null, writing_score: snap.facts ? (snap.writing_score ?? null) : null,
      })
      .eq('id', itemId);
    if (updateError) result.errors.push(`restore failed for ${itemId}: ${updateError.message}`);
    else result.restored++;
  }
  return result;
}

export const RETIRED_HOLD_REASON = 'retired_below_floor';
export const RETIRED_HOLD_REASONS = [RETIRED_HOLD_REASON, 'retired_duplicate', 'retired_unwritable'];
const RETIRE_SNAPSHOT_REASONS = ['retire_below_floor', 'retire_duplicate', 'retire_unwritable'];

/** Undoes --retire-below-floor: clears the hold reason and re-shows the row (the read-time gate still applies). */
export async function clearRetired(db, { id, since, dryRun = true } = {}) {
  let query = db.from('current_item').select('id,quality_hold_reason').in('quality_hold_reason', RETIRED_HOLD_REASONS).is('retracted_at', null);
  if (id) query = query.eq('id', id);
  const { data, error } = await query;
  if (error) throw new Error(`retired load failed: ${error.message}`);
  let rows = data ?? [];
  if (since) {
    const { data: snaps, error: snapError } = await db.from('current_item_copy_snapshot')
      .select('current_item_id').in('reason', RETIRE_SNAPSHOT_REASONS).gte('snapshot_at', since);
    if (snapError) throw new Error(`retire snapshot load failed: ${snapError.message}`);
    const retiredSince = new Set((snaps ?? []).map((snap) => snap.current_item_id));
    rows = rows.filter((row) => retiredSince.has(row.id));
  }
  const result = { found: rows.length, restored: 0, errors: [] };
  for (const { id: itemId, quality_hold_reason: reason } of rows) {
    if (dryRun) continue;
    const { error: updateError } = await db.from('current_item')
      .update({ redline_ok: true, quality_hold_reason: null, ...(reason === 'retired_duplicate' ? { merged_into: null } : {}) })
      .eq('id', itemId)
      .eq('quality_hold_reason', reason)
      .is('retracted_at', null);
    if (updateError) result.errors.push(`clear failed for ${itemId}: ${updateError.message}`);
    else result.restored++;
  }
  return result;
}

function parseArgs(argv) {
  const args = { id: undefined, since: undefined, clearRetired: argv.includes('--clear-retired'), dryRun: !argv.includes('--no-dry-run') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--id') args.id = argv[++i];
    else if (argv[i] === '--since') args.since = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.id && !args.since && !args.clearRetired) {
    console.error('usage: restore-copy-snapshot.mjs --id <current_item_id> | --since <iso> | --clear-retired [--id <current_item_id>] [--since <iso>] [--no-dry-run]');
    return 1;
  }
  if (args.since) {
    try {
      args.since = parseIsoDate(args.since);
    } catch (err) {
      console.error(`restore-copy-snapshot: ${err.message}`);
      return 1;
    }
  }
  const db = serviceClient();
  if (!db) {
    console.log('restore-copy-snapshot: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set — degrading to no-op.');
    return 0;
  }
  const result = args.clearRetired ? await clearRetired(db, args) : await restoreSnapshots(db, args);
  console.log(
    `restore-copy-snapshot: ${result.found} item(s) ${args.clearRetired ? 'retired' : 'with a snapshot'}, ${result.restored} restored` +
      `${args.dryRun ? ' (DRY RUN, nothing written; pass --no-dry-run to restore)' : ''}.`,
  );
  for (const e of result.errors) console.error(`  • ${e}`);
  return result.errors.length > 0 ? 1 : 0;
}

if (process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/news/restore-copy-snapshot.mjs')) {
  runMain(main, { name: 'restore-copy-snapshot' });
}
