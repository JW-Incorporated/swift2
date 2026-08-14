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
 * back to scrolling to the top of the page.
 */
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
}): number {
  const { sectionTop, sectionBottom, savedTop, viewportCenter } = input;
  let delta = sectionTop - savedTop;
  const predictedBottom = sectionBottom - delta;
  if (predictedBottom < viewportCenter) {
    delta -= viewportCenter - predictedBottom;
  }
  return delta;
}
