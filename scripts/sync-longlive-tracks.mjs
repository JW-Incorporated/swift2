#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/tracks.generated.ts — the LongLive UI's
// static per-album track guide (see docs/longlive-experience.md §9). Mirrors
// scripts/sync-longlive-content.mjs exactly:
//
// Source of truth: the local supabase/seed/tracks/*.mjs files — what content
// PRs review and merge (decision 2026-07-17; supersedes the 2026-07-08
// DB-first order). Runs at build time (wired as `prebuild` in
// apps/web/package.json), so the shipped UI stays fully static — no per-user
// DB calls, per the cost-discipline rule. Set LONGLIVE_SYNC_SOURCE=db to read
// the live Supabase `track_note` table first instead, with seeds as fallback.
// Same output shape either way.
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
  preferDbSource,
  sourceLiteral,
  sourcesFrom,
  supabaseEnv,
} from './lib/longlive-sync-shared.mjs';

const SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'tracks');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'tracks.generated.ts');

// Same columns the seed runner (scripts/seed-tracks.mjs) writes. Explicit
// `.limit()` + cap check so a partial page can never silently ship a
// truncated track guide (same guard as sync-longlive-content.mjs).
const TRACK_NOTE_COLS =
  'era_slug,track_title,track_number,note,source_url,sources,discussion,quoted_lines,discussion_source_url,discussion_sources,summary,inspiration,easter_eggs,slug,release,release_date,writers,producers,is_single,single_release_date,themes,dossier,youtube_id';
const MAX_ROWS = 2000;

/**
 * Normalizes a track's deep-dive content into `{ discussion, quotedLines,
 * discussionSources } | null`. Two ways a track gets a deep-dive:
 *
 * 1. Explicit `discussion` (array of paragraphs, or a string split on blank
 *    lines) with its own `discussionSources`/`discussionSourceUrl` citation —
 *    for hand-written pieces that go beyond the one-line `note`.
 * 2. Auto-derived from the already-authored `summary` + `inspiration` +
 *    `easterEggs` fields every seeded track already carries (one paragraph
 *    each, in that order, skipping any that are empty) — these were written
 *    and sourced already but never reached the UI; this is plumbing, not new
 *    writing. Uses the track's own `sources` as the citation in this path
 *    (there's no separate discussion-specific source when it's derived from
 *    fields the main sources already back).
 *
 * `quotedLines` (a few short illustrative lines, never full lyrics) only
 * comes from the explicit path — nothing auto-derives quoted lyrics.
 * Returns null when neither path yields real, sourced content.
 */
export function discussionFrom(
  { discussion, quotedLines, discussionSourceUrl, discussionSources, summary, inspiration, easterEggs },
  fallbackSources,
) {
  let paras;
  if (Array.isArray(discussion)) {
    paras = discussion.map((p) => (typeof p === 'string' ? p.trim() : '')).filter(Boolean);
  } else if (typeof discussion === 'string' && discussion.trim()) {
    paras = discussion
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  } else {
    paras = [];
  }
  const lines = Array.isArray(quotedLines)
    ? quotedLines.map((l) => (typeof l === 'string' ? l.trim() : '')).filter(Boolean)
    : [];

  if (paras.length) {
    const resolvedSources = sourcesFrom(discussionSources, discussionSourceUrl ?? null);
    if (resolvedSources.length === 0) return null;
    return { discussion: paras, quotedLines: lines, discussionSources: resolvedSources };
  }

  // Auto-derive from the fields every seeded track already carries.
  const derived = [summary, inspiration, easterEggs]
    .map((p) => (typeof p === 'string' ? p.trim() : ''))
    .filter(Boolean);
  if (!derived.length || !fallbackSources.length) return null;
  return { discussion: derived, quotedLines: lines, discussionSources: fallbackSources };
}

/** Trimmed non-empty strings from a raw array, or undefined when none survive. */
function stringList(raw) {
  if (!Array.isArray(raw)) return undefined;
  const out = raw.map((s) => (typeof s === 'string' ? s.trim() : '')).filter(Boolean);
  return out.length ? out : undefined;
}

