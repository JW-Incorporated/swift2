'use client';

import { useEffect, useRef } from 'react';

/** Ignore touches starting this close to either screen edge — that zone
 * belongs to the OS/browser's own edge-back gesture (and, on this overlay,
 * to `useBackDismiss`'s history-based interception of it), never to us. */
const EDGE_GUARD_PX = 24;
/** Minimum horizontal travel to count as an intentional swipe, not a tap or scroll jitter. */
const SWIPE_THRESHOLD_PX = 60;
/** Horizontal travel must beat vertical by this ratio before it counts as a
 * page-turn swipe, so an ordinary vertical scroll on the long dossier page
 * is never mistaken for one. */
const HORIZONTAL_DOMINANCE_RATIO = 1.5;

/**
 * Horizontal swipe-to-navigate between tracks (#774 Option 2): swipe left
 * fires `onSwipeLeft` (next track), swipe right fires `onSwipeRight`
 * (previous track), only while `active`. Listens on `window` rather than a
 * container ref — the song overlay's scrollable root remounts on every
 * track hop (its `key={openTrackKey}` resets scroll position by design), so
 * a ref-based listener would silently go stale after the first swipe.
 * Deliberately narrow:
 *
 * - Ignores touches starting on a link/button/iframe/form control (source
 *   links, the "Keep exploring" cards, the YouTube player) so it never
 *   steals a tap meant for something interactive.
 * - Ignores touches starting near either screen edge so it never fights the
 *   browser/OS edge-back gesture.
 * - Only fires past a horizontal-dominance threshold, so scrolling the page
 *   vertically is never misread as a swipe.
 *
 * Listens with `{ passive: true }` throughout — it never calls
 * `preventDefault`, so native vertical scrolling is always left alone.
 */
export function useSwipeNav(active: boolean, onSwipeLeft: () => void, onSwipeRight: () => void) {
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;

  useEffect(() => {
    if (!active) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    function onTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      if (!touch) return;
      const target = e.target as HTMLElement;
      if (target.closest('a, button, iframe, input, textarea, select')) {
        tracking = false;
        return;
      }
      const width = window.innerWidth;
      if (touch.clientX < EDGE_GUARD_PX || touch.clientX > width - EDGE_GUARD_PX) {
        tracking = false;
        return;
      }
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
    }

    function onTouchEnd(e: TouchEvent) {
      if (!tracking) return;
      tracking = false;
      const touch = e.changedTouches[0];
      if (!touch) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(dx) < Math.abs(dy) * HORIZONTAL_DOMINANCE_RATIO) return;
      if (dx < 0) onSwipeLeftRef.current();
      else onSwipeRightRef.current();
    }

    function onTouchCancel() {
      tracking = false;
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchCancel, { passive: true });
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [active]);
}
