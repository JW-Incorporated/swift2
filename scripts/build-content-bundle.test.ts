// OS-011 tests (docs/specs/2026-09-05-one-source-three-surfaces.md §6):
// scripts/build-content-bundle.mjs's Done when is "running it twice yields
// identical hashes" — these tests cover the pure determinism math directly
// (bundleVersion/manifest hashing) plus an end-to-end run against the real
// repo content, asserting two builds produce a byte-identical bundleVersion
// and identical per-file bytes (generatedAt aside).
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assembleBundleEntries,
  buildManifest,
  bundleVersionOf,
  renderJson,
  sha256,
  validateBundleEntries,
  writeBundle,
} from './build-content-bundle.mjs';
import * as schema from '../packages/content/src/schema';

describe('sha256 / bundleVersionOf', () => {
  it('bundleVersionOf is a pure hash of sorted "name:sha256" pairs, order-independent', () => {
    const a = bundleVersionOf({ b: 'hash-b', a: 'hash-a' });
    const b = bundleVersionOf({ a: 'hash-a', b: 'hash-b' });
    expect(a).toBe(b);
    expect(a).toBe(sha256('a:hash-a\nb:hash-b'));
  });

  it('changing any single file hash changes bundleVersion', () => {
    const a = bundleVersionOf({ a: 'hash-a', b: 'hash-b' });
    const b = bundleVersionOf({ a: 'hash-a', b: 'DIFFERENT' });
    expect(a).not.toBe(b);
  });
});

describe('buildManifest', () => {
  it('builds a manifest whose bundleVersion is deterministic across identical inputs, generatedAt aside', () => {
    const fileBuffers = {
      eras: { buffer: Buffer.from('[]\n'), path: 'eras.json' },
      milestones: { buffer: Buffer.from('[]\n'), path: 'milestones.json' },
    };
    const m1 = buildManifest(fileBuffers, '2026-01-01T00:00:00.000Z');
    const m2 = buildManifest(fileBuffers, '2026-06-01T00:00:00.000Z');
    expect(m1.bundleVersion).toBe(m2.bundleVersion);
    expect(m1.generatedAt).not.toBe(m2.generatedAt);
    expect(m1.schemaVersion).toBe(1);
    expect(Object.keys(m1.files)).toEqual(['eras', 'milestones']);
  });
});

describe('assembleBundleEntries', () => {
  const fixtureSources = {
    ERAS: [
      {
        id: 'folklore',
        name: 'folklore',
        shortName: 'folklore',
        album: 'folklore',
        start: '2020-07-24',
        end: '2020-12-10',
        yearLabel: '2020',
        tagline: 'Wistful.',
        intro: 'A surprise turn.',
        image: '/eras/folklore.png',
        theme: {
          bg: '#1a1a1a',
          surface: '#2a2a2a',
          surface2: '#333333',
          ink: '#f5f5f5',
          inkSoft: '#cccccc',
          line: '#444444',
          accent: '#8a8a6d',
          accent2: '#5f5f4a',
          glow: '#c8c8a8',
          font: 'serif',
        },
      },
    ],
    MILESTONES: [
      { id: 'ms-folklore-release', eraId: 'folklore', date: '2020-07-24', label: 'folklore released', kind: 'album' },
    ],
    CONTENT: [
      {
        id: 'vault-folklore-001',
        eraId: 'folklore',
        date: '2020-07-24',
        dateLabel: 'July 24, 2020',
        title: 'folklore released',
        summary: 'Surprise drop.',
        body: ['Surprise drop.'],
        tags: ['Music'],
        images: [{ url: '/eras/folklore.png', kind: 'primary' }],
        sources: [{ name: 'RS', url: 'https://example.com/a' }],
      },
    ],
    perEra: [
      {
        eraId: 'folklore',
        tracks: [
          {
            slug: 'the-1',
            trackNumber: 1,
            title: 'the 1',
            note: 'Opens the album.',
            sources: [{ name: 'RS', url: 'https://example.com/b' }],
          },
        ],
        theories: [
          {
            slug: 'triangle',
            kind: 'theory',
            title: 'Triangle',
            claim: 'x',
            evidence: null,
            confidence: 'official',
            outcome: 'confirmed',
            sources: [{ name: 'EW', url: 'https://example.com/c' }],
          },
        ],
        videos: [],
        eraSecrets: [
          {
            slug: 's1',
            title: 'Secret',
            secret: 'A fact.',
            sources: [{ name: 'N', url: 'https://example.com/d' }],
          },
        ],
      },
    ],
    SONG_MOODS: [{ slug: 'the-1', title: 'the 1', eraId: 'folklore' }],
    LORE: [
      {
        id: 'lore-1',
        status: 'debunked',
        date: '2020-07-25',
        lastCheckedOn: '2020-08-01',
        headline: 'H',
        detail: 'D',
        sources: [{ name: 'RS', url: 'https://example.com/e' }],
      },
    ],
    MERCH_CATALOGUE: { shopTheLook: [], officialStore: [], fanMade: [] },
  };

  it('emits one eras/<eraId>.json entry per era, filtered from CONTENT', () => {
    const entries = assembleBundleEntries(fixtureSources);
    expect(entries['content:folklore']).toMatchObject({ path: 'eras/folklore.json' });
    expect(entries['content:folklore'].value.items).toHaveLength(1);
    expect(entries['content:folklore'].value.items[0].id).toBe('vault-folklore-001');
  });

  it('wraps eraSecrets as { eraId, secrets } (renaming the field from perEra.eraSecrets)', () => {
    const entries = assembleBundleEntries(fixtureSources);
    expect(entries.eraSecrets.value).toEqual([{ eraId: 'folklore', secrets: fixtureSources.perEra[0].eraSecrets }]);
  });

  it('wraps clownbotLore/songMoods as their bundle-file shape', () => {
    const entries = assembleBundleEntries(fixtureSources);
    expect(entries.clownbotLore.value).toEqual({ lore: fixtureSources.LORE });
    expect(entries.songMoods.value).toEqual({ songs: fixtureSources.SONG_MOODS });
  });

  it('every assembled entry validates against its OS-010 schema', () => {
    const entries = assembleBundleEntries(fixtureSources);
    expect(() => validateBundleEntries(entries, schema)).not.toThrow();
  });

  it('validateBundleEntries throws on a malformed entry (e.g. a bad theory outcome)', () => {
    const entries = assembleBundleEntries(fixtureSources);
    entries.theories.value[0].theories[0].outcome = 'not-a-real-outcome';
    expect(() => validateBundleEntries(entries, schema)).toThrow(/theories/);
  });
});

