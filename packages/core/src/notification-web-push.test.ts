import { afterEach, describe, expect, it, vi } from 'vitest';

// vi.mock must be declared before importing the module under test.
const sendNotificationMock = vi.fn();
const setVapidDetailsMock = vi.fn();
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: (...args: unknown[]) => setVapidDetailsMock(...args),
    sendNotification: (...args: unknown[]) => sendNotificationMock(...args),
  },
}));

const VALID_SUB = JSON.stringify({
  endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
  keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  sendNotificationMock.mockReset();
  setVapidDetailsMock.mockReset();
});

describe('sendWebPushBatch', () => {
  it('fails closed with a clear reason when VAPID is not configured', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', '');
    vi.stubEnv('VAPID_PRIVATE_KEY', '');
    vi.stubEnv('VAPID_SUBJECT', '');
    vi.resetModules();
    const { sendWebPushBatch } = await import('./notification-web-push');

    const results = await sendWebPushBatch([
      {
        deviceId: 'device-1',
        subscriptionJson: VALID_SUB,
        title: 'Title',
        body: 'Body',
        deepLink: 'https://www.longlivets.com/',
        deliveryToken: 'token-1',
      },
    ]);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ ok: false, invalidToken: false });
    expect((results[0] as { error: string }).error).toMatch(/VAPID_PUBLIC_KEY/);
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  it('sends successfully with a configured VAPID keypair and embeds the delivery token', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-key');
    vi.stubEnv('VAPID_SUBJECT', 'mailto:ops@longlivets.com');
    sendNotificationMock.mockResolvedValue({ statusCode: 201 });
    vi.resetModules();
    const { sendWebPushBatch } = await import('./notification-web-push');

    const results = await sendWebPushBatch([
      {
        deviceId: 'device-1',
        subscriptionJson: VALID_SUB,
        title: 'Title',
        body: 'Body',
        deepLink: 'https://www.longlivets.com/',
        deliveryToken: 'token-1',
      },
    ]);

    expect(results).toEqual([{ ok: true, deviceId: 'device-1' }]);
    expect(setVapidDetailsMock).toHaveBeenCalledWith(
      'mailto:ops@longlivets.com',
      'pub-key',
      'priv-key',
    );
    const [, payload] = sendNotificationMock.mock.calls[0] as [unknown, string];
    expect(JSON.parse(payload)).toMatchObject({ deliveryToken: 'token-1', title: 'Title' });
  });

  it('marks a 404/410 push-service response as an invalid, prunable token', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-key');
    vi.stubEnv('VAPID_SUBJECT', 'mailto:ops@longlivets.com');
    sendNotificationMock.mockRejectedValue({ statusCode: 410, body: 'gone' });
    vi.resetModules();
    const { sendWebPushBatch } = await import('./notification-web-push');

    const results = await sendWebPushBatch([
      {
        deviceId: 'device-1',
        subscriptionJson: VALID_SUB,
        title: 'Title',
        body: 'Body',
        deepLink: 'https://www.longlivets.com/',
        deliveryToken: 'token-1',
      },
    ]);

    expect(results[0]).toMatchObject({ ok: false, invalidToken: true });
  });

  it('marks a malformed stored subscription as an invalid token without calling web-push', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-key');
    vi.stubEnv('VAPID_SUBJECT', 'mailto:ops@longlivets.com');
    vi.resetModules();
    const { sendWebPushBatch } = await import('./notification-web-push');

    const results = await sendWebPushBatch([
      {
        deviceId: 'device-1',
        subscriptionJson: 'not-json',
        title: 'Title',
        body: 'Body',
        deepLink: 'https://www.longlivets.com/',
        deliveryToken: 'token-1',
      },
    ]);

    expect(results[0]).toMatchObject({ ok: false, invalidToken: true });
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  it('a transient 5xx error is reported as non-invalid (retryable by the caller)', async () => {
    vi.stubEnv('VAPID_PUBLIC_KEY', 'pub-key');
    vi.stubEnv('VAPID_PRIVATE_KEY', 'priv-key');
    vi.stubEnv('VAPID_SUBJECT', 'mailto:ops@longlivets.com');
    sendNotificationMock.mockRejectedValue({ statusCode: 503, body: 'unavailable' });
    vi.resetModules();
    const { sendWebPushBatch } = await import('./notification-web-push');

    const results = await sendWebPushBatch([
      {
        deviceId: 'device-1',
        subscriptionJson: VALID_SUB,
        title: 'Title',
        body: 'Body',
        deepLink: 'https://www.longlivets.com/',
        deliveryToken: 'token-1',
      },
    ]);

    expect(results[0]).toMatchObject({ ok: false, invalidToken: false });
  });

  it('returns [] for an empty batch without touching VAPID config', async () => {
    vi.resetModules();
    const { sendWebPushBatch } = await import('./notification-web-push');
    expect(await sendWebPushBatch([])).toEqual([]);
  });
});
