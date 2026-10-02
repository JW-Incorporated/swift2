/**
 * `packages/content` loader tests (OS-013 done-when: "tests cover cold load,
 * cached load, stale-while-revalidate, schema mismatch").
 *
 * Builds an in-memory fake HTTP server from the real OS-010 fixture bundle
 * (`src/fixtures/bundle/**`) — same manifest, same files, same hashes — so
 * these tests exercise the loader against genuine schema-valid content
 * without needing a real network or a real published bundle.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  loadBundle,
  SchemaVersionMismatchError,
  BundleLoadError,
  BundleIntegrityError,
  type FetchLike,
  type FetchResponseLike,
} from './load';
import { MemoryStorageAdapter } from './cache';
import type { Manifest } from './schema';

const bundleDir = join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'bundle');
const manifest: Manifest = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'));
const baseUrl = 'https://content.example.test/content';

/** name -> raw file text, keyed the same way the manifest keys them. */
function readFixtureFiles(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, entry] of Object.entries(manifest.files)) {
    out[name] = readFileSync(join(bundleDir, entry.path), 'utf8');
  }
  return out;
}

const fixtureFiles = readFixtureFiles();
const V2 = 'b'.repeat(64);
const MANIFEST_ETAG = `"${createHash('sha256').update(JSON.stringify(manifest)).digest('hex')}"`;

interface FakeServerOptions {
  /** Set true to make every request throw (simulates offline). */
  offline?: boolean;
  /** Override the schemaVersion the server reports, to test mismatch handling. */
  schemaVersionOverride?: number;
  /** Track how many times each path was requested. */
  requestLog?: string[];
}

function makeFakeFetch(opts: FakeServerOptions = {}): FetchLike {
  const servedManifest = opts.schemaVersionOverride
    ? { ...manifest, schemaVersion: opts.schemaVersionOverride }
    : manifest;

  return async (
    url: string,
    init?: { headers?: Record<string, string> },
  ): Promise<FetchResponseLike> => {
    if (opts.offline) {
      throw new Error('simulated network outage');
    }
    opts.requestLog?.push(url);

    const respond = (
      status: number,
      body: string,
      headers: Record<string, string> = {},
    ): FetchResponseLike => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
      headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    });

    if (url === `${baseUrl}/current.json`) {
      return respond(200, JSON.stringify({ bundleVersion: manifest.bundleVersion }));
    }

    if (url === `${baseUrl}/${manifest.bundleVersion}/manifest.json`) {
      const ifNoneMatch = init?.headers?.['If-None-Match'];
      if (ifNoneMatch === MANIFEST_ETAG) {
        return respond(304, '');
      }
      return respond(200, JSON.stringify(servedManifest), { etag: MANIFEST_ETAG });
    }

    for (const [name, entry] of Object.entries(manifest.files)) {
      if (url === `${baseUrl}/${manifest.bundleVersion}/${entry.path}`) {
        return respond(200, fixtureFiles[name]!);
      }
    }

    return respond(404, 'not found');
  };
}

