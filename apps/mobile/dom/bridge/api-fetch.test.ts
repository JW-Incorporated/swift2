import { describe, expect, it, vi } from 'vitest';
import type { ApiRequest } from '@swift2/content';
import type { BridgeClient } from '@swift2/ui';
import { MAX_API_BYTES, createHandlers } from '../../lib/bridge-handlers-api';
import { createBridgeApiFetch, createBridgeApiStream } from './api-fetch';

const streamed = (text: string, status = 200) => {
  const bytes = new TextEncoder().encode(text);
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(bytes);
      c.close();
    },
  });
  return new Response(body, { status, headers: { 'content-type': 'application/json' } });
};

// The real native handler behind a fake client: exercises DOM shaping + handler policy end to end.
function rig(fetchImpl: (url: string, init: RequestInit) => Promise<Response>, timers: { ms: number[] } = { ms: [] }) {
  const fetchMock = vi.fn(fetchImpl);
  const handlers = createHandlers({
    fetch: fetchMock as unknown as typeof fetch,
    baseUrl: () => 'https://api.test',
    setTimer: (fn, ms) => {
      timers.ms.push(ms);
      return setTimeout(fn, ms);
    },
  });
  const client = {
    call: (type: string, payload: never, opts?: { signal?: AbortSignal }) => {
      const ctx = { signal: opts?.signal ?? new AbortController().signal };
      if (type === 'cancel') return Promise.resolve({ ok: true, value: null });
      return type === 'apiRead' ? handlers.apiRead(payload, ctx) : handlers.api(payload, ctx);
    },
  } as unknown as BridgeClient;
  return { fetchMock, apiFetch: createBridgeApiFetch(client), timers };
};
const post = (path: string, body?: string) => ({ method: 'POST', path, ...(body === undefined ? {} : { body }) }) as ApiRequest;

describe('bridge apiFetch', () => {
  it('an allowlisted call succeeds through a mocked expo/fetch stream', async () => {
    const { apiFetch, fetchMock } = rig(async () => streamed('{"ok":true}'));
    const res = await apiFetch({ ...post('/api/intake', '{}'), headers: { 'Content-Type': 'application/json', 'X-Evil': '1' } });
    expect(res).toMatchObject({ status: 200, body: '{"ok":true}' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/api/intake');
    expect(init.credentials).toBe('omit');
    expect(init.headers).toEqual({ 'content-type': 'application/json' });
  });

  it('refuses a non-allowlisted endpoint without touching the network', async () => {
    const { apiFetch, fetchMock } = rig(async () => streamed('x'));
    await expect(apiFetch({ method: 'POST', path: '/api/devices/register' })).rejects.toThrow('invalid');
    await expect(apiFetch({ method: 'GET', path: '/api/intake' })).rejects.toThrow('invalid');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a request body over the handler 256 KB backstop (the bridge boundary caps requests at 64 KB, see the wiring test)', async () => {
    const { apiFetch, fetchMock } = rig(async () => streamed('x'));
    await expect(apiFetch(post('/api/feedback', 'a'.repeat(MAX_API_BYTES + 1)))).rejects.toThrow('too large');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('applies the per-endpoint timeout: 8 s default, 60 s clown', async () => {
    vi.useFakeTimers();
    try {
      const timers = { ms: [] as number[] };
      const { apiFetch } = rig((_u, init) => new Promise((_r, rej) => init.signal?.addEventListener('abort', () => rej(new Error('aborted')))), timers);
      const intake = apiFetch(post('/api/intake', '{}'));
      const settled = expect(intake).rejects.toThrow('timeout');
      await vi.advanceTimersByTimeAsync(8000);
      await settled;
      const clown = apiFetch(post('/api/clown', '{}'));
      const clownSettled = expect(clown).rejects.toThrow('timeout');
      await vi.advanceTimersByTimeAsync(60_000);
      await clownSettled;
      expect(timers.ms).toEqual([8000, 60_000]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('abort via signal rejects with AbortError and aborts the fetch', async () => {
    const seen: AbortSignal[] = [];
    const { apiFetch } = rig((_u, init) => {
      seen.push(init.signal as AbortSignal);
      return new Promise(() => {});
    });
    const ac = new AbortController();
    const p = apiFetch(post('/api/mood', '{}'), { signal: ac.signal });
    const settled = expect(p).rejects.toMatchObject({ name: 'AbortError' });
    await vi.waitFor(() => expect(seen).toHaveLength(1));
    ac.abort();
    await settled;
    expect(seen[0].aborted).toBe(true);
  });
});

describe('bridge apiStream', () => {
  it('yields the buffered body once and throws the status on non-2xx', async () => {
    const ok = createBridgeApiStream(rig(async () => streamed('hello')).apiFetch);
    const chunks: string[] = [];
    for await (const c of ok(post('/api/clown', '{}'))) chunks.push(c);
    expect(chunks).toEqual(['hello']);
    const bad = createBridgeApiStream(rig(async () => streamed('no', 429)).apiFetch);
    await expect(bad(post('/api/clown', '{}'))[Symbol.asyncIterator]().next()).rejects.toThrow('429');
  });
});
