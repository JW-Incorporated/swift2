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

type StackEntry = { id: number; dismiss: () => void; dismissedByPop: boolean; overlay?: boolean; nativeClosing?: boolean };

const stack: StackEntry[] = [];
/** Pending popstates we caused ourselves (UI-close consuming its entry). */
let suppressedPops = 0;
let listenerInstalled = false;
let seq = 0;
/**
 * Ids of hook entries closed while a later entry sat above them in history:
 * their history entry can't be consumed in place (back() would pop the wrong
 * one), so a later pop that lands on one skips straight through it.
 */
const buried = new Set<number>();

const stateId = (): number | undefined => (window.history.state as { llId?: number } | null)?.llId;

/** After any pop: if history landed on a buried (already-closed) entry, step back over it. */
function skipBuried() {
  const id = stateId();
  if (id !== undefined && buried.has(id)) {
    buried.delete(id);
    suppressedPops += 1;
    window.history.back();
  }
}

function onPopState() {
  if (suppressedPops > 0) {
    suppressedPops -= 1;
    skipBuried();
    return;
  }
  const top = stack[stack.length - 1];
  if (top) {
    top.dismissedByPop = true;
    // Nav entries have no cleanup path: leave the logical stack here. Hook entries leave via their own cleanup.
    if (!top.overlay) stack.pop();
    top.dismiss();
  }
  skipBuried();
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
  const id = ++seq;
  stack.push({ id, dismiss: onDismiss, dismissedByPop: false });
  window.history.pushState({ llOverlay: true, llId: id }, '');
}

/**
 * Native (Android hardware) Back driver: dismisses the TOP-most open overlay
 * (hook entries only; navigation entries are skipped). Returns true when an
 * overlay is open, including one whose dismissal from an earlier Back has not
 * committed yet, so a rapid repeat Back is swallowed rather than closing the
 * layer beneath or exiting. The overlay's UI-close cleanup consumes its history entry.
 */
export function dismissTopOverlayFromNativeBack(): boolean {
  for (let i = stack.length - 1; i >= 0; i--) {
    const e = stack[i]!;
    if (!e.overlay) continue;
    if (e.nativeClosing) return true;
    e.nativeClosing = true;
    // Safety net: a dismiss that never unmounts must not wedge Back forever.
    setTimeout(() => {
      e.nativeClosing = false;
    }, 500);
    e.dismiss();
    return true;
  }
  return false;
}

export function useBackDismiss(active: boolean, onDismiss: () => void) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!active) return;
    installListener();
    const entry: StackEntry = {
      id: ++seq,
      dismiss: () => onDismissRef.current(),
      dismissedByPop: false,
      overlay: true,
    };
    stack.push(entry);
    window.history.pushState({ llOverlay: true, llId: entry.id }, '');
    return () => {
      const i = stack.indexOf(entry);
      if (i !== -1) stack.splice(i, 1);
      if (!entry.dismissedByPop) {
        // Closed by the UI — consume our pushed entry, and flag the popstate
        // that this back() emits so it isn't mistaken for a user gesture.
        if (stateId() === entry.id) {
          suppressedPops += 1;
          window.history.back();
        } else buried.add(entry.id);
      }
    };
  }, [active]);
}
