import { describe, expect, it } from 'vitest';
import { installStorageShim } from './storage-shim';

const throwing = () => {
  const win: Record<string, unknown> = {};
  for (const name of ['localStorage', 'sessionStorage']) {
    Object.defineProperty(win, name, {
      configurable: true,
      get() {
        throw new DOMException('denied', 'SecurityError');
      },
    });
  }
  return win;
};

describe('installStorageShim', () => {
  it('replaces throwing storage with a working Map-backed store', () => {
    const win = throwing();
    expect(installStorageShim(win)).toEqual(['localStorage', 'sessionStorage']);
    const ls = win.localStorage as Storage;
    expect(ls.getItem('k')).toBeNull();
    ls.setItem('k', 'v');
    expect(ls.getItem('k')).toBe('v');
    expect(ls.length).toBe(1);
    ls.removeItem('k');
    expect(ls.length).toBe(0);
  });

  it('is installed before a module-level read: later reads never throw', () => {
    const win = throwing();
    expect(() => (win.localStorage as Storage).getItem('x')).toThrow();
    installStorageShim(win);
    const moduleLevel = () => (win.localStorage as Storage).getItem('x');
    expect(moduleLevel).not.toThrow();
  });

  it('shims a null storage object too', () => {
    expect(installStorageShim({ localStorage: null, sessionStorage: null })).toEqual([
      'localStorage',
      'sessionStorage',
    ]);
  });

  it('leaves working storage alone', () => {
    const store = { getItem: () => null };
    const win = { localStorage: store, sessionStorage: store };
    expect(installStorageShim(win)).toEqual([]);
    expect(win.localStorage).toBe(store);
  });
});
