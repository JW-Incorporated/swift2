#!/usr/bin/env node
// Applies a founder's `posted <id>` / `skip <id>` reply (Flow E1's
// fallback path, docs/proposals/2026-09-06-community-engine-plan.md §2.6:
// "Fallback if Joey prefers replying by email: community-inbox.yml also
// parses founder replies of the form posted <id> / skip <id>") directly to
// `engagement_lead.status`, bypassing the HMAC ack route (P1-5, not built
// yet) since this is a DKIM-verified founder-authored email, the same
// trust level the ack route itself relies on.
//
// Idempotent by construction: setting status='posted' (or 'skipped_redline'
// as the email-fallback's "skip" verb) on a row that already has that
// status is a harmless no-op, so no separate Message-ID tracking is
// needed here either (unlike a Postgres INSERT, this UPDATE has no
// duplicate-row failure mode to guard against).
//
// Usage: node mark-lead-status.mjs <lead-uuid> <posted|skip>
// Prints `{ updated: boolean }` as JSON on stdout. `updated: false` means
// no row with that id exists (bad/stale id in the founder's reply) or
// DRY_RUN skipped the write.
import { makeClient } from '../lib/pg.mjs';
import { runMain } from '../lib/cli.mjs';

const STATUS_FOR_VERB = {
  posted: 'posted',
  skip: 'skipped_redline', // reuses the schema's closest existing skip status; ledger-worthy detail lives in the comment thread, not a new enum value
};

async function main() {
  const [leadId, verb] = process.argv.slice(2);
  const status = STATUS_FOR_VERB[verb];
  if (!leadId || !status) {
    console.error('usage: mark-lead-status.mjs <lead-uuid> <posted|skip>');
    return 1;
  }
  if (process.env.DRY_RUN === 'true') {
    console.log(JSON.stringify({ updated: false, dryRun: true }));
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
    const column = status === 'posted' ? 'posted_at' : null;
    const result = await client.query(
      column
        ? `update public.engagement_lead set status = $2, posted_at = now() where id = $1 returning id`
        : `update public.engagement_lead set status = $2 where id = $1 returning id`,
      [leadId, status],
    );
    console.log(JSON.stringify({ updated: result.rows.length > 0 }));
  } finally {
    await client.end();
  }
  return 0;
}

runMain(main, { name: 'community-mark-lead-status' });
