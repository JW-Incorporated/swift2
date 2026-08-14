/**
 * The absolute `window.scrollTo({ top })` target for EraStream's jump-correct
 * loop landing on a section. Scrolling the section's top edge to viewport
 * y=0 (the naive `el.getBoundingClientRect().top + window.scrollY`) lands it
 * UNDER the sticky chrome pinned over that spot — the founder-reported "our
 * scroll goes under the filters" bug (2026-08-14: "so when I hit any era,
 * the era is hidden under the filters"). Subtracting the live chrome height
 * (chrome-offset.ts's `measureChromeHeight()`) instead lands the section's
 * top edge just below the chrome, where it's actually visible.
 */
export function jumpLandingScrollTop(input: {
  /** The target section's current top, in viewport coordinates
   * (`getBoundingClientRect().top`), before this correction. */
  sectionTop: number;
  /** The caller's current `window.scrollY`. */
  scrollY: number;
  /** Live sticky chrome height — `measureChromeHeight()`. */
  chromeHeight: number;
}): number {
  return input.sectionTop + input.scrollY - input.chromeHeight;
}
