#!/usr/bin/env node
// OS-011 (docs/specs/2026-09-05-one-source-three-surfaces.md §6): the one
// deterministic script that produces the published content bundle — the
// single artifact `packages/content`'s loader (OS-013), the web build
// (OS-014), and the mobile app (OS-015) will all read from (D1: "Content is
// an artifact, not a database").
//
// Source of truth, transitively: supabase/seed/** — the same files every
// scripts/sync-longlive-*.mjs generator reads. This script does NOT
// re-implement seed parsing: it (1) re-runs those generators so the
// apps/web/lib/longlive/*.generated.ts intermediates are fresh, then (2)
// imports the already-normalized, already-deduped, already-sorted TS
// modules that sit on top of them (content.ts, tracks.ts, theories.ts,
// videos.ts, era-secrets.ts, merch.ts, clownbot-lore.ts, eras.ts) — the
// exact same objects the website already renders from. That is what "the
// same sources the sync scripts read" (this card's Goal) means in practice:
// re-deriving the enrichment logic here (thread-id defaults, image
// fallbacks, milestone extraction, playable-video filtering, …) would be a
// second copy of that logic that WILL drift; importing the modules that
// already own it cannot.
//
// Output layout: dist/content-bundle/<bundleVersion>/
//   manifest.json        — { schemaVersion, bundleVersion, generatedAt, files }
//   eras.json             — Era[] (all eras, chronological)
//   milestones.json       — Milestone[] (all eras)
//   eras/<eraId>.json     — { eraId, items } — one file per era (OS-011 Steps)
//   tracks.json           — TracksBundleFile[] (one entry per era)
//   theories.json         — TheoriesBundleFile[] (one entry per era)
//   videos.json           — VideosBundleFile[] (one entry per era)
//   era-secrets.json      — EraSecretsBundleFile[] (one entry per era)
//   song-moods.json       — SongMoodsBundleFile ({ songs }) — already cross-era
//   clownbot-lore.json    — ClownbotLoreBundleFile ({ lore }) — already cross-era
//   merch.json            — MerchCatalogue ({ shopTheLook, officialStore, fanMade })
//
// Determinism (OS-011 Done when: "running it twice yields identical
// hashes"): every content file's key order comes straight from the
// hand-authored/generated TS modules' own stable iteration order (ERAS'
// authored array order, CONTENT's era-then-authored-order flatMap, etc.) —
// nothing here re-sorts by a non-deterministic key (object insertion order,
// Set iteration order, etc.). `bundleVersion` is a hash of every file's own
// hash (see manifestFor()), NOT a timestamp/counter, so two builds from
// byte-identical seed content produce the same bundleVersion even though
// `generatedAt` (an audit-only field, deliberately excluded from the hash)
// differs between the two runs.
//
// `check:content-bundle` (scripts/check-content-bundle-determinism.mjs)
// builds the bundle twice into separate temp directories and fails CI if
// bundleVersion or any individual file's bytes differ — the same
// stale-vault-can't-merge guarantee scripts/check-generated-in-sync.mjs
// gives the *.generated.ts intermediates, applied to this artifact.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { register } from 'tsx/esm/api';
import { ROOT, SYNCS, OTHER_SYNC_TARGETS } from './lib/generated-content.mjs';
import { runMain } from './lib/cli.mjs';

const SCHEMA_FILE = path.join(ROOT, 'packages', 'content', 'src', 'schema.ts');
const DEFAULT_OUT_ROOT = path.join(ROOT, 'dist', 'content-bundle');

export const SCHEMA_VERSION = 1;

