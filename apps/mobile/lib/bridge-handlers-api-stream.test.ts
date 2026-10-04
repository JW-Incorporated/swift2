import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_STREAM_POLL_MS, CLOWN_TIMEOUT_MS } from '@swift2/ui';
import { validateCommand } from './bridge-host-validate';
import { fakeBody, session } from './bridge-handlers-api-stream.test-kit';

const flush = () => new Promise<void>((r) => setTimeout(r, 0));
const seqs = new WeakMap<object, Map<string, number>>();
const read = (s: ReturnType<typeof session>, streamId: string) => {
  const m = seqs.get(s) ?? new Map<string, number>();
  seqs.set(s, m);
  const seq = (m.get(streamId) ?? 0) + 1;
  m.set(streamId, seq);
  return s.call('apiRead', { streamId, seq });
};

afterEach(() => vi.useRealTimers());

describe('api stream: pull protocol', () => {
  it('answers at headers, then yields ordered lines across gaps and a split multi-byte char', async () => {
    const b = fakeBody();
    const s = session([() => b.response]);
    const { r, id } = await s.open();
    expect(r).toMatchObject({ ok: true, value: { status: 200, headers: { 'content-type': 'application/x-ndjson' }, streamId: id } });
    expect(r.ok && 'body' in r.value).toBe(false);
    const first = read(s, id);
    await flush();
    b.push('{"n":1}\n');
    expect(await first).toEqual({ ok: true, value: { chunk: '{"n":1}\n', done: false } });
    const euro = new TextEncoder().encode('€');
    const second = read(s, id);
    await flush();
    b.push(euro.subarray(0, 2));
    b.push(new Uint8Array([...euro.subarray(2), ...new TextEncoder().encode('\n')]));
    const got = [await second];
    got.push(await read(s, id));
    expect(got.map((x) => (x.ok ? x.value.chunk : '')).join('')).toBe('€\n');
    const third = read(s, id);
    await flush();
    b.push('{"n":3}\n');
    b.end();
    const parts = [await third];
    if (parts[0].ok && !parts[0].value.done) parts.push(await read(s, id));
    expect(parts.map((x) => (x.ok ? x.value.chunk : '')).join('')).toBe('{"n":3}\n');
    expect(parts.at(-1)).toMatchObject({ ok: true, value: { done: true } });
    expect(await read(s, id)).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });

  it('a long-poll with nothing buffered returns an empty not-done chunk after API_STREAM_POLL_MS', async () => {
    vi.useFakeTimers();
    const b = fakeBody();
    const s = session([() => b.response]);
    const { id } = await s.open();
    let out: unknown;
    void read(s, id).then((r) => (out = r));
    await vi.advanceTimersByTimeAsync(API_STREAM_POLL_MS - 1);
    expect(out).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(out).toEqual({ ok: true, value: { chunk: '', done: false } });
  });

  it('refuses a second stream, a non-clown stream and an unknown or stale streamId; a finished stream frees the slot', async () => {
    const a = fakeBody();
    const s = session([() => a.response, () => fakeBody().response]);
    const { id } = await s.open();
    expect((await s.open()).r).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(s.fetchMock).toHaveBeenCalledTimes(1);
    expect(await s.call('api', { req: { method: 'POST', path: '/api/mood', body: '{}' }, stream: true })).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(await read(s, 's99')).toMatchObject({ ok: false, error: { code: 'invalid' } });
    a.end();
    expect(await read(s, id)).toMatchObject({ ok: true, value: { done: true } });
    expect((await s.open()).r).toMatchObject({ ok: true });
  });

  it('rejects a second concurrent apiRead', async () => {
    const s = session([() => fakeBody().response]);
    const { id } = await s.open();
    void read(s, id);
    await flush();
    expect(await read(s, id)).toMatchObject({ ok: false, error: { code: 'invalid' } });
  });

  it('a non-2xx stream answers the buffered shape (no streamId) and cancels the body', async () => {
    const b = fakeBody(429, { 'retry-after': '3' });
    const s = session([() => b.response]);
    const { r } = await s.open();
    expect(r).toEqual({ ok: true, value: { status: 429, headers: { 'retry-after': '3' }, body: '' } });
    expect(b.cancel).toHaveBeenCalled();
    expect((await s.open()).r).toMatchObject({ ok: true });
  });
});

