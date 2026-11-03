import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerClaudeCaller } from '../claude-call';
import {
  checkSameEvent,
  mergeNewFacts,
  mergeOutputWithinLimits,
  type DedupeCandidate,
  type GateLLMResult,
  type MergeLLMResult,
} from './dedupe-gate-llm';
import { mergeFactLists } from './dedupe-merge';
import { selectCrossLaneCandidates, type CrossLaneCandidate, type CrossLaneInput } from './dedupe-crosslane';
import { buildShortlist, MAX_CANDIDATES_TO_LLM, MAX_SHORTLIST_UNION } from './dedupe-shortlist';
import type { ExtractedCurrentItem, ExtractedFact } from './types';
import type { ExtractUsageStore } from './usage-store';
import type { ClusterSource } from './write-knowledge';

export { mergeOutputWithinLimits } from './dedupe-gate-llm';
export type { DedupeCandidate, GateLLMResult, MergeLLMResult } from './dedupe-gate-llm';

export { MAX_CANDIDATES_TO_LLM, MAX_SHORTLIST_UNION } from './dedupe-shortlist';
export { MOMENT_WINDOW_DAYS } from './dedupe-crosslane';
export type { CrossLaneInput, VaultMomentRef, VideoRef } from './dedupe-crosslane';

export const CANDIDATE_WINDOW_DAYS = 30;

export interface DedupeCandidateRow extends DedupeCandidate {
  sources: readonly ClusterSource[];
  imageUrl: string | null;
  heat: number;
  entities?: readonly string[];
  facts?: readonly ExtractedFact[] | null;
}

