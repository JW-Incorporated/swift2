'use client';

import { useEffect, useState } from 'react';
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

const bodyLocked = (): boolean => typeof document !== 'undefined' && document.body.style.overflow === 'hidden';

/** Store overlays, plus any overlay holding the shared scroll lock (useScrollLock) whose open state is local to its component. */
export function useOverlayOpen(state: OverlayState): boolean {
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const sync = () => setLocked(bodyLocked());
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    return () => observer.disconnect();
  }, []);
  return storeOverlayOpen(state) || locked;
}
