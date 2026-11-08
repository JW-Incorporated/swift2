// Force-mode retirement (docs/decisions.md 2026-11-03): rows that fail the
// worth-a-post floor, lose a same-event group, or cannot be rewritten are
// hidden, never deleted. The read path already hides them (redline_ok=false is
// filtered by RLS and by the shared publish gate); quality_hold_reason records
// why, so `restore-copy-snapshot.mjs --clear-retired` can undo it. A duplicate
// also carries merged_into = the surviving row.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ForceOutcome } from './backfill-types';

export const RETIRED_HOLD_REASON = 'retired_below_floor';
export const RETIRE_SNAPSHOT_REASON = 'retire_below_floor';

export interface RetireKind {
  holdReason: string;
  snapshotReason: string;
  outcome: ForceOutcome;
  /** Live rows that already carry facts: the facts guards are dropped and the snapshot keeps facts and score. */
  liveFacts?: boolean;
}

export const RETIRE_BELOW_FLOOR: RetireKind = {
  holdReason: RETIRED_HOLD_REASON, snapshotReason: RETIRE_SNAPSHOT_REASON, outcome: 'retired_below_floor',
};
export const RETIRE_DUPLICATE: RetireKind = {
  holdReason: 'retired_duplicate', snapshotReason: 'retire_duplicate', outcome: 'retired_duplicate',
};
export const RETIRE_UNWRITABLE: RetireKind = {
  holdReason: 'retired_unwritable', snapshotReason: 'retire_unwritable', outcome: 'retired_unwritable',
};
export const RETIRE_NOT_NOTABLE: RetireKind = {
  holdReason: 'retired_not_notable', snapshotReason: 'retire_not_notable', outcome: 'retired_not_notable', liveFacts: true,
};

/** Re-reads the row, snapshots it, then hides it only while it is still unchanged and facts-free. */
export async function retireRow(
  db: SupabaseClient,
  id: string,
  kind: RetireKind,
  mergedInto?: string | null,
): Promise<{ outcome: ForceOutcome; error?: string }> {
  const { data: fresh, error: readError } = await db.from('current_item')
    .select('id,headline,summary,detail,facts,writing_score,merged_into,retracted_at,promoted_to,redline_ok')
    .eq('id', id)
    .maybeSingle();
  if (readError) return { outcome: 'write_failed', error: readError.message };
  if (!fresh || (!kind.liveFacts && fresh.facts != null) || fresh.merged_into || fresh.retracted_at || fresh.promoted_to || !fresh.redline_ok) {
    return { outcome: 'skipped_changed' };
  }
  const { data: snapshot, error: snapshotError } = await db.from('current_item_copy_snapshot').insert({
    current_item_id: id, headline: fresh.headline, summary: fresh.summary, detail: fresh.detail, facts: kind.liveFacts ? fresh.facts ?? null : null,
    ...(kind.liveFacts && fresh.facts ? { writing_score: fresh.writing_score ?? null } : {}), reason: kind.snapshotReason,
  }).select('id').single();
  if (snapshotError) return { outcome: 'snapshot_failed', error: snapshotError.message };
  const dropSnapshot = async (): Promise<void> => {
    if (snapshot?.id !== undefined) await db.from('current_item_copy_snapshot').delete().eq('id', snapshot.id);
  };
  let guarded = db.from('current_item')
    // expires_at is not guarded: a row that expires mid-run is already hidden, so retiring it is harmless.
    .update({ redline_ok: false, quality_hold_reason: kind.holdReason, ...(mergedInto ? { merged_into: mergedInto } : {}) })
    .eq('id', id)
    .eq('redline_ok', true);
  if (!kind.liveFacts) guarded = guarded.is('facts', null);
  const { data: updated, error: updateError } = await guarded
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
  return { outcome: kind.outcome };
}

export const retireBelowFloor = (db: SupabaseClient, id: string): ReturnType<typeof retireRow> =>
  retireRow(db, id, RETIRE_BELOW_FLOOR);
