import { afterEach, describe, expect, it, vi } from 'vitest';
import { isExpoPushToken, sendPushBatch, type PushSendInput } from './notification-sender';

function input(overrides: Partial<PushSendInput> = {}): PushSendInput {
  return {
    deviceId: 'device-1',
    pushToken: 'ExponentPushToken[abc123]',
    title: 'Title',
    body: 'Body',
    deepLink: 'https://www.longlivets.com/',
    platform: 'android',
    ...overrides,
  };
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('isExpoPushToken', () => {
  it('accepts both Expo token spellings and rejects raw FCM/APNs tokens', () => {
    expect(isExpoPushToken('ExponentPushToken[xxxx]')).toBe(true);
    expect(isExpoPushToken('ExpoPushToken[xxxx]')).toBe(true);
    expect(isExpoPushToken('fcm-raw-registration-token')).toBe(false);
    expect(isExpoPushToken('a'.repeat(64))).toBe(false);
  });
});

describe('sendPushBatch (native via Expo)', () => {
  it('sends ios + android in one Expo request and maps tickets back in order', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        data: [
          { status: 'ok', id: 'ticket-1' },
          {
            status: 'error',
            message: 'not a registered push notification recipient',
            details: { error: 'DeviceNotRegistered' },
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const results = await sendPushBatch([
      input({ deviceId: 'ios-1', platform: 'ios' }),
      input({ deviceId: 'android-1', pushToken: 'ExponentPushToken[dead]' }),
    ]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://exp.host/--/api/v2/push/send');
    const sent = JSON.parse(init.body as string) as Array<Record<string, unknown>>;
    expect(sent).toHaveLength(2);
    expect(sent[0]).toMatchObject({
      to: 'ExponentPushToken[abc123]',
      title: 'Title',
      data: { deepLink: 'https://www.longlivets.com/' },
    });

    expect(results[0]).toMatchObject({ ok: true, deviceId: 'ios-1' });
    // The delivery token in the result is the one embedded in the payload.
    const firstResult = results[0] as { deliveryToken: string };
    expect((sent[0]?.data as { deliveryToken: string }).deliveryToken).toBe(
      firstResult.deliveryToken,
    );
    expect(results[1]).toMatchObject({ ok: false, deviceId: 'android-1', invalidToken: true });
  });

  it('prunes non-Expo tokens locally without calling Expo', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const results = await sendPushBatch([input({ pushToken: 'raw-fcm-token' })]);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(results[0]).toMatchObject({ ok: false, invalidToken: true });
  });

  it('does not mark tokens invalid on non-DeviceNotRegistered ticket errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(200, {
          data: [{ status: 'error', message: 'rate', details: { error: 'MessageRateExceeded' } }],
        }),
      ),
    );

    const results = await sendPushBatch([input()]);

    expect(results[0]).toMatchObject({ ok: false, invalidToken: false });
  });

  it('retries a 5xx and succeeds', async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(503, { errors: [{ code: 'INTERNAL' }] }))
        .mockResolvedValueOnce(jsonResponse(200, { data: [{ status: 'ok', id: 't' }] }));
      vi.stubGlobal('fetch', fetchMock);

      const pending = sendPushBatch([input()]);
      await vi.runAllTimersAsync();
      const results = await pending;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(results[0]).toMatchObject({ ok: true });
    } finally {
      vi.useRealTimers();
    }
  });

  it('splits more than 100 native sends into multiple requests', async () => {
    const fetchMock = vi.fn().mockImplementation(async (_url: string, init: RequestInit) => {
      const count = (JSON.parse(init.body as string) as unknown[]).length;
      return jsonResponse(200, { data: Array.from({ length: count }, () => ({ status: 'ok' })) });
    });
    vi.stubGlobal('fetch', fetchMock);

    const inputs = Array.from({ length: 150 }, (_, i) => input({ deviceId: `d-${i}` }));
    const results = await sendPushBatch(inputs);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(150);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(results[149]).toMatchObject({ deviceId: 'd-149' });
  });

  it('sends the EXPO_ACCESS_TOKEN as a bearer header when set', async () => {
    vi.stubEnv('EXPO_ACCESS_TOKEN', 'expo-secret');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { data: [{ status: 'ok' }] }));
    vi.stubGlobal('fetch', fetchMock);

    await sendPushBatch([input()]);

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer expo-secret');
  });
});
