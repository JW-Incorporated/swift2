#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/merch.generated.ts — the LongLive UI's
// Marketplace catalogue engine output (Fable 5.1 architecture review, R11;
// see docs/reviews/2026-09-fable-architecture-review.md §"Wave 2"). Mirrors
// the other scripts/sync-longlive-*.mjs generators in shape, but is
// deliberately a straight pass-through: `supabase/seed/merch/official.mjs`
// and `supabase/seed/merch/fanmade.mjs` are ALREADY the fully-authored,
// engine-produced/evidence-backed shape `merch.ts` consumes (unlike
// theories/tracks/videos, there is no seed-shape-to-UI-shape normalization
// step here — `merch.ts`'s own `catalogueItems()` does the one runtime
// normalization that exists, mapping each item's free-form `kind` string
// onto the fixed `MerchItem['kind']` union). This generator's only job is to
// stop `apps/web/lib/longlive/merch.ts` (app code) from reaching across a
// `../../../../supabase/seed/...` relative import into the seed tree
// directly — the same app→seed layering violation R10 fixed for content ids.
//
// Source of truth: supabase/seed/merch/{official,fanmade}.mjs — what the
// merch engine (scripts/merch-engine/**) and the E5 fan-made evidence
// workflow write, and what content PRs review and merge. No DB source exists
// for merch (unlike content/theories/tracks — `LONGLIVE_SYNC_SOURCE=db` does
// not apply here).
//
// Pure functions are exported for scripts/sync-longlive-merch.test.ts;
// `main` only runs when the file is invoked directly (same convention as
// every other sync-longlive-*.mjs).

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './lib/longlive-sync-shared.mjs';

const OFFICIAL_SEED_FILE = path.join(ROOT, 'supabase', 'seed', 'merch', 'official.mjs');
const FANMADE_SEED_FILE = path.join(ROOT, 'supabase', 'seed', 'merch', 'fanmade.mjs');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'merch.generated.ts');

/**
 * Render one seed array as a TS literal. The seed files already hold plain
 * JSON-compatible data (strings/numbers/booleans/arrays/objects — see
 * `supabase/seed/merch/official.mjs`'s own JSON-style quoted keys), so
 * `JSON.stringify` produces valid TypeScript object-literal syntax directly;
 * no per-field escaping helper is needed the way `esc()`/`sourceLiteral()`
 * are for the hand-authored generated vaults.
 */
function renderArray(items) {
  return JSON.stringify(items, null, 2);
}

/** Render the generated TypeScript module. Pure string building. */
export function renderModule(official, fanMade) {
  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-longlive-merch.mjs from supabase/seed/merch/**.');
  lines.push("// Re-run that script after merch-seed changes; don't edit this file directly.");
  lines.push('');
  lines.push('/**');
  lines.push(' * One authored/evidenced merch listing, straight off the seed engines —');
  lines.push(' * see supabase/seed/merch/{official,fanmade}.mjs for field provenance.');
  lines.push(' * `merch.ts`\'s `catalogueItems()` normalizes `kind` into `MerchItem[\'kind\']`');
  lines.push(' * at runtime; this type is deliberately the pre-normalization seed shape.');
  lines.push(' */');
  lines.push('export interface MerchSeedItem {');
  lines.push('  brand: string;');
  lines.push('  item: string;');
  lines.push('  retailer: string;');
  lines.push('  url: string;');
  lines.push('  price?: string;');
  lines.push('  inStock?: boolean;');
  lines.push('  imageUrl?: string;');
  lines.push('  /** Free-form engine/evidence-workflow category — normalized at runtime. */');
  lines.push('  kind?: string;');
  lines.push('  discoveredVia?: string;');
  lines.push('  discoveredAt?: string;');
  lines.push('  verifiedAt?: string;');
  lines.push('  /** Official-store listings only — the Shopify product id. */');
  lines.push('  sourceId?: string;');
  lines.push('  /** Fan-made listings only — the E5 evidence-workflow trail. */');
  lines.push('  provenance?: unknown[];');
  lines.push('}');
  lines.push('');
  lines.push(`export const OFFICIAL: MerchSeedItem[] = ${renderArray(official)};`);
  lines.push('');
  lines.push(`export const FAN_MADE: MerchSeedItem[] = ${renderArray(fanMade)};`);
  lines.push('');
  return lines.join('\n');
}

/** Load the local supabase/seed/merch/{official,fanmade}.mjs files. */
async function fetchFromLocalFiles() {
  const officialMod = await import(pathToFileURL(OFFICIAL_SEED_FILE).href);
  const fanmadeMod = await import(pathToFileURL(FANMADE_SEED_FILE).href);
  const official = officialMod.OFFICIAL ?? [];
  const fanMade = fanmadeMod.FAN_MADE ?? [];
  if (!Array.isArray(official)) {
    throw new Error(`sync-longlive-merch: ${OFFICIAL_SEED_FILE} did not export an OFFICIAL array`);
  }
  if (!Array.isArray(fanMade)) {
    throw new Error(`sync-longlive-merch: ${FANMADE_SEED_FILE} did not export a FAN_MADE array`);
  }
  console.log(
    `sync-longlive-merch: loaded ${official.length} official + ${fanMade.length} fan-made listings from local seed files.`,
  );
  return { official, fanMade };
}

async function main() {
  const { official, fanMade } = await fetchFromLocalFiles();
  await writeFile(OUT_FILE, renderModule(official, fanMade), 'utf-8');
  console.log(
    `Synced ${official.length + fanMade.length} merch listings -> ${path.relative(ROOT, OUT_FILE)}`,
  );
}

// Only run when invoked directly (`node scripts/sync-longlive-merch.mjs`) —
// importing this module for its pure functions (tests) must not write files.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
