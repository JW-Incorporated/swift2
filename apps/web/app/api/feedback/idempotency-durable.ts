// Durable idempotency claim for feedback ids (#5108). claim_feedback_id is one
// atomic Postgres function; markPosted/release touch the same table directly
// (service role). If the function is missing (migration not applied) or
// Supabase isn't configured, every call degrades to a no-op and the caller
// keeps relying on the per-instance in-memory dedupe in idempotency.ts.
import { NextResponse } from 'next/server';

import { supabaseAdmin } from '../../../lib/supabase-server';

export type ClaimState = 'new' | 'pending' | 'posted' | 'unavailable';

export async function claimFeedbackId(id: string): Promise<{ state: ClaimState; url?: string }> {
  const db = supabaseAdmin();
  if (!db) return { state: 'unavailable' };
  try {
    const { data, error } = await db.rpc('claim_feedback_id', { p_id: id });
    if (error || !data || typeof data !== 'object') return { state: 'unavailable' };
    const { state, url } = data as { state?: unknown; url?: unknown };
    if (state !== 'new' && state !== 'pending' && state !== 'posted') return { state: 'unavailable' };
    return { state, url: typeof url === 'string' ? url : undefined };
  } catch {
    return { state: 'unavailable' };
  }
}

/** Best-effort: a failure here only means a later resend relies on the in-memory dedupe. */
export async function markFeedbackPosted(id: string, url: string | undefined): Promise<void> {
  try {
    await supabaseAdmin()
      ?.from('feedback_idempotency')
      .update({ status: 'posted', issue_url: url ?? null })
      .eq('id', id);
  } catch {
    /* best-effort */
  }
}

export async function releaseFeedbackId(id: string): Promise<void> {
  try {
    await supabaseAdmin()?.from('feedback_idempotency').delete().eq('id', id);
  } catch {
    /* best-effort; an abandoned pending claim expires after 2 minutes */
  }
}

/** A Response to return instead of posting (already posted / in flight), or null to proceed. */
export async function durableClaimResponse(id: string): Promise<Response | null> {
  const claim = await claimFeedbackId(id);
  if (claim.state === 'posted') {
    return NextResponse.json({ ok: true, duplicate: true, url: claim.url }, { status: 200 });
  }
  if (claim.state === 'pending') {
    return NextResponse.json(
      { error: 'That report is already being sent — try again in a moment.', pending: true },
      { status: 409 },
    );
  }
  return null;
}

/** Call once the upstream post finished: record the issue url on success, free the claim on failure. */
export async function finishDurableClaim(id: string, filed: boolean, url: string | undefined): Promise<void> {
  if (filed) await markFeedbackPosted(id, url);
  else await releaseFeedbackId(id);
}
