import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST, validateRegistration } from './route';

const DEVICE_A = '11111111-1111-4111-8111-111111111111';
const DEVICE_B = '22222222-2222-4222-8222-222222222222';

function post(body: unknown, ip = '10.0.0.1'): Promise<Response> {
  return POST(
    new Request('http://localhost/api/devices/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: JSON.stringify(body),
    }),
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('validateRegistration', () => {
  it('accepts a well-formed payload', () => {
    const result = validateRegistration({
      deviceId: DEVICE_A,
      platform: 'ios',
      pushToken: 'tok-1',
      tz: 'America/Los_Angeles',
      locale: 'en-US',
      appVersion: '1.0.0',
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.deviceId).toBe(DEVICE_A);
      expect(result.input.platform).toBe('ios');
    }
  });

  it('rejects a non-UUID deviceId', () => {
    const result = validateRegistration({ deviceId: 'not-a-uuid', platform: 'ios' });
    expect(result.ok).toBe(false);
  });

  it('rejects an unknown platform', () => {
    const result = validateRegistration({ deviceId: DEVICE_A, platform: 'windows-phone' });
    expect(result.ok).toBe(false);
  });

  it('rejects a missing platform', () => {
    const result = validateRegistration({ deviceId: DEVICE_A });
    expect(result.ok).toBe(false);
  });
});

describe('POST /api/devices/register', () => {
  it('rejects an invalid body with 400 and never reaches Supabase', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const res = await post({ deviceId: 'nope', platform: 'ios' }, '10.2.0.1');
    expect(res.status).toBe(400);
  });

  it('degrades to 503 when the service-role key is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const res = await post({ deviceId: DEVICE_A, platform: 'ios' }, '10.2.0.2');
    expect(res.status).toBe(503);
  });

  it('rate-limits after the per-IP burst window', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    const ip = '10.2.0.3';
    for (let i = 0; i < 20; i++) {
      const res = await post({ deviceId: DEVICE_A, platform: 'ios' }, ip);
      expect(res.status).toBe(503); // unconfigured env, but past validation
    }
    const limited = await post({ deviceId: DEVICE_A, platform: 'ios' }, ip);
    expect(limited.status).toBe(429);
  });

  it('upserts via the real Supabase client path, calling from()/upsert()/select()/single()', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id: DEVICE_B,
        user_id: null,
        platform: 'android',
        push_token: 'tok-2',
        tz: 'America/New_York',
        locale: 'en-US',
        app_version: '2.0.0',
        master_enabled: true,
        snooze_until: null,
        daily_cap: 3,
        quiet_start: 22,
        quiet_end: 8,
        digest_hour: 9,
        created_at: '2026-01-01T00:00:00Z',
        last_seen_at: '2026-01-01T00:00:00Z',
      },
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const upsertMock = vi.fn().mockReturnValue({ select: selectMock });
    const fromMock = vi.fn().mockReturnValue({ upsert: upsertMock });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ from: fromMock }),
    }));

    // Re-import the route with the mocked client in place.
    vi.resetModules();
    const mod = await import('./route');
    const res = await mod.POST(
      new Request('http://localhost/api/devices/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.2.0.4' },
        body: JSON.stringify({ deviceId: DEVICE_B, platform: 'android', pushToken: 'tok-2' }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
    expect(json.device.id).toBe(DEVICE_B);
    expect(fromMock).toHaveBeenCalledWith('devices');
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: DEVICE_B, platform: 'android', push_token: 'tok-2' }),
      { onConflict: 'id' },
    );
    vi.doUnmock('@supabase/supabase-js');
  });

  it('re-upsert (token refresh) reaches the same upsert-by-id path', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    const singleMock = vi.fn().mockResolvedValue({
      data: {
        id: DEVICE_A,
        user_id: null,
        platform: 'ios',
        push_token: 'tok-refreshed',
        tz: 'America/Los_Angeles',
        locale: null,
        app_version: null,
        master_enabled: true,
        snooze_until: null,
        daily_cap: 3,
        quiet_start: 22,
        quiet_end: 8,
        digest_hour: 9,
        created_at: '2026-01-01T00:00:00Z',
        last_seen_at: '2026-01-02T00:00:00Z',
      },
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ single: singleMock });
    const upsertMock = vi.fn().mockReturnValue({ select: selectMock });
    const fromMock = vi.fn().mockReturnValue({ upsert: upsertMock });

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({ from: fromMock }),
    }));
    vi.resetModules();
    const mod = await import('./route');
    const res = await mod.POST(
      new Request('http://localhost/api/devices/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.2.0.5' },
        body: JSON.stringify({ deviceId: DEVICE_A, platform: 'ios', pushToken: 'tok-refreshed' }),
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.device.id).toBe(DEVICE_A);
    // Upsert conflict target is the id column — same row, new token.
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: DEVICE_A, push_token: 'tok-refreshed' }),
      { onConflict: 'id' },
    );
    vi.doUnmock('@supabase/supabase-js');
  });
});
