#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/videos.generated.ts — the LongLive UI's
// static per-era official-videos rail (audit T1). Mirrors
// scripts/sync-longlive-tracks.mjs exactly:
//
// Source of truth: the local supabase/seed/videos/*.mjs files — what content
// PRs review and merge (decision 2026-07-17; supersedes the 2026-07-08
// DB-first order). Runs at build time (wired as `prebuild` in
// apps/web/package.json), so the shipped UI stays fully static — no per-user
// DB calls, per the cost-discipline rule. Set LONGLIVE_SYNC_SOURCE=db to read
// the live Supabase `video_work` table first instead, with seeds as fallback.
// Same output shape either way.
//
// Pure normalization lives in the exported functions below so it can be
// unit-tested (scripts/sync-longlive-videos.test.ts); `main` only runs when
// the file is invoked directly.

import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { URL, pathToFileURL } from 'node:url';
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
import { runMain } from './lib/cli.mjs';

const SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'videos');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'videos.generated.ts');

// Same columns the seed runner (scripts/seed-videos.mjs) writes. Explicit
// `.limit()` + cap check so a partial page can never silently ship a
// truncated rail.
const VIDEO_COLS =
  'era_slug,slug,kind,title,director,released_on,related_songs,summary,easter_eggs,symbolism,official_url,media,sources';
const MAX_ROWS = 2000;

/** Mirrors VIDEO_KINDS in packages/shared/src/vault-types.ts — works first,
 * then the appearance family (interview/award_speech/speech/press_event). */
export const VIDEO_KIND_VALUES = new Set([
  'music_video',
  'lyric_video',
  'short_film',
  'tour_film',
  'documentary',
  'performance',
  'interview',
  'award_speech',
  'speech',
  'press_event',
]);

/** The five topic ContentTags a video record may be authored with — mirrors
 * VALID_TAGS in sync-longlive-content.mjs. Videos gets no entry here: it is
 * the structural chip every video carries (filters.ts), never an authored
 * topic. */
export const VIDEO_TAG_VALUES = new Set(['Music', 'Fashion', 'Tour', 'Relationship', 'Lore']);

const trimmed = (v) => (typeof v === 'string' ? v.trim() : '');

/** Authored topic tags, filtered to known ContentTags and de-duped —
 * unrecognized values are dropped rather than propagated into the app. */
function tagsFrom(tags) {
  const out = [];
  for (const t of Array.isArray(tags) ? tags : []) {
    if (VIDEO_TAG_VALUES.has(t) && !out.includes(t)) out.push(t);
  }
  return out;
}

/**
 * Extract an 11-char YouTube video ID from a canonical URL (watch?v=, youtu.be,
 * /embed/, /shorts/, /live/), or null. Strict host + shape checks so a
 * non-YouTube or malformed URL can never smuggle a bogus id into an embed.
 */
export function youtubeIdFrom(url) {
  if (typeof url !== 'string' || !url) return null;
  let u;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let candidate = null;
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const parts = u.pathname.split('/').filter(Boolean);
    if (u.pathname === '/watch') candidate = u.searchParams.get('v');
    else if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) candidate = parts[1] ?? null;
  } else if (host === 'youtu.be') {
    candidate = u.pathname.split('/').filter(Boolean)[0] ?? null;
  }
  return candidate && /^[A-Za-z0-9_-]{11}$/.test(candidate) ? candidate : null;
}

/**
 * The official embed id for one raw video: the seed's oEmbed-verified YouTube
 * media entry wins (that's the rights-checked reference), falling back to a
 * YouTube-shaped officialUrl. Null when the work has no official embed (e.g. a
 * theatrical tour film).
 *
 * A null id means the record is HIDDEN from every reader-facing surface, not
 * rendered as a metadata card — playable-first, docs/decisions.md 2026-08-13.
 * So if you are authoring a record and it never appears in the app, this is
 * why: give it a verified official upload and it shows up on the next sync.
 */
