/**
 * `StorageAdapter` (OS-025) for `@swift2/experience`'s progress module, backed
 * by the host's `storage.local` (`useHost().storage.local`). The host owns
 * SSR-safety and private-mode/quota handling; this stays a thin, honest
 * wrapper and lets the pure logic in `progress.ts` own the "never throw"
 * contract.
 */

import type { StorageAdapter } from '@swift2/experience';
import type { HostStorage } from '../../host/types';

export function createLocalStorageAdapter(storage: HostStorage): StorageAdapter {
  return {
    getItem(key: string): string | null {
      return storage.get(key) ?? null;
    },
    setItem(key: string, value: string): void {
      storage.set(key, value);
    },
  };
}
