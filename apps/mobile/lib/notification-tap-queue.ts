import { toWebPath } from '@swift2/ui';
import type { EventPayloadOf, WebPath } from '@swift2/ui';

export const MAX_QUEUED_TAPS = 16;
export const MAX_SEEN_TAPS = 64;

/** A notification response reduced to what the queue needs (no token, no PII). */
export type RawTap = { id?: unknown; deepLink?: unknown };
export type Tap = { id: string | null; path: WebPath };
export type TapSink = (tap: Tap) => void;
export type EnqueueOutcome = 'queued' | 'delivered' | 'duplicate' | 'dropped';

export interface TapQueueDeps {
  /** Maps a notification deep link to a web path (X4); default accepts a web path as-is. */
  resolvePath?: (deepLink: string) => WebPath | null;
  capacity?: number;
  seenCapacity?: number;
  /** A tap lost to an unmappable payload or to overflow; never throws into the caller. */
  onDrop?: (reason: 'unmappable' | 'overflow') => void;
}

/**
 * Holds notification taps until a sink (the shared UI host, once ready) is
 * attached, then replays them in arrival order and delivers later taps
 * immediately. Transport-neutral: E2 plugs a sink in via `attach`, and calls
 * `detach` when the host leaves ready (taps hold again) or the watchdog falls
 * back (attach a native-navigation sink instead, so no tap is lost).
 */
export function createTapQueue(deps: TapQueueDeps = {}) {
  const capacity = deps.capacity ?? MAX_QUEUED_TAPS;
  const seenCap = deps.seenCapacity ?? MAX_SEEN_TAPS;
  const resolvePath = deps.resolvePath ?? ((l: string) => toWebPath(l));
  const held: Tap[] = [];
  const seen = new Set<string>();
  let sink: TapSink | null = null;

  const drop = (reason: 'unmappable' | 'overflow') => {
    try {
      deps.onDrop?.(reason);
    } catch {
      /* a throwing drop sink must not break tap handling */
    }
  };

  function remember(id: string): void {
    seen.add(id);
    if (seen.size > seenCap) seen.delete(seen.values().next().value as string);
  }

  /** Deliver held taps in order; a throwing sink leaves the failed tap at the head. */
  function flush(): void {
    while (sink && held.length > 0) {
      const next = held[0];
      try {
        sink(next);
      } catch {
        return;
      }
      held.shift();
    }
  }

  function enqueue(raw: RawTap): EnqueueOutcome {
    const link = typeof raw.deepLink === 'string' ? raw.deepLink : null;
    const path = link === null ? null : resolvePath(link);
    if (!path) {
      drop('unmappable');
      return 'dropped';
    }
    const id = typeof raw.id === 'string' && raw.id.length > 0 && raw.id.length <= 256 ? raw.id : null;
    if (id !== null) {
      if (seen.has(id)) return 'duplicate';
      remember(id);
    }
    if (held.length >= capacity) {
      held.shift();
      drop('overflow');
    }
    held.push({ id, path });
    flush();
    return held.length === 0 ? 'delivered' : 'queued';
  }

  return {
    enqueue,
    attach(next: TapSink): void {
      sink = next;
      flush();
    },
    detach(): void {
      sink = null;
    },
    flush,
    size: () => held.length,
  };
}

export type TapQueue = ReturnType<typeof createTapQueue>;

/** The ready-host sink: `emit` is `BridgeHost.emit`. */
export const navigateSink =
  (emit: (type: 'navigate', payload: EventPayloadOf<'navigate'>) => void): TapSink =>
  (tap) =>
    emit('navigate', { path: tap.path, source: 'notification' });
