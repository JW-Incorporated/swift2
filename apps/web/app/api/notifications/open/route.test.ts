import { afterEach, describe, expect, it, vi } from 'vitest';

const VALID_TOKEN = '11111111-1111-4111-8111-111111111111';

function post(body: unknown, ip = '10.0.0.1'): Promise<Response> {
  return import('./route').then(({ POST }) =>
    POST(
      new Request('http://localhost/api/notifications/open', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
        body: JSON.stringify(body),
      }),
    ),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.doUnmock('@swift2/core/notifications-server');
  vi.resetModules();
});

describe('POST /api/notifications/open', () => {
  it('rejects a non-UUID deliveryToken with 400', async () => {
    const res = await post({ deliveryToken: 'not-a-uuid' }, '10.3.0.1');
    expect(res.status).toBe(400);
  });

  it('rejects a missing deliveryToken with 400', async () => {
    const res = await post({}, '10.3.0.2');
    expect(res.status).toBe(400);
  });

  it('degrades to a soft 200 (tracked:false) when the service-role key is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const res = await post({ deliveryToken: VALID_TOKEN }, '10.3.0.3');
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, tracked: false });
  });

  it('rate-limits after the per-IP burst window', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const ip = '10.3.0.4';
    for (let i = 0; i < 60; i++) {
      const res = await post({ deliveryToken: VALID_TOKEN }, ip);
      expect(res.status).toBe(200);
    }
    const limited = await post({ deliveryToken: VALID_TOKEN }, ip);
    expect(limited.status).toBe(429);
  });

  it('marks the delivery opened via markDeliveryOpened and reports tracked:true', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({}),
    }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      markDeliveryOpened: vi.fn().mockResolvedValue({ ok: true, alreadyOpened: false }),
    }));
    vi.resetModules();

    const { POST } = await import('./route');
    const res = await POST(
      new Request('http://localhost/api/notifications/open', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.3.0.5' },
        body: JSON.stringify({ deliveryToken: VALID_TOKEN }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, tracked: true });
    vi.doUnmock('@supabase/supabase-js');
  });

  it('a second call for the same token reports tracked:false (already opened) without erroring', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({}),
    }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      markDeliveryOpened: vi.fn().mockResolvedValue({ ok: true, alreadyOpened: true }),
    }));
    vi.resetModules();

    const { POST } = await import('./route');
    const res = await POST(
      new Request('http://localhost/api/notifications/open', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.3.0.6' },
        body: JSON.stringify({ deliveryToken: VALID_TOKEN }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, tracked: false });
    vi.doUnmock('@supabase/supabase-js');
  });

  it('an unknown delivery token degrades to a soft 200 rather than 404', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({}),
    }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      markDeliveryOpened: vi.fn().mockResolvedValue({ ok: false, error: 'not_found' }),
    }));
    vi.resetModules();

    const { POST } = await import('./route');
    const res = await POST(
      new Request('http://localhost/api/notifications/open', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.3.0.7' },
        body: JSON.stringify({ deliveryToken: VALID_TOKEN }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true, tracked: false });
    vi.doUnmock('@supabase/supabase-js');
  });
});
