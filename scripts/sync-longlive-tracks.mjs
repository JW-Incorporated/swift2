#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/tracks.generated.ts — the LongLive UI's
// static per-album track guide (see docs/longlive-experience.md §9). Mirrors
// scripts/sync-longlive-content.mjs exactly:
//
// Source of truth, in priority order:
//   1. Live Supabase `track_note` table, when NEXT_PUBLIC_SUPABASE_URL +
//      NEXT_PUBLIC_SUPABASE_ANON_KEY are set. Runs at build time (wired as
//      `prebuild` in apps/web/package.json), so the shipped UI stays fully
//      static — no per-user DB calls, per the cost-discipline rule.
//   2. Local supabase/seed/tracks/*.mjs files, when Supabase isn't configured
//      or the live fetch fails (local dev without secrets, CI, or before the
//      DB has been seeded). Same output shape either way.
//
// Pure normalization lives in the exported functions below so it can be
// unit-tested (scripts/sync-longlive-tracks.test.ts); `main` only runs when
// the file is invoked directly.

import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import {
  ROOT,
  SLUG_TO_ERA_ID,
  esc,
  loadWebEnvLocal,
  sourcesFrom,
  supabaseEnv,
} from './lib/longlive-sync-shared.mjs';

const SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'tracks');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'tracks.generated.ts');

// Same columns the seed runner (scripts/seed-tracks.mjs) writes. Explicit
// `.limit()` + cap check so a partial page can never silently ship a
// truncated track guide (same guard as sync-longlive-content.mjs).
const TRACK_NOTE_COLS = 'era_slug,track_title,track_number,note,source_url,sources';
const MAX_ROWS = 2000;

/**
 * Normalize one raw track (seed-file or DB shape) into the UI's TrackNote
 * shape, or null when it isn't renderable. The UI's whole point is the
 * sourced note, so a track with no non-empty note is dropped (the seed rules
 * already say "skip a track entirely if no real source exists" — this is the
 * defensive mirror of that).
 */
export function normalizeTrack({ trackNumber, trackTitle, note, sourceUrl, sources }) {
  const title = typeof trackTitle === 'string' ? trackTitle.trim() : '';
  const trimmedNote = typeof note === 'string' ? note.trim() : '';
  if (!title || !trimmedNote) return null;
  const n = Number(trackNumber);
  return {
    trackNumber: Number.isInteger(n) && n > 0 ? n : null,
    title,
    note: trimmedNote,
    sources: sourcesFrom(sources, sourceUrl ?? null),
  };
}

/**
 * Stable display order: by track number ascending, unnumbered tracks last,
 * ties (and the unnumbered tail) alphabetical. Pure — returns a new array.
 */
export function sortTracks(tracks) {
  return [...tracks].sort((a, b) => {
    if (a.trackNumber !== null && b.trackNumber !== null && a.trackNumber !== b.trackNumber) {
      return a.trackNumber - b.trackNumber;
    }
    if ((a.trackNumber === null) !== (b.trackNumber === null)) {
      return a.trackNumber === null ? 1 : -1;
    }
    return a.title.localeCompare(b.title);
  });
}

/**
 * Group raw `{ eraSlug, ...track }` entries into the generated
 * `Partial<Record<EraId, TrackNote[]>>` map: seed/DB era slugs mapped to
 * EraIds, unrenderable tracks dropped, duplicate titles within an era
 * de-duped (first wins — the seed runner replaces an era wholesale, so a
 * dupe is an authoring slip, not a second edition), each era sorted.
 */
export function buildTrackGuide(entries) {
  const byEra = {};
  const seenTitles = {};
  for (const { eraSlug, ...track } of entries) {
    const normalized = normalizeTrack(track);
    if (!normalized) continue;
    const eraId = SLUG_TO_ERA_ID[eraSlug] ?? eraSlug;
    const seen = (seenTitles[eraId] ??= new Set());
    const key = normalized.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    (byEra[eraId] ??= []).push(normalized);
  }
  for (const eraId of Object.keys(byEra)) byEra[eraId] = sortTracks(byEra[eraId]);
  return byEra;
}

