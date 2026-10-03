import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_BATCH, MAX_RETAINED, createBridgeClient, monotonicIds } from './client';
import type { ClientOptions } from './client';
import type { Envelope } from './envelope';

type Timer = { fn: () => void; ms: number; live: boolean };
let posted: Envelope[];
let timers: Timer[];
let fatals: string[];
let signals: Array<[string, number | undefined]>;
let clock: number;
const mk = (o: Partial<ClientOptions> = {}) =>
  createBridgeClient({
    post: (e) => void posted.push(e),
    now: () => clock,
    setTimer: (fn, ms) => {
      const t = { fn, ms, live: true };
      timers.push(t);
      return t;
    },
    clearTimer: (h) => void ((h as Timer).live = false),
    onFatal: (r) => void fatals.push(r),
    onSignal: (k, d) => void signals.push([k, d]),
    ...o,
  });
const fire = (t: Timer) => {
  t.live = false;
  t.fn();
};
const live = () => timers.filter((t) => t.live);
const ack = (hwm: unknown): Envelope => ({ v: 1, id: 'ra', kind: 'evt', type: 'readyAck', payload: { hwm }, ts: 1 }) as Envelope;
const evt = (seq: number): Envelope => ({ v: 1, id: `e${seq}`, kind: 'evt', type: 'contentVersion', payload: { token: 't' }, ts: 1, seq }) as Envelope;
const acks = () => posted.filter((e) => e.type === 'ack').map((e) => (e.payload as { seq: number }).seq);

beforeEach(() => {
  posted = [];
  timers = [];
  fatals = [];
  signals = [];
  clock = 1000;
});

describe('ready retry (Fable 1)', () => {
  it('retries 250,500,1000,2000,4000 ms then fatal at attempt 6, rejecting queued calls', async () => {
    const c = mk({ queueUntilReady: true, post: (e) => { posted.push(e); throw new Error('down'); } });
    const q1 = c.call('haptic', { kind: 'light' });
    const q2 = c.call('haptic', { kind: 'heavy' });
    c.sendReady();
    const delays: number[] = [];
    for (let i = 0; i < 5; i++) {
      const t = live()[0]!;
      delays.push(t.ms);
      fire(t);
    }
    expect(delays).toEqual([250, 500, 1000, 2000, 4000]);
    expect(posted.filter((e) => e.type === 'ready')).toHaveLength(6);
    expect(fatals).toEqual(['ready-failed']);
    expect(live()).toEqual([]);
    for (const r of await Promise.all([q1, q2])) expect(r).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(await c.call('haptic', { kind: 'light' })).toMatchObject({ ok: false, error: { code: 'failed' } });
  });

  it('caps the backoff at 5 s', () => {
    const c = mk({ queueUntilReady: true, post: () => { throw new Error('down'); } });
    c.sendReady();
    const ms: number[] = [];
    while (live().length) {
      const t = live()[0]!;
      ms.push(t.ms);
      fire(t);
    }
    expect(Math.max(...ms)).toBeLessThanOrEqual(5000);
    expect(ms).toHaveLength(5);
  });

  it('stops retrying once ready succeeds and flushes the queue', () => {
    let fail = true;
    const c = mk({ queueUntilReady: true, post: (e) => { if (fail && e.type === 'ready') throw new Error('x'); posted.push(e); } });
    void c.call('haptic', { kind: 'light' });
    c.sendReady();
    fail = false;
    fire(live().find((t) => t.ms === 250)!);
    expect(posted.map((e) => e.type)).toEqual(['ready']);
    c.receive(ack(0));
    expect(posted.map((e) => e.type)).toEqual(['ready', 'haptic']);
    expect(live().map((t) => t.ms)).toEqual([8000]);
    expect(fatals).toEqual([]);
  });
});

describe('missing readyAck (coordinator review)', () => {
  it('a ready with no ack in 2 s is a failed attempt: backoff retry, then fatal + queued calls rejected', async () => {
    const c = mk({ queueUntilReady: true });
    const q = c.call('haptic', { kind: 'light' });
    c.sendReady();
    expect(live().map((t) => t.ms)).toEqual([2000]);
    fire(live()[0]!);
    expect(live().map((t) => t.ms)).toEqual([250]);
    fire(live()[0]!);
    while (live().length) fire(live()[0]!);
    expect(posted.filter((e) => e.type === 'ready')).toHaveLength(6);
    expect(posted.filter((e) => e.type === 'haptic')).toHaveLength(0);
    expect(fatals).toEqual(['ready-failed']);
    expect(await q).toMatchObject({ ok: false, error: { code: 'failed' } });
  });

  it('an invalid readyAck does not open the gate', () => {
    const c = mk({ queueUntilReady: true });
    void c.call('haptic', { kind: 'light' });
    c.sendReady();
    c.receive(ack(-5));
    expect(posted.map((e) => e.type)).toEqual(['ready']);
  });

  it('a valid ack clears the ack timer (no spurious retry)', () => {
    const c = mk({ queueUntilReady: true });
    c.sendReady();
    c.receive(ack(0));
    expect(live()).toEqual([]);
    expect(posted.filter((e) => e.type === 'ready')).toHaveLength(1);
  });
});

