#!/usr/bin/env node
// ONE-OFF maintenance script — NOT part of the shipped codebase.
// Kanban task t_c623b419: retroactively mark 10 leads posted (see card body
// for full context). Calls packages/core/src/community-ack.ts's ackPosted()
// directly against production Supabase since the HTTP ack route is 503ing
// (COMMUNITY_ACK_SECRET unset in Vercel prod — tracked separately in
// HUMAN-ACTIONS.md #49). Reuses scripts/lib/supabase.mjs's serviceClient
// (same SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY pair every Community
// Engine script already uses). Prints one JSON line per lead; exits
// non-zero if any lead failed for a reason other than not_found.
import { serviceClient } from '../lib/supabase.mjs';
import { ackPosted } from '../../packages/core/src/community-ack.ts';

const LEAD_IDS = [
  '4d8cd563-f67b-4ed5-814f-734a4c096921',
  'd79c4b39-54dc-459d-9a9c-6e2dcbebe0f4',
  '03354049-6327-4fb0-90a8-4f656a7e9e68',
  'df3dfc14-ba33-4a63-89f6-f78eecae188a',
  '260e8df5-1525-44b9-8956-e5ace87693c3',
  '58f0f5b9-a78c-4250-a030-c65093a9c1bd',
  '6e83a947-09ad-4243-8f06-2530fb9f25ba',
  '2e1e2d2e-f21c-4a14-9f0a-ff9c9fcbd8c8',
  '6de9ecbd-1fea-461f-8b31-d1465977e7d9',
  '2c9e5ae1-a70e-40d0-a212-1a8478612f89',
];

async function main() {
  const db = serviceClient();
  if (!db) {
    console.error('FAIL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
    return 1;
  }

  let failures = 0;
  for (const leadId of LEAD_IDS) {
    const outcome = await ackPosted(db, leadId, false);
    console.log(JSON.stringify({ leadId, ...outcome }));
    if (!outcome.ok) failures += 1;
  }

  // Verification pass: read back status + ledger + counter.
  const { data: leads, error: leadsErr } = await db
    .from('engagement_lead')
    .select('id,status,link_included')
    .in('id', LEAD_IDS);
  if (leadsErr) {
    console.error('VERIFY FAIL (engagement_lead select):', leadsErr.message);
    failures += 1;
  } else {
    for (const l of leads) console.log(JSON.stringify({ verify: 'engagement_lead', ...l }));
    const notPosted = leads.filter((l) => l.status !== 'posted');
    if (notPosted.length) {
      console.error('VERIFY FAIL: leads not in posted status:', JSON.stringify(notPosted));
      failures += 1;
    }
  }

  const { data: ledgerRows, error: ledgerErr } = await db
    .from('community_post_ledger')
    .select('lead_id,platform,link_included')
    .in('lead_id', LEAD_IDS);
  if (ledgerErr) {
    console.error('VERIFY FAIL (community_post_ledger select):', ledgerErr.message);
    failures += 1;
  } else {
    console.log(JSON.stringify({ verify: 'community_post_ledger', count: ledgerRows.length }));
    if (ledgerRows.length < LEAD_IDS.length) {
      console.error('VERIFY FAIL: ledger row count < lead count', ledgerRows.length);
      failures += 1;
    }
  }

  const { data: counterRows, error: counterErr } = await db
    .from('community_counters')
    .select('id,value')
    .eq('id', 'reddit_non_promo');
  if (counterErr) {
    console.error('VERIFY WARN (community_counters select):', counterErr.message);
  } else {
    console.log(JSON.stringify({ verify: 'community_counters', rows: counterRows }));
  }

  return failures > 0 ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error('FATAL:', err);
    process.exit(1);
  });
