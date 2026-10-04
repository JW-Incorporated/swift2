// W2-I: the notification-tap bind lifecycle of ONE keyed host/client epoch. Pure (no RN/expo imports).
// The gate's bindHost(host) runs exactly once, and only when the bridge is ready AND the reader painted
// (onReady) AND the DOM `navigate` subscriber exists (it announces itself with the `navigate-subscriber`
// diag). The returned lease is released on every teardown path BEFORE the host/link are disposed. A
// released epoch never rebinds; readiness loss asks the owner for a NEW keyed epoch instead.
import type { TapGate, TapHost } from './notification-tap-gate';

export const NAVIGATE_SUBSCRIBER_STAGE = 'navigate-subscriber';

export function createTapBinder(opts: {
  gate: Pick<TapGate, 'bindHost'>;
  host: TapHost & { isReady(): boolean };
  /** The DOM re-handshook after this epoch bound (webview reload): the owner must start a new epoch. */
  onReadinessLoss: () => void;
}) {
  let sub = false;
  let paint = false;
  let lease: (() => void) | null = null;
  let released = false;
  const tryBind = () => {
    if (released || lease !== null || !sub || !paint || !opts.host.isReady()) return;
    lease = opts.gate.bindHost(opts.host);
  };
  return {
    subscriberInstalled(): void {
      if (released) return;
      if (lease !== null || sub) return opts.onReadinessLoss();
      sub = true;
      tryBind();
    },
    firstPaint(): void {
      paint = true;
      tryBind();
    },
    /** Idempotent. After this the epoch can never bind. */
    release(): void {
      released = true;
      const l = lease;
      lease = null;
      l?.();
    },
    isBound: () => lease !== null,
  };
}

export type TapBinder = ReturnType<typeof createTapBinder>;

/** Unmount / epoch end: the lease goes first, then the host and link. */
export function disposeEpoch(binder: Pick<TapBinder, 'release'>, host: { dispose(): void }, link: { dispose(): void }): void {
  binder.release();
  host.dispose();
  link.dispose();
}

/** Crash (content process gone / render gone) and protocol failure are watchdog strikes: release the lease before reporting. */
export function releaseBeforeStrike<W extends { crashed: (k: 'terminated' | 'render-gone') => void; protocol: () => void }>(
  watch: W,
  binder: Pick<TapBinder, 'release'>,
): W {
  return {
    ...watch,
    crashed: (k) => (binder.release(), watch.crashed(k)),
    protocol: () => (binder.release(), watch.protocol()),
  };
}
