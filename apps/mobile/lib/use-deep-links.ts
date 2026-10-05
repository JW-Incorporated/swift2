// X4 (H6): deep-link intake. A https www/apex longlivets.com link or a longlive://<path> link that opens the app (cold
// `getInitialURL` or a live `url` event) joins the notification tap queue with source
// 'deeplink', so it takes the same gate (native navigator / bridge `navigate` + ack) as a tap.
// Hostile or foreign URLs are ignored before they reach the queue. App.tsx calls one hook.
import { useEffect } from 'react';
import { canonicalizeLink } from './notification-tap-queue';
import type { TapGate } from './notification-tap-gate';

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

/**
 * The cold URL (getInitialURL) and the FIRST live 'url' event at launch are one launch: when they carry the same URL
 * they share the stable id `cold:<key>` whatever the delay or order, so the queue dedupes them. Every later event
 * (a user re-tapping the same link) gets a fresh sequence id and navigates again.
 */
export function startDeepLinkIntake(gate: Pick<TapGate, 'enqueue'>, ports: DeepLinkPorts): () => void {
  let stopped = false;
  let seq = 0;
  let firstEventSeen = false;
  const send = (url: string, id: string) => gate.enqueue({ id, deepLink: url, source: 'deeplink' });
  const valid = (raw: unknown): string | null => {
    if (stopped || typeof raw !== 'string') return null;
    const url = normalizeDeepLink(raw);
    return canonicalizeLink(url) === null ? null : url;
  };
  const off = ports.listen((raw) => {
    const url = valid(raw);
    const first = !firstEventSeen;
    firstEventSeen = true;
    if (url === null) return;
    send(url, first ? `cold:${urlKey(url)}` : `link:${++seq}:${urlKey(url)}`);
  });
  ports
    .getInitialURL()
    .then((raw) => {
      const url = valid(raw);
      if (url !== null) send(url, `cold:${urlKey(url)}`);
    })
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
