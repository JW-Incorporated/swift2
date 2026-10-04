import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHandlers } from './bridge-handlers-api';
import { createStreamTable } from './bridge-handlers-api-stream';
import { fakeBody, session } from './bridge-handlers-api-stream.test-kit';
import { setup } from './bridge-host.test-kit';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const read = (s: ReturnType<typeof session>, streamId: string) => s.call('apiRead', { streamId });
const text = (r: { ok: boolean; value?: unknown }) => (r.ok ? (r.value as { chunk: string }).chunk : '');

afterEach(() => vi.useRealTimers());

describe('api stream: bounded buffer', () => {
  it('never retains more than 64 KB unread, even when a source chunk overshoots', async () => {
    const b = fakeBody();
    b.push(new Uint8Array(48 * 1024).fill(97));
    b.push(new Uint8Array(50 * 1024).fill(98));
    const s = session([() => b.response]);
    const { id } = await s.open();
    await flush();
    expect(b.reads).toHaveBeenCalledTimes(2);
    await flush();
    expect(b.reads).toHaveBeenCalledTimes(2);
    let total = '';
    for (let i = 0; i < 4; i++) {
      const r = await read(s, id);
      expect(text(r).length).toBeLessThanOrEqual(32 * 1024);
      total += text(r);
    }
    expect(total.length).toBe(98 * 1024);
    expect(total.startsWith('a'.repeat(48 * 1024) + 'b')).toBe(true);
  });
});

describe('api stream: cancel during head handoff', () => {
  it('a cancel of the opening command id, arriving after native opened the stream, closes it and frees the slot', async () => {
    const b = fakeBody();
    const s = session([() => b.response, () => fakeBody().response]);
    expect((await s.open()).r.ok).toBe(true);
    s.inflight.cancel(s.lastId());
    expect(b.cancel).toHaveBeenCalled();
    expect((await s.open()).r).toMatchObject({ ok: true });
  });

  it('the alias ends once the DOM has observed the head (first apiRead)', async () => {
    const b = fakeBody();
    const s = session([() => b.response]);
    const { id } = await s.open();
    const openId = s.lastId();
    void read(s, id);
    await flush();
    s.inflight.cancel(openId);
    expect(b.cancel).not.toHaveBeenCalled();
  });

  it('an abort that lands right after the stream opened (before the DOM sees the head) closes the stream', async () => {
    const b = fakeBody();
    const fetchMock = vi.fn(async () => b.response);
    const h = createHandlers({ fetch: fetchMock as unknown as typeof fetch, baseUrl: () => 'https://api.test' });
    const ac = new AbortController();
    const req = { method: 'POST', path: '/api/clown', body: '{}' } as const;
    const r = await h.api({ req, stream: true }, { signal: ac.signal, own: () => (ac.abort(), () => {}) });
    expect(r.ok && 'streamId' in r.value).toBe(false);
    expect(b.cancel).toHaveBeenCalled();
    fetchMock.mockImplementationOnce(async () => fakeBody().response);
    expect(await h.api({ req, stream: true }, { signal: new AbortController().signal })).toMatchObject({ ok: true, value: { streamId: expect.any(String) } });
  });

  it('T1: cancel(A) then a new stream in the same tick gets a head; exactly one stream is open', async () => {
    const a = fakeBody();
    const s = session([() => a.response, () => fakeBody().response]);
    const { id } = await s.open();
    s.inflight.cancel(id);
    const next = await s.open();
    expect(next.r).toMatchObject({ ok: true });
    expect(a.cancel).toHaveBeenCalled();
  });
});

describe('api stream: terminal streams are deleted at once', () => {
  const mk = (reader: object) => {
    const table = createStreamTable({ maxBytes: 1 << 20, setTimer: (fn, ms) => setTimeout(fn, ms), clearTimer: (h) => clearTimeout(h as never) });
    const opened = table.open({ reader: reader as never, abort: () => {}, onEnd: () => {} });
    return { table, ...opened };
  };

  it('T3: a pump failure while a read waits fails that read; the next read is invalid and nothing is left', async () => {
    let fail: (e: Error) => void = () => {};
    const reader = { read: () => new Promise((_, rej) => (fail = rej)), cancel: async () => {} };
    const { table, id } = mk(reader);
    const waiting = table.read(id, new AbortController().signal);
    await flush();
    fail(new Error('boom'));
    expect(await waiting).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(await table.read(id, new AbortController().signal)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(table.size()).toBe(0);
  });

  it('T4: expire() makes the in-flight read time out; the next read is invalid and nothing is left', async () => {
    const reader = { read: () => new Promise(() => {}), cancel: async () => {} };
    const { table, id, expire } = mk(reader);
    const waiting = table.read(id, new AbortController().signal);
    await flush();
    expire();
    expect(await waiting).toMatchObject({ ok: false, error: { code: 'timeout' } });
    expect(await table.read(id, new AbortController().signal)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(table.size()).toBe(0);
  });

  it('done and cancel also leave no record', async () => {
    const b = fakeBody();
    const s = session([() => b.response, () => fakeBody().response]);
    const { id } = await s.open();
    b.end();
    expect(await read(s, id)).toMatchObject({ ok: true, value: { done: true } });
    expect(await read(s, id)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect((await s.open()).r).toMatchObject({ ok: true });
  });
});

describe('api stream: per-stream decoder and epoch', () => {
  it('a half-received multi-byte char in one stream never leaks into the next stream', async () => {
    const a = fakeBody();
    const b = fakeBody();
    const s = session([() => a.response, () => b.response]);
    const one = await s.open();
    a.push(new Uint8Array([0xe2, 0x82]));
    a.end();
    await read(s, one.id);
    await read(s, one.id);
    const two = await s.open();
    b.push('ok');
    expect(text(await read(s, two.id))).toBe('ok');
  });

  it('a DOM re-handshake (second ready) aborts the host streams: a stale streamId is invalid', async () => {
    const b = fakeBody();
    const fetchMock = vi.fn(async () => b.response);
    const h = createHandlers({ fetch: fetchMock as unknown as typeof fetch, baseUrl: () => 'https://api.test' });
    const u = setup({ api: h.api, apiRead: h.apiRead } as never);
    u.makeReady();
    u.cmd('1', 'api', { req: { method: 'POST', path: '/api/clown', body: '{}' }, stream: true });
    await flush();
    const head = u.resFor('1')[0].payload as unknown as { value: { streamId: string } };
    const { streamId } = head.value;
    u.makeReady('e-ready-2');
    expect(b.cancel).toHaveBeenCalled();
    u.cmd('2', 'apiRead', { streamId });
    await flush();
    expect(u.resFor('2')[0].payload).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });
});