/** sha256 hex digest of a Buffer/string. Exported for tests. */
export function sha256(data) {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Deterministic content hash of a set of already-hashed files: sorted by
 * name, `name:sha256` per line, hashed as one string. NOT a timestamp or
 * counter — same convention as scripts/generate-content-fixture-manifest.mjs
 * (OS-010), which this bundle's manifest.json is a direct scale-up of.
 * Exported for tests.
 */
export function bundleVersionOf(fileHashes) {
  return sha256(
    Object.keys(fileHashes)
      .sort()
      .map((name) => `${name}:${fileHashes[name]}`)
      .join('\n'),
  );
}

/**
 * Builds the manifest object from a `name -> Buffer` map of already-rendered
 * file contents. Pure (no I/O, no Date.now() side effect beyond the passed
 * `generatedAt`) so it's directly unit-testable. `files` keys are inserted
 * in sorted order, same as OS-010's fixture generator.
 */
export function buildManifest(fileBuffers, generatedAt) {
  const files = {};
  const hashes = {};
  for (const name of Object.keys(fileBuffers).sort()) {
    const buf = fileBuffers[name].buffer;
    const sha = sha256(buf);
    hashes[name] = sha;
    files[name] = { path: fileBuffers[name].path, sha256: sha, bytes: buf.byteLength };
  }
  return {
    schemaVersion: SCHEMA_VERSION,
    bundleVersion: bundleVersionOf(hashes),
    generatedAt,
    files,
  };
}

/** Canonical, stable JSON serialization: 2-space indent, trailing newline. */
export function renderJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** Re-run every scripts/sync-longlive-*.mjs generator (and the other
 * generated-content targets, e.g. scripts/lib/source-tiers.generated.mjs,
 * which sync-longlive-content.mjs's CONFIDENCE_VALUES import transitively
 * relies on) so every *.generated.ts/.mjs intermediate this script imports
 * is fresh off supabase/seed/**. Mirrors scripts/check-generated-in-sync
 * .mjs's own resync step (SYNCS + OTHER_SYNC_TARGETS) exactly — omitting
 * OTHER_SYNC_TARGETS here would let a bundle build silently read a stale
 * source-tiers mirror instead of failing loudly the way a missing file
 * would. */
function resyncGeneratedIntermediates() {
  for (const s of SYNCS) {
    execFileSync(process.execPath, [path.join(ROOT, s)], { stdio: ['ignore', 'ignore', 'inherit'] });
  }
  for (const { sync } of OTHER_SYNC_TARGETS) {
    execFileSync(process.execPath, [path.join(ROOT, sync)], { stdio: ['ignore', 'ignore', 'inherit'] });
  }
}

/**
 * Loads every longlive TS module this bundle needs via a `tsx`-run child
 * process (scripts/lib/dump-longlive-sources.ts) that imports them and
 * prints one JSON object to stdout. A child process, not tsx's in-process
 * register()/unregister() API: importing content.ts's real module graph
 * (which cycles through eras.ts, content-vault.generated.ts, etc.) inside
 * this already-running process hits Node's ERR_REQUIRE_CYCLE_MODULE — the
 * same interop hazard scripts/sync-source-tiers.mjs never hits because
 * source-tiers.ts is a leaf module with no such cycle. A child process
 * sidesteps it entirely: tsx owns that process's module loading from the
 * start, exactly like a human running `tsx some-script.ts` directly. The
 * OS-010 zod schema module (packages/content/src/schema.ts) has no such
 * cycle and is loaded separately, in-process, via tsx's ESM API.
 */
async function loadSources() {
  const dumpScript = path.join(ROOT, 'scripts', 'lib', 'dump-longlive-sources.ts');
  const tsxCli = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const stdout = execFileSync(process.execPath, [tsxCli, dumpScript], {
    cwd: ROOT,
    encoding: 'utf-8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'inherit'],
    // OS-014b-2: this child process's module graph passes through
    // apps/web/lib/longlive/{content,tracks}.ts (era-secrets.ts ->
    // content.ts; the dump script's own `tracks.generated` import wires the
    // provider those modules read through). Both now prefer the PUBLISHED
    // bundle over recomputing from the generated data — exactly the thing
    // this script is in the middle of producing. Reading a possibly-stale
    // on-disk bundle here would let a fresh build silently mix new era data
    // with an old published snapshot, so this env var (see
    // apps/web/lib/longlive/bundle-source.ts's module doc) forces both
    // modules to always recompute fresh in this process.
    env: { ...process.env, LONGLIVE_BUNDLE_BUILD: '1' },
  });
  const dumped = JSON.parse(stdout);

  const unregister = register();
  let schema;
  try {
    schema = await import(pathToFileURL(SCHEMA_FILE).href);
  } finally {
    await unregister();
  }

  return {
    ERAS: dumped.ERAS,
    MILESTONES: dumped.MILESTONES,
    CONTENT: dumped.CONTENT,
    perEra: dumped.perEra,
    SONG_MOODS: dumped.SONG_MOODS,
    LORE: dumped.LORE,
    MERCH_CATALOGUE: dumped.MERCH_CATALOGUE,
    schema,
  };
}

/**
 * Assembles the full set of `{ name -> { value, path } }` bundle entries
 * (pre-JSON-render) from the loaded sources. Pure given `sources` — no I/O.
 * Exported for tests: a test can call this directly with a fixture-shaped
 * `sources` object without importing the real (large) production data.
 */
export function assembleBundleEntries(sources) {
  const { ERAS, MILESTONES, CONTENT, perEra, MERCH_CATALOGUE, SONG_MOODS, LORE } = sources;

  const entries = {};

  entries.eras = { value: ERAS, path: 'eras.json' };
  entries.milestones = { value: MILESTONES, path: 'milestones.json' };

  for (const era of ERAS) {
    const items = CONTENT.filter((c) => c.eraId === era.id);
    entries[`content:${era.id}`] = {
      value: { eraId: era.id, items },
      path: `eras/${era.id}.json`,
    };
  }

  entries.tracks = {
    value: perEra.map(({ eraId, tracks }) => ({ eraId, tracks })),
    path: 'tracks.json',
  };
  entries.theories = {
    value: perEra.map(({ eraId, theories }) => ({ eraId, theories })),
    path: 'theories.json',
  };
  entries.videos = {
    value: perEra.map(({ eraId, videos }) => ({ eraId, videos })),
    path: 'videos.json',
  };
  entries.eraSecrets = {
    value: perEra.map(({ eraId, eraSecrets }) => ({ eraId, secrets: eraSecrets })),
    path: 'era-secrets.json',
  };

  entries.songMoods = { value: { songs: SONG_MOODS }, path: 'song-moods.json' };
  entries.clownbotLore = { value: { lore: [...LORE] }, path: 'clownbot-lore.json' };
  entries.merch = { value: MERCH_CATALOGUE, path: 'merch.json' };

  return entries;
}

/**
 * Validates every non-manifest entry against its OS-010 zod schema —
 * per-era array domains (tracks/theories/videos/eraSecrets) are validated
 * element-by-element against their existing single-era schema rather than
 * requiring a new array-wrapper schema in packages/content (keeps this card
 * from touching OS-010's already-reviewed schema.ts). Throws on the first
 * failure with a message naming the entry.
 */
export function validateBundleEntries(entries, schema) {
  const {
    eraSchema,
    milestoneSchema,
    contentBundleFileSchema,
    tracksBundleFileSchema,
    theoriesBundleFileSchema,
    videosBundleFileSchema,
    eraSecretsBundleFileSchema,
    songMoodsBundleFileSchema,
    clownbotLoreBundleFileSchema,
    merchCatalogueSchema,
  } = schema;

  const fail = (name, result) => {
    throw new Error(
      `build-content-bundle: "${name}" failed schema validation: ${JSON.stringify(result.error.issues)}`,
    );
  };
  const check = (name, zodSchema, value) => {
    const result = zodSchema.safeParse(value);
    if (!result.success) fail(name, result);
  };
  const checkEach = (name, zodSchema, arr) => {
    arr.forEach((item, i) => {
      const result = zodSchema.safeParse(item);
      if (!result.success) fail(`${name}[${i}]`, result);
    });
  };

  for (const [name, { value }] of Object.entries(entries)) {
    if (name === 'eras') check(name, eraSchema.array(), value);
    else if (name === 'milestones') check(name, milestoneSchema.array(), value);
    else if (name.startsWith('content:')) check(name, contentBundleFileSchema, value);
    else if (name === 'tracks') checkEach(name, tracksBundleFileSchema, value);
    else if (name === 'theories') checkEach(name, theoriesBundleFileSchema, value);
    else if (name === 'videos') checkEach(name, videosBundleFileSchema, value);
    else if (name === 'eraSecrets') checkEach(name, eraSecretsBundleFileSchema, value);
    else if (name === 'songMoods') check(name, songMoodsBundleFileSchema, value);
    else if (name === 'clownbotLore') check(name, clownbotLoreBundleFileSchema, value);
    else if (name === 'merch') check(name, merchCatalogueSchema, value);
    else throw new Error(`build-content-bundle: no schema mapped for entry "${name}"`);
  }
}

/**
 * Writes the bundle to `outRoot/<bundleVersion>/…`. Returns the manifest and
 * the resolved output directory. `generatedAt` is injectable for tests that
 * need a fixed timestamp; defaults to now.
 */
export async function writeBundle({ outRoot = DEFAULT_OUT_ROOT, generatedAt = new Date().toISOString(), resync = true } = {}) {
  if (resync) resyncGeneratedIntermediates();
  const sources = await loadSources();
  const entries = assembleBundleEntries(sources);
  validateBundleEntries(entries, sources.schema);

  const fileBuffers = {};
  for (const [name, { value, path: relPath }] of Object.entries(entries)) {
    fileBuffers[name] = { buffer: Buffer.from(renderJson(value), 'utf-8'), path: relPath };
  }
  const manifest = buildManifest(fileBuffers, generatedAt);

  const dir = path.join(outRoot, manifest.bundleVersion);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const { buffer, path: relPath } of Object.values(fileBuffers)) {
    const dest = path.join(dir, relPath);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, buffer);
  }
  await writeFile(path.join(dir, 'manifest.json'), renderJson(manifest));

  return { manifest, dir };
}

async function main() {
  const outRootArg = process.argv.find((a) => a.startsWith('--out-root='));
  const outRoot = outRootArg ? path.resolve(outRootArg.slice('--out-root='.length)) : DEFAULT_OUT_ROOT;
  const { manifest, dir } = await writeBundle({ outRoot });
  console.log(
    `Built content bundle bundleVersion=${manifest.bundleVersion} (${Object.keys(manifest.files).length} files) -> ${path.relative(ROOT, dir)}`,
  );
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'build-content-bundle' });
}
