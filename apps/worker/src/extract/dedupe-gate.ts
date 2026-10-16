import type { SupabaseClient } from '@supabase/supabase-js';
import { STOPWORDS, tokenize } from '@swift2/shared/news';
import type { WorkerClaudeCaller } from '../claude-call';
import {
  checkSameEvent,
  mergeNewFacts,
  mergeOutputWithinLimits,
  type DedupeCandidate,
  type GateLLMResult,
  type MergeLLMResult,
} from './dedupe-gate-llm';
import type { ExtractedCurrentItem } from './types';
import type { ExtractUsageStore } from './usage-store';
import type { ClusterSource } from './write-knowledge';

export { mergeOutputWithinLimits } from './dedupe-gate-llm';
export type { DedupeCandidate, GateLLMResult, MergeLLMResult } from './dedupe-gate-llm';

export const CANDIDATE_WINDOW_DAYS = 7;
export const MAX_CANDIDATES_TO_LLM = 5;

export interface DedupeCandidateRow extends DedupeCandidate {
  sources: readonly ClusterSource[];
  imageUrl: string | null;
  heat: number;
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
    .select('id, headline, summary, detail, sources, image_url, heat')
    .eq('era_id', eraId)
    .is('promoted_to', null)
    .is('merged_into', null)
    .gte('observed_on', cutoff)
    .gt('expires_at', nowIso)
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
  }));
}

function overlapScore(a: string, b: string): number {
  const aTokens = new Set(tokenize(a).filter((token) => !STOPWORDS.has(token)));
  const bTokens = new Set(tokenize(b).filter((token) => !STOPWORDS.has(token)));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let shared = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) shared += 1;
  }
  return shared / (aTokens.size + bTokens.size - shared);
}

export function shortlistCandidates(
  newItem: Pick<ExtractedCurrentItem, 'headline' | 'summary'>,
  candidates: readonly DedupeCandidateRow[],
  limit: number = MAX_CANDIDATES_TO_LLM,
): DedupeCandidateRow[] {
  const newText = `${newItem.headline} ${newItem.summary}`;
  return [...candidates]
    .map((candidate) => ({
      candidate,
      score: overlapScore(newText, `${candidate.headline} ${candidate.summary}`),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ candidate }) => candidate);
}

export type DedupeDecision =
  | { action: 'publish' }
  | { action: 'merge'; candidateId: string; mergedSummary?: string; mergedDetail?: string }
  | { action: 'discard'; candidateId: string }
  | { action: 'hold'; reason: string };

/**
 * Shortlists candidates, asks the subscription runner whether one is the
 * same event, and optionally rewrites the original with new facts. Any model
 * unavailability fails closed to a hold so a possible duplicate is retried.
 */
export async function evaluateSameEventGate(
  usage: ExtractUsageStore,
  candidates: readonly DedupeCandidateRow[],
  newItem: Pick<ExtractedCurrentItem, 'headline' | 'summary' | 'detail'>,
  claude?: WorkerClaudeCaller,
): Promise<DedupeDecision> {
  if (candidates.length === 0) return { action: 'publish' };
  const shortlist = shortlistCandidates(newItem, candidates);
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
  if (!gateResult.addsNewInfo || gateResult.newFacts.length === 0) {
    return { action: 'discard', candidateId: gateResult.matchId };
  }

  const original = candidates.find((candidate) => candidate.id === gateResult.matchId);
  if (!original) return { action: 'discard', candidateId: gateResult.matchId };

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
