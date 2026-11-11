// Force-mode candidate selection and the per-row attempt marker. Rows are
// ordered least-recently-attempted first so a capped or deferred run cannot
// starve the rest of the feed; the marker column is additive and may not exist
// yet (migrations apply on merge), so only Postgres 42703 falls back.

import type { SupabaseClient } from '@supabase/supabase-js';
import { evaluateImageUrl, passesCurrentItemQualityGate } from '@swift2/shared';
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

export type UnservableReason = 'redline_failed' | 'missing_image' | 'image_host_not_allowlisted';

export interface ForceSelection {
  candidates: ForceCandidateRow[];
  /** Rows the read gate hides whatever their copy, so rewriting them would spend writer and judge budget for nothing. */
  unservable: { id: string; reason: UnservableReason }[];
}

/** The non-copy reason the read gate would hide the row, or null. Exclusion fields (merged, retracted, promoted, expired) are already filtered in the query. */
export function unservableReason(row: Pick<ForceCandidateRow, 'image_url' | 'redline_ok'>): UnservableReason | null {
  if (!row.redline_ok) return 'redline_failed';
  const image = evaluateImageUrl(row.image_url);
  return image.ok ? null : image.reason;
}

/**
 * Exactly the rows the live feed shows (unexpired, not merged, retracted or promoted, redline_ok, passing the read-time gate) that have no facts yet, least recently attempted first, then newest observed_on. Rows attempted in the last 20h are skipped. Rows hidden for a non-copy reason (image, redline) are returned in `unservable`, not as candidates. The feed has no observed_on window, so `days` is an optional narrowing override. A limit of 0 means all.
 */
export async function loadForceSelection(
  db: SupabaseClient,
  limit = 0,
  now = new Date(),
  days?: number,
): Promise<ForceSelection> {
  let { data, error } = await candidateQuery(db, now, days, true);
  if (error?.code === UNDEFINED_COLUMN) ({ data, error } = await candidateQuery(db, now, days, false));
  if (error) throw new Error(`force backfill candidate load failed: ${error.message}`);
  const recent = now.getTime() - BACKFILL_RETRY_GAP_MS;
  const unservable: ForceSelection['unservable'] = [];
  const visible = ((data ?? []) as unknown as ForceCandidateRow[])
    .filter((row) => !row.backfill_attempted_at || Date.parse(row.backfill_attempted_at) <= recent)
    .filter((row) => {
      const reason = unservableReason(row);
      if (reason) unservable.push({ id: row.id, reason });
      return reason === null;
    })
    .filter((row) => passesCurrentItemQualityGate({
      headline: row.headline,
      summary: row.summary,
      detail: row.detail,
      ...(row.image_url ? { imageUrl: row.image_url } : {}),
      redlineOk: row.redline_ok,
      facts: null,
      sources: row.sources,
    }));
  return { candidates: limit > 0 ? visible.slice(0, limit) : visible, unservable };
}

export async function loadForceCandidates(
  db: SupabaseClient,
  limit = 0,
  now = new Date(),
  days?: number,
): Promise<ForceCandidateRow[]> {
  return (await loadForceSelection(db, limit, now, days)).candidates;
}

/** Stamps the row as attempted. A missing column (42703) is tolerated; any other failure is returned for the error list. */
export async function markAttempted(db: SupabaseClient, id: string, now = new Date()): Promise<string | undefined> {
  const { error } = await db.from('current_item').update({ backfill_attempted_at: now.toISOString() }).eq('id', id);
  if (error && error.code !== UNDEFINED_COLUMN) return error.message;
  return undefined;
}

export interface ExistingV2Row {
  id: string;
  headline: string;
  summary: string;
  detail: string;
  observed_on: string;
  entities: string[] | null;
  facts: { claim: string }[];
  writing_score: number | null;
}

const DAY_MS = 86_400_000;

/** Visible rows that already carry facts (the v2 copy) within 3 days of any candidate: cross-batch dedupe anchors. */
export async function loadExistingV2Rows(
  db: SupabaseClient,
  candidates: readonly Pick<ForceCandidateRow, 'observed_on'>[],
  now = new Date(),
): Promise<ExistingV2Row[]> {
  if (candidates.length === 0) return [];
  const times = candidates.map((c) => Date.parse(c.observed_on));
  const from = new Date(Math.min(...times) - 3 * DAY_MS).toISOString().slice(0, 10);
  const to = new Date(Math.max(...times) + 3 * DAY_MS).toISOString().slice(0, 10);
  const { data, error } = await db
    .from('current_item')
    .select('id,headline,summary,detail,observed_on,entities,facts,writing_score')
    .not('facts', 'is', null)
    .is('promoted_to', null)
    .is('merged_into', null)
    .is('retracted_at', null)
    .eq('redline_ok', true)
    .gt('expires_at', now.toISOString())
    .gte('observed_on', from)
    .lte('observed_on', to)
    .limit(FORCE_MAX_ROWS);
  if (error) throw new Error(`existing v2 row load failed: ${error.message}`);
  return ((data ?? []) as unknown as ExistingV2Row[]).filter((row) => Array.isArray(row.facts) && row.facts.length > 0);
}
