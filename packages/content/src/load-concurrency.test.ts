/**
 * One UI WP0.2 PR B: bundle file bodies download concurrently (capped at 5)
 * while hash -> parse -> validate stay in manifest order.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MemoryStorageAdapter } from './cache';
import { BundleIntegrityError, loadBundle, type FetchLike, type FetchResponseLike } from './load';
import type { Manifest } from './schema';

const bundleDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'bundle');
const manifest: Manifest = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'));
const baseUrl = 'https://content.example.test/content';
const names = Object.keys(manifest.files);
const bodies = Object.fromEntries(
  Object.entries(manifest.files).map(([n, e]) => [n, readFileSync(join(bundleDir, e.path), 'utf8')]),
);
const urlFor = (name: string) => `${baseUrl}/${manifest.bundleVersion}/${manifest.files[name]!.path}`;

const respond = (status: number, body: string): FetchResponseLike => ({
  ok: status >= 200 && status < 300,
  status,
  text: async () => body,
  headers: { get: () => null },
});

/** Serves the fixture; `fileHook` may delay or override a file response. */
function serve(fileHook?: (name: string) => Promise<FetchResponseLike | undefined>): FetchLike {
  return async (url) => {
    if (url === `${baseUrl}/current.json`) {
      return respond(200, JSON.stringify({ bundleVersion: manifest.bundleVersion }));
    }
    if (url === `${baseUrl}/${manifest.bundleVersion}/manifest.json`) {
      return respond(200, JSON.stringify(manifest));
    }
    for (const name of names) {
      if (url === urlFor(name)) {
        return (await fileHook?.(name)) ?? respond(200, bodies[name]!);
      }
    }
    return respond(404, 'not found');
  };
}

const tick = () => new Promise((r) => setTimeout(r, 0));

describe('loadBundle concurrent file fetches', () => {
  it('has more files than the cap, so the cap is observable', () => {
    expect(names.length).toBeGreaterThan(5);
  });

  it('runs 2..5 downloads in flight at once, and results equal a serial load', async () => {
    let inFlight = 0;
    let peak = 0;
    const gates: Array<() => void> = [];
    const concurrent = serve(async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise<void>((resolve) => gates.push(resolve));
      inFlight--;
      return undefined;
    });
    const pending = loadBundle({ baseUrl, fetch: concurrent, storage: new MemoryStorageAdapter() });
    for (let i = 0; i < names.length * 2 && gates.length < names.length; i++) {
      await tick();
      gates.splice(0).reverse().forEach((g) => g());
    }
    const result = await pending;
    expect(peak).toBeGreaterThanOrEqual(2);
    expect(peak).toBeLessThanOrEqual(5);

    const serial = await loadBundle({
      baseUrl,
      fetch: serve(),
      storage: new MemoryStorageAdapter(),
    });
    expect(result.files).toEqual(serial.files);
    expect(Object.keys(result.files)).toEqual(Object.keys(serial.files));
  });

  it('the first failing file in manifest order decides the error, even if a later file fails first in time', async () => {
    let releaseFirst: () => void = () => {};
    const firstGate = new Promise<void>((resolve) => (releaseFirst = resolve));
    let laterFailed: () => void = () => {};
    const laterServed = new Promise<void>((resolve) => (laterFailed = resolve));
    const fetchImpl = serve(async (name) => {
      if (name === names[0]) {
        await firstGate;
        return respond(200, '{"corrupt": true}');
      }
      if (name === names[1]) {
        laterFailed();
        return respond(500, 'boom');
      }
      return undefined;
    });
    const pending = loadBundle({ baseUrl, fetch: fetchImpl, storage: new MemoryStorageAdapter() });
    const outcome = expect(pending).rejects.toThrow(BundleIntegrityError);
    await laterServed;
    await tick();
    releaseFirst();
    await outcome;
  });

  /** Seeds last-good, then returns a storage view that hides the warm marker and records writes. */
  async function seededColdView() {
    const inner = new MemoryStorageAdapter();
    await loadBundle({ baseUrl, fetch: serve(), storage: inner });
    const writes: string[] = [];
    const view = {
      getItem: async (key: string) => (key.includes('etag:') ? null : inner.getItem(key)),
      setItem: async (key: string, value: string) => {
        writes.push(key);
        await inner.setItem(key, value);
      },
    };
    return { view, writes };
  }

  it('a network failure on one file still serves last-good and writes nothing new', async () => {
    const { view, writes } = await seededColdView();
    const failing = serve(async (name) => {
      if (name === names[2]) throw new Error('simulated network outage');
      return undefined;
    });
    const result = await loadBundle({ baseUrl, fetch: failing, storage: view });
    expect(result.source).toBe('offline-last-good');
    expect(result.stale).toBe(true);
    expect(writes).toEqual([]);
  });

  it('an earlier transport failure falls back promptly even though a later request never resolves, with no unhandled rejection', async () => {
    const { view, writes } = await seededColdView();
    const unhandled: unknown[] = [];
    const onUnhandled = (e: unknown) => unhandled.push(e);
    process.on('unhandledRejection', onUnhandled);
    let rejectHung: (e: Error) => void = () => {};
    try {
      const fetchImpl = serve(async (name) => {
        if (name === names[0]) throw new Error('simulated network outage');
        if (name === names[2]) {
          return new Promise<FetchResponseLike>((_, reject) => (rejectHung = reject));
        }
        return undefined;
      });
      const result = await loadBundle({ baseUrl, fetch: fetchImpl, storage: view });
      expect(result.source).toBe('offline-last-good');
      expect(writes).toEqual([]);
      rejectHung(new Error('late failure'));
      await tick();
      await tick();
      expect(unhandled).toEqual([]);
      expect(writes).toEqual([]);
    } finally {
      process.off('unhandledRejection', onUnhandled);
    }
  });

  it('an earlier integrity failure throws promptly even though a later request never resolves', async () => {
    const fetchImpl = serve(async (name) => {
      if (name === names[0]) return respond(200, '{"corrupt": true}');
      if (name === names[2]) return new Promise<FetchResponseLike>(() => {});
      return undefined;
    });
    await expect(
      loadBundle({ baseUrl, fetch: fetchImpl, storage: new MemoryStorageAdapter() }),
    ).rejects.toThrow(BundleIntegrityError);
  });
});
