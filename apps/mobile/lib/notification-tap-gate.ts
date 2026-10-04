// WP2.3-E2 (H3): decides WHO receives a queued notification tap. Pure and
// transport-neutral (no expo / React imports; tests drive it with fakes).
//
// Three states, one queue (lib/notification-tap-queue.ts):
//  - native mode (`setNativeNavigator(fn)`): the DOM host is not mounted
//    (fallback / quarantine / pre-DOM): taps go to the native screens.
//  - host bound (`bindHost(host)`, DOM mounted AND ready): taps go over the
//    bridge as `navigate` events and count as delivered only on the DOM's ack.
//  - neither: the queue is detached and taps hold (15 s ack / 10 min TTL / cap 16).
// Native mode wins over a bound host (the host is being torn down).
import type { Tap, TapQueue, AckRef, RawTap } from './notification-tap-queue';
import { createTapQueue, navigateSink } from './notification-tap-queue';
import type { EventPayloadOf } from '@swift2/ui';

/** The slice of BridgeHost the gate needs. */
export type TapHost = {
  emit(type: 'navigate', payload: EventPayloadOf<'navigate'>): AckRef | null;
  onAcked(ref: AckRef, cb: (acked: boolean) => void): () => void;
};

export type RawResponse = {
  notification: { request: { identifier?: unknown; content: { data?: unknown } } };
};

/**
 * Reduces an expo notification response to a queue tap. The dedupe key is
 * `request.identifier` (cold `getLastNotificationResponseAsync` and the live
 * listener can deliver the SAME response twice). A missing/empty identifier
 * yields `id: undefined`: such a tap is NOT deduplicated (the queue only dedupes
 * non-empty string ids), so a double delivery with no identifier navigates twice.
 */
export function tapFromResponse(resp: RawResponse | null | undefined): RawTap | null {
  if (!resp) return null;
  const data = resp.notification.request.content.data as Record<string, unknown> | undefined;
  const id = resp.notification.request.identifier;
  return { id: typeof id === 'string' ? id : undefined, deepLink: data && typeof data.deepLink === 'string' ? data.deepLink : null };
}

export function createTapGate(opts: { siteUrl: string; queue?: TapQueue }) {
  const queue = opts.queue ?? createTapQueue();
  let native: ((url: string) => void) | null = null;
  let host: TapHost | null = null;
  const legacySeen = new Set<string>();

  const hostSink = (h: TapHost) =>
    navigateSink(
      (type, payload) => h.emit(type, payload),
      (_tap, ref, signal) =>
        new Promise<boolean>((resolve) => {
          if (!ref) return resolve(false);
          const off = h.onAcked(ref, resolve);
          signal.addEventListener('abort', off, { once: true });
        }),
    );

  // Re-attaching abandons the in-flight tap and re-delivers it, so only attach when the target changed.
  let target: unknown = null;
  function reconcile(): void {
    const next = native ?? host;
    if (next === target) return;
    target = next;
    if (native) {
      const go = native;
      queue.attach(async (tap: Tap) => (go(`${opts.siteUrl}${tap.path}`), true));
    } else if (host) queue.attach(hostSink(host));
    else queue.detach();
  }

  return {
    /** Enqueue one tap. In native mode a link the queue cannot map (unknown route root) still opens natively, as before E2. */
    enqueue(raw: RawTap): 'queued' | 'duplicate' | 'dropped' {
      const outcome = queue.enqueue(raw);
      if (outcome === 'dropped' && native && typeof raw.deepLink === 'string') {
        const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : null;
        if (id === null || !legacySeen.has(id)) {
          if (id !== null) legacySeen.add(id);
          native(raw.deepLink);
        }
      }
      return outcome;
    },
    /** DOM host not mounted (fallback, quarantine, pending): deliver natively. `null` leaves native mode. */
    setNativeNavigator(fn: ((url: string) => void) | null): void {
      native = fn;
      reconcile();
    },
    /** DOM host mounted and ready: deliver over the bridge. Call `unbindHost` when it is disposed or not ready. */
    bindHost(next: TapHost): void {
      host = next;
      reconcile();
    },
    unbindHost(): void {
      host = null;
      reconcile();
    },
    size: () => queue.size(),
  };
}

export type TapGate = ReturnType<typeof createTapGate>;