describe('loadBundle', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  it('cold load: fetches current.json, manifest, and every file, validating each against its schema', async () => {
    const requestLog: string[] = [];
    const result = await loadBundle({ baseUrl, fetch: makeFakeFetch({ requestLog }), storage });

    expect(result.source).toBe('network');
    expect(result.stale).toBe(false);
    expect(result.manifest.bundleVersion).toBe(manifest.bundleVersion);
    expect(Object.keys(result.files).sort()).toEqual(Object.keys(manifest.files).sort());
    // The production publisher emits these catalogue files as per-era arrays.
    // Keep the cold-load fixture wire-compatible with that public bundle.
    for (const name of ['tracks', 'theories', 'videos', 'eraSecrets']) {
      expect(Array.isArray(result.files[name]), `${name} should load as a catalogue array`).toBe(true);
    }
    // current.json + manifest.json + one request per manifest file
    expect(requestLog.length).toBe(2 + Object.keys(manifest.files).length);
  });

  it('warm load of an unchanged version: only current.json is fetched, no manifest or files', async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });

    const requestLog: string[] = [];
    const result = await loadBundle({ baseUrl, fetch: makeFakeFetch({ requestLog }), storage });

    expect(result.source).toBe('cache-etag');
    expect(result.stale).toBe(false);
    expect(result.manifest.bundleVersion).toBe(manifest.bundleVersion);
    expect(Object.keys(result.files).sort()).toEqual(Object.keys(manifest.files).sort());
    expect(requestLog).toEqual([`${baseUrl}/current.json`]);
  });

  it('legacy install: a truthy ETag string in the marker key still gets a one-request warm hit', async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    storage.setItem(`@swift2/content:v1:${baseUrl}:etag:${manifest.bundleVersion}`, '"legacy"');
    const requestLog: string[] = [];
    const result = await loadBundle({ baseUrl, fetch: makeFakeFetch({ requestLog }), storage });
    expect(result.source).toBe('cache-etag');
    expect(requestLog).toEqual([`${baseUrl}/current.json`]);
  });

  it('legacy install: an empty marker (pruned load) forces a network load', async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    storage.setItem(`@swift2/content:v1:${baseUrl}:etag:${manifest.bundleVersion}`, '');
    const result = await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    expect(result.source).toBe('network');
  });

  it('a corrupt cached manifest falls through to the network load', async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    storage.setItem(`@swift2/content:v1:${baseUrl}:manifest:${manifest.bundleVersion}`, '{not json');
    const result = await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    expect(result.source).toBe('network');
    expect(Object.keys(result.files).sort()).toEqual(Object.keys(manifest.files).sort());
  });

  it('valid-JSON but schema-invalid cached files fall through to the network load', async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    const key = `@swift2/content:v1:${baseUrl}:files:${manifest.bundleVersion}`;
    const files = JSON.parse(storage.getItem(key)!);
    files.eras[0].name = 42;
    storage.setItem(key, JSON.stringify(files));
    const result = await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    expect(result.source).toBe('network');
  });

  it('partial cached files (a manifest entry missing) fall through to the network load', async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    const key = `@swift2/content:v1:${baseUrl}:files:${manifest.bundleVersion}`;
    const files = JSON.parse(storage.getItem(key)!);
    delete files.eras;
    storage.setItem(key, JSON.stringify(files));
    const result = await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    expect(result.source).toBe('network');
    expect(Array.isArray(result.files.eras)).toBe(true);
  });

  it('a failed files write leaves the complete marker unset, so the next load goes to the network', async () => {
    const failing = new MemoryStorageAdapter();
    const realSet = failing.setItem.bind(failing);
    failing.setItem = (k: string, v: string) => {
      if (k.includes(':files:')) throw new Error('simulated write failure');
      realSet(k, v);
    };
    await expect(
      loadBundle({ baseUrl, fetch: makeFakeFetch(), storage: failing }),
    ).rejects.toThrow('simulated write failure');
    failing.setItem = realSet;
    const result = await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage: failing });
    expect(result.source).toBe('network');
  });

  it('a changed version downloads the manifest and every file (integrity checks: the sha256-mismatch test below)', async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });

    const requestLog: string[] = [];
    const result = await loadBundle({
      baseUrl,
      fetch: serveFiles(fixtureServed(), { version: V2, requestLog }),
      storage,
    });
    expect(result.source).toBe('network');
    expect(result.manifest.bundleVersion).toBe(V2);
    expect(requestLog.length).toBe(2 + Object.keys(manifest.files).length);
  });

  it('never sends request headers (a non-safelisted header forces a CORS preflight from an opaque origin)', async () => {
    const seen: unknown[] = [];
    const inner = makeFakeFetch();
    const spy: FetchLike = (url, init) => {
      seen.push(init);
      return inner(url, init);
    };
    await loadBundle({ baseUrl, fetch: spy, storage });
    await loadBundle({ baseUrl, fetch: spy, storage });
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((i) => i === undefined || !(i as { headers?: unknown }).headers)).toBe(true);
  });

  it('stale-while-revalidate: when the network is unreachable, a previously loaded bundle is served as stale/last-good', async () => {
    // First, a real successful load populates the last-good cache.
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });

    // Now the network is gone entirely.
    const result = await loadBundle({ baseUrl, fetch: makeFakeFetch({ offline: true }), storage });

    expect(result.source).toBe('offline-last-good');
    expect(result.stale).toBe(true);
    expect(result.manifest.bundleVersion).toBe(manifest.bundleVersion);
    expect(Object.keys(result.files).sort()).toEqual(Object.keys(manifest.files).sort());
  });

  it('offline with nothing cached yet throws a clear BundleLoadError', async () => {
    await expect(
      loadBundle({ baseUrl, fetch: makeFakeFetch({ offline: true }), storage }),
    ).rejects.toThrow(BundleLoadError);
  });

  it('a reachable-but-corrupted file (sha256 mismatch) always throws, even when a last-good bundle is cached — never silently masked as offline', async () => {
    // First, a real successful load populates the last-good cache.
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });

    // The server publishes a new version (so the cache does not short-circuit)
    // in which one file's body is corrupted relative to its own manifest entry.
    const v2 = serveFiles(fixtureServed(), { version: V2 });
    const corruptFetch: FetchLike = async (url, init) => {
      if (url === `${baseUrl}/${V2}/${manifest.files.tracks!.path}`) {
        return {
          ok: true,
          status: 200,
          text: async () => '{"tracks": "this does not match the manifest hash"}',
          headers: { get: () => null },
        };
      }
      return v2(url, init);
    };

    await expect(loadBundle({ baseUrl, fetch: corruptFetch, storage })).rejects.toThrow(
      BundleIntegrityError,
    );
  });

  it('schema mismatch: a manifest reporting an unsupported schemaVersion throws SchemaVersionMismatchError with a clear message', async () => {
    const err = await loadBundle({
      baseUrl,
      fetch: makeFakeFetch({ schemaVersionOverride: 999 }),
      storage,
    }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(SchemaVersionMismatchError);
    expect((err as Error).message).toMatch(/schemaVersion 999/);
    expect((err as Error).message).toMatch(/supports schemaVersion 1/);
  });
});

