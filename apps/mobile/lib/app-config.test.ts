import { describe, expect, it, vi } from 'vitest';

vi.mock('./vault-storage', () => ({
  contentBaseUrl: () => 'https://fixture.invalid/content',
  expoFileSystemStorageAdapter: () => ({ getItem: () => null, setItem: () => {} }),
}));

import { ROUTE_FLAG_KEYS, MemoryStorageAdapter } from '@swift2/content';
import { APP_CONFIG_CACHE_KEY, loadAppConfig, routeFlagsFrom } from './app-config';
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

describe('ROUTE_FLAG_KEYS', () => {
  it('equals the keys of DEFAULT_ROUTE_FLAGS', () => {
    expect([...ROUTE_FLAG_KEYS].sort()).toEqual(Object.keys(DEFAULT_ROUTE_FLAGS).sort());
  });

  it('defaults sharedUi off and the shipped config agrees', () => {
    expect(DEFAULT_ROUTE_FLAGS.sharedUi).toBe(false);
    expect(routeFlagsFrom({ routeFlags: { sharedUi: true } }).sharedUi).toBe(true);
    expect(shippedConfig.routeFlags.sharedUi).toBe(false);
  });
});

describe('routeFlagsFrom', () => {
  it('returns defaults for an empty or malformed config', () => {
    expect(routeFlagsFrom({ routeFlags: {} })).toEqual(DEFAULT_ROUTE_FLAGS);
    expect(routeFlagsFrom(null)).toEqual(DEFAULT_ROUTE_FLAGS);
    expect(routeFlagsFrom({ routeFlags: 'x' })).toEqual(DEFAULT_ROUTE_FLAGS);
  });

  it('applies known boolean keys and ignores unknown or non-boolean ones', () => {
    const flags = routeFlagsFrom({
      routeFlags: { song: false, moment: 'no', futureScreen: false },
    });
    expect(flags).toEqual({ ...DEFAULT_ROUTE_FLAGS, song: false });
    expect(flags).not.toHaveProperty('futureScreen');
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
    expect(routeFlagsFrom(config).song).toBe(false);
    expect(JSON.parse(storage.getItem(APP_CONFIG_CACHE_KEY)!)).toEqual({
      routeFlags: { song: false },
    });
  });

  it('falls back to last-good when the network fails', async () => {
    const storage = new MemoryStorageAdapter();
    storage.setItem(APP_CONFIG_CACHE_KEY, JSON.stringify({ routeFlags: { merch: false } }));
    const config = await loadAppConfig({ fetchImpl: failingFetch, storage });
    expect(routeFlagsFrom(config).merch).toBe(false);
  });

  it('falls back to last-good when the fetched config is invalid', async () => {
    const storage = new MemoryStorageAdapter();
    storage.setItem(APP_CONFIG_CACHE_KEY, JSON.stringify({ routeFlags: { merch: false } }));
    const config = await loadAppConfig({
      fetchImpl: okFetch({ routeFlags: { song: 'no' } }),
      storage,
    });
    expect(routeFlagsFrom(config)).toEqual({ ...DEFAULT_ROUTE_FLAGS, merch: false });
  });

  it('returns compiled defaults when there is no network and no cache', async () => {
    const config = await loadAppConfig({
      fetchImpl: failingFetch,
      storage: new MemoryStorageAdapter(),
    });
    expect(routeFlagsFrom(config)).toEqual(DEFAULT_ROUTE_FLAGS);
  });

  it('ignores unknown keys from the network', async () => {
    const config = await loadAppConfig({
      fetchImpl: okFetch({ routeFlags: { inbox: false, brandNew: false } }),
      storage: new MemoryStorageAdapter(),
    });
    expect(routeFlagsFrom(config)).toEqual({ ...DEFAULT_ROUTE_FLAGS, inbox: false });
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
