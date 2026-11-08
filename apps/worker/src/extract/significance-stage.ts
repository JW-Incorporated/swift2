// Glue between run-extract-stage.ts and the significance gate (docs/decisions.md
// 2026-11-08). NEWS_SIGNIFICANCE mirrors NEWS_WRITER_V2: unset or unrecognised
// means off; shadow computes, logs and stores the verdict but never holds or
// defers; only 'on' holds. A hold is a quality hold (never a skip reason).

import type { SupabaseClient } from '@supabase/supabase-js';
import { recordV2Hold, type ExtractStageResult } from './extract-stage-result';
import { recordV2Attempt, V2_MAX_ATTEMPTS } from './v2-retry';
import { hostOf } from './worth-gate';
import { judgeSignificance, type SignificanceVerdict } from './significance-client';
import type { SignificanceVerdictRecord } from './significance-prompt';
import { significanceHoldReason, significanceRuleHold } from './significance-rules';
import type { ExtractedCurrentItem } from './types';
import {
  ExtractUsageStore,
  SIGNIFICANCE_DAILY_CAP,
  SIGNIFICANCE_PER_RUN_CAP,
  supabaseSignificanceUsageDb,
} from './usage-store';
import { writeCurrentItem, type ClusterSource } from './write-knowledge';

export type SignificanceMode = 'off' | 'shadow' | 'on';

/** off (default) = no significance stage; shadow = compute, log and store the verdict without holding; on = hold tier 3 and defer on judge failure. */
export function significanceMode(env: NodeJS.ProcessEnv = process.env): SignificanceMode {
  const value = (env.NEWS_SIGNIFICANCE ?? 'off').trim().toLowerCase();
  return value === 'on' || value === 'shadow' ? value : 'off';
}

export function createSignificanceStore(db: SupabaseClient): Promise<ExtractUsageStore> {
  return ExtractUsageStore.create(supabaseSignificanceUsageDb(db), SIGNIFICANCE_PER_RUN_CAP, SIGNIFICANCE_DAILY_CAP);
}

export type SignificanceAssessment =
  | { kind: 'pass'; verdict: SignificanceVerdictRecord }
  | { kind: 'hold'; holdReason: string; verdict: SignificanceVerdictRecord }
  | { kind: 'deferred'; reason: string };

export const JUDGE_HOLD = 'not_notable:judge';

function distinctHosts(sources: readonly ClusterSource[]): number {
  const hosts = new Set<string>();
  for (const source of sources) {
    try {
      hosts.add(new URL(source.url).hostname.toLowerCase());
    } catch {
      hosts.add(source.url);
    }
  }
  return hosts.size;
}

/** Layer 1 (rules), then layer 2 (judge). Never throws; a judge failure is a deferral. */
export async function assessSignificance(
  store: ExtractUsageStore | undefined,
  item: ExtractedCurrentItem,
  sources: readonly ClusterSource[],
  judge: typeof judgeSignificance = judgeSignificance,
  now: Date = new Date(),
): Promise<SignificanceAssessment> {
  const facts = item.facts ?? [];
  const at = now.toISOString();
  const rule = significanceRuleHold({
    headline: item.headline,
    category: item.category,
    status: item.statusHint,
    facts,
    sources,
  });
  if (rule) {
    return {
      kind: 'hold',
      holdReason: significanceHoldReason(rule),
      verdict: { tier: 3, reason: `rule:${rule}`, model: 'rules', at },
    };
  }
  if (!store) return { kind: 'deferred', reason: 'store_unavailable' };
  const judged: SignificanceVerdict = await judge(store, {
    headline: item.headline,
    category: item.category,
    status: item.statusHint,
    heat: distinctHosts(sources),
    facts: facts.map((fact) => fact.claim),
    sources: sources.map((source) => source.outletName || source.url),
  });
  if (judged.status === 'deferred') return { kind: 'deferred', reason: judged.reason };
  const verdict: SignificanceVerdictRecord = { tier: judged.tier, reason: judged.reason, model: judged.model, at };
  return judged.tier === 3 ? { kind: 'hold', holdReason: JUDGE_HOLD, verdict } : { kind: 'pass', verdict };
}

