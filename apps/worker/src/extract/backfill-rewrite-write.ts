import type { SupabaseClient } from '@supabase/supabase-js';
import { factsHash, REWRITE_SNAPSHOT_REASON } from './backfill-rewrite-load';

export type RewriteWriteOutcome = 'pass' | 'concurrent_change' | 'skipped_changed' | 'snapshot_failed' | 'write_failed';

/** Facts are never touched: only the prose and its score change, and the old facts/score ride along in the snapshot. */
export interface RewriteWrite { summary: string; detail: string; writingScore: number }

/** Re-reads the row; writes only while its facts hash still equals the one read at load time, snapshotting the old copy, facts and score first. */
export async function guardedRewrite(
  db: SupabaseClient,
  id: string,
  loadedFactsHash: string,
  write: RewriteWrite,
): Promise<{ outcome: RewriteWriteOutcome; error?: string }> {
  const { data: fresh, error: readError } = await db.from('current_item')
    .select('id,headline,summary,detail,facts,writing_score,merged_into,retracted_at,promoted_to')
    .eq('id', id)
    .maybeSingle();
  if (readError) return { outcome: 'write_failed', error: readError.message };
  if (!fresh || fresh.merged_into || fresh.retracted_at || fresh.promoted_to) return { outcome: 'skipped_changed' };
  if (fresh.facts == null || factsHash(fresh.facts) !== loadedFactsHash) return { outcome: 'concurrent_change' };
  const { error: snapshotError } = await db.from('current_item_copy_snapshot').insert({
    current_item_id: id,
    headline: fresh.headline,
    summary: fresh.summary,
    detail: fresh.detail,
    facts: fresh.facts,
    writing_score: fresh.writing_score,
    reason: REWRITE_SNAPSHOT_REASON,
  });
  if (snapshotError) return { outcome: 'snapshot_failed', error: snapshotError.message };
  const { data: updated, error: updateError } = await db.from('current_item')
    .update({ summary: write.summary, detail: write.detail, writing_score: write.writingScore })
    .eq('id', id)
    .eq('summary', fresh.summary)
    .eq('detail', fresh.detail)
    .eq('facts', JSON.stringify(fresh.facts))
    .not('facts', 'is', null)
    .is('merged_into', null)
    .is('retracted_at', null)
    .is('promoted_to', null)
    .select('id');
  if (updateError) return { outcome: 'write_failed', error: updateError.message };
  if (!updated || updated.length === 0) return { outcome: 'concurrent_change' };
  return { outcome: 'pass' };
}
