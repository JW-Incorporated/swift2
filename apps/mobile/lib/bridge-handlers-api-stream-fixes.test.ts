import { afterEach, describe, expect, it, vi } from 'vitest';
import { CLOWN_TIMEOUT_MS } from '@swift2/ui';
import { createHandlers } from './bridge-handlers-api';
import { fakeBody, session } from './bridge-handlers-api-stream.test-kit';
import { setup } from './bridge-host.test-kit';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const readAt = (s: ReturnType<typeof session>, streamId: string, seq: number) => s.call('apiRead', { streamId, seq });
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
    for (let seq = 1; seq <= 4; seq++) {
      const r = await readAt(s, id, seq);
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
    const first = await s.open();
    expect(first.r.ok).toBe(true);
    s.inflight.cancel(s.lastId());
    expect(b.cancel).toHaveBeenCalled();
    expect((await s.open()).r).toMatchObject({ ok: true });
  });

  it('the alias ends once the DOM has observed the head (first apiRead)', async () => {
    const b = fakeBody();
    const s = session([() => b.response]);
    const { id } = await s.open();
    const openId = s.lastId();
    void readAt(s, id, 1);
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
    const next = fakeBody();
    fetchMock.mockImplementationOnce(async () => next.response);
    expect(await h.api({ req, stream: true }, { signal: new AbortController().signal })).toMatchObject({ ok: true, value: { streamId: expect.any(String) } });
  });
});

describe('api stream: terminal records are removed', () => {
  it('deadline, error, done and cancel leave no record: the slot is free and every reader was cancelled', async () => {
    vi.useFakeTimers();
    const bodies = Array.from({ length: 12 }, () => fakeBody());
    const s = session(bodies.map((b) => () => b.response));
    for (let i = 0; i < 12; i++) {
      const { id } = await s.open();
      if (i % 3 === 0) await vi.advanceTimersByTimeAsync(CLOWN_TIMEOUT_MS);
      else if (i % 3 === 1) s.inflight.cancel(id);
      else {
        bodies[i].end();
        await readAt(s, id, 1);
      }
      expect(bodies[i].cancel).toHaveBeenCalled();
    }
    expect((await s.open()).r).toMatchObject({ ok: true });
  });

  it('an abandoned timed-out stream reports timeout once, then is gone', async () => {
    vi.useFakeTimers();
    const b = fakeBody();
    const s = session([() => b.response]);
    const { id } = await s.open();
    await vi.advanceTimersByTimeAsync(CLOWN_TIMEOUT_MS);
    expect(await readAt(s, id, 1)).toMatchObject({ ok: false, error: { code: 'timeout' } });
    expect(await readAt(s, id, 2)).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });
});

describe('api stream: retry-safe apiRead', () => {
  it('a lost result followed by the same seq replays it: no bytes skipped, none duplicated', async () => {
    const b = fakeBody();
    const s = session([() => b.response]);
    const { id } = await s.open();
    b.push('AAA');
    const lost = await readAt(s, id, 1);
    expect(text(lost)).toBe('AAA');
    expect(await readAt(s, id, 1)).toEqual(lost);
    b.push('BBB');
    expect(text(await readAt(s, id, 2))).toBe('BBB');
    expect(text(await readAt(s, id, 2))).toBe('BBB');
    expect(await readAt(s, id, 7)).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });

  it('replays the final done answer too', async () => {
    const b = fakeBody();
    const s = session([() => b.response]);
    const { id } = await s.open();
    b.end();
    const done = await readAt(s, id, 1);
    expect(done).toMatchObject({ ok: true, value: { done: true } });
    expect(await readAt(s, id, 1)).toEqual(done);
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
    await readAt(s, one.id, 1);
    await readAt(s, one.id, 2);
    const two = await s.open();
    b.push('ok');
    expect(text(await readAt(s, two.id, 1))).toBe('ok');
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
    u.cmd('2', 'apiRead', { streamId, seq: 1 });
    await flush();
    expect(u.resFor('2')[0].payload).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });
});