describe('readyAck reseed (Fable 2)', () => {
  it('host hwm above the clock: next id is hwm+1', () => {
    const c = mk();
    c.receive(ack(5000));
    void c.call('haptic', { kind: 'light' });
    expect(posted[0]!.id).toBe('5001');
  });

  it('clock above hwm: ids continue from now', () => {
    const c = mk();
    c.receive(ack(10));
    void c.call('haptic', { kind: 'light' });
    expect(Number(posted[0]!.id)).toBeGreaterThanOrEqual(1000);
  });

  it('queued calls take their id after the reseed', () => {
    const c = mk({ queueUntilReady: true });
    void c.call('haptic', { kind: 'light' });
    void c.call('haptic', { kind: 'heavy' });
    void c.call('haptic', { kind: 'light' });
    c.sendReady();
    expect(posted.map((e) => e.type)).toEqual(['ready']);
    c.receive(ack(9000));
    void c.call('haptic', { kind: 'heavy' });
    expect(posted.map((e) => e.type)).toEqual(['ready', 'haptic', 'haptic', 'haptic', 'haptic']);
    expect(posted.slice(1).map((e) => Number(e.id))).toEqual([9001, 9002, 9003, 9004]);
  });

  it.each([[-1], [1.5], ['5'], [null], [Number.MAX_SAFE_INTEGER - 1], [Number.MAX_SAFE_INTEGER]])('ignores garbage hwm %s and signals', (bad) => {
    const c = mk();
    c.receive(ack(bad));
    void c.call('haptic', { kind: 'light' });
    expect(Number(posted[0]!.id)).toBe(1000);
    expect(signals).toEqual([['readyAck-invalid', undefined]]);
  });

  it.each([[NaN], [Infinity]])('non-JSON hwm %s is dropped at the envelope layer, ids untouched', (bad) => {
    const c = mk();
    expect(c.receive(ack(bad))).toBe(false);
    void c.call('haptic', { kind: 'light' });
    expect(Number(posted[0]!.id)).toBe(1000);
  });

  it('id space exhausted is fatal, not a wrapped id', async () => {
    const c = mk({ idGen: monotonicIds(Number.MAX_SAFE_INTEGER - 1) });
    void c.call('haptic', { kind: 'light' });
    expect(posted).toHaveLength(1);
    const r = await c.call('haptic', { kind: 'light' });
    expect(r).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(fatals).toEqual(['id-space-exhausted']);
  });
});

describe('timeout starts at send (Fable 3)', () => {
  it('no timer while queued; one armed on flush', () => {
    const c = mk({ queueUntilReady: true });
    void c.call('haptic', { kind: 'light' });
    expect(live()).toEqual([]);
    c.sendReady();
    expect(live().map((t) => t.ms)).toEqual([2000]);
    c.receive(ack(0));
    expect(live().map((t) => t.ms)).toEqual([8000]);
  });

  it('a queued call is not timed out by a long wait for ready', async () => {
    const c = mk({ queueUntilReady: true });
    const p = c.call('haptic', { kind: 'light' }, { timeoutMs: 100 });
    clock += 60_000;
    c.sendReady();
    c.receive(ack(0));
    const t = live()[0]!;
    expect(t.ms).toBe(100);
    c.receive({ v: 1, id: posted[1]!.id, kind: 'res', type: 'haptic', payload: { ok: true, value: null }, ts: 1 });
    expect(await p).toEqual({ ok: true, value: null });
  });
});

describe('inbox bounds (Fable 4)', () => {
  it('parses only the first 64 per consume and keeps the remainder for the next', () => {
    const c = mk();
    const inbox = Array.from({ length: 100 }, (_, i) => evt(i));
    c.consumeInbox(inbox);
    expect(acks()).toEqual([MAX_BATCH - 1]);
    c.consumeInbox([]);
    expect(acks()).toEqual([MAX_BATCH - 1, 99]);
  });

  it('does not parse beyond the batch (rest stays raw)', () => {
    const c = mk();
    let parsed = 0;
    const inbox = Array.from({ length: 200 }, (_, i) => ({
      ...evt(i),
      get payload() {
        parsed++;
        return { token: 't' };
      },
    }));
    c.consumeInbox(inbox);
    expect(parsed).toBeLessThanOrEqual(MAX_BATCH);
  });

  it('re-delivered whole inbox does not duplicate held entries', () => {
    const c = mk();
    const inbox = Array.from({ length: 70 }, (_, i) => evt(i));
    c.consumeInbox(inbox);
    c.consumeInbox(inbox);
    expect(acks()).toEqual([63, 69]);
  });

  it('skips junk cheaply and still processes valid entries', () => {
    const c = mk();
    c.consumeInbox([null, 4, 'x', { seq: 'a' }, { seq: 1.5 }, evt(0)]);
    expect(acks()).toEqual([0]);
  });

  it('caps retained entries at 1024, dropping the oldest and signalling', () => {
    const c = mk();
    const per = 1024;
    c.consumeInbox(Array.from({ length: per }, (_, i) => evt(i)));
    c.consumeInbox(Array.from({ length: per }, (_, i) => evt(per + i)));
    const dropped = signals.filter(([k]) => k === 'inbox-dropped').reduce((n, [, d]) => n + (d ?? 0), 0);
    expect(dropped).toBeGreaterThan(0);
    expect(MAX_RETAINED).toBe(1024);
  });
});
