import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';

function get(headers: Record<string, string> = {}, ip = '10.5.0.1'): Promise<Response> {
  return GET(
    new Request('http://localhost/api/notifications/inbox', {
      headers: { 'x-forwarded-for': ip, ...headers },
    }),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.doUnmock('@supabase/supabase-js');
  vi.resetModules();
});

describe('GET /api/notifications/inbox', () => {
  it('degrades to 503 when the service-role key is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const res = await get();
    expect(res.status).toBe(503);
  });

  it('rate-limits after the per-IP burst window', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const ip = '10.5.0.2';
    for (let i = 0; i < 30; i++) {
      const res = await get({}, ip);
      expect(res.status).toBe(503); // unconfigured env, but past the rate check
    }
    const limited = await get({}, ip);
    expect(limited.status).toBe(429);
  });

  it('returns events from getInboxEvents on success', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({}),
    }));
    vi.doMock('@swift2/core', () => ({
      getInboxEvents: vi.fn().mockResolvedValue([
        {
          id: 'evt-1',
          category: 'easter_egg',
          tier: 3,
          title: 'A theory',
          body: 'body',
          deep_link: 'https://x',
          available_at: '2026-01-01T00:00:00Z',
        },
      ]),
    }));
    vi.resetModules();

    const { GET: freshGet } = await import('./route');
    const res = await freshGet(
      new Request('http://localhost/api/notifications/inbox', {
        headers: { 'x-forwarded-for': '10.5.0.3' },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.events).toHaveLength(1);
    expect(json.events[0].id).toBe('evt-1');
  });
});
