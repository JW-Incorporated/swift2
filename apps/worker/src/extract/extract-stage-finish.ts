import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExtractStageResult } from './extract-stage-result';
import { runExtractMaintenance } from './extract-stage-maintenance';
import { reresolveHeldImages } from './held-image-pass';
import { reresolveHeldTheoryImages } from './held-theory-image-pass';

/** End-of-cycle housekeeping: theory/countdown maintenance and the held-image re-resolve passes. */
export async function finishExtractStage(
  db: SupabaseClient,
  result: ExtractStageResult,
  today: string,
  eraId: string,
): Promise<void> {
  const { errors } = result;
  const maintenance = await runExtractMaintenance(db, today, eraId);
  result.abandonedTheories = maintenance.abandonedTheories;
  result.countdownsResolved = maintenance.countdownsResolved;
  errors.push(...maintenance.errors);
  const held = await reresolveHeldImages(db);
  result.heldImagesChecked = held.checked;
  result.heldImagesPublished = held.published;
  errors.push(...held.errors);
  const heldTheories = await reresolveHeldTheoryImages(db);
  result.heldImagesChecked += heldTheories.checked;
  result.heldImagesPublished += heldTheories.published;
  for (const [reason, count] of Object.entries(heldTheories.holdReasons)) {
    result.heldPassReasons[reason] = (result.heldPassReasons[reason] ?? 0) + count;
  }
  errors.push(...heldTheories.errors);
}
