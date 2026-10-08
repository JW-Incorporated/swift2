import { useEffect } from 'react';
import type { Insets } from '@swift2/ui';
import type { createNativeCalls } from '../bridge/native-calls';
import { setImageLoadListener } from './image-listener';

type NativeCalls = ReturnType<typeof createNativeCalls>;

/** The Expo-generated host page ships no `lang` and a viewport with `user-scalable=no` (blocks pinch zoom, WCAG 1.4.4): set the language and re-enable zoom. */
export function applyDocumentA11y(doc: Document): void {
  if (!doc.documentElement.lang) doc.documentElement.lang = 'en';
  const meta = doc.querySelector('meta[name="viewport"]');
  const content = meta?.getAttribute('content');
  if (meta && content && /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(content)) {
    const kept = content.split(',').map((p) => p.trim()).filter((p) => p && !/^(user-scalable|maximum-scale)\s*=/i.test(p));
    meta.setAttribute('content', kept.join(', '));
  }
}

export const FONT_SCALE_MIN = 0.85;
export const FONT_SCALE_MAX = 1.5; // Measured (#5322): the shared reader holds with no horizontal scroll at 1.5x on 360px and 390px; the ~284 fixed text-[Npx] labels do not scale yet.

/** Native text-size scale to a safe root multiplier: non-finite or non-positive falls back to 1, then clamped so a huge setting cannot explode the layout. */
export function clampFontScale(scale: number | undefined): number {
  if (typeof scale !== 'number' || !Number.isFinite(scale) || scale <= 0) return 1;
  return Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, scale));
}

/** The WebView ignores the OS text size, so scale the root font-size (rem-based text follows) and expose `--font-scale`. */
export function applyFontScale(doc: Document, scale: number | undefined): void {
  const clamped = clampFontScale(scale);
  if (clamped === 1) {
    doc.documentElement.style.removeProperty('font-size');
    doc.documentElement.style.removeProperty('--font-scale');
    return;
  }
  doc.documentElement.style.fontSize = `${clamped * 100}%`;
  doc.documentElement.style.setProperty('--font-scale', String(clamped));
}

/** The DOM page environment of AppReader: full-height scroll root, `--safe-*` insets, speed-test image listener, window error reporting. */
export function useDomEnvironment(native: NativeCalls, insets: Insets | undefined, speedTestOn: boolean | undefined, cacheUri: string | undefined, fontScale?: number) {
  useEffect(() => {
    applyDocumentA11y(document);
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
    if (fontScale === undefined) return;
    applyFontScale(document, fontScale);
  }, [fontScale]);

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
