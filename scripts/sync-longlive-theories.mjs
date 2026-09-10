#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/theories.generated.ts — the LongLive UI's
// static per-era easter-egg/fan-theory guide (audit T1). Mirrors
// scripts/sync-longlive-tracks.mjs exactly:
//
// Source of truth: the local supabase/seed/theories/*.mjs files — what
// content PRs review and merge (decision 2026-07-17; supersedes the
// 2026-07-08 DB-first order). Runs at build time (wired as `prebuild` in
// apps/web/package.json), so the shipped UI stays fully static — no per-user
// DB calls, per the cost-discipline rule. Set LONGLIVE_SYNC_SOURCE=db to read
// the live Supabase `theory` table first instead, with seeds as fallback.
// Same output shape either way.
//
// Pure normalization lives in the exported functions below so it can be
// unit-tested (scripts/sync-longlive-theories.test.ts); `main` only runs when
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
import { runMain } from './lib/cli.mjs';

const SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'theories');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'theories.generated.ts');

// Same columns the seed runner (scripts/seed-theories.mjs) writes. Explicit
// `.limit()` + cap check so a partial page can never silently ship a
// truncated guide.
const THEORY_COLS = 'era_slug,slug,kind,title,claim,evidence,confidence,outcome,sources,related_slugs';
const MAX_ROWS = 2000;

// Mirrors THEORY_CONFIDENCE / THEORY_OUTCOMES in packages/shared/src/
// vault-types.ts (the source of truth). Both fields are REQUIRED on every
// theory — they render as badges so speculation never reads as fact — so a
// record with a missing/unknown value is dropped, never guessed at.
export const CONFIDENCE_VALUES = new Set([
  'official',
  'confirmed_interview',
  'reputable_reporting',
  'strong_fan_consensus',
  'plausible',
  'clowning',
  'disproven',
  'joke_meme',
]);
export const OUTCOME_VALUES = new Set([
  'confirmed',
  'partially_confirmed',
  'pending',
  'debunked',
  'abandoned',
  'unfalsifiable',
]);

const trimmed = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Normalize one raw theory (seed-file or DB shape) into the UI's TheoryNote
 * shape, or null when it isn't renderable. The UI's whole point is honest,
 * badge-labeled speculation, so a record missing its slug, title, claim,
 * a valid confidence, a valid outcome, or a real source is dropped.
 */
/**
 * Resolves raw `relatedSlugs` entries (seed shape: `<seed-era-slug>:<theory-
 * slug>`, e.g. `debut:lucky-number-13`) to `${EraId}:${slug}` pairs the UI
 * can look up directly, mapping the seed's era slug through SLUG_TO_ERA_ID
 * the same way era content does. Malformed entries are dropped rather than
 * guessed at; cross-existence (does the target theory actually exist) is
 * checked live by the UI, not here, since a related theory in another file
 * may not have been processed yet at this point in the build.
 */
export function relatedSlugsFrom(relatedSlugs) {
  if (!Array.isArray(relatedSlugs)) return [];
  const out = [];
  for (const r of relatedSlugs) {
    if (typeof r !== 'string') continue;
    const m = r.match(/^([a-z0-9-]+):(.+)$/);
    if (!m) continue;
    const eraId = SLUG_TO_ERA_ID[m[1]] ?? m[1];
    out.push(`${eraId}:${m[2]}`);
  }
  return out;
}

export function normalizeTheory({ slug, kind, title, claim, evidence, confidence, outcome, sources, relatedSlugs }) {
  const cleanSlug = trimmed(slug);
  const cleanTitle = trimmed(title);
  const cleanClaim = trimmed(claim);
  if (!cleanSlug || !cleanTitle || !cleanClaim) return null;
  if (!CONFIDENCE_VALUES.has(confidence) || !OUTCOME_VALUES.has(outcome)) return null;
  const resolvedSources = sourcesFrom(sources, null);
  if (resolvedSources.length === 0) return null;
  const resolvedRelated = relatedSlugsFrom(relatedSlugs);
  return {
    slug: cleanSlug,
    kind: kind === 'easter_egg' ? 'easter_egg' : 'theory',
    title: cleanTitle,
    claim: cleanClaim,
    evidence: trimmed(evidence) || null,
    confidence,
    outcome,
    sources: resolvedSources,
    ...(resolvedRelated.length ? { relatedSlugs: resolvedRelated } : {}),
  };
}

/**
 * Group raw `{ eraSlug, ...theory }` entries into the generated
 * `Partial<Record<EraId, TheoryNote[]>>` map: seed/DB era slugs mapped to
 * EraIds, unrenderable records dropped, duplicate slugs within an era de-duped
 * (first wins — the seed runner replaces an era wholesale, so a dupe is an
 * authoring slip, not a second edition). Authored order is preserved: theory
 * files are curated reading order, not a dated timeline.
 */
