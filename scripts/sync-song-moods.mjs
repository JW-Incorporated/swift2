#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/song-moods.generated.ts — the Mood Chat
// catalogue (docs/proposals/2026-07-19-mood-chat.md). This is the precomputed
// index the deterministic matcher (Stage 3) ranks over; the model never
// searches it, so a song that isn't in a real track seed can never surface.
//
// Two inputs, merged by (eraId, slug):
//
//   1. supabase/seed/tracks/*.mjs — the AUTHORITATIVE song list. Every catalogue
//      entry is a real track (slug + title), and its `youtubeId` is that track's
//      own oEmbed-verified id (audio-curator flow). This is why the model can't
//      invent a song: the universe of songs IS the track seeds.
//   2. supabase/seed/song-moods/*.mjs — the mood SCORES (Stage 2 authoring). A
//      score file references tracks by slug and carries the 8 mood axes, energy,
//      valence, useCase, and an ORIGINAL one-liner. NO LYRICS, ever.
//
// A song with no score file yet ships UNSCORED (just slug/title/eraId/youtubeId)
// — a placeholder the matcher skips. In Stage 1 that's every song; Stage 2 fills
// them in a batch at a time.
//
// Guarded by `check:generated` like every other generated file: the generator
// THROWS on any authoring error (a score for an unknown slug, an out-of-range
// axis, a lyric-shaped one-liner), so a bad score file turns CI red instead of
// silently shipping. Pure normalization/validation lives in the exported
// functions below so it can be unit-tested (scripts/sync-song-moods.test.ts);
// `main` only runs when the file is invoked directly.

import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, SLUG_TO_ERA_ID, esc } from './lib/longlive-sync-shared.mjs';

const TRACKS_SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'tracks');
const MOODS_SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'song-moods');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'song-moods.generated.ts');

// The eight axes, in the SongMood type's order (apps/web/lib/longlive/types.ts
// MOOD_AXES is the source of truth; kept in step here — a plain-node script
// can't import the .ts tuple, so this comment is the contract). A drift is
// caught by the test that asserts this list equals MOOD_AXES.
export const MOOD_AXES = [
  'heartbreak',
  'anger',
  'nostalgia',
  'joy',
  'calm',
  'defiance',
  'longing',
  'catharsis',
];

// Chronological era order, matching the EraId union in types.ts, so the
// generated catalogue has a stable, human-legible order (debut → tloas).
const ERA_ORDER = [
  'debut',
  'fearless',
  'speak-now',
  'red',
  '1989',
  'reputation',
  'lover',
  'folklore',
  'evermore',
  'midnights',
  'ttpd',
  'tloas',
];

// Author-facing caps — small on purpose. A one-liner is one sentence, not an
// essay, and a use-case is a phrase.
const ONE_LINER_MAX = 160;
const USE_CASE_MAX = 60;
const MAX_USE_CASES = 6;

/**
 * A verified 11-char YouTube id, or undefined. Same strict shape check the
 * tracks/videos generators use so a malformed string can never smuggle itself
 * into a song embed.
 */
export function youtubeIdFrom(raw) {
  return typeof raw === 'string' && /^[A-Za-z0-9_-]{11}$/.test(raw.trim()) ? raw.trim() : undefined;
}

/** A finite number in [0,1], or null. Used for axes, energy, and valence. */
export function unit(raw) {
  return typeof raw === 'number' && Number.isFinite(raw) && raw >= 0 && raw <= 1 ? raw : null;
}

/** Round a unit value to 2 decimals for stable, diff-friendly generated output. */
export function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * True when `text` looks like quoted verse rather than an original sentence.
 * The redline (safety.redline) auto-files a P0 on verse-shaped text; this is
 * the generator-side mirror so a lyric dump in a one-liner fails the build.
 * Signal: any internal line break — original prose is a single flowing line.
 */
export function looksLikeLyric(text) {
  return typeof text === 'string' && /[\r\n]/.test(text);
}

