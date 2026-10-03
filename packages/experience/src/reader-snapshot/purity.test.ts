// The Fable gate (WP2.2): a snapshot build reads only its inputs. Sentinel
// providers that throw prove no provider is read; the static check proves
// reader-snapshot/** cannot import one.
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eraVideoFeed } from '@swift2/content-enrichment';
import { setContentItemLookup, getContentItemLookup } from '../content-item-provider';
import { setDefaultSongCatalogue, defaultSongCatalogue } from '../song-catalogue-provider';
import { setTracksRawProvider, tracksRawProvider } from '../track-catalogue-provider';
import {
  getEraSecretsRawProvider,
  getSongTargetResolver,
  getTheoriesRawProvider,
  getThreadContentProvider,
  setEraSecretsRawProvider,
  setSongTargetResolver,
  setTheoriesRawProvider,
  setThreadContentProvider,
} from '../thread-content-provider';
import { hashSnapshot } from './hash';
import { fromBundle, inputsFromBundle, type BundleLike } from './sources';
import { buildReaderSnapshot } from './build';
import type { ReaderSnapshotDeps } from './types';

const deps: ReaderSnapshotDeps = { eraVideoFeed };
const scripts = '../../../../scripts/';
let outRoot: string;
let bundle: BundleLike;

async function readBundle(dir: string): Promise<BundleLike> {
  const manifest = JSON.parse(await readFile(path.join(dir, 'manifest.json'), 'utf-8'));
  const files: Record<string, unknown> = {};
  for (const [name, entry] of Object.entries(manifest.files as Record<string, { path: string }>)) {
    files[name] = JSON.parse(await readFile(path.join(dir, entry.path), 'utf-8'));
  }
  return { manifest, files };
}

beforeAll(async () => {
  outRoot = await mkdtemp(path.join(tmpdir(), 'reader-snapshot-purity-'));
  const { writeBundle } = await import(/* @vite-ignore */ `${scripts}build-content-bundle.mjs`);
  bundle = await readBundle((await writeBundle({ outRoot, resync: false })).dir);
}, 240_000);

afterAll(async () => {
  if (outRoot) await rm(outRoot, { recursive: true, force: true });
});

const hashOf = async (b: BundleLike) => (await hashSnapshot(fromBundle(b, deps))).hash;

function withThrowingProviders<T>(fn: () => T): T {
  const prev = [
    getContentItemLookup(),
    getThreadContentProvider(),
    tracksRawProvider(),
    getTheoriesRawProvider(),
    getEraSecretsRawProvider(),
    getSongTargetResolver(),
    defaultSongCatalogue(),
  ] as const;
  const boom = (name: string) => () => {
    throw new Error(`provider read during a snapshot build: ${name}`);
  };
  setContentItemLookup(boom('contentItemLookup'));
  setThreadContentProvider(boom('threadContent'));
  setTracksRawProvider(new Proxy({}, { get: boom('tracksRaw'), ownKeys: boom('tracksRaw') }));
  setTheoriesRawProvider(boom('theoriesRaw'));
  setEraSecretsRawProvider(boom('eraSecretsRaw'));
  setSongTargetResolver(boom('songTarget'));
  setDefaultSongCatalogue(new Proxy([], { get: boom('songCatalogue') }) as never);
  try {
    return fn();
  } finally {
    setContentItemLookup(prev[0]);
    setThreadContentProvider(prev[1]);
    setTracksRawProvider(prev[2]);
    setTheoriesRawProvider(prev[3]);
    setEraSecretsRawProvider(prev[4]);
    setSongTargetResolver(prev[5]);
    setDefaultSongCatalogue(prev[6]);
  }
}

describe('snapshot derivation is pure over its inputs', () => {
  it('builds under throwing providers and hashes the same as without them', async () => {
    const plain = await hashOf(bundle);
    const sentinel = withThrowingProviders(() => fromBundle(bundle, deps));
    expect((await hashSnapshot(sentinel)).hash).toBe(plain);
  });

  it('does not let one build leak into an interleaved build', async () => {
    const files = structuredClone(bundle.files);
    const era = (files.theories as { theories: { title: string }[] }[]).find((f) => f.theories.length > 0)!;
    era.theories[0]!.title = 'leak';
    const other = { ...bundle, files };
    const a1 = await hashOf(bundle);
    const b1 = await hashOf(other);
    const a2 = await hashOf(bundle);
    expect(b1).not.toBe(a1);
    expect(a2).toBe(a1);
    expect(await hashOf(other)).toBe(b1);
  });

  it('buildReaderSnapshot over inputs equals fromBundle (no hidden state)', async () => {
    const snap = buildReaderSnapshot(inputsFromBundle(bundle), deps, { kind: 'bundle', bundleVersion: 'x' });
    expect((await hashSnapshot(snap)).hash).toBe(await hashOf(bundle));
  });

  it('reader-snapshot sources import no provider module or injected wrapper', async () => {
    const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
    const files = (await readdir(dir)).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'));
    const wrappers = new Set([
      'injectedCorpus',
      'contentForThread',
      'threadPoints',
      'threadsInEra',
      'threadDoorwaysForEra',
      'eggDoorwaysForEra',
      'theoriesForEra',
      'eraSecretsForEra',
      'resolveEraSecretLink',
      'tracksForEra',
      'nextTrackOnAlbum',
      'keepExploring',
      'songTargetOf',
      'resolveConnections',
    ]);
    for (const f of files) {
      const src = await readFile(path.join(dir, f), 'utf-8');
      for (const m of src.matchAll(/^import\s+(type\s+)?([^;]*?)\s+from\s+['"]([^'"]+)['"]/gms)) {
        const [, typeOnly, clause, from] = m;
        expect(/-provider$/.test(from!), `${f} imports ${from}`).toBe(false);
        if (typeOnly) continue;
        const names = clause!.replace(/\btype\s+\w+/g, '').match(/\w+/g) ?? [];
        const hit = names.filter((n) => wrappers.has(n));
        expect(hit, `${f} imports injected wrappers from ${from}`).toEqual([]);
      }
    }
  });
});
