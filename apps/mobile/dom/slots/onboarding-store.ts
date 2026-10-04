// Phase of the DOM push offer, shared so the reader's Back routing and the settings dialog (inert while the
// offer is up) can see it. idle -> checking (one in-flight read set) -> shown | done. `done` is final for the
// epoch (dismissed, ineligible, or a failed read, which fails closed); only a check cancelled by Settings
// closing returns to idle. Back dismisses to `done` without persisting, so it is not re-offered this session.
import { useSyncExternalStore } from 'react';

export type OnboardingPhase = 'idle' | 'checking' | 'shown' | 'done';

let phase: OnboardingPhase = 'idle';
let busy = false;
const subs = new Set<() => void>();

export const onboardingOverlay = {
  phase: () => phase,
  set: (next: OnboardingPhase) => {
    if (phase === next) return;
    phase = next;
    for (const fn of [...subs]) fn();
  },
  /** A CTA is mid-flight: Back is swallowed (still handled) so it cannot dismiss under a pending native call. No notify. */
  setBusy: (b: boolean) => void (busy = b),
  isBusy: () => busy,
  subscribe: (fn: () => void) => {
    subs.add(fn);
    return () => void subs.delete(fn);
  },
};

export const useOnboardingPhase = (): OnboardingPhase => useSyncExternalStore(onboardingOverlay.subscribe, onboardingOverlay.phase, () => 'idle');

/** Test only. */
export function resetOnboardingForTests(): void {
  phase = 'idle';
  busy = false;
  subs.clear();
}