export const JUDGE_UNAVAILABLE_HOLD = 'not_notable:judge_unavailable';

/** Rule-based stand-in when the judge is down on the final attempt: an official source continues as tier 1 (uncapped), two distinct established hosts as tier 2, anything else is held. Layer 1 has already passed. */
export function judgeUnavailableFallback(
  sources: readonly ClusterSource[],
  now: Date = new Date(),
): SignificanceAssessment {
  const established = new Set(
    sources.filter((source) => source.tier === 'established').map((source) => hostOf(source.url)).filter((host) => host !== null),
  );
  const official = sources.some((source) => source.tier === 'official');
  const at = now.toISOString();
  return official || established.size >= 2
    ? { kind: 'pass', verdict: { tier: official ? 1 : 2, reason: 'fallback:judge_unavailable', model: 'rules', at } }
    : {
      kind: 'hold',
      holdReason: JUDGE_UNAVAILABLE_HOLD,
      verdict: { tier: 3, reason: 'fallback:judge_unavailable', model: 'rules', at },
    };
}

export interface SignificanceStep {
  /** proceed = continue the normal path; held = a quality-hold row was written; retry = deferred, leave the story pending. */
  action: 'proceed' | 'held' | 'retry';
  verdict?: SignificanceVerdictRecord;
}

/** The significance step of one story (mode shadow or on). shadow never holds or defers, it only records the verdict. */
export async function runSignificanceStep(args: {
  db: SupabaseClient;
  result: ExtractStageResult;
  mode: SignificanceMode;
  store: ExtractUsageStore | undefined;
  /** Per-run memo: a story is judged at most once per run. */
  memo: Map<string, SignificanceAssessment>;
  story: { id: string; v2_attempts?: number };
  item: ExtractedCurrentItem;
  sources: readonly ClusterSource[];
  eraId: string;
  countdownTargetAt: string | undefined;
  imageUrl: string | undefined;
}): Promise<SignificanceStep> {
  const { db, result, mode, store, memo, story, item, sources } = args;
  let assessment = memo.get(story.id) ?? await assessSignificance(store, item, sources);
  memo.set(story.id, assessment);
  if (assessment.kind === 'deferred' && assessment.reason === 'budget_exhausted') result.significanceBudgetExhausted = true;
  recordSignificance(result, assessment);
  if (assessment.kind === 'deferred' && (story.v2_attempts ?? 0) + 1 >= V2_MAX_ATTEMPTS) {
    assessment = judgeUnavailableFallback(sources);
    result.significanceFallback += 1;
    recordSignificance(result, assessment);
  }
  if (assessment.kind === 'deferred') {
    if (mode !== 'on') return { action: 'proceed' };
    console.warn(`news-worker: significance deferred for story ${story.id} (${assessment.reason}); retrying next cycle`);
    await recordV2Attempt(db, result, story.id, story.v2_attempts, 'significance_deferred');
    return { action: 'retry' };
  }
  if (assessment.kind === 'hold' && mode === 'on') {
    await writeCurrentItem(
      db, story.id, args.eraId, item, sources, args.countdownTargetAt, args.imageUrl,
      { facts: item.facts ?? [], holdReason: assessment.holdReason }, assessment.verdict,
    );
    recordV2Hold(result, assessment.holdReason);
    return { action: 'held', verdict: assessment.verdict };
  }
  return { action: 'proceed', verdict: assessment.verdict };
}

export function recordSignificance(result: ExtractStageResult, assessment: SignificanceAssessment): void {
  if (assessment.kind === 'deferred') {
    result.significanceDeferred += 1;
    return;
  }
  const tier = String(assessment.verdict.tier);
  result.tierCounts[tier] = (result.tierCounts[tier] ?? 0) + 1;
  if (assessment.kind === 'hold') {
    result.significanceHeld[assessment.holdReason] = (result.significanceHeld[assessment.holdReason] ?? 0) + 1;
  }
}
