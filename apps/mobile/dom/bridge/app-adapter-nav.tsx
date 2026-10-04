// Pure DOM-side helpers for the app HostAdapter (One UI H4/D1): link
// classification + click interception, the `_blank` capture interceptor, and the
// tri-state storage wrapper. No React/RN/Expo imports, so they run under node tests.
import { toWebPath } from '@swift2/ui';
import type { HostStorage } from '@swift2/ui';

export type LinkTarget =
  | { kind: 'dom'; path: string }
  | { kind: 'external'; url: string }
  | { kind: 'pass' }
  | { kind: 'blocked' };

export interface NavDeps {
  /** Canonical site origin (`env.origin`). Absolute links to it are treated as in-app paths. */
  origin: string;
  /** Adapter-level navigate (routes native-owned paths over the bridge, the rest in the DOM). */
  navigate: (path: string, opts?: { replace?: boolean }) => void;
  openExternal: (url: string) => void;
}

export interface ClickLike {
  defaultPrevented: boolean;
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  preventDefault: () => void;
}

/**
 * Every in-app route must pass `toWebPath`; https elsewhere is external; a bare `#fragment`
 * passes; everything else (malformed paths, `//host`, `javascript:`, `intent:`, `file:`,
 * `mailto:`, plain http, relative hrefs) is blocked so it can never reach the host webview.
 */
export function classifyHref(href: string, origin: string): LinkTarget {
  if (href.startsWith('#')) return { kind: 'pass' };
  const asPath = (p: string): LinkTarget => {
    const web = toWebPath(p);
    return web ? { kind: 'dom', path: web } : { kind: 'blocked' };
  };
  if (href.startsWith('/')) return asPath(href);
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { kind: 'blocked' };
  }
  if (url.protocol !== 'https:') return { kind: 'blocked' };
  if (url.origin === origin) return asPath(`${url.pathname}${url.search}${url.hash}`);
  return { kind: 'external', url: url.href };
}

/**
 * One interceptor for `Link` clicks and the `<a target="_blank">` capture. A click the page
 * already handled is left alone. Every `_blank`/external click and every blocked href is
 * consumed whatever the button or modifier keys; a modified/non-primary click on an ordinary
 * link is consumed without acting (a webview has no new-tab semantics).
 */
export function handleLinkClick(
  e: ClickLike,
  href: string,
  opts: { blank: boolean; external: boolean },
  deps: NavDeps,
): void {
  if (e.defaultPrevented) return;
  const target = classifyHref(href, deps.origin);
  const forced = opts.blank || opts.external;
  if (target.kind === 'pass' && !forced) return;
  e.preventDefault();
  const plain = e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  if (!plain && !forced) return;
  if (target.kind === 'dom') deps.navigate(target.path);
  else if (target.kind === 'external') deps.openExternal(target.url);
}

interface BlankCaptureDoc {
  addEventListener(type: 'click', fn: (e: never) => void): void;
  removeEventListener(type: 'click', fn: (e: never) => void): void;
}

interface BlankCaptureEvent extends ClickLike {
  target: unknown;
}

/**
 * Bubble-phase `a[target=_blank]` interceptor for anchors that do not go through the host
 * `Link`. Bubble (not capture) so React/page handlers run first and can `preventDefault()`.
 */
export function installBlankCapture(doc: BlankCaptureDoc, deps: NavDeps): () => void {
  const listener = (e: BlankCaptureEvent) => {
    const el = e.target as { closest?: (sel: string) => { getAttribute(name: string): string | null } | null } | null;
    const a = el && typeof el.closest === 'function' ? el.closest('a[target="_blank"]') : null;
    if (!a) return;
    handleLinkClick(e, a.getAttribute('href') ?? '', { blank: true, external: false }, deps);
  };
  doc.addEventListener('click', listener as (e: never) => void);
  return () => doc.removeEventListener('click', listener as (e: never) => void);
}

interface StorageArea {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * Tri-state storage (#4923): `get` is null for an absent key and undefined only
 * when the area is unavailable or throws. Writes are best-effort.
 */
export function createAppStorage(getArea: () => StorageArea | null | undefined): HostStorage {
  const area = (): StorageArea | null => {
    try {
      return getArea() ?? null;
    } catch {
      return null;
    }
  };
  return {
    get(key) {
      try {
        const a = area();
        return a ? a.getItem(key) : undefined;
      } catch {
        return undefined;
      }
    },
    set(key, value) {
      try {
        area()?.setItem(key, value);
      } catch {
        // best-effort, same as the web adapter
      }
    },
    remove(key) {
      try {
        area()?.removeItem(key);
      } catch {
        // best-effort
      }
    },
  };
}
