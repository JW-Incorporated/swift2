import { describe, expect, it } from 'vitest';
import { BOTTOM_CLAMP_OVERSHOOT_PX, filterChangeScrollDelta } from './era-stream-pin';

describe('filterChangeScrollDelta', () => {
  it('is a no-op when the section top has not moved and still has plenty of content below', () => {
    const delta = filterChangeScrollDelta({
      sectionTop: 100,
      sectionBottom: 900,
      savedTop: 100,
      viewportCenter: 400,
      scrollY: 100,
    });
    expect(delta).toBe(0);
  });

  it('pins the section top when content ABOVE the active era changed (the common case)', () => {
    // Content above the active era grew by 60px (e.g. a widened filter), so
    // the section drifted down; the delta must scroll down 60px to restore
    // the pre-change top offset.
    const delta = filterChangeScrollDelta({
      sectionTop: 160,
      sectionBottom: 960,
      savedTop: 100,
      viewportCenter: 400,
      scrollY: 100,
    });
    expect(delta).toBe(60);
  });

  // Regression for adversarial review finding #3 (2026-08-13): a filter
  // change collapses the ACTIVE era's own feed to the short empty-state
  // message (e.g. Tour in folklore). Content above the section is untouched
  // (top unchanged), but the section's bottom has risen way above the
  // viewport center — pinning the top alone would leave the reader looking
  // at the FOLLOWING era's content.
  it('clamps toward keeping the collapsed section itself in view, instead of pinning a now-meaningless top', () => {
    const delta = filterChangeScrollDelta({
      sectionTop: 100,
      sectionBottom: 150, // collapsed to a one-line empty-state message
      savedTop: 100,
      viewportCenter: 400,
      scrollY: 1000, // plenty of room above; the geometry clamp binds first
    });
    // A pure top-pin would return 0 here, which is exactly the bug: the
    // section's predicted bottom (150) would sit far above the viewport
    // center (400), so the reader would be reading the NEXT era's content
    // instead. The clamp must pull the delta negative (scroll UP the page)
    // so the collapsed section's bottom reaches the reference line.
    expect(delta).toBeLessThan(0);
    const predictedTop = 100 - delta;
    const predictedBottom = 150 - delta;
    // Lands past the reference line by the overshoot (finding #4,
    // 2026-08-13), not exactly on it — see BOTTOM_CLAMP_OVERSHOOT_PX's doc
    // comment for why landing exactly on the line is the bug.
    expect(predictedBottom).toBe(400 + BOTTOM_CLAMP_OVERSHOOT_PX);
    expect(predictedTop).toBeLessThanOrEqual(400); // still satisfies "top <= center"
  });

  it('never scrolls to the top of the page — the delta stays bounded by the section geometry', () => {
    // Even a fully collapsed section near the top of a long page must only
    // move the viewport by the amount needed to reach the reference line,
    // never jump to absolute scrollY 0. Plenty of scrollY headroom here, so
    // the geometry clamp binds, not the page-boundary clamp.
    const delta = filterChangeScrollDelta({
      sectionTop: 20,
      sectionBottom: 40,
      savedTop: 20,
      viewportCenter: 400,
      scrollY: 1000,
    });
    // 40 - delta === 400 + overshoot, not a jump to page top.
    expect(delta).toBe(-(360 + BOTTOM_CLAMP_OVERSHOOT_PX));
  });

  // Re-review finding B (2026-08-13): the geometry-only clamp above can ask
  // for more upward scroll than the page actually has above it. Reproduced
  // with the SAME section geometry as the test above, but near the top of
  // the page (scrollY: 100): the uncapped delta would request an absolute
  // scroll position well below 0. The result must be clamped so the
  // requested absolute position is never negative.
  it('clamps the delta against the caller-supplied scrollY so the requested absolute position is never negative', () => {
    const scrollY = 100;
    const delta = filterChangeScrollDelta({
      sectionTop: 20,
      sectionBottom: 40,
      savedTop: 20,
      viewportCenter: 400,
      scrollY,
    });
    expect(delta).toBe(-100); // clamped: 100 + delta === 0, not the deeper uncapped request
    expect(scrollY + delta).toBeGreaterThanOrEqual(0);
  });

  it('rapid back-to-back collapses each resolve independently from their own saved offset', () => {
    // Two successive filter toggles, each collapsing further — each call is
    // pure and only depends on its own inputs, so there is no compounding
    // drift from a stale intermediate state.
    const scrollY = 1000; // plenty of room above for both calls
    const first = filterChangeScrollDelta({
      sectionTop: 100,
      sectionBottom: 300,
      savedTop: 100,
      viewportCenter: 400,
      scrollY,
    });
    expect(first).toBeLessThan(0);
    const second = filterChangeScrollDelta({
      sectionTop: 100 - first,
      sectionBottom: 120 - first,
      savedTop: 100 - first,
      viewportCenter: 400,
      scrollY: scrollY + first,
    });
    expect(second).toBeLessThan(0);
    const finalBottom = 120 - first - second;
    expect(finalBottom).toBe(400 + BOTTOM_CLAMP_OVERSHOOT_PX);
  });

  it('does not clamp when the section still reaches at least the (overshot) reference line', () => {
    const delta = filterChangeScrollDelta({
      sectionTop: 100,
      sectionBottom: 400 + BOTTOM_CLAMP_OVERSHOOT_PX + 1, // just barely past it
      savedTop: 100,
      viewportCenter: 400,
      scrollY: 100,
    });
    expect(delta).toBe(0);
  });

  // Adversarial review finding #4 (2026-08-13): landing the section's bottom
  // EXACTLY at viewportCenter left the result one `scrollBy` sub-pixel
  // rounding away from flipping EraStream's active-era pick to the following
  // era. The section geometry here would previously have clamped to exactly
  // 400 — the fix must clear that line by a few pixels instead.
  it('clamps past the reference line by BOTTOM_CLAMP_OVERSHOOT_PX, not exactly onto it', () => {
    const delta = filterChangeScrollDelta({
      sectionTop: 100,
      sectionBottom: 400, // would have landed exactly on the old knife-edge
      savedTop: 100,
      viewportCenter: 400,
      scrollY: 1000,
    });
    const predictedBottom = 400 - delta;
    expect(BOTTOM_CLAMP_OVERSHOOT_PX).toBeGreaterThan(0);
    expect(predictedBottom).toBe(400 + BOTTOM_CLAMP_OVERSHOOT_PX);
    expect(predictedBottom).toBeGreaterThan(400); // clear of the line, not on it
  });
});
