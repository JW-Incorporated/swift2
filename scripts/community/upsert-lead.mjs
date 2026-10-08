#!/usr/bin/env node
// Idempotent insert for a single `engagement_lead` row, called by
// scripts/community/inbox.py (community-inbox.yml, Flow E1/E3,
// docs/proposals/2026-09-06-community-engine-plan.md §2.1/§2.3). Isolated
// in its own tiny script rather than giving inbox.py a Postgres driver: the
// repo's DB access convention (scripts/lib/pg.mjs, SUPABASE_DB_URL) is
// Node-only, and Python has no equivalent in this repo's dependency set.
//
// Idempotency: relies on the migration's own
// `engagement_lead_dedupe_idx` unique index on
// `(platform, coalesce(thread_id, locator), kind)` rather than tracking
// the source email's Message-ID separately — a given Reddit thread+kind
// combination is deterministic regardless of which (or how many) emails
// mentioned it, so `ON CONFLICT ... DO NOTHING` makes a re-processed email
// (e.g. a crash between insert and \Seen) a safe no-op: same row, no
// duplicate, no error. Reddit only; Facebook leads are P1-3's job.
//
// Usage: one JSON object on stdin —
//   { platform, community, kind, threadId, url, title, context }
// Prints `{ inserted: boolean, id: string|null }` as JSON on stdout.
// `inserted: false` means the dedupe index already had this lead (not an
// error) or DRY_RUN skipped the write entirely.
import { makeClient } from '../lib/pg.mjs';
import { runMain } from '../lib/cli.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const lead = JSON.parse(await readStdin());
  const {
    platform,
    community,
    kind,
    threadId = null,
    url = null,
    title = null,
    context = null,
  } = lead;
  if (!platform || !community || !kind) {
    console.error('lead requires platform, community, kind');
    return 1;
  }
  if (process.env.DRY_RUN === 'true') {
    console.log(JSON.stringify({ inserted: false, id: null, dryRun: true }));
    return 0;
  }

  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.error('SUPABASE_DB_URL not set');
    return 1;
  }

  const client = makeClient(connectionString);
  await client.connect();
  try {
    const result = await client.query(
      `insert into public.engagement_lead (platform, community, kind, thread_id, url, title, context)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (platform, coalesce(thread_id, locator), kind) do nothing
       returning id`,
      [platform, community, kind, threadId, url, title, context],
    );
    if (result.rows.length > 0) {
      console.log(JSON.stringify({ inserted: true, id: result.rows[0].id }));
    } else {
      console.log(JSON.stringify({ inserted: false, id: null }));
    }
  } finally {
    await client.end();
  }
  return 0;
}

runMain(main, { name: 'community-upsert-lead' });
