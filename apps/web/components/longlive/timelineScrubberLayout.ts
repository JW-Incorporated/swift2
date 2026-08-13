// Scrubber positioning classes, extracted so the mobile-drift regression
// test (timelineScrubberLayout.test.ts) can pin the viewport units.
//
// h-svh / 74svh, NOT inset-y-0 / 74vh: on mobile the URL bar collapses on
// scroll-down and reappears on scroll-up, resizing the dynamic viewport
// that `inset-y-0` (top+bottom anchored) tracks. The flex-centered rail
// then shifts with every collapse/expand — visible drift. The small
// viewport unit (svh) is constant regardless of browser chrome, so both
// the container and the rail hold still. On desktop svh === vh.

export const SCRUBBER_CONTAINER_CLASS =
  'pointer-events-none fixed right-0 top-0 z-30 flex h-svh w-10 items-center justify-end sm:w-12';

export const SCRUBBER_RAIL_CLASS =
  'pointer-events-auto relative h-[74svh] w-full cursor-ns-resize touch-none select-none outline-none';
