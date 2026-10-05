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
  UNKNOWN_MOUNTED,
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
    // The refresh overwrote last-good (and its twin): persist the planned reload with the watchdog first (it re-arms
    // the ready timeout only after the write; never a strike), then hand the replacement reader the new cache-buster.
    // False = do not re-key.
    prepare: async () => {
      const cache = lastGoodSource();
      if (!cache) return false;
      if (!(await hostRef.current.watch.plannedReload?.())) return false;
      hostRef.current.setSource({ cache });
      return true;
    },
    bump: () => hostRef.current.bump(),
    onSignal: (stage, detail) => hostRef.current.onSignal(stage, detail),
  });
  useEffect(() => {
    if (testPage !== false) return;
    const a = adoption.current!;
    // The cache-first mount reads the file the previous process last loaded; its stamp is what the DOM mounted with.
    setMountedContentVersion(readStampedContentVersion() ?? (lastGoodSource() ? UNKNOWN_MOUNTED : null));
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
