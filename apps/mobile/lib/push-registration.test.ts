import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  isDevice: true,
  permission: 'granted' as string,
  store: new Map<string, string>(),
  tokenFails: false,
  deviceId: 'dev-1',
}));
const requestPermissionsAsync = vi.hoisted(() => vi.fn());
const getExpoPushTokenAsync = vi.hoisted(() => vi.fn());

vi.mock('react-native', () => ({ Platform: { OS: 'ios' } }));
vi.mock('expo-constants', () => ({ default: { expoConfig: { version: '1.0.0', extra: { eas: { projectId: 'p' } } }, easConfig: {} } }));
vi.mock('expo-device', () => ({
  get isDevice() {
    return state.isDevice;
  },
}));
vi.mock('expo-notifications', () => ({
  getPermissionsAsync: async () => ({ status: state.permission }),
  requestPermissionsAsync,
  getExpoPushTokenAsync,
}));
vi.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => state.store.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => void state.store.set(k, v),
  deleteItemAsync: async (k: string) => void state.store.delete(k),
}));
vi.mock('./device-id', () => ({ getOrCreateDeviceId: async () => state.deviceId }));
vi.mock('./notification-channels', () => ({ registerNotificationChannels: async () => undefined }));
vi.mock('./api-base', () => ({ apiBaseUrl: () => 'https://api.test' }));

import { REGISTER_SEQ_KEY, UNREGISTERED_KEY, clearRegisteredToken, flushPendingOptOut, isExplicitlyUnregistered, isOptOutPending, registerDevice, requestPushRegistration } from './push-registration';

const bodies: { pushToken: string | null; seq?: number }[] = [];

beforeEach(() => {
  state.isDevice = true;
  state.permission = 'granted';
  state.store.clear();
  state.deviceId = 'dev-1';
  bodies.length = 0;
  requestPermissionsAsync.mockReset();
  getExpoPushTokenAsync.mockReset().mockResolvedValue({ data: 'tok' });
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_u: string, init: { body: string }) => (bodies.push(JSON.parse(init.body)), { ok: true, status: 200 })),
  );
});

