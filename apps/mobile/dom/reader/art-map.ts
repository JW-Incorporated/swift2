// Offline art (#5074), DOM side: the native `art-map.js` twin parks `globalThis.__swift2ArtMap` (abs url -> file:// uri).
// Loaded via <script src> like the content twin (file:// fetch/XHR are blocked on iOS). Every path here is best-effort:
// a missing map or script error leaves the map empty and AppImage uses the remote URL.
const GLOBAL_KEY = '__swift2ArtMap';
const LOAD_TIMEOUT_MS = 1500;

let map: Record<string, string> = {};
let loaded = 0;
let fallback = 0;

export function loadArtMap(uri: string | undefined, doc?: Document, timeoutMs = LOAD_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve) => {
    const d = doc ?? (typeof document === 'undefined' ? undefined : document);
    if (!uri || !d) return resolve();
    const g = globalThis as unknown as Record<string, unknown>;
    const s = d.createElement('script');
    const done = () => {
      clearTimeout(timer);
      s.remove?.();
      resolve();
    };
    s.onload = () => {
      const m = g[GLOBAL_KEY];
      if (m && typeof m === 'object') map = m as Record<string, string>;
      done();
    };
    s.onerror = done;
    const timer = setTimeout(done, timeoutMs);
    s.src = uri;
    (d.head ?? d.documentElement).appendChild(s);
  });
}

/** The cached file:// uri for `src`, or null on a miss (relative site paths are resolved against `origin`). */
export function artSrc(src: string, origin: string): string | null {
  const abs = src.startsWith('/') && !src.startsWith('//') ? `${origin}${src}` : src;
  const hit = Object.prototype.hasOwnProperty.call(map, abs) ? map[abs] : undefined;
  return typeof hit === 'string' && hit ? hit : null;
}

/** A file:// art image actually rendered. */
export function noteArtLoaded(): void {
  loaded += 1;
}

/** A file:// art image errored and the remote URL took over. */
export function noteArtFallback(): void {
  fallback += 1;
}

/** Diagnostics: map size, file:// loads, onError fallbacks; null when the map never loaded and nothing happened. */
export function artStats(): { map: number; loaded: number; fallback: number } | null {
  const size = Object.keys(map).length;
  return size || loaded || fallback ? { map: size, loaded, fallback } : null;
}

export function resetArtMapForTests(): void {
  map = {};
  loaded = 0;
  fallback = 0;
}