type ServedFile = { path: string; text: string };

/** A server publishing `files` under a manifest whose bytes/sha256 match them (so only schema checks can fail). */
function serveFiles(
  files: Record<string, ServedFile>,
  opts: { etag?: string; schemaVersion?: number; requestLog?: string[]; version?: string } = {},
): FetchLike {
  const version = opts.version ?? manifest.bundleVersion;
  const served: Manifest = {
    ...manifest,
    bundleVersion: version,
    schemaVersion: opts.schemaVersion ?? manifest.schemaVersion,
    files: Object.fromEntries(
      Object.entries(files).map(([name, f]) => [
        name,
        {
          path: f.path,
          bytes: Buffer.byteLength(f.text, 'utf8'),
          sha256: createHash('sha256').update(f.text).digest('hex'),
        },
      ]),
    ),
  };
  const etag = opts.etag ?? '"served"';
  return async (url) => {
    opts.requestLog?.push(url);
    const respond = (status: number, body: string, headers: Record<string, string> = {}) => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
      headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    });
    if (url === `${baseUrl}/current.json`) {
      return respond(200, JSON.stringify({ bundleVersion: version }));
    }
    if (url === `${baseUrl}/${version}/manifest.json`) {
      return respond(200, JSON.stringify(served), { etag });
    }
    for (const f of Object.values(files)) {
      if (url === `${baseUrl}/${version}/${f.path}`) return respond(200, f.text);
    }
    return respond(404, 'not found');
  };
}

function fixtureServed(): Record<string, ServedFile> {
  return Object.fromEntries(
    Object.entries(manifest.files).map(([name, e]) => [
      name,
      { path: e.path, text: fixtureFiles[name]! },
    ]),
  );
}

function withJson(
  files: Record<string, ServedFile>,
  name: string,
  edit: (value: any) => unknown, // eslint-disable-line @typescript-eslint/no-explicit-any
): Record<string, ServedFile> {
  const f = files[name]!;
  return { ...files, [name]: { ...f, text: JSON.stringify(edit(JSON.parse(f.text))) } };
}

