#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/content-ids.generated.ts — the literal
// id/key unions `types.ts` needs (era ids, track keys, theory ids, video ids,
// song slugs) WITHOUT `types.ts` importing the ~20k lines of content data
// those ids are drawn from (Fable 5.1 architecture review, R10; see
// docs/reviews/2026-09-fable-architecture-review.md §1.3/§3.2).
//
// Before this file, `types.ts` imported `tracks.generated.ts`,
// `theories.generated.ts`, `videos.generated.ts`, `song-moods.generated.ts`,
// and `era-secrets.generated.ts` directly just to derive these literal
// unions, making the "types" module transitively depend on the whole
// content corpus. This generator reads the same seed files those four
// generators read (reusing their exported pure `build*Guide` functions —
// SOURCE OF TRUTH stays the seeds, not another generated file, so this has
// no ordering dependency on when the other syncs run) and emits ONLY the id
// arrays. `types.ts` imports just this file.
//
// Pure functions are exported for scripts/sync-longlive-content-ids.test.ts;
// `main` only runs when the file is invoked directly (same convention as
// every other sync-longlive-*.mjs).

import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, SLUG_TO_ERA_ID, esc } from './lib/longlive-sync-shared.mjs';
import { buildTrackGuide } from './sync-longlive-tracks.mjs';
import { buildTheoryGuide } from './sync-longlive-theories.mjs';
import { buildVideoGuide } from './sync-longlive-videos.mjs';

const ERAS_SEED_FILE = path.join(ROOT, 'supabase', 'seed', 'eras-data.mjs');
const TRACKS_SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'tracks');
const THEORIES_SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'theories');
const VIDEOS_SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'videos');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'content-ids.generated.ts');

/**
 * The 12 EraIds, in the same chronological order as the hand-authored `ERAS`
 * array in `eras.ts` (source: `supabase/seed/eras-data.mjs`'s `sort_order`).
 * Order matters here only for a stable, readable diff — nothing downstream
 * depends on EraId union member order.
 */
export async function loadEraIds() {
  const mod = await import(pathToFileURL(ERAS_SEED_FILE).href);
  const { eras } = mod.default ?? mod;
  return [...eras]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((e) => SLUG_TO_ERA_ID[e.slug] ?? e.slug);
}

async function loadSeedFiles(dir, skipDossiers = false) {
  const files = (await readdir(dir)).filter(
    (f) => f.endsWith('.mjs') && !f.startsWith('_') && !(skipDossiers && f.endsWith('.dossiers.mjs')),
  );
  const out = [];
  for (const file of files.sort()) {
    out.push(await import(pathToFileURL(path.join(dir, file)).href));
  }
  return out;
}

async function loadTrackEntries() {
  const mods = await loadSeedFiles(TRACKS_SEED_DIR, true);
  const entries = [];
  for (const mod of mods) {
    const { eraSlug, tracks } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(tracks)) continue;
    for (const t of tracks) entries.push({ eraSlug, ...t });
  }
  return entries;
}

async function loadTheoryEntries() {
  const mods = await loadSeedFiles(THEORIES_SEED_DIR);
  const entries = [];
  for (const mod of mods) {
    const { eraSlug, theories } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(theories)) continue;
    for (const t of theories) entries.push({ eraSlug, ...t });
  }
  return entries;
}

async function loadVideoEntries() {
  const mods = await loadSeedFiles(VIDEOS_SEED_DIR);
  const entries = [];
  for (const mod of mods) {
    const { eraSlug, videos } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(videos)) continue;
    for (const v of videos) entries.push({ eraSlug, ...v });
  }
  return entries;
}

/**
 * `${EraId}:${slug}` ids for every renderable track that has a `slug`
 * (some legacy rows don't — see TrackNote.slug), sorted for a stable diff.
 *
 * NOT the same thing as `trackKey()` in `tracks.ts` (the
 * `${eraId}::${trackNumber}::${title}` composite key used for deep-linking
 * and the store's `?song=` share URL) — that key has no stable slug
 * component and can't be derived here. This is the slug-based sibling to
 * `SongSlug`/the `song:<slug>` RelatedId convention, named `TrackSlugId` to
 * avoid colliding with (or being mistaken for) that existing `trackKey`.
 */
