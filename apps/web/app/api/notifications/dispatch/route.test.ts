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
    const summarySpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const res = await get({ authorization: 'Bearer real-secret' });
    expect(res.status).toBe(503);
    expect(summarySpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(summarySpy.mock.calls[0]?.[0] as string)).toMatchObject({
      event: 'notification_dispatch_summary',
      frozen: false,
      routeErrors: 1,
    });
  });

  it('runs enabled passes, leaves cooldown disabled, and logs one aggregate summary', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    vi.doMock('@supabase/supabase-js', () => ({
      createClient: () => ({}),
    }));
    const runCooldownPass = vi.fn();
    vi.doMock('@swift2/core/notifications-server', () => ({
      dispatchPendingEvents: vi.fn().mockResolvedValue({
        eventsConsidered: 4,
        eventsSkippedNotReady: 0,
        eventsSkippedKilled: 0,
        eventsSkippedExpired: 0,
        sent: 3,
        held: 1,
        skippedMasterOff: 0,
        skippedSnoozed: 0,
        skippedCoalesced: 0,
        skippedDailyCap: 0,
        skippedAlreadyDelivered: 0,
        skippedStale: 0,
        skippedHardCeiling: 0,
        sendFailures: 0,
        freezeEngaged: false,
        halted: false,
        errors: ['device-secret title-secret token-secret'],
      }),
      dispatchDueDigests: vi.fn().mockResolvedValue({
        devicesConsidered: 2,
        digestsSent: 2,
        digestsHeldOutsideSendWindow: 0,
        digestsSkippedMasterOff: 0,
        digestsSkippedHardCeiling: 0,
        sendFailures: 0,
        freezeEngaged: false,
        halted: false,
        errors: [],
      }),
      dispatchClownReports: vi.fn().mockResolvedValue({
        devicesConsidered: 1,
        clownReportsSent: 1,
        freezeEngaged: false,
        halted: false,
        errors: [],
      }),
      dispatchFunNotifications: vi
        .fn()
        .mockResolvedValue({
          devicesConsidered: 2,
          lyricsSent: 1,
          onThisDaySent: 1,
          onThisDaySkippedNoEntry: 0,
          skippedHardCeiling: 0,
          sendFailures: 0,
          freezeEngaged: false,
          halted: false,
          errors: [],
        }),
      scheduleCountdownsForPendingEvents: vi.fn().mockResolvedValue({ scheduled: 2, errors: [] }),
      dispatchDueCountdowns: vi
        .fn()
        .mockResolvedValue({
          sent: 1,
          sendFailures: 0,
          skippedHardCeiling: 0,
          freezeEngaged: false,
          halted: false,
          errors: [],
        }),
      runCooldownPass,
      readPushFreeze: vi.fn().mockResolvedValue({ state: 'unfrozen' }),
      writeDispatchHeartbeat: vi.fn().mockResolvedValue({ written: true }),
    }));
    vi.resetModules();
    const summarySpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    const { GET, maxDuration } = await import('./route');
    const res = await GET(
      new Request('http://localhost/api/notifications/dispatch', {
        headers: { authorization: 'Bearer real-secret' },
      }),
    );
    expect(res.status).toBe(200);
    expect(maxDuration).toBe(60);
    const json = await res.json();
    expect(json).toEqual({
      router: expect.objectContaining({ sent: 3, held: 1, errors: [expect.any(String)] }),
      digests: expect.objectContaining({ digestsSent: 2, errors: [] }),
      clownReports: expect.objectContaining({ clownReportsSent: 1, errors: [] }),
      fun: expect.objectContaining({ lyricsSent: 1, onThisDaySent: 1, errors: [] }),
      countdownSchedule: { scheduled: 2, errors: [] },
      countdownDispatch: {
        sent: 1,
        sendFailures: 0,
        skippedHardCeiling: 0,
        freezeEngaged: false,
        halted: false,
        errors: [],
      },
      cooldown: {
        disabled: true,
        devicesConsidered: 0,
        devicesDowngraded: 0,
        noticesSent: 0,
        sendFailures: 0,
        freezeEngaged: false,
        halted: false,
        errors: [],
      },
    });
    expect(runCooldownPass).not.toHaveBeenCalled();
    expect(summarySpy).toHaveBeenCalledTimes(1);
    const summaryLine = summarySpy.mock.calls[0]?.[0] as string;
    const summary = JSON.parse(summaryLine) as Record<string, unknown>;
    expect(summary).toMatchObject({
      event: 'notification_dispatch_summary',
      frozen: false,
      passes: {
        router: { considered: 4, sent: 3, skipped: { quietHours: 1 }, errors: 1 },
        digests: { considered: 2, sent: 2, errors: 0 },
        cooldown: { considered: 0, sent: 0, skipped: { disabled: 1 }, errors: 0 },
      },
    });
    expect(summaryLine).not.toContain('device-secret');
    expect(summaryLine).not.toContain('title-secret');
    expect(summaryLine).not.toContain('token-secret');
  });

  it('writes the heartbeat first and sends nothing when the database is read-only', async () => {
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
    const readPushFreeze = vi.fn();
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      ...passes,
      readPushFreeze,
      writeDispatchHeartbeat: vi
        .fn()
        .mockResolvedValue({ written: false, reason: 'database is read-only' }),
    }));
    vi.resetModules();
    const summarySpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const res = await get({ authorization: 'Bearer real-secret' });

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'Dispatch heartbeat write failed.' });
    expect(readPushFreeze).not.toHaveBeenCalled();
    for (const pass of Object.values(passes)) expect(pass).not.toHaveBeenCalled();
    expect(JSON.parse(summarySpy.mock.calls[0]?.[0] as string)).toMatchObject({ routeErrors: 1 });
  });

  it('stops later passes when the router halts even if PUSH_FREEZE persistence failed', async () => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const laterPasses = {
      dispatchDueDigests: vi.fn(),
      dispatchClownReports: vi.fn(),
      dispatchFunNotifications: vi.fn(),
      scheduleCountdownsForPendingEvents: vi.fn(),
      dispatchDueCountdowns: vi.fn(),
      runCooldownPass: vi.fn(),
    };
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      ...laterPasses,
      dispatchPendingEvents: vi.fn().mockResolvedValue({
        eventsConsidered: 1,
        eventsSkippedNotReady: 0,
        eventsSkippedKilled: 0,
        eventsSkippedExpired: 0,
        sent: 1,
        held: 0,
        skippedMasterOff: 0,
        skippedSnoozed: 0,
        skippedCoalesced: 0,
        skippedDailyCap: 0,
        skippedAlreadyDelivered: 0,
        skippedStale: 0,
        skippedHardCeiling: 0,
        sendFailures: 0,
        freezeEngaged: false,
        halted: true,
        errors: ['delivery log insert failed', 'PUSH_FREEZE engage failed'],
      }),
      readPushFreeze: vi.fn().mockResolvedValue({ state: 'unfrozen' }),
      writeDispatchHeartbeat: vi.fn().mockResolvedValue({ written: true }),
    }));
    vi.resetModules();
    const summarySpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);

    const { GET } = await import('./route');
    const res = await GET(
      new Request('http://localhost/api/notifications/dispatch', {
        headers: { authorization: 'Bearer real-secret' },
      }),
    );

    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({
      halted: true,
      frozen: false,
      router: { freezeEngaged: false, halted: true },
      skippedPasses: [
        'digests',
        'clownReports',
        'fun',
        'countdownSchedule',
        'countdownDispatch',
        'cooldown',
      ],
    });
    for (const pass of Object.values(laterPasses)) expect(pass).not.toHaveBeenCalled();
    expect(summarySpy).toHaveBeenCalledTimes(1);
    expect(JSON.parse(summarySpy.mock.calls[0]?.[0] as string)).toMatchObject({
      frozen: false,
      passes: { router: { considered: 1, sent: 1, errors: 2 } },
    });
  });

  it.each([
    ['fun', ['countdownSchedule', 'countdownDispatch', 'cooldown']],
    ['countdownDispatch', ['cooldown']],
  ] as const)('stops after a halted %s pass', async (haltAt, skippedPasses) => {
    vi.stubEnv('CRON_SECRET', 'real-secret');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');
    const scheduleCountdownsForPendingEvents = vi
      .fn()
      .mockResolvedValue({ scheduled: 0, errors: [] });
    const dispatchDueCountdowns = vi.fn().mockResolvedValue({
      sent: haltAt === 'countdownDispatch' ? 1 : 0,
      sendFailures: 0,
      skippedHardCeiling: 0,
      freezeEngaged: haltAt === 'countdownDispatch',
      halted: haltAt === 'countdownDispatch',
      errors: haltAt === 'countdownDispatch' ? ['countdown log failed'] : [],
    });
    vi.doMock('@supabase/supabase-js', () => ({ createClient: () => ({}) }));
    vi.doMock('@swift2/core/notifications-server', () => ({
      dispatchPendingEvents: vi.fn().mockResolvedValue({
        eventsConsidered: 0,
        sent: 0,
        held: 0,
        skippedMasterOff: 0,
        skippedSnoozed: 0,
        skippedCoalesced: 0,
        skippedDailyCap: 0,
        skippedAlreadyDelivered: 0,
        skippedStale: 0,
        skippedHardCeiling: 0,
        sendFailures: 0,
        freezeEngaged: false,
        halted: false,
        errors: [],
      }),
      dispatchDueDigests: vi.fn().mockResolvedValue({
        devicesConsidered: 0,
        digestsSent: 0,
        digestsHeldOutsideSendWindow: 0,
        digestsSkippedMasterOff: 0,
        digestsSkippedHardCeiling: 0,
        sendFailures: 0,
        freezeEngaged: false,
        halted: false,
        errors: [],
      }),
      dispatchClownReports: vi.fn().mockResolvedValue({
        devicesConsidered: 0,
        clownReportsSent: 0,
        freezeEngaged: false,
        halted: false,
        errors: [],
      }),
      dispatchFunNotifications: vi.fn().mockResolvedValue({
        devicesConsidered: 1,
        lyricsSent: haltAt === 'fun' ? 1 : 0,
        onThisDaySent: 0,
        onThisDaySkippedNoEntry: 0,
        skippedHardCeiling: 0,
        sendFailures: 0,
        freezeEngaged: haltAt === 'fun',
        halted: haltAt === 'fun',
        errors: haltAt === 'fun' ? ['fun log failed'] : [],
      }),
      scheduleCountdownsForPendingEvents,
      dispatchDueCountdowns,
      runCooldownPass: vi.fn(),
      readPushFreeze: vi.fn().mockResolvedValue({ state: 'unfrozen' }),
      writeDispatchHeartbeat: vi.fn().mockResolvedValue({ written: true }),
    }));
    vi.resetModules();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);

    const res = await get({ authorization: 'Bearer real-secret' });

    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ halted: true, frozen: true, skippedPasses });
    if (haltAt === 'fun') {
      expect(scheduleCountdownsForPendingEvents).not.toHaveBeenCalled();
      expect(dispatchDueCountdowns).not.toHaveBeenCalled();
    } else {
      expect(scheduleCountdownsForPendingEvents).toHaveBeenCalledTimes(1);
      expect(dispatchDueCountdowns).toHaveBeenCalledTimes(1);
    }
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
      writeDispatchHeartbeat: vi.fn().mockResolvedValue({ written: true }),
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
      writeDispatchHeartbeat: vi.fn().mockResolvedValue({ written: true }),
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
      writeDispatchHeartbeat: vi.fn().mockResolvedValue({ written: true }),
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
