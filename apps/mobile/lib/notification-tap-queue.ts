import { toWebPath } from '@swift2/ui';
import type { EventPayloadOf, WebPath } from '@swift2/ui';
import { isNativeRoute as isHostRoute } from '../dom/slots/routes';
import { resolveTapDestination } from './destination-resolver';

export const MAX_QUEUED_TAPS = 16;
export const MAX_SEEN_TAPS = 64;
export const ACK_TIMEOUT_MS = 15_000;
export const TAP_TTL_MS = 10 * 60 * 1000;
/** Absolute age cap, host or not: a tap this old is dropped even if no host was ever available. */
export const TAP_MAX_AGE_MS = 24 * 60 * 60 * 1000;

const SITE_HOSTS = new Set(['longlivets.com', 'www.longlivets.com']);

/**
 * Canonicalizes a link to a site-relative `path?query#hash`: an app-relative path or an
 * absolute https longlivets.com (and www.) URL only; other hosts, userinfo/ports,
 * backslashes, traversal and over-long input are refused. Not route-restricted.
 */
export function canonicalizeLink(link: string): string | null {
  if (link.length === 0 || link.length > 2048 || link.includes('\\') || link.startsWith('//')) return null;
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
  const raw = rel.split(/[?#]/)[0].split('/');
  if (raw.some((s) => s === '..' || s === '.') || pathname.split('/').some((s) => s === '..')) return null;
  return rel;
}

/** Default tap resolver: the ONE destination resolver (destination-resolver.ts) decides; the queue stores its canonical path. */
export function resolveTapPath(link: string): WebPath | null {
  const rel = canonicalizeLink(link);
  if (rel === null) return null;
  const d = resolveTapDestination(rel, { isHostRoute });
  return d === null ? null : toWebPath(d.path);
}

/** A notification response reduced to what the queue needs (no token, no PII). */
export type TapSource = 'notification' | 'deeplink';
export type RawTap = { id?: unknown; deepLink?: unknown; source?: TapSource };
export type Tap = { id: string | null; path: WebPath; receivedAt: number; source: TapSource };
/**
 * Delivers one tap. Resolves `true` only when the receiver ACKNOWLEDGED it
 * (E2: the DOM's `ack`); `false`, a rejection or a disposed host means "not
 * delivered" and the tap stays at the head for the next `attach`.
 */
export type TapSink = (tap: Tap, signal?: AbortSignal) => Promise<boolean>;
export type EnqueueOutcome = 'queued' | 'duplicate' | 'dropped';

export interface TapQueueDeps {
  /** Maps a deep link to a web path; its output is revalidated at runtime. */
  resolvePath?: (deepLink: string) => WebPath | null;
  capacity?: number;
  seenCapacity?: number;
  /** Host-available time a held tap may wait for its ack; time with no sink attached (FirstLaunch/Recovery) does not count. */
  ttlMs?: number;
  /** Absolute age cap on a held tap regardless of host availability (default 24 h). */
  maxAgeMs?: number;
  /** Ack wait per tap before it is treated as not delivered (default 15 s). */
  ackTimeoutMs?: number;
  /** Clock for `receivedAt`/TTL: clock-relative, monotonic (performance.now) when available. */
  now?: () => number;
  /** A tap lost to an unmappable payload, overflow or age; never throws into the caller. */
  onDrop?: (reason: 'unmappable' | 'overflow' | 'stale', id: string | null) => void;
  /** A tap was acknowledged by its sink (id is the tap's dedupe id; never fired for id-less taps). */
  onDelivered?: (id: string) => void;
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
  const maxAge = deps.maxAgeMs ?? TAP_MAX_AGE_MS;
  const ackTimeout = deps.ackTimeoutMs ?? ACK_TIMEOUT_MS;
  const now = deps.now ?? (() => globalThis.performance?.now?.() ?? Date.now());
  const resolvePath = deps.resolvePath ?? resolveTapPath;
  const held: Tap[] = [];
  // id -> when it was delivered: a repeat id is a duplicate only within the TTL (a reused id later is a new tap).
  const delivered = new Map<string, number>();
  let sink: TapSink | null = null;
  // Host-available clock: accumulated sink-attached time (+ the open stretch). A tap's TTL age is measured on it.
  let hostAccum = 0;
  let attachedAt = 0;
  const hostBase = new WeakMap<Tap, number>();
  const hostTime = () => hostAccum + (sink ? now() - attachedAt : 0);
  const setSink = (next: TapSink | null) => {
    if (sink) hostAccum += now() - attachedAt;
    sink = next;
    if (next) attachedAt = now();
  };
  let flushing: Promise<void> | null = null;
  let again = false;
  let inFlight: Tap | null = null;
  let abandon: (() => void) | null = null;

  const drop = (reason: 'unmappable' | 'overflow' | 'stale', id: string | null = null) => {
    try {
      deps.onDrop?.(reason, id);
    } catch {
      /* a throwing drop sink must not break tap handling */
    }
  };

  function isRecentlyDelivered(id: string): boolean {
    const at = delivered.get(id);
    if (at === undefined) return false;
    if (now() - at <= ttl) return true;
    delivered.delete(id);
    return false;
  }

  function markDelivered(id: string | null): void {
    if (id === null) return;
    try {
      deps.onDelivered?.(id);
    } catch {
      /* a throwing delivery sink must not break tap handling */
    }
    delivered.set(id, now());
    if (delivered.size > seenCap) delivered.delete(delivered.keys().next().value as string);
  }

  async function drain(): Promise<void> {
    while (sink && held.length > 0) {
      const s = sink;
      const head = held[0];
      if (now() - head.receivedAt > maxAge || hostTime() - (hostBase.get(head) ?? 0) > ttl) {
        held.shift();
        drop('stale', head.id);
        continue;
      }
      let acked: boolean;
      let timer: ReturnType<typeof setTimeout> | undefined;
      inFlight = head;
      const ctl = new AbortController();
      try {
        const abandoned = new Promise<boolean>((r) => (abandon = () => r(false)));
        const timedOut = new Promise<boolean>((r) => (timer = setTimeout(() => r(false), ackTimeout)));
        acked = await Promise.race([s(head, ctl.signal).then((v) => v === true, () => false), abandoned, timedOut]);
      } catch {
        acked = false;
      } finally {
        ctl.abort();
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
    let path: WebPath | null;
    try {
      path = link === null ? null : toWebPath(resolvePath(link));
    } catch {
      path = null;
    }
    if (!path) {
      drop('unmappable', typeof raw.id === 'string' ? raw.id : null);
      return 'dropped';
    }
    const id = typeof raw.id === 'string' && raw.id.length > 0 && raw.id.length <= 256 ? raw.id : null;
    if (id !== null && (isRecentlyDelivered(id) || held.some((t) => t.id === id))) return 'duplicate';
    if (held.length >= capacity) {
      const idx = held[0] === inFlight ? 1 : 0;
      drop('overflow', idx >= held.length ? id : held[idx].id);
      if (idx >= held.length) return 'dropped';
      held.splice(idx, 1);
    }
    for (let i = held.length - 1; i >= 0; i--) {
      if (held[i] !== inFlight && now() - held[i].receivedAt > maxAge) drop('stale', held.splice(i, 1)[0].id);
    }
    const tap: Tap = { id, path, receivedAt: now(), source: raw.source === 'deeplink' ? 'deeplink' : 'notification' };
    hostBase.set(tap, hostTime());
    held.push(tap);
    void flush();
    return 'queued';
  }

  return {
    enqueue,
    attach(next: TapSink): void {
      setSink(next);
      abandon?.();
      void flush();
    },
    detach(): void {
      setSink(null);
      abandon?.();
    },
    flush,
    /** True when this id was already acknowledged (within the TTL); a held, undelivered id is false. */
    wasDelivered: isRecentlyDelivered,
    size: () => held.length,
  };
}

export type TapQueue = ReturnType<typeof createTapQueue>;

/** Structural twin of bridge-host's AckRef (the queue stays transport-neutral). */
export type AckRef = { epoch: number; seq: number };

/**
 * The ready-host sink: `emit` is `BridgeHost.emit` (its ref is passed on to `awaitAck`);
 * `awaitAck` resolves true on the DOM's ack (E2) and must release its waiter when `signal`
 * aborts (the queue aborts it on every path: ack, timeout, detach/attach). `source`
 * defaults to 'notification'.
 */
export const navigateSink =
  (
    emit: (type: 'navigate', payload: EventPayloadOf<'navigate'>) => AckRef | null | void,
    awaitAck: (tap: Tap, ref: AckRef | null, signal: AbortSignal) => Promise<boolean>,
    source: EventPayloadOf<'navigate'>['source'] = 'notification',
  ): TapSink =>
  (tap, signal = new AbortController().signal) => {
    const ref = emit('navigate', { path: tap.path, source: tap.source === 'deeplink' ? 'deeplink' : source });
    return awaitAck(tap, ref ? ref : null, signal);
  };