export function resolveYoutubeId({ media, officialUrl }) {
  for (const m of Array.isArray(media) ? media : []) {
    if (!m || typeof m !== 'object') continue;
    if (m.kind === 'oembed' && m.provider === 'youtube') {
      const id = youtubeIdFrom(m.post_url ?? m.postUrl);
      if (id) return id;
    }
  }
  return youtubeIdFrom(officialUrl);
}

/**
 * Normalize one raw video (seed-file or DB shape) into the UI's VideoNote
 * shape, or null when it isn't renderable. A work missing its slug, title, or
 * a real source is dropped (same never-an-unsourced-row rule as the track
 * guide); everything else degrades gracefully to null/[].
 */
export function normalizeVideo(raw) {
  const slug = trimmed(raw.slug);
  const title = trimmed(raw.title);
  if (!slug || !title) return null;
  const resolvedSources = sourcesFrom(raw.sources, null);
  if (resolvedSources.length === 0) return null;
  const releasedOn = trimmed(raw.releasedOn ?? raw.released_on);
  return {
    slug,
    kind: VIDEO_KIND_VALUES.has(raw.kind) ? raw.kind : null,
    title,
    director: trimmed(raw.director) || null,
    releasedOn: /^\d{4}-\d{2}-\d{2}$/.test(releasedOn) ? releasedOn : null,
    relatedSongs: (Array.isArray(raw.relatedSongs ?? raw.related_songs)
      ? (raw.relatedSongs ?? raw.related_songs)
      : []
    )
      .map(trimmed)
      .filter(Boolean),
    summary: trimmed(raw.summary) || null,
    easterEggs: (Array.isArray(raw.easterEggs ?? raw.easter_eggs)
      ? (raw.easterEggs ?? raw.easter_eggs)
      : []
    )
      .map(trimmed)
      .filter(Boolean),
    symbolism: trimmed(raw.symbolism) || null,
    youtubeId: resolveYoutubeId({
      media: raw.media,
      officialUrl: raw.officialUrl ?? raw.official_url,
    }),
    sources: resolvedSources,
    tags: tagsFrom(raw.tags),
  };
}

/**
 * Stable display order: by release date ascending, undated works last, ties
 * (and the undated tail) alphabetical. Pure — returns a new array.
 */
export function sortVideos(videos) {
  return [...videos].sort((a, b) => {
    if (a.releasedOn !== null && b.releasedOn !== null && a.releasedOn !== b.releasedOn) {
      return a.releasedOn < b.releasedOn ? -1 : 1;
    }
    if ((a.releasedOn === null) !== (b.releasedOn === null)) {
      return a.releasedOn === null ? 1 : -1;
    }
    return a.title.localeCompare(b.title);
  });
}

/**
 * Group raw `{ eraSlug, ...video }` entries into the generated
 * `Partial<Record<EraId, VideoNote[]>>` map: seed/DB era slugs mapped to
 * EraIds, unrenderable works dropped, duplicate slugs within an era de-duped
 * (first wins), each era sorted by release date.
 */
export function buildVideoGuide(entries) {
  const byEra = {};
  const seenSlugs = {};
  for (const { eraSlug, ...video } of entries) {
    const normalized = normalizeVideo(video);
    if (!normalized) continue;
    const eraId = SLUG_TO_ERA_ID[eraSlug] ?? eraSlug;
    const seen = (seenSlugs[eraId] ??= new Set());
    if (seen.has(normalized.slug)) continue;
    seen.add(normalized.slug);
    (byEra[eraId] ??= []).push(normalized);
  }
  for (const eraId of Object.keys(byEra)) byEra[eraId] = sortVideos(byEra[eraId]);
  return byEra;
}