/**
 * Validate one raw score entry from a song-moods seed against the set of
 * resolvable track slugs for its era. Returns an array of human-readable error
 * strings (empty when the entry is clean). Pure — the generator throws when any
 * entry has errors, and validate-content surfaces the same list to authors.
 *
 * `resolvableSlugs` is a Set of slugs that exist as real tracks in this entry's
 * era. `label` is a "<file> <slug>" prefix for readable messages.
 */
export function validateScore(raw, resolvableSlugs, label) {
  const errors = [];
  const slug = typeof raw?.slug === 'string' ? raw.slug.trim() : '';
  if (!slug) {
    errors.push(`${label}: missing slug`);
    return errors; // nothing else is checkable without a slug
  }
  if (resolvableSlugs && !resolvableSlugs.has(slug)) {
    errors.push(`${label}: slug "${slug}" does not resolve to a real track in this era`);
  }

  const moods = raw.moods;
  if (!moods || typeof moods !== 'object' || Array.isArray(moods)) {
    errors.push(`${label}: moods must be an object with all ${MOOD_AXES.length} axes`);
  } else {
    for (const axis of MOOD_AXES) {
      if (unit(moods[axis]) === null) {
        errors.push(
          `${label}: mood axis "${axis}" must be a number in [0,1] (got ${JSON.stringify(moods[axis])})`,
        );
      }
    }
    for (const key of Object.keys(moods)) {
      if (!MOOD_AXES.includes(key)) errors.push(`${label}: unknown mood axis "${key}"`);
    }
  }

  if (unit(raw.energy) === null) errors.push(`${label}: energy must be a number in [0,1]`);
  if (unit(raw.valence) === null) errors.push(`${label}: valence must be a number in [0,1]`);

  if (!Array.isArray(raw.useCase) || raw.useCase.length === 0) {
    errors.push(`${label}: useCase must be a non-empty array of phrases`);
  } else {
    if (raw.useCase.length > MAX_USE_CASES) {
      errors.push(`${label}: useCase has ${raw.useCase.length} entries (max ${MAX_USE_CASES})`);
    }
    for (const uc of raw.useCase) {
      if (typeof uc !== 'string' || !uc.trim()) {
        errors.push(`${label}: useCase entries must be non-empty strings`);
      } else if (uc.trim().length > USE_CASE_MAX) {
        errors.push(`${label}: useCase "${uc.slice(0, 24)}…" exceeds ${USE_CASE_MAX} chars`);
      } else if (looksLikeLyric(uc)) {
        errors.push(`${label}: useCase looks like quoted verse (no lyrics)`);
      }
    }
  }

  const oneLiner = typeof raw.oneLiner === 'string' ? raw.oneLiner.trim() : '';
  if (!oneLiner) {
    errors.push(`${label}: oneLiner is required`);
  } else if (oneLiner.length > ONE_LINER_MAX) {
    errors.push(`${label}: oneLiner exceeds ${ONE_LINER_MAX} chars`);
  } else if (looksLikeLyric(raw.oneLiner)) {
    errors.push(`${label}: oneLiner looks like quoted verse (no lyrics)`);
  }

  return errors;
}

/**
 * Normalize a validated raw score into the SongMood scoring fields
 * (moods/energy/valence/useCase/oneLiner). Assumes validateScore already
 * passed; clamps defensively so a shipped entry is always well-formed.
 */
export function normalizeScore(raw) {
  const moods = {};
  for (const axis of MOOD_AXES) moods[axis] = round2(unit(raw.moods?.[axis]) ?? 0);
  return {
    moods,
    energy: round2(unit(raw.energy) ?? 0),
    valence: round2(unit(raw.valence) ?? 0),
    useCase: raw.useCase.map((s) => s.trim()).filter(Boolean),
    oneLiner: raw.oneLiner.trim(),
  };
}

