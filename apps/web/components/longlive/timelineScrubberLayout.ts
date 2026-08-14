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

// The centered-mode breakpoint above, restated as plain numbers (not folded
// into a template literal) so the Tailwind arbitrary-variant class strings
// stay literal text the build's static class scanner can find.
// TimelineScrubber's own matchMedia clamp (adversarial review finding #2,
// 2026-08-14 — see scrubberAnchorPaddingTop below) uses these so the two
// conditions can never drift apart silently.
export const SCRUBBER_CENTER_MIN_WIDTH = 640;
export const SCRUBBER_CENTER_MIN_HEIGHT = 620;

/** Matches SCRUBBER_ANCHOR_CLASS's own centered-mode breakpoint exactly. */
export const SCRUBBER_CENTER_MEDIA_QUERY = `(min-width: ${SCRUBBER_CENTER_MIN_WIDTH}px) and (min-height: ${SCRUBBER_CENTER_MIN_HEIGHT}px)`;

/** Base top offset (px) baked into SCRUBBER_ANCHOR_CLASS's `pt-20` —
 *  TopBar-only height (see the comment above it). */
export const SCRUBBER_BASE_PT = 80;

/**
 * Extra top padding (px) the scrubber's anchor container needs so the rail's
 * clickable area — and its always-visible date pill — never starts
 * underneath the sticky chrome (TopBar + FilterBar). `pt-20` only ever
 * accounted for TopBar; FilterBar's live height was unaccounted for, so on
 * any viewport where FilterBar renders (every mobile load) the rail's top
 * band silently overlapped the filter chips, making the last chip
 * unreachable — every tap on it landed on the rail or the date pill instead
 * (adversarial review finding #2, 2026-08-14).
 *
 * Returns `undefined` — defer entirely to the CSS class's own value — when
 * the measured chrome doesn't exceed the base `pt-20`, or the container is
 * in centered mode (SCRUBBER_CENTER_MEDIA_QUERY matched), where vertical
 * position comes from `items-center` instead of padding and no clamp is
 * needed or wanted.
 */
export function scrubberAnchorPaddingTop(input: {
  /** Live measureChromeHeight() reading — TopBar + FilterBar, or 0/TopBar-only
   *  where FilterBar isn't mounted. */
  chromeHeight: number;
  /** Whether SCRUBBER_CENTER_MEDIA_QUERY currently matches. */
  isCentered: boolean;
}): number | undefined {
  if (input.isCentered) return undefined;
  return input.chromeHeight > SCRUBBER_BASE_PT ? input.chromeHeight : undefined;
}

// 74svh, capped so the endpoint adornments (leading-none year labels and
// the date pill, hanging ~11px past the rail's ends) keep clearance on
// short viewports: 100svh - 6rem = the 80px top offset + a 16px bottom
// reserve (Codex P1 on #2079). The cap is deliberately UNCONDITIONAL: it
// cannot bind where centering is active (74svh < 100svh - 96px whenever
// height > ~369px), and gating it on width would reopen the same
// short-landscape hole the anchor variant above closes.
export const SCRUBBER_RAIL_CLASS =
  'pointer-events-auto relative h-[min(74svh,calc(100svh-6rem))] w-full cursor-ns-resize touch-none select-none outline-none';

/**
 * Grain (ms) `Date.now()` is snapped DOWN to before it's used as the current
 * era's live upper bound. Without this, the SSR render and the client
 * hydration render each call `Date.now()` independently — seconds or even
 * milliseconds apart — so the current era's span (and therefore every
 * rendered rail percentage within it) is *guaranteed* to differ by some tiny
 * amount on every single load. Snapping both calls to the same 5-minute
 * window means they compute the exact same integer `end`, hence the exact
 * same span and the exact same percentages, bit-for-bit — not merely
 * "probably close enough to round the same way" (roundRailPct below is
 * still applied as defense in depth for the rare case a load straddles a
 * grain boundary, adversarial review finding #3, 2026-08-14). A 5-minute
 * stale "now" is irrelevant on a timeline spanning months.
 */
export const CURRENT_ERA_NOW_GRAIN_MS = 5 * 60_000;

/** Pure: floors `nowMs` to the nearest `grainMs` boundary at or before it. */
export function snapNow(nowMs: number, grainMs: number = CURRENT_ERA_NOW_GRAIN_MS): number {
  return Math.floor(nowMs / grainMs) * grainMs;
}

/**
 * Fixed decimal precision applied to every rail percentage before it
 * becomes a CSS `top` value or SVG ridge coordinate — the single place a
 * percentage is produced, so an independently-computed server vs. client
 * value (e.g. a current-era percentage derived from `Date.now()`, evaluated
 * microseconds apart by the SSR pass and the hydration pass) can't disagree
 * past this many decimals and cause a hydration mismatch (adversarial
 * review finding #3, 2026-08-14: `top: "1.14252%"` server vs.
 * `"1.1425251289221632%"` client on every fresh load).
 */
export const RAIL_PCT_DECIMALS = 4;

/** Pure: rounds a 0..100 rail percentage to RAIL_PCT_DECIMALS. */
export function roundRailPct(pct: number): number {
  const factor = 10 ** RAIL_PCT_DECIMALS;
  return Math.round(pct * factor) / factor;
}

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
