import { describe, expect, it, vi } from 'vitest';
import { NAV_UNBOUND_MS, createTapBinder, createTapTarget, disposeEpoch, releaseBeforeStrike } from './tap-bind-epoch';

function setup(ready = true) {
  const lease = vi.fn();
  const gate = { bindHost: vi.fn(() => lease) };
  const host = {
    ready,
    emit: vi.fn(() => ({ epoch: 1, seq: 1 })),
    onAcked: vi.fn(() => () => {}),
    isReady() {
      return this.ready;
    },
  };
  const onReadinessLoss = vi.fn();
  const binder = createTapBinder({ gate, host, onReadinessLoss });
  return { gate, host, lease, onReadinessLoss, binder };
}

describe('createTapBinder', () => {
  it('binds once, only after bridge ready AND first paint AND navReady', () => {
    const { gate, binder, host } = setup(false);
    binder.firstPaint();
    binder.navReady();
    expect(gate.bindHost).not.toHaveBeenCalled();
    host.ready = true;
    binder.firstPaint();
    expect(gate.bindHost).toHaveBeenCalledTimes(1);
    binder.firstPaint();
    binder.navReady();
    expect(gate.bindHost).toHaveBeenCalledTimes(1);
    expect(binder.isBound()).toBe(true);
  });

  it('does not bind without navReady or without paint', () => {
    const a = setup();
    a.binder.navReady();
    expect(a.gate.bindHost).not.toHaveBeenCalled();
    const b = setup();
    b.binder.firstPaint();
    expect(b.gate.bindHost).not.toHaveBeenCalled();
  });

  it('repeated navReady from the same client is idempotent (StrictMode double mount)', () => {
    const { gate, binder, onReadinessLoss } = setup();
    binder.navReady();
    binder.navReady();
    binder.firstPaint();
    binder.navReady();
    expect(gate.bindHost).toHaveBeenCalledTimes(1);
    expect(onReadinessLoss).not.toHaveBeenCalled();
  });

  it('a re-handshake before bind only resets the subscriber flag (no epoch churn)', () => {
    const { gate, binder, onReadinessLoss } = setup();
    binder.navReady();
    binder.readyAgain();
    binder.firstPaint();
    expect(gate.bindHost).not.toHaveBeenCalled();
    binder.navReady();
    expect(gate.bindHost).toHaveBeenCalledTimes(1);
    expect(onReadinessLoss).not.toHaveBeenCalled();
  });

  it('a re-handshake after bind releases the lease synchronously, then asks for a new epoch; never rebinds', () => {
    const order: string[] = [];
    const { gate, binder, lease, onReadinessLoss } = setup();
    lease.mockImplementation(() => void order.push('lease'));
    onReadinessLoss.mockImplementation(() => void order.push('loss'));
    binder.navReady();
    binder.firstPaint();
    binder.readyAgain();
    expect(order).toEqual(['lease', 'loss']);
    binder.navReady();
    binder.firstPaint();
    binder.readyAgain();
    expect(gate.bindHost).toHaveBeenCalledTimes(1);
    expect(onReadinessLoss).toHaveBeenCalledTimes(1);
  });

  it('release calls the lease once; a released epoch never binds', () => {
    const { gate, binder, lease } = setup();
    binder.navReady();
    binder.firstPaint();
    binder.release();
    binder.release();
    expect(lease).toHaveBeenCalledTimes(1);
    binder.navReady();
    binder.firstPaint();
    expect(gate.bindHost).toHaveBeenCalledTimes(1);
    const early = setup();
    early.binder.release();
    early.binder.navReady();
    early.binder.firstPaint();
    expect(early.gate.bindHost).not.toHaveBeenCalled();
  });
});

