// Rewrite-mode candidate selection (BACKFILL_MODE=rewrite): the live v2 rows,
// i.e. the feed's visibility filter plus facts IS NOT NULL, the mirror image of
// force mode's facts IS NULL. Kept apart from backfill-force-load.ts so force's
// paths gain no bypass flags.

import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { passesCurrentItemQualityGate } from '@swift2/shared';
import { BACKFILL_RETRY_GAP_MS, unservableReason, type ForceCandidateRow, type ForceSelection } from './backfill-force-load';
import type { ExtractedFact } from './types';

export const REWRITE_SNAPSHOT_REASON = 'backfill_rewrite';
const REWRITE_MAX_ROWS = 1000;
const UNDEFINED_COLUMN = '42703';
const REWRITE_COLS =
  'id,headline,summary,detail,image_url,sources,era_id,observed_on,category,tags,status,source_tier,symbols,entities,redline_ok,facts,writing_score';

export interface RewriteCandidateRow extends Omit<ForceCandidateRow, 'backfill_attempted_at'> {
  facts: ExtractedFact[];
  writing_score: number | null;
  backfill_attempted_at?: string | null;
}

export interface RewriteSelection extends Omit<ForceSelection, 'candidates'> {
  candidates: RewriteCandidateRow[];
}

export function factsHash(facts: unknown): string {
  return createHash('sha256').update(JSON.stringify(facts ?? null)).digest('hex');
}

function rewriteQuery(db: SupabaseClient, now: Date, days: number | undefined, ids: readonly string[] | undefined, withMarker: boolean) {
  let query = db
    .from('current_item')
    .select(withMarker ? `${REWRITE_COLS},backfill_attempted_at` : REWRITE_COLS)
    .is('promoted_to', null)
    .is('merged_into', null)
    .is('retracted_at', null)
    .not('facts', 'is', null)
    .eq('redline_ok', true)
    .gt('expires_at', now.toISOString());
  if (ids && ids.length > 0) query = query.in('id', [...ids]);
  if (days !== undefined && days > 0) {
    query = query.gte('observed_on', new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10));
  }
  if (withMarker) query = query.order('backfill_attempted_at', { ascending: true, nullsFirst: true });
  return query.order('observed_on', { ascending: false }).limit(REWRITE_MAX_ROWS);
}

async function alreadyRewritten(db: SupabaseClient): Promise<Set<string>> {
  const { data, error } = await db.from('current_item_copy_snapshot').select('current_item_id').eq('reason', REWRITE_SNAPSHOT_REASON);
  if (error) throw new Error(`rewrite backfill snapshot load failed: ${error.message}`);
  return new Set(((data ?? []) as unknown as { current_item_id: string }[]).map((r) => r.current_item_id));
}

/**
 * Live rows (unexpired, not merged, retracted or promoted, redline_ok, passing the read-time gate) that carry facts.
 * Without `ids`, rows attempted in the last 20h or already rewritten (a backfill_rewrite snapshot exists) are skipped so a
 * repeat run does not respend writer budget; with `ids` the operator's pick is honoured as given. A limit of 0 means all.
 */
export async function loadRewriteSelection(
  db: SupabaseClient,
  limit = 0,
  now = new Date(),
  days?: number,
  ids?: readonly string[],
): Promise<RewriteSelection> {
  let { data, error } = await rewriteQuery(db, now, days, ids, true);
  if (error?.code === UNDEFINED_COLUMN) ({ data, error } = await rewriteQuery(db, now, days, ids, false));
  if (error) throw new Error(`rewrite backfill candidate load failed: ${error.message}`);
  const targeted = !!ids && ids.length > 0;
  const recent = now.getTime() - BACKFILL_RETRY_GAP_MS;
  const done = targeted ? new Set<string>() : await alreadyRewritten(db);
  const unservable: RewriteSelection['unservable'] = [];
  const visible = ((data ?? []) as unknown as RewriteCandidateRow[])
    .filter((row) => Array.isArray(row.facts) && row.facts.length > 0)
    .filter((row) => targeted || (!done.has(row.id) && (!row.backfill_attempted_at || Date.parse(row.backfill_attempted_at) <= recent)))
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
      facts: row.facts,
      sources: row.sources,
    }));
  return { candidates: limit > 0 ? visible.slice(0, limit) : visible, unservable };
}
