'use client';

import { useEffect, useRef } from 'react';
import { setEngaged } from '../../bridge/engaged-signal';

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
/** Reports whether any hook-registered overlay is open (nav entries do not count) so native content adoption waits for it. */
const reportOverlays = () => setEngaged('overlay-stack', stack.some((e) => e.overlay));
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

/** history.back() calls we issued whose popstate has not been handled yet (for waitForBackStackIdle). */
let pendingPops = 0;
let idleWaiters: Array<() => void> = [];

function historyBack() {
  pendingPops += 1;
  window.history.back();
}

function flushIdle() {
  if (pendingPops > 0 || suppressedPops > 0) return;
  const waiters = idleWaiters;
  idleWaiters = [];
  for (const w of waiters) w();
}

/** Test-only: resolves once every history.back() issued here (incl. chained buried-entry skips) has been handled. */
export function waitForBackStackIdle(): Promise<void> {
  if (pendingPops === 0 && suppressedPops === 0) return Promise.resolve();
  return new Promise((r) => idleWaiters.push(r));
}

/** Test-only: clears module-level stack state between tests. */
export function resetBackStackForTests() {
  stack.length = 0;
  reportOverlays();
  buried.clear();
  suppressedPops = 0;
  pendingPops = 0;
  flushIdle();
}

/** After any pop: if history landed on a buried (already-closed) entry, step back over it. */
function skipBuried() {
  const id = stateId();
  if (id !== undefined && buried.has(id)) {
    buried.delete(id);
    suppressedPops += 1;
    historyBack();
  }
}

function onPopState() {
  if (pendingPops > 0) pendingPops -= 1;
  handlePop();
  flushIdle();
}

function handlePop() {
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
    reportOverlays();
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
  reportOverlays();
  window.history.pushState({ llOverlay: true, llId: id }, '');
}

/**
 * Native (Android hardware) Back driver: unwinds the TOP of the logical stack,
 * like the website's Back. An overlay is dismissed (its UI-close cleanup
 * consumes its history entry); a navigation entry is consumed via
 * history.back(), so the normal popstate restore runs once. Returns true when
 * an entry is on the stack, including one whose dismissal from an earlier Back
 * has not committed yet, so a rapid repeat Back is swallowed rather than
 * closing the layer beneath or exiting.
 */
export function dismissTopOverlayFromNativeBack(): boolean {
  const e = stack[stack.length - 1];
  if (!e) return false;
  if (e.nativeClosing) return true;
  e.nativeClosing = true;
  // Safety net: a dismiss that never unmounts must not wedge Back forever.
  setTimeout(() => {
    e.nativeClosing = false;
  }, 500);
  // Nav entry on top: drive the real history pop so onPopState restores and consumes it exactly once.
  if (e.overlay) e.dismiss();
  else historyBack();
  return true;
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
    reportOverlays();
    window.history.pushState({ llOverlay: true, llId: entry.id }, '');
    return () => {
      const i = stack.indexOf(entry);
      if (i !== -1) stack.splice(i, 1);
      reportOverlays();
      if (!entry.dismissedByPop) {
        // Closed by the UI — consume our pushed entry, and flag the popstate
        // that this back() emits so it isn't mistaken for a user gesture.
        if (stateId() === entry.id) {
          suppressedPops += 1;
          historyBack();
        } else buried.add(entry.id);
      }
    };
  }, [active]);
}
