#!/usr/bin/env node
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { makeClient } from '../lib/pg.mjs';

export const NOISE_ITEM_RETENTION_DAYS = 30;
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

const LATEST_DECISION_CLASS = `(
  select wd.class
  from public.watch_decision wd
  where wd.item_id = item.id
  order by wd.decided_at desc, wd.id desc
  limit 1
)`;

async function countRows(client, label, sql, values) {
  const result = await client.query(sql, values);
  const count = result.rows?.[0]?.count;
  if (!Number.isInteger(count)) throw new Error(`${label} returned an invalid count`);
  return count;
}

async function deleteRows(client, label, sql, values) {
  const result = await client.query(sql, values);
  if (!Number.isInteger(result.rowCount)) throw new Error(`${label} returned an invalid count`);
  return result.rowCount;
}

async function countExpired(client, noiseItemCutoff, itemCutoff, decisionCutoff) {
  const noiseItems = await countRows(
    client,
    'noise watch_item count',
    `select count(*)::integer as count
       from public.watch_item item
      where item.last_seen_at < $1
        and ${LATEST_DECISION_CLASS} = 'noise'`,
    [noiseItemCutoff],
  );
  const watchItems = await countRows(
    client,
    'watch_item count',
    `select count(*)::integer as count
       from public.watch_item item
      where item.last_seen_at < $1
        and not (item.last_seen_at < $2 and ${LATEST_DECISION_CLASS} = 'noise')`,
    [itemCutoff, noiseItemCutoff],
  );
  const shadowDecisions = await countRows(
    client,
    'watch_decision count',
    `select count(*)::integer as count
       from public.watch_decision
      where shadow = true and decided_at < $1`,
    [decisionCutoff],
  );
  return {
    noiseItems,
    watchItems,
    shadowDecisions,
  };
}

async function deleteExpired(client, noiseItemCutoff, itemCutoff, decisionCutoff) {
  const noiseItems = await deleteRows(
    client,
    'noise watch_item delete',
    `delete from public.watch_item item
      where item.last_seen_at < $1
        and ${LATEST_DECISION_CLASS} = 'noise'`,
    [noiseItemCutoff],
  );
  const watchItems = await deleteRows(
    client,
    'watch_item delete',
    'delete from public.watch_item where last_seen_at < $1',
    [itemCutoff],
  );
  const shadowDecisions = await deleteRows(
    client,
    'watch_decision delete',
    'delete from public.watch_decision where shadow = true and decided_at < $1',
    [decisionCutoff],
  );
  return {
    noiseItems,
    watchItems,
    shadowDecisions,
  };
}

export async function runRetention(
  client,
  { apply = false, now = new Date(), log = console.log } = {},
) {
  if (!client) throw new Error('a database client is required');
  const noiseItemCutoff = cutoff(now, NOISE_ITEM_RETENTION_DAYS);
  const itemCutoff = cutoff(now, WATCH_ITEM_RETENTION_DAYS);
  const decisionCutoff = cutoff(now, SHADOW_DECISION_RETENTION_DAYS);
  const counts = apply
    ? await deleteExpired(client, noiseItemCutoff, itemCutoff, decisionCutoff)
    : await countExpired(client, noiseItemCutoff, itemCutoff, decisionCutoff);
  const mode = apply ? 'deleted' : 'dry-run would delete';
  log(
    `retention: ${mode} ${counts.noiseItems} noise watch_item row(s) last seen before ${noiseItemCutoff}`,
  );
  log(`retention: ${mode} ${counts.watchItems} watch_item row(s) last seen before ${itemCutoff}`);
  log(
    `retention: ${mode} ${counts.shadowDecisions} shadow watch_decision row(s) decided before ${decisionCutoff}`,
  );
  return { ...counts, dryRun: !apply, noiseItemCutoff, itemCutoff, decisionCutoff };
}

async function main() {
  const { apply } = parseArgs(process.argv.slice(2));
  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('tidewatch-retention: SUPABASE_DB_URL not set (expected in apps/worker/.env).');
    return 1;
  }
  const client = makeClient(connectionString);
  await client.connect();
  try {
    await runRetention(client, { apply });
  } finally {
    await client.end();
  }
  return 0;
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'tidewatch-retention' });
