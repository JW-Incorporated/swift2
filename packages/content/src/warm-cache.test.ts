/** One UI WP0.2 PR C: warm-path short-circuit, single encode / single files write. */
import { createHash as nodeHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorageAdapter } from './cache';
import { BundleIntegrityError, loadBundle, type FetchLike } from './load';
import { contentBundleSchemas, type Manifest } from './schema';
import { SCHEMA_FINGERPRINT } from './warm-cache';

const srcDir = dirname(fileURLToPath(import.meta.url));
const bundleDir = join(srcDir, 'fixtures', 'bundle');
const manifest: Manifest = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'));
const baseUrl = 'https://content.example.test/content';
const v = manifest.bundleVersion;
const key = (suffix: string) => `@swift2/content:v1:${baseUrl}:${suffix}`;
const entryCount = Object.keys(manifest.files).length;

function makeFetch(corruptFirst = false): FetchLike {
  return async (url) => {
    const res = (body: string) => ({
      ok: true,
      status: 200,
      text: async () => body,
      headers: { get: () => null },
    });
    if (url.endsWith('current.json')) return res(JSON.stringify({ bundleVersion: v }));
    if (url.endsWith('manifest.json')) return res(JSON.stringify(manifest));
    for (const [i, entry] of Object.values(manifest.files).entries()) {
      if (url.endsWith(`/${entry.path}`)) {
        const text = readFileSync(join(bundleDir, entry.path), 'utf8');
        return res(corruptFirst && i === 0 ? text.replace(/\w/, 'Z') : text);
      }
    }
    return { ok: false, status: 404, text: async () => '', headers: { get: () => null } };
  };
}

function spySafeParse() {
  const unique = new Set(Object.values(contentBundleSchemas) as Array<{ safeParse: unknown }>);
  const spies = [...unique].map((s) => vi.spyOn(s as { safeParse: () => unknown }, 'safeParse'));
  return () => spies.reduce((n, s) => n + s.mock.calls.length, 0);
}

describe('schema fingerprint guard', () => {
  it('validation inputs are unchanged since SCHEMA_FINGERPRINT was last bumped', () => {
    const read = (f: string) => readFileSync(join(srcDir, f), 'utf8').replace(/\r\n/g, '\n');
    const zodVersion = (createRequire(import.meta.url)('zod/package.json') as { version: string })
      .version;
    const sha = nodeHash('sha256')
      .update(
        [read('schema.ts'), read('validation-contract.ts'), `zod@${zodVersion}`].join('\n--\n'),
      )
      .digest('hex');
    // If this fails: schema.ts, validation-contract.ts or the installed zod
    // version changed. Bump SCHEMA_FINGERPRINT in warm-cache.ts (so cached
    // bundles re-validate once after the OTA) AND update this pin.
    expect([SCHEMA_FINGERPRINT, sha]).toEqual(['schema-fp-1', 'a533d7fbdba965a4f05021175be49ac5b02b58d82a0e92178aaa8e6dc601fe4d']);
  });
});

