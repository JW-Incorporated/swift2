#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/clownbot-lore.generated.ts — the raw
// LORE array Clownbot's no-DB fallback (clownbot-lore.ts) reads. Mirrors
// scripts/sync-longlive-era-secrets.mjs's shape: a single seed file is the
// authored source of truth, this script is a pure normalize-and-render step,
// and the built file is checked into `check:generated` like every other
// generated vault artifact.
//
// Source of truth: supabase/seed/clownbot-lore/clownbot-lore.mjs, exporting
// `{ updatedOn, items: [...] }`. Fable ruling FR-t_2745eb60-1 (issue #3515,
// 2026-09-04): this replaces hand-editing apps/web/lib/longlive/
// clownbot-lore.ts directly from the unattended Rumor Desk lane — see
// docs/content-ops/clownbot-rumor-refresh.md for the full refresh path.
//
// Pure normalization lives in the exported functions below so it can be
// unit-tested (scripts/sync-clownbot-lore.test.ts); `main` only runs when the
// file is invoked directly.

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, esc } from './lib/longlive-sync-shared.mjs';
import { runMain } from './lib/cli.mjs';

const SEED_FILE = path.join(ROOT, 'supabase', 'seed', 'clownbot-lore', 'clownbot-lore.mjs');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'clownbot-lore.generated.ts');

const LORE_STATUSES = new Set(['rumor', 'reported', 'confirmed', 'debunked']);
const LEDGER_VERDICTS = new Set(['clowned', 'confirmed']);
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const trimmed = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * At least one real https source, same "no source, no ship" rule every other
 * generator in this family enforces (sourcesFrom in longlive-sync-shared.mjs
 * is deliberately not reused here — that helper accepts the audit's §5 legacy
 * shapes this file never had, and folds a bare sourceUrl in as a fallback,
 * neither of which apply to lore's plain {name,url} sources).
 */
function normalizeSources(rawSources) {
  if (!Array.isArray(rawSources)) return [];
  const out = [];
  for (const s of rawSources) {
    if (!s || typeof s !== 'object') continue;
    const name = trimmed(s.name);
    const url = trimmed(s.url);
    if (!name || !/^https:\/\/\S+$/.test(url)) continue;
    out.push({ name, url });
  }
  return out;
}

function normalizeLedger(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const theory = trimmed(raw.theory);
  const on = trimmed(raw.on);
  if (!theory || !LEDGER_VERDICTS.has(raw.verdict) || !ISO_DATE_RE.test(on)) return null;
  return { theory, verdict: raw.verdict, on };
}

/**
 * Normalize one raw lore item into the LoreItem shape, or null when it isn't
 * renderable. "No source, no ship" is a generator-level guarantee, not a
 * hope: an item missing its id/headline/detail/dates, an unknown status, or
 * zero real sources is dropped rather than shipped malformed — mirrors every
 * sibling generator (era-secrets, theories) refusing to guess at a bad
 * record instead of emitting one.
 */
export function normalizeLoreItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = trimmed(raw.id);
  const headline = trimmed(raw.headline);
  const detail = trimmed(raw.detail);
  const date = trimmed(raw.date);
  const lastCheckedOn = trimmed(raw.lastCheckedOn);
  if (!id || !headline || !detail) return null;
  if (!LORE_STATUSES.has(raw.status)) return null;
  if (!ISO_DATE_RE.test(date) || !ISO_DATE_RE.test(lastCheckedOn)) return null;
  const sources = normalizeSources(raw.sources);
  if (sources.length === 0) return null;

  const prompts = Array.isArray(raw.prompts)
    ? raw.prompts.map((p) => trimmed(p)).filter(Boolean)
    : [];
  const tags = Array.isArray(raw.tags) ? raw.tags.map((t) => trimmed(t)).filter(Boolean) : [];
  const ledger = normalizeLedger(raw.ledger);

  return {
    id,
    status: raw.status,
    date,
    lastCheckedOn,
    headline,
    detail,
    sources,
    ...(prompts.length ? { prompts } : {}),
    ...(ledger ? { ledger } : {}),
    ...(raw.evergreen === true ? { evergreen: true } : {}),
    ...(tags.length ? { tags } : {}),
  };
}

/**
 * Normalize the whole seed export into `{ updatedOn, items }`. De-dupes by
 * id (first wins — an authoring slip, not a second edition, same convention
 * as buildEraSecrets/buildTheoryGuide). Falls back to today's UTC date when
 * `updatedOn` is missing/malformed rather than silently emitting an invalid
 * freshness stamp.
 */
export function buildLore({ updatedOn, items }) {
  const cleanUpdatedOn = ISO_DATE_RE.test(trimmed(updatedOn))
    ? trimmed(updatedOn)
    : new Date().toISOString().slice(0, 10);
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(items) ? items : []) {
    const normalized = normalizeLoreItem(raw);
    if (!normalized) continue;
    if (seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    out.push(normalized);
  }
  return { updatedOn: cleanUpdatedOn, items: out };
}

/** Render the generated TypeScript module. Pure string building. */
export function renderModule({ updatedOn, items }) {
  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-clownbot-lore.mjs from');
  lines.push('// supabase/seed/clownbot-lore/clownbot-lore.mjs.');
  lines.push("// Re-run that script after the seed changes; don't edit this file directly.");
  lines.push('// Refresh path: docs/content-ops/clownbot-rumor-refresh.md.');
  lines.push('');
  lines.push("import type { LoreItem } from './types';");
  lines.push('');
  lines.push(`export const LORE_UPDATED_ON = ${esc(updatedOn)};`);
  lines.push('');
  lines.push('export const LORE_RAW: LoreItem[] = [');
  for (const item of items) {
    lines.push('  {');
    lines.push(`    id: ${esc(item.id)},`);
    lines.push(`    status: ${esc(item.status)},`);
    lines.push(`    date: ${esc(item.date)},`);
    lines.push(`    lastCheckedOn: ${esc(item.lastCheckedOn)},`);
    lines.push(`    headline: ${esc(item.headline)},`);
    lines.push(`    detail: ${esc(item.detail)},`);
    const srcs = item.sources.map((s) => `{ name: ${esc(s.name)}, url: ${esc(s.url)} }`).join(', ');
    lines.push(`    sources: [${srcs}],`);
    if (item.prompts) {
      lines.push(`    prompts: [${item.prompts.map(esc).join(', ')}],`);
    }
    if (item.ledger) {
      lines.push(
        `    ledger: { theory: ${esc(item.ledger.theory)}, verdict: ${esc(item.ledger.verdict)}, on: ${esc(item.ledger.on)} },`,
      );
    }
    if (item.evergreen) {
      lines.push('    evergreen: true,');
    }
    if (item.tags) {
      lines.push(`    tags: [${item.tags.map(esc).join(', ')}],`);
    }
    lines.push('  },');
  }
  lines.push('];');
  lines.push('');
  return lines.join('\n');
}

/** Load the local supabase/seed/clownbot-lore/clownbot-lore.mjs seed file. */
async function loadSeed() {
  const mod = await import(pathToFileURL(SEED_FILE).href);
  return mod.default ?? mod;
}

async function main() {
  const raw = await loadSeed();
  const { updatedOn, items } = buildLore(raw);
  await writeFile(OUT_FILE, renderModule({ updatedOn, items }), 'utf-8');
  console.log(
    `Synced ${items.length} clownbot lore item(s), updatedOn ${updatedOn} -> ${path.relative(ROOT, OUT_FILE)}`,
  );
}

// Only run when invoked directly — importing this module for its pure
// functions (tests) must not write files.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'sync-clownbot-lore' });
}
