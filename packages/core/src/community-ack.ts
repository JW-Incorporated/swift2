// Community Engine Phase 1 card P1-5 — the "did we already comment" write
// path for the ack route (docs/proposals/2026-09-06-community-engine-plan.md
// §2.6/§5). Mirrors devices.ts's convention: takes a `SupabaseClient`
// directly so it's unit-testable against a fake client, server-only (the
// ack route runs with the Supabase SERVICE ROLE key — `engagement_lead`,
// `community_post_ledger` and `community_counters` all ship RLS-enabled
// with no anon/authenticated policy, same posture as every other Community
// Engine table).
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommunityPlatform } from '@swift2/shared/community';

export interface EngagementLeadRow {
  id: string;
  platform: CommunityPlatform;
  community: string;
  thread_id: string | null;
  locator: string | null;
  link_included: boolean | null;
  status: string;
}

export type AckOutcome =
  | { ok: true; alreadyActed: boolean }
  | { ok: false; error: 'not_found' | 'db_error'; message?: string };

/**
 * Marks a lead `posted`, appends the `community_post_ledger` row the plan's
 * §2.6 calls "the did we already comment truth" (what E2's dedupe reads),
 * and — only when the post carried no link (Reddit etiquette, §6.5) —
 * bumps the `redditNonPromo` counter via the `increment_community_counter`
 * RPC from `20260918000000_community_ack.sql`.
 *
 * Idempotent by design (GET route, a founder can click a mail link twice,
 * an email client can prefetch links): a lead already in a terminal state
 * (`posted`/`skipped_by_founder`/desk-set `skipped_*`) returns
 * `alreadyActed: true` and performs NO further writes — the ledger row and
 * counter bump must never double-fire on a re-click or a link-prefetch bot.
 */
export async function ackPosted(
  db: SupabaseClient,
  leadId: string,
  linkIncluded: boolean,
  postedBy?: string,
): Promise<AckOutcome> {
  const { data: lead, error: fetchError } = await db
    .from('engagement_lead')
    .select('id,platform,community,thread_id,locator,link_included,status')
    .eq('id', leadId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: 'db_error', message: fetchError.message };
  if (!lead) return { ok: false, error: 'not_found' };

  const row = lead as EngagementLeadRow;
  if (row.status === 'posted' || row.status.startsWith('skipped')) {
    return { ok: true, alreadyActed: true };
  }

  const { error: updateError } = await db
    .from('engagement_lead')
    .update({ status: 'posted', link_included: linkIncluded, posted_at: new Date().toISOString() })
    .eq('id', leadId);
  if (updateError) return { ok: false, error: 'db_error', message: updateError.message };

  const { error: ledgerError } = await db.from('community_post_ledger').insert({
    lead_id: row.id,
    platform: row.platform,
    community: row.community,
    thread_id: row.thread_id,
    comment_target: row.thread_id ?? row.locator,
    link_included: linkIncluded,
    posted_by: postedBy ?? null,
  });
  if (ledgerError) return { ok: false, error: 'db_error', message: ledgerError.message };

  // Etiquette ledger (§6.5): only a link-free Reddit contribution counts
  // toward the 20-post threshold that unlocks linking.
  if (!linkIncluded && row.platform === 'reddit') {
    const { error: counterError } = await db.rpc('increment_community_counter', {
      p_id: 'reddit_non_promo',
    });
    if (counterError) return { ok: false, error: 'db_error', message: counterError.message };
  }

  return { ok: true, alreadyActed: false };
}

/**
 * Marks a lead `skipped_by_founder` (P1-5's own status — distinct from the
 * Answerer desk's pre-draft skip reasons, see `community.ts`). Same
 * idempotency contract as `ackPosted`: already-terminal leads are a no-op.
 */
export async function ackSkipped(db: SupabaseClient, leadId: string): Promise<AckOutcome> {
  const { data: lead, error: fetchError } = await db
    .from('engagement_lead')
    .select('id,status')
    .eq('id', leadId)
    .maybeSingle();

  if (fetchError) return { ok: false, error: 'db_error', message: fetchError.message };
  if (!lead) return { ok: false, error: 'not_found' };

  const row = lead as Pick<EngagementLeadRow, 'id' | 'status'>;
  if (row.status === 'posted' || row.status.startsWith('skipped')) {
    return { ok: true, alreadyActed: true };
  }

  const { error: updateError } = await db
    .from('engagement_lead')
    .update({ status: 'skipped_by_founder' })
    .eq('id', leadId);
  if (updateError) return { ok: false, error: 'db_error', message: updateError.message };

  return { ok: true, alreadyActed: false };
}
