#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/clownbot-lore.ts — Clownbot's no-DB
// status-tagged rumor/lore fallback. Mirrors scripts/sync-longlive-era-secrets.mjs:
// local-seed-only (no live-DB path — there is no `clownbot_lore` table), pure
// normalization exported for unit tests, `main` only runs when invoked
// directly.
//
// Fable ruling FR-t_2745eb60-1 (#3515): the fallback data moves from
// hand-authored app source to a seed-authored source (this generator, reading
// supabase/seed/content/clownbot-lore.mjs), keeping refresh inside the
// existing seed-only Vault Run lane. `apps/web/lib/longlive/clownbot-lore.ts`
// is now GENERATED — never hand-edit it; edit the seed file and run
// `npm run sync:content` (or this script directly).
//
// Source of truth: supabase/seed/clownbot-lore/clownbot-lore.mjs, exporting
// `{ updatedOn, items: LoreItem[] }` (see that file's header for the exact
// shape). Wired as the final step in `sync:content` (package.json).

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, esc } from './lib/longlive-sync-shared.mjs';

const SEED_FILE = path.join(ROOT, 'supabase', 'seed', 'clownbot-lore', 'clownbot-lore.mjs');
// (Content generators use `supabase/seed/content/**` — this fallback's seed
// lives in its own sibling directory so scripts/sync-longlive-content.mjs's
// directory scan of supabase/seed/content/ never picks it up as a moment.)
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'clownbot-lore.ts');

const VALID_STATUS = new Set(['rumor', 'reported', 'confirmed', 'debunked']);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const trimmed = (v) => (typeof v === 'string' ? v.trim() : '');

/**
 * Normalize one raw source `{ outlet, url }` into the generated `LoreSource`
 * shape `{ name, url }`. Drops entries without a non-https-or-empty url; the
 * caller drops the whole item if this leaves zero sources ("no source, no
 * ship" — `clownbot-lore.test.ts` enforces the same rule on the output).
 */
export function normalizeSource({ outlet, url } = {}) {
  const cleanUrl = trimmed(url);
  if (!/^https:\/\/\S+$/.test(cleanUrl)) return null;
  const name = trimmed(outlet);
  if (!name) return null;
  return { name, url: cleanUrl };
}

/**
 * Normalize one raw seed item into the UI's `LoreItem` shape, or null when it
 * isn't renderable. Mirrors the guards `clownbot-lore.test.ts` enforces on
 * the generated output, so a malformed seed item fails LOUD at sync time
 * instead of shipping a build that then fails CI with no context.
 */
