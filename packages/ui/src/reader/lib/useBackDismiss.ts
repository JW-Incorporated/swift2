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
 *
 * Overlays can stack (share sheet over a moment pill, search over anything),
 * so active instances coordinate through a module-level stack: each pushes
 * its own history entry, and a popstate dismisses only the TOP-most overlay
 * — the next back gesture dismisses the one beneath it, and so on. The
 * popstate produced by a UI-close's own `history.back()` is flagged and
 * swallowed so it can never dismiss the overlay underneath.
 */

type StackEntry = { dismiss: () => void; dismissedByPop: boolean };

const stack: StackEntry[] = [];
/** Pending popstates we caused ourselves (UI-close consuming its entry). */
let suppressedPops = 0;
let listenerInstalled = false;

function onPopState() {
  if (suppressedPops > 0) {
    suppressedPops -= 1;
    return;
  }
  const top = stack[stack.length - 1];
  if (top) {
    top.dismissedByPop = true;
    top.dismiss();
  }
}

function installListener() {
  if (listenerInstalled) return;
  // Installed once and left in place: it must still observe (and swallow)
  // the popstate emitted by the LAST overlay's UI-close, after the stack
  // is already empty.
  window.addEventListener('popstate', onPopState);
  listenerInstalled = true;
}

/**
 * Imperative variant for top-level NAVIGATIONS (era jumps, mode switches,
 * thread opens — #498 follow-up "back-swipe exits the app on many screens"):
 * pushes one history entry whose back-gesture pop runs `onDismiss` (which
 * should restore the pre-navigation state). Nav entries have no UI-close, so
 * unlike the hook there is no cleanup path — they are consumed only by the
 * back gesture, or superseded by later entries. Shares the overlay stack, so
 * LIFO order holds across overlays and navigations (an overlay opened after
 * an era jump closes first; the next back undoes the jump).
 */
export function pushBackEntry(onDismiss: () => void) {
  installListener();
  stack.push({ dismiss: onDismiss, dismissedByPop: false });
  window.history.pushState({ llOverlay: true }, '');
}

export function useBackDismiss(active: boolean, onDismiss: () => void) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!active) return;
    installListener();
    const entry: StackEntry = {
      dismiss: () => onDismissRef.current(),
      dismissedByPop: false,
    };
    stack.push(entry);
    window.history.pushState({ llOverlay: true }, '');
    return () => {
      const i = stack.indexOf(entry);
      if (i !== -1) stack.splice(i, 1);
      if (!entry.dismissedByPop) {
        // Closed by the UI — consume our pushed entry, and flag the popstate
        // that this back() emits so it isn't mistaken for a user gesture.
        suppressedPops += 1;
        window.history.back();
      }
    };
  }, [active]);
}
