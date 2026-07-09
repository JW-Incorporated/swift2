'use client';

import { useEffect, useRef } from 'react';

/**
 * Makes the mobile browser/PWA back-swipe gesture dismiss an open overlay
 * instead of navigating away from the app. Overlays here are pure React
 * state (no route change), so the OS back-gesture normally has no history
 * entry to consume and falls through to leaving the app entirely.
 *
 * While `active`, pushes one history entry; a `popstate` (the back gesture,
 * or the hardware/browser back button) calls `onDismiss`. A UI-triggered
 * close (X button, Escape, backdrop click) instead consumes the pushed
 * entry via `history.back()`, so the next real back-navigation doesn't land
 * on a dead, already-dismissed state.
 */
export function useBackDismiss(active: boolean, onDismiss: () => void) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const dismissedByPopRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    dismissedByPopRef.current = false;
    window.history.pushState({ llOverlay: true }, '');
    const onPopState = () => {
      dismissedByPopRef.current = true;
      onDismissRef.current();
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (!dismissedByPopRef.current) {
        window.history.back();
      }
    };
  }, [active]);
}
