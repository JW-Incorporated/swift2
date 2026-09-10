// DB-write layer for the merge/promote pass (Community Engine plan §3.3,
// Phase 2 card P2-3). Pure decision-making lives in ./theory-promote.ts
// (mergeTheoryCandidates/buildLiveTheoryUpsert) — this module is the I/O
// wrapper, same split as write-theory-candidate.ts vs theory-match.ts.

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildLiveTheoryUpsert,
  mergeTheoryCandidates,
  type ExistingLiveTheoryRow,
  type FanTheoryCandidateRow,
  type MergedTheoryCluster,
} from './theory-promote';

export interface PromotePassResult {
  candidatesConsidered: number;
  clustersFormed: number;
  promoted: number;
  rejected: number;
  held: number;
  mergedRowsMarked: number;
  errors: string[];
}

interface CandidateDbRow {
  id: string;
  claim: string;
  theory_key: string;
  mechanism: string | null;
  symbols: string[];
  track_slug: string | null;
  predicts: string | null;
  predicted_date: string | null;
  evidence_summary: string | null;
  mention_count: number;
  peak_score: number;
  communities: string[];
  stance: FanTheoryCandidateRow['stance'];
  sample_urls: unknown;
}

function toCandidateRow(r: CandidateDbRow): FanTheoryCandidateRow {
  return {
    id: r.id,
    claim: r.claim,
    theoryKey: r.theory_key,
    // fan_theory_candidate has no separate `name` column (§5's schema) — the
    // theory-match.ts similarity check needs one, so the candidate's own
    // `claim` doubles as its name for matching purposes, same substitution
    // theory-haiku-client.ts's sanitizeTheory makes nowhere else needed:
    // this is the one place a name is required but the table doesn't carry
    // one, so `claim` (already <=200 chars, our words) is the closest real
    // text to compare, never an invented label.
    name: r.claim,
    mechanism: r.mechanism,
    symbols: r.symbols,
    trackSlug: r.track_slug,
    predicts: r.predicts,
    predictedDate: r.predicted_date,
    evidenceSummary: r.evidence_summary,
    mentionCount: r.mention_count,
    peakScore: r.peak_score,
    communities: r.communities,
    stance: r.stance,
    sampleUrls: Array.isArray(r.sample_urls) ? (r.sample_urls as string[]) : [],
  };
}

