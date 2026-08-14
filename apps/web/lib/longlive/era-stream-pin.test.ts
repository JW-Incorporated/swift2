import { describe, expect, it } from 'vitest';
import { filterChangeScrollDelta } from './era-stream-pin';

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
    expect(predictedBottom).toBe(400); // bottom lands exactly on the reference line
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
    expect(delta).toBe(-360); // 40 - (-360) = 400, not a jump to page top
  });

  // Re-review finding B (2026-08-13): the geometry-only clamp above can ask
  // for more upward scroll than the page actually has above it. Reproduced
  // with the SAME section geometry as the test above, but near the top of
  // the page (scrollY: 100): the uncapped delta (-360) would request an
  // absolute scroll position of 100 + -360 = -260. The result must be
  // clamped so the requested absolute position is never negative.
  it('clamps the delta against the caller-supplied scrollY so the requested absolute position is never negative', () => {
    const scrollY = 100;
    const delta = filterChangeScrollDelta({
      sectionTop: 20,
      sectionBottom: 40,
      savedTop: 20,
      viewportCenter: 400,
      scrollY,
    });
    expect(delta).toBe(-100); // clamped: 100 + delta === 0, not -260
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
    expect(finalBottom).toBe(400);
  });

  it('does not clamp when the section still reaches at least the reference line', () => {
    const delta = filterChangeScrollDelta({
      sectionTop: 100,
      sectionBottom: 401, // just barely reaches the reference line
      savedTop: 100,
      viewportCenter: 400,
      scrollY: 100,
    });
    expect(delta).toBe(0);
  });
});
