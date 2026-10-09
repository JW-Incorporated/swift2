/** Per-request fetch timeout: a stalled request rejects so the app's gate can show its failure UI. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MemoryStorageAdapter } from './cache';
import { loadBundle, type FetchLike } from './load';
import type { Manifest } from './schema';

const bundleDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'bundle');
const manifest: Manifest = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'));
const baseUrl = 'https://content.example.test/content';

const ok = (body: string) => ({
  ok: true,
  status: 200,
  text: async () => body,
  headers: { get: () => null },
});

function serve(hang?: (url: string) => boolean): FetchLike {
  return (url) => {
    if (hang?.(url)) return new Promise(() => {});
    if (url.endsWith('current.json')) return Promise.resolve(ok(JSON.stringify({ bundleVersion: manifest.bundleVersion })));
    if (url.endsWith('manifest.json')) return Promise.resolve(ok(JSON.stringify(manifest)));
    for (const entry of Object.values(manifest.files)) {
      if (url.endsWith(`/${entry.path}`)) return Promise.resolve(ok(readFileSync(join(bundleDir, entry.path), 'utf8')));
    }
    return Promise.resolve({ ...ok(''), ok: false, status: 404 });
  };
}

describe('request timeout', () => {
  it('a hung current.json fetch rejects after the timeout', async () => {
    await expect(
      loadBundle({ baseUrl, fetch: serve((u) => u.endsWith('current.json')), storage: new MemoryStorageAdapter(), requestTimeoutMs: 50 }),
    ).rejects.toThrow(/current\.json/);
  });

  it('a hung file fetch rejects after the timeout', async () => {
    const first = Object.values(manifest.files)[0]!.path;
    await expect(
      loadBundle({ baseUrl, fetch: serve((u) => u.endsWith(`/${first}`)), storage: new MemoryStorageAdapter(), requestTimeoutMs: 50 }),
    ).rejects.toThrow();
  });

  it('headers arrive but the body never completes: rejects after the timeout', async () => {
    const stalled: FetchLike = (url) =>
      url.endsWith('current.json')
        ? Promise.resolve({ ok: true, status: 200, text: () => new Promise<string>(() => {}), headers: { get: () => null } })
        : serve()(url);
    await expect(
      loadBundle({ baseUrl, fetch: stalled, storage: new MemoryStorageAdapter(), requestTimeoutMs: 50 }),
    ).rejects.toThrow(/current.json/);
  });

  it('a stalled file body rejects after the timeout', async () => {
    const first = Object.values(manifest.files)[0]!.path;
    const stalled: FetchLike = (url) =>
      url.endsWith(`/${first}`)
        ? Promise.resolve({ ok: true, status: 200, text: () => new Promise<string>(() => {}), headers: { get: () => null } })
        : serve()(url);
    await expect(
      loadBundle({ baseUrl, fetch: stalled, storage: new MemoryStorageAdapter(), requestTimeoutMs: 50 }),
    ).rejects.toThrow();
  });

  it('the timeout aborts the request signal', async () => {
    let aborted = false;
    const fetchImpl: FetchLike = (_url, init) =>
      new Promise(() => {
        init?.signal?.addEventListener('abort', () => (aborted = true));
      });
    await expect(
      loadBundle({ baseUrl, fetch: fetchImpl, storage: new MemoryStorageAdapter(), requestTimeoutMs: 30 }),
    ).rejects.toThrow();
    expect(aborted).toBe(true);
  });

  it('a normal fetch is unaffected by a short-lived timeout', async () => {
    const result = await loadBundle({ baseUrl, fetch: serve(), storage: new MemoryStorageAdapter(), requestTimeoutMs: 5000 });
    expect(result.source).toBe('network');
  });
});
