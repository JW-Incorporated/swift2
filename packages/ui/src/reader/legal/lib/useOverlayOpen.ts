'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { AppState } from '../../store';

type OverlayState = Pick<
  AppState,
  'openItemId' | 'trackGuideEraId' | 'openTrackKey' | 'theoryGuideEraId' | 'selectorOpen' | 'searchOpen' | 'clownChatExpanded'
>;

/** True when any store-driven reader overlay or dialog is open. */
export const storeOverlayOpen = (s: OverlayState): boolean =>
  s.openItemId != null ||
  s.trackGuideEraId != null ||
  s.openTrackKey != null ||
  s.theoryGuideEraId != null ||
  !!s.selectorOpen ||
  !!s.searchOpen ||
  !!s.clownChatExpanded;

let presenceCount = 0;
const presenceListeners = new Set<() => void>();
const notifyPresence = () => presenceListeners.forEach((l) => l());
const subscribePresence = (l: () => void) => {
  presenceListeners.add(l);
  return () => void presenceListeners.delete(l);
};
const presenceSnapshot = () => presenceCount > 0;

/** For full-screen overlays that neither live in the store nor take the scroll lock (the native-host inbox, settings, onboarding). */
export function useOverlayPresence(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    presenceCount += 1;
    notifyPresence();
    return () => {
      presenceCount -= 1;
      notifyPresence();
    };
  }, [active]);
}

const bodyLocked = (): boolean => typeof document !== 'undefined' && document.body.style.overflow === 'hidden';

/** Store overlays, plus any overlay holding the shared scroll lock (useScrollLock) whose open state is local to its component. */
export function useOverlayOpen(state: OverlayState): boolean {
  const present = useSyncExternalStore(subscribePresence, presenceSnapshot, () => false);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const sync = () => setLocked(bodyLocked());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);
  return storeOverlayOpen(state) || locked || present;
}
