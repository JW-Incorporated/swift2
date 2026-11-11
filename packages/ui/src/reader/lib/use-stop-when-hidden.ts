'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Module-level set of stop callbacks for every active embed gate.
 * When a new gate claims playback, every other registered stop is called so
 * only one player is ever audible.
 */
const activeStops = new Set<() => void>();

/**
 * Call every OTHER registered stop, then register this one.
 * Exposed for tests that need to simulate a second gate starting.
 */
export function claimPlayback(stop: () => void): void {
  for (const other of activeStops) {
    if (other !== stop) other();
  }
  activeStops.add(stop);
}

function deregister(stop: () => void): void {
  activeStops.delete(stop);
}

/**
 * While `active` is true, calls `stop()` the moment the element STOPS being
 * seen (it must first have been seen, so a player that starts below the fold
 * or under fixed UI is not killed at mount):
 *  a. the tab becomes hidden (visibilitychange → 'hidden')
 *  b. the element scrolls off-screen (IntersectionObserver ratio < 0.5) — only
 *     once it has been seen at ratio >= 0.5
 *  c. another element covers the element's centre (750 ms elementFromPoint
 *     poll) — only once a check has seen the element uncovered
 *  d. another gate claims playback (module-level Set, via claimPlayback)
 *
 * All listeners and the interval are registered only while `active` and
 * cleaned up on deactivate or unmount.
 */
export function useStopWhenHidden(
  active: boolean,
  elementRef: RefObject<HTMLElement | null>,
  stop: () => void,
): void {
  useEffect(() => {
    if (!active) return;

    // (a) visibilitychange
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') stop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    // (b) IntersectionObserver — stop only once it has been seen in view
    let io: IntersectionObserver | null = null;
    let seenInView = false;
    if (typeof IntersectionObserver !== 'undefined' && elementRef.current) {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.intersectionRatio >= 0.5) {
              seenInView = true;
            } else if (seenInView) {
              stop();
              break;
            }
          }
        },
        { threshold: [0, 0.5] },
      );
      io.observe(elementRef.current);
    }

    // (c) 750 ms covered-check via elementFromPoint — stop only once seen uncovered
    let interval: ReturnType<typeof setInterval> | null = null;
    let seenUncovered = false;
    if (typeof document.elementFromPoint === 'function') {
      interval = setInterval(() => {
        const el = elementRef.current;
        if (!el) return;
        if (document.fullscreenElement) return;
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const x = Math.min(
          Math.max(rect.left + rect.width / 2, 0),
          window.innerWidth - 1,
        );
        const y = Math.min(
          Math.max(rect.top + rect.height / 2, 0),
          window.innerHeight - 1,
        );
        const hit = document.elementFromPoint(x, y);
        if (hit === null || hit === el || el.contains(hit)) {
          seenUncovered = true;
        } else if (seenUncovered) {
          stop();
        }
      }, 750);
    }

    // (d) one player at a time — claimPlayback stops every other gate
    claimPlayback(stop);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      if (io) io.disconnect();
      if (interval !== null) clearInterval(interval);
      deregister(stop);
    };
  }, [active, elementRef, stop]);
}