export function normalizeLoreItem(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = trimmed(raw.id);
  const headline = trimmed(raw.headline);
  const detail = trimmed(raw.detail);
  if (!id || !headline || !detail) return null;
  if (!VALID_STATUS.has(raw.status)) return null;
  if (!ISO_DATE.test(raw.date) || !Number.isFinite(Date.parse(raw.date))) return null;
  if (!ISO_DATE.test(raw.lastCheckedOn)) return null;

  const sources = (Array.isArray(raw.sources) ? raw.sources : [])
    .map(normalizeSource)
    .filter(Boolean);
  if (sources.length === 0) return null;

  const prompts = Array.isArray(raw.prompts) ? raw.prompts.map(trimmed).filter(Boolean) : [];

  let ledger;
  if (raw.ledger && typeof raw.ledger === 'object') {
    const theory = trimmed(raw.ledger.theory);
    const verdict = raw.ledger.verdict;
    const on = trimmed(raw.ledger.on);
    if (theory && (verdict === 'clowned' || verdict === 'confirmed') && ISO_DATE.test(on)) {
      ledger = { theory, verdict, on };
    }
  }

  const tags = Array.isArray(raw.tags) ? raw.tags.map(trimmed).filter(Boolean) : [];

  return {
    id,
    status: raw.status,
    date: raw.date,
    lastCheckedOn: raw.lastCheckedOn,
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
 * De-dupe by id (first wins — an authoring slip, not a second edition, same
 * convention as scripts/sync-longlive-theories.mjs `buildTheoryGuide`).
 */
export function buildLoreList(rawItems) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(rawItems) ? rawItems : []) {
    const item = normalizeLoreItem(raw);
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function sourceLiteral(s) {
  return `{ name: ${esc(s.name)}, url: ${esc(s.url)} }`;
}

/** Render one LoreItem as TS object literal lines (4-space indent). */
function renderItem(item) {
  const lines = [];
  lines.push('  {');
  lines.push(`    id: ${esc(item.id)},`);
  lines.push(`    status: ${esc(item.status)},`);
  lines.push(`    date: ${esc(item.date)},`);
  lines.push(`    lastCheckedOn: ${esc(item.lastCheckedOn)},`);
  lines.push(`    headline: ${esc(item.headline)},`);
  lines.push(`    detail: ${esc(item.detail)},`);
  lines.push(`    sources: [${item.sources.map(sourceLiteral).join(', ')}],`);
  if (item.prompts?.length) {
    lines.push(`    prompts: [${item.prompts.map(esc).join(', ')}],`);
  }
  if (item.ledger) {
    lines.push(
      `    ledger: { theory: ${esc(item.ledger.theory)}, verdict: ${esc(item.ledger.verdict)}, on: ${esc(item.ledger.on)} },`,
    );
  }
  if (item.evergreen) lines.push('    evergreen: true,');
  if (item.tags?.length) lines.push(`    tags: [${item.tags.map(esc).join(', ')}],`);
  lines.push('  },');
  return lines.join('\n');
}

/**
 * Render the full generated module. The runtime helpers (loreById,
 * daysBetween, loreFreshness, LoreItem/LoreStatus/etc types) are pure
 * functions of LORE/LORE_UPDATED_ON/FRESH_WINDOW_DAYS and never change per
 * sweep, so they are emitted verbatim here rather than re-derived — same
 * pattern as the other *.generated.ts files keeping their data separate from
 * (thin) display logic, except here the "display logic" is these few pure
 * helpers that ship inside the generated file itself because nothing else
 * imports them independently.
 */
export function renderModule({ updatedOn, items }) {
  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-clownbot-lore.mjs from');
  lines.push('// supabase/seed/content/clownbot-lore.mjs (the authored source of truth,');
  lines.push('// per Fable ruling FR-t_2745eb60-1, #3515).');
  lines.push(
    "// Re-run `npm run sync:content` after editing the seed; don't edit this file directly.",
  );
  lines.push('//');
  lines.push('// THE RULE THAT GOVERNS THIS FILE: no source, no ship. Every item carries at');
  lines.push('// least one named outlet with a real URL and a real date. Nothing in here was');
  lines.push('// written from memory, inferred, or "probably about right" — a bot asserting a');
  lines.push('// debunked rumor as live is instant credibility death (research finding #8),');
  lines.push('// and a bot asserting a *fabricated* rumor is worse. `clownbot-lore.test.ts`');
  lines.push('// enforces the shape; a human (or frontier model) enforces the truth at the seed.');
  lines.push('//');
  lines.push('// PRIVACY: every item is checked against docs/content-ops/privacy-redlines.md');
  lines.push('// BEFORE it is written down, not after.');
  lines.push('//');
  lines.push('// REFRESH PATH: docs/content-ops/clownbot-rumor-refresh.md. The news cycle');
  lines.push('// moves in hours, so `LORE_UPDATED_ON` is surfaced to the reader and the');
  lines.push('// surface says plainly when it is stale rather than pretending to be live.');
  lines.push('');
  lines.push('/** Where a claim sits in its lifecycle. Mirrors RumorStatus in types.ts. */');
  lines.push("export type LoreStatus = 'rumor' | 'reported' | 'confirmed' | 'debunked';");
  lines.push('');
  lines.push('export interface LoreSource {');
  lines.push('  name: string;');
  lines.push('  url: string;');
  lines.push('}');
  lines.push('');
  lines.push(
    '/** How a fandom prediction actually landed. Powers the CLOWNED/CONFIRMED ledger. */',
  );
  lines.push('export interface LoreLedger {');
  lines.push('  /** What the fandom committed to, in our words. */');
  lines.push('  theory: string;');
  lines.push('  /** clowned = the fandom was wrong and we own it. confirmed = called it. */');
  lines.push("  verdict: 'clowned' | 'confirmed';");
  lines.push('  /** ISO date the verdict landed. */');
  lines.push('  on: string;');
  lines.push('}');
  lines.push('');
  lines.push('export interface LoreItem {');
  lines.push('  /** Stable id. The model cites this as a receipt; unknown ids are dropped. */');
  lines.push('  id: string;');
  lines.push('  status: LoreStatus;');
  lines.push('  /** ISO date the event happened, or the date it was reported. */');
  lines.push('  date: string;');
  lines.push("  /** ISO date a human last verified this item's status. */");
  lines.push('  lastCheckedOn: string;');
  lines.push('  /** One line, our words. */');
  lines.push('  headline: string;');
  lines.push('  /** 1–3 sentences, our words. Never asserts beyond `status`. */');
  lines.push('  detail: string;');
  lines.push('  /** At least one. Real outlet, real URL. */');
  lines.push('  sources: LoreSource[];');
  lines.push('  /** Suggested-prompt seeds this item can power. Empty = not prompt-worthy. */');
  lines.push('  prompts?: string[];');
  lines.push('  ledger?: LoreLedger;');
  lines.push('  /** Evergreen items stay in the prompt pool once the fresh window empties. */');
  lines.push('  evergreen?: boolean;');
  lines.push('  tags?: string[];');
  lines.push('}');
  lines.push('');
  lines.push('/** The date an editorial sweep last checked this file. Surfaced to the reader. */');
  lines.push(`export const LORE_UPDATED_ON = ${esc(updatedOn)};`);
  lines.push('');
  lines.push('/** A rumor/reported item older than this is no longer "live" for prompts. */');
  lines.push('export const FRESH_WINDOW_DAYS = 14;');
  lines.push('');
  lines.push('export const LORE: readonly LoreItem[] = [');
  for (const item of items) lines.push(renderItem(item));
  lines.push('];');
  lines.push('');
  lines.push('/** Fast id lookup. Built once at module load. */');
  lines.push('const BY_ID = new Map<string, LoreItem>(LORE.map((item) => [item.id, item]));');
  lines.push('');
  lines.push('export function loreById(id: string): LoreItem | undefined {');
  lines.push('  return BY_ID.get(id);');
  lines.push('}');
  lines.push('');
  lines.push('/** Whole days between two ISO dates, floored at 0. */');
  lines.push('export function daysBetween(fromIso: string, to: Date): number {');
  lines.push('  const from = Date.parse(`${fromIso}T00:00:00Z`);');
  lines.push('  if (!Number.isFinite(from)) return Number.POSITIVE_INFINITY;');
  lines.push('  const delta = Math.floor((to.getTime() - from) / 86_400_000);');
  lines.push('  return delta < 0 ? 0 : delta;');
  lines.push('}');
  lines.push('');
  lines.push('export interface LoreFreshness {');
  lines.push('  updatedOn: string;');
  lines.push('  /** Days since a human last swept the file. */');
  lines.push('  ageDays: number;');
  lines.push('  /** True once the sweep is older than the fresh window. */');
  lines.push('  stale: boolean;');
  lines.push('  /** Open items whose status was checked inside the fresh window. */');
  lines.push('  liveCount: number;');
  lines.push('}');
  lines.push('');
  lines.push('/**');
  lines.push(' * What the surface tells the reader about how current this is. Staleness is');
  lines.push(' * SHOWN, never hidden (research finding #8) — a bot that looks live while');
  lines.push(' * running on four-month-old lore is the failure mode we are avoiding.');
  lines.push(' */');
  lines.push('export function loreFreshness(now: Date): LoreFreshness {');
  lines.push('  const ageDays = daysBetween(LORE_UPDATED_ON, now);');
  lines.push('  const liveCount = LORE.filter(');
  lines.push('    (item) =>');
  lines.push("      (item.status === 'rumor' || item.status === 'reported') &&");
  lines.push('      daysBetween(item.lastCheckedOn, now) <= FRESH_WINDOW_DAYS,');
  lines.push('  ).length;');
  lines.push('  return {');
  lines.push('    updatedOn: LORE_UPDATED_ON,');
  lines.push('    ageDays,');
  lines.push('    stale: ageDays > FRESH_WINDOW_DAYS,');
  lines.push('    liveCount,');
  lines.push('  };');
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const mod = await import(pathToFileURL(SEED_FILE).href);
  const { updatedOn, items } = mod.default ?? mod;
  if (!ISO_DATE.test(updatedOn)) {
    throw new Error(`sync-clownbot-lore: seed updatedOn must be an ISO date, got ${updatedOn}`);
  }
  const lore = buildLoreList(items);
  if (lore.length === 0) {
    throw new Error(
      'sync-clownbot-lore: seed produced zero renderable items — refusing to write an empty fallback.',
    );
  }
  await writeFile(OUT_FILE, renderModule({ updatedOn, items: lore }), 'utf-8');
  console.log(`Synced ${lore.length} Clownbot lore items -> ${path.relative(ROOT, OUT_FILE)}`);
}

// Only run when invoked directly (`node scripts/sync-clownbot-lore.mjs`) —
// importing this module for its pure functions (tests) must not write files.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
