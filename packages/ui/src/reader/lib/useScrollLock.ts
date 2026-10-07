'use client';

import { useEffect } from 'react';

/**
 * One reference-counted body-scroll lock, shared by every overlay.
 *
 * Seven components each used to do their own save/restore:
 *
 *     const prev = document.body.style.overflow;
 *     document.body.style.overflow = 'hidden';
 *     return () => { document.body.style.overflow = prev; };
 *
 * That is correct alone and wrong the moment two overlays are open at once,
 * which this app does constantly — a moment detail with the share sheet over
 * it, search opened from inside a guide. The inner overlay mounts while the
 * outer already set `hidden`, so it captures `prev = 'hidden'`. If the OUTER
 * one then closes first it restores `''` correctly, and the inner one later
 * restores its captured `'hidden'` onto a page with nothing open. The mouse
 * wheel is dead and stays dead until a reload, with no error anywhere.
 *
 * Wyatt hit exactly this: "scroll might be broken on the webpage, I can't use
 * my mousewheel to scroll anymore" ... "I refreshed and now it works."
 *
 * Reference counting removes the whole class: only the FIRST acquire records
 * the page's real overflow, only the LAST release restores it. Mount and
 * unmount order stop mattering — which is the point, because the bug was never
 * in any one component, it was in each one assuming it was alone.
 */

/** The style slot this lock owns. Injectable so the logic is testable without
 *  a DOM: the suite runs `environment: 'node'` on purpose (fast, and the bot
 *  fleet opens PRs against it), so pulling in jsdom for one file would tax
 *  every run to test six lines of counting. */
export interface OverflowTarget {
  get(): string;
  set(value: string): void;
}

const domTarget: OverflowTarget = {
  get: () => (typeof document === 'undefined' ? '' : document.body.style.overflow),
  set: (v) => {
    if (typeof document !== 'undefined') document.body.style.overflow = v;
  },
};

let target: OverflowTarget = domTarget;
let lockCount = 0;
/** The page's own overflow, captured once at the first lock. */
let savedOverflow: string | null = null;

export function acquireScrollLock(): void {
  if (lockCount === 0) {
    savedOverflow = target.get();
    target.set('hidden');
  }
  lockCount += 1;
}

export function releaseScrollLock(): void {
  // Guard against an extra release (React strict-mode double effects, or a
  // component unmounting twice). Going negative would make the NEXT acquire
  // fail to lock — the same dead-scroll symptom, reached from the other side.
  if (lockCount === 0) return;
  lockCount -= 1;
  if (lockCount === 0) {
    target.set(savedOverflow ?? '');
    savedOverflow = null;
  }
}

/** Current depth, for assertions. */
export function scrollLockDepth(): number {
  return lockCount;
}

/** Test seam only — never call from app code. */
export function __setScrollLockTargetForTests(next: OverflowTarget | null): void {
  target = next ?? domTarget;
  lockCount = 0;
  savedOverflow = null;
}

/**
 * Lock body scroll while `active` is true. Safe to use from any number of
 * overlays simultaneously, in any unmount order.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    acquireScrollLock();
    return releaseScrollLock;
  }, [active]);
}
