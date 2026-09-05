// OS-012 tests (docs/specs/2026-09-05-one-source-three-surfaces.md §6):
// scripts/publish-content-bundle.mjs writes writeBundle()'s output plus the
// current.json pointer, and prunes stale versions by default.
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { publishBundle } from './publish-content-bundle.mjs';

describe('publishBundle', () => {
  let dir;

  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('writes the bundle and a current.json pointer with the matching bundleVersion', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'publish-content-bundle-'));
    const { manifest, pointerPath } = await publishBundle({ outRoot: dir, resync: false });

    const pointer = JSON.parse(await readFile(pointerPath, 'utf-8'));
    expect(pointer).toEqual({ bundleVersion: manifest.bundleVersion });
    expect(pointerPath).toBe(path.join(dir, 'current.json'));

    const eras = JSON.parse(await readFile(path.join(dir, manifest.bundleVersion, 'eras.json'), 'utf-8'));
    expect(Array.isArray(eras)).toBe(true);
  }, 60_000);

  it('is deterministic: two publishes of the same content yield the same bundleVersion and pointer', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'publish-content-bundle-det-'));
    const first = await publishBundle({ outRoot: dir, resync: false, generatedAt: '2026-01-01T00:00:00.000Z' });
    const second = await publishBundle({ outRoot: dir, resync: false, generatedAt: '2026-06-01T00:00:00.000Z' });
    expect(first.manifest.bundleVersion).toBe(second.manifest.bundleVersion);
    const pointer = JSON.parse(await readFile(path.join(dir, 'current.json'), 'utf-8'));
    expect(pointer.bundleVersion).toBe(second.manifest.bundleVersion);
  }, 60_000);

  it('prunes stale <bundleVersion>/ directories by default (keepPrevious: false)', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'publish-content-bundle-prune-'));
    const staleDir = path.join(dir, 'stale-version-abc123');
    await mkdir(staleDir, { recursive: true });
    await writeFile(path.join(staleDir, 'eras.json'), '[]\n');

    const { manifest } = await publishBundle({ outRoot: dir, resync: false });

    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(dir, { withFileTypes: true });
    const dirNames = entries.filter((e) => e.isDirectory()).map((e) => e.name);
    expect(dirNames).toEqual([manifest.bundleVersion]);
  }, 60_000);

  it('keeps stale <bundleVersion>/ directories when keepPrevious is true', async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'publish-content-bundle-keep-'));
    const staleDir = path.join(dir, 'stale-version-def456');
    await mkdir(staleDir, { recursive: true });
    await writeFile(path.join(staleDir, 'eras.json'), '[]\n');

    const { manifest } = await publishBundle({ outRoot: dir, resync: false, keepPrevious: true });

    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(dir, { withFileTypes: true });
    const dirNames = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
    expect(dirNames).toEqual(['stale-version-def456', manifest.bundleVersion].sort());
  }, 60_000);
});
