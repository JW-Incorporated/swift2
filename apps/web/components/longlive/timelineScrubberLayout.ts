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

// Mobile top-aligns the rail just below the TopBar (Joey, follow-up to
// #2077): pt-20 = 80px = the real rendered TopBar height (h-10 icon
// buttons + py-3 + border-b = 65px; HEADER_OFFSET's 64 is that minus the
// border) + ~15px, which the era year label needs — it renders at -top-1
// translateY(-50%) and reaches ~12px above the rail's top, so smaller
// padding would slide it under the bar. Desktop keeps the centered rail
// (sm:items-center sm:pt-0) — the complaint was mobile-only.
export const SCRUBBER_ANCHOR_CLASS =
  'absolute top-0 h-svh w-full flex items-start justify-end pt-20 sm:items-center sm:pt-0';

export const SCRUBBER_RAIL_CLASS =
  'pointer-events-auto relative h-[74svh] w-full cursor-ns-resize touch-none select-none outline-none';