/**
 * Build the catalogue: one SongMood per real (eraId, slug) track, in
 * era-then-track order, with mood scores merged in where a score exists.
 *
 * @param trackEntries `[{ eraId, slug, title, trackNumber, youtubeId }]`
 * @param scoreEntries `[{ eraId, slug, moods, energy, valence, useCase, oneLiner }]`
 *   (already validated + normalized)
 */
export function buildCatalogue(trackEntries, scoreEntries) {
  const scoreByKey = new Map();
  for (const s of scoreEntries) scoreByKey.set(`${s.eraId}::${s.slug}`, s);

  const seen = new Set();
  const out = [];
  for (const t of trackEntries) {
    const title = typeof t.title === 'string' ? t.title.trim() : '';
    const slug = typeof t.slug === 'string' ? t.slug.trim() : '';
    if (!title || !slug) continue; // unslugged/untitled tracks can't be catalogued
    const key = `${t.eraId}::${slug}`;
    if (seen.has(key)) continue; // first wins, mirrors buildTrackGuide's de-dupe
    seen.add(key);

    const entry = { slug, title, eraId: t.eraId, trackNumber: t.trackNumber ?? null };
    const yt = youtubeIdFrom(t.youtubeId);
    if (yt) entry.youtubeId = yt;

    const score = scoreByKey.get(key);
    if (score) {
      entry.moods = score.moods;
      entry.energy = score.energy;
      entry.valence = score.valence;
      entry.useCase = score.useCase;
      entry.oneLiner = score.oneLiner;
    }
    out.push(entry);
  }

  out.sort((a, b) => {
    const ea = ERA_ORDER.indexOf(a.eraId);
    const eb = ERA_ORDER.indexOf(b.eraId);
    if (ea !== eb) return (ea === -1 ? ERA_ORDER.length : ea) - (eb === -1 ? ERA_ORDER.length : eb);
    const na = a.trackNumber ?? Infinity;
    const nb = b.trackNumber ?? Infinity;
    if (na !== nb) return na - nb;
    return a.title.localeCompare(b.title);
  });
  return out;
}

/** Render the generated TypeScript module. Pure string building. */
export function renderModule(catalogue) {
  const scored = catalogue.filter((s) => s.moods).length;
  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-song-moods.mjs from supabase/seed/tracks/**');
  lines.push('// (the song list) merged with supabase/seed/song-moods/** (the mood scores).');
  lines.push("// Re-run that script after seed changes; don't edit this file directly.");
  lines.push('//');
  lines.push(`// ${catalogue.length} songs, ${scored} scored.`);
  lines.push('');
  lines.push("import type { SongMood } from './types';");
  lines.push('');
  lines.push('export const SONG_MOODS: SongMood[] = [');
  for (const s of catalogue) {
    lines.push('  {');
    lines.push(`    slug: ${esc(s.slug)},`);
    lines.push(`    title: ${esc(s.title)},`);
    lines.push(`    eraId: ${esc(s.eraId)},`);
    if (s.youtubeId) lines.push(`    youtubeId: ${esc(s.youtubeId)},`);
    if (s.moods) {
      const axes = MOOD_AXES.map((a) => `${a}: ${s.moods[a]}`).join(', ');
      lines.push(`    moods: { ${axes} },`);
      lines.push(`    energy: ${s.energy},`);
      lines.push(`    valence: ${s.valence},`);
      lines.push(`    useCase: [${s.useCase.map(esc).join(', ')}],`);
      lines.push(`    oneLiner: ${esc(s.oneLiner)},`);
    }
    lines.push('  },');
  }
  lines.push('];');
  lines.push('');
  return lines.join('\n');
}

/**
 * Load the authoritative song list from the track seed files. Returns
 * `{ trackEntries, slugsByEra }`: trackEntries feed the catalogue; slugsByEra
 * (era → Set of slugs) lets score files be checked against real tracks. Mirrors
 * the file-selection rules in scripts/sync-longlive-tracks.mjs (skip `_`
 * templates and `.dossiers.mjs` side files).
 */
export async function loadTrackBase() {
  const files = (await readdir(TRACKS_SEED_DIR)).filter(
    (f) => f.endsWith('.mjs') && !f.startsWith('_') && !f.endsWith('.dossiers.mjs'),
  );
  const trackEntries = [];
  const slugsByEra = {};
  for (const file of files.sort()) {
    const mod = await import(pathToFileURL(path.join(TRACKS_SEED_DIR, file)).href);
    const { eraSlug, tracks } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(tracks)) continue;
    const eraId = SLUG_TO_ERA_ID[eraSlug] ?? eraSlug;
    const set = (slugsByEra[eraId] ??= new Set());
    for (const t of tracks) {
      const slug = typeof t.slug === 'string' ? t.slug.trim() : '';
      if (slug) set.add(slug);
      trackEntries.push({
        eraId,
        slug,
        title: t.trackTitle,
        trackNumber: t.trackNumber ?? null,
        youtubeId: t.youtubeId,
      });
    }
  }
  return { trackEntries, slugsByEra };
}

