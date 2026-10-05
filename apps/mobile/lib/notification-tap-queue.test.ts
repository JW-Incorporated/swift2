import { describe, expect, it, vi } from 'vitest';
import { createTapQueue } from './notification-tap-queue';
import type { TapSink } from './notification-tap-queue';

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

});
