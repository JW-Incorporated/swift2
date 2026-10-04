import { describe, expect, it, vi } from 'vitest';

vi.mock('./vault-storage', () => ({
  contentBaseUrl: () => 'https://fixture.invalid/content',
  expoFileSystemStorageAdapter: () => ({ getItem: () => null, setItem: () => {} }),
}));

import { MemoryStorageAdapter } from '@swift2/content';
import { APP_CONFIG_CACHE_KEY, loadAppConfig, loadLaunchFlags } from './app-config';
import { DEFAULT_ROUTE_FLAGS } from './routes';
import shippedConfig from '../../../config/mobile/app-config.json';

function okFetch(body: unknown): typeof fetch {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => body,
  })) as unknown as typeof fetch;
}
const failingFetch = vi.fn(async () => {
  throw new Error('offline');
}) as unknown as typeof fetch;

describe('shipped config', () => {
  it('defaults sharedUi on and the shipped config agrees', () => {
    expect(DEFAULT_ROUTE_FLAGS).toEqual({ sharedUi: true });
    expect(shippedConfig.routeFlags.sharedUi).toBe(true);
    expect(shippedConfig.watchdogReports).toBe(false);
  });
});

describe('loadLaunchFlags (WP2.14)', () => {
  it('reads only the last-good cache: cached sharedUi and watchdogReports', async () => {
    const storage = new MemoryStorageAdapter();
    storage.setItem(
      APP_CONFIG_CACHE_KEY,
      JSON.stringify({ routeFlags: { sharedUi: true }, watchdogReports: false }),
    );
    await expect(loadLaunchFlags({ storage })).resolves.toEqual({ sharedUi: true, watchdogReports: false });
  });

  it('is null for both with no cache, an invalid cache, or no key', async () => {
    const none = { sharedUi: null, watchdogReports: null };
    await expect(loadLaunchFlags({ storage: new MemoryStorageAdapter() })).resolves.toEqual(none);
    const bad = new MemoryStorageAdapter();
    bad.setItem(APP_CONFIG_CACHE_KEY, '{nope');
    await expect(loadLaunchFlags({ storage: bad })).resolves.toEqual(none);
    const noKey = new MemoryStorageAdapter();
    noKey.setItem(APP_CONFIG_CACHE_KEY, JSON.stringify({ routeFlags: { song: false } }));
    await expect(loadLaunchFlags({ storage: noKey })).resolves.toEqual(none);
  });

  it('never throws when storage blows up, and never touches the network', async () => {
    const broken = { getItem: () => { throw new Error('disk'); }, setItem: () => {} };
    await expect(loadLaunchFlags({ storage: broken })).resolves.toEqual({ sharedUi: null, watchdogReports: null });
  });

  it('the network result is cached for the NEXT launch, not returned to this one', async () => {
    const storage = new MemoryStorageAdapter();
    const before = await loadLaunchFlags({ storage });
    await loadAppConfig({
      fetchImpl: okFetch({ routeFlags: { sharedUi: true } }),
      storage,
      baseUrl: 'https://x.invalid/content',
    });
    expect(before.sharedUi).toBeNull();
    expect((await loadLaunchFlags({ storage })).sharedUi).toBe(true);
  });
});

describe('loadAppConfig', () => {
  it('uses the network config and stores it as last-good', async () => {
    const storage = new MemoryStorageAdapter();
    const config = await loadAppConfig({
      fetchImpl: okFetch({ routeFlags: { song: false } }),
      storage,
      baseUrl: 'https://x.invalid/content',
    });
    expect(config.routeFlags.song).toBe(false);
    expect(JSON.parse(storage.getItem(APP_CONFIG_CACHE_KEY)!)).toEqual({
      routeFlags: { song: false },
    });
  });

  it('falls back to last-good when the network fails', async () => {
    const storage = new MemoryStorageAdapter();
    storage.setItem(APP_CONFIG_CACHE_KEY, JSON.stringify({ routeFlags: { merch: false } }));
    const config = await loadAppConfig({ fetchImpl: failingFetch, storage });
    expect(config.routeFlags.merch).toBe(false);
  });

  it('falls back to last-good when the fetched config is invalid', async () => {
    const storage = new MemoryStorageAdapter();
    storage.setItem(APP_CONFIG_CACHE_KEY, JSON.stringify({ routeFlags: { merch: false } }));
    const config = await loadAppConfig({
      fetchImpl: okFetch({ routeFlags: { song: 'no' } }),
      storage,
    });
    expect(config.routeFlags).toEqual({ merch: false });
  });

  it('returns compiled defaults when there is no network and no cache', async () => {
    const config = await loadAppConfig({
      fetchImpl: failingFetch,
      storage: new MemoryStorageAdapter(),
    });
    expect(config).toEqual({ routeFlags: {} });
  });

  it('ignores unknown keys from the network', async () => {
    const config = await loadAppConfig({
      fetchImpl: okFetch({ routeFlags: { inbox: false, brandNew: false } }),
      storage: new MemoryStorageAdapter(),
    });
    expect(config.routeFlags).toEqual({ inbox: false });
  });

  it('never throws, even when storage and fetch both blow up', async () => {
    const brokenStorage = {
      getItem: () => {
        throw new Error('disk');
      },
      setItem: () => {
        throw new Error('disk');
      },
    };
    await expect(
      loadAppConfig({ fetchImpl: failingFetch, storage: brokenStorage }),
    ).resolves.toEqual({
      routeFlags: {},
    });
    await expect(
      loadAppConfig({ fetchImpl: okFetch({ routeFlags: {} }), storage: brokenStorage }),
    ).resolves.toEqual({ routeFlags: {} });
  });
});
