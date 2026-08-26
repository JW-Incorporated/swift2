/**
 * The scroll delta needed to keep the reader inside the active era's section
 * across a filter change (PLAN.md's "the user must stay in the era they were
 * in", plus the adversarial-review fix for the collapse case, 2026-08-13).
 *
 * Preserves the section's TOP at its pre-change viewport offset by default —
 * that's the common case, where the filter only narrows/widens the feed
 * without changing anything ABOVE the active era. But when the filter change
 * collapses the active era itself (its feed becomes the short empty-state
 * message — PLAN.md step 6a), the section's BOTTOM can rise above the
 * reading reference line even while its top stays put, silently landing the
 * reader in the FOLLOWING era's content instead. So the top-preserving delta
 * is clamped: if it would leave the section's new bottom above
 * `viewportCenter` (the same reference EraStream's active-era detection
 * uses), the delta is reduced — scrolled further up the page — just enough
 * to keep the section's bottom at that line instead, trading top-exactness
 * for staying in the right era, which is the actual requirement. Never falls
 * back to scrolling to the top of the page: the bottom-clamp above can ask
 * for more upward scroll than the page has room for (re-review finding B,
 * 2026-08-13), so the result is clamped again against the caller's own
 * `window.scrollY` — the requested absolute scroll position can never go
 * negative, which is what `window.scrollBy` would otherwise silently do for
 * the caller.
 *
 * The bottom-clamp target is `viewportCenter + BOTTOM_CLAMP_OVERSHOOT_PX`,
 * not `viewportCenter` exactly (adversarial review finding #4, 2026-08-13):
 * landing the section's bottom EXACTLY on the reference line means the
 * post-`scrollBy` sub-pixel rounding a real browser does can put it a
 * fraction either side of that line, which is enough to flip EraStream's
 * active-era pick to the following era right after the clamp was meant to
 * keep the reader in this one. A few pixels of overshoot lands the bottom
 * clearly past the line instead of exactly on its knife-edge.
 */
export const BOTTOM_CLAMP_OVERSHOOT_PX = 4;

export function filterChangeScrollDelta(input: {
  /** The active era section's current top, in viewport coordinates
   * (`getBoundingClientRect().top`), before any correction. */
  sectionTop: number;
  /** The active era section's current bottom, in viewport coordinates. */
  sectionBottom: number;
  /** The section's top the instant before the filter changed. */
  savedTop: number;
  /** The reading reference line — EraStream uses the viewport's vertical
   * center, the same line its active-era detection reads. */
  viewportCenter: number;
  /** The caller's current `window.scrollY`, so the delta can be clamped to
   * never request a negative absolute scroll position. */
  scrollY: number;
}): number {
  const { sectionTop, sectionBottom, savedTop, viewportCenter, scrollY } = input;
  let delta = sectionTop - savedTop;
  const predictedBottom = sectionBottom - delta;
  const clampTarget = viewportCenter + BOTTOM_CLAMP_OVERSHOOT_PX;
  if (predictedBottom < clampTarget) {
    delta -= clampTarget - predictedBottom;
  }
  return Math.max(delta, -scrollY);
}
