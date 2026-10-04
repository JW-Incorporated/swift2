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
const SITE_HOSTS = new Set(['longlivets.com', 'www.longlivets.com']);

/** A composite trackKey is `${eraId}::${n}::${title}` (resolveTrackKey's shape); a DB slug never has the separators. */
const isTrackKey = (key: string): boolean => key.split('::').length >= 3;
const songDestination = (key: string): Destination => (isTrackKey(key) ? { kind: 'dom', path: `/?song=${encodeURIComponent(key)}` } : { kind: 'dom', path: '/' });

export function resolveDestination(
  link: string,
  opts: { isHostRoute: (path: string) => boolean; siteUrl?: string },
): Destination {
  const site = opts.siteUrl ?? DEFAULT_SITE_URL;
  const front: Destination = { kind: 'dom', path: '/' };
  let u: URL;
  try {
    u = new URL(link, site);
  } catch {
    return front;
  }
  // Only longlivets.com / www (https, no port/userinfo), the configured site origin, or a relative path is interpreted;
  // anything else is not a local destination and lands on the front door, never opened raw.
  const own = u.origin === new URL(site).origin;
  const prod = u.protocol === 'https:' && SITE_HOSTS.has(u.hostname) && !u.port && !u.username && !u.password;
  if ((!own && !prod) || u.username || u.password) return front;
  const legacy = destinationFor(u.toString(), u.origin);
  if (legacy.kind === 'settings') return { kind: 'dom', path: SETTINGS_PATHS[0] };
  if (legacy.kind === 'inbox') return { kind: 'dom', path: INBOX_PATH };
  if (legacy.kind === 'era-stream' || legacy.kind === 'clownbot') return front;
  // Legacy native-screen markers translate to the reader's own params (what applyDeepLink honours).
  if (legacy.kind === 'track-guide') return { kind: 'dom', path: `/?guide=${encodeURIComponent(legacy.eraId)}` };
  if (legacy.kind === 'song') return songDestination(legacy.trackKey);
  // Web parity: the site drops `?current=<x>` to the front door (merch maps to its own mode).
  const current = u.searchParams.get('current');
  if (current === 'merch') return { kind: 'dom', path: '/?mode=merch' };
  if (current !== null) return front;
  // `?song=` carries a composite trackKey (era::n::title); a DB slug the reader cannot resolve degrades to the front door.
  const song = u.searchParams.get('song');
  if (song !== null && !isTrackKey(song)) return front;
  const path = `${u.pathname}${u.search}${u.hash}`;
  if (opts.isHostRoute(path)) return { kind: 'native', path };
  const { pathname } = u;
  if (pathname === '/' || isSettingsPath(pathname) || isInboxPath(pathname) || isDomPath(pathname)) return { kind: 'dom', path };
  return { kind: 'native', path };
}
