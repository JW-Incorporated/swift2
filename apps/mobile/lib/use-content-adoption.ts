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
import { lastGoodSource, type LastGoodSource } from './dom-reader-config';
import type { DomWatch } from './watchdog-gate';
import { createContentAdoption, type ContentAdoption } from './content-adoption';

export function useContentAdoption(
  testPage: boolean | null,
  host: {
    bump: () => void;
    onSignal: (stage: string, detail?: string) => void;
    setSource: (s: { cache: LastGoodSource | null }) => void;
    watch: Pick<DomWatch, 'plannedReload'>;
  },
): ContentAdoption {
  const hostRef = useRef(host);
  hostRef.current = host;
  const adoption = useRef<ContentAdoption | null>(null);
  adoption.current ??= createContentAdoption({
    differs: differsFromMountedContent,
    getMounted: getMountedContentVersion,
    setMounted: setMountedContentVersion,
    // The refresh overwrote last-good (and its twin): hand the replacement reader the new cache-buster, then
    // announce the planned reload to the watchdog (re-arms the ready timeout; not a strike).
    prepare: async () => {
      hostRef.current.setSource({ cache: lastGoodSource() });
      await hostRef.current.watch.plannedReload?.();
    },
    bump: () => hostRef.current.bump(),
    onSignal: (stage, detail) => hostRef.current.onSignal(stage, detail),
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
