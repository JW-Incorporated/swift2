/**
 * `content-bundle.ts` unit tests (docs/decisions.md 2026-10-01): the shared
 * forward-compatible loader options and the once-per-process OTA self-heal.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadBundle = vi.hoisted(() => vi.fn());

vi.mock('@swift2/content', () => ({
  loadBundle: (...args: unknown[]) => loadBundle(...args),
}));
vi.mock('./vault-storage', () => ({
  contentBaseUrl: () => 'https://fixture.invalid/content',
  expoFileSystemStorageAdapter: () => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }),
}));

import {
  loadContentBundle,
  resetSelfHealForTests,
  selfHealOnce,
  setUpdatesForTests,
  type UpdatesLike,
} from './content-bundle';

const clean = { manifest: {}, files: {}, source: 'network', stale: false };

function fakeUpdates(overrides: Partial<UpdatesLike> = {}) {
  const calls: string[] = [];
  const updates: UpdatesLike = {
    isEnabled: true,
    checkForUpdateAsync: vi.fn(async () => {
      calls.push('check');
      return { isAvailable: true };
    }),
    fetchUpdateAsync: vi.fn(async () => {
      calls.push('fetch');
      return {};
    }),
    reloadAsync: vi.fn(async () => {
      calls.push('reload');
    }),
    ...overrides,
  };
  return { updates, calls };
}

let fake: ReturnType<typeof fakeUpdates>;

beforeEach(() => {
  loadBundle.mockReset();
  resetSelfHealForTests();
  fake = fakeUpdates();
  setUpdatesForTests(fake.updates);
});

/** Lets the fire-and-forget self-heal chain settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('loadContentBundle', () => {
  it('passes the base URL, storage, and both forward-compat options', async () => {
    loadBundle.mockResolvedValue(clean);
    await loadContentBundle();
    const opts = loadBundle.mock.calls[0]![0] as Record<string, unknown>;
    expect(opts.baseUrl).toBe('https://fixture.invalid/content');
    expect(opts.storage).toMatchObject({ getItem: expect.any(Function) });
    expect(opts.unknownEnumPolicy).toBe('drop');
    expect(opts.dataErrorFallback).toBe('last-good');
  });

  it('does not self-heal on a clean load', async () => {
    loadBundle.mockResolvedValue(clean);
    await loadContentBundle();
    await settle();
    expect(fake.updates.checkForUpdateAsync).not.toHaveBeenCalled();
  });

  it('does not self-heal when skipped is empty', async () => {
    loadBundle.mockResolvedValue({ ...clean, skipped: [] });
    await loadContentBundle();
    await settle();
    expect(fake.updates.checkForUpdateAsync).not.toHaveBeenCalled();
  });

  it('self-heals on a dataError and still returns the bundle', async () => {
    const bundle = { ...clean, source: 'last-good-after-data-error', dataError: new Error('x') };
    loadBundle.mockResolvedValue(bundle);
    await expect(loadContentBundle()).resolves.toBe(bundle);
    await settle();
    expect(fake.calls).toEqual(['check', 'fetch', 'reload']);
  });

  it('self-heals on a non-empty skipped list', async () => {
    loadBundle.mockResolvedValue({ ...clean, skipped: ['content:new-era'] });
    await loadContentBundle();
    await settle();
    expect(fake.calls).toEqual(['check', 'fetch', 'reload']);
  });

  it('self-heals then rethrows when loadBundle throws', async () => {
    const err = new Error('boom');
    loadBundle.mockRejectedValue(err);
    await expect(loadContentBundle()).rejects.toBe(err);
    await settle();
    expect(fake.calls).toEqual(['check', 'fetch', 'reload']);
  });
});

describe('selfHealOnce', () => {
  it('runs check, fetch, reload in order', async () => {
    await selfHealOnce();
    expect(fake.calls).toEqual(['check', 'fetch', 'reload']);
  });

  it('runs at most once per process across calls', async () => {
    await selfHealOnce();
    await selfHealOnce();
    await Promise.all([selfHealOnce(), selfHealOnce()]);
    expect(fake.updates.checkForUpdateAsync).toHaveBeenCalledTimes(1);
  });

  it('does nothing when Updates is disabled', async () => {
    fake = fakeUpdates({ isEnabled: false });
    setUpdatesForTests(fake.updates);
    await selfHealOnce();
    expect(fake.calls).toEqual([]);
  });

  it('does not fetch or reload when no update is available', async () => {
    fake = fakeUpdates({
      checkForUpdateAsync: vi.fn(async () => ({ isAvailable: false })),
    });
    setUpdatesForTests(fake.updates);
    await selfHealOnce();
    expect(fake.updates.fetchUpdateAsync).not.toHaveBeenCalled();
    expect(fake.updates.reloadAsync).not.toHaveBeenCalled();
  });

  it('swallows a throwing checkForUpdateAsync', async () => {
    fake = fakeUpdates({
      checkForUpdateAsync: vi.fn(async () => {
        throw new Error('offline');
      }),
    });
    setUpdatesForTests(fake.updates);
    await expect(selfHealOnce()).resolves.toBeUndefined();
    expect(fake.updates.fetchUpdateAsync).not.toHaveBeenCalled();
  });
});