/** Render the generated TypeScript module. Pure string building. */
export function renderModule(byEra) {
  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-longlive-videos.mjs from supabase/seed/videos/**');
  lines.push('// (or the live Supabase video_work table when configured).');
  lines.push("// Re-run that script after video-seed changes; don't edit this file directly.");
  lines.push('');
  lines.push("import type { EraId, VideoNote } from './types';");
  lines.push('');
  lines.push('export const VIDEOS_RAW: Partial<Record<EraId, VideoNote[]>> = {');
  for (const eraId of Object.keys(byEra).sort()) {
    lines.push(`  ${esc(eraId)}: [`);
    for (const v of byEra[eraId]) {
      lines.push('    {');
      lines.push(`      slug: ${esc(v.slug)},`);
      lines.push(`      kind: ${v.kind === null ? 'null' : esc(v.kind)},`);
      lines.push(`      title: ${esc(v.title)},`);
      lines.push(`      director: ${v.director === null ? 'null' : esc(v.director)},`);
      lines.push(`      releasedOn: ${v.releasedOn === null ? 'null' : esc(v.releasedOn)},`);
      lines.push(`      relatedSongs: [${v.relatedSongs.map(esc).join(', ')}],`);
      lines.push(`      summary: ${v.summary === null ? 'null' : esc(v.summary)},`);
      lines.push(`      easterEggs: [${v.easterEggs.map(esc).join(', ')}],`);
      lines.push(`      symbolism: ${v.symbolism === null ? 'null' : esc(v.symbolism)},`);
      lines.push(`      youtubeId: ${v.youtubeId === null ? 'null' : esc(v.youtubeId)},`);
      const srcs = v.sources.map(sourceLiteral).join(', ');
      lines.push(`      sources: [${srcs}],`);
      if (v.tags.length > 0) lines.push(`      tags: [${v.tags.map(esc).join(', ')}],`);
      lines.push('    },');
    }
    lines.push('  ],');
  }
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

/** Live source: the Supabase video_work table. Returns null if unreachable/unconfigured. */
async function fetchFromSupabase() {
  const env = supabaseEnv();
  if (!env) {
    console.log('sync-longlive-videos: no Supabase env, falling back to local seed files.');
    return null;
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('video_work')
    .select(VIDEO_COLS)
    .order('era_slug', { ascending: true })
    .order('released_on', { ascending: true, nullsFirst: false })
    .limit(MAX_ROWS);

  if (error) {
    console.warn(`sync-longlive-videos: Supabase fetch failed (${error.message}), falling back to local seed files.`);
    return null;
  }
  if (!data || data.length === 0) {
    console.warn('sync-longlive-videos: Supabase returned 0 video_works, falling back to local seed files.');
    return null;
  }
  if (data.length >= MAX_ROWS) {
    console.warn(
      `sync-longlive-videos: Supabase video_work hit the ${MAX_ROWS}-row cap — result would be truncated, falling back to local seed files.`,
    );
    return null;
  }

  const entries = data.map((row) => ({ eraSlug: row.era_slug, ...row }));
  console.log(`sync-longlive-videos: loaded ${entries.length} video works from Supabase (live).`);
  return buildVideoGuide(entries);
}

/** Fallback source: the local supabase/seed/videos/*.mjs files. */
async function fetchFromLocalFiles() {
  // Files starting with "_" are templates, not real content (same convention
  // as scripts/seed-videos.mjs).
  const files = (await readdir(SEED_DIR)).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));

  const entries = [];
  for (const file of files.sort()) {
    const mod = await import(pathToFileURL(path.join(SEED_DIR, file)).href);
    const { eraSlug, videos } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(videos)) {
      console.warn(`sync-longlive-videos: skipping ${file}: expected { eraSlug, videos: [] }`);
      continue;
    }
    for (const v of videos) entries.push({ eraSlug, ...v });
  }
  console.log(`sync-longlive-videos: loaded ${entries.length} video works from local seed files (source of truth).`);
  return buildVideoGuide(entries);
}

async function main() {
  await loadWebEnvLocal();
  const byEra = preferDbSource()
    ? ((await fetchFromSupabase()) ?? (await fetchFromLocalFiles()))
    : await fetchFromLocalFiles();
  await writeFile(OUT_FILE, renderModule(byEra), 'utf-8');
  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(
    `Synced ${total} video works across ${Object.keys(byEra).length} eras -> ${path.relative(ROOT, OUT_FILE)}`,
  );
}

// Only run when invoked directly (`node scripts/sync-longlive-videos.mjs`) —
// importing this module for its pure functions (tests) must not write files.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'sync-longlive-videos' });
}