describe('warm path', () => {
  let storage: MemoryStorageAdapter;
  beforeEach(() => {
    storage = new MemoryStorageAdapter();
  });
  afterEach(() => vi.restoreAllMocks());

  it('matching fingerprint: 0 safeParse calls on a warm launch', async () => {
    await loadBundle({ baseUrl, fetch: makeFetch(), storage });
    expect(storage.getItem(key(`schemafp:${v}`))).toBe(SCHEMA_FINGERPRINT);
    const calls = spySafeParse();
    const warm = await loadBundle({ baseUrl, fetch: makeFetch(), storage });
    expect(warm.source).toBe('cache-etag');
    expect(calls()).toBe(0);
  });

  it('missing or mismatched fingerprint: validates every entry, then stores the fingerprint', async () => {
    await loadBundle({ baseUrl, fetch: makeFetch(), storage });
    for (const stored of [null, 'schema-fp-OLD']) {
      if (stored) storage.setItem(key(`schemafp:${v}`), stored);
      else storage.setItem(key(`schemafp:${v}`), '');
      const calls = spySafeParse();
      // fresh storage adapter holding the same data, so each pass exercises the fingerprint path from scratch
      const copy = new MemoryStorageAdapter();
      for (const k of ['etag', 'manifest', 'files', 'schemafp']) {
        const full = key(k === 'schemafp' ? `schemafp:${v}` : k === 'manifest' ? `manifest:${v}` : `${k}:${v}:${SCHEMA_FINGERPRINT}`);
        copy.setItem(full, storage.getItem(full) ?? '');
      }
      const warm = await loadBundle({ baseUrl, fetch: makeFetch(), storage: copy });
      expect(warm.source).toBe('cache-etag');
      expect(calls()).toBe(entryCount);
      expect(copy.getItem(key(`schemafp:${v}`))).toBe(SCHEMA_FINGERPRINT);
      vi.restoreAllMocks();
    }
  });

  it('a cached file that no longer validates still falls through to the network when the fingerprint mismatches', async () => {
    await loadBundle({ baseUrl, fetch: makeFetch(), storage });
    storage.setItem(key(`schemafp:${v}`), 'schema-fp-OLD');
    const files = JSON.parse(storage.getItem(key(`files:${v}:${SCHEMA_FINGERPRINT}`))!);
    files[Object.keys(files)[0]!] = { nonsense: true };
    storage.setItem(key(`files:${v}:${SCHEMA_FINGERPRINT}`), JSON.stringify(files));
    const warm = await loadBundle({ baseUrl, fetch: makeFetch(), storage });
    expect(warm.source).toBe('network');
  });

  it('files stripped by an older build (cache keys under another fingerprint) are refetched, not accepted (#4800)', async () => {
    await loadBundle({ baseUrl, fetch: makeFetch(), storage });
    const old = new MemoryStorageAdapter();
    const files = JSON.parse(storage.getItem(key(`files:${v}:${SCHEMA_FINGERPRINT}`))!);
    delete files.eras[0].name;
    old.setItem(key(`manifest:${v}`), storage.getItem(key(`manifest:${v}`))!);
    old.setItem(key(`schemafp:${v}`), 'schema-fp-OLD');
    old.setItem(key(`etag:${v}:schema-fp-OLD`), '1');
    old.setItem(key(`files:${v}:schema-fp-OLD`), JSON.stringify(files));
    const warm = await loadBundle({ baseUrl, fetch: makeFetch(), storage: old });
    expect(warm.source).toBe('network');
    expect((warm.files.eras as unknown[])[0]).toHaveProperty('name');
  });
});

describe('cold path', () => {
  afterEach(() => vi.restoreAllMocks());

  it('encodes each file once', async () => {
    const encode = vi.spyOn(TextEncoder.prototype, 'encode');
    await loadBundle({ baseUrl, fetch: makeFetch(), storage: new MemoryStorageAdapter() });
    expect(encode).toHaveBeenCalledTimes(entryCount);
  });

  it('serialises and writes the files blob once; last-good embeds the same bytes', async () => {
    const storage = new MemoryStorageAdapter();
    const writes: Array<[string, string]> = [];
    const realSet = storage.setItem.bind(storage);
    storage.setItem = (k: string, val: string) => {
      writes.push([k, val]);
      realSet(k, val);
    };
    const stringify = vi.spyOn(JSON, 'stringify');
    const result = await loadBundle({ baseUrl, fetch: makeFetch(), storage });
    const filesStringifies = stringify.mock.calls.filter((c) => c[0] === result.files);
    expect(filesStringifies).toHaveLength(1);
    expect(writes.map(([k]) => k.replace(`@swift2/content:v1:${baseUrl}:`, ''))).toEqual([
      `etag:${v}:${SCHEMA_FINGERPRINT}`,
      `manifest:${v}`,
      `files:${v}:${SCHEMA_FINGERPRINT}`,
      'last-good',
      `schemafp:${v}`,
      `etag:${v}:${SCHEMA_FINGERPRINT}`,
    ]);
    const lastGood = writes.find(([k]) => k.endsWith(':last-good'))![1];
    expect(lastGood).toBe(JSON.stringify({ manifest: result.manifest, files: result.files }));
  });

  it('first-download integrity check still rejects a corrupted file', async () => {
    await expect(
      loadBundle({ baseUrl, fetch: makeFetch(true), storage: new MemoryStorageAdapter() }),
    ).rejects.toThrow(BundleIntegrityError);
  });
});
