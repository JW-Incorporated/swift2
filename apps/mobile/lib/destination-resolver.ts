// ONE normalized destination resolver (One UI). Every incoming link (a backend push `deepLink`, an inbox row, a bridge
// `navigate`) is canonicalized here to `{kind, path}`; the tap target, ui-deps and the native fallback all consume
// this, so the two route registries can never disagree about who owns a link. Pure (no RN/expo imports).
//
// With the shared UI mounted every user-facing surface is the DOM: the legacy native-screen query forms the backend
// still emits (`?screen=settings`, `?current=inbox`, `?screen=track-guide&era=`, ...) are rewritten to the DOM's own
// paths/params. `native` means "the DOM does not own it": the host-registered native routes (what the D-7 presenter
// accepts) or anything else the shell opens itself (browser).
import { destinationFor } from '@swift2/shared';
import { isDomPath } from '../dom/bridge/dom-path';
import { INBOX_PATH, SETTINGS_PATHS, isInboxPath, isSettingsPath } from '../dom/slots/settings-paths';

export type Destination = { kind: 'dom' | 'native'; path: string };

const DEFAULT_SITE_URL = 'https://www.longlivets.com';

export function resolveDestination(
  link: string,
  opts: { isHostRoute: (path: string) => boolean; siteUrl?: string },
): Destination {
  const site = opts.siteUrl ?? DEFAULT_SITE_URL;
  let u: URL;
  try {
    u = new URL(link, site);
  } catch {
    return { kind: 'dom', path: '/' };
  }
  const legacy = destinationFor(u.toString(), site);
  if (legacy.kind === 'settings') return { kind: 'dom', path: SETTINGS_PATHS[0] };
  if (legacy.kind === 'inbox') return { kind: 'dom', path: INBOX_PATH };
  if (legacy.kind === 'era-stream' || legacy.kind === 'clownbot' || legacy.kind === 'track-guide' || legacy.kind === 'song') return { kind: 'dom', path: '/' };
  // Web parity: the site drops `?current=<x>` / `?song=<slug>` to the front door (merch maps to its own mode).
  const current = u.searchParams.get('current');
  if (current === 'merch') return { kind: 'dom', path: '/?mode=merch' };
  if (current !== null || u.searchParams.has('song')) return { kind: 'dom', path: '/' };
  const path = `${u.pathname}${u.search}${u.hash}`;
  if (opts.isHostRoute(path)) return { kind: 'native', path };
  const { pathname } = u;
  if (pathname === '/' || isSettingsPath(pathname) || isInboxPath(pathname) || isDomPath(pathname)) return { kind: 'dom', path };
  return { kind: 'native', path };
}
