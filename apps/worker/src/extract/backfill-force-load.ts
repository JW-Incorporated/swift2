// Force-mode candidate selection and the per-row attempt marker. Rows are
// ordered least-recently-attempted first so a capped or deferred run cannot
// starve the rest of the feed; the marker column is additive and may not exist
// yet (migrations apply on merge), so only Postgres 42703 falls back.

import type { SupabaseClient } from '@supabase/supabase-js';
import { passesCurrentItemQualityGate } from '@swift2/shared';
import type { SourceTier } from '@swift2/shared/news';

export const BACKFILL_RETRY_GAP_MS = 20 * 60 * 60 * 1000;
const FORCE_MAX_ROWS = 1000;
const UNDEFINED_COLUMN = '42703';
const FORCE_COLS =
  'id,headline,summary,detail,image_url,sources,era_id,observed_on,category,tags,status,source_tier,symbols,entities,redline_ok';

export interface ForceCandidateRow {
  id: string;
  headline: string;
  summary: string;
  detail: string;
  image_url: string | null;
  sources: { name: string; url: string; tier: SourceTier }[];
  era_id: string;
  observed_on: string;
  category: string;
  tags: string[] | null;
  status: string;
  source_tier: string | null;
  symbols: string[] | null;
  entities: string[] | null;
  redline_ok: boolean;
  backfill_attempted_at?: string | null;
}

function candidateQuery(db: SupabaseClient, now: Date, days: number | undefined, withMarker: boolean) {
  let query = db
    .from('current_item')
    .select(withMarker ? `${FORCE_COLS},backfill_attempted_at` : FORCE_COLS)
    .is('promoted_to', null)
    .is('merged_into', null)
    .is('retracted_at', null)
    .is('facts', null)
    .eq('redline_ok', true)
    .gt('expires_at', now.toISOString());
  if (days !== undefined && days > 0) {
    query = query.gte('observed_on', new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10));
  }
  if (withMarker) query = query.order('backfill_attempted_at', { ascending: true, nullsFirst: true });
  return query.order('observed_on', { ascending: false }).limit(FORCE_MAX_ROWS);
}

/**
 * Exactly the rows the live feed shows (unexpired, not merged, retracted or promoted, redline_ok, passing the read-time gate) that have no facts yet, least recently attempted first, then newest observed_on. Rows attempted in the last 20h are skipped. The feed has no observed_on window, so `days` is an optional narrowing override. A limit of 0 means all.
 */
export async function loadForceCandidates(
  db: SupabaseClient,
  limit = 0,
  now = new Date(),
  days?: number,
): Promise<ForceCandidateRow[]> {
  let { data, error } = await candidateQuery(db, now, days, true);
  if (error?.code === UNDEFINED_COLUMN) ({ data, error } = await candidateQuery(db, now, days, false));
  if (error) throw new Error(`force backfill candidate load failed: ${error.message}`);
  const recent = now.getTime() - BACKFILL_RETRY_GAP_MS;
  const visible = ((data ?? []) as unknown as ForceCandidateRow[])
    .filter((row) => !row.backfill_attempted_at || Date.parse(row.backfill_attempted_at) <= recent)
    .filter((row) => passesCurrentItemQualityGate({
      headline: row.headline,
      summary: row.summary,
      detail: row.detail,
      ...(row.image_url ? { imageUrl: row.image_url } : {}),
      redlineOk: row.redline_ok,
      facts: null,
      sources: row.sources,
    }));
  return limit > 0 ? visible.slice(0, limit) : visible;
}

/** Stamps the row as attempted. A missing column (42703) is tolerated; any other failure is returned for the error list. */
export async function markAttempted(db: SupabaseClient, id: string, now = new Date()): Promise<string | undefined> {
  const { error } = await db.from('current_item').update({ backfill_attempted_at: now.toISOString() }).eq('id', id);
  if (error && error.code !== UNDEFINED_COLUMN) return error.message;
  return undefined;
}
