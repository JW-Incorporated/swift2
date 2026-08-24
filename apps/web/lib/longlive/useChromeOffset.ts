'use client';

import { useLayoutEffect, useState } from 'react';
import { measureChromeHeight } from './chrome-offset';

/**
 * Live sticky-chrome height in pixels — TopBar + FilterBar when mounted —
 * re-measured on resize/reflow so a TopBar height change (breakpoint
 * crossing, font swap) can't leave it stale. `useLayoutEffect`, not
 * `useEffect`, so the very first client paint already reflects it (the same
 * flash this codebase already guards against in FeedbackButton.tsx).
 *
 * Split out of `ClownChat.tsx` purely for file-length hygiene (MAP.md;
 * CLAUDE.md's 300-line guideline, flagged as a LOW finding in
 * HUMAN-ACTIONS.md #15) — same pattern as this directory's other single-
 * purpose hooks (`useScrollLock.ts`). `topBarSelector` is injectable only so
 * a future caller with a different sticky-chrome anchor doesn't have to fork
 * this hook; `ClownChat.tsx` passes `[data-ll-topbar]`, its own real anchor.
 */
export function useChromeOffset(topBarSelector: string): number {
  const [chromeOffsetPx, setChromeOffsetPx] = useState(0);
  useLayoutEffect(() => {
    const update = () => setChromeOffsetPx(measureChromeHeight());
    update();
    const topBar = document.querySelector<HTMLElement>(topBarSelector);
    const ro = topBar ? new ResizeObserver(update) : undefined;
    ro?.observe(topBar as HTMLElement);
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [topBarSelector]);
  return chromeOffsetPx;
}
