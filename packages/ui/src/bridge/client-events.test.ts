import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBridgeClient } from './client';
import type { ClientOptions } from './client';
import { MAX_QUEUED_EVENTS } from './client-events';
import type { Envelope } from './envelope';

let posted: Envelope[];
let n: number;
const mk = (o: Partial<ClientOptions> = {}) =>
  createBridgeClient({ post: (e) => void posted.push(e), now: () => 1, idGen: () => `id${++n}`, ...o });
const rack = (): Envelope => ({ v: 1, id: 'ra', kind: 'evt', type: 'readyAck', payload: { hwm: 0 }, ts: 1 }) as Envelope;
const types = () => posted.map((e) => e.type);
const A = { statusBarStyle: 'light', background: '#0c0c0c' } as const;
const B = { statusBarStyle: 'dark', background: '#ffffff' } as const;

beforeEach(() => {
  posted = [];
  n = 0;
  vi.useFakeTimers();
});

describe('pre-ready events ride the call queue', () => {
  it('theme A then B before readyAck: one envelope, payload B, after ready, ordered against a queued call', () => {
    const c = mk({ queueUntilReady: true });
    c.sendEvent('theme', A);
    void c.call('haptic', { kind: 'light' });
    c.sendEvent('theme', B);
    expect(posted).toEqual([]);
    c.sendReady();
    expect(types()).toEqual(['ready']);
    c.receive(rack());
    expect(types()).toEqual(['ready', 'theme', 'haptic']);
    expect(posted.filter((e) => e.type === 'theme')).toHaveLength(1);
    expect(posted[1]!.payload).toEqual(B);
    expect(posted[1]!.kind).toBe('evt');
  });

  it('navReady and navigated queue in order and are not coalesced', () => {
    const c = mk({ queueUntilReady: true });
    c.sendEvent('navReady', {});
    c.sendEvent('navigated', { id: 'a', ok: true });
    c.sendEvent('navigated', { id: 'b', ok: false });
    c.sendReady();
    c.receive(rack());
    expect(types()).toEqual(['ready', 'navReady', 'navigated', 'navigated']);
  });

  it('after ready, sendEvent posts immediately', () => {
    const c = mk({ queueUntilReady: true });
    c.sendReady();
    c.receive(rack());
    c.sendEvent('theme', A);
    expect(types()).toEqual(['ready', 'theme']);
  });

  it('without queueUntilReady, sendEvent posts immediately', () => {
    const c = mk();
    c.sendEvent('theme', A);
    expect(types()).toEqual(['theme']);
  });

  it('diag still passes straight through before ready', () => {
    const c = mk({ queueUntilReady: true });
    c.sendDiag('stage');
    expect(types()).toEqual(['diag']);
  });

  it('dispose before the ack posts nothing queued', () => {
    const c = mk({ queueUntilReady: true });
    c.sendEvent('theme', A);
    c.sendReady();
    c.dispose();
    c.receive(rack());
    expect(types()).toEqual(['ready']);
  });

  it('caps queued events, dropping the oldest with an event-dropped signal', () => {
    const onSignal = vi.fn();
    const c = mk({ queueUntilReady: true, onSignal });
    for (let i = 0; i < MAX_QUEUED_EVENTS + 2; i++) c.sendEvent('navigated', { id: `n${i}`, ok: true });
    expect(onSignal).toHaveBeenCalledTimes(2);
    expect(onSignal).toHaveBeenCalledWith('event-dropped');
    c.sendReady();
    c.receive(rack());
    const ids = posted.filter((e) => e.type === 'navigated').map((e) => (e.payload as { id: string }).id);
    expect(ids).toHaveLength(MAX_QUEUED_EVENTS);
    expect(ids[0]).toBe('n2');
  });
});