describe('api stream: caps', () => {
  it('stops calling reader.read() at the 64 KB unread buffer and resumes as apiRead drains', async () => {
    const b = fakeBody();
    for (let i = 0; i < 40; i++) b.push(new Uint8Array(16 * 1024).fill(97));
    const s = session([() => b.response]);
    const { id } = await s.open();
    await flush();
    expect(b.reads).toHaveBeenCalledTimes(4);
    await flush();
    expect(b.reads).toHaveBeenCalledTimes(4);
    const r = await read(s, id);
    expect(r.ok && (r.value.chunk as string).length).toBe(32 * 1024);
    await flush();
    expect(b.reads).toHaveBeenCalledTimes(6);
  });

  it('caps a chunk at 32 KB', async () => {
    const b = fakeBody();
    b.push(new Uint8Array(50 * 1024).fill(98));
    const s = session([() => b.response]);
    const { id } = await s.open();
    await flush();
    const r = await read(s, id);
    expect(r.ok && (r.value.chunk as string).length).toBe(32 * 1024);
  });

  it('fails and cancels the reader once the cumulative 256 KB is exceeded', async () => {
    const b = fakeBody();
    for (let i = 0; i < 12; i++) b.push(new Uint8Array(32 * 1024).fill(99));
    const s = session([() => b.response]);
    const { id } = await s.open();
    let last = await read(s, id);
    for (let i = 0; i < 20 && last.ok; i++) last = await read(s, id);
    expect(last).toMatchObject({ ok: false, error: { code: 'failed', message: 'api response too large' } });
    expect(b.cancel).toHaveBeenCalled();
    expect(s.signals[0].aborted).toBe(true);
    expect((await read(s, id)).ok).toBe(false);
  });
});

describe('api stream: lifecycle', () => {
  it('cancel { targetId: streamId } aborts the fetch and reader, and wakes a pending read', async () => {
    const b = fakeBody();
    const s = session([() => b.response]);
    const { id } = await s.open();
    const pending = read(s, id);
    await flush();
    s.inflight.cancel(id);
    expect(await pending).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(b.cancel).toHaveBeenCalled();
    expect(s.signals[0].aborted).toBe(true);
    expect(await read(s, id)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect((await s.open()).r).toMatchObject({ ok: true });
  });

  it('cancelling an in-flight apiRead command leaves the stream open and retryable', async () => {
    const b = fakeBody();
    const s = session([() => b.response]);
    const { id } = await s.open();
    const first = read(s, id);
    await flush();
    s.inflight.cancel(s.lastId());
    expect(await first).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(b.cancel).not.toHaveBeenCalled();
    b.push('z');
    expect(await s.call('apiRead', { streamId: id, seq: 1 })).toMatchObject({ ok: true, value: { chunk: 'z' } });
  });

  it('abortAll (host shutdown / DOM re-handshake) drops the stream table: a stale streamId is invalid', async () => {
    const b = fakeBody();
    const s = session([() => b.response, () => fakeBody().response]);
    const { id } = await s.open();
    s.inflight.abortAll();
    expect(b.cancel).toHaveBeenCalled();
    expect(await read(s, id)).toMatchObject({ ok: false, error: { code: 'invalid' } });
    const next = await s.open();
    expect(next.r).toMatchObject({ ok: true });
    expect(next.id).not.toBe(id);
  });

  it('CLOWN_TIMEOUT_MS is the total deadline from request start: the next read reports timeout and the slot frees', async () => {
    vi.useFakeTimers();
    const b = fakeBody();
    const s = session([() => b.response, () => fakeBody().response]);
    const { id } = await s.open();
    await vi.advanceTimersByTimeAsync(CLOWN_TIMEOUT_MS - 1);
    expect(b.cancel).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(b.cancel).toHaveBeenCalled();
    expect(s.signals[0].aborted).toBe(true);
    expect((await s.open()).r).toMatchObject({ ok: true });
    expect(await read(s, id)).toMatchObject({ ok: false, error: { code: 'timeout' } });
  });

  it('a mid-stream reader failure surfaces as failed and frees the slot', async () => {
    const b = fakeBody();
    const s = session([() => b.response, () => fakeBody().response]);
    const { id } = await s.open();
    const pending = read(s, id);
    await flush();
    b.fail(new Error('boom'));
    expect(await pending).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect((await s.open()).r).toMatchObject({ ok: true });
  });
});

describe('api stream: validation', () => {
  const req = { method: 'POST', path: '/api/clown', body: '{}' };
  it('api accepts stream: true only, apiRead needs a bridge id', () => {
    expect(validateCommand('api', { req, stream: true })).toMatchObject({ stream: true });
    expect(validateCommand('api', { req })).not.toHaveProperty('stream');
    expect(validateCommand('api', { req, stream: false })).toBeNull();
    expect(validateCommand('api', { req, stream: 'yes' })).toBeNull();
    expect(validateCommand('apiRead', { streamId: 's1', seq: 1 })).toEqual({ streamId: 's1', seq: 1 });
    expect(validateCommand('apiRead', { streamId: 's1' })).toBeNull();
    expect(validateCommand('apiRead', { streamId: 's1', seq: 0 })).toBeNull();
    expect(validateCommand('apiRead', { streamId: 's1', seq: 1.5 })).toBeNull();
    expect(validateCommand('apiRead', { streamId: '../x', seq: 1 })).toBeNull();
    expect(validateCommand('apiRead', {})).toBeNull();
  });
});
