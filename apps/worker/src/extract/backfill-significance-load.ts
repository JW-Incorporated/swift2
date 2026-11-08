// Significance-mode candidate selection (BACKFILL_MODE=significance): the rows the
// live feed shows (unexpired, not merged, retracted or promoted, redline_ok, passing
// the read-time gate), with or without facts. Without `ids`, rows that already hold
// a significance_verdict are skipped so a repeat run does not respend judge budget.

import type { SupabaseClient } from '@supabase/supabase-js';
import { passesCurrentItemQualityGate } from '@swift2/shared';
import { unservableReason, type ForceCandidateRow, type UnservableReason } from './backfill-force-load';
import type { ExtractedFact } from './types';

const MAX_ROWS = 1000;
const COLS =
  'id,headline,summary,detail,image_url,sources,era_id,observed_on,category,tags,status,source_tier,symbols,entities,redline_ok,facts,significance_verdict';

export interface SignificanceCandidateRow extends Omit<ForceCandidateRow, 'backfill_attempted_at'> {
  facts: ExtractedFact[] | null;
  significance_verdict: unknown;
}

export interface SignificanceSelection {
  candidates: SignificanceCandidateRow[];
  unservable: { id: string; reason: UnservableReason | 'read_gate_failed' }[];
}

/**
 * Live rows, newest first. A limit of 0 means all. With `ids` the operator's pick is honoured as given,
 * including rows that already carry a verdict.
 */
export async function loadSignificanceSelection(
  db: SupabaseClient,
  limit = 0,
  now = new Date(),
  days?: number,
  ids?: readonly string[],
): Promise<SignificanceSelection> {
  let query = db
    .from('current_item')
    .select(COLS)
    .is('promoted_to', null)
    .is('merged_into', null)
    .is('retracted_at', null)
    .eq('redline_ok', true)
    .gt('expires_at', now.toISOString());
  const targeted = !!ids && ids.length > 0;
  if (targeted) query = query.in('id', [...ids]);
  if (days !== undefined && days > 0) {
    query = query.gte('observed_on', new Date(now.getTime() - days * 86_400_000).toISOString().slice(0, 10));
  }
  const { data, error } = await query.order('observed_on', { ascending: false }).limit(MAX_ROWS);
  if (error) throw new Error(`significance backfill candidate load failed: ${error.message}`);
  const unservable: SignificanceSelection['unservable'] = [];
  const visible = ((data ?? []) as unknown as SignificanceCandidateRow[])
    .filter((row) => targeted || row.significance_verdict == null)
    .filter((row) => {
      const reason = unservableReason(row);
      if (reason) unservable.push({ id: row.id, reason });
      return reason === null;
    })
    .filter((row) => {
      const passes = passesCurrentItemQualityGate({
        headline: row.headline,
        summary: row.summary,
        detail: row.detail,
        ...(row.image_url ? { imageUrl: row.image_url } : {}),
        redlineOk: row.redline_ok,
        ...(row.facts ? { facts: row.facts } : {}),
        sources: row.sources,
      });
      if (!passes) unservable.push({ id: row.id, reason: 'read_gate_failed' });
      return passes;
    });
  return { candidates: limit > 0 ? visible.slice(0, limit) : visible, unservable };
}
