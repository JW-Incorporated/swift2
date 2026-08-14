// Scrubber positioning classes, extracted so the mobile-drift regression
// test (timelineScrubberLayout.test.ts) can pin the viewport units.
//
// The mobile URL bar collapses on scroll-down and returns on scroll-up,
// resizing the dynamic viewport. Two elements here need OPPOSITE anchors:
//
// - The SHELL (and the scrim inside it) SHOULD track the dynamic viewport
//   (`inset-y-0`), so the legibility gradient always covers the full
//   visible height — even the strip below 100svh that appears while the
//   URL bar is collapsed.
// - The ANCHOR must NOT track it: it is top-anchored with a small-viewport
//   height (`top-0 h-svh` — constant regardless of browser chrome), so the
//   flex-centered rail inside it holds perfectly still while scrolling.
//   The rail uses the same stable unit (svh, never plain vh). Centering
//   the rail directly in an `inset-y-0` box is what caused the reported
//   drift. On desktop svh === vh, so nothing changes there.

export const SCRUBBER_SHELL_CLASS =
  'pointer-events-none fixed inset-y-0 right-0 z-30 w-10 sm:w-12';

export const SCRUBBER_SCRIM_CLASS = 'absolute inset-y-0 right-0 w-full';

// Top-aligns the rail just below the TopBar (Joey, follow-up to #2077):
// pt-20 = 80px = the real rendered TopBar height (h-10 icon buttons +
// py-3 + border-b = 65px — the TopBar-only case of chrome-offset.ts's
// measureChromeHeight()) + 15px. The era year label uses leading-none and
// renders at -top-1
// translateY(-50%), reaching 9px above the rail at the default 10px text
// size.
//
// Centering is gated on BOTH viewport dimensions, not a width breakpoint
// (Codex P1 on #2079): a landscape phone is >=640px wide but short, and
// centering there puts the rail's top (13svh ~ 49px at 375px height)
// inside the 65px TopBar. The centered top gap 13svh >= 80px needs
// height >= ~616px, so centering requires 640px width AND 620px height.
// (Syntax note: the underscore after @media is load-bearing — without it
// Tailwind v4 silently emits nothing for the candidate; verified against
// the compiled CSS.)
export const SCRUBBER_ANCHOR_CLASS =
  'absolute top-0 h-svh w-full flex items-start justify-end pt-20 [@media_(min-width:640px)_and_(min-height:620px)]:items-center [@media_(min-width:640px)_and_(min-height:620px)]:pt-0';

// 74svh, capped so the endpoint adornments (leading-none year labels and
// the date pill, hanging ~11px past the rail's ends) keep clearance on
// short viewports: 100svh - 6rem = the 80px top offset + a 16px bottom
// reserve (Codex P1 on #2079). The cap is deliberately UNCONDITIONAL: it
// cannot bind where centering is active (74svh < 100svh - 96px whenever
// height > ~369px), and gating it on width would reopen the same
// short-landscape hole the anchor variant above closes.
export const SCRUBBER_RAIL_CLASS =
  'pointer-events-auto relative h-[min(74svh,calc(100svh-6rem))] w-full cursor-ns-resize touch-none select-none outline-none';

/** Keep the compact date pill inside the rail at its two hard endpoints. */
export function scrubberPillTransform(pct: number): string {
  if (pct <= 2) return 'translateY(0)';
  if (pct >= 98) return 'translateY(-100%)';
  return 'translateY(-50%)';
}

/** Place the variable-height preview away from the nearest viewport edge. */
export function scrubberTooltipTransform(pct: number): string {
  return pct < 50 ? 'translateY(0)' : 'translateY(-100%)';
}

// --- Anchor honesty (adversarial review finding #1, 2026-08-13) -----------
//
// TimelineScrubber measures every `[data-ll-item]` card as a rail anchor so
// it can position the handle and interpolate a date for the pill/
// aria-valuetext. Some of those anchors are synthetic (anchor-date.ts's
// `era-scatter`/`clamped`/`related-*` sources) — real enough to POSITION a
// card, never real enough to be shown or announced as a fact (the honesty
// rule). `exact` on each measured anchor carries that distinction through
// from `data-ll-exact` (default true — every card that can be synthetic sets
// it explicitly), and `labelForDate` is the single choke point that turns a
// resolved date into on-screen/AT text, so a synthetic anchor can never reach
// either surface no matter which code path resolved it (drag, scroll-sync,
// or the pre-measure calendar-linear fallback).

export interface ScrubberAnchor {
  date: number;
  top: number;
  exact: boolean;
}

/** Same "Date unknown" voice the cards themselves use for an unauthored date. */
export const UNKNOWN_DATE_LABEL = 'Date unknown';

/**
 * Whether a resolved date (interpolated or exact) may be shown/announced:
 * the exactness of whichever measured anchor is nearest to it BY DATE. No
 * anchors measured yet defaults to exact so first paint (the calendar-linear
 * fallback, before any card has been measured) isn't suppressed.
 */
export function nearestAnchorExact(anchors: readonly ScrubberAnchor[], target: number): boolean {
  if (!anchors.length) return true;
  let bestDist = Math.abs(anchors[0].date - target);
  let bestExact = anchors[0].exact;
  for (const anchor of anchors) {
    const dist = Math.abs(anchor.date - target);
    if (dist < bestDist) {
      bestDist = dist;
      bestExact = anchor.exact;
    } else if (dist === bestDist) {
      bestExact = bestExact && anchor.exact;
    }
  }
  return bestExact;
}

/**
 * The only place a resolved date becomes display/AT text. `formatted` is
 * whatever the caller would otherwise show (e.g. `fmtMonth(ms)`) — `exact`
 * decides whether that string is ever allowed to reach the screen. A
 * synthetic anchor's formatted date is computed and then discarded here,
 * never returned, which is what makes it impossible for one to leak through
 * regardless of which caller (pill text, aria-valuetext) formats it.
 */
export function labelForDate(formatted: string, exact: boolean): string {
  return exact ? formatted : UNKNOWN_DATE_LABEL;
}
