// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { createAppAdapter } from './app-adapter';

function adapterWith(call: ReturnType<typeof vi.fn>) {
  return createAppAdapter({
    client: { call } as never,
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
    isNativeRoute: () => false,
    navigateDom: vi.fn(),
    getPath: () => '/',
    apiFetch: vi.fn() as never,
    onBack: () => () => {},
  });
}

describe('app adapter notifications -> bridge', () => {
  it('maps each method to its command with only the documented payload', async () => {
    const call = vi.fn().mockResolvedValue({ ok: true, value: null });
    const n = adapterWith(call).notifications!;
    await n.register();
    await n.unregister();
    await n.updatePrefs({ releases: true });
    await n.savePrefs({ settings: { masterEnabled: true } });
    expect(call.mock.calls).toEqual([
      ['notifications.register', {}],
      ['notifications.unregister', {}],
      ['notifications.updatePrefs', { prefs: { releases: true } }],
      ['notifications.savePrefs', { settings: { masterEnabled: true } }],
    ]);
  });

  it('returns the bridge value and throws fixed text on failure', async () => {
    const call = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, value: 'granted' })
      .mockResolvedValueOnce({ ok: false, error: { code: 'failed', message: 'ExponentPushToken[x] leaked' } });
    const n = adapterWith(call).notifications!;
    expect(await n.status()).toBe('granted');
    await expect(n.loadPrefs()).rejects.toThrow(/^notification request failed$/);
  });
});
