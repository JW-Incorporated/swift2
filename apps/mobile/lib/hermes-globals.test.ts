/**
 * #4738: the mobile data path (content-bundle -> real loadBundle) under Hermes-like globals.
 * Hermes has crypto.randomUUID but no crypto.subtle, and no window/document/TextDecoder; CI under Node
 * (which has all of those) stayed green while every era failed on device. Only the network and the
 * file system are faked; the loader, hashing and validation are the real ones.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const bundleDir = join(__dirname, '../../../packages/content/src/fixtures/bundle');
const manifest = JSON.parse(readFileSync(join(bundleDir, 'manifest.json'), 'utf8')) as {
  bundleVersion: string;
  files: Record<string, { path: string }>;
};

const disk = vi.hoisted(() => new Map<string, string>());

vi.mock('expo-file-system', () => {
  class FakeFile {
    constructor(
      private dir: { path: string },
      public name: string,
    ) {}
    private get id() {
      return `${this.dir.path}/${this.name}`;
    }
    get exists() {
      return disk.has(this.id);
    }
    textSync() {
      return disk.get(this.id) ?? '';
    }
    write(v: string) {
      disk.set(this.id, v);
    }
    delete() {
      disk.delete(this.id);
    }
    moveSync(to: FakeFile) {
      disk.set(to.id, disk.get(this.id) ?? '');
      disk.delete(this.id);
    }
  }
  class FakeDirectory {
    path: string;
    constructor(parent: { path?: string }, name?: string) {
      this.path = `${parent.path ?? ''}/${name ?? ''}`;
    }
    exists = true;
    create() {}
    list() {
      return [];
    }
  }
  return { File: FakeFile, Directory: FakeDirectory, Paths: { document: { path: '/doc' } } };
});

function serveFixture(): typeof fetch {
  const res = (body: string) =>
    ({ ok: true, status: 200, text: async () => body, json: async () => JSON.parse(body), headers: { get: () => null } }) as unknown as Response;
  return (async (input: unknown) => {
    const url = String(input);
    if (url.endsWith('current.json')) return res(JSON.stringify({ bundleVersion: manifest.bundleVersion }));
    if (url.endsWith('manifest.json')) return res(readFileSync(join(bundleDir, 'manifest.json'), 'utf8'));
    for (const entry of Object.values(manifest.files)) {
      if (url.endsWith(`/${entry.path}`)) return res(readFileSync(join(bundleDir, entry.path), 'utf8'));
    }
    return { ...res(''), ok: false, status: 404 } as Response;
  }) as typeof fetch;
}

beforeEach(() => {
  disk.clear();
  vi.resetModules();
  vi.stubGlobal('crypto', { randomUUID: () => '00000000-0000-4000-8000-000000000000' });
  vi.stubGlobal('window', undefined);
  vi.stubGlobal('document', undefined);
  vi.stubGlobal('TextDecoder', undefined);
  vi.stubGlobal('fetch', serveFixture());
});

afterEach(() => {
  vi.doUnmock('../../../packages/content/src/hash');
  vi.unstubAllGlobals();
});

describe('mobile content load under Hermes globals', () => {
  it('loads the fixture bundle with crypto = { randomUUID } only', async () => {
    expect((globalThis.crypto as { subtle?: unknown }).subtle).toBeUndefined();
    const { loadContentBundle } = await import('./content-bundle');
    const bundle = await loadContentBundle();
    expect(bundle.source).toBe('network');
    expect(bundle.manifest.bundleVersion).toBe(manifest.bundleVersion);
    expect(Object.keys(bundle.files).length).toBe(Object.keys(manifest.files).length);
  });

  it('mutation check: with the pure-JS hash fallback removed (pre-#4718 behaviour) the same load fails', async () => {
    vi.doMock('../../../packages/content/src/hash', () => ({
      createHash: async () => {
        throw new Error('No crypto.subtle available in this runtime');
      },
    }));
    const { loadContentBundle } = await import('./content-bundle');
    await expect(loadContentBundle()).rejects.toThrow(/crypto\.subtle/);
  });
});
