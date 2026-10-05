// In-DOM page path (W3-legal). The DOM page is one document at one URL; the reader owns pathname `/` and
// only the query varies. The legal pages (/privacy, /terms, /support) are the allow-listed exception: they are
// standalone pages on the web, so the DOM shows them as a layer keyed on the current path. The path lives in
// `history.state` (never the file:// URL, which a webview may refuse to rewrite) so history push/replace,
// popstate and back all behave like the site. React-free: runs under node/jsdom tests.
export const DOM_PATHS: readonly string[] = ['/privacy', '/terms', '/support'];

export const isDomPath = (p: string): boolean => DOM_PATHS.includes(p);

/** Fired after a push/replace of the path (pushState emits no popstate); `popstate` covers back/forward. */
export const DOM_PATH_EVENT = 'swift2:dompath';

export type DomWin = Pick<Window, 'history' | 'location' | 'addEventListener' | 'removeEventListener' | 'dispatchEvent'>;
const defaultWin = (): DomWin => window;

/**
 * The path the DOM is showing: the allow-listed legal path (or an explicit root) recorded in history.state, else the
 * page's own pathname when it is allow-listed (TEST/DEV ONLY: web/dev and parity load the DOM entry at /privacy; on
 * device the page URL is never one, so the fallback is inert there), else the reader root.
 */
export function currentDomPath(win: DomWin = defaultWin()): string {
  const s = win.history.state as { swift2Path?: unknown } | null;
  if (s && typeof s.swift2Path === 'string') return isDomPath(s.swift2Path) ? s.swift2Path : '/';
  return isDomPath(win.location.pathname) ? win.location.pathname : '/';
}

/** `/x?y#z` for the adapter's `currentUrl`: the real in-DOM path plus the page query and hash. */
export function currentDomUrl(win: DomWin = defaultWin()): string {
  return `${currentDomPath(win)}${win.location.search}${win.location.hash}`;
}

/**
 * Shows an allow-listed legal path, or the reader root (`/`). Moving to a DISTINCT legal page pushes one entry (like
 * the site: back returns to the previous legal page, then the reader); the same page is a no-op; going back to `/`
 * replaces the entry. `replace` forces a replace (the failed-render rollback). Returns false for any path outside the
 * allow-list (nothing changes).
 */
export function setDomPath(path: string, win: DomWin = defaultWin(), opts?: { replace?: boolean }): boolean {
  if (path !== '/' && !isDomPath(path)) return false;
  const cur = currentDomPath(win);
  if (path === cur) return true;
  const state = { swift2Path: path };
  if (path !== '/' && !opts?.replace) win.history.pushState(state, '');
  else win.history.replaceState(state, '');
  win.dispatchEvent(new Event(DOM_PATH_EVENT));
  return true;
}

/** Hardware back while a legal page is showing: pops to the previous reader state. False when the reader is showing. */
export function backFromDomPath(win: DomWin = defaultWin()): boolean {
  if (currentDomPath(win) === '/') return false;
  win.history.back();
  return true;
}

export function subscribeDomPath(cb: () => void, win: DomWin = defaultWin()): () => void {
  win.addEventListener('popstate', cb);
  win.addEventListener(DOM_PATH_EVENT, cb);
  return () => {
    win.removeEventListener('popstate', cb);
    win.removeEventListener(DOM_PATH_EVENT, cb);
  };
}
