import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_BATCH, MAX_PENDING, createBridgeClient } from './client';
import type { ClientOptions } from './client';
import type { Envelope } from './envelope';

let posted: Envelope[];
let n: number;
const mk = (o: Partial<ClientOptions> = {}) =>
  createBridgeClient({ post: (e) => void posted.push(e), now: () => 1, idGen: () => `id${++n}`, ...o });
const evt = (seq: number, type = 'contentVersion', payload: unknown = { token: 't' }): Envelope =>
  ({ v: 1, id: `e${seq}`, kind: 'evt', type, payload, ts: 1, seq }) as Envelope;
const res = (id: string, payload: unknown): Envelope => ({ v: 1, id, kind: 'res', type: 'x', payload, ts: 1 }) as Envelope;
const acks = () => posted.filter((e) => e.type === 'ack').map((e) => (e.payload as { seq: number }).seq);
const rack = (hwm = 0): Envelope => ({ v: 1, id: 'ra', kind: 'evt', type: 'readyAck', payload: { hwm }, ts: 1 }) as Envelope;
const types = () => posted.map((e) => e.type);

beforeEach(() => {
  posted = [];
  n = 0;
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('ready + ordering (1, 2)', () => {
  it('queues calls made before ready and flushes them in order after it', async () => {
    const c = mk({ queueUntilReady: true });
    const a = c.call('haptic', { kind: 'light' });
    const b = c.call('haptic', { kind: 'heavy' });
    expect(posted).toEqual([]);
    c.sendReady();
    expect(types()).toEqual(['ready']);
    c.receive(rack());
    expect(types()).toEqual(['ready', 'haptic', 'haptic']);
    expect(posted.map((e) => e.id)).toEqual(['id1', 'id2', 'id3']);
    c.receive(res('id2', { ok: true, value: null }));
    c.receive(res('id3', { ok: true, value: null }));
    expect(await Promise.all([a, b])).toEqual([{ ok: true, value: null }, { ok: true, value: null }]);
  });

  it('without queueUntilReady calls go out immediately', () => {
    const c = mk();
    void c.call('haptic', { kind: 'light' });
    expect(types()).toEqual(['haptic']);
  });

  it('a sync transport failure on ready leaves it retryable and calls queued', () => {
    let fail = true;
    const c = mk({ queueUntilReady: true, post: (e) => { if (fail) throw new Error('down'); posted.push(e); } });
    void c.call('haptic', { kind: 'light' });
    c.sendReady();
    expect(posted).toEqual([]);
    fail = false;
    c.sendReady();
    expect(types()).toEqual(['ready']);
    c.receive(rack());
    expect(types()).toEqual(['ready', 'haptic']);
    c.sendReady();
    expect(posted).toHaveLength(2);
  });

  it('an async rejection on ready is retryable and holds the queue until it resolves', async () => {
    let reject = true;
    const c = mk({
      queueUntilReady: true,
      post: (e) => { posted.push(e); return reject ? Promise.reject(new Error('x')) : Promise.resolve(); },
    });
    void c.call('haptic', { kind: 'light' });
    c.sendReady();
    await vi.advanceTimersByTimeAsync(0);
    expect(types()).toEqual(['ready']);
    reject = false;
    c.sendReady();
    expect(types()).toEqual(['ready', 'ready']);
    await vi.advanceTimersByTimeAsync(0);
    expect(types()).toEqual(['ready', 'ready']);
    c.receive(rack());
    expect(types()).toEqual(['ready', 'ready', 'haptic']);
  });

  it('a ready handshake resets lastSeq so a re-flushed queue is accepted again', () => {
    const c = mk();
    const got: unknown[] = [];
    c.on('contentVersion', (p) => got.push(p.token));
    c.consumeInbox([evt(3)]);
    c.sendReady();
    c.receive(rack());
    c.consumeInbox([evt(3)]);
    expect(got).toEqual(['t', 't']);
  });
});

describe('monotonic ids (Fable ruling, #4853)', () => {
  const idsOf = () => posted.map((e) => e.id);
  it('default ids are digit strings seeded from the injected clock, +1 per message', () => {
    const c = createBridgeClient({ post: (e) => void posted.push(e), now: () => 1_700_000_000_000 });
    void c.call('haptic', { kind: 'light' });
    void c.call('haptic', { kind: 'light' });
    c.sendDiag('s');
    expect(idsOf()).toEqual(['1700000000000', '1700000000001', '1700000000002']);
    expect(idsOf().every((id) => /^[0-9]{1,64}$/.test(id))).toBe(true);
  });

  it('a recreated client with a later clock never reuses or goes below earlier ids', () => {
    let t = 1000;
    const mkAt = () => createBridgeClient({ post: (e) => void posted.push(e), now: () => t });
    const a = mkAt();
    for (let i = 0; i < 5; i++) void a.call('haptic', { kind: 'light' });
    a.dispose();
    t = 1010;
    const b = mkAt();
    void b.call('haptic', { kind: 'light' });
    const ids = idsOf().map(Number);
    expect(ids.slice(0, 5)).toEqual([1000, 1001, 1002, 1003, 1004]);
    expect(ids[5]).toBe(1010);
    expect(ids.every((id, i) => i === 0 || id > (ids[i - 1] as number))).toBe(true);
  });
});

describe('outbound validation (3)', () => {
  it('drops optional undefined fields before posting', () => {
    const c = mk();
    void c.call('navigate', { path: '/a' as never, replace: undefined });
    expect(posted[0]?.payload).toEqual({ path: '/a' });
    expect(Object.keys(posted[0]?.payload as object)).toEqual(['path']);
  });

  it('rejects functions, NaN and non-plain objects with invalid, posting nothing', async () => {
    const c = mk();
    const bad = [{ kind: () => 1 }, { kind: Number.NaN }, { kind: new Date() }, { kind: 1n }];
    for (const p of bad) {
      expect(await c.call('haptic', p as never)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    }
    expect(posted).toEqual([]);
  });
});

describe('transport failures (2, 13)', () => {
  it('a rejected async post resolves the call failed immediately, not at the timeout', async () => {
    const c = mk({ post: () => Promise.reject(new Error('nope')) });
    expect(await c.call('haptic', { kind: 'light' })).toMatchObject({ ok: false, error: { code: 'failed' } });
  });

  it('feeds a resolved async reply back as the res', async () => {
    const c = mk({ post: (e) => Promise.resolve(res(e.id, { ok: true, value: null })) });
    expect(await c.call('haptic', { kind: 'light' })).toEqual({ ok: true, value: null });
  });
});

describe('inbox bounds (4, 8, 12)', () => {
  it('processes at most MAX_BATCH per consume and acks what it processed', () => {
    const c = mk();
    const got: number[] = [];
    c.on('contentVersion', (p) => got.push(Number(p.token)));
    const all = Array.from({ length: MAX_BATCH + 10 }, (_, i) => evt(i + 1, 'contentVersion', { token: String(i + 1) }));
    c.consumeInbox([...all].reverse());
    expect(got).toHaveLength(MAX_BATCH);
    expect(acks()).toEqual([MAX_BATCH]);
    c.consumeInbox(all);
    expect(got).toHaveLength(MAX_BATCH + 10);
    expect(acks()).toEqual([MAX_BATCH, MAX_BATCH + 10]);
  });

  it('re-acks lastSeq when the inbox only holds already-seen entries', () => {
    const c = mk();
    c.consumeInbox([evt(2)]);
    c.consumeInbox([evt(1), evt(2)]);
    expect(acks()).toEqual([2, 2]);
  });

  it('does not ack for an empty inbox or before anything was consumed', () => {
    const c = mk();
    c.consumeInbox([]);
    c.consumeInbox([null]);
    expect(acks()).toEqual([]);
  });

  it('routes a seq-bearing evt arriving via receive() through dedup + ack', () => {
    const c = mk();
    const got: unknown[] = [];
    c.on('contentVersion', (p) => got.push(p.token));
    expect(c.receive(evt(4))).toBe(true);
    c.receive(evt(4));
    expect(got).toEqual(['t']);
    expect(acks()).toEqual([4, 4]);
  });
});

describe('res value check (10)', () => {
  it('fails an ok res whose value does not fit the command', async () => {
    const c = mk();
    const p = c.call('notifications.status', {});
    c.receive(res('id1', { ok: true, value: 'maybe' }));
    expect(await p).toMatchObject({ ok: false, error: { code: 'failed' } });
    const q = c.call('api', { req: { method: 'GET', path: '/api/x' } });
    c.receive(res('id2', { ok: true, value: { status: '200' } }));
    expect(await q).toMatchObject({ ok: false, error: { code: 'failed' } });
    const r = c.call('haptic', { kind: 'light' });
    c.receive(res('id3', { ok: true, value: 5 }));
    expect(await r).toMatchObject({ ok: false, error: { code: 'failed' } });
  });

  it('accepts well-shaped values and passes error results through', async () => {
    const c = mk();
    const p = c.call('notifications.status', {});
    c.receive(res('id1', { ok: true, value: 'granted' }));
    expect(await p).toEqual({ ok: true, value: 'granted' });
    const q = c.call('api', { req: { method: 'GET', path: '/api/x' } });
    c.receive(res('id2', { ok: true, value: { status: 200, headers: { a: 'b' }, body: '' } }));
    expect(await q).toMatchObject({ ok: true });
    const r = c.call('haptic', { kind: 'light' });
    c.receive(res('id3', { ok: false, error: { code: 'invalid', message: 'm' } }));
    expect(await r).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });
});

describe('pending cap + timer + dispose (6, 11, 14)', () => {
  it('fails fast past MAX_PENDING', async () => {
    const c = mk();
    for (let i = 0; i < MAX_PENDING; i++) void c.call('haptic', { kind: 'light' });
    expect(await c.call('haptic', { kind: 'light' })).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(posted).toHaveLength(MAX_PENDING);
  });

  it('a synchronously-firing injected timer resolves timeout without throwing', async () => {
    const c = mk({ setTimer: (fn) => { fn(); return 1; } });
    expect(await c.call('haptic', { kind: 'light' })).toMatchObject({ ok: false, error: { code: 'timeout' } });
    expect(types()).not.toContain('haptic');
  });

  it('dispose makes the client unusable: later calls fail, inbound is ignored, ready is a no-op', async () => {
    const c = mk();
    const got = vi.fn();
    c.on('contentVersion', got);
    c.dispose();
    expect(await c.call('haptic', { kind: 'light' })).toMatchObject({ ok: false, error: { code: 'failed' } });
    c.consumeInbox([evt(1)]);
    c.sendReady();
    c.sendDiag('s');
    expect(got).not.toHaveBeenCalled();
    expect(posted).toEqual([]);
  });

  it('dispose drops queued calls as cancelled', async () => {
    const c = mk({ queueUntilReady: true });
    const p = c.call('haptic', { kind: 'light' });
    c.dispose();
    expect(await p).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(posted).toEqual([]);
  });
});
