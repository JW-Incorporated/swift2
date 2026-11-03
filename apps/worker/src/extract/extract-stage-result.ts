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
  /** Two-pass writer: transient writer/judge deferrals left for the next cycle. */
  v2Deferred: number;
  /** Two-pass writer: items that came back without facts, left for the next cycle. */
  v2MissingFacts: number;
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
    v2Deferred: 0,
    v2MissingFacts: 0,
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
  result.heldPassReasons[reason] = (result.heldPassReasons[reason] ?? 0) + 1;
}
