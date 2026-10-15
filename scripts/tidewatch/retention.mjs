#!/usr/bin/env node
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { serviceClient } from '../lib/supabase.mjs';

export const WATCH_ITEM_RETENTION_DAYS = 180;
export const SHADOW_DECISION_RETENTION_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseArgs(argv) {
  const supported = new Set(['--apply', '--dry-run']);
  const unknown = argv.filter((arg) => !supported.has(arg));
  if (unknown.length > 0) throw new Error(`unknown argument(s): ${unknown.join(', ')}`);
  if (argv.includes('--apply') && argv.includes('--dry-run')) {
    throw new Error('--apply and --dry-run are mutually exclusive');
  }
  return { apply: argv.includes('--apply') };
}

function cutoff(now, days) {
  const timestamp = now instanceof Date ? now.getTime() : new Date(now).getTime();
  if (!Number.isFinite(timestamp)) throw new Error('now must be a valid date');
  return new Date(timestamp - days * DAY_MS).toISOString();
}

function checkedCount(result, label) {
  if (result.error) throw new Error(`${label} failed: ${result.error.message}`);
  return result.count ?? 0;
}

async function countExpired(client, itemCutoff, decisionCutoff) {
  const itemResult = await client
    .from('watch_item')
    .select('id', { count: 'exact', head: true })
    .lt('last_seen_at', itemCutoff);
  const decisionResult = await client
    .from('watch_decision')
    .select('id', { count: 'exact', head: true })
    .eq('shadow', true)
    .lt('decided_at', decisionCutoff);
  return {
    watchItems: checkedCount(itemResult, 'watch_item count'),
    shadowDecisions: checkedCount(decisionResult, 'watch_decision count'),
  };
}

async function deleteExpired(client, itemCutoff, decisionCutoff) {
  // Decisions go first; watch_item's SET NULL FK preserves newer/non-shadow
  // audit rows when their 180-day seen record expires.
  const decisionResult = await client
    .from('watch_decision')
    .delete({ count: 'exact' })
    .eq('shadow', true)
    .lt('decided_at', decisionCutoff);
  const itemResult = await client
    .from('watch_item')
    .delete({ count: 'exact' })
    .lt('last_seen_at', itemCutoff);
  return {
    watchItems: checkedCount(itemResult, 'watch_item delete'),
    shadowDecisions: checkedCount(decisionResult, 'watch_decision delete'),
  };
}

export async function runRetention(
  client,
  { apply = false, now = new Date(), log = console.log } = {},
) {
  if (!client) throw new Error('a service-role client is required');
  const itemCutoff = cutoff(now, WATCH_ITEM_RETENTION_DAYS);
  const decisionCutoff = cutoff(now, SHADOW_DECISION_RETENTION_DAYS);
  const counts = apply
    ? await deleteExpired(client, itemCutoff, decisionCutoff)
    : await countExpired(client, itemCutoff, decisionCutoff);
  const mode = apply ? 'deleted' : 'dry-run would delete';
  log(`retention: ${mode} ${counts.watchItems} watch_item row(s) last seen before ${itemCutoff}`);
  log(
    `retention: ${mode} ${counts.shadowDecisions} shadow watch_decision row(s) decided before ${decisionCutoff}`,
  );
  return { ...counts, dryRun: !apply, itemCutoff, decisionCutoff };
}

async function main() {
  const { apply } = parseArgs(process.argv.slice(2));
  const client = serviceClient();
  if (!client) {
    console.error(
      'tidewatch-retention: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (expected in apps/worker/.env).',
    );
    return 1;
  }
  await runRetention(client, { apply });
  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'tidewatch-retention' });
