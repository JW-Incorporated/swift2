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
  getForceDomFailure,
  persistAndReread,
  setForceDomFailure,
  strikeClearedOverride,
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

describe('strikeClearedOverride', () => {
  it('is true only at the fallback strike count', () => {
    expect(strikeClearedOverride(null)).toBe(false);
    expect(strikeClearedOverride({ strikes: 1 })).toBe(false);
    expect(strikeClearedOverride({ strikes: 2 })).toBe(true);
  });
});
