import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBridgeClient } from './client';
import type { Envelope } from './envelope';
import { BRIDGE_VERSION } from './version';

let posted: Envelope[];
let n: number;
const mk = () =>
  createBridgeClient({ post: (e) => void posted.push(e), now: () => 1, idGen: () => `id${++n}` });
const evt = (seq: number, type: string, payload: unknown): Envelope =>
  ({ v: 1, id: `e${seq}`, kind: 'evt', type, payload, ts: 1, seq }) as Envelope;
const res = (id: string, payload: unknown): Envelope =>
  ({ v: 1, id, kind: 'res', type: 'x', payload, ts: 1 }) as Envelope;
const acks = () => posted.filter((e) => e.type === 'ack').map((e) => (e.payload as { seq: number }).seq);

beforeEach(() => {
  posted = [];
  n = 0;
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('call', () => {
  it('correlates a res by id and resolves exactly once', async () => {
    const c = mk();
    const p = c.call('haptic', { kind: 'light' });
    expect(posted[0]).toMatchObject({ kind: 'cmd', type: 'haptic', id: 'id1', v: BRIDGE_VERSION });
    expect(c.receive(res('id1', { ok: true, value: null }))).toBe(true);
    expect(await p).toEqual({ ok: true, value: null });
    expect(c.receive(res('id1', { ok: true, value: null }))).toBe(false);
  });

  it('ignores a res for an unknown id and a malformed res body fails', async () => {
    const c = mk();
    expect(c.receive(res('nope', { ok: true, value: 1 }))).toBe(false);
    const p = c.call('haptic', { kind: 'light' });
    c.receive(res('id1', { bogus: 1 }));
    expect(await p).toMatchObject({ ok: false, error: { code: 'failed' } });
  });

  it('times out, sends cancel, and drops a late res', async () => {
    const c = mk();
    const p = c.call('haptic', { kind: 'light' }, { timeoutMs: 50 });
    vi.advanceTimersByTime(50);
    expect(await p).toMatchObject({ ok: false, error: { code: 'timeout' } });
    expect(posted.at(-1)).toMatchObject({ type: 'cancel', payload: { targetId: 'id1' } });
    expect(c.receive(res('id1', { ok: true, value: null }))).toBe(false);
  });

  it('uses the 8000 ms default', async () => {
    const c = mk();
    const p = c.call('haptic', { kind: 'light' });
    vi.advanceTimersByTime(7999);
    c.receive(res('id1', { ok: true, value: null }));
    expect(await p).toMatchObject({ ok: true });
  });

  it('abort posts cancel and resolves cancelled; pre-aborted never posts', async () => {
    const c = mk();
    const ac = new AbortController();
    const p = c.call('haptic', { kind: 'light' }, { signal: ac.signal });
    ac.abort();
    expect(await p).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(posted.map((e) => e.type)).toEqual(['haptic', 'cancel']);
    posted.length = 0;
    const pre = await c.call('haptic', { kind: 'light' }, { signal: ac.signal });
    expect(pre).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(posted).toEqual([]);
  });

  it('returns failed (no throw) when the transport throws', async () => {
    const c = createBridgeClient({ post: () => { throw new Error('gone'); }, now: () => 1, idGen: () => 'a' });
    expect(await c.call('haptic', { kind: 'light' })).toMatchObject({ ok: false, error: { code: 'failed' } });
  });
});

describe('inbox + events', () => {
  it('dispatches in order, once, and acks the last seq', () => {
    const c = mk();
    const got: unknown[] = [];
    c.on('contentVersion', (p) => got.push(p));
    const inbox = [evt(2, 'contentVersion', { token: 'b' }), evt(1, 'contentVersion', { token: 'a' })];
    c.consumeInbox(inbox);
    c.consumeInbox(inbox);
    expect(got).toEqual([{ token: 'a' }, { token: 'b' }]);
    expect(acks()).toEqual([2, 2]);
  });

  it('ignores an out-of-order older seq and survives a throwing subscriber', () => {
    const c = mk();
    const got: unknown[] = [];
    c.on('insets', () => { throw new Error('boom'); });
    c.on('insets', (p) => got.push(p.top));
    const i = { top: 1, right: 0, bottom: 0, left: 0 };
    c.consumeInbox([evt(5, 'insets', i)]);
    c.consumeInbox([evt(3, 'insets', { ...i, top: 9 })]);
    expect(got).toEqual([1]);
    expect(acks()).toEqual([5, 5]);
  });

  it('drops invalid inbox entries and unsubscribes', () => {
    const c = mk();
    const fn = vi.fn();
    const off = c.on('navigate', fn);
    c.consumeInbox([null, 'x', { kind: 'evt' }]);
    expect(posted).toEqual([]);
    off();
    c.consumeInbox([evt(1, 'navigate', { path: '/a', source: 'deeplink' })]);
    expect(fn).not.toHaveBeenCalled();
  });

  it('answers a back cmd once via the responder, even if redelivered', async () => {
    const c = mk();
    c.handle('back', () => 'handled');
    const back = { v: 1, id: 'b1', kind: 'cmd', type: 'back', payload: {}, ts: 1, seq: 1 };
    c.consumeInbox([back]);
    c.receive(back);
    await vi.advanceTimersByTimeAsync(0);
    const replies = posted.filter((e) => e.kind === 'res');
    expect(replies).toHaveLength(1);
    expect(replies[0]).toMatchObject({ id: 'b1', payload: { ok: true, value: 'handled' } });
  });

  it('answers back with unsupported when no responder, failed when it throws', async () => {
    const c = mk();
    c.receive({ v: 1, id: 'b1', kind: 'cmd', type: 'back', payload: {}, ts: 1 });
    c.receive({ v: 1, id: 'b2', kind: 'cmd', type: 'mystery', payload: {}, ts: 1 });
    c.handle('back', () => { throw new Error('x'); });
    c.receive({ v: 1, id: 'b3', kind: 'cmd', type: 'back', payload: {}, ts: 1 });
    await vi.advanceTimersByTimeAsync(0);
    const codes = posted.filter((e) => e.kind === 'res').map((e) => (e.payload as { error: { code: string } }).error.code);
    expect(codes).toEqual(['unsupported', 'unsupported', 'failed']);
  });
});

describe('ready + diag', () => {
  it('sendReady posts v and range once', () => {
    const c = mk();
    c.sendReady();
    c.sendReady();
    expect(posted).toHaveLength(1);
    expect(posted[0]).toMatchObject({ kind: 'evt', type: 'ready', payload: { v: BRIDGE_VERSION, range: { min: 1, max: BRIDGE_VERSION } } });
  });

  it('sendDiag omits an undefined detail (strict JSON)', () => {
    const c = mk();
    c.sendDiag('s');
    expect(posted[0]?.payload).toEqual({ stage: 's' });
  });

  it('dispose resolves pending as cancelled', async () => {
    const c = mk();
    const p = c.call('haptic', { kind: 'light' });
    c.dispose();
    expect(await p).toMatchObject({ ok: false, error: { code: 'cancelled' } });
  });
});
