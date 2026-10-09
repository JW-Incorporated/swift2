import { describe, expect, it } from 'vitest';
import { jumpLandingScrollTop, shouldRunEraJump } from './era-jump-landing';

/**
 * Regression coverage for adversarial review finding #1 (2026-08-14): a
 * fresh visit to `/` never showed the masthead because the mount-time jump
 * guard treated the plain front-door mount the same as a no-snapshot
 * openEra mount and jumped the current era's section to the chrome anyway.
 */
describe('shouldRunEraJump', () => {
  it('a fresh front-door mount (no restore, eraJumpSeq still 0) must NOT jump', () => {
    expect(shouldRunEraJump({ hasRestore: false, eraJumpSeq: 0, handledJumpSeq: 0 })).toBe(false);
  });

  it('a no-snapshot openEra/deep-link mount (no restore, eraJumpSeq already bumped) must jump', () => {
    expect(shouldRunEraJump({ hasRestore: false, eraJumpSeq: 1, handledJumpSeq: 1 })).toBe(true);
  });

  it('a real jump while already mounted (eraJumpSeq changed since last handled) must jump, restore or not', () => {
    expect(shouldRunEraJump({ hasRestore: true, eraJumpSeq: 2, handledJumpSeq: 1 })).toBe(true);
    expect(shouldRunEraJump({ hasRestore: false, eraJumpSeq: 2, handledJumpSeq: 1 })).toBe(true);
  });

  it('a mount that restored a snapshot does not jump on its own', () => {
    expect(shouldRunEraJump({ hasRestore: true, eraJumpSeq: 0, handledJumpSeq: 0 })).toBe(false);
  });

  it('StrictMode double-invoke with a restored snapshot does not re-jump', () => {
    expect(shouldRunEraJump({ hasRestore: true, eraJumpSeq: 1, handledJumpSeq: 1 })).toBe(false);
  });
});

/**
 * Regression coverage for the founder-reported "our scroll goes under the
 * filters" bug (2026-08-14). eraJumpScroll.test.ts already covers the
 * settle/timing contract of EraStream's jump-correct loop; this covers the
 * LANDING POSITION math it applies on every correction pass, using the
 * researcher's measured numbers (section top 0.48px, chrome bottom 178px —
 * TopBar 65px + FilterBar 113px, pre-fix) as fixtures.
 */
describe('jumpLandingScrollTop', () => {
  it('THE BUG: the naive formula (no chrome offset) lands the section under the chrome', () => {
    // What the old code did: `el.getBoundingClientRect().top + window.scrollY`,
    // i.e. chromeHeight = 0 — scrolls the section's top edge to viewport y=0,
    // directly underneath the 178px of sticky chrome pinned over that spot.
    const scrollY = 4000;
    const sectionTop = 0.48; // measured post-jump, pre-fix
    const target = jumpLandingScrollTop({ sectionTop, scrollY, chromeHeight: 0 });
    expect(target).toBeCloseTo(scrollY + sectionTop, 5);
    // After scrolling to `target`, the section's new viewport top is
    // `sectionTop - (target - scrollY)` = 0.48 — hidden under the 178px chrome.
    const newSectionTop = sectionTop - (target - scrollY);
    expect(newSectionTop).toBeLessThan(178);
  });

  it('THE FIX: subtracting the measured chrome height lands the section just below it', () => {
    const scrollY = 4000;
    const sectionTop = 0.48;
    const chromeHeight = 178; // TopBar 65 + FilterBar 113 (pre-fix measurement)
    const target = jumpLandingScrollTop({ sectionTop, scrollY, chromeHeight });
    expect(target).toBeCloseTo(scrollY + sectionTop - chromeHeight, 5);
    // After scrolling to `target`, the section's new viewport top lands
    // exactly at the bottom of the chrome — visible, not hidden under it.
    const newSectionTop = sectionTop - (target - scrollY);
    expect(newSectionTop).toBeCloseTo(chromeHeight, 5);
  });

  it('is a no-op adjustment when there is no chrome to compensate for', () => {
    expect(jumpLandingScrollTop({ sectionTop: 12, scrollY: 500, chromeHeight: 0 })).toBe(512);
  });

  it('re-corrects consistently across repeated calls with a live-measured chrome height (settle window)', () => {
    // Every pass of EraStream's settle-window correct() loop re-measures the
    // chrome and re-applies this same formula — simulate a few passes with a
    // chrome height that itself settles (e.g. FilterBar's ResizeObserver
    // catching up) and confirm each pass's target is internally consistent,
    // not just the first one.
    const passes = [
      { sectionTop: 3.2, scrollY: 4000, chromeHeight: 109 },
      { sectionTop: -1.1, scrollY: 4102, chromeHeight: 109 },
      { sectionTop: 0, scrollY: 4101, chromeHeight: 109 },
    ];
    for (const p of passes) {
      const target = jumpLandingScrollTop(p);
      const newSectionTop = p.sectionTop - (target - p.scrollY);
      expect(newSectionTop).toBeCloseTo(p.chromeHeight, 5);
    }
  });
});