describe('teardown ordering', () => {
  it('unmount: lease released before host.dispose and link.dispose', () => {
    const order: string[] = [];
    const { binder, lease } = setup();
    lease.mockImplementation(() => void order.push('lease'));
    binder.navReady();
    binder.firstPaint();
    disposeEpoch(binder, { dispose: () => void order.push('host') }, { dispose: () => void order.push('link') });
    expect(order).toEqual(['lease', 'host', 'link']);
  });

  it('crash and watchdog protocol strikes release the lease before the watchdog is told', () => {
    for (const trigger of ['protocol', 'terminated', 'render-gone'] as const) {
      const order: string[] = [];
      const { binder, lease } = setup();
      lease.mockImplementation(() => void order.push('lease'));
      binder.navReady();
      binder.firstPaint();
      const watch = releaseBeforeStrike(
        { ready: vi.fn(), error: vi.fn(), crashed: (_k: 'terminated' | 'render-gone') => void order.push('crashed'), protocol: () => void order.push('protocol') },
        binder,
      );
      if (trigger === 'protocol') watch.protocol();
      else watch.crashed(trigger);
      expect(order).toEqual(['lease', trigger === 'protocol' ? 'protocol' : 'crashed']);
    }
  });
});

describe('bridge-nav-unbound observability', () => {
  function timed() {
    const fired: (() => void)[] = [];
    const cleared: unknown[] = [];
    const delays: number[] = [];
    const timers = { set: (fn: () => void, ms: number) => (fired.push(fn), delays.push(ms), fired.length), clear: (h: unknown) => void cleared.push(h) };
    const onNavUnbound = vi.fn();
    const lease = vi.fn();
    const host = { emit: vi.fn(), onAcked: vi.fn(), isReady: () => true };
    const binder = createTapBinder({ gate: { bindHost: vi.fn(() => lease) }, host: host as never, onReadinessLoss: vi.fn(), onNavUnbound, timers });
    return { fired, cleared, delays, onNavUnbound, binder };
  }

  it('arms at ready + first paint without navReady (10 s) and fires only observability', () => {
    const t = timed();
    t.binder.firstPaint();
    expect(t.delays).toEqual([NAV_UNBOUND_MS]);
    t.fired[0]();
    expect(t.onNavUnbound).toHaveBeenCalledTimes(1);
  });

  it('is cleared on bind and on release', () => {
    const a = timed();
    a.binder.firstPaint();
    a.binder.navReady();
    expect(a.cleared).toEqual([1]);
    const b = timed();
    b.binder.firstPaint();
    b.binder.release();
    expect(b.cleared).toEqual([1]);
  });
});

describe('createTapTarget confirmation hardening', () => {
  function target() {
    let seq = 0;
    const acks: ((a: boolean) => void)[] = [];
    const host = {
      emit: vi.fn(() => ({ epoch: 1, seq: ++seq })),
      onAcked: vi.fn((_r: unknown, cb: (a: boolean) => void) => (acks.push(cb), () => {})),
      isReady: () => true,
    };
    const t = createTapTarget({ host: host as never, isReaderPath: () => true, openElsewhere: async () => true });
    return { t, host, acks };
  }

  it('a navigated sent before any tap (t1) never confirms a later tap; only a genuine id does', () => {
    const { t, host, acks } = target();
    t.onNavigated({ id: 't1', ok: true });
    const ref = t.emit('navigate', { path: '/?item=a' as never, source: 'notification' });
    const cb = vi.fn();
    t.onAcked(ref!, cb);
    acks[0](true);
    expect(cb).not.toHaveBeenCalled();
    const id = (host.emit.mock.calls[0] as unknown as [string, { id: string }])[1].id;
    expect(id).toMatch(/^t[a-z0-9]+-1$/);
    t.onNavigated({ id: 't1', ok: true });
    expect(cb).not.toHaveBeenCalled();
    t.onNavigated({ id, ok: true });
    expect(cb).toHaveBeenCalledWith(true);
  });

  it('a navigated after the waiter unsubscribed is ignored', () => {
    const { t, host } = target();
    const ref = t.emit('navigate', { path: '/?item=a' as never, source: 'notification' });
    const cb = vi.fn();
    const off = t.onAcked(ref!, cb);
    off();
    const id = (host.emit.mock.calls[0] as unknown as [string, { id: string }])[1].id;
    t.onNavigated({ id, ok: true });
    expect(cb).not.toHaveBeenCalled();
  });
});
