import { describe, expect, it, vi } from 'vitest';
import { merchLink, songLink, theoriesBoardLink } from '@swift2/shared';
import { createTapGate, type RawResponse } from './notification-tap-gate';
import { createTapQueue } from './notification-tap-queue';
import { startTapIngest } from './notification-tap-ingest';
import { createTapTarget } from './tap-bind-epoch';

// Production-shaped end to end: expo response (absolute producer link) -> intake -> real queue -> real gate ->
// bridge `navigate` emit -> DOM `navigated` ack. Every wait is on an explicit completion promise, never a timer.
const SITE = 'https://www.longlivets.com';
const SONG = songLink('fearless::1::Love Story');
const THEORIES = theoriesBoardLink();
const MERCH = merchLink();
const SONG_PATH = '/?song=fearless%3A%3A1%3A%3ALove%20Story';

const r = (identifier: unknown, deepLink: string, date?: number): RawResponse => ({
  notification: { date, request: { identifier, content: { data: { deepLink } } } },
});

type Waiter = { n: number; resolve: () => void };
function counter() {
  let count = 0;
  const waiters: Waiter[] = [];
  return {
    bump() {
      count++;
      for (const w of waiters.filter((x) => count >= x.n)) w.resolve();
    },
    reached: (n: number) => (count >= n ? Promise.resolve() : new Promise<void>((resolve) => waiters.push({ n, resolve }))),
    get count() {
      return count;
    },
  };
}

function rig(last: RawResponse | null | Promise<RawResponse | null>) {
  const emits: { path: string; id: string }[] = [];
  const emitted = counter();
  const enqueued = counter();
  const cleared = counter();
  let seq = 0;
  const holder: { target?: ReturnType<typeof createTapTarget> } = {};
  const host = {
    isReady: () => true,
    emit: (_t: 'navigate', p: { path: never; source: 'notification' | 'deeplink'; id?: string }) => {
      emits.push({ path: p.path as string, id: p.id as string });
      emitted.bump();
      return { epoch: 1, seq: ++seq };
    },
    onAcked: (_r: unknown, cb: (a: boolean) => void) => (queueMicrotask(() => cb(true)), () => {}),
  };
  const target = createTapTarget({ host, isReaderPath: () => true, openElsewhere: async () => true });
  holder.target = target;
  const settled = new Set<(id: string) => void>();
  const fire = (id: string | null) => id && [...settled].forEach((l) => l(id));
  const queue = createTapQueue({ onDelivered: fire, onDrop: (_r, id) => fire(id) });
  const gate = createTapGate({ siteUrl: SITE, queue });
  gate.bindHost(target);

  let live: ((x: RawResponse | null) => void) | null = null;
  const clearLast = vi.fn(async () => void cleared.bump());
  const stop = startTapIngest(
    {
      enqueue: (raw) => {
        const outcome = gate.enqueue(raw);
        enqueued.bump();
        return outcome;
      },
      onSettled: (cb) => (settled.add(cb), () => void settled.delete(cb)),
      wasDelivered: (id) => queue.wasDelivered(id),
    },
    {
      getLast: () => Promise.resolve(last),
      clearLast,
      listen: (cb) => {
        live = cb;
        return () => void (live = null);
      },
    },
  );
  return {
    emits,
    emitted,
    enqueued,
    cleared,
    clearLast,
    stop,
    queue,
    deliver: (x: RawResponse | null) => live?.(x),
    /** The DOM confirms the reader committed the nth emitted navigation. */
    domAck: (n: number) => target.onNavigated({ id: emits[n - 1]!.id, ok: true }),
  };
}

describe('tap ingest (absolute producer links, real queue + gate + DOM ack)', () => {
  it('cold + listener delivering the same identifier navigate once; cold path clears once', async () => {
    const t = rig(r('same', SONG));
    await t.emitted.reached(1);
    t.deliver(r('same', SONG));
    await t.enqueued.reached(2);
    expect(t.clearLast).not.toHaveBeenCalled();
    t.domAck(1);
    await t.queue.flush();
    await t.cleared.reached(1);
    expect(t.emits.map((e) => e.path)).toEqual([SONG_PATH]);
    expect(t.queue.size()).toBe(0);
    expect(t.clearLast).toHaveBeenCalledTimes(1);
  });

  it('a live tap arriving while the cold read is pending is processed after it, in order, and not cleared', async () => {
    let release: (v: RawResponse | null) => void = () => {};
    const t = rig(new Promise((res) => (release = res)));
    t.deliver(r('live', THEORIES));
    expect(t.enqueued.count).toBe(0);
    expect(t.emits).toEqual([]);
    release(r('cold', SONG));
    await t.emitted.reached(1);
    t.domAck(1);
    await t.emitted.reached(2);
    t.domAck(2);
    await t.queue.flush();
    expect(t.emits.map((e) => e.path)).toEqual([SONG_PATH, '/?mode=threads']);
    expect(t.clearLast).toHaveBeenCalledTimes(1);
    expect(t.queue.size()).toBe(0);
  });

  it('identifier-less responses dedupe on date + link; malformed (no id, no date) are rejected', async () => {
    const t = rig(r(undefined, MERCH, 7));
    await t.emitted.reached(1);
    t.deliver(r(undefined, MERCH, 7));
    t.deliver(r(undefined, MERCH));
    t.deliver(r('sentinel', THEORIES));
    await t.enqueued.reached(3);
    t.domAck(1);
    await t.emitted.reached(2);
    t.domAck(2);
    await t.queue.flush();
    expect(t.enqueued.count).toBe(3);
    expect(t.emits.map((e) => e.path)).toEqual(['/?mode=merch', '/?mode=threads']);
  });

  it('no cold response: nothing navigates and nothing is cleared; stop ignores later taps', async () => {
    const t = rig(null);
    t.deliver(r('first', SONG));
    await t.emitted.reached(1);
    expect(t.clearLast).not.toHaveBeenCalled();
    t.domAck(1);
    await t.queue.flush();
    t.stop();
    t.deliver(r('late', THEORIES));
    expect(t.enqueued.count).toBe(1);
    expect(t.emits).toHaveLength(1);
  });
});