describe('registerDevice (cold start)', () => {
  it('A) key absent + granted: refreshes the token and never prompts', async () => {
    await registerDevice();
    expect(bodies.at(-1)?.pushToken).toBe('tok');
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('B) explicitly unregistered + granted: upserts null', async () => {
    state.store.set(UNREGISTERED_KEY, '1');
    expect(await isExplicitlyUnregistered()).toBe(true);
    await registerDevice();
    expect(bodies.at(-1)?.pushToken).toBeNull();
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('C) undetermined: upserts null with no prompt', async () => {
    state.permission = 'undetermined';
    await registerDevice();
    expect(bodies.at(-1)?.pushToken).toBeNull();
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('a simulator upserts null', async () => {
    state.isDevice = false;
    await registerDevice();
    expect(bodies.at(-1)?.pushToken).toBeNull();
  });

  it('a token fetch failure falls back to a null upsert (non-fatal)', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    getExpoPushTokenAsync.mockRejectedValue(new Error('no token'));
    await expect(registerDevice()).resolves.toMatchObject({ status: 'registered_no_token' });
    expect(bodies.at(-1)?.pushToken).toBeNull();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('registration race (opt-out vs stalled cold refresh)', () => {
  it('cold refresh stalls, user unregisters, cold resumes: final server state is null', async () => {
    let release!: (v: { data: string }) => void;
    getExpoPushTokenAsync.mockReset().mockReturnValue(new Promise((r) => (release = r)));
    const cold = registerDevice();
    await vi.waitFor(() => expect(getExpoPushTokenAsync).toHaveBeenCalled());
    const off = clearRegisteredToken();
    release({ data: 'live' });
    await Promise.all([cold, off]);
    expect(bodies.map((b) => b.pushToken)).toEqual([null]);
    expect(await isExplicitlyUnregistered()).toBe(true);
  });

  it('register after unregister wins and clears the opt-out', async () => {
    await clearRegisteredToken();
    await requestPushRegistration({ clearOptOut: true });
    expect(bodies.at(-1)?.pushToken).toBe('tok');
    expect(await isExplicitlyUnregistered()).toBe(false);
  });

  it('a stalled explicit register is superseded by a later unregister', async () => {
    let release!: (v: { data: string }) => void;
    getExpoPushTokenAsync.mockReset().mockReturnValue(new Promise((r) => (release = r)));
    const on = requestPushRegistration({ clearOptOut: true });
    await vi.waitFor(() => expect(getExpoPushTokenAsync).toHaveBeenCalled());
    const off = clearRegisteredToken();
    release({ data: 'live' });
    await Promise.all([on, off]);
    expect(bodies.at(-1)?.pushToken).toBeNull();
    expect(await isExplicitlyUnregistered()).toBe(true);
  });
});

describe('clearRegisteredToken', () => {
  it('upserts null without fetching a token or prompting', async () => {
    await clearRegisteredToken();
    expect(bodies.at(-1)?.pushToken).toBeNull();
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('write ordering sequence', () => {
  it('stamps each write with a strictly increasing seq', async () => {
    await registerDevice();
    await clearRegisteredToken();
    await registerDevice();
    expect(bodies.map((b) => b.seq)).toEqual([1, 2, 3]);
  });

  it('continues from the persisted counter after a restart (store survives, memory does not)', async () => {
    await registerDevice();
    await registerDevice();
    vi.resetModules();
    const fresh = await import('./push-registration');
    await fresh.registerDevice();
    expect(bodies.map((b) => b.seq)).toEqual([1, 2, 3]);
  });

  it('is immune to a backward clock', async () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(2_000_000_000_000);
    await registerDevice();
    now.mockReturnValue(1_000_000_000_000);
    await registerDevice();
    now.mockRestore();
    expect(bodies.map((b) => b.seq)).toEqual([1, 2]);
  });

  it('restarts at 1 for a regenerated device id (reinstall / data clear), never stale', async () => {
    await registerDevice();
    await registerDevice();
    state.deviceId = 'dev-2'; // new id, old counter still in the store
    await registerDevice();
    expect(bodies.map((b) => b.seq)).toEqual([1, 2, 1]);
    expect(state.store.get(REGISTER_SEQ_KEY)).toBe('dev-2:1');
  });
});

describe('pending opt-out (server write failed offline)', () => {
  const offline = () =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
  const online = () =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_u: string, init: { body: string }) => (bodies.push(JSON.parse(init.body)), { ok: true, status: 200 })),
    );

  it('offline opt-out keeps the local flag and sets the pending flag', async () => {
    offline();
    await expect(clearRegisteredToken()).rejects.toThrow();
    expect(await isExplicitlyUnregistered()).toBe(true);
    expect(await isOptOutPending()).toBe(true);
  });

  it('next foreground online sends the null-token write once and clears the flag', async () => {
    offline();
    await clearRegisteredToken().catch(() => undefined);
    online();
    await flushPendingOptOut();
    await flushPendingOptOut();
    expect(bodies.map((b) => b.pushToken)).toEqual([null]);
    expect(await isOptOutPending()).toBe(false);
  });

  it('a flush that is still offline keeps the flag for the next try', async () => {
    offline();
    await clearRegisteredToken().catch(() => undefined);
    await flushPendingOptOut();
    expect(await isOptOutPending()).toBe(true);
  });

  it('a later opt-in clears the flag without sending a null token', async () => {
    offline();
    await clearRegisteredToken().catch(() => undefined);
    online();
    await requestPushRegistration({ clearOptOut: true });
    await flushPendingOptOut();
    expect(await isOptOutPending()).toBe(false);
    expect(bodies.map((b) => b.pushToken)).toEqual(['tok']);
  });

  it('a successful opt-out leaves no pending flag', async () => {
    await clearRegisteredToken();
    expect(await isOptOutPending()).toBe(false);
  });
});
