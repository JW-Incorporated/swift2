import { DAILY_TEXT_CAP_HOLD, TIER2_CAP_HOLD } from './daily-text-cap';

export interface ExtractStageResult {
  clustersConsidered: number;
  extracted: number;
  screenedOut: number;
  skipped: number;
  deferred: number;
  theoriesUpserted: number;
  abandonedTheories: number;
  countdownsResolved: number;
  dedupeMerged: number;
  dedupeDiscarded: number;
  dedupeHeld: number;
  attachedToVideo: number;
  /** Discards by reason (duplicate_of_moment, legacy_item_vs_v2_original, no_new_info, ...). */
  dedupeDiscardReasons: Record<string, number>;
  /** Two-pass writer: rows rejected for quality (also counted in heldPassReasons). */
  v2Held: number;
  /** Items held because the era already published its daily text cap (also counted in v2Held). */
  dailyTextCapHeld: number;
  /** Two-pass writer: transient writer/judge deferrals left for the next cycle. */
  v2Deferred: number;
  /** Two-pass writer: items that came back without facts, left for the next cycle. */
  v2MissingFacts: number;
  /** Two-pass writer: stories marked extracted after V2_MAX_ATTEMPTS failed attempts. */
  v2GaveUp: number;
  v2GaveUpReasons: Record<string, number>;
  /** True when the cycle stopped early because the day's writer budget was spent. */
  writerBudgetExhausted: boolean;
  /** Significance stage: holds by `not_notable:<rule|judge>` reason (shadow mode counts what it would hold). */
  significanceHeld: Record<string, number>;
  /** Significance stage: judge deferrals (error, budget, invalid) left for the next cycle. */
  significanceDeferred: number;
  /** Significance stage: verdicts per tier, keyed '1' | '2' | '3'. */
  tierCounts: Record<string, number>;
  heldImagesChecked: number;
  heldImagesPublished: number;
  theoryHoldReasons: Record<string, number>;
  heldPassReasons: Record<string, number>;
  errors: string[];
}

export function emptyResult(): ExtractStageResult {
  return {
    clustersConsidered: 0,
    extracted: 0,
    screenedOut: 0,
    skipped: 0,
    deferred: 0,
    theoriesUpserted: 0,
    abandonedTheories: 0,
    countdownsResolved: 0,
    dedupeMerged: 0,
    dedupeDiscarded: 0,
    dedupeHeld: 0,
    attachedToVideo: 0,
    dedupeDiscardReasons: {},
    v2Held: 0,
    dailyTextCapHeld: 0,
    v2Deferred: 0,
    v2MissingFacts: 0,
    v2GaveUp: 0,
    v2GaveUpReasons: {},
    writerBudgetExhausted: false,
    significanceHeld: {},
    significanceDeferred: 0,
    tierCounts: {},
    heldImagesChecked: 0,
    heldImagesPublished: 0,
    theoryHoldReasons: {},
    heldPassReasons: {},
    errors: [],
  };
}

export function recordDiscard(result: ExtractStageResult, decision: { reason?: string; momentId?: string }): void {
  const reason = decision.momentId ? 'duplicate_of_moment' : (decision.reason ?? 'no_new_info');
  result.dedupeDiscardReasons[reason] = (result.dedupeDiscardReasons[reason] ?? 0) + 1;
}

export function recordV2Hold(result: ExtractStageResult, reason: string): void {
  result.v2Held += 1;
  if (reason === DAILY_TEXT_CAP_HOLD || reason === TIER2_CAP_HOLD) result.dailyTextCapHeld += 1;
  result.heldPassReasons[reason] = (result.heldPassReasons[reason] ?? 0) + 1;
}
