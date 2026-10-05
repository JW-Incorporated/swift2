import { describe, expect, it, vi } from 'vitest';
import { setup } from './bridge-host.test-kit';
import { createTapQueue, navigateSink, resolveTapPath } from './notification-tap-queue';
import type { AckRef, Tap, TapSink } from './notification-tap-queue';

const hostAwait =
  (host: ReturnType<typeof setup>['host']) => (_t: Tap, ref: AckRef | null, signal: AbortSignal) =>
    new Promise<boolean>((r) => {
      if (!ref) return r(false);
      const off = host.onAcked(ref, r);
      signal.addEventListener('abort', off, { once: true });
    });

const tap = (id: string | undefined, deepLink: unknown) => ({ id, deepLink });
const ackAll: () => { sink: TapSink; got: string[] } = () => {
  const got: string[] = [];
  return { got, sink: async (t) => (got.push(t.path), true) };
};


describe('notification tap queue (ttl, drops, resolver, sinks)', () => {
  it('uses the monotonic clock for the TTL by default', async () => {
    const spy = vi.spyOn(globalThis.performance, 'now').mockReturnValue(0);
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(0);
    const q = createTapQueue({ ttlMs: 1000 });
    q.enqueue(tap('m1', '/settings'));
    dateSpy.mockReturnValue(10_000_000);
    expect(spy).toHaveBeenCalled();
    const { sink, got } = ackAll();
    q.attach(sink);
    await q.flush();
    expect(got).toEqual(['/settings']);
    spy.mockRestore();
    dateSpy.mockRestore();
  });

  it('drops stale taps (older than the TTL) at flush', async () => {
    let t = 0;
    const onDrop = vi.fn();
    const q = createTapQueue({ now: () => t, ttlMs: 1000, onDrop });
    q.enqueue(tap('old', '/settings'));
    t = 5000;
    q.enqueue(tap('new', '/privacy'));
    const { sink, got } = ackAll();
    q.attach(sink);
    await q.flush();
    expect(got).toEqual(['/privacy']);
    expect(onDrop).toHaveBeenCalledWith('stale', 'old');
  });

  it('a delivered id is a duplicate only within the TTL; after it, the same id is a new tap', async () => {
    let t = 0;
    const q = createTapQueue({ now: () => t, ttlMs: 1000 });
    const { sink, got } = ackAll();
    q.attach(sink);
    expect(q.enqueue(tap('x', '/settings'))).toBe('queued');
    await q.flush();
    t = 500;
    expect(q.enqueue(tap('x', '/settings'))).toBe('duplicate');
    t = 1501;
    expect(q.enqueue(tap('x', '/settings'))).toBe('queued');
    await q.flush();
    expect(got).toEqual(['/settings', '/settings']);
  });

  it('drops unmappable payloads without throwing', () => {
    const onDrop = vi.fn();
    const q = createTapQueue({ onDrop });
    for (const bad of [
      undefined,
      null,
      5,
      {},
      '',
      'not-a-path',
      '//evil.com',
      'https://x.test/a',
      '/api/devices/register',
      '/internal/x',
      '/../etc',
      'https://evil.com/settings',
      'https://longlivets.com@evil.com/settings',
    ]) {
      expect(q.enqueue(tap('u', bad))).toBe('dropped');
    }
    expect(q.size()).toBe(0);
    expect(onDrop).toHaveBeenCalledWith('unmappable', 'u');
  });

  it('a dropped tap does not poison its id', () => {
    const q = createTapQueue();
    q.enqueue(tap('same', 'nope'));
    expect(q.enqueue(tap('same', '/settings'))).toBe('queued');
  });

  it('bounds the queue, dropping the oldest', async () => {
    const onDrop = vi.fn();
    const q = createTapQueue({ capacity: 2, onDrop });
    q.enqueue(tap('1', '/settings'));
    q.enqueue(tap('2', '/privacy'));
    q.enqueue(tap('3', '/terms'));
    expect(onDrop).toHaveBeenCalledWith('overflow', '1');
    const { sink, got } = ackAll();
    q.attach(sink);
    await q.flush();
    expect(got).toEqual(['/privacy', '/terms']);
  });

  it('revalidates an injected resolver output', () => {
    const q = createTapQueue({ resolvePath: () => 'javascript:alert(1)' as never });
    expect(q.enqueue(tap('j', 'x'))).toBe('dropped');
    const thrower = createTapQueue({
      resolvePath: () => {
        throw new Error('boom');
      },
    });
    expect(thrower.enqueue(tap('k', 'x'))).toBe('dropped');
  });

  it('uses a valid injected resolver', async () => {
    const q = createTapQueue({ resolvePath: (l) => (l === 'longlive://x' ? ('/x' as never) : null) });
    const { sink, got } = ackAll();
    q.attach(sink);
    expect(q.enqueue(tap('m', 'longlive://x'))).toBe('queued');
    await q.flush();
    expect(got).toEqual(['/x']);
  });

  it('navigateSink emits then resolves with the DOM ack', async () => {
    const emit = vi.fn();
    const q = createTapQueue();
    q.attach(navigateSink(emit, async (t: Tap) => t.id === 'e'));
    q.enqueue(tap('e', '/vault/lover'));
    await q.flush();
    expect(emit).toHaveBeenCalledWith('navigate', { path: '/vault/lover', source: 'notification' });
    expect(q.size()).toBe(0);
  });

  it('navigateSink passes the source through and hands the emit ref to awaitAck', async () => {
    const ref = { epoch: 3, seq: 7 };
    const emit = vi.fn().mockReturnValue(ref);
    const refs: Array<AckRef | null> = [];
    const q = createTapQueue();
    q.attach(navigateSink(emit, async (_t: Tap, r) => (refs.push(r), true), 'deeplink'));
    q.enqueue(tap('d', '/settings'));
    await q.flush();
    expect(emit).toHaveBeenCalledWith('navigate', { path: '/settings', source: 'deeplink' });
    expect(refs).toEqual([ref]);
  });

  it('a real host ack via onAcked resolves the in-flight tap and leaves no waiter', async () => {
    const s = setup();
    s.makeReady();
    const q = createTapQueue();
    q.attach(navigateSink(s.host.emit, hostAwait(s.host)));
    q.enqueue(tap('r', '/vault/lover'));
    await Promise.resolve();
    expect(q.size()).toBe(1);
    expect(s.host.ackWaiterCount()).toBe(1);
    s.evt('ack', { seq: 1 }, 'ack1');
    await q.flush();
    expect(q.size()).toBe(0);
    expect(s.host.ackWaiterCount()).toBe(0);
  });

  it('releases the ack waiter on timeout and across detach/attach cycles', async () => {
    vi.useFakeTimers();
    try {
      const s = setup();
      s.makeReady();
      const q = createTapQueue({ ackTimeoutMs: 100 });
      q.attach(navigateSink(s.host.emit, hostAwait(s.host)));
      q.enqueue(tap('t', '/settings'));
      await vi.advanceTimersByTimeAsync(101);
      expect(s.host.ackWaiterCount()).toBe(0);
      for (let i = 0; i < 5; i++) {
        q.detach();
        await vi.advanceTimersByTimeAsync(0);
        expect(s.host.ackWaiterCount()).toBe(0);
        q.attach(navigateSink(s.host.emit, hostAwait(s.host)));
        await vi.advanceTimersByTimeAsync(0);
        expect(s.host.ackWaiterCount()).toBe(1);
      }
      q.detach();
      await vi.advanceTimersByTimeAsync(0);
      expect(s.host.ackWaiterCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('resolveTapPath', () => {
  it('accepts relative internal routes and root with query', () => {
    expect(resolveTapPath('/settings')).toBe('/settings');
    expect(resolveTapPath('/?mode=threads')).toBe('/?mode=threads');
  });
  it('converts absolute longlivets.com and www payloads', () => {
    expect(resolveTapPath('https://longlivets.com/vault/folklore?x=1')).toBe('/vault/folklore?x=1');
    expect(resolveTapPath('https://www.longlivets.com/settings')).toBe('/settings');
    expect(resolveTapPath('https://www.longlivets.com/?current=inbox')).toBe('/inbox');
  });
  it('refuses http, other ports and hosts', () => {
    expect(resolveTapPath('http://longlivets.com/settings')).toBeNull();
    expect(resolveTapPath('https://longlivets.com:8443/settings')).toBeNull();
    expect(resolveTapPath('https://longlivets.com.evil.com/settings')).toBeNull();
  });
});