async function applyCluster(
  db: SupabaseClient,
  cluster: MergedTheoryCluster,
  existingLiveTheories: readonly ExistingLiveTheoryRow[],
): Promise<{ liveTheoryId?: string }> {
  if (cluster.mergedIds.length > 0) {
    const { error: mergeError } = await db
      .from('fan_theory_candidate')
      .update({ status: 'merged', updated_at: new Date().toISOString() })
      .in('id', cluster.mergedIds);
    if (mergeError)
      throw new Error(`fan_theory_candidate merge-mark failed: ${mergeError.message}`);

    // The merged siblings' mention_count/symbols/communities/peak_score/
    // sample_urls must be folded onto the canonical row's OWN db columns
    // here, not just carried in the in-memory `cluster` object — the
    // canonical row is the only one still `status='candidate'` (or
    // 'accepted'/'rejected' below) after this run, so a future weekly
    // pass reloads it fresh from the DB via `.eq('status','candidate')`.
    // Without this write, a `hold` cluster's summed mention_count would
    // be silently lost: the merged siblings are gone from every future
    // query, and the canonical row would still show only its own
    // pre-merge count, permanently understating how close it is to
    // PROMOTION_MENTION_THRESHOLD.
    const { error: sumError } = await db
      .from('fan_theory_candidate')
      .update({
        mention_count: cluster.mentionCount,
        peak_score: cluster.peakScore,
        symbols: cluster.symbols,
        communities: cluster.communities,
        sample_urls: cluster.sampleUrls,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cluster.canonicalId);
    if (sumError) throw new Error(`fan_theory_candidate sum-persist failed: ${sumError.message}`);
  }

  if (cluster.decision === 'hold') {
    // Left as `status='candidate'` — more mentions may arrive before the
    // next weekly pass clears the promotion bar.
    return {};
  }

  if (cluster.decision === 'reject') {
    const { error } = await db
      .from('fan_theory_candidate')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', cluster.canonicalId);
    if (error) throw new Error(`fan_theory_candidate reject failed: ${error.message}`);
    return {};
  }

  // decision === 'promote'
  const upsert = buildLiveTheoryUpsert(cluster, existingLiveTheories);
  let liveTheoryId: string;
  if (upsert.existingId) {
    const { error } = await db.from('live_theory').update(upsert.row).eq('id', upsert.existingId);
    if (error) throw new Error(`live_theory update failed: ${error.message}`);
    liveTheoryId = upsert.existingId;
  } else {
    const { data, error } = await db
      .from('live_theory')
      .insert({
        ...upsert.row,
        first_seen_on: new Date().toISOString().slice(0, 10),
        last_seen_on: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single();
    if (error) throw new Error(`live_theory insert failed: ${error.message}`);
    liveTheoryId = data.id as string;
  }

  const { error: acceptError } = await db
    .from('fan_theory_candidate')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', cluster.canonicalId);
  if (acceptError) throw new Error(`fan_theory_candidate accept failed: ${acceptError.message}`);

  return { liveTheoryId };
}

/**
 * Reads every `fan_theory_candidate` still `status='candidate'`, merges
 * near-duplicates (theory-promote.ts's deterministic rule), and promotes
 * qualifying clusters into `live_theory` (origin='fan', persistent=true).
 * One cluster's write failure logs and continues, never aborts the run —
 * same stage-isolation discipline as run-theory-miner-stage.ts.
 */
export async function runTheoryPromotePass(db: SupabaseClient): Promise<PromotePassResult> {
  const errors: string[] = [];
  const result: PromotePassResult = {
    candidatesConsidered: 0,
    clustersFormed: 0,
    promoted: 0,
    rejected: 0,
    held: 0,
    mergedRowsMarked: 0,
    errors,
  };

  const { data: candidateRows, error: candidateError } = await db
    .from('fan_theory_candidate')
    .select(
      'id, claim, theory_key, mechanism, symbols, track_slug, predicts, predicted_date, evidence_summary, mention_count, peak_score, communities, stance, sample_urls',
    )
    .eq('status', 'candidate');
  if (candidateError) {
    errors.push(`fan_theory_candidate load failed: ${candidateError.message}`);
    return result;
  }

  const candidates = ((candidateRows ?? []) as CandidateDbRow[]).map(toCandidateRow);
  result.candidatesConsidered = candidates.length;
  if (candidates.length === 0) return result;

  const { data: liveRows, error: liveError } = await db
    .from('live_theory')
    .select('id, name, symbols, heat, mention_count, communities')
    .eq('origin', 'fan')
    .neq('status', 'abandoned');
  if (liveError) errors.push(`live_theory load failed: ${liveError.message}`);
  const existingLiveTheories = (
    (liveRows ?? []) as {
      id: string;
      name: string;
      symbols: string[];
      heat: number;
      mention_count: number | null;
      communities: string[];
    }[]
  ).map((r) => ({
    id: r.id,
    name: r.name,
    symbols: r.symbols,
    heat: r.heat,
    mentionCount: r.mention_count,
    communities: r.communities,
  }));

  const clusters = mergeTheoryCandidates(candidates);
  result.clustersFormed = clusters.length;

  for (const cluster of clusters) {
    try {
      result.mergedRowsMarked += cluster.mergedIds.length;
      await applyCluster(db, cluster, existingLiveTheories);
      if (cluster.decision === 'promote') result.promoted++;
      else if (cluster.decision === 'reject') result.rejected++;
      else result.held++;
    } catch (err) {
      errors.push(
        `cluster ${cluster.canonicalId} (${cluster.decision}) failed: ${(err as Error).message}`,
      );
    }
  }

  return result;
}
