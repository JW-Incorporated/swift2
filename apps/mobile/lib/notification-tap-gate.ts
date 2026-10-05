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
// Every sink receives only canonical site-relative links: an unmappable link opens home, never raw.
import type { Tap, TapQueue, AckRef, RawTap } from './notification-tap-queue';
import { createTapQueue } from './notification-tap-queue';
import type { EventPayloadOf } from '@swift2/ui';
import { toDomTapPath, toNativeTapPath } from '../dom/slots/settings-paths';

/** The slice of BridgeHost the gate needs. */
export type TapHost = {
  emit(type: 'navigate', payload: EventPayloadOf<'navigate'>): AckRef | null;
  onAcked(ref: AckRef, cb: (acked: boolean) => void): () => void;
};

export type RawResponse = {
  notification: { date?: unknown; request: { identifier?: unknown; content: { data?: unknown } } };
};

/**
 * Reduces an expo notification response to a queue tap. The dedupe key is
 * `request.identifier` (cold `getLastNotificationResponseAsync` and the live
 * listener can deliver the SAME response twice). Without an identifier the key
 * falls back to `anon:<notification.date>|<deepLink>`; with neither identifier nor
 * a finite date the response is malformed and rejected (null), never navigated.
 */
export function tapFromResponse(resp: RawResponse | null | undefined): RawTap | null {
  if (!resp) return null;
  const data = resp.notification.request.content.data as Record<string, unknown> | undefined;
  const deepLink = data && typeof data.deepLink === 'string' ? data.deepLink : null;
  const ident = resp.notification.request.identifier;
  if (typeof ident === 'string' && ident.length > 0) return { id: ident, deepLink };
  const date = resp.notification.date;
  if (typeof date === 'number' && Number.isFinite(date)) return { id: `anon:${date}|${deepLink ?? ''}`.slice(0, 256), deepLink };
  return null;
}

export function createTapGate(opts: {
  siteUrl: string;
  queue?: TapQueue;
  retryMs?: number;
  /** Forwarded to the default queue (ignored when `queue` is supplied). */
  onDelivered?: (id: string) => void;
  onDrop?: (reason: 'unmappable' | 'overflow' | 'stale', id: string | null) => void;
  timers?: { set: (fn: () => void, ms: number) => unknown; clear: (h: unknown) => void };
}) {
  const settledListeners = new Set<(id: string) => void>();
  const settle = (id: string | null) => {
    if (id !== null) for (const l of [...settledListeners]) l(id);
  };
  const queue =
    opts.queue ??
    createTapQueue({
      onDelivered: (id) => {
        opts.onDelivered?.(id);
        settle(id);
      },
      onDrop: (reason, id) => {
        opts.onDrop?.(reason, id);
        settle(id);
      },
    });
  const retryMs = opts.retryMs ?? 5000;
  const timers = opts.timers ?? { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) };
  let native: ((url: string) => void) | null = null;
  let host: TapHost | null = null;
  let lease = 0;
  let target: unknown = null;
  let retry: unknown = null;
  const legacySeen = new Set<string>();
  // Per live host: the ref each tap was already emitted with. A rebind or retry awaits the
  // existing event instead of emitting a duplicate while it is still in the outbox.
  const emitted = new WeakMap<TapHost, WeakMap<Tap, AckRef>>();

  const hostSink = (h: TapHost) => {
    const refs = emitted.get(h) ?? new WeakMap<Tap, AckRef>();
    emitted.set(h, refs);
    return async (tap: Tap, signal?: AbortSignal) => {
      let ref = refs.get(tap) ?? null;
      if (!ref) {
        ref = h.emit('navigate', { path: toDomTapPath(tap.path) as Tap['path'], source: tap.source });
        if (ref) refs.set(tap, ref);
      }
      if (!ref) return false;
      const live = ref;
      return new Promise<boolean>((resolve) => {
        const off = h.onAcked(live, (acked) => {
          if (!acked) refs.delete(tap);
          resolve(acked);
        });
        signal?.addEventListener('abort', off, { once: true });
      });
    };
  };

  function kick(): void {
    if (retry !== null) timers.clear(retry);
    retry = null;
    if (target === null) return;
    const mine = target;
    void queue.flush().then(() => {
      if (target !== mine || queue.size() === 0) return;
      retry = timers.set(kick, retryMs);
    });
  }

  // Re-attaching abandons the in-flight tap and re-delivers it, so only attach when the target changed.
  function reconcile(): void {
    const next = native ?? host;
    if (next === target) return;
    target = next;
    if (native) {
      const go = native;
      queue.attach(async (tap: Tap) => (go(`${opts.siteUrl}${toNativeTapPath(tap.path)}`), true));
    } else if (host) queue.attach(hostSink(host));
    else queue.detach();
    kick();
  }

  return {
    /** Enqueue one tap. In native mode a payload with no link opens home once per id; a refused link is logged and never navigated. */
    enqueue(raw: RawTap): 'queued' | 'duplicate' | 'dropped' {
      const outcome = queue.enqueue(raw);
      if (outcome === 'queued' && target !== null && retry === null) kick();
      if (outcome === 'dropped' && native) {
        // Legacy: a payload with no link at all opens home once per id. A present link the queue refused is never navigated.
        if (typeof raw.deepLink === 'string') console.warn('[tap-gate] refused deep link not navigated');
        else {
          const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : null;
          if (id === null || !legacySeen.has(id)) {
            if (id !== null) legacySeen.add(id);
            native(`${opts.siteUrl}/`);
          }
        }
      }
      return outcome;
    },
    /** DOM host not mounted (fallback, quarantine, pending): deliver natively. `null` leaves native mode. */
    setNativeNavigator(fn: ((url: string) => void) | null): void {
      native = fn;
      reconcile();
    },
    /**
     * DOM host mounted and ready (bridge ready AND the reader's ready signal, after the DOM's `navigate`
     * subscriber exists): deliver over the bridge. Returns this epoch's lease cleanup; it unbinds only
     * if still current, so a stale cleanup from an old epoch never unbinds a newer host.
     */
    bindHost(next: TapHost): () => void {
      const mine = ++lease;
      host = next;
      reconcile();
      return () => {
        if (lease !== mine || host !== next) return;
        host = null;
        reconcile();
      };
    },
    /** Fires with a tap's id once it is delivered (acked) or dropped; returns the unsubscribe. Default queue only. */
    onSettled(cb: (id: string) => void): () => void {
      settledListeners.add(cb);
      return () => void settledListeners.delete(cb);
    },
    /** Deterministic retry (AppState active): re-runs delivery of held taps to the current target. */
    resume(): void {
      kick();
    },
    wasDelivered: (id: string): boolean => queue.wasDelivered(id),
    size: () => queue.size(),
  };
}

export type TapGate = ReturnType<typeof createTapGate>;
