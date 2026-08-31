import { afterEach, describe, expect, it, vi } from 'vitest';

function get(headers: Record<string, string> = {}): Promise<Response> {
  return import('./route').then(({ GET }) =>
    GET(new Request('http://localhost/api/notifications/dispatch', { headers })),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.doUnmock('@swift2/core/notifications-server');
  vi.resetModules();
});

describe('GET /api/notifications/dispatch', () => {
  it('degrades to 503 when CRON_SECRET is not configured', async () => {
    vi.stubEnv('CRON_SECRET', '');
    const res = await get();
    expect(res.status).toBe(503);
  });

  it('rejects a request with the wrong bearer token as 401', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    const res = await get({ authorization: 'Bearer wrong-secret' });
    expect(res.status).toBe(401);
  });

  it('rejects a request with no authorization header as 401', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    const res = await get();
    expect(res.status).toBe(401);
  });

  it('degrades to 503 when the service-role key is not configured, even with a valid secret', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const res = await get({ authorization: 'Bearer real-secret' });
    expect(res.status).toBe(503);
  });

  it('runs dispatchPendingEvents and returns its result on success', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({}),
    }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      dispatchPendingEvents: vi.fn().mockResolvedValue({ sent: 3, held: 1, errors: [] }),
    }));
    vi.resetModules();

    const { GET } = await import('./route');
    const res = await GET(
      new Request('http://localhost/api/notifications/dispatch', {
        headers: { authorization: 'Bearer real-secret' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ sent: 3, held: 1, errors: [] });
    vi.doUnmock('@supabase/supabase-js');
  });
});
