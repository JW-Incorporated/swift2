#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/era-secrets.generated.ts — the LongLive
// UI's static per-era "Era Secret" pool (#688): one sourced, genuinely-obscure
// fact that greets every era entry. Mirrors scripts/sync-longlive-theories.mjs,
// minus the live-DB path: there is no `era_secret` table today, so this reads
// the local seed files only (still the source of truth either way — decision
// 2026-07-17). Wire a DB source here the day one exists.
//
// Source of truth: supabase/seed/era-secrets/*.mjs, each exporting
// `{ eraSlug, secrets: [...] }`. Runs at build time (wired as `prebuild` in
// apps/web/package.json), so the shipped UI stays fully static — no per-user
// DB calls, per the cost-discipline rule.
//
// Pure normalization lives in the exported functions below so it can be
// unit-tested (scripts/sync-longlive-era-secrets.test.ts); `main` only runs
// when the file is invoked directly.

import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, SLUG_TO_ERA_ID, esc, sourcesFrom } from './lib/longlive-sync-shared.mjs';

const SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'era-secrets');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'era-secrets.generated.ts');

// A `deeperLink` is an optional hop into the site, resolved at render time
// (song:/moment:/egg:). An unresolvable one degrades to no link rather than a
// dead one, so this is a shape lint, not a cross-existence guarantee.
const DEEPER_LINK_RE = /^(song|moment|egg):.+/;

const trimmed = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Normalize one raw secret (seed-file shape) into the UI's EraSecret shape, or
 * null when it isn't renderable. Every Era Secret must be real and sourced, so
 * a record missing its slug, title, the fact itself, or a real source is
 * dropped — never invented to fill an era.
 */
export function normalizeSecret({ slug, title, secret, deeperLink, sources }) {
  const cleanSlug = trimmed(slug);
  const cleanTitle = trimmed(title);
  const cleanSecret = trimmed(secret);
  if (!cleanSlug || !cleanTitle || !cleanSecret) return null;
  const resolvedSources = sourcesFrom(sources, null);
  if (resolvedSources.length === 0) return null;
  const cleanLink = trimmed(deeperLink);
  return {
    slug: cleanSlug,
    title: cleanTitle,
    secret: cleanSecret,
    ...(cleanLink && DEEPER_LINK_RE.test(cleanLink) ? { deeperLink: cleanLink } : {}),
    sources: resolvedSources,
  };
}

/**
 * Group raw `{ eraSlug, ...secret }` entries into the generated
 * `Partial<Record<EraId, EraSecret[]>>` map: seed era slugs mapped to EraIds,
 * unrenderable records dropped, duplicate slugs within an era de-duped (first
 * wins). Authored order is preserved — the pool order seeds the daily rotation.
 */
export function buildEraSecrets(entries) {
  const byEra = {};
  const seenSlugs = {};
  for (const { eraSlug, ...secret } of entries) {
    const normalized = normalizeSecret(secret);
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
  lines.push('// Produced by scripts/sync-longlive-era-secrets.mjs from supabase/seed/era-secrets/**');
  lines.push("// Re-run that script after era-secret-seed changes; don't edit this file directly.");
  lines.push('');
  lines.push("import type { EraId, EraSecret } from './types';");
  lines.push('');
  lines.push('export const ERA_SECRETS_RAW: Partial<Record<EraId, EraSecret[]>> = {');
  for (const eraId of Object.keys(byEra).sort()) {
    lines.push(`  ${esc(eraId)}: [`);
    for (const s of byEra[eraId]) {
      lines.push('    {');
      lines.push(`      slug: ${esc(s.slug)},`);
      lines.push(`      title: ${esc(s.title)},`);
      lines.push(`      secret: ${esc(s.secret)},`);
      if (s.deeperLink) lines.push(`      deeperLink: ${esc(s.deeperLink)},`);
      const srcs = s.sources.map((x) => `{ name: ${esc(x.name)}, url: ${esc(x.url)} }`).join(', ');
      lines.push(`      sources: [${srcs}],`);
      lines.push('    },');
    }
    lines.push('  ],');
  }
  lines.push('};');
  lines.push('');
  return lines.join('\n');
}

/** Load the local supabase/seed/era-secrets/*.mjs files. */
async function fetchFromLocalFiles() {
  // Files starting with "_" are templates, not real content.
  const files = (await readdir(SEED_DIR)).filter((f) => f.endsWith('.mjs') && !f.startsWith('_'));

  const entries = [];
  for (const file of files.sort()) {
    const mod = await import(pathToFileURL(path.join(SEED_DIR, file)).href);
    const { eraSlug, secrets } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(secrets)) {
      console.warn(`sync-longlive-era-secrets: skipping ${file}: expected { eraSlug, secrets: [] }`);
      continue;
    }
    for (const s of secrets) entries.push({ eraSlug, ...s });
  }
  console.log(`sync-longlive-era-secrets: loaded ${entries.length} secrets from local seed files.`);
  return buildEraSecrets(entries);
}

async function main() {
  const byEra = await fetchFromLocalFiles();
  await writeFile(OUT_FILE, renderModule(byEra), 'utf-8');
  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(
    `Synced ${total} era secrets across ${Object.keys(byEra).length} eras -> ${path.relative(ROOT, OUT_FILE)}`,
  );
}

// Only run when invoked directly — importing for the pure functions (tests)
// must not write files.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
