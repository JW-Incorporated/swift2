import type { SupabaseClient } from '@supabase/supabase-js';
import type { ForceReportRow, WriterEvalKitRow } from './backfill-report';
import type { ForceOutcome } from './backfill-types';
import type { ExtractedFact } from './types';

export interface RowResult {
  report: ForceReportRow;
  kit?: WriterEvalKitRow;
  deferred?: true;
  retire?: true;
  write?: { summary: string; detail: string; facts: ExtractedFact[]; writingScore: number };
}

export const SKIPPED_OUTCOMES: readonly ForceOutcome[] = ['snapshot_failed', 'write_failed', 'skipped_changed'];

/** Re-reads the row, snapshots the re-read copy, then updates only while the row is still unchanged. */
export async function guardedWrite(
  db: SupabaseClient,
  id: string,
  write: NonNullable<RowResult['write']>,
): Promise<{ outcome: ForceOutcome; error?: string }> {
  const { data: fresh, error: readError } = await db.from('current_item')
    .select('id,headline,summary,detail,facts,merged_into,retracted_at,promoted_to')
    .eq('id', id)
    .maybeSingle();
  if (readError) return { outcome: 'write_failed', error: readError.message };
  if (!fresh || fresh.facts != null || fresh.merged_into || fresh.retracted_at || fresh.promoted_to) return { outcome: 'skipped_changed' };
  const { error: snapshotError } = await db.from('current_item_copy_snapshot').insert({
    current_item_id: id, headline: fresh.headline, summary: fresh.summary, detail: fresh.detail, facts: null, reason: 'backfill_v2',
  });
  if (snapshotError) return { outcome: 'snapshot_failed', error: snapshotError.message };
  const { data: updated, error: updateError } = await db.from('current_item')
    .update({ summary: write.summary, detail: write.detail, facts: write.facts, writing_score: write.writingScore })
    .eq('id', id)
    .is('facts', null)
    .is('merged_into', null)
    .is('retracted_at', null)
    .is('promoted_to', null)
    .select('id');
  if (updateError) return { outcome: 'write_failed', error: updateError.message };
  if (!updated || updated.length === 0) return { outcome: 'skipped_changed' };
  return { outcome: 'pass' };
}
