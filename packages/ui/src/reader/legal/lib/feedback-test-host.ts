import type { HostAdapter } from '../../../host/types';

export function fakeHost(local = new Map<string, string>()) {
  const store = {
    get: (k: string) => local.get(k) ?? null,
    set: (k: string, v: string) => void local.set(k, v),
    remove: (k: string) => void local.delete(k),
  };
  return { storage: { local: store, session: store } } as unknown as HostAdapter;
}
