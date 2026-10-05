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

describe('notification tap queue', () => {
  it('holds a cold tap before ready and delivers it once after attach', async () => {
    const q = createTapQueue();
    expect(q.enqueue(tap('n1', '/settings'))).toBe('queued');
    const { sink, got } = ackAll();
    q.attach(sink);
    await q.flush();
    await q.flush();
    expect(got).toEqual(['/settings']);
    expect(q.size()).toBe(0);
  });

  it('replays held taps in arrival order', async () => {
    const q = createTapQueue();
    q.enqueue(tap('a', '/settings'));
    q.enqueue(tap('b', '/privacy'));
    q.enqueue(tap('c', '/terms'));
    const { sink, got } = ackAll();
    q.attach(sink);
    await q.flush();
    expect(got).toEqual(['/settings', '/privacy', '/terms']);
  });

  it('delivers a warm tap once attached', async () => {
    const q = createTapQueue();
    const { sink, got } = ackAll();
    q.attach(sink);
    expect(q.enqueue(tap('w', '/support'))).toBe('queued');
    await q.flush();
    expect(got).toEqual(['/support']);
  });

  it('delivers the same id from cold and listener paths once', async () => {
    const q = createTapQueue();
    const { sink, got } = ackAll();
    expect(q.enqueue(tap('dup', '/settings'))).toBe('queued');
    expect(q.enqueue(tap('dup', '/settings'))).toBe('duplicate');
    q.attach(sink);
    await q.flush();
    expect(q.enqueue(tap('dup', '/settings'))).toBe('duplicate');
    await q.flush();
    expect(got).toHaveLength(1);
  });

  it('holds again after detach', async () => {
    const q = createTapQueue();
    const sink = vi.fn(async () => true);
    q.attach(sink);
    q.detach();
    expect(q.enqueue(tap('d', '/settings'))).toBe('queued');
    await q.flush();
    expect(sink).not.toHaveBeenCalled();
    expect(q.size()).toBe(1);
  });

  it('keeps the tap and does not mark delivered on false ack, then redelivers on re-attach', async () => {
    const q = createTapQueue();
    q.enqueue(tap('r', '/settings'));
    q.attach(async () => false);
    await q.flush();
    expect(q.size()).toBe(1);
    expect(q.enqueue(tap('r', '/settings'))).toBe('duplicate');
    const { sink, got } = ackAll();
    q.attach(sink);
    await q.flush();
    expect(got).toEqual(['/settings']);
    expect(q.size()).toBe(0);
  });

  it('keeps the tap when the sink throws', async () => {
    const q = createTapQueue();
    q.enqueue(tap('t', '/settings'));
    q.attach(async () => {
      throw new Error('host gone');
    });
    await q.flush();
    expect(q.size()).toBe(1);
  });

  it('teardown before ack: detach mid-flight with a false ack keeps the tap', async () => {
    const q = createTapQueue();
    let release!: (v: boolean) => void;
    q.enqueue(tap('x', '/settings'));
    q.attach(() => new Promise<boolean>((r) => (release = r)));
    await new Promise((r) => setTimeout(r, 0));
    q.detach();
    release(false);
    await q.flush();
    expect(q.size()).toBe(1);
    const { sink, got } = ackAll();
    q.attach(sink);
    await q.flush();
    expect(got).toEqual(['/settings']);
  });

  it('does not redeliver after a delivered tap when re-attached', async () => {
    const q = createTapQueue();
    const first = ackAll();
    q.attach(first.sink);
    q.enqueue(tap('once', '/settings'));
    await q.flush();
    q.detach();
    const second = ackAll();
    q.attach(second.sink);
    await q.flush();
    expect(first.got).toEqual(['/settings']);
    expect(second.got).toEqual([]);
  });

  it('re-entrant enqueue from inside a sink is delivered without double-draining', async () => {
    const q = createTapQueue();
    const got: string[] = [];
    q.attach(async (t) => {
      got.push(t.path);
      if ((t.path as string) === '/settings') q.enqueue(tap('inner', '/privacy'));
      return true;
    });
    q.enqueue(tap('outer', '/settings'));
    await q.flush();
    await q.flush();
    expect(got).toEqual(['/settings', '/privacy']);
  });


  it('a hung sink is abandoned by detach then re-attach, and the tap is delivered', async () => {
    const q = createTapQueue();
    q.enqueue(tap('h', '/settings'));
    q.attach(() => new Promise<boolean>(() => {}));
    await new Promise((r) => setTimeout(r, 0));
    q.detach();
    const { sink, got } = ackAll();
    q.attach(sink);
    await q.flush();
    expect(got).toEqual(['/settings']);
    expect(q.size()).toBe(0);
  });

  it('an ack timeout releases the drain and keeps the tap', async () => {
    const q = createTapQueue({ ackTimeoutMs: 10 });
    q.enqueue(tap('to', '/settings'));
    q.attach(() => new Promise<boolean>(() => {}));
    await q.flush();
    expect(q.size()).toBe(1);
    const { sink, got } = ackAll();
    q.attach(sink);
    await q.flush();
    expect(got).toEqual(['/settings']);
  });

  it('overflow never evicts the in-flight head', async () => {
    const onDrop = vi.fn();
    const q = createTapQueue({ capacity: 2, onDrop });
    let release!: (v: boolean) => void;
    const seen: string[] = [];
    q.enqueue(tap('1', '/settings'));
    q.enqueue(tap('2', '/privacy'));
    q.attach((t) => {
      seen.push(t.path);
      return (t.path as string) === '/settings' ? new Promise<boolean>((r) => (release = r)) : Promise.resolve(true);
    });
    await new Promise((r) => setTimeout(r, 0));
    q.enqueue(tap('3', '/terms'));
    release(true);
    await q.flush();
    expect(seen).toEqual(['/settings', '/terms']);
    expect(onDrop).toHaveBeenCalledWith('overflow');
  });

  it('capacity 1 with an in-flight head drops the incoming tap', async () => {
    const q = createTapQueue({ capacity: 1 });
    let release!: (v: boolean) => void;
    q.enqueue(tap('1', '/settings'));
    q.attach(() => new Promise<boolean>((r) => (release = r)));
    await new Promise((r) => setTimeout(r, 0));
    expect(q.enqueue(tap('2', '/privacy'))).toBe('dropped');
    release(true);
    await q.flush();
    expect(q.size()).toBe(0);
  });

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
    expect(onDrop).toHaveBeenCalledWith('stale');
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
    expect(onDrop).toHaveBeenCalledWith('unmappable');
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
    expect(onDrop).toHaveBeenCalledWith('overflow');
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
