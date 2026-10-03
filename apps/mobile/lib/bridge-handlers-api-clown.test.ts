import { describe, expect, it, vi } from 'vitest';
import { CLOWN_TIMEOUT_MS, createHandlers } from './bridge-handlers-api';

type Req = Parameters<ReturnType<typeof createHandlers>['api']>[0]['req'];
const clown = (extra: Partial<Req> = {}) => ({ method: 'POST', path: '/api/clown', body: '{}', ...extra }) as Req;

function setup(res: () => Response, token: string | null = 'tok-1') {
  const fetchMock = vi.fn(async (_url: string, _init: RequestInit) => res());
  const set = vi.fn(async (_t: string) => {});
  const h = createHandlers({
    fetch: fetchMock as unknown as typeof fetch,
    baseUrl: () => 'https://api.test',
    clownSession: { get: async () => token, set },
  });
  const ac = new AbortController();
  return { fetchMock, set, call: (req: Req) => h.api({ req }, { signal: ac.signal }) };
}

describe('api handler: ClownChat (OS-036)', () => {
  it('adds Authorization natively after sanitization, replacing any page-supplied one', async () => {
    const { call, fetchMock } = setup(() => new Response('{}', { status: 200 }));
    await call(clown({ headers: { authorization: 'Bearer evil', 'content-type': 'application/json' } as Req['headers'] }));
    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers).toEqual({ 'content-type': 'application/json', authorization: 'Bearer tok-1' });
  });

  it('sends no Authorization when no session is held, and never for other endpoints', async () => {
    const a = setup(() => new Response('{}', { status: 200 }), null);
    await a.call(clown({ headers: { authorization: 'Bearer evil' } as Req['headers'] }));
    expect((a.fetchMock.mock.calls[0][1] as RequestInit).headers).toEqual({});
    const b = setup(() => new Response('{}', { status: 200 }));
    await b.call({ method: 'POST', path: '/api/mood', body: '{}' } as Req);
    expect((b.fetchMock.mock.calls[0][1] as RequestInit).headers).toEqual({});
  });

  it('persists x-clown-session natively and strips it and set-cookie from the response', async () => {
    const { call, set } = setup(
      () =>
        new Response('{}', {
          status: 200,
          headers: { 'x-clown-session': 'tok-2', 'set-cookie': 'a=b', 'content-type': 'application/json' },
        }),
    );
    const r = await call(clown());
    expect(set).toHaveBeenCalledWith('tok-2');
    expect(r).toMatchObject({ ok: true, value: { headers: { 'content-type': 'application/json' } } });
    const h = r.ok ? r.value.headers : {};
    expect(h).not.toHaveProperty('x-clown-session');
    expect(h).not.toHaveProperty('set-cookie');
  });

  it('uses a 60 s timeout for clown and keeps 8 s elsewhere', async () => {
    vi.useFakeTimers();
    try {
      const hang = () => new Promise<Response>(() => {});
      const mk = () => {
        const f = vi.fn(async () => hang());
        const h = createHandlers({ fetch: f as unknown as typeof fetch, baseUrl: () => 'https://api.test' });
        return (req: Req) => h.api({ req }, { signal: new AbortController().signal });
      };
      const c = mk()(clown());
      await vi.advanceTimersByTimeAsync(8000);
      let settled = false;
      void c.then(() => (settled = true));
      await vi.advanceTimersByTimeAsync(1);
      expect(settled).toBe(false);
      await vi.advanceTimersByTimeAsync(CLOWN_TIMEOUT_MS - 8001);
      expect(await c).toMatchObject({ ok: false, error: { code: 'timeout' } });
      const m = mk()({ method: 'POST', path: '/api/mood', body: '{}' } as Req);
      await vi.advanceTimersByTimeAsync(8000);
      expect(await m).toMatchObject({ ok: false, error: { code: 'timeout' } });
    } finally {
      vi.useRealTimers();
    }
  });
});
