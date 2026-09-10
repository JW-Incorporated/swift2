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
