// Pure DOM-side helpers for the app HostAdapter (One UI H4/D1): link
// classification + click interception, the `_blank` capture interceptor, and the
// tri-state storage wrapper. No React/RN/Expo imports, so they run under node tests.
import type { HostStorage } from '@swift2/ui';

export type LinkTarget =
  | { kind: 'dom'; path: string }
  | { kind: 'external'; url: string }
  | { kind: 'pass' };

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

/** Root-relative path (not protocol-relative) -> dom; https elsewhere -> external; same-origin absolute -> dom path. */
export function classifyHref(href: string, origin: string): LinkTarget {
  if (href.startsWith('/') && !href.startsWith('//')) return { kind: 'dom', path: href };
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return { kind: 'pass' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return { kind: 'pass' };
  if (url.origin === origin) return { kind: 'dom', path: `${url.pathname}${url.search}${url.hash}` };
  if (url.protocol === 'https:') return { kind: 'external', url: url.href };
  return { kind: 'pass' };
}

/**
 * One interceptor for `Link` clicks and `<a target="_blank">` capture. A click
 * the page already handled, a non-primary click, or a modified click is left alone.
 */
export function handleLinkClick(
  e: ClickLike,
  href: string,
  opts: { blank: boolean; external: boolean },
  deps: NavDeps,
): void {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const target = classifyHref(href, deps.origin);
  if (target.kind === 'dom') {
    e.preventDefault();
    deps.navigate(target.path);
  } else if (target.kind === 'external') {
    e.preventDefault();
    deps.openExternal(target.url);
  } else if (opts.blank || opts.external) {
    // A popup/new-tab target must never navigate the host webview.
    e.preventDefault();
  }
}

interface BlankCaptureDoc {
  addEventListener: (type: 'click', fn: (e: never) => void, capture: boolean) => void;
  removeEventListener: (type: 'click', fn: (e: never) => void, capture: boolean) => void;
}

interface BlankCaptureEvent extends ClickLike {
  target: unknown;
}

/** Capture-phase `a[target=_blank]` interceptor for anchors that do not go through the host `Link`. */
export function installBlankCapture(doc: BlankCaptureDoc, deps: NavDeps): () => void {
  const listener = (e: BlankCaptureEvent) => {
    const el = e.target as { closest?: (sel: string) => { getAttribute(name: string): string | null } | null } | null;
    const a = el && typeof el.closest === 'function' ? el.closest('a[target="_blank"]') : null;
    const href = a?.getAttribute('href');
    if (!a || !href) return;
    handleLinkClick(e, href, { blank: true, external: false }, deps);
  };
  doc.addEventListener('click', listener as (e: never) => void, true);
  return () => doc.removeEventListener('click', listener as (e: never) => void, true);
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
