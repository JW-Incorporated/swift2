// Bounded retries for the two-pass writer ('on' mode only; docs/decisions.md 2026-11-03). A story
// that never yields facts or keeps deferring is attempted at most V2_MAX_ATTEMPTS times, at least
// V2_RETRY_GAP_MS apart, then marked extracted so it cannot starve the pending queue.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ExtractStageResult } from './extract-stage-result';

export const V2_MAX_ATTEMPTS = 3;
export const V2_RETRY_GAP_MS = 2 * 60 * 60 * 1000;

const BASE_COLUMNS = 'id, canonical_title, summary, top_image_url';
const UNDEFINED_COLUMN = '42703';

type QueryError = { message: string; code?: string };

/** True only when the error says one of the v2 retry columns does not exist (migration not applied yet). */
export function isMissingV2Column(error: QueryError): boolean {
  return error.code === UNDEFINED_COLUMN || /v2_attempts|v2_last_attempt_at/.test(error.message);
}

/** Oldest-first pending stories; in 'on' mode also skips stories attempted within the retry gap. */
export async function loadPendingStories(
  db: SupabaseClient,
  limit: number,
  withV2Columns: boolean,
  now: number = Date.now(),
): Promise<{ data: unknown[] | null; error: QueryError | null }> {
  const base = () => db
    .from('news_story')
    .select(withV2Columns ? `${BASE_COLUMNS}, v2_attempts` : BASE_COLUMNS)
    .not('classified_at', 'is', null)
    .is('extracted_at', null);
  if (!withV2Columns) return base().order('first_seen_at', { ascending: true }).limit(limit);
  const cutoff = new Date(now - V2_RETRY_GAP_MS).toISOString();
  const gated = await base()
    .or(`v2_last_attempt_at.is.null,v2_last_attempt_at.lt."${cutoff}"`)
    .order('first_seen_at', { ascending: true })
    .limit(limit);
  if (!gated.error || !isMissingV2Column(gated.error)) return gated;
  console.warn(`news-worker: v2 retry columns unavailable (${gated.error.message}); loading without them`);
  return db
    .from('news_story')
    .select(BASE_COLUMNS)
    .not('classified_at', 'is', null)
    .is('extracted_at', null)
    .order('first_seen_at', { ascending: true })
    .limit(limit);
}

/**
 * Records one failed v2 attempt; at V2_MAX_ATTEMPTS marks the story extracted and counts v2GaveUp.
 * The update is guarded on the previous v2_attempts value so concurrent cycles cannot lose an
 * increment; if the guard matches no row it re-reads the count once and retries once.
 */
export async function recordV2Attempt(
  db: SupabaseClient,
  result: ExtractStageResult,
  storyId: string,
  previousAttempts: number | undefined,
  reason: string,
): Promise<{ attempts: number; gaveUp: boolean; reason: string } | undefined> {
  const tryUpdate = async (previous: number) => {
    const attempts = previous + 1;
    const nowIso = new Date().toISOString();
    const gaveUp = attempts >= V2_MAX_ATTEMPTS;
    const { data, error } = await db
      .from('news_story')
      .update({
        v2_attempts: attempts,
        v2_last_attempt_at: nowIso,
        ...(gaveUp ? { extracted_at: nowIso } : {}),
      })
      .eq('id', storyId)
      .eq('v2_attempts', previous)
      .select('id');
    return { attempts, gaveUp, error, updated: (data?.length ?? 0) > 0 };
  };
  let outcome = await tryUpdate(previousAttempts ?? 0);
  if (!outcome.error && !outcome.updated) {
    const { data: current, error: readError } = await db
      .from('news_story')
      .select('v2_attempts, extracted_at')
      .eq('id', storyId)
      .maybeSingle();
    if (readError || !current || current.extracted_at) return undefined;
    outcome = await tryUpdate((current.v2_attempts as number | null) ?? 0);
  }
  if (outcome.error || !outcome.updated) {
    console.warn(`news-worker: could not record v2 attempt for story ${storyId}: ${outcome.error?.message ?? 'row changed concurrently'}`);
    return undefined;
  }
  if (outcome.gaveUp) {
    result.v2GaveUp += 1;
    result.v2GaveUpReasons[reason] = (result.v2GaveUpReasons[reason] ?? 0) + 1;
    console.warn(`news-worker: story ${storyId} gave up after ${outcome.attempts} v2 attempts (${reason})`);
  }
  return { attempts: outcome.attempts, gaveUp: outcome.gaveUp, reason };
}
