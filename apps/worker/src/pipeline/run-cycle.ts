// One full pipeline cycle: ingest -> cluster -> classify -> verify -> store.
// One-shot and stage-isolated: a failing stage records its error and the
// worker either continues safely or exits when no source inventory exists.

import type { SupabaseClient } from '@supabase/supabase-js';
import { runClusterStage } from './cluster-stage';
import { emptyCycleResult, runDownstreamStages, type CycleResult } from './downstream-stages';
import { runIngestStage, type CycleOptions } from './ingest-stage';

export type { CycleResult } from './downstream-stages';
export type { CycleOptions } from './ingest-stage';
export { recordFirstPublicAt } from './cluster-stage';

export async function runCycle(
  db: SupabaseClient,
  options: CycleOptions = {},
): Promise<CycleResult> {
  const result = emptyCycleResult([]);
  const selectedSourceIds = await runIngestStage(db, options, result);
  if (selectedSourceIds === null) return result;

  await runClusterStage(db, options, selectedSourceIds, result);
  if (options.primary) return result;

  await runDownstreamStages(db, result);
  return result;
}
