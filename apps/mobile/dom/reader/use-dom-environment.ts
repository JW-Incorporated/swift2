import { useEffect } from 'react';
import type { Insets } from '@swift2/ui';
import type { createNativeCalls } from '../bridge/native-calls';
import { setImageLoadListener } from './image-listener';

type NativeCalls = ReturnType<typeof createNativeCalls>;

/** The DOM page environment of AppReader: full-height scroll root, `--safe-*` insets, speed-test image listener, window error reporting. */
export function useDomEnvironment(native: NativeCalls, insets: Insets | undefined, speedTestOn: boolean | undefined, cacheUri: string | undefined) {
  useEffect(() => {
    // The host page is a full-height flex root with a non-scrolling body; the reader scrolls the window like the site.
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    const root = document.getElementById('root') ?? document.body.firstElementChild;
    if (root instanceof HTMLElement) {
      root.style.display = 'block';
      root.style.height = 'auto';
    }
  }, []);

  useEffect(() => {
    if (!insets) return;
    const s = document.documentElement.style;
    for (const side of ['top', 'right', 'bottom', 'left'] as const) {
      s.setProperty(`--safe-${side}`, `${insets[side]}px`);
    }
  }, [insets?.top, insets?.right, insets?.bottom, insets?.left]);

  useEffect(() => {
    if (!speedTestOn) return;
    setImageLoadListener((visible) => void native.reportImageLoad(visible));
    return () => setImageLoadListener(null);
  }, [speedTestOn]);

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (cacheUri && e.filename === cacheUri) return; // the <script> twin of the JSON cache
      void native.reportError(`error: ${e.message}`);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      void native.reportError(`unhandledrejection: ${String(e.reason)}`);
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, [cacheUri]);
}