/** The fixture plus an era this build has never heard of, in eras.json and its own content file. */
function bundleWithNewEra(): Record<string, ServedFile> {
  const files = withJson(fixtureServed(), 'eras', (eras) => [
    ...eras,
    { ...eras[0], id: 'some-future-era', name: 'Future' },
  ]);
  const folklore = JSON.parse(files['content:folklore']!.text);
  return {
    ...files,
    'content:some-future-era': {
      path: 'eras/some-future-era.json',
      text: JSON.stringify({
        ...folklore,
        eraId: 'some-future-era',
        items: folklore.items.map((i: object) => ({ ...i, eraId: 'some-future-era' })),
      }),
    },
  };
}

describe('loadBundle forward compatibility (unknownEnumPolicy / dataErrorFallback)', () => {
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });

  it('strict by default: an unknown era id fails the load', async () => {
    await expect(
      loadBundle({ baseUrl, fetch: serveFiles(bundleWithNewEra()), storage }),
    ).rejects.toThrow(BundleIntegrityError);
  });

  it("'drop': prunes the unknown era from eras.json and skips its whole content file", async () => {
    const result = await loadBundle({
      baseUrl,
      fetch: serveFiles(bundleWithNewEra()),
      storage,
      unknownEnumPolicy: 'drop',
    });
    expect(result.source).toBe('network');
    expect((result.files.eras as { id: string }[]).map((e) => e.id)).toEqual(['folklore']);
    expect(result.skipped).toEqual(['content:some-future-era']);
    expect(result.files['content:some-future-era']).toBeUndefined();
    expect(result.files['content:folklore']).toBeDefined();
  });

  it("'drop': removes an unknown tag from a primitive array but keeps the item", async () => {
    const files = withJson(fixtureServed(), 'content:folklore', (c) => {
      c.items[0].tags = ['Music', 'NotATagYet'];
      return c;
    });
    const result = await loadBundle({
      baseUrl,
      fetch: serveFiles(files),
      storage,
      unknownEnumPolicy: 'drop',
    });
    const content = result.files['content:folklore'] as { items: { tags: string[] }[] };
    expect(content.items).toHaveLength(1);
    expect(content.items[0]!.tags).toEqual(['Music']);
  });

  it("'drop': skips a manifest entry this build has no schema for, without fetching it", async () => {
    const requestLog: string[] = [];
    const files = {
      ...fixtureServed(),
      futureCatalogue: { path: 'future.json', text: '{"anything":true}' },
    };
    const result = await loadBundle({
      baseUrl,
      fetch: serveFiles(files, { requestLog }),
      storage,
      unknownEnumPolicy: 'drop',
    });
    expect(result.skipped).toEqual(['futureCatalogue']);
    expect(requestLog.some((u) => u.endsWith('/future.json'))).toBe(false);
  });

  it("'drop' still throws on a non-enum schema failure", async () => {
    const files = withJson(fixtureServed(), 'content:folklore', (c) => {
      c.items[0].title = 42;
      return c;
    });
    await expect(
      loadBundle({ baseUrl, fetch: serveFiles(files), storage, unknownEnumPolicy: 'drop' }),
    ).rejects.toThrow(BundleIntegrityError);
  });

  it('a pruned load is not marked complete, so the next load re-validates instead of serving the cache', async () => {
    const fetch = serveFiles(bundleWithNewEra());
    await loadBundle({ baseUrl, fetch, storage, unknownEnumPolicy: 'drop' });
    const again = await loadBundle({ baseUrl, fetch, storage, unknownEnumPolicy: 'drop' });
    expect(again.source).toBe('network');
  });

  it("'last-good': a schema failure serves the last-good bundle with the error attached", async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    const result = await loadBundle({
      baseUrl,
      fetch: serveFiles(bundleWithNewEra(), { version: V2 }),
      storage,
      dataErrorFallback: 'last-good',
    });
    expect(result.source).toBe('last-good-after-data-error');
    expect(result.stale).toBe(true);
    expect(result.dataError).toBeInstanceOf(BundleIntegrityError);
    expect(Object.keys(result.files).sort()).toEqual(Object.keys(manifest.files).sort());
  });

  it("'last-good': an unsupported schemaVersion serves last-good", async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    const result = await loadBundle({
      baseUrl,
      fetch: serveFiles(fixtureServed(), { schemaVersion: 999, version: V2 }),
      storage,
      dataErrorFallback: 'last-good',
    });
    expect(result.source).toBe('last-good-after-data-error');
    expect(result.dataError).toBeInstanceOf(SchemaVersionMismatchError);
  });

  it("'last-good': malformed JSON serves last-good", async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    const files = { ...fixtureServed(), eras: { path: 'eras.json', text: '[{"id":' } };
    const result = await loadBundle({
      baseUrl,
      fetch: serveFiles(files, { version: V2 }),
      storage,
      dataErrorFallback: 'last-good',
    });
    expect(result.dataError).toBeInstanceOf(SyntaxError);
  });

  it("'last-good': a manifest failing its schema (ZodError) serves last-good", async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    const v2 = serveFiles(fixtureServed(), { version: V2 });
    const broken: FetchLike = async (url, init) =>
      url.endsWith('/manifest.json')
        ? { ok: true, status: 200, text: async () => '{"files":7}', headers: { get: () => null } }
        : v2(url, init);
    const result = await loadBundle({
      baseUrl,
      fetch: broken,
      storage,
      dataErrorFallback: 'last-good',
    });
    expect(result.source).toBe('last-good-after-data-error');
    expect(result.dataError).toBeInstanceOf(z.ZodError);
  });

  it("'last-good' rethrows when a cached file no longer passes this build's schemas", async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    const key = `@swift2/content:v1:${baseUrl}:last-good`;
    const record = JSON.parse(storage.getItem(key)!);
    record.files.eras[0].name = 42; // written by a build whose shape differed
    storage.setItem(key, JSON.stringify(record));
    await expect(
      loadBundle({
        baseUrl,
        fetch: serveFiles(bundleWithNewEra(), { version: V2 }),
        storage,
        dataErrorFallback: 'last-good',
      }),
    ).rejects.toThrow(BundleIntegrityError);
  });

  it("'last-good' rethrows when the cached record is outside this build's schema window", async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    // This build is two schema versions ahead of the cached record.
    await expect(
      loadBundle({
        baseUrl,
        fetch: serveFiles(bundleWithNewEra(), { version: V2 }),
        storage,
        schemaVersion: manifest.schemaVersion + 2,
        dataErrorFallback: 'last-good',
      }),
    ).rejects.toThrow(SchemaVersionMismatchError);
  });

  it("'drop': several unknown values in nested and parent arrays in one pass", async () => {
    const files = withJson(fixtureServed(), 'content:folklore', (c) => {
      const base = c.items[0];
      c.items = [
        { ...base, id: 'keep-1', tags: ['NewA', 'Music', 'NewB'] },
        { ...base, id: 'drop-1', significance: 'brand-new-level' },
        { ...base, id: 'keep-2' },
        { ...base, id: 'drop-2', significance: 'brand-new-level', tags: ['NewC'] },
      ];
      return c;
    });
    const result = await loadBundle({
      baseUrl,
      fetch: serveFiles(files),
      storage,
      unknownEnumPolicy: 'drop',
    });
    const items = (result.files['content:folklore'] as { items: { id: string; tags: string[] }[] })
      .items;
    expect(items.map((i) => i.id)).toEqual(['keep-1', 'keep-2']);
    expect(items[0]!.tags).toEqual(['Music']);
  });

  it("'last-good' with nothing cached still throws the data error", async () => {
    await expect(
      loadBundle({
        baseUrl,
        fetch: serveFiles(bundleWithNewEra()),
        storage,
        dataErrorFallback: 'last-good',
      }),
    ).rejects.toThrow(BundleIntegrityError);
  });
});