/** A single trimmed non-empty string, or undefined. */
function str(raw) {
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

/**
 * A verified 11-char YouTube video id, or undefined. Same strict shape check
 * the videos generator uses (scripts/sync-longlive-videos.mjs) so a malformed
 * or non-id string can never smuggle itself into a song embed. The seed's
 * `youtubeId` is a bare id the audio-curator flow already oEmbed-verified
 * against an official Taylor Swift channel; this is the defensive mirror of
 * that — a bad shape is dropped rather than shipped.
 */
export function youtubeIdFrom(raw) {
  return typeof raw === 'string' && /^[A-Za-z0-9_-]{11}$/.test(raw.trim())
    ? raw.trim()
    : undefined;
}

/**
 * Normalize the essential-facts fields (issue #440 Phase 0 — these were
 * already authored in the seed files, this just carries them through) into
 * the UI's grouped `TrackFacts` object, or null when nothing is known.
 * Accepts both the seed camelCase shape and (via the caller's column
 * mapping) the DB snake_case shape.
 */
export function factsFrom({ release, releaseDate, writers, producers, isSingle, singleReleaseDate, themes }) {
  const facts = {};
  const rel = str(release);
  if (rel) facts.release = rel;
  const relDate = str(releaseDate);
  if (relDate) facts.releaseDate = relDate;
  const w = stringList(writers);
  if (w) facts.writers = w;
  const p = stringList(producers);
  if (p) facts.producers = p;
  const single = str(singleReleaseDate);
  // A dated single release implies single status even when the seed row
  // didn't set the flag explicitly (authoring drift across era files).
  if (isSingle === true || single) facts.isSingle = true;
  if (single) facts.singleReleaseDate = single;
  const t = stringList(themes);
  if (t) facts.themes = t;
  return Object.keys(facts).length ? facts : null;
}

/**
 * Validate + normalize a raw `dossier` object (seed field or DB jsonb) into
 * the UI's `TrackDossier` shape, or null when it has no renderable content.
 * Same no-unsourced-content rule as `discussionFrom`: a dossier with claims
 * but an empty `sources` list is dropped entirely (and logged, since that's
 * an authoring error, not an expected state).
 */
export function dossierFrom(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

  const out = {};
  const whyItMatters = stringList(raw.whyItMatters);
  if (whyItMatters) out.whyItMatters = whyItMatters;

  if (raw.meaning && typeof raw.meaning === 'object') {
    const meaning = {};
    const confirmed = stringList(raw.meaning.confirmed);
    if (confirmed) meaning.confirmed = confirmed;
    const supported = stringList(raw.meaning.supported);
    if (supported) meaning.supported = supported;
    const fanTheories = stringList(raw.meaning.fanTheories);
    if (fanTheories) meaning.fanTheories = fanTheories;
    if (Object.keys(meaning).length) out.meaning = meaning;
  }

  if (Array.isArray(raw.connections)) {
    const connections = raw.connections
      .map((c) => c && { relatedId: str(c.relatedId), label: str(c.label), why: str(c.why) })
      .filter((c) => c && c.relatedId && c.label && c.why);
    if (connections.length) out.connections = connections;
  }

  if (Array.isArray(raw.live)) {
    const live = raw.live
      .map((m) => {
        if (!m) return null;
        const event = str(m.event);
        const note = str(m.note);
        if (!event || !note) return null;
        const date = str(m.date);
        return date ? { date, event, note } : { event, note };
      })
      .filter(Boolean);
    if (live.length) out.live = live;
  }

  if (Array.isArray(raw.voices)) {
    const voices = raw.voices
      .map((v) => {
        if (!v) return null;
        const who = str(v.who);
        const note = str(v.note);
        if (!who || !note) return null;
        const context = str(v.context);
        return context ? { who, context, note } : { who, note };
      })
      .filter(Boolean);
    if (voices.length) out.voices = voices;
  }

  if (!Object.keys(out).length) return null;

  const sources = sourcesFrom(raw.sources, null);
  if (!sources.length) {
    console.warn('sync-longlive-tracks: dropping a dossier with content but no sources (authoring error).');
    return null;
  }
  out.sources = sources;
  return out;
}

/**
 * Normalize one raw track (seed-file or DB shape) into the UI's TrackNote
 * shape, or null when it isn't renderable. The UI's whole point is the
 * sourced note, so a track with no non-empty note is dropped (the seed rules
 * already say "skip a track entirely if no real source exists" — this is the
 * defensive mirror of that).
 */
export function normalizeTrack({
  slug,
  trackNumber,
  trackTitle,
  note,
  sourceUrl,
  sources,
  discussion,
  quotedLines,
  discussionSourceUrl,
  discussionSources,
  summary,
  inspiration,
  easterEggs,
  release,
  releaseDate,
  writers,
  producers,
  isSingle,
  singleReleaseDate,
  themes,
  dossier,
  youtubeId,
}) {
  const title = typeof trackTitle === 'string' ? trackTitle.trim() : '';
  const trimmedNote = typeof note === 'string' ? note.trim() : '';
  if (!title || !trimmedNote) return null;
  const resolvedSources = sourcesFrom(sources, sourceUrl ?? null);
  // The UI's whole point is the sourced note — a track with no real source
  // shouldn't ship silently even if the seed/DB row otherwise looks complete.
  if (resolvedSources.length === 0) return null;
  const n = Number(trackNumber);
  const discussionResult = discussionFrom(
    { discussion, quotedLines, discussionSourceUrl, discussionSources, summary, inspiration, easterEggs },
    resolvedSources,
  );
  const trimmedSlug = str(slug);
  const facts = factsFrom({ release, releaseDate, writers, producers, isSingle, singleReleaseDate, themes });
  const dossierResult = dossierFrom(dossier);
  const verifiedYoutubeId = youtubeIdFrom(youtubeId);
  return {
    ...(trimmedSlug ? { slug: trimmedSlug } : {}),
    trackNumber: Number.isInteger(n) && n > 0 ? n : null,
    title,
    note: trimmedNote,
    sources: resolvedSources,
    ...(discussionResult
      ? {
          discussion: discussionResult.discussion,
          quotedLines: discussionResult.quotedLines,
          discussionSources: discussionResult.discussionSources,
        }
      : {}),
    ...(facts ? { facts } : {}),
    ...(dossierResult ? { dossier: dossierResult } : {}),
    ...(verifiedYoutubeId ? { youtubeId: verifiedYoutubeId } : {}),
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
      if (t.slug) lines.push(`      slug: ${esc(t.slug)},`);
      lines.push(`      trackNumber: ${t.trackNumber === null ? 'null' : t.trackNumber},`);
      lines.push(`      title: ${esc(t.title)},`);
      lines.push(`      note: ${esc(t.note)},`);
      if (t.sources.length) {
        const srcs = t.sources.map(sourceLiteral).join(', ');
        lines.push(`      sources: [${srcs}],`);
      }
      if (t.discussion && t.discussion.length) {
        lines.push(`      discussion: [${t.discussion.map(esc).join(', ')}],`);
        if (t.quotedLines && t.quotedLines.length) {
          lines.push(`      quotedLines: [${t.quotedLines.map(esc).join(', ')}],`);
        }
        const discSrcs = t.discussionSources.map(sourceLiteral).join(', ');
        lines.push(`      discussionSources: [${discSrcs}],`);
      }
      // Grouped objects (facts/dossier) are emitted as plain JSON — already
      // normalized above, and JSON is valid TS object-literal syntax.
      if (t.facts) lines.push(`      facts: ${JSON.stringify(t.facts)},`);
      if (t.dossier) lines.push(`      dossier: ${JSON.stringify(t.dossier)},`);
      if (t.youtubeId) lines.push(`      youtubeId: ${esc(t.youtubeId)},`);
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
    slug: row.slug,
    trackNumber: row.track_number,
    trackTitle: row.track_title,
    note: row.note,
    sourceUrl: row.source_url,
    sources: row.sources,
    discussion: row.discussion,
    quotedLines: row.quoted_lines,
    discussionSourceUrl: row.discussion_source_url,
    discussionSources: row.discussion_sources,
    summary: row.summary,
    inspiration: row.inspiration,
    easterEggs: row.easter_eggs,
    release: row.release,
    releaseDate: row.release_date,
    writers: row.writers,
    producers: row.producers,
    isSingle: row.is_single,
    singleReleaseDate: row.single_release_date,
    themes: row.themes,
    dossier: row.dossier,
    youtubeId: row.youtube_id,
  }));
  console.log(`sync-longlive-tracks: loaded ${entries.length} track notes from Supabase (live).`);
  return buildTrackGuide(entries);
}

/** Fallback source: the local supabase/seed/tracks/*.mjs files. */
async function fetchFromLocalFiles() {
  // Files starting with "_" are templates, not real content; `.dossiers.mjs`
  // files are per-era side modules imported by their era file (same
  // convention as scripts/seed-tracks.mjs).
  const files = (await readdir(SEED_DIR)).filter(
    (f) => f.endsWith('.mjs') && !f.startsWith('_') && !f.endsWith('.dossiers.mjs'),
  );

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
  console.log(`sync-longlive-tracks: loaded ${entries.length} track notes from local seed files (source of truth).`);
  return buildTrackGuide(entries);
}

async function main() {
  await loadWebEnvLocal();
  const byEra = preferDbSource()
    ? ((await fetchFromSupabase()) ?? (await fetchFromLocalFiles()))
    : await fetchFromLocalFiles();
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
