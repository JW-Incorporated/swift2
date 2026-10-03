import { describe, expect, it, vi } from 'vitest';
import { createTapQueue, navigateSink } from './notification-tap-queue';
import type { Tap } from './notification-tap-queue';

const tap = (id: string | undefined, deepLink: unknown) => ({ id, deepLink });

describe('notification tap queue', () => {
  it('holds a cold tap before ready and delivers it once after attach', () => {
    const q = createTapQueue();
    expect(q.enqueue(tap('n1', '/eras/lover'))).toBe('queued');
    const got: Tap[] = [];
    q.attach((t) => got.push(t));
    expect(got).toEqual([{ id: 'n1', path: '/eras/lover' }]);
    q.flush();
    expect(got).toHaveLength(1);
    expect(q.size()).toBe(0);
  });

  it('replays held taps in arrival order', () => {
    const q = createTapQueue();
    q.enqueue(tap('a', '/a'));
    q.enqueue(tap('b', '/b'));
    q.enqueue(tap('c', '/c'));
    const got: string[] = [];
    q.attach((t) => got.push(t.path));
    expect(got).toEqual(['/a', '/b', '/c']);
  });

  it('delivers a warm tap immediately once attached', () => {
    const q = createTapQueue();
    const sink = vi.fn();
    q.attach(sink);
    expect(q.enqueue(tap('w', '/w'))).toBe('delivered');
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it('delivers the same id from cold and listener paths once', () => {
    const q = createTapQueue();
    const sink = vi.fn();
    expect(q.enqueue(tap('dup', '/x'))).toBe('queued');
    expect(q.enqueue(tap('dup', '/x'))).toBe('duplicate');
    q.attach(sink);
    expect(q.enqueue(tap('dup', '/x'))).toBe('duplicate');
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it('holds again after detach', () => {
    const q = createTapQueue();
    const sink = vi.fn();
    q.attach(sink);
    q.detach();
    expect(q.enqueue(tap('d', '/d'))).toBe('queued');
    expect(sink).not.toHaveBeenCalled();
  });

  it('drops unmappable payloads without throwing', () => {
    const onDrop = vi.fn();
    const q = createTapQueue({ onDrop });
    for (const bad of [undefined, null, 5, {}, '', 'not-a-path', '//evil.com', 'https://x.test/a']) {
      expect(q.enqueue(tap('u', bad))).toBe('dropped');
    }
    expect(q.size()).toBe(0);
    expect(onDrop).toHaveBeenCalledWith('unmappable');
  });

  it('a dropped tap does not poison its id', () => {
    const q = createTapQueue();
    q.enqueue(tap('same', 'nope'));
    expect(q.enqueue(tap('same', '/ok'))).toBe('queued');
  });

  it('bounds the queue, dropping the oldest', () => {
    const onDrop = vi.fn();
    const q = createTapQueue({ capacity: 2, onDrop });
    q.enqueue(tap('1', '/1'));
    q.enqueue(tap('2', '/2'));
    q.enqueue(tap('3', '/3'));
    expect(onDrop).toHaveBeenCalledWith('overflow');
    const got: string[] = [];
    q.attach((t) => got.push(t.path));
    expect(got).toEqual(['/2', '/3']);
  });

  it('bounds the seen set (oldest ids are forgotten)', () => {
    const q = createTapQueue({ seenCapacity: 2 });
    q.attach(() => {});
    q.enqueue(tap('1', '/1'));
    q.enqueue(tap('2', '/2'));
    q.enqueue(tap('3', '/3'));
    expect(q.enqueue(tap('3', '/3'))).toBe('duplicate');
    expect(q.enqueue(tap('1', '/1'))).toBe('delivered');
  });

  it('keeps a tap whose sink throws and retries on flush', () => {
    const q = createTapQueue();
    let fail = true;
    const got: string[] = [];
    q.attach((t) => {
      if (fail) throw new Error('host gone');
      got.push(t.path);
    });
    expect(q.enqueue(tap('r', '/r'))).toBe('queued');
    fail = false;
    q.flush();
    expect(got).toEqual(['/r']);
  });

  it('uses a custom resolver (deep link to web path)', () => {
    const q = createTapQueue({ resolvePath: (l) => (l === 'longlive://x' ? ('/x' as never) : null) });
    const sink = vi.fn();
    q.attach(sink);
    expect(q.enqueue(tap('m', 'longlive://x'))).toBe('delivered');
    expect(sink).toHaveBeenCalledWith({ id: 'm', path: '/x' });
  });

  it('navigateSink emits a notification-sourced navigate event', () => {
    const emit = vi.fn();
    const q = createTapQueue();
    q.attach(navigateSink(emit));
    q.enqueue(tap('e', '/eras/folklore'));
    expect(emit).toHaveBeenCalledWith('navigate', { path: '/eras/folklore', source: 'notification' });
  });
});
