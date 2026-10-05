// Launch path vs SecureStore: installing the speed test and registering the device must not touch SecureStore before
// the first paint; after it, each runs once. Speed-test mode on still records the launch; an early
// ensureDeviceRegistered() triggers registration once.
import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => [] as string[]);
const store = vi.hoisted(() => new Map<string, string>());
const registerDevice = vi.hoisted(() => vi.fn());

vi.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => (calls.push(`get:${k}`), store.get(k) ?? null),
  setItemAsync: async (k: string, v: string) => (calls.push(`set:${k}`), void store.set(k, v)),
  deleteItemAsync: async (k: string) => (calls.push(`del:${k}`), void store.delete(k)),
}));
vi.mock('react-native', () => ({ AppState: { addEventListener: vi.fn() } }));
vi.mock('./diagnostics-send', () => ({ sendDiagReport: vi.fn(async () => ({ ok: true })) }));
vi.mock('./push-registration', () => ({ registerDevice }));
vi.mock('./diagnostics-env', () => ({ readDiagEnv: () => ({}) }));

import { installDiagnostics, diagMarkOnce } from './diagnostics';
import { ensureDeviceRegistered, resetEnsureDeviceRegisteredForTests } from './ensure-device-registered';
import { runAfterFirstPaint } from './launch-defer';
import { installSpeedTest, speedTest } from './speed-test-runtime';

const flush = async () => {
  await vi.advanceTimersByTimeAsync(50);
};

beforeEach(() => {
  vi.useFakeTimers();
  calls.length = 0;
  registerDevice.mockReset();
  registerDevice.mockResolvedValue({ status: 'registered_no_token', deviceId: 'd1' });
  resetEnsureDeviceRegisteredForTests();
});

describe('launch path SecureStore calls', () => {
  it('defers speed-test and registration work until first paint, then runs each once', async () => {
    installDiagnostics();
    installSpeedTest();
    runAfterFirstPaint(() => void ensureDeviceRegistered());
    await flush();
    expect(calls).toEqual([]);
    expect(registerDevice).not.toHaveBeenCalled();

    diagMarkOnce('first-era-paint', 'native');
    await flush();
    const speedReads = calls.filter((c) => c.startsWith('get:longlive_diag_speed'));
    expect(speedReads.length).toBeGreaterThan(0);
    expect(new Set(speedReads).size).toBe(speedReads.length);
    expect(registerDevice).toHaveBeenCalledTimes(1);
  });

  it('an early ensureDeviceRegistered() registers once; the deferred launch call joins it', async () => {
    runAfterFirstPaint(() => void ensureDeviceRegistered());
    expect(await ensureDeviceRegistered()).toBe('d1');
    diagMarkOnce('first-era-paint', 'native');
    await flush();
    expect(registerDevice).toHaveBeenCalledTimes(1);
  });

  it('speed-test mode still records the launch', async () => {
    await speedTest.enable(2);
    expect(speedTest.isOn()).toBe(true);
    expect(store.size).toBeGreaterThan(0);
  });
});