/**
 * Load raw score entries from supabase/seed/song-moods/*.mjs. Each file exports
 * `{ eraSlug, songs: [...] }`. Returns `[{ eraId, file, raw }]` — raw is the
 * unvalidated score object, so the caller (generator or validator) runs
 * validateScore. Returns [] when the dir is absent (Stage 1: no scores yet).
 */
export async function loadRawScores() {
  let files;
  try {
    files = (await readdir(MOODS_SEED_DIR)).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));
  } catch {
    return []; // no song-moods dir yet
  }
  const out = [];
  for (const file of files.sort()) {
    const mod = await import(pathToFileURL(path.join(MOODS_SEED_DIR, file)).href);
    const { eraSlug, songs } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(songs)) {
      console.warn(`sync-song-moods: skipping ${file}: expected { eraSlug, songs: [] }`);
      continue;
    }
    const eraId = SLUG_TO_ERA_ID[eraSlug] ?? eraSlug;
    for (const raw of songs) out.push({ eraId, file, raw });
  }
  return out;
}

/**
 * Validate every raw score against the real-track slug sets and return the flat
 * list of errors. Shared by the generator (throws on any) and validate-content
 * (reports to the author). A score whose era has no known tracks is still
 * checked — `slugsByEra[eraId]` being undefined means "no such era", which the
 * slug check reports as unresolved.
 */
export function validateScores(rawScores, slugsByEra) {
  const errors = [];
  for (const { eraId, file, raw } of rawScores) {
    const resolvable = slugsByEra[eraId] ?? new Set();
    errors.push(
      ...validateScore(raw, resolvable, `${file} [${eraId}] ${raw?.slug ?? '(no slug)'}`),
    );
  }
  return errors;
}

async function main() {
  const { trackEntries, slugsByEra } = await loadTrackBase();
  const rawScores = await loadRawScores();

  const errors = validateScores(rawScores, slugsByEra);
  if (errors.length) {
    console.error('\n✖ song-moods score errors:');
    for (const e of errors) console.error('    ' + e);
    console.error('\nFix the score files under supabase/seed/song-moods/** and re-run.\n');
    process.exit(1);
  }

  const scoreEntries = rawScores.map(({ eraId, raw }) => ({
    eraId,
    slug: raw.slug.trim(),
    ...normalizeScore(raw),
  }));
  const catalogue = buildCatalogue(trackEntries, scoreEntries);
  await writeFile(OUT_FILE, renderModule(catalogue), 'utf-8');

  const scored = catalogue.filter((s) => s.moods).length;
  console.log(
    `Synced ${catalogue.length} songs (${scored} scored) -> ${path.relative(ROOT, OUT_FILE)}`,
  );
}

// Only run when invoked directly — importing this module for its pure functions
// (tests, validate-content) must not write files.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
