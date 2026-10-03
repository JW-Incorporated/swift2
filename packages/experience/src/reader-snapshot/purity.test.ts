// The Fable gate (WP2.2): a snapshot build reads only its inputs. Sentinel
// providers that throw prove no provider is read; the static check proves
// reader-snapshot/** cannot import one.
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LOAD_SOURCE } from '@swift2/content';
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

  it('the transitive runtime import graph of reader-snapshot reaches no provider or injected corpus', async () => {
    const found = await reachedModules();
    expect(found.has('reader-snapshot/build.ts')).toBe(true);
    const offenders: string[] = [];
    for (const [rel, src] of found) {
      if (/-provider\.ts$/.test(rel)) offenders.push(`${rel}: is a provider module`);
      const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
      if (/\bset[A-Z]\w*(Provider|Lookup|Resolver|Catalogue)\b|\binjectedCorpus\b|\w+Injected\b/.test(code)) {
        offenders.push(`${rel}: defines/calls a provider setter or references injectedCorpus`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the import walker extracts every runtime import form and skips type-only ones', () => {
    const src = [
      "import a from './static';",
      "import { b,\n  c } from './multi-line';",
      "export * from './export-from';",
      "export { d } from './export-named';",
      "import './side-effect';",
      "import e = require('./import-equals');",
      "const f = require('./require-call');",
      "const g = await import('./dynamic');",
      "import type { T } from './type-only';",
      "export type { U } from './type-export';",
      "import type h = require('./type-equals');",
      "// import i from './commented';",
      "import pkg from 'not-local';",
    ].join('\n');
    expect(runtimeLocalSpecifiers(src).sort()).toEqual(
      ['./static', './multi-line', './export-from', './export-named', './side-effect', './import-equals', './require-call', './dynamic'].sort(),
    );
  });

  it('fromBundle maps load sources to state, offline beating the stale flag', () => {
    const at = (source: string, stale?: boolean) => fromBundle({ ...bundle, source, stale } as BundleLike, deps).state;
    expect(at(LOAD_SOURCE.lastGoodAfterDataError, true)).toBe('error');
    expect(at(LOAD_SOURCE.lastGoodAfterDataError)).toBe('error');
    expect(at(LOAD_SOURCE.offlineLastGood, true)).toBe('offline');
    expect(at(LOAD_SOURCE.offlineLastGood)).toBe('offline');
    expect(at(LOAD_SOURCE.network, true)).toBe('stale');
    expect(at(LOAD_SOURCE.network)).toBe('ready');
  });
});

const srcRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');

async function resolveLocal(from: string, spec: string): Promise<string | null> {
  const base = path.resolve(path.dirname(from), spec);
  for (const c of [`${base}.ts`, `${base}.tsx`, path.join(base, 'index.ts')]) {
    try {
      await readFile(c);
      return c;
    } catch {
      // not this extension
    }
  }
  return null;
}

async function reachedModules(): Promise<Map<string, string>> {
  const entries = (await readdir(path.join(srcRoot, 'reader-snapshot')))
    .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith('.d.ts'))
    .map((f) => path.join(srcRoot, 'reader-snapshot', f));
  const found = new Map<string, string>();
  const queue = [...entries];
  while (queue.length > 0) {
    const file = queue.pop()!;
    const rel = path.relative(srcRoot, file).split(path.sep).join('/');
    if (found.has(rel)) continue;
    const src = await readFile(file, 'utf-8');
    found.set(rel, src);
    for (const spec of runtimeLocalSpecifiers(src)) {
      const next = await resolveLocal(file, spec);
      if (next) queue.push(next);
    }
  }
  return found;
}

export function runtimeLocalSpecifiers(source: string): string[] {
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/^\s*import\s+type\s+\w+\s*=\s*require\([^)]*\)\s*;?/gm, '');
  const forms = [
    /(?:^|[;}\n])\s*(?:import|export)\s+(?!type\b)[^;'"]*?\bfrom\s*['"]([^'"]+)['"]/g,
    /(?:^|[;}\n])\s*import\s*['"]([^'"]+)['"]/g,
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  const out = new Set<string>();
  for (const re of forms) {
    for (const m of code.matchAll(re)) if (m[1]!.startsWith('.')) out.add(m[1]!);
  }
  return [...out];
}
