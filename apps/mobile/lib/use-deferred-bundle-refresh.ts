// SharedUiHost's cache-first source + content refresh effect: render from the disk cache at once, refresh after the
// DOM ready signal (lib/deferred-bundle-refresh.ts). Returns `domReady`, which the host calls from the DOM onReady.
import { useCallback, useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { loadContentBundle } from './content-bundle';
import { createDeferredRefresh, type DeferredRefresh } from './deferred-bundle-refresh';
import { diagMarkOnce } from './diagnostics';
import { lastGoodSource, type LastGoodSource } from './dom-reader-config';

export function useDeferredBundleRefresh(
  testPage: boolean | null,
  setSource: (s: { cache: LastGoodSource | null }) => void,
  setContentToken: (t: string) => void,
): () => void {
  const refreshRef = useRef<DeferredRefresh | null>(null);
  useEffect(() => {
    if (testPage !== false) return;
    // Cache-first: render from what is on disk now (offline relaunch), refresh in the background.
    const cached = lastGoodSource();
    if (cached) setSource({ cache: cached });
    const refresh = createDeferredRefresh({
      load: loadContentBundle,
      runAfterInteractions: (fn) => InteractionManager.runAfterInteractions(fn),
      setTimeout: (fn, ms) => setTimeout(fn, ms),
      clearTimeout: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
      mark: diagMarkOnce,
      onLoaded: (bundle) => {
        setContentToken((bundle as Awaited<ReturnType<typeof loadContentBundle>>).manifest.bundleVersion);
        if (!cached) setSource({ cache: lastGoodSource() });
      },
      onError: () => {
        if (!cached) setSource({ cache: null });
      },
    });
    refreshRef.current = refresh;
    refresh.start(!!cached);
    return () => {
      refresh.dispose();
      if (refreshRef.current === refresh) refreshRef.current = null;
    };
  }, [testPage]);
  return useCallback(() => refreshRef.current?.domReady(), []);
}
