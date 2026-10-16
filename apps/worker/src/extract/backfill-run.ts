import type { SupabaseClient } from '@supabase/supabase-js';
import { backfillOneItem, loadBackfillCandidates } from './backfill';
import { ExtractUsageStore, supabaseExtractUsageDb } from './usage-store';
import type { BackfillRunResult, RunBackfillOptions } from './backfill-types';

export type { BackfillRunResult, RunBackfillOptions } from './backfill-types';

export async function runBackfill(
  db: SupabaseClient,
  options: RunBackfillOptions,
): Promise<BackfillRunResult> {
  const { dryRun, limit, fetchImpl = fetch } = options;
  const errors: string[] = [];
  const reports: BackfillRunResult['reports'] = [];
  const result: BackfillRunResult = {
    considered: 0,
    rewritten: 0,
    imagesResolved: 0,
    nowPassing: 0,
    stillHeld: 0,
    deferred: 0,
    wroteBack: 0,
    reports,
    errors,
  };

  const candidates = await loadBackfillCandidates(db, limit);
  const usage = await ExtractUsageStore.create(supabaseExtractUsageDb(db));
  const today = new Date().toISOString().slice(0, 10);

  for (const item of candidates) {
    result.considered++;
    try {
      const { report, update } = await backfillOneItem(item, usage, today, fetchImpl);
      reports.push(report);
      if (report.rewroteCopy) result.rewritten++;
      if (report.deferred) result.deferred++;
      if (!report.imageBefore && report.imageAfter) result.imagesResolved++;
      if (report.finalOk) result.nowPassing++;
      else result.stillHeld++;

      if (!dryRun) {
        const { redline_ok, quality_hold_reason, ...facts } = update;
        const { error: factsError } = await db.from('current_item').update(facts)
          .eq('id', item.id);
        const { error: visibilityError } = factsError
          ? { error: null }
          : await db.from('current_item').update({ redline_ok, quality_hold_reason })
            .eq('id', item.id)
            .is('retracted_at', null);
        const writeError = factsError ?? visibilityError;
        if (writeError) errors.push(`write-back failed for ${item.id}: ${writeError.message}`);
        else result.wroteBack++;
      }
    } catch (err) {
      errors.push(`backfill failed for ${item.id}: ${(err as Error).message}`);
    }
  }

  return result;
}