export function buildTheoryGuide(entries) {
  const byEra = {};
  const seenSlugs = {};
  for (const { eraSlug, ...theory } of entries) {
    const normalized = normalizeTheory(theory);
    if (!normalized) continue;
    const eraId = SLUG_TO_ERA_ID[eraSlug] ?? eraSlug;
    const seen = (seenSlugs[eraId] ??= new Set());
    if (seen.has(normalized.slug)) continue;
    seen.add(normalized.slug);
    (byEra[eraId] ??= []).push(normalized);
  }
  return byEra;
}

/** Render the generated TypeScript module. Pure string building. */
export function renderModule(byEra) {
  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-longlive-theories.mjs from supabase/seed/theories/**');
  lines.push('// (or the live Supabase theory table when configured).');
  lines.push("// Re-run that script after theory-seed changes; don't edit this file directly.");
  lines.push('');
  lines.push("import type { EraId, TheoryNote } from '@swift2/experience';");
  lines.push('');
  lines.push('export const THEORIES_RAW: Partial<Record<EraId, TheoryNote[]>> = {');
  for (const eraId of Object.keys(byEra).sort()) {
    lines.push(`  ${esc(eraId)}: [`);
    for (const t of byEra[eraId]) {
      lines.push('    {');
      lines.push(`      slug: ${esc(t.slug)},`);
      lines.push(`      kind: ${esc(t.kind)},`);
      lines.push(`      title: ${esc(t.title)},`);
      lines.push(`      claim: ${esc(t.claim)},`);
      lines.push(`      evidence: ${t.evidence === null ? 'null' : esc(t.evidence)},`);
      lines.push(`      confidence: ${esc(t.confidence)},`);
      lines.push(`      outcome: ${esc(t.outcome)},`);
      const srcs = t.sources.map(sourceLiteral).join(', ');
      lines.push(`      sources: [${srcs}],`);
      if (t.relatedSlugs && t.relatedSlugs.length) {
        lines.push(`      relatedSlugs: [${t.relatedSlugs.map(esc).join(', ')}],`);
      }
      lines.push('    },');
    }
    lines.push('  ],');
  }
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

/** Live source: the Supabase theory table. Returns null if unreachable/unconfigured. */
async function fetchFromSupabase() {
  const env = supabaseEnv();
  if (!env) {
    console.log('sync-longlive-theories: no Supabase env, falling back to local seed files.');
    return null;
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('theory')
    .select(THEORY_COLS)
    .order('era_slug', { ascending: true })
    // uuid ids are random — created_at preserves the seed file's curated
    // reading order (the seed runner inserts rows sequentially).
    .order('created_at', { ascending: true })
    .limit(MAX_ROWS);

  if (error) {
    console.warn(`sync-longlive-theories: Supabase fetch failed (${error.message}), falling back to local seed files.`);
    return null;
  }
  if (!data || data.length === 0) {
    console.warn('sync-longlive-theories: Supabase returned 0 theories, falling back to local seed files.');
    return null;
  }
  if (data.length >= MAX_ROWS) {
    console.warn(
      `sync-longlive-theories: Supabase theory hit the ${MAX_ROWS}-row cap — result would be truncated, falling back to local seed files.`,
    );
    return null;
  }

  const entries = data.map((row) => ({
    eraSlug: row.era_slug,
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    claim: row.claim,
    evidence: row.evidence,
    confidence: row.confidence,
    outcome: row.outcome,
    sources: row.sources,
    relatedSlugs: row.related_slugs,
  }));
  console.log(`sync-longlive-theories: loaded ${entries.length} theories from Supabase (live).`);
  return buildTheoryGuide(entries);
}

/** Fallback source: the local supabase/seed/theories/*.mjs files. */
async function fetchFromLocalFiles() {
  // Files starting with "_" are templates, not real content (same convention
  // as scripts/seed-theories.mjs).
  const files = (await readdir(SEED_DIR)).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));

  const entries = [];
  for (const file of files.sort()) {
    const mod = await import(pathToFileURL(path.join(SEED_DIR, file)).href);
    const { eraSlug, theories } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(theories)) {
      console.warn(`sync-longlive-theories: skipping ${file}: expected { eraSlug, theories: [] }`);
      continue;
    }
    for (const t of theories) entries.push({ eraSlug, ...t });
  }
  console.log(`sync-longlive-theories: loaded ${entries.length} theories from local seed files (source of truth).`);
  return buildTheoryGuide(entries);
}

async function main() {
  await loadWebEnvLocal();
  const byEra = preferDbSource()
    ? ((await fetchFromSupabase()) ?? (await fetchFromLocalFiles()))
    : await fetchFromLocalFiles();
  await writeFile(OUT_FILE, renderModule(byEra), 'utf-8');
  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(
    `Synced ${total} theories across ${Object.keys(byEra).length} eras -> ${path.relative(ROOT, OUT_FILE)}`,
  );
}

// Only run when invoked directly (`node scripts/sync-longlive-theories.mjs`) —
// importing this module for its pure functions (tests) must not write files.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'sync-longlive-theories' });
}