export async function loadDedupeCandidates(
  db: SupabaseClient,
  eraId: string,
  windowDays: number = CANDIDATE_WINDOW_DAYS,
): Promise<DedupeCandidateRow[]> {
  const cutoff = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const nowIso = new Date().toISOString();
  const { data, error } = await db
    .from('current_item')
    .select('id, headline, summary, detail, sources, image_url, heat, entities, facts, observed_on')
    .eq('era_id', eraId)
    .is('promoted_to', null)
    .is('merged_into', null)
    .gte('observed_on', cutoff)
    .gt('expires_at', nowIso)
    .order('observed_on', { ascending: false })
    .limit(200);
  if (error) throw new Error(`loadDedupeCandidates failed: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    headline: row.headline as string,
    summary: row.summary as string,
    detail: (row.detail as string) ?? '',
    sources: ((row.sources as unknown[]) ?? []).map((source) => source as ClusterSource),
    imageUrl: (row.image_url as string | null) ?? null,
    heat: (row.heat as number) ?? 0,
    observedOn: (row.observed_on as string | null) ?? null,
    entities: (row.entities as string[] | null) ?? [],
    facts: (row.facts as ExtractedFact[] | null) ?? null,
  }));
}

export function shortlistCandidates(
  newItem: Pick<ExtractedCurrentItem, 'headline' | 'summary'> & Partial<Pick<ExtractedCurrentItem, 'entities' | 'facts'>>,
  candidates: readonly DedupeCandidateRow[],
  limit: number = MAX_CANDIDATES_TO_LLM,
  cap: number = MAX_SHORTLIST_UNION,
): DedupeCandidateRow[] {
  return buildShortlist(newItem, candidates, limit, cap);
}

export type DedupeDecision =
  | { action: 'publish' }
  | {
    action: 'merge';
    candidateId: string;
    mergedSummary?: string;
    mergedDetail?: string;
    /** v2 (original has facts): no prose rewrite; re-run the writer from mergedFacts. */
    needsRewrite?: true;
    mergedFacts?: ExtractedFact[];
    mergedSources?: ClusterSource[];
  }
  | { action: 'discard'; candidateId: string; reason?: string; momentId?: string }
  | { action: 'attach_video'; videoId: string }
  | { action: 'hold'; reason: string };

export type DedupeSubject = Pick<ExtractedCurrentItem, 'headline' | 'summary' | 'detail'>
  & Partial<Pick<ExtractedCurrentItem, 'entities' | 'facts' | 'observedOn'>>;

export interface EvaluateOptions {
  /** Vault moments/videos for read-only cross-lane matching. */
  crossLane?: CrossLaneInput;
  /** Era the cross-lane records are matched against; cross-lane is skipped without it. */
  eraId?: string;
  /** The new item's cluster sources, folded into the v2 merge result. */
  newItemSources?: readonly ClusterSource[];
}

/**
 * Shortlists candidates (lexical top-5 + shared entities + shared facts, cap
 * 10), adds read-only vault moment/video candidates, asks the subscription
 * runner whether one is the same event. A moment match discards with reason
 * duplicate_of_moment:<id>; a video match returns attach_video. A row match
 * with new facts merges: v2 (both sides have facts) appends facts and asks the
 * caller to re-run the writer, legacy rewrites prose. Any model unavailability
 * fails closed to a hold so a possible duplicate is retried.
 */
export async function evaluateSameEventGate(
  usage: ExtractUsageStore,
  candidates: readonly DedupeCandidateRow[],
  newItem: DedupeSubject,
  claude?: WorkerClaudeCaller,
  options: EvaluateOptions = {},
): Promise<DedupeDecision> {
  const crossLane: CrossLaneCandidate[] = options.crossLane && options.eraId
    ? selectCrossLaneCandidates(newItem, options.eraId, options.crossLane)
    : [];
  const rowShortlist = candidates.length === 0
    ? []
    : shortlistCandidates(newItem, candidates, MAX_CANDIDATES_TO_LLM, MAX_SHORTLIST_UNION - crossLane.length);
  const shortlist: DedupeCandidate[] = [...rowShortlist, ...crossLane];
  if (shortlist.length === 0) return { action: 'publish' };

  let gateResult: GateLLMResult | null;
  try {
    gateResult = await checkSameEvent(usage, newItem, shortlist, claude);
  } catch (error) {
    return { action: 'hold', reason: `dedupe-gate call failed: ${(error as Error).message}` };
  }
  if (gateResult === null) {
    return { action: 'hold', reason: 'dedupe-gate unavailable (subscription limit or cap)' };
  }
  if (!gateResult.sameEvent || !gateResult.matchId) return { action: 'publish' };

  const lane = crossLane.find((candidate) => candidate.id === gateResult.matchId);
  if (lane?.lane === 'moment') {
    if (gateResult.addsNewInfo) return { action: 'publish' };
    return {
      action: 'discard',
      candidateId: lane.id,
      reason: `duplicate_of_moment:${lane.refId}`,
      momentId: lane.refId,
    };
  }
  if (lane?.lane === 'video') return { action: 'attach_video', videoId: lane.refId };

  if (!gateResult.addsNewInfo || gateResult.newFacts.length === 0) {
    return { action: 'discard', candidateId: gateResult.matchId };
  }

  const original = candidates.find((candidate) => candidate.id === gateResult.matchId);
  if (!original) return { action: 'discard', candidateId: gateResult.matchId };

  if (original.facts?.length && !newItem.facts?.length) {
    console.warn(`dedupe: legacy_item_vs_v2_original for candidate ${original.id}`);
    return { action: 'discard', candidateId: original.id, reason: 'legacy_item_vs_v2_original' };
  }

  if (original.facts?.length && newItem.facts?.length) {
    const merged = mergeFactLists(original.facts, newItem.facts, original.sources, options.newItemSources ?? []);
    if (merged.addedFacts.length === 0) return { action: 'discard', candidateId: original.id };
    return {
      action: 'merge',
      candidateId: original.id,
      needsRewrite: merged.needsRewrite,
      mergedFacts: merged.mergedFacts,
      mergedSources: merged.mergedSources,
    };
  }

  let mergeResult: MergeLLMResult | null;
  try {
    mergeResult = await mergeNewFacts(usage, original, gateResult.newFacts, claude);
  } catch (error) {
    console.error(
      `dedupe-merge failed for candidate ${gateResult.matchId}: ${(error as Error).message}`,
    );
    return { action: 'discard', candidateId: gateResult.matchId };
  }
  if (mergeResult === null || !mergeOutputWithinLimits(mergeResult)) {
    return { action: 'discard', candidateId: gateResult.matchId };
  }
  return {
    action: 'merge',
    candidateId: gateResult.matchId,
    mergedSummary: mergeResult.summary,
    mergedDetail: mergeResult.detail,
  };
}
