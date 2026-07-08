'use client';

import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Runs `onFrame(scrollEl)` on every scroll of the reader — coalesced into one
 * rAF per frame — plus once on mount and on resize/layout. This is the beating
 * heart of the passive scrubbers: they read the scroll position here and write
 * CSS transforms directly, so nothing re-renders React per pointer-move or per
 * frame (the architecture's hard rule for the 60fps budget).
 */
export function useRafScroll(
  scrollRef: RefObject<HTMLElement | null>,
  onFrame: (scrollEl: HTMLElement) => void,
  deps: readonly unknown[] = [],
): void {
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    let ticking = false;
    const run = () => {
      ticking = false;
      onFrame(el);
    };
    const schedule = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(run);
      }
    };

    el.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Two rAFs: let the era sections lay out before the first read.
    const t = requestAnimationFrame(() => requestAnimationFrame(run));

    return () => {
      el.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
