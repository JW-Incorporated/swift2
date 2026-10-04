// W2-I: the notification-tap lifecycle of ONE keyed host/client epoch. Pure (no RN/expo imports).
// The gate's bindHost(target) runs exactly once, only when the bridge is ready AND the reader painted
// (onReady) AND the DOM announced its `navigate` subscriber (the dedicated `navReady` event). The lease is
// released BEFORE the host/link are disposed on every teardown path (the host's onBeforeShutdown covers
// protocol fatal and dispose). A released epoch never rebinds; a re-handshake of a bound epoch asks the
// owner for a NEW keyed epoch. Delivery counts only after the DOM confirms the reader committed.
import type { TapGate, TapHost } from './notification-tap-gate';
import type { AckRef } from './notification-tap-queue';

export const NAV_UNBOUND_MS = 10_000;

export function createTapBinder(opts: {
  gate: Pick<TapGate, 'bindHost'>;
  host: TapHost & { isReady(): boolean };
  /** The DOM re-handshook after this epoch bound: the lease is already released; start a new epoch. */
  onReadinessLoss: () => void;
  /** Observability only: ready + first paint elapsed NAV_UNBOUND_MS without navReady. */
  onNavUnbound?: () => void;
  timers?: { set: (fn: () => void, ms: number) => unknown; clear: (h: unknown) => void };
}) {
  const timers = opts.timers ?? { set: (fn, ms) => setTimeout(fn, ms), clear: (h) => clearTimeout(h as ReturnType<typeof setTimeout>) };
  let unboundTimer: unknown = null;
  const disarm = () => {
    if (unboundTimer !== null) timers.clear(unboundTimer);
    unboundTimer = null;
  };
  let sub = false;
  let paint = false;
  let lease: (() => void) | null = null;
  let released = false;
  const tryBind = () => {
    if (released || lease !== null || !paint || !opts.host.isReady()) return;
    if (!sub) {
      if (unboundTimer === null && opts.onNavUnbound) unboundTimer = timers.set(opts.onNavUnbound, NAV_UNBOUND_MS);
      return;
    }
    disarm();
    lease = opts.gate.bindHost(opts.host);
  };
  const release = () => {
    released = true;
    disarm();
    const l = lease;
    lease = null;
    l?.();
  };
  return {
    /** Idempotent: a repeat from the same client changes nothing. */
    navReady(): void {
      if (released || sub) return;
      sub = true;
      tryBind();
    },
    firstPaint(): void {
      paint = true;
      tryBind();
    },
    /** A `ready` after the handshake: bound -> release synchronously, then a new epoch; unbound -> wait for the new client's navReady. */
    readyAgain(): void {
      if (released) return;
      if (lease === null) {
        sub = false;
        return;
      }
      release();
      opts.onReadinessLoss();
    },
    /** Idempotent. After this the epoch can never bind. */
    release,
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

type NavHost = {
  emit(type: 'navigate', payload: { path: never; source: 'notification'; id?: string }): AckRef | null;
  onAcked(ref: AckRef, cb: (acked: boolean) => void): () => void;
  isReady(): boolean;
};

/**
 * The gate's host for one epoch. A path the reader renders (pathname `/`, not native-owned) is emitted with an
 * id and counts as delivered only after the host ack AND the DOM's `navigated {ok:true}` (so a missing
 * subscriber or a throwing handler leaves the tap queued). Any other path (/settings, /privacy, /terms,
 * /support, /vault, native-owned routes) is opened by native via `openElsewhere`; the DOM never sees it.
 */
export function createTapTarget(opts: { host: NavHost; isReaderPath: (path: string) => boolean; openElsewhere: (path: string) => boolean | Promise<boolean> }) {
  let counter = 0;
  const idByRef = new Map<string, string>();
  const outcome = new Map<string, boolean>();
  const outstanding = new Set<string>();
  const nonce = Math.random().toString(36).slice(2, 8);
  const waiters = new Map<string, () => void>();
  const local = new Map<number, Promise<boolean>>();
  const key = (r: AckRef) => `${r.epoch}:${r.seq}`;
  const target: TapHost & { isReady(): boolean; onNavigated(e: { id: string; ok: boolean }): void; navigateDom(path: string): Promise<boolean> } = {
    isReady: () => opts.host.isReady(),
    emit(_type, payload) {
      const path = payload.path as string;
      if (!opts.isReaderPath(path)) {
        const n = ++counter;
        local.set(n, Promise.resolve(opts.openElsewhere(path)).catch(() => false));
        return { epoch: -1, seq: n };
      }
      const id = `t${nonce}-${++counter}`;
      const ref = opts.host.emit('navigate', { path: payload.path as never, source: 'notification', id });
      if (ref) {
        idByRef.set(key(ref), id);
        outstanding.add(id);
      }
      return ref;
    },
    onAcked(ref, cb) {
      if (ref.epoch === -1) {
        let live = true;
        void local.get(ref.seq)?.then((ok) => live && cb(ok));
        return () => void (live = false);
      }
      const id = idByRef.get(key(ref));
      if (id === undefined) return opts.host.onAcked(ref, cb);
      let acked = false;
      let done = false;
      outstanding.add(id);
      const finish = (v: boolean) => {
        if (done) return;
        done = true;
        waiters.delete(id);
        outstanding.delete(id);
        outcome.delete(id);
        idByRef.delete(key(ref));
        cb(v);
      };
      const check = () => {
        const o = outcome.get(id);
        if (o === false) finish(false);
        else if (o === true && acked) finish(true);
      };
      const off = opts.host.onAcked(ref, (a) => {
        if (!a) return finish(false);
        acked = true;
        check();
      });
      waiters.set(id, check);
      check();
      return () => {
        done = true;
        waiters.delete(id);
        outstanding.delete(id);
        off();
      };
    },
    onNavigated({ id, ok }) {
      if (!outstanding.has(id)) return;
      outcome.set(id, ok);
      waiters.get(id)?.();
    },
    // Native-initiated DOM navigation (About -> legal page): always emitted to the DOM, never opened elsewhere.
    // Resolves true only after the host ack AND the DOM's navigated {ok:true}; false when no ref/ack/handler.
    navigateDom(path) {
      const id = `t${nonce}-${++counter}`;
      const ref = opts.host.emit('navigate', { path: path as never, source: 'notification', id });
      if (!ref) return Promise.resolve(false);
      idByRef.set(key(ref), id);
      outstanding.add(id);
      return new Promise<boolean>((resolve) => void target.onAcked(ref, resolve));
    },
  };
  return target;
}