describe('renderJson', () => {
  it('is stable, 2-space indented, trailing-newline JSON', () => {
    expect(renderJson({ b: 1, a: 2 })).toBe('{\n  "b": 1,\n  "a": 2\n}\n');
  });
});

// End-to-end: builds the REAL repo content bundle twice (skips the
// resync-generators step — check:generated already covers that drift
// separately and re-running every sync-longlive-*.mjs per test run here
// would make this test slow and dependent on the working tree's git state)
// and asserts OS-011's own done-when: identical bundleVersion + identical
// non-manifest file bytes, generatedAt aside.
describe('writeBundle (end-to-end, real content)', () => {
  it('two builds from the same seed content yield identical hashes', async () => {
    const dir1 = await mkdtemp(path.join(os.tmpdir(), 'content-bundle-1-'));
    const dir2 = await mkdtemp(path.join(os.tmpdir(), 'content-bundle-2-'));
    try {
      const { manifest: m1, dir: outDir1 } = await writeBundle({
        outRoot: dir1,
        generatedAt: '2026-01-01T00:00:00.000Z',
        resync: false,
      });
      const { manifest: m2, dir: outDir2 } = await writeBundle({
        outRoot: dir2,
        generatedAt: '2026-06-01T00:00:00.000Z',
        resync: false,
      });

      expect(m1.bundleVersion).toBe(m2.bundleVersion);
      expect(Object.keys(m1.files).sort()).toEqual(Object.keys(m2.files).sort());

      for (const name of Object.keys(m1.files)) {
        const p1 = path.join(outDir1, m1.files[name].path);
        const p2 = path.join(outDir2, m2.files[name].path);
        const [b1, b2] = await Promise.all([readFile(p1), readFile(p2)]);
        expect(b1.equals(b2), `${name}: file bytes differ between runs`).toBe(true);
        expect(m1.files[name].sha256).toBe(m2.files[name].sha256);
        expect(m1.files[name].bytes).toBe(m2.files[name].bytes);
      }
    } finally {
      await rm(dir1, { recursive: true, force: true });
      await rm(dir2, { recursive: true, force: true });
    }
  }, 60_000);

  it('splits content per era into dist/content-bundle/<version>/eras/<eraId>.json', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'content-bundle-eras-'));
    try {
      const { manifest, dir: outDir } = await writeBundle({ outRoot: dir, resync: false });
      const folkloreEntry = manifest.files['content:folklore'];
      expect(folkloreEntry).toBeDefined();
      expect(folkloreEntry.path).toBe('eras/folklore.json');
      const raw = JSON.parse(await readFile(path.join(outDir, folkloreEntry.path), 'utf-8'));
      expect(raw.eraId).toBe('folklore');
      expect(Array.isArray(raw.items)).toBe(true);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
}, 90_000);
