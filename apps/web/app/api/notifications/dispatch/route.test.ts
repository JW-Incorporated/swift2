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
  vi.doUnmock('@supabase/supabase-js');
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

  it('runs the router + digest + clown report passes and returns their results on success', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({}),
    }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      dispatchPendingEvents: vi.fn().mockResolvedValue({ sent: 3, held: 1, errors: [] }),
      dispatchDueDigests: vi.fn().mockResolvedValue({ digestsSent: 2, errors: [] }),
      dispatchClownReports: vi.fn().mockResolvedValue({ clownReportsSent: 1, errors: [] }),
      dispatchFunNotifications: vi
        .fn()
        .mockResolvedValue({ lyricsSent: 1, onThisDaySent: 1, errors: [] }),
      scheduleCountdownsForPendingEvents: vi.fn().mockResolvedValue({ scheduled: 2, errors: [] }),
      dispatchDueCountdowns: vi.fn().mockResolvedValue({ sent: 1, sendFailures: 0, errors: [] }),
      runCooldownPass: vi
        .fn()
        .mockResolvedValue({ devicesDowngraded: 1, noticesSent: 1, errors: [] }),
      readPushFreeze: vi.fn().mockResolvedValue({ state: 'unfrozen' }),
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
    expect(json).toEqual({
      router: { sent: 3, held: 1, errors: [] },
      digests: { digestsSent: 2, errors: [] },
      clownReports: { clownReportsSent: 1, errors: [] },
      fun: { lyricsSent: 1, onThisDaySent: 1, errors: [] },
      countdownSchedule: { scheduled: 2, errors: [] },
      countdownDispatch: { sent: 1, sendFailures: 0, errors: [] },
      cooldown: { devicesDowngraded: 1, noticesSent: 1, errors: [] },
    });
  });

  it('returns frozen=true and skips every sending pass when PUSH_FREEZE is on', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const passes = {
      dispatchPendingEvents: vi.fn(),
      dispatchDueDigests: vi.fn(),
      dispatchClownReports: vi.fn(),
      dispatchFunNotifications: vi.fn(),
      scheduleCountdownsForPendingEvents: vi.fn(),
      dispatchDueCountdowns: vi.fn(),
      runCooldownPass: vi.fn(),
    };
    const readPushFreeze = vi.fn().mockResolvedValue({ state: 'frozen' });
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      ...passes,
      readPushFreeze,
    }));
    vi.resetModules();
    const logSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { GET } = await import('./route');
    const res = await GET(
      new Request('http://localhost/api/notifications/dispatch', {
        headers: { authorization: 'Bearer real-secret' },
      }),
    );

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      frozen: true,
      skippedPasses: [
        'router',
        'digests',
        'clownReports',
        'fun',
        'countdownSchedule',
        'countdownDispatch',
        'cooldown',
      ],
    });
    expect(readPushFreeze).toHaveBeenCalledTimes(1);
    for (const pass of Object.values(passes)) expect(pass).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      'notifications/dispatch: PUSH_FREEZE is on; skipped passes: router, digests, clownReports, fun, countdownSchedule, countdownDispatch, cooldown',
    );
  });

  it('returns 503 and sends nothing when the PUSH_FREEZE row is missing', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const passes = {
      dispatchPendingEvents: vi.fn(),
      dispatchDueDigests: vi.fn(),
      dispatchClownReports: vi.fn(),
      dispatchFunNotifications: vi.fn(),
      scheduleCountdownsForPendingEvents: vi.fn(),
      dispatchDueCountdowns: vi.fn(),
      runCooldownPass: vi.fn(),
    };
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      ...passes,
      readPushFreeze: vi.fn().mockResolvedValue({
        state: 'unreadable',
        reason: 'switch row is missing',
      }),
    }));
    vi.resetModules();

    const { GET } = await import('./route');
    const res = await GET(
      new Request('http://localhost/api/notifications/dispatch', {
        headers: { authorization: 'Bearer real-secret' },
      }),
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({
      error: 'PUSH_FREEZE could not be read: switch row is missing',
    });
    for (const pass of Object.values(passes)) expect(pass).not.toHaveBeenCalled();
  });

  it('returns 503 and sends nothing when PUSH_FREEZE is unreadable', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const passes = {
      dispatchPendingEvents: vi.fn(),
      dispatchDueDigests: vi.fn(),
      dispatchClownReports: vi.fn(),
      dispatchFunNotifications: vi.fn(),
      scheduleCountdownsForPendingEvents: vi.fn(),
      dispatchDueCountdowns: vi.fn(),
      runCooldownPass: vi.fn(),
    };
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      ...passes,
      readPushFreeze: vi.fn().mockResolvedValue({ state: 'unreadable', reason: 'query failed' }),
    }));
    vi.resetModules();

    const { GET } = await import('./route');
    const res = await GET(
      new Request('http://localhost/api/notifications/dispatch', {
        headers: { authorization: 'Bearer real-secret' },
      }),
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'PUSH_FREEZE could not be read: query failed' });
    for (const pass of Object.values(passes)) expect(pass).not.toHaveBeenCalled();
  });
});
