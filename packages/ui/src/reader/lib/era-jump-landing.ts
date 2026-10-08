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
/**
 * Whether EraStream's mount/jump effect should run its scroll-correction
 * loop this firing. Mirrors the effect's own guard so the decision is
 * testable without mounting React.
 *
 * The effect fires once on mount AND on every later eraJumpSeq change
 * (React effect semantics) — this decides which firings should actually
 * scroll:
 *  - A real jump (setEra/openEra/goHome/restoreNav all bump eraJumpSeq
 *    before or during the mount that follows) always runs, once per bumped
 *    value.
 *  - A mount that restored a saved scroll snapshot never runs on its own
 *    (the restore effect already positioned the page); it only runs again
 *    once eraJumpSeq later changes.
 *  - A mount with NO snapshot and eraJumpSeq still at its initial 0 is the
 *    plain front-door load — it must NOT jump, or the masthead never shows
 *    (adversarial review finding #1, 2026-08-14). eraJumpSeq is 0 only
 *    before any real jump has ever happened, so this can never suppress a
 *    genuine one.
 */
export function shouldRunEraJump(input: {
  /** Whether this mount restored a saved era-stream scroll snapshot. */
  hasRestore: boolean;
  /** The store's current eraJumpSeq. */
  eraJumpSeq: number;
  /** The eraJumpSeq value this effect last actually ran for. */
  handledJumpSeq: number;
}): boolean {
  if (!input.hasRestore && input.eraJumpSeq === 0) return false;
  if (input.hasRestore && input.handledJumpSeq === input.eraJumpSeq) return false;
  return true;
}

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
