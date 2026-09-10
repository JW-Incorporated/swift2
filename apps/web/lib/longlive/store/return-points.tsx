'use client';

import { useRef } from 'react';
import { takeMatchingReturnPoint } from '../return-point-stack';
import type { AppMode } from './navigation';
import type { NavSnapshot } from './navigation';

/**
 * Back-to-position for a timeline doorway (PLAN.md P3 step 16 — Joey: "if a
 * user clicks a doorway, 'back' should take them right back to the era they
 * came from, at the spot on the timeline they came from"). Pushed by a
 * doorway tap right before it navigates; popped when that navigation is
 * dismissed through the existing useBackDismiss path (either `restoreNav`,
 * for a thread doorway's mode switch, or an overlay's own close handler, for
 * an egg doorway's TheoryGuide). A dedicated stack rather than reusing
 * `eraScrollRef` because that ref holds exactly one CONTINUOUSLY-overwritten
 * snapshot (EraStream's own scroll position) — doorway taps need their own
 * LIFO history so a doorway opened from inside a doorway still unwinds in
 * order.
 */
export interface ReturnPoint {
  mode: AppMode;
  eraId: string;
  itemId: string | null;
  scrollY: number;
}

/**
 * Plain (non-hook) LIFO return-point stack. Factored out of `useReturnPoints`
 * so the push/pop/consume logic is unit-testable without a React render —
 * the hook below just keeps one instance alive for the component's lifetime.
 */
export function createReturnPointStack() {
  let stack: ReturnPoint[] = [];

  const pushReturnPoint = (p: ReturnPoint) => {
    stack = [...stack, p];
  };

  const popReturnPoint = (): ReturnPoint | null => {
    if (stack.length === 0) return null;
    const top = stack[stack.length - 1];
    stack = stack.slice(0, -1);
    return top;
  };

  const consumeMatching = (restored: NavSnapshot): ReturnPoint | null => {
    const matched = takeMatchingReturnPoint(stack, restored);
    stack = [...matched.stack];
    return matched.returnPoint;
  };

  return { pushReturnPoint, popReturnPoint, consumeMatching };
}

/**
 * Owns the doorway return-point LIFO stack for the lifetime of the
 * component. `consumeMatching` is called by the navigation slice's
 * `restoreNav` — it pops the top entry only when its `mode`/`eraId` matches
 * the just-restored nav snapshot (an unrelated back navigation above a
 * doorway's entry must leave it intact for a later restore).
 */
export function useReturnPoints() {
  const stackRef = useRef<ReturnType<typeof createReturnPointStack> | null>(null);
  if (stackRef.current === null) stackRef.current = createReturnPointStack();
  return stackRef.current;
}
