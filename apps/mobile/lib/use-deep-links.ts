// X4 (H6): universal-link intake. A https longlivets.com link that opens the app (cold
// `getInitialURL` or a live `url` event) joins the notification tap queue with source
// 'deeplink', so it takes the same gate (native navigator / bridge `navigate` + ack) as a tap.
// Hostile or foreign URLs are ignored before they reach the queue. App.tsx calls one hook.
import { useEffect } from 'react';
import { canonicalizeLink } from './notification-tap-queue';
import type { TapGate } from './notification-tap-gate';

/** The same URL arriving again inside this window is one launch (initial URL + first `url` event). */
export const DEEP_LINK_DEDUPE_MS = 3000;

export interface DeepLinkPorts {
  getInitialURL(): Promise<string | null>;
  /** Subscribes to live URL events; returns the unsubscribe. */
  listen(cb: (url: string) => void): () => void;
}

export function startDeepLinkIntake(
  gate: Pick<TapGate, 'enqueue'>,
  ports: DeepLinkPorts,
  now: () => number = Date.now,
): () => void {
  let stopped = false;
  let last: { url: string; at: number } | null = null;
  const ingest = (url: unknown) => {
    if (stopped || typeof url !== 'string' || canonicalizeLink(url) === null) return;
    const at = now();
    if (last && last.url === url && at - last.at <= DEEP_LINK_DEDUPE_MS) return;
    last = { url, at };
    gate.enqueue({ id: `deeplink:${at}|${url}`.slice(0, 256), deepLink: url, source: 'deeplink' });
  };
  const off = ports.listen(ingest);
  ports
    .getInitialURL()
    .then(ingest)
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
