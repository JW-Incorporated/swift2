import { describe, expect, it, vi } from 'vitest';
import { createHandlers } from './bridge-handlers-notifications';
import { createNotificationHostDeps, type NotificationPorts } from './notification-host-deps';

const ctx = { signal: new AbortController().signal };
const base = {
  status: vi.fn(),
  request: vi.fn(),
  register: vi.fn(),
  updatePrefs: vi.fn(),
  getPrefs: vi.fn(),
  savePrefs: vi.fn(),
  unregister: vi.fn(),
  registered: vi.fn(),
};
const FAILED = { ok: false, error: { code: 'failed', message: 'notification operation failed' } };

describe('notifications.onboardingOffered / markOnboardingOffered', () => {
  it('reads the flag as a strict boolean', async () => {
    const onboardingOffered = vi.fn().mockResolvedValue(true);
    const h = createHandlers({ ...base, onboardingOffered } as never);
    expect(await h['notifications.onboardingOffered']({}, ctx)).toEqual({ ok: true, value: { offered: true } });
    onboardingOffered.mockResolvedValue('true');
    expect(await h['notifications.onboardingOffered']({}, ctx)).toEqual({ ok: true, value: { offered: false } });
  });

  it('writes the flag and answers null', async () => {
    const markOnboardingOffered = vi.fn().mockResolvedValue(undefined);
    const h = createHandlers({ ...base, markOnboardingOffered } as never);
    expect(await h['notifications.markOnboardingOffered']({}, ctx)).toEqual({ ok: true, value: null });
    expect(markOnboardingOffered).toHaveBeenCalledTimes(1);
  });

  it('a store failure or a missing dep answers a fixed failure', async () => {
    const h = createHandlers({ ...base, onboardingOffered: vi.fn().mockRejectedValue(new Error('secret')), markOnboardingOffered: vi.fn().mockRejectedValue(new Error('secret')) } as never);
    expect(await h['notifications.onboardingOffered']({}, ctx)).toEqual(FAILED);
    expect(await h['notifications.markOnboardingOffered']({}, ctx)).toEqual(FAILED);
    const bare = createHandlers(base as never);
    expect(await bare['notifications.onboardingOffered']({}, ctx)).toEqual(FAILED);
    expect(await bare['notifications.markOnboardingOffered']({}, ctx)).toEqual(FAILED);
  });

  it('createNotificationHostDeps passes the port flag through, and omits it when the port has none', async () => {
    const ports = {
      onboardingOffered: vi.fn().mockResolvedValue(false),
      markOnboardingOffered: vi.fn().mockResolvedValue(undefined),
    } as unknown as NotificationPorts;
    const deps = createNotificationHostDeps(ports);
    expect(await deps.onboardingOffered?.()).toBe(false);
    await deps.markOnboardingOffered?.();
    expect(ports.markOnboardingOffered).toHaveBeenCalledTimes(1);
    const none = createNotificationHostDeps({} as NotificationPorts);
    expect(none.onboardingOffered).toBeUndefined();
    expect(none.markOnboardingOffered).toBeUndefined();
  });
});
