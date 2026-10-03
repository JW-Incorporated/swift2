import { toWebPath } from '@swift2/ui';
import type { EventPayloadOf, WebPath } from '@swift2/ui';

export const MAX_QUEUED_TAPS = 16;
export const MAX_SEEN_TAPS = 64;
export const ACK_TIMEOUT_MS = 15_000;
export const TAP_TTL_MS = 10 * 60 * 1000;

const SITE_HOSTS = new Set(['longlivets.com', 'www.longlivets.com']);
/** First path segments the shared UI serves; `/` itself (query-driven surfaces) is always allowed. */
const ROUTE_ROOTS = new Set(['settings', 'privacy', 'terms', 'support', 'vault']);

/**
 * Default tap resolver: an app-relative path or an absolute longlivets.com
 * (and www.) URL becomes a web path, only if it lands on an internal route.
 * `/api`, `/internal`, other hosts, userinfo/ports and traversal are refused.
 */
export function resolveTapPath(link: string): WebPath | null {
  if (link.length === 0 || link.length > 2048 || link.includes('\\')) return null;
  let rel = link;
  if (!link.startsWith('/')) {
    let u: URL;
    try {
      u = new URL(link);
    } catch {
      return null;
    }
    if (u.protocol !== 'https:' || !SITE_HOSTS.has(u.hostname) || u.port || u.username || u.password) return null;
    rel = `${u.pathname}${u.search}${u.hash}`;
  }
  let pathname: string;
  try {
    pathname = new URL(rel, 'https://www.longlivets.com').pathname;
  } catch {
    return null;
  }
  const segs = pathname.split('/').filter(Boolean);
  if (segs.some((s) => s === '..' || s === '.')) return null;
  if (segs.length > 0 && !ROUTE_ROOTS.has(segs[0])) return null;
  return toWebPath(rel);
}

/** A notification response reduced to what the queue needs (no token, no PII). */
export type RawTap = { id?: unknown; deepLink?: unknown };
export type Tap = { id: string | null; path: WebPath; receivedAt: number };
/**
 * Delivers one tap. Resolves `true` only when the receiver ACKNOWLEDGED it
 * (E2: the DOM's `ack`); `false`, a rejection or a disposed host means "not
 * delivered" and the tap stays at the head for the next `attach`.
 */
export type TapSink = (tap: Tap) => Promise<boolean>;
export type EnqueueOutcome = 'queued' | 'duplicate' | 'dropped';

export interface TapQueueDeps {
  /** Maps a deep link to a web path; its output is revalidated at runtime. */
  resolvePath?: (deepLink: string) => WebPath | null;
  capacity?: number;
  seenCapacity?: number;
  ttlMs?: number;
  /** Ack wait per tap before it is treated as not delivered (default 15 s). */
  ackTimeoutMs?: number;
  /** Clock for `receivedAt`/TTL: clock-relative, monotonic (performance.now) when available. */
  now?: () => number;
  /** A tap lost to an unmappable payload, overflow or age; never throws into the caller. */
  onDrop?: (reason: 'unmappable' | 'overflow' | 'stale') => void;
}

/**
 * Holds notification taps until a sink (the shared UI host, once ready) is
 * attached, then replays them in arrival order, one at a time, removing a tap
 * and recording its id as delivered only after the sink acknowledges it.
 * Transport-neutral: E2 plugs a sink in via `attach`, calls `detach` when the
 * host leaves ready (taps hold again) and attaches a native-navigation sink
 * on fallback, so no tap is lost.
 */
export function createTapQueue(deps: TapQueueDeps = {}) {
  const capacity = deps.capacity ?? MAX_QUEUED_TAPS;
  const seenCap = deps.seenCapacity ?? MAX_SEEN_TAPS;
  const ttl = deps.ttlMs ?? TAP_TTL_MS;
  const ackTimeout = deps.ackTimeoutMs ?? ACK_TIMEOUT_MS;
  const now = deps.now ?? (() => globalThis.performance?.now?.() ?? Date.now());
  const resolvePath = deps.resolvePath ?? resolveTapPath;
  const held: Tap[] = [];
  const delivered = new Set<string>();
  let sink: TapSink | null = null;
  let flushing: Promise<void> | null = null;
  let again = false;
  let inFlight: Tap | null = null;
  let abandon: (() => void) | null = null;

  const drop = (reason: 'unmappable' | 'overflow' | 'stale') => {
    try {
      deps.onDrop?.(reason);
    } catch {
      /* a throwing drop sink must not break tap handling */
    }
  };

  function markDelivered(id: string | null): void {
    if (id === null) return;
    delivered.add(id);
    if (delivered.size > seenCap) delivered.delete(delivered.values().next().value as string);
  }

  async function drain(): Promise<void> {
    while (sink && held.length > 0) {
      const s = sink;
      const head = held[0];
      if (now() - head.receivedAt > ttl) {
        held.shift();
        drop('stale');
        continue;
      }
      let acked = false;
      let timer: ReturnType<typeof setTimeout> | undefined;
      inFlight = head;
      try {
        const abandoned = new Promise<boolean>((r) => (abandon = () => r(false)));
        const timedOut = new Promise<boolean>((r) => (timer = setTimeout(() => r(false), ackTimeout)));
        acked = await Promise.race([s(head).then((v) => v === true, () => false), abandoned, timedOut]);
      } catch {
        acked = false;
      } finally {
        clearTimeout(timer);
        abandon = null;
        inFlight = null;
      }
      if (!acked) return;
      markDelivered(head.id);
      const i = held.indexOf(head);
      if (i >= 0) held.splice(i, 1);
    }
  }

  /** Re-entrant calls coalesce into a re-run of the in-flight drain. */
  function flush(): Promise<void> {
    if (flushing) {
      again = true;
      return flushing;
    }
    flushing = (async () => {
      try {
        do {
          again = false;
          await drain();
        } while (again);
      } finally {
        flushing = null;
      }
    })();
    return flushing;
  }

  function enqueue(raw: RawTap): EnqueueOutcome {
    const link = typeof raw.deepLink === 'string' ? raw.deepLink : null;
    let path: WebPath | null = null;
    try {
      path = link === null ? null : toWebPath(resolvePath(link));
    } catch {
      path = null;
    }
    if (!path) {
      drop('unmappable');
      return 'dropped';
    }
    const id = typeof raw.id === 'string' && raw.id.length > 0 && raw.id.length <= 256 ? raw.id : null;
    if (id !== null && (delivered.has(id) || held.some((t) => t.id === id))) return 'duplicate';
    if (held.length >= capacity) {
      const idx = held[0] === inFlight ? 1 : 0;
      drop('overflow');
      if (idx >= held.length) return 'dropped';
      held.splice(idx, 1);
    }
    held.push({ id, path, receivedAt: now() });
    void flush();
    return 'queued';
  }

  return {
    enqueue,
    attach(next: TapSink): void {
      sink = next;
      abandon?.();
      void flush();
    },
    detach(): void {
      sink = null;
      abandon?.();
    },
    flush,
    size: () => held.length,
  };
}

export type TapQueue = ReturnType<typeof createTapQueue>;

/** The ready-host sink: `emit` is `BridgeHost.emit`; `awaitAck` resolves true on the DOM's ack (E2). */
export const navigateSink =
  (
    emit: (type: 'navigate', payload: EventPayloadOf<'navigate'>) => void,
    awaitAck: (tap: Tap) => Promise<boolean>,
  ): TapSink =>
  (tap) => {
    emit('navigate', { path: tap.path, source: 'notification' });
    return awaitAck(tap);
  };
