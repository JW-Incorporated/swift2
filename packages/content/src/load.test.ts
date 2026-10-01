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
      expect(Array.isArray(result.files[name]), `${name} should load as a catalogue array`).toBe(
        true,
      );
    }
    // current.json + manifest.json + one request per manifest file
    expect(requestLog.length).toBe(2 + Object.keys(manifest.files).length);
  });

  it('cached load: a second load against the same storage uses If-None-Match and gets a 304', async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });

    const requestLog: string[] = [];
    const result = await loadBundle({ baseUrl, fetch: makeFakeFetch({ requestLog }), storage });

    expect(result.source).toBe('cache-etag');
    expect(result.stale).toBe(false);
    expect(result.manifest.bundleVersion).toBe(manifest.bundleVersion);
    expect(Object.keys(result.files).sort()).toEqual(Object.keys(manifest.files).sort());
    // current.json + manifest.json only — a 304 means no per-file re-fetch.
    expect(requestLog).toEqual([
      `${baseUrl}/current.json`,
      `${baseUrl}/${manifest.bundleVersion}/manifest.json`,
    ]);
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

    // Simulate the manifest changing on the server (so the ETag no longer
    // matches and we get a full re-fetch, not a 304 short-circuit) while one
    // file's body is corrupted relative to its own manifest entry.
    const corruptFetch: FetchLike = async (url, init) => {
      if (url === `${baseUrl}/${manifest.bundleVersion}/${manifest.files.tracks!.path}`) {
        return {
          ok: true,
          status: 200,
          text: async () => '{"tracks": "this does not match the manifest hash"}',
          headers: { get: () => null },
        };
      }
      // Everything else (current.json, manifest.json, other files) is served
      // normally but without honoring If-None-Match, forcing a full re-fetch.
      return makeFakeFetch()(url, { ...init, headers: {} });
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
  opts: { etag?: string; schemaVersion?: number; requestLog?: string[] } = {},
): FetchLike {
  const served: Manifest = {
    ...manifest,
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
  return async (url, init) => {
    opts.requestLog?.push(url);
    const respond = (status: number, body: string, headers: Record<string, string> = {}) => ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => body,
      headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    });
    if (url === `${baseUrl}/current.json`) {
      return respond(200, JSON.stringify({ bundleVersion: manifest.bundleVersion }));
    }
    if (url === `${baseUrl}/${manifest.bundleVersion}/manifest.json`) {
      if (init?.headers?.['If-None-Match'] === etag) return respond(304, '');
      return respond(200, JSON.stringify(served), { etag });
    }
    for (const f of Object.values(files)) {
      if (url === `${baseUrl}/${manifest.bundleVersion}/${f.path}`) return respond(200, f.text);
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

  it('a pruned load does not store the ETag, so the next load re-validates instead of a 304', async () => {
    const fetch = serveFiles(bundleWithNewEra());
    await loadBundle({ baseUrl, fetch, storage, unknownEnumPolicy: 'drop' });
    const again = await loadBundle({ baseUrl, fetch, storage, unknownEnumPolicy: 'drop' });
    expect(again.source).toBe('network');
  });

  it("'last-good': a schema failure serves the last-good bundle with the error attached", async () => {
    await loadBundle({ baseUrl, fetch: makeFakeFetch(), storage });
    const result = await loadBundle({
      baseUrl,
      fetch: serveFiles(bundleWithNewEra()),
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
      fetch: serveFiles(fixtureServed(), { schemaVersion: 999 }),
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
      fetch: serveFiles(files),
      storage,
      dataErrorFallback: 'last-good',
    });
    expect(result.dataError).toBeInstanceOf(SyntaxError);
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