/** Render the generated TypeScript module. Pure string building. */
export function renderModule(byEra) {
  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-longlive-tracks.mjs from supabase/seed/tracks/**');
  lines.push('// (or the live Supabase track_note table when configured).');
  lines.push("// Re-run that script after track-seed changes; don't edit this file directly.");
  lines.push('');
  lines.push("import type { EraId, TrackNote } from './types';");
  lines.push('');
  lines.push('export const TRACKS_RAW: Partial<Record<EraId, TrackNote[]>> = {');
  for (const eraId of Object.keys(byEra).sort()) {
    lines.push(`  ${esc(eraId)}: [`);
    for (const t of byEra[eraId]) {
      lines.push('    {');
      lines.push(`      trackNumber: ${t.trackNumber === null ? 'null' : t.trackNumber},`);
      lines.push(`      title: ${esc(t.title)},`);
      lines.push(`      note: ${esc(t.note)},`);
      if (t.sources.length) {
        const srcs = t.sources.map((s) => `{ name: ${esc(s.name)}, url: ${esc(s.url)} }`).join(', ');
        lines.push(`      sources: [${srcs}],`);
      }
      lines.push('    },');
    }
    lines.push('  ],');
  }
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

/** Live source: the Supabase track_note table. Returns null if unreachable/unconfigured. */
async function fetchFromSupabase() {
  const env = supabaseEnv();
  if (!env) {
    console.log('sync-longlive-tracks: no Supabase env, falling back to local seed files.');
    return null;
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('track_note')
    .select(TRACK_NOTE_COLS)
    .order('era_slug', { ascending: true })
    .order('track_number', { ascending: true, nullsFirst: false })
    .limit(MAX_ROWS);

  if (error) {
    console.warn(`sync-longlive-tracks: Supabase fetch failed (${error.message}), falling back to local seed files.`);
    return null;
  }
  if (!data || data.length === 0) {
    console.warn('sync-longlive-tracks: Supabase returned 0 track_notes, falling back to local seed files.');
    return null;
  }
  if (data.length >= MAX_ROWS) {
    console.warn(
      `sync-longlive-tracks: Supabase track_note hit the ${MAX_ROWS}-row cap — result would be truncated, falling back to local seed files.`,
    );
    return null;
  }

  const entries = data.map((row) => ({
    eraSlug: row.era_slug,
    trackNumber: row.track_number,
    trackTitle: row.track_title,
    note: row.note,
    sourceUrl: row.source_url,
    sources: row.sources,
  }));
  console.log(`sync-longlive-tracks: loaded ${entries.length} track notes from Supabase (live).`);
  return buildTrackGuide(entries);
}

/** Fallback source: the local supabase/seed/tracks/*.mjs files. */
async function fetchFromLocalFiles() {
  // Files starting with "_" are templates, not real content (same convention
  // as scripts/seed-tracks.mjs).
  const files = (await readdir(SEED_DIR)).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));

  const entries = [];
  for (const file of files.sort()) {
    const mod = await import(pathToFileURL(path.join(SEED_DIR, file)).href);
    const { eraSlug, tracks } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(tracks)) {
      console.warn(`sync-longlive-tracks: skipping ${file}: expected { eraSlug, tracks: [] }`);
      continue;
    }
    for (const t of tracks) entries.push({ eraSlug, ...t });
  }
  console.log(`sync-longlive-tracks: loaded ${entries.length} track notes from local seed files (fallback).`);
  return buildTrackGuide(entries);
}

async function main() {
  await loadWebEnvLocal();
  const byEra = (await fetchFromSupabase()) ?? (await fetchFromLocalFiles());
  await writeFile(OUT_FILE, renderModule(byEra), 'utf-8');
  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(
    `Synced ${total} track notes across ${Object.keys(byEra).length} eras -> ${path.relative(ROOT, OUT_FILE)}`,
  );
}

// Only run when invoked directly (`node scripts/sync-longlive-tracks.mjs`) —
// importing this module for its pure functions (tests) must not write files.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
