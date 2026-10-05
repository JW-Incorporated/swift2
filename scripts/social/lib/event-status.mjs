// Pure logic for scripts/social/event-status.mjs (t_4ebbe8ba, implementing
// t_60c73aaa's approved design). Kept separate from the Supabase/knowledge-
// client I/O in event-status.mjs so it's unit-testable, same convention as
// weekly-scorecard.mjs / lib/growth.mjs.
//
// This module never re-derives the website's own live-event signal or its
// tie-break — it calls `pickBannerCandidate` from `@swift2/experience`
// (packages/experience/src/current-feed.ts) verbatim, per the design's
// explicit instruction and the card's step 3/8. Everything here is strictly
// downstream of that one function's output: proximity-to-blend mapping,
// wind-down detection, and the tiny transition-hash used by the 4h trigger.

/**
 * Founder decision D1=A (t_4ebbe8ba body): blend aggressiveness scales by
 * event kind. A countdown always resolves, so it's safe to go hard near the
 * deadline; a theory may never resolve, so it stays blended even when hot.
 *
 *   countdown, >48h out   -> 'far'  (1 of 2 daily beats reserved)
 *   countdown, <=48h out  -> 'near' (both daily beats reserved)
 *   theory, any distance  -> 'far'  (never goes to 'near' — no hard deadline
 *                            to justify a full-blend spend on something that
 *                            could run hot for weeks with no resolution)
 *
 * `daysToResolution` is undefined for a theory (it has none); a countdown
 * without a resolvable date should not happen (pickBannerCandidate already
 * requires `countdownTargetAt` to parse), but this fails safe to 'far'
 * rather than throwing if it ever does.
 */
const NEAR_EVENT_THRESHOLD_DAYS = 2; // 48h, per the design's own proposed shape

export function blendTierFor(kind, daysToResolution) {
  if (kind === 'theory') return 'far';
  if (typeof daysToResolution !== 'number' || Number.isNaN(daysToResolution)) return 'far';
  return daysToResolution <= NEAR_EVENT_THRESHOLD_DAYS ? 'near' : 'far';
}

/** How many of the day's two beats (weekly-plan reservation, daily-draft
 * weighting) a given blend tier reserves for event coverage. */
export function reservedBeatsFor(blendTier) {
  return blendTier === 'near' ? 2 : 1;
}

/**
 * Founder decision D2=A: 24-48h wind-down after resolution before fully
 * reverting to normal rotation. Proposed shape (design §4): pick the
 * midpoint, 36h, as a single deterministic window rather than a range —
 * a range needs a second founder call this card doesn't ask for, and 36h
 * splits the approved 24-48h evenly.
 */
export const WIND_DOWN_MS = 36 * 60 * 60 * 1000;

/**
 * True when `resolvedAtIso` (countdown_resolved_at, or the ISO timestamp a
 * theory's heat/status flip was first observed — the caller's job to
 * record, this function only does the arithmetic) is within the wind-down
 * window of `nowMs`. False (not wind-down) once the window has fully
 * elapsed OR when `resolvedAtIso` is unset/unparseable (nothing to wind
 * down from).
 */
export function isWindingDown(resolvedAtIso, nowMs) {
  if (!resolvedAtIso) return false;
  const resolvedMs = Date.parse(resolvedAtIso);
  if (Number.isNaN(resolvedMs)) return false;
  const elapsed = nowMs - resolvedMs;
  return elapsed >= 0 && elapsed < WIND_DOWN_MS;
}

/**
 * Builds the one JSON object `event-status.mjs` prints (card step 3):
 * `{ mode, kind, id, target/heat, daysToResolution, blendTier,
 * reservedBeats, windingDown }`. Pure — takes the already-resolved
 * `pickBannerCandidate` result (or undefined) plus `nowMs`, so this is
 * testable with a fake candidate instead of a live DB row.
 *
 * `previousResolution` (optional) lets the caller pass a remembered
 * resolvedAt/fadedAt timestamp for wind-down when `pickBannerCandidate`
 * itself no longer returns a candidate (a resolved countdown or a
 * debunked/faded theory drops out of pickBannerCandidate's live set
 * entirely — see event-status.mjs's own header for how the caller tracks
 * that outside this pure function).
 */
export function buildEventStatus(candidate, nowMs, previousResolution) {
  if (!candidate) {
    const windingDown = previousResolution
      ? isWindingDown(previousResolution.resolvedAt, nowMs)
      : false;
    return {
      mode: windingDown ? 'event' : 'normal',
      kind: windingDown ? previousResolution.kind : null,
      id: windingDown ? previousResolution.id : null,
      windingDown,
      blendTier: null,
      reservedBeats: windingDown ? 1 : 0, // wind-down: recap/reaction only, never both beats
    };
  }

  if (candidate.kind === 'countdown') {
    const targetMs = Date.parse(candidate.item.countdownTargetAt);
    const daysToResolution = Number.isNaN(targetMs)
      ? undefined
      : (targetMs - nowMs) / (24 * 60 * 60 * 1000);
    const blendTier = blendTierFor('countdown', daysToResolution);
    return {
      mode: 'event',
      kind: 'countdown',
      id: candidate.item.id,
      target: candidate.item.countdownTargetAt,
      daysToResolution,
      blendTier,
      reservedBeats: reservedBeatsFor(blendTier),
      windingDown: false,
    };
  }

  const blendTier = blendTierFor('theory', undefined);
  return {
    mode: 'event',
    kind: 'theory',
    id: candidate.theory.id,
    heat: candidate.theory.heat,
    daysToResolution: undefined,
    blendTier,
    reservedBeats: reservedBeatsFor(blendTier),
    windingDown: false,
  };
}

/** Stable, order-independent hash of a status object's transition-relevant
 * fields — the 4h trigger (card step 7) diffs THIS, not the whole object,
 * so heat/daysToResolution ticking between runs doesn't itself trigger a
 * replan; only mode/kind/id/windingDown crossing a boundary should. */
export function transitionKey(status) {
  return JSON.stringify({
    mode: status.mode,
    kind: status.kind,
    id: status.id,
    windingDown: status.windingDown,
  });
}
