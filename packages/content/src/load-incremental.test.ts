/** #4508: a new bundleVersion reuses cached files whose manifest hash is unchanged instead of refetching them. */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { MemoryStorageAdapter } from './cache';
import { loadBundle, type FetchLike } from './load';
import type { Manifest } from './schema';

const bundleDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'bundle');
const base: Manifest = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'));
const baseUrl = 'https://content.example.test/content';
const names = Object.keys(base.files);
const fixture = Object.fromEntries(
  Object.entries(base.files).map(([n, e]) => [n, readFileSync(join(bundleDir, e.path), 'utf8')]),
);
const V1 = 'a'.repeat(64);
const V2 = 'b'.repeat(64);

/** One published version: `texts` overrides file bodies (the manifest is built from them). */
function publish(version: string, texts: Record<string, string> = {}) {
  const bodies = { ...fixture, ...texts };
  const manifest: Manifest = {
    ...base,
    bundleVersion: version,
    files: Object.fromEntries(
      Object.entries(base.files).map(([n, e]) => [
        n,
        {
          path: e.path,
          bytes: Buffer.byteLength(bodies[n]!, 'utf8'),
          sha256: createHash('sha256').update(bodies[n]!).digest('hex'),
        },
      ]),
    ),
  };
  const fileRequests: string[] = [];
  const fetchImpl: FetchLike = async (url) => {
    const res = (status: number, body: string) => ({
      ok: status === 200,
      status,
      text: async () => body,
      headers: { get: () => null },
    });
    if (url === `${baseUrl}/current.json`) return res(200, JSON.stringify({ bundleVersion: version }));
    if (url === `${baseUrl}/${version}/manifest.json`) return res(200, JSON.stringify(manifest));
    for (const n of names) {
      if (url === `${baseUrl}/${version}/${manifest.files[n]!.path}`) {
        fileRequests.push(n);
        return res(200, bodies[n]!);
      }
    }
    return res(404, '');
  };
  return { fetchImpl, fileRequests };
}

const tweak = (name: string) => ({ [name]: `${fixture[name]} ` });

describe('incremental bundle load (#4508)', () => {
  it('fetches only the changed file; unchanged files come from the cache', async () => {
    const storage = new MemoryStorageAdapter();
    await loadBundle({ baseUrl, fetch: publish(V1).fetchImpl, storage });
    const v2 = publish(V2, tweak('tracks'));
    const result = await loadBundle({ baseUrl, fetch: v2.fetchImpl, storage });
    expect(v2.fileRequests).toEqual(['tracks']);
    expect(result.source).toBe('network');
    expect(result.manifest.bundleVersion).toBe(V2);
    const full = await loadBundle({
      baseUrl,
      fetch: publish(V2, tweak('tracks')).fetchImpl,
      storage: new MemoryStorageAdapter(),
    });
    expect(result.files).toEqual(full.files);
  });

  it('fetches nothing when no file changed, and still writes the new version warm', async () => {
    const storage = new MemoryStorageAdapter();
    await loadBundle({ baseUrl, fetch: publish(V1).fetchImpl, storage });
    const v2 = publish(V2);
    await loadBundle({ baseUrl, fetch: v2.fetchImpl, storage });
    expect(v2.fileRequests).toEqual([]);
    const warm = publish(V2);
    const again = await loadBundle({ baseUrl, fetch: warm.fetchImpl, storage });
    expect(again.source).toBe('cache-etag');
    expect(warm.fileRequests).toEqual([]);
  });

  it('refetches a file whose cached manifest hash differs from the new manifest', async () => {
    const storage = new MemoryStorageAdapter();
    await loadBundle({ baseUrl, fetch: publish(V1, tweak('tracks')).fetchImpl, storage });
    const v2 = publish(V2);
    await loadBundle({ baseUrl, fetch: v2.fetchImpl, storage });
    expect(v2.fileRequests).toEqual(['tracks']);
  });

  it('a changed file is still hash-checked', async () => {
    const storage = new MemoryStorageAdapter();
    await loadBundle({ baseUrl, fetch: publish(V1).fetchImpl, storage });
    const good = publish(V2, tweak('tracks'));
    const corrupt: FetchLike = async (url, init) =>
      url.endsWith(base.files.tracks!.path)
        ? { ok: true, status: 200, text: async () => '{"x":1}', headers: { get: () => null } }
        : good.fetchImpl(url, init);
    await expect(loadBundle({ baseUrl, fetch: corrupt, storage })).rejects.toThrow(/integrity/);
  });

  it('a different schema fingerprint refetches everything', async () => {
    const storage = new TrackingStorage();
    await loadBundle({ baseUrl, fetch: publish(V1).fetchImpl, storage });
    await storage.setItem(storage.keyEndingWith('last-good-fp'), 'schema-fp-older-build');
    const v2 = publish(V2);
    await loadBundle({ baseUrl, fetch: v2.fetchImpl, storage });
    expect(v2.fileRequests.sort()).toEqual([...names].sort());
  });

  it('does not reuse a last-good that was not written by a full load', async () => {
    const storage = new TrackingStorage();
    await loadBundle({ baseUrl, fetch: publish(V1).fetchImpl, storage });
    await storage.setItem(storage.keyEndingWith('last-good-fp'), '');
    const v2 = publish(V2);
    await loadBundle({ baseUrl, fetch: v2.fetchImpl, storage });
    expect(v2.fileRequests.length).toBe(names.length);
  });

  it('drops the superseded version cache entries once the new version is written', async () => {
    const storage = new TrackingStorage();
    await loadBundle({ baseUrl, fetch: publish(V1).fetchImpl, storage });
    await loadBundle({ baseUrl, fetch: publish(V2, tweak('tracks')).fetchImpl, storage });
    expect(storage.keys().some((k) => k.includes(V1))).toBe(false);
    expect(storage.keys().some((k) => k.includes(V2))).toBe(true);
  });
});

class TrackingStorage extends MemoryStorageAdapter {
  private readonly seen = new Set<string>();
  setItem(key: string, value: string): void {
    this.seen.add(key);
    super.setItem(key, value);
  }
  removeItem(key: string): void {
    this.seen.delete(key);
    super.removeItem(key);
  }
  keys(): string[] {
    return [...this.seen];
  }
  keyEndingWith(suffix: string): string {
    return this.keys().find((k) => k.endsWith(suffix))!;
  }
}
