import { afterEach, describe, expect, it, vi } from 'vitest';

function get(secret?: string): Promise<Response> {
  const url = secret
    ? `http://localhost/api/notifications/metrics?secret=${encodeURIComponent(secret)}`
    : 'http://localhost/api/notifications/metrics';
  return import('./route').then(({ GET }) => GET(new Request(url)));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.doUnmock('@swift2/core/notifications-server');
  vi.resetModules();
});

describe('authorizedForDashboard', () => {
  it('rejects when no secret is configured', async () => {
    vi.stubEnv('NOTIFICATIONS_DASHBOARD_SECRET', '');
    const { authorizedForDashboard } = await import('./route');
    expect(authorizedForDashboard('anything')).toBe(false);
  });

  it('rejects a wrong secret', async () => {
    vi.stubEnv('NOTIFICATIONS_DASHBOARD_SECRET', 'real-secret');
    const { authorizedForDashboard } = await import('./route');
    expect(authorizedForDashboard('wrong')).toBe(false);
  });

  it('accepts the exact configured secret', async () => {
    vi.stubEnv('NOTIFICATIONS_DASHBOARD_SECRET', 'real-secret');
    const { authorizedForDashboard } = await import('./route');
    expect(authorizedForDashboard('real-secret')).toBe(true);
  });
});

describe('GET /api/notifications/metrics', () => {
  it('degrades to 503 when the dashboard secret is not configured', async () => {
    vi.stubEnv('NOTIFICATIONS_DASHBOARD_SECRET', '');
    const res = await get('anything');
    expect(res.status).toBe(503);
  });

  it('rejects a wrong secret with 401', async () => {
    vi.stubEnv('NOTIFICATIONS_DASHBOARD_SECRET', 'real-secret');
    const res = await get('wrong-secret');
    expect(res.status).toBe(401);
  });

  it('rejects a missing secret with 401 when the dashboard IS configured', async () => {
    vi.stubEnv('NOTIFICATIONS_DASHBOARD_SECRET', 'real-secret');
    const res = await get();
    expect(res.status).toBe(401);
  });

  it('degrades to 503 when the service-role key is not configured, even with a valid secret', async () => {
    vi.stubEnv('NOTIFICATIONS_DASHBOARD_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const res = await get('real-secret');
    expect(res.status).toBe(503);
  });

  it('returns loadMetrics output on success', async () => {
    vi.stubEnv('NOTIFICATIONS_DASHBOARD_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({}),
    }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      loadMetrics: vi.fn().mockResolvedValue({ totalDevices: 5, hasData: true }),
    }));
    vi.resetModules();

    const { GET } = await import('./route');
    const res = await GET(
      new Request('http://localhost/api/notifications/metrics?secret=real-secret'),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ totalDevices: 5, hasData: true });
    vi.doUnmock('@supabase/supabase-js');
  });
});
