import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CLOWN_SESSION_STORAGE_KEY,
  readStoredClownSessionToken,
  writeStoredClownSessionToken,
} from './clown-session-storage';

/** A minimal in-memory localStorage stand-in — `vitest`'s `node` test
 * environment has no `window` at all, so a fake one is stubbed in per test
 * (same pattern this repo already uses for `fetch` — `vi.stubGlobal`). */
function fakeLocalStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() {
      return store.size;
    },
  } as Storage;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readStoredClownSessionToken — no window (server/SSR)', () => {
  it('returns null and never throws', () => {
    expect(readStoredClownSessionToken()).toBeNull();
  });
});

describe('writeStoredClownSessionToken — no window (server/SSR)', () => {
  it('is a silent no-op', () => {
    expect(() => writeStoredClownSessionToken('token-1')).not.toThrow();
  });
});

describe('round-trip persistence — survives a simulated remount', () => {
  beforeEach(() => {
    vi.stubGlobal('window', { localStorage: fakeLocalStorage() });
  });

  it('a written token is readable by a later, independent read (a fresh ClownChat mount)', () => {
    // Nothing is held here across the two calls other than the storage
    // itself — this IS the "component unmounted and remounted" case
    // (HUMAN-ACTIONS.md #15 item 3): a mode switch or a page reload leaves
    // no in-memory ref behind, only whatever localStorage still holds.
    writeStoredClownSessionToken('session-token-abc');
    expect(readStoredClownSessionToken()).toBe('session-token-abc');
  });

  it('the token round-trips through the exact storage key', () => {
    writeStoredClownSessionToken('session-token-xyz');
    expect(window.localStorage.getItem(CLOWN_SESSION_STORAGE_KEY)).toBe('session-token-xyz');
  });

  it('a later write replaces the earlier one for the next mount', () => {
    writeStoredClownSessionToken('token-1');
    writeStoredClownSessionToken('token-2');
    expect(readStoredClownSessionToken()).toBe('token-2');
  });

  it('writing null clears the stored token', () => {
    writeStoredClownSessionToken('token-1');
    writeStoredClownSessionToken(null);
    expect(readStoredClownSessionToken()).toBeNull();
  });

  it('an empty stored string reads back as null, never an empty non-null value', () => {
    window.localStorage.setItem(CLOWN_SESSION_STORAGE_KEY, '');
    expect(readStoredClownSessionToken()).toBeNull();
  });

  it('no token ever written reads back as null', () => {
    expect(readStoredClownSessionToken()).toBeNull();
  });
});

describe('storage failures degrade silently (private mode / quota)', () => {
  it('read never throws when localStorage.getItem itself throws', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => {
          throw new Error('SecurityError: private mode');
        },
      },
    });
    expect(readStoredClownSessionToken()).toBeNull();
  });

  it('write never throws when localStorage.setItem itself throws', () => {
    vi.stubGlobal('window', {
      localStorage: {
        setItem: () => {
          throw new Error('QuotaExceededError');
        },
      },
    });
    expect(() => writeStoredClownSessionToken('token-1')).not.toThrow();
  });
});
