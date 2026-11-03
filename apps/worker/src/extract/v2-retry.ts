// Bounded retries for the two-pass writer ('on' mode only; docs/decisions.md 2026-11-03). A story
// that never yields facts or keeps deferring is attempted at most V2_MAX_ATTEMPTS times, at least
// V2_RETRY_GAP_MS apart, then marked extracted so it cannot starve the pending queue.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExtractStageResult } from './extract-stage-result';

export const V2_MAX_ATTEMPTS = 3;
export const V2_RETRY_GAP_MS = 2 * 60 * 60 * 1000;

const BASE_COLUMNS = 'id, canonical_title, summary, top_image_url';

/** Oldest-first pending stories; in 'on' mode also skips stories attempted within the retry gap. */
export async function loadPendingStories(
  db: SupabaseClient,
  limit: number,
  withV2Columns: boolean,
  now: number = Date.now(),
): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  const base = () => db
    .from('news_story')
    .select(withV2Columns ? `${BASE_COLUMNS}, v2_attempts` : BASE_COLUMNS)
    .not('classified_at', 'is', null)
    .is('extracted_at', null);
  if (!withV2Columns) return base().order('first_seen_at', { ascending: true }).limit(limit);
  const cutoff = new Date(now - V2_RETRY_GAP_MS).toISOString();
  const gated = await base()
    .or(`v2_last_attempt_at.is.null,v2_last_attempt_at.lt.${cutoff}`)
    .order('first_seen_at', { ascending: true })
    .limit(limit);
  if (!gated.error) return gated;
  console.warn(`news-worker: v2 retry columns unavailable (${gated.error.message}); loading without them`);
  return db
    .from('news_story')
    .select(BASE_COLUMNS)
    .not('classified_at', 'is', null)
    .is('extracted_at', null)
    .order('first_seen_at', { ascending: true })
    .limit(limit);
}

/** Records one failed v2 attempt; at V2_MAX_ATTEMPTS marks the story extracted and counts v2GaveUp. */
export async function recordV2Attempt(
  db: SupabaseClient,
  result: ExtractStageResult,
  storyId: string,
  previousAttempts: number | undefined,
  reason: string,
): Promise<void> {
  const attempts = (previousAttempts ?? 0) + 1;
  const nowIso = new Date().toISOString();
  const gaveUp = attempts >= V2_MAX_ATTEMPTS;
  const { error } = await db
    .from('news_story')
    .update({
      v2_attempts: attempts,
      v2_last_attempt_at: nowIso,
      ...(gaveUp ? { extracted_at: nowIso } : {}),
    })
    .eq('id', storyId);
  if (error) {
    console.warn(`news-worker: could not record v2 attempt for story ${storyId}: ${error.message}`);
    return;
  }
  if (!gaveUp) return;
  result.v2GaveUp += 1;
  result.v2GaveUpReasons[reason] = (result.v2GaveUpReasons[reason] ?? 0) + 1;
  console.warn(`news-worker: story ${storyId} gave up after ${attempts} v2 attempts (${reason})`);
}
