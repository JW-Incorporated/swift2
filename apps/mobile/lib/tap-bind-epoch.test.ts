import { describe, expect, it, vi } from 'vitest';
import { createTapGate } from './notification-tap-gate';
import { createTapBinder, disposeEpoch, releaseBeforeStrike } from './tap-bind-epoch';

function fakeHost(ready = true) {
  return {
    ready,
    emit: vi.fn(() => ({ epoch: 1, seq: 1 })),
    onAcked: vi.fn((_r: unknown, cb: (a: boolean) => void) => (queueMicrotask(() => cb(true)), () => {})),
    isReady() {
      return this.ready;
    },
  };
}

function setup(ready = true) {
  const lease = vi.fn();
  const gate = { bindHost: vi.fn(() => lease) };
  const host = fakeHost(ready);
  const onReadinessLoss = vi.fn();
  const binder = createTapBinder({ gate, host, onReadinessLoss });
  return { gate, host, lease, onReadinessLoss, binder };
}

describe('createTapBinder', () => {
  it('binds once, only after bridge ready AND first paint AND the navigate subscriber', () => {
    const { gate, binder, host } = setup(false);
    binder.firstPaint();
    expect(gate.bindHost).not.toHaveBeenCalled();
    binder.subscriberInstalled();
    expect(gate.bindHost).not.toHaveBeenCalled();
    host.ready = true;
    binder.firstPaint();
    expect(gate.bindHost).toHaveBeenCalledTimes(1);
    binder.firstPaint();
    expect(gate.bindHost).toHaveBeenCalledTimes(1);
    expect(binder.isBound()).toBe(true);
  });

  it('does not bind without the subscriber or without paint', () => {
    const a = setup();
    a.binder.subscriberInstalled();
    expect(a.gate.bindHost).not.toHaveBeenCalled();
    const b = setup();
    b.binder.firstPaint();
    expect(b.gate.bindHost).not.toHaveBeenCalled();
  });

  it('release (fatal / crash / fallback) calls the lease once and the epoch never rebinds', () => {
    const { gate, binder, lease } = setup();
    binder.subscriberInstalled();
    binder.firstPaint();
    binder.release();
    binder.release();
    expect(lease).toHaveBeenCalledTimes(1);
    binder.subscriberInstalled();
    binder.firstPaint();
    expect(gate.bindHost).toHaveBeenCalledTimes(1);
    expect(binder.isBound()).toBe(false);
  });

  it('release before bind prevents any later bind', () => {
    const { gate, binder } = setup();
    binder.release();
    binder.subscriberInstalled();
    binder.firstPaint();
    expect(gate.bindHost).not.toHaveBeenCalled();
  });

  it('readiness loss (a second subscriber handshake after binding) asks for a new epoch, never rebinds', () => {
    const { gate, binder, onReadinessLoss } = setup();
    binder.subscriberInstalled();
    binder.firstPaint();
    binder.subscriberInstalled();
    expect(onReadinessLoss).toHaveBeenCalledTimes(1);
    expect(gate.bindHost).toHaveBeenCalledTimes(1);
  });

  it('no readiness-loss callback once released (the owner is already tearing down)', () => {
    const { binder, onReadinessLoss } = setup();
    binder.release();
    binder.subscriberInstalled();
    expect(onReadinessLoss).not.toHaveBeenCalled();
  });
});

describe('teardown ordering', () => {
  it('unmount: lease released before host.dispose and link.dispose', () => {
    const order: string[] = [];
    const { binder, lease } = setup();
    lease.mockImplementation(() => void order.push('lease'));
    binder.subscriberInstalled();
    binder.firstPaint();
    disposeEpoch(binder, { dispose: () => void order.push('host') }, { dispose: () => void order.push('link') });
    expect(order).toEqual(['lease', 'host', 'link']);
  });

  it('protocol fatal and crash release the lease before the watchdog is told', () => {
    for (const trigger of ['protocol', 'terminated', 'render-gone'] as const) {
      const order: string[] = [];
      const { binder, lease } = setup();
      lease.mockImplementation(() => void order.push('lease'));
      binder.subscriberInstalled();
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

describe('with the real gate', () => {
  it('a released epoch leaves the gate unbound and a new epoch binds its own host', async () => {
    const tick = () => new Promise((r) => setTimeout(r, 0));
    const gate = createTapGate({ siteUrl: 'https://x.test' });
    const mk = () => {
      const host = fakeHost();
      return { host, binder: createTapBinder({ gate, host, onReadinessLoss: () => {} }) };
    };
    const a = mk();
    a.binder.subscriberInstalled();
    a.binder.firstPaint();
    gate.enqueue({ id: 't1', deepLink: 'https://longlivets.com/?item=abc' });
    await tick();
    expect(a.host.emit).toHaveBeenCalledTimes(1);
    a.binder.release();
    a.binder.firstPaint();
    const b = mk();
    b.binder.subscriberInstalled();
    b.binder.firstPaint();
    gate.enqueue({ id: 't2', deepLink: 'https://longlivets.com/?item=def' });
    await tick();
    expect(a.host.emit).toHaveBeenCalledTimes(1);
    expect(b.host.emit).toHaveBeenCalled();
  });
});
