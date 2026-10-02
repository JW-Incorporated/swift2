// CI equivalence gate (docs/proposals/2026-10-02-one-ui-three-surfaces.md §4.2):
// the snapshot built from the web's baked modules and the one built from the
// D1 bundle produced from the same commit must hash equal. The web modules and
// the bundle script are imported dynamically by path: they live in apps/web
// and scripts/, outside this package's typecheck graph.
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { diffSnapshots, hashSnapshot } from './hash';
import { fromBaked, fromBundle, type BakedModules, type BundleLike } from './sources';
import type { ReaderSnapshot, ReaderSnapshotDeps } from './types';

const deps: ReaderSnapshotDeps = { eraVideoFeed };
const web = '../../../../apps/web/lib/longlive/';
const scripts = '../../../../scripts/';

let outRoot: string;
let bundle: BundleLike;
let baked: ReaderSnapshot;
let fromFiles: ReaderSnapshot;

async function loadBakedModules(): Promise<BakedModules> {
  const [content, tracks, theories, videos, secrets, merch, moods, search] = await Promise.all([
    import(/* @vite-ignore */ `${web}content`),
    import(/* @vite-ignore */ `${web}tracks`),
    import(/* @vite-ignore */ `${web}theories`),
    import(/* @vite-ignore */ `${web}videos`),
    import(/* @vite-ignore */ `${web}era-secrets`),
    import(/* @vite-ignore */ `${web}merch`),
    import(/* @vite-ignore */ `${web}song-moods.generated`),
    import(/* @vite-ignore */ `${web}search`),
  ]);
  const { ERAS } = await import('../eras');
  return {
    ERAS,
    CONTENT: content.CONTENT,
    MILESTONES: content.MILESTONES,
    MERCH_CATALOGUE: merch.MERCH_CATALOGUE,
    SONG_MOODS: moods.SONG_MOODS,
    tracksForEra: tracks.tracksForEra,
    theoriesForEra: theories.theoriesForEra,
    allVideoRecordsForEra: videos.allVideoRecordsForEra,
    eraSecretsForEra: secrets.eraSecretsForEra,
    getSearchIndex: search.getSearchIndex,
  };
}

async function readBundle(dir: string): Promise<BundleLike> {
  const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf-8'));
  const files: Record<string, unknown> = {};
  for (const [name, entry] of Object.entries(manifest.files as Record<string, { path: string }>)) {
    files[name] = JSON.parse(await readFile(path.join(dir, entry.path), 'utf-8'));
  }
  return { manifest, files };
}

beforeAll(async () => {
  outRoot = await mkdtemp(path.join(tmpdir(), 'reader-snapshot-'));
  const { writeBundle } = await import(/* @vite-ignore */ `${scripts}build-content-bundle.mjs`);
  const { dir } = await writeBundle({ outRoot, resync: false });
  bundle = await readBundle(dir);
  // Baked first: fromBundle re-wires the core's global providers to the bundle.
  baked = fromBaked(await loadBakedModules(), deps);
  fromFiles = fromBundle(bundle, deps);
}, 240_000);

afterAll(async () => {
  if (outRoot) await rm(outRoot, { recursive: true, force: true });
});

describe('ReaderSnapshot equivalence (baked vs D1 bundle, same commit)', () => {
  it('hashes equal; on mismatch names every diverging domain', async () => {
    const diverging = await diffSnapshots(baked, fromFiles);
    expect(diverging, `diverging domains: ${diverging.join(', ')}`).toEqual([]);
    expect((await hashSnapshot(baked)).hash).toBe((await hashSnapshot(fromFiles)).hash);
  });

  it('is deterministic: rebuilding from the same bundle hashes the same', async () => {
    const again = fromBundle(bundle, deps);
    expect((await hashSnapshot(again)).hash).toBe((await hashSnapshot(fromFiles)).hash);
  });

  it('a deliberately diverged bundle fails and names the domain', async () => {
    type TheoryFiles = { theories: { title: string }[] }[];
    const files = structuredClone(bundle.files);
    const era = (files.theories as TheoryFiles).find((f) => f.theories.length > 0)!;
    era.theories[0]!.title = `${era.theories[0]!.title} (diverged)`;
    const diverged = fromBundle({ ...bundle, files }, deps);
    const names = await diffSnapshots(baked, diverged);
    expect(names).toContain('theories');
    expect(names).not.toContain('milestones');
    fromBundle(bundle, deps); // restore the providers for later tests
  });

  it('carries version and state; state and origin never change the hash', async () => {
    expect(baked.version).toBe(1);
    expect(baked.state).toBe('ready');
    const stale = fromBundle({ ...bundle, stale: true }, deps);
    expect(stale.state).toBe('stale');
    expect((await hashSnapshot(stale)).hash).toBe((await hashSnapshot(fromFiles)).hash);
  });
});
