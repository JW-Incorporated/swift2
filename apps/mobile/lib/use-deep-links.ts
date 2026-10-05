// X4 (H6): deep-link intake. A https www/apex longlivets.com link or a longlive://<path> link that opens the app (cold
// `getInitialURL` or a live `url` event) joins the notification tap queue with source
// 'deeplink', so it takes the same gate (native navigator / bridge `navigate` + ack) as a tap.
// Hostile or foreign URLs are ignored before they reach the queue. App.tsx calls one hook.
import { useEffect } from 'react';
import { canonicalizeLink } from './notification-tap-queue';
import type { TapGate } from './notification-tap-gate';
import { isDiagLink, openDiagPanel } from './diag-link';

const APP_SCHEME = 'longlive://';
const SITE = 'https://www.longlivets.com';
const MAX_URL = 2048;

/**
 * Structural parse of `longlive://<path>` (also the empty-authority form `longlive:///<path>`) onto the site path;
 * anything else passes through unchanged. Traversal (plain or percent-encoded dots), backslashes, whitespace/control
 * characters, a second leading slash and over-long input leave the link unmapped, so the https validation refuses it.
 */
export function normalizeDeepLink(url: string): string {
  if (!url.startsWith(APP_SCHEME)) return url;
  if (url.length > MAX_URL || /[\\\s]/.test(url) || [...url].some((ch) => ch.charCodeAt(0) < 0x20 || ch.charCodeAt(0) === 0x7f)) return url;
  let rest = url.slice(APP_SCHEME.length);
  if (rest.startsWith('/')) rest = rest.slice(1);
  if (rest.startsWith('/')) return url;
  const path = rest.split(/[?#]/, 1)[0];
  if (path.split('/').some((seg) => /^(\.|%2e){1,2}$/i.test(seg))) return url;
  return `${SITE}/${rest}`;
}

/** FNV-1a over the full URL with two seeds (64 bits) plus its length: collision-safe ids without truncating the URL. */
function urlKey(url: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < url.length; i++) {
    const c = url.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x85ebca6b) >>> 0;
  }
  return `${url.length.toString(36)}-${h1.toString(36)}${h2.toString(36)}`;
}

export interface DeepLinkPorts {
  getInitialURL(): Promise<string | null>;
  /** Subscribes to live URL events; returns the unsubscribe. */
  listen(cb: (url: string) => void): () => void;
}

/** How long after start a launch URL's other side (initial URL vs its url-event echo) still pairs with it. */
export const LAUNCH_PAIR_MS = 10_000;

/**
 * The launch URL arrives twice on some platforms: via getInitialURL and as an echoed 'url' event. A single launch slot
 * is filled by whichever side delivers a VALID link first (id `cold:<key>`); the OTHER side reuses that id iff it is
 * the same URL within LAUNCH_PAIR_MS of start, then the slot clears, so the queue dedupes the pair at any delay or
 * order. Everything else (other URLs, same-side repeats, later re-taps) gets a fresh `link:` sequence id.
 */
export function startDeepLinkIntake(
  gate: Pick<TapGate, 'enqueue'>,
  ports: DeepLinkPorts,
  now: () => number = Date.now,
  onDiag: () => void = openDiagPanel,
): () => void {
  const startAt = now();
  let stopped = false;
  let seq = 0;
  let slotOpen = true;
  let launch: { key: string; id: string; from: 'initial' | 'event' } | null = null;
  const valid = (raw: unknown): string | null => {
    if (stopped || typeof raw !== 'string') return null;
    const url = normalizeDeepLink(raw);
    return canonicalizeLink(url) === null ? null : url;
  };
  const ingest = (raw: unknown, from: 'initial' | 'event') => {
    if (!stopped && isDiagLink(raw)) {
      onDiag();
      return;
    }
    const url = valid(raw);
    if (url === null) return;
    const key = urlKey(url);
    let id = `link:${++seq}:${key}`;
    if (launch !== null && launch.key === key && launch.from !== from && now() - startAt <= LAUNCH_PAIR_MS) {
      id = launch.id;
      launch = null;
    } else if (slotOpen && launch === null) {
      slotOpen = false;
      launch = { key, id: `cold:${key}`, from };
      id = launch.id;
    }
    gate.enqueue({ id, deepLink: url, source: 'deeplink' });
  };
  const off = ports.listen((raw) => ingest(raw, 'event'));
  ports
    .getInitialURL()
    .then((raw) => ingest(raw, 'initial'))
    .catch(() => {});
  return () => {
    stopped = true;
    off();
  };
}

export function useDeepLinks(gate: Pick<TapGate, 'enqueue'>): void {
  useEffect(() => {
    let stop: (() => void) | null = null;
    let cancelled = false;
    void import('react-native').then(({ Linking }) => {
      if (cancelled) return;
      stop = startDeepLinkIntake(gate, {
        getInitialURL: () => Linking.getInitialURL(),
        listen: (cb) => {
          const sub = Linking.addEventListener('url', (e) => cb(e.url));
          return () => sub.remove();
        },
      });
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [gate]);
}
