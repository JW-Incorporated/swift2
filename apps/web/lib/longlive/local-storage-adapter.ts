/**
 * Web's `StorageAdapter` (OS-025) for `@swift2/experience`'s progress
 * module: wraps `window.localStorage` behind the renderer-agnostic
 * get/set contract. SSR-safe (`typeof window === 'undefined'` degrades to a
 * no-op) and private-mode/quota-safe (a throwing `localStorage` call is
 * swallowed by the caller in `progress.ts`, not here — this adapter stays a
 * thin, honest wrapper and lets the pure logic own the "never throw"
 * contract).
 */

import type { StorageAdapter } from '@swift2/experience';

export function createLocalStorageAdapter(): StorageAdapter {
  return {
    getItem(key: string): string | null {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    },
    setItem(key: string, value: string): void {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
    },
  };
}
