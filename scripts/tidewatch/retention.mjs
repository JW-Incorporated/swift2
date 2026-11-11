#!/usr/bin/env node

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { makeClient } from '../lib/pg.mjs';

export const UNSEEN_ITEM_RETENTION_DAYS = 180;
export const NOISE_ITEM_RETENTION_DAYS = 30;
export const SHADOW_DECISION_RETENTION_DAYS = 365;

// Candidate selection and deletion deliberately live in one statement. This
// keeps a dry-run preview identical to the set an apply run would delete.
export const RETENTION_SQL = `
with latest_decision as (
  select distinct on (item_id) item_id, class as latest_class
  from public.watch_decision
  where item_id is not null
  order by item_id, decided_at desc, id desc
), item_candidates as (
  select item.id
  from public.watch_item as item
  left join latest_decision as decision on decision.item_id = item.id
  where item.last_seen_at < $1::timestamptz - interval '${UNSEEN_ITEM_RETENTION_DAYS} days'
     or (
       decision.latest_class is not distinct from 'noise'
       and item.last_seen_at < $1::timestamptz - interval '${NOISE_ITEM_RETENTION_DAYS} days'
     )
), decision_candidates as (
  select id
  from public.watch_decision
  where shadow is true
    and decided_at < $1::timestamptz - interval '${SHADOW_DECISION_RETENTION_DAYS} days'
), deleted_items as (
  delete from public.watch_item
  where $2::boolean
    and id in (select id from item_candidates)
  returning id
), deleted_decisions as (
  delete from public.watch_decision
  where $2::boolean
    and id in (select id from decision_candidates)
  returning id
)
select
  case when $2::boolean
    then (select count(*)::int from deleted_items)
    else (select count(*)::int from item_candidates)
  end as watch_items,
  case when $2::boolean
    then (select count(*)::int from deleted_decisions)
    else (select count(*)::int from decision_candidates)
  end as watch_decisions
`;

/** Run retention against an injected pg-compatible client. */
export async function runRetention(client, { apply = false, now = new Date() } = {}) {
  const instant = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const { rows } = await client.query(RETENTION_SQL, [instant, apply]);
  const row = rows[0];
  return {
    dryRun: !apply,
    watchItems: Number(row.watch_items),
    watchDecisions: Number(row.watch_decisions),
  };
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const unknown = argv.filter((arg) => arg !== '--dry-run' && arg !== '--apply');
  if (unknown.length > 0 || (argv.includes('--dry-run') && argv.includes('--apply'))) {
    throw new Error('usage: retention.mjs [--dry-run | --apply]');
  }

  const apply = argv.includes('--apply');
  const connectionString = deps.connectionString ?? process.env.SUPABASE_DB_URL;
  if (!connectionString && !deps.client) {
    throw new Error('SUPABASE_DB_URL not set (expected in apps/worker/.env)');
  }

  const client = deps.client ?? makeClient(connectionString);
  const ownsClient = !deps.client;
  if (ownsClient) await client.connect();
  try {
    const result = await runRetention(client, { apply, now: deps.now });
    const mode = apply ? 'deleted' : 'would delete';
    (deps.log ?? console.log)(
      `tidewatch retention: ${mode} ${result.watchItems} watch item(s) and ${result.watchDecisions} shadow decision(s)${apply ? '' : ' (dry-run; pass --apply to delete)'}.`,
    );
    return result;
  } finally {
    if (ownsClient) await client.end();
  }
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'tidewatch-retention' });
}
