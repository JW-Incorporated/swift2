// Force-mode retirement of rows that fail the worth-a-post floor
// (docs/decisions.md 2026-11-03): the row is hidden, never deleted. The read
// path already hides it (redline_ok=false is filtered by RLS and by the shared
// publish gate); quality_hold_reason records why, so
// `restore-copy-snapshot.mjs --clear-retired` can undo it.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ForceOutcome } from './backfill-types';

export const RETIRED_HOLD_REASON = 'retired_below_floor';
export const RETIRE_SNAPSHOT_REASON = 'retire_below_floor';

/** Re-reads the row, snapshots it, then hides it only while it is still unchanged and facts-free. */
export async function retireBelowFloor(
  db: SupabaseClient,
  id: string,
): Promise<{ outcome: ForceOutcome; error?: string }> {
  const { data: fresh, error: readError } = await db.from('current_item')
    .select('id,headline,summary,detail,facts,merged_into,retracted_at,promoted_to,redline_ok')
    .eq('id', id)
    .maybeSingle();
  if (readError) return { outcome: 'write_failed', error: readError.message };
  if (!fresh || fresh.facts != null || fresh.merged_into || fresh.retracted_at || fresh.promoted_to || !fresh.redline_ok) {
    return { outcome: 'skipped_changed' };
  }
  const { data: snapshot, error: snapshotError } = await db.from('current_item_copy_snapshot').insert({
    current_item_id: id, headline: fresh.headline, summary: fresh.summary, detail: fresh.detail, facts: null, reason: RETIRE_SNAPSHOT_REASON,
  }).select('id').single();
  if (snapshotError) return { outcome: 'snapshot_failed', error: snapshotError.message };
  const dropSnapshot = async (): Promise<void> => {
    if (snapshot?.id !== undefined) await db.from('current_item_copy_snapshot').delete().eq('id', snapshot.id);
  };
  const { data: updated, error: updateError } = await db.from('current_item')
    // expires_at is not guarded: a row that expires mid-run is already hidden, so retiring it is harmless.
    .update({ redline_ok: false, quality_hold_reason: RETIRED_HOLD_REASON })
    .eq('id', id)
    .eq('redline_ok', true)
    .is('facts', null)
    .is('merged_into', null)
    .is('retracted_at', null)
    .is('promoted_to', null)
    .select('id');
  if (updateError) {
    await dropSnapshot();
    return { outcome: 'write_failed', error: updateError.message };
  }
  if (!updated || updated.length === 0) {
    await dropSnapshot();
    return { outcome: 'skipped_changed' };
  }
  return { outcome: 'retired_below_floor' };
}
