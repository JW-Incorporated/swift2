import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostStorage } from '../../host/types';
import { createLocalStorageAdapter } from './local-storage-adapter';
import { fetchLiveData } from './use-live-data';

describe('createLocalStorageAdapter', () => {
  it('reads and writes through the host storage', () => {
    const map = new Map<string, string>();
    const storage: HostStorage = {
      get: (k) => map.get(k) ?? null,
      set: (k, v) => void map.set(k, v),
      remove: (k) => void map.delete(k),
    };
    const a = createLocalStorageAdapter(storage);
    expect(a.getItem('k')).toBeNull();
    a.setItem('k', 'v');
    expect(a.getItem('k')).toBe('v');
    expect(map.get('k')).toBe('v');
  });
});

describe('fetchLiveData resolveUrl', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps the relative URL by default and resolves through the host when given', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await fetchLiveData('fearless');
    await fetchLiveData('red', (p) => `https://x.test${p}`);
    expect(fetchMock.mock.calls.map((c) => String((c as unknown[])[0]))).toEqual([
      '/vault/live/fearless',
      'https://x.test/vault/live/red',
    ]);
  });
});
