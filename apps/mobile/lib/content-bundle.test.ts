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
  resetBundleMemoForTests,
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
      return { isNew: true };
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
  resetBundleMemoForTests();
  resetSelfHealForTests();
  vi.unstubAllGlobals();
  fake = fakeUpdates();
  setUpdatesForTests(fake.updates);
});

const withVersion = (bundleVersion: string) => ({ ...clean, manifest: { bundleVersion } });
const pointerFetch = (bundleVersion: string) =>
  vi.fn(async () => ({ ok: true, json: async () => ({ bundleVersion }) }));

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

describe('loadContentBundle in-flight sharing', () => {
  it('shares one load across concurrent callers', async () => {
    let resolve!: (b: typeof clean) => void;
    loadBundle.mockReturnValue(new Promise<typeof clean>((r) => (resolve = r)));
    const calls = [loadContentBundle(), loadContentBundle(), loadContentBundle()];
    resolve(clean);
    const results = await Promise.all(calls);
    expect(loadBundle).toHaveBeenCalledTimes(1);
    expect(results[0]).toBe(clean);
    expect(results[1]).toBe(clean);
    expect(results[2]).toBe(clean);
  });

  it('rejects every waiter on failure, then the next call loads again', async () => {
    const err = new Error('boom');
    let reject!: (e: Error) => void;
    loadBundle.mockReturnValueOnce(new Promise((_, rej) => (reject = rej)));
    const calls = [loadContentBundle(), loadContentBundle()];
    const settled = Promise.allSettled(calls);
    reject(err);
    const results = await settled;
    expect(results.map((r) => r.status)).toEqual(['rejected', 'rejected']);
    expect(loadBundle).toHaveBeenCalledTimes(1);
    loadBundle.mockResolvedValue(clean);
    await expect(loadContentBundle()).resolves.toBe(clean);
    expect(loadBundle).toHaveBeenCalledTimes(2);
  });

  it('serves sequential calls from the memo: one load, no re-read', async () => {
    vi.stubGlobal('fetch', pointerFetch('v1'));
    loadBundle.mockResolvedValue(withVersion('v1'));
    const first = await loadContentBundle();
    const second = await loadContentBundle();
    expect(loadBundle).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('replaces the memo atomically when the version changes', async () => {
    vi.stubGlobal('fetch', pointerFetch('v2'));
    const v1 = withVersion('v1');
    const v2 = withVersion('v2');
    loadBundle.mockResolvedValueOnce(v1).mockResolvedValueOnce(v2);
    vi.stubGlobal('fetch', pointerFetch('v1'));
    await loadContentBundle();
    vi.stubGlobal('fetch', pointerFetch('v2'));
    await expect(loadContentBundle()).resolves.toBe(v2);
    vi.stubGlobal('fetch', pointerFetch('v2'));
    await expect(loadContentBundle()).resolves.toBe(v2);
    expect(loadBundle).toHaveBeenCalledTimes(2);
  });

  it('keeps the previous memo when the newer load fails', async () => {
    const v1 = withVersion('v1');
    loadBundle.mockResolvedValueOnce(v1).mockRejectedValueOnce(new Error('boom'));
    vi.stubGlobal('fetch', pointerFetch('v1'));
    await loadContentBundle();
    vi.stubGlobal('fetch', pointerFetch('v2'));
    await expect(loadContentBundle()).resolves.toBe(v1);
    vi.stubGlobal('fetch', pointerFetch('v1'));
    await expect(loadContentBundle()).resolves.toBe(v1);
    expect(loadBundle).toHaveBeenCalledTimes(2);
  });

  it('serves the memo when the pointer is unreachable', async () => {
    loadBundle.mockResolvedValue(withVersion('v1'));
    vi.stubGlobal('fetch', pointerFetch('v1'));
    const first = await loadContentBundle();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );
    await expect(loadContentBundle()).resolves.toBe(first);
    expect(loadBundle).toHaveBeenCalledTimes(1);
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

  it('does not reload when the fetched update is not new (no reload loop)', async () => {
    fake = fakeUpdates({
      fetchUpdateAsync: vi.fn(async () => ({ isNew: false })),
    });
    setUpdatesForTests(fake.updates);
    await selfHealOnce();
    expect(fake.updates.fetchUpdateAsync).toHaveBeenCalledTimes(1);
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
