import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ store: new Map<string, string>() }));
const setItem = vi.hoisted(() => vi.fn());
const getExpoPushTokenAsync = vi.hoisted(() => vi.fn());
const getDeviceId = vi.hoisted(() => vi.fn());

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0', extra: { eas: { projectId: 'p' } } }, easConfig: {} } }));
vi.mock('expo-device', () => ({ isDevice: true }));
vi.mock('expo-notifications', () => ({
  getPermissionsAsync: async () => ({ status: 'granted' }),
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync,
}));
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => state.store.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => {
    setItem(k, v);
    state.store.set(k, v);
  },
  deleteItemAsync: async (k: string) => void state.store.delete(k),
}));
vi.mock('./device-id', () => ({ getOrCreateDeviceId: getDeviceId }));
vi.mock('./notification-channels', () => ({ registerNotificationChannels: async () => undefined }));
vi.mock('./api-base', () => ({ apiBaseUrl: () => 'https://api.test' }));

type Api = typeof import('./push-registration');
let api: Api;
const bodies: { pushToken: string | null }[] = [];
let inFlight = 0;
let maxInFlight = 0;
let hangFirstFetch = false;
let fetchLatencyMs = 0;

const deferred = <T>() => {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
};

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  state.store.clear();
  setItem.mockReset();
  bodies.length = 0;
  inFlight = 0;
  maxInFlight = 0;
  hangFirstFetch = false;
  fetchLatencyMs = 0;
  getDeviceId.mockReset().mockResolvedValue('dev-1');
  getExpoPushTokenAsync.mockReset().mockResolvedValue({ data: 'tok' });
  vi.stubGlobal(
    'fetch',
    vi.fn((_u: string, init: { body: string; signal: AbortSignal }) => {
      const body = JSON.parse(init.body);
      const hang = hangFirstFetch && bodies.length === 0;
      bodies.push(body);
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      return new Promise((resolve, reject) => {
        const settle = () => void (inFlight -= 1);
        init.signal.addEventListener('abort', () => (settle(), reject(new Error('aborted'))));
        if (!hang) setTimeout(() => (settle(), resolve({ ok: true, status: 200 })), fetchLatencyMs);
      });
    }),
  );
  api = await import('./push-registration');
});

afterEach(async () => {
  await vi.advanceTimersByTimeAsync(60_000);
  vi.useRealTimers();
});

describe('registration queue owns the network write', () => {
  it('1) a hung register fetch blocks the unregister fetch until it aborts; null POST is last', async () => {
    hangFirstFetch = true;
    const cold = api.registerDevice();
    cold.catch(() => undefined);
    await vi.advanceTimersByTimeAsync(5_000);
    expect(bodies).toHaveLength(1);
    const off = api.clearRegisteredToken();
    await vi.advanceTimersByTimeAsync(4_000);
    expect(bodies).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(2_000);
    await off;
    await expect(cold).rejects.toThrow('aborted');
    expect(bodies.map((b) => b.pushToken)).toEqual(['tok', null]);
    expect(maxInFlight).toBe(1);
  });

  it('2) a hung token fetch times out at 15s, null posts, the late token causes no further fetch', async () => {
    const token = deferred<{ data: string }>();
    getExpoPushTokenAsync.mockReset().mockReturnValue(token.promise);
    const cold = api.registerDevice();
    const coldResult = cold.then(
      () => 'ok',
      (e: Error) => e.message,
    );
    const off = api.clearRegisteredToken();
    await vi.advanceTimersByTimeAsync(16_000);
    await off;
    expect(await coldResult).toMatch(/timed out/);
    token.resolve({ data: 'late' });
    await vi.advanceTimersByTimeAsync(1_000);
    expect(bodies.map((b) => b.pushToken)).toEqual([null]);
    expect(state.store.get(api.UNREGISTERED_KEY)).toBe('1');
  });

  it('3) a timed-out unregister never writes the flag late, so a later register leaves it absent', async () => {
    const id = deferred<string>();
    getDeviceId.mockReset().mockReturnValueOnce(id.promise).mockResolvedValue('dev-1');
    const off = api.clearRegisteredToken();
    const offResult = off.then(
      () => 'ok',
      (e: Error) => e.message,
    );
    const on = api.requestPushRegistration({ clearOptOut: true });
    await vi.advanceTimersByTimeAsync(16_000);
    expect(await offResult).toMatch(/timed out/);
    await on;
    id.resolve('dev-1');
    await vi.advanceTimersByTimeAsync(1_000);
    expect(setItem).not.toHaveBeenCalledWith(api.UNREGISTERED_KEY, expect.anything());
    expect(state.store.has(api.UNREGISTERED_KEY)).toBe(false);
  });

  it('4) at most one fetch is ever in flight across interleavings', async () => {
    fetchLatencyMs = 1_000;
    const ops = [
      api.registerDevice(),
      api.clearRegisteredToken(),
      api.requestPushRegistration({ clearOptOut: true }),
      api.registerDevice(),
      api.clearRegisteredToken(),
    ];
    await vi.advanceTimersByTimeAsync(30_000);
    await Promise.allSettled(ops);
    expect(maxInFlight).toBe(1);
    expect(bodies.length).toBeGreaterThan(0);
  });
});
