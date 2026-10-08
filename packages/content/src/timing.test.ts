import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryStorageAdapter } from './cache';
import { loadBundle, type FetchLike } from './load';
import type { Manifest } from './schema';
import { beginStage, setLoadTimingSink, type LoadTimingEvent } from './timing';

const bundleDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'bundle');
const manifest: Manifest = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'));
const baseUrl = 'https://content.example.test/content';
const etag = `"${createHash('sha256').update(JSON.stringify(manifest)).digest('hex')}"`;

const fakeFetch: FetchLike = async (url, init) => {
  const res = (status: number, body: string, headers: Record<string, string> = {}) => ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    headers: { get: (n: string) => headers[n.toLowerCase()] ?? null },
  });
  if (url === `${baseUrl}/current.json`) {
    return res(200, JSON.stringify({ bundleVersion: manifest.bundleVersion }));
  }
  if (url === `${baseUrl}/${manifest.bundleVersion}/manifest.json`) {
    if (init?.headers?.['If-None-Match'] === etag) return res(304, '');
    return res(200, JSON.stringify(manifest), { etag });
  }
  for (const entry of Object.values(manifest.files)) {
    if (url === `${baseUrl}/${manifest.bundleVersion}/${entry.path}`) {
      return res(200, readFileSync(join(bundleDir, entry.path), 'utf8'));
    }
  }
  throw new Error(`unexpected url ${url}`);
};

afterEach(() => setLoadTimingSink(null));

describe('load timing hooks', () => {
  it('is a shared no-op when no sink is registered', () => {
    expect(beginStage('a')).toBe(beginStage('b'));
  });

  it('loads identically with and without a sink', async () => {
    const plain = await loadBundle({ baseUrl, fetch: fakeFetch, storage: new MemoryStorageAdapter() });
    const events: LoadTimingEvent[] = [];
    setLoadTimingSink((e) => events.push(e));
    const timed = await loadBundle({ baseUrl, fetch: fakeFetch, storage: new MemoryStorageAdapter() });
    expect(timed).toEqual(plain);
    expect(events.length).toBeGreaterThan(0);
  });

  it('reports every cold-load stage, with 200 on the manifest', async () => {
    const events: LoadTimingEvent[] = [];
    setLoadTimingSink((e) => events.push(e));
    await loadBundle({ baseUrl, fetch: fakeFetch, storage: new MemoryStorageAdapter() });
    const stages = new Set(events.map((e) => e.stage));
    for (const s of ['pointer', 'manifest', 'download', 'hash', 'parse', 'validate', 'disk-write', 'load-total']) {
      expect(stages.has(s)).toBe(true);
    }
    expect(events.find((e) => e.stage === 'manifest')?.detail).toBe('200');
    const names = Object.keys(manifest.files);
    expect(events.filter((e) => e.stage === 'download').map((e) => e.detail)).toEqual(names);
    expect(events.every((e) => e.durationMs >= 0)).toBe(true);
  });

  it('reports a 304 manifest and no downloads on a warm load', async () => {
    const storage = new MemoryStorageAdapter();
    await loadBundle({ baseUrl, fetch: fakeFetch, storage });
    const events: LoadTimingEvent[] = [];
    setLoadTimingSink((e) => events.push(e));
    const warm = await loadBundle({ baseUrl, fetch: fakeFetch, storage });
    expect(warm.source).toBe('cache-etag');
    expect(events.find((e) => e.stage === 'manifest')?.detail).toBe('304');
    expect(events.some((e) => e.stage === 'download')).toBe(false);
    expect(events.find((e) => e.stage === 'load-total')?.detail).toBe('cache-etag');
  });

  it('never lets a throwing sink break a load', async () => {
    setLoadTimingSink(() => {
      throw new Error('boom');
    });
    const loaded = await loadBundle({ baseUrl, fetch: fakeFetch, storage: new MemoryStorageAdapter() });
    expect(loaded.source).toBe('network');
  });
});
