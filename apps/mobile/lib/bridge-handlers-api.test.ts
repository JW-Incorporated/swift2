import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { ApiFetch, ApiResponse } from '@swift2/content';
import type { HandlerMap, ResResult } from '@swift2/ui';
import { BRIDGE_VERSION, sanitizeApiRequest } from '@swift2/ui';
import { MAX_API_BYTES, createHandlers } from './bridge-handlers-api';
import { body, setup, tick } from './bridge-host.test-kit';

type Req = Parameters<ReturnType<typeof createHandlers>['api']>[0]['req'];
const post = (path: string, extra: Partial<Req> = {}) =>
  ({ method: 'POST', path, ...extra }) as Req;

function harness(fetchImpl?: (url: string, init: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(
    fetchImpl ?? (async () => new Response('{"ok":true}', { status: 200, headers: { 'content-type': 'application/json' } })),
  );
  const h = createHandlers({ fetch: fetchMock as unknown as typeof fetch, baseUrl: () => 'https://api.test' });
  const ac = new AbortController();
  const call = (req: Req) => h.api({ req }, { signal: ac.signal });
  return { fetchMock, call, ac, h };
}

const value = (r: ResResult<ApiResponse>) => (r.ok ? r.value : null);

describe('api handler: allowlist', () => {
  it('accepts GET /api/notifications/inbox (the DOM inbox feed)', async () => {
    const { call, fetchMock } = harness();
    const r = await call({ method: 'GET', path: '/api/notifications/inbox' } as Req);
    expect(value(r)?.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.test/api/notifications/inbox');
  });

  it.each(['/api/intake', '/api/feedback', '/api/mood', '/api/submit-link', '/api/clown'])('accepts POST %s', async (p) => {
    const { call, fetchMock } = harness();
    const r = await call(post(p, { body: '{}' }));
    expect(value(r)?.status).toBe(200);
    expect(fetchMock.mock.calls[0][0]).toBe(`https://api.test${p}`);
  });

  it.each([
    ['GET', '/api/intake'],
    ['POST', '/api/devices/register'],
    ['PUT', '/api/devices/x/prefs'],
    ['POST', '/api/feedback?x=1'],
    ['POST', '/api/feedback/'],
    ['POST', '/api/../etc'],
    ['POST', '//evil.test/api/feedback'],
    ['POST', 'https://evil.test/api/feedback'],
  ])('rejects %s %s as invalid without fetching', async (method, path) => {
    const { call, fetchMock } = harness();
    const r = await call({ method, path } as Req);
    expect(r).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects a body over the cap', async () => {
    const { call, fetchMock } = harness();
    const r = await call(post('/api/feedback', { body: 'x'.repeat(MAX_API_BYTES + 1) }));
    expect(r).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('api handler: headers', () => {
  it('forwards only content-type and accept, omits credentials', async () => {
    const { call, fetchMock } = harness();
    await call(
      post('/api/mood', {
        headers: { 'content-type': 'application/json', accept: '*/*', cookie: 'a=b', authorization: 'Bearer x', 'x-evil': '1' } as Req['headers'],
        body: '{}',
      }),
    );
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual({ 'content-type': 'application/json', accept: '*/*' });
    expect(init.credentials).toBe('omit');
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{}');
  });

  it('returns only content-type, retry-after and x-ratelimit-* (never set-cookie)', async () => {
    const { call } = harness(
      async () =>
        new Response('hi', {
          status: 429,
          headers: {
            'content-type': 'text/plain',
            'retry-after': '3',
            'x-ratelimit-remaining': '0',
            'set-cookie': 's=1',
            'x-other': 'no',
            'cache-control': 'no-store',
          },
        }),
    );
    const out = value(await call(post('/api/feedback')));
    expect(out?.status).toBe(429);
    expect(out?.headers).toEqual({ 'content-type': 'text/plain', 'retry-after': '3', 'x-ratelimit-remaining': '0' });
  });
});

describe('api handler: failure modes', () => {
  it('fails an oversized response and maps network errors to status 0', async () => {
    const big = harness(async () => new Response('x'.repeat(MAX_API_BYTES + 1)));
    expect(await big.call(post('/api/feedback'))).toMatchObject({ ok: false, error: { code: 'failed' } });
    const down = harness(async () => {
      throw new TypeError('Network request failed');
    });
    expect(value(await down.call(post('/api/feedback')))).toEqual({ status: 0, headers: {}, body: '' });
  });

  it('counts bytes not chars: multibyte body under 256K chars but over 256 KB is cancelled mid-stream', async () => {
    let cancelled = false;
    let pulls = 0;
    const chunk = new TextEncoder().encode('é'.repeat(16 * 1024)); // 32 KB per chunk
    const stream = new ReadableStream<Uint8Array>({
      pull(c) {
        pulls++;
        c.enqueue(chunk);
      },
      cancel() {
        cancelled = true;
      },
    });
    const { call } = harness(async () => new Response(stream, { status: 200 }));
    expect(await call(post('/api/feedback'))).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThan(20);
  });

  it('rejects on content-length before reading the body', async () => {
    const text = vi.fn();
    const res = new Response('x', { status: 200, headers: { 'content-length': String(MAX_API_BYTES + 1) } });
    res.text = text;
    const { call } = harness(async () => res);
    expect(await call(post('/api/feedback'))).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(text).not.toHaveBeenCalled();
  });

  it('refuses a response with no stream body (no arrayBuffer fallback)', async () => {
    const arrayBuffer = vi.fn();
    const res = { status: 200, headers: new Headers(), body: null, arrayBuffer };
    const { call } = harness(async () => res as unknown as Response);
    expect(await call(post('/api/feedback'))).toMatchObject({ ok: false, error: { code: 'failed' } });
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it('releases the reader lock at EOF', async () => {
    const res = new Response('hi', { status: 200 });
    const reader = res.body!.getReader();
    const releaseLock = vi.spyOn(reader, 'releaseLock');
    const fake = { status: 200, headers: res.headers, body: { getReader: () => reader } };
    const { call } = harness(async () => fake as unknown as Response);
    expect(value(await call(post('/api/feedback')))?.body).toBe('hi');
    expect(releaseLock).toHaveBeenCalledTimes(1);
  });

  it('rejects a request body over 256 KB in bytes (90K three-byte chars)', async () => {
    const { call, fetchMock } = harness();
    const r = await call(post('/api/feedback', { body: '€'.repeat(90 * 1024) }));
    expect(r).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('requests redirect: error; an off-origin redirect becomes a static status-0 result', async () => {
    const { call, fetchMock } = harness(async (_u, init) => {
      expect(init.redirect).toBe('error');
      throw new TypeError('redirect mode is set to error');
    });
    expect(value(await call(post('/api/feedback')))).toEqual({ status: 0, headers: {}, body: '' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('a never-settling body read still times out, aborts and cleans up', async () => {
    vi.useFakeTimers();
    try {
      let cancelled = false;
      const stream = new ReadableStream<Uint8Array>({
        pull: () => new Promise(() => {}),
        cancel() {
          cancelled = true;
        },
      });
      const { call, fetchMock } = harness(async () => new Response(stream, { status: 200 }));
      const p = call(post('/api/feedback'));
      await vi.advanceTimersByTimeAsync(8000);
      expect(await p).toMatchObject({ ok: false, error: { code: 'timeout' } });
      expect((fetchMock.mock.calls[0][1] as RequestInit).signal?.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
      expect(cancelled).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('abort resolves cancelled and aborts the fetch', async () => {
    let seen: AbortSignal | undefined;
    const { call, ac } = harness(
      (_u, init) =>
        new Promise((_res, rej) => {
          seen = init.signal as AbortSignal;
          seen.addEventListener('abort', () => rej(new Error('aborted')));
        }),
    );
    const p = call(post('/api/feedback'));
    await tick();
    ac.abort();
    expect(await p).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(seen?.aborted).toBe(true);
  });

  it('an already-aborted signal never fetches', async () => {
    const { call, ac, fetchMock } = harness();
    ac.abort();
    expect(await call(post('/api/feedback'))).toMatchObject({ ok: false, error: { code: 'cancelled' } });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('times out after 8000 ms by default', async () => {
    vi.useFakeTimers();
    try {
      const { call } = harness(
        (_u, init) =>
          new Promise((_res, rej) => (init.signal as AbortSignal).addEventListener('abort', () => rej(new Error('aborted')))),
      );
      const p = call(post('/api/feedback'));
      await vi.advanceTimersByTimeAsync(7999);
      let settled = false;
      void p.then(() => (settled = true));
      await tick();
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(await p).toMatchObject({ ok: false, error: { code: 'timeout' } });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('api handler: through the fake bridge host', () => {
  it('answers exactly one ok res for an allowed call and invalid for a disallowed one', async () => {
    const { h, fetchMock } = harness();
    const t = setup({ api: h.api as HandlerMap['api'] });
    t.makeReady();
    const req = sanitizeApiRequest({ method: 'POST', path: '/api/feedback', headers: { 'content-type': 'application/json' }, body: '{}' });
    t.cmd('1000000000001', 'api', { req });
    await vi.waitFor(() => expect(t.resFor('1000000000001')).toHaveLength(1));
    expect(t.resFor('1000000000001')).toHaveLength(1);
    expect(body(t.resFor('1000000000001')[0])).toMatchObject({ ok: true, value: { status: 200 } });
    t.cmd('1000000000002', 'api', { req: { method: 'POST', path: '/api/devices/register' } });
    await tick();
    expect(body(t.resFor('1000000000002')[0])).toMatchObject({ ok: false, error: { code: 'invalid' } });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(BRIDGE_VERSION).toBeGreaterThan(0);
  });

  it('a host cancel aborts the in-flight native fetch', async () => {
    const { h } = harness(
      (_u, init) =>
        new Promise((_res, rej) => (init.signal as AbortSignal).addEventListener('abort', () => rej(new Error('aborted')))),
    );
    const t = setup({ api: h.api as HandlerMap['api'] });
    t.makeReady();
    t.cmd('1000000000001', 'api', { req: { method: 'POST', path: '/api/feedback' } });
    await tick();
    t.cmd('1000000000002', 'cancel', { targetId: '1000000000001' });
    await tick();
    expect(body(t.resFor('1000000000001')[0])).toMatchObject({ ok: false, error: { code: 'cancelled' } });
  });
});

describe('ApiFetch adapter typing', () => {
  it('a bridge-backed adapter satisfies ApiFetch including the signal option', () => {
    const adapter = (async (_req, _opts) => ({ status: 0, headers: {}, body: '' })) satisfies ApiFetch;
    expectTypeOf(adapter).toBeFunction();
  });
});
