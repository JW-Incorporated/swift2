#!/usr/bin/env node
// Restores current_item copy from current_item_copy_snapshot (the backfill's
// reversal path, docs/decisions.md 2026-11-03 §5). For each item the LATEST
// snapshot's headline/summary/detail is written back and facts/writing_score
// are set null.
//
// Usage:
//   node scripts/news/restore-copy-snapshot.mjs --id <current_item_id>
//   node scripts/news/restore-copy-snapshot.mjs --since <iso>
//   add --no-dry-run to write; dry run is the default.

import { serviceClient } from '../lib/supabase.mjs';
import { parseIsoDate } from './backfill-args.mjs';
import { runMain } from '../lib/cli.mjs';

export async function restoreSnapshots(db, { id, since, dryRun = true }) {
  if (!id && !since) throw new Error('restoreSnapshots needs id or since');
  let query = db.from('current_item_copy_snapshot')
    .select('id,current_item_id,headline,summary,detail,snapshot_at');
  query = id ? query.eq('current_item_id', id) : query.gte('snapshot_at', since);
  const { data, error } = await query.order('snapshot_at', { ascending: false });
  if (error) throw new Error(`snapshot load failed: ${error.message}`);

  const latest = new Map();
  for (const row of data ?? []) if (!latest.has(row.current_item_id)) latest.set(row.current_item_id, row);

  const result = { found: latest.size, restored: 0, errors: [] };
  for (const [itemId, snap] of latest) {
    if (dryRun) continue;
    const { error: updateError } = await db.from('current_item')
      .update({ headline: snap.headline, summary: snap.summary, detail: snap.detail, facts: null, writing_score: null })
      .eq('id', itemId);
    if (updateError) result.errors.push(`restore failed for ${itemId}: ${updateError.message}`);
    else result.restored++;
  }
  return result;
}

function parseArgs(argv) {
  const args = { id: undefined, since: undefined, dryRun: !argv.includes('--no-dry-run') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--id') args.id = argv[++i];
    else if (argv[i] === '--since') args.since = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.id && !args.since) {
    console.error('usage: restore-copy-snapshot.mjs --id <current_item_id> | --since <iso> [--no-dry-run]');
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
  const result = await restoreSnapshots(db, args);
  console.log(
    `restore-copy-snapshot: ${result.found} item(s) with a snapshot, ${result.restored} restored` +
      `${args.dryRun ? ' (DRY RUN, nothing written; pass --no-dry-run to restore)' : ''}.`,
  );
  for (const e of result.errors) console.error(`  • ${e}`);
  return result.errors.length > 0 ? 1 : 0;
}

if (process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/news/restore-copy-snapshot.mjs')) {
  runMain(main, { name: 'restore-copy-snapshot' });
}
