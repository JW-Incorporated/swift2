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
    heldImagesChecked: 0,
    heldImagesPublished: 0,
    theoryHoldReasons: {},
    heldPassReasons: {},
    errors: [],
  };
}
