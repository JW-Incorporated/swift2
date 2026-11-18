import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
let failWrites = false;

vi.mock('expo-secure-store', () => ({
  getItemAsync: async (k: string) => store.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => {
    if (failWrites) throw new Error('write failed');
    store.set(k, v);
  },
  deleteItemAsync: async (k: string) => {
    if (failWrites) throw new Error('delete failed');
    store.delete(k);
  },
}));

import {
  FORCE_DOM_FAILURE_KEY,
  USE_TEST_PAGE_KEY,
  clearDiagOverrides,
  getForceDomFailure,
  persistAndReread,
  setForceDomFailure,
} from './diagnostics-override';

beforeEach(() => {
  store.clear();
  failWrites = false;
});

describe('setForceDomFailure', () => {
  it("'off' clears the stored key", async () => {
    await setForceDomFailure('throw');
    expect(store.get(FORCE_DOM_FAILURE_KEY)).toBe('throw');
    await setForceDomFailure('off');
    expect(store.has(FORCE_DOM_FAILURE_KEY)).toBe(false);
  });
});

describe('takeLaunchOverrides (one launch only)', () => {
  const fresh = async () => {
    vi.resetModules();
    return import('./diagnostics-override');
  };

  it('an armed drill applies to the launch that reads it, is wiped from storage, and the next launch is normal', async () => {
    store.set(FORCE_DOM_FAILURE_KEY, 'throw');
    store.set(USE_TEST_PAGE_KEY, 'true');
    const launch1 = await fresh();
    expect(await launch1.takeLaunchOverrides()).toEqual({ failure: 'throw', testPage: true });
    await vi.waitFor(() => expect(store.size).toBe(0));
    expect(await launch1.takeLaunchOverrides()).toEqual({ failure: 'throw', testPage: true });
    const launch2 = await fresh();
    expect(await launch2.takeLaunchOverrides()).toEqual({ failure: 'off', testPage: false });
  });

  it('a drill armed during this launch waits for the next one, then is consumed', async () => {
    const launch1 = await fresh();
    expect(await launch1.takeLaunchOverrides()).toEqual({ failure: 'off', testPage: false });
    await launch1.setForceDomFailure('hang');
    expect(await launch1.takeLaunchOverrides()).toEqual({ failure: 'off', testPage: false });
    expect(await (await fresh()).takeLaunchOverrides()).toEqual({ failure: 'hang', testPage: false });
    await vi.waitFor(() => expect(store.has(FORCE_DOM_FAILURE_KEY)).toBe(false));
  });

  it('clearDiagOverrides removes both keys', async () => {
    store.set(FORCE_DOM_FAILURE_KEY, 'hang');
    store.set(USE_TEST_PAGE_KEY, 'true');
    await clearDiagOverrides();
    expect(store.size).toBe(0);
  });
});

describe('persistAndReread', () => {
  it('returns the stored value and no error on success', async () => {
    const r = await persistAndReread(() => setForceDomFailure('hang'), getForceDomFailure);
    expect(r).toEqual({ value: 'hang', error: null });
  });

  it('reports the failure and the value actually stored when the write rejects', async () => {
    await setForceDomFailure('throw');
    failWrites = true;
    const r = await persistAndReread(() => setForceDomFailure('off'), getForceDomFailure);
    expect(r.value).toBe('throw');
    expect(r.error).toBe('delete failed');
  });
});

