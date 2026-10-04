import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  isDevice: true,
  permission: 'granted' as string,
  store: new Map<string, string>(),
  tokenFails: false,
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
vi.mock('./device-id', () => ({ getOrCreateDeviceId: async () => 'dev-1' }));
vi.mock('./notification-channels', () => ({ registerNotificationChannels: async () => undefined }));
vi.mock('./api-base', () => ({ apiBaseUrl: () => 'https://api.test' }));

import { UNREGISTERED_KEY, clearRegisteredToken, isExplicitlyUnregistered, registerDevice, requestPushRegistration } from './push-registration';

const bodies: { pushToken: string | null }[] = [];

beforeEach(() => {
  state.isDevice = true;
  state.permission = 'granted';
  state.store.clear();
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