export function trackSlugIdsFrom(byEra) {
  const keys = [];
  for (const eraId of Object.keys(byEra).sort()) {
    for (const t of byEra[eraId]) {
      if (t.slug) keys.push(`${eraId}:${t.slug}`);
    }
  }
  return keys.sort();
}

/** Every distinct track slug across all eras (slugs are authored globally
 * unique — see the `song:<slug>` RelatedId convention in types.ts). */
export function songSlugsFrom(byEra) {
  const slugs = new Set();
  for (const eraId of Object.keys(byEra)) {
    for (const t of byEra[eraId]) {
      if (t.slug) slugs.add(t.slug);
    }
  }
  return [...slugs].sort();
}

/** `${EraId}:${slug}` keys for every theory/easter-egg record. */
export function theoryIdsFrom(byEra) {
  const keys = [];
  for (const eraId of Object.keys(byEra).sort()) {
    for (const t of byEra[eraId]) keys.push(`${eraId}:${t.slug}`);
  }
  return keys.sort();
}

/** `${EraId}:${slug}` keys for every video record. */
export function videoIdsFrom(byEra) {
  const keys = [];
  for (const eraId of Object.keys(byEra).sort()) {
    for (const v of byEra[eraId]) keys.push(`${eraId}:${v.slug}`);
  }
  return keys.sort();
}

/** Render the generated TypeScript module. Pure string building. */
export function renderModule({ eraIds, trackSlugIds, songSlugs, theoryIds, videoIds }) {
  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-longlive-content-ids.mjs from supabase/seed/**.');
  lines.push("// Re-run that script after seed changes; don't edit this file directly.");
  lines.push('//');
  lines.push('// The literal id/key unions `types.ts` derives from the content corpus —');
  lines.push('// split out (Fable 5.1 review, R10) so `types.ts` itself stays a leaf and');
  lines.push('// does not transitively depend on ~20k lines of generated content data.');
  lines.push('');
  const emit = (name, typeName, values) => {
    lines.push(`export const ${name} = [`);
    for (const v of values) lines.push(`  ${esc(v)},`);
    lines.push('] as const;');
    lines.push(`export type ${typeName} = (typeof ${name})[number];`);
    lines.push('');
  };
  emit('ERA_IDS', 'EraId', eraIds);
  emit('TRACK_SLUG_IDS', 'TrackSlugId', trackSlugIds);
  emit('SONG_SLUGS', 'SongSlug', songSlugs);
  emit('THEORY_IDS', 'TheoryId', theoryIds);
  emit('VIDEO_IDS', 'VideoId', videoIds);
  return lines.join('\n').replace(/\n+$/, '\n');
}

async function build() {
  const eraIds = await loadEraIds();
  const trackByEra = buildTrackGuide(await loadTrackEntries());
  const theoryByEra = buildTheoryGuide(await loadTheoryEntries());
  const videoByEra = buildVideoGuide(await loadVideoEntries());
  return {
    eraIds,
    trackSlugIds: trackSlugIdsFrom(trackByEra),
    songSlugs: songSlugsFrom(trackByEra),
    theoryIds: theoryIdsFrom(theoryByEra),
    videoIds: videoIdsFrom(videoByEra),
  };
}

async function main() {
  const data = await build();
  await writeFile(OUT_FILE, renderModule(data), 'utf-8');
  console.log(
    `Synced content ids (${data.eraIds.length} eras, ${data.trackSlugIds.length} track slug ids, ` +
      `${data.songSlugs.length} song slugs, ${data.theoryIds.length} theory ids, ` +
      `${data.videoIds.length} video ids) -> ${path.relative(ROOT, OUT_FILE)}`,
  );
}

// Only run when invoked directly (`node scripts/sync-longlive-content-ids.mjs`) —
// importing this module for its pure functions (tests) must not write files.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
