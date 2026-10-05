// SharedUiHost's content-adoption wiring (lib/content-adoption.ts): subscribes to content loads and AppState while the
// DOM surface is in use, and hands the host the three hooks it forwards from the bridge epoch.
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import {
  differsFromMountedContent,
  getMountedContentVersion,
  readStampedContentVersion,
  setMountedContentVersion,
  subscribeContentLoaded,
} from './content-bundle';
import { createContentAdoption, type ContentAdoption } from './content-adoption';

export function useContentAdoption(testPage: boolean | null, bump: () => void, onSignal: (stage: string, detail?: string) => void): ContentAdoption {
  const bumpRef = useRef(bump);
  bumpRef.current = bump;
  const adoption = useRef<ContentAdoption | null>(null);
  adoption.current ??= createContentAdoption({
    differs: differsFromMountedContent,
    getMounted: getMountedContentVersion,
    setMounted: setMountedContentVersion,
    bump: () => bumpRef.current(),
    onSignal,
  });
  useEffect(() => {
    if (testPage !== false) return;
    const a = adoption.current!;
    // The cache-first mount reads the file the previous process last loaded; its stamp is what the DOM mounted with.
    setMountedContentVersion(readStampedContentVersion());
    a.appState(AppState.currentState);
    const offLoaded = subscribeContentLoaded((v) => a.loaded(v));
    const sub = AppState.addEventListener('change', (s) => a.appState(s));
    return () => {
      offLoaded();
      sub.remove();
    };
  }, [testPage]);
  return adoption.current;
}
