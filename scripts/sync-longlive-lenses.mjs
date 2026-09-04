#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/lenses.generated.ts — the LongLive UI's
// cross-era Lens datasets (Threads, Relationships, Runway Looks, Re-Records,
// the Clue Web, and The Decode). Fable 5.1 architecture review, R12; see
// docs/reviews/2026-09-fable-architecture-review.md §"Wave 2". Mirrors
// scripts/sync-longlive-merch.mjs in shape: a straight pass-through, because
// (like merch) these seed files are ALREADY the fully-authored shape
// `lenses.ts` consumes — there is no seed-shape-to-UI-shape normalization
// step here the way there is for theories/tracks/videos.
//
// Source of truth: supabase/seed/lenses/*.mjs — what content PRs review and
// merge. No DB source exists for lenses (unlike content/theories/tracks —
// `LONGLIVE_SYNC_SOURCE=db` does not apply here), the same as merch.
//
// This generator's only job is to stop `apps/web/lib/longlive/lenses.ts`
// (app code) from reaching across a `../../../../supabase/seed/...` relative
// import into the seed tree directly — the same app→seed layering violation
// R10 fixed for content ids and R11 fixed for merch.
//
// Pure functions are exported for scripts/sync-longlive-lenses.test.ts;
// `main` only runs when the file is invoked directly (same convention as
// every other sync-longlive-*.mjs).

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './lib/longlive-sync-shared.mjs';
import { runMain } from './lib/cli.mjs';

const SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'lenses');

// Each seed file's default export name, and the TypeScript type its rendered
// array should be annotated with in the generated module (imported from
// './types' at the top of the output). Order here is the order they render
// in — kept the same as the original lenses.ts declaration order so a diff
// against the pre-split file reads cleanly.
const DATASETS = [
  { file: 'threads.mjs', exportName: 'THREADS', type: 'ThreadMeta[]' },
  { file: 'relationships.mjs', exportName: 'RELATIONSHIPS', type: 'Relationship[]' },
  { file: 'single-periods.mjs', exportName: 'SINGLE_PERIODS', type: 'SinglePeriod[]' },
  { file: 'runway-looks.mjs', exportName: 'RUNWAY_LOOKS', type: 'RunwayLook[]' },
  { file: 'rerecords.mjs', exportName: 'RERECORDS', type: 'ReRecord[]' },
  { file: 'egg-nodes.mjs', exportName: 'EGG_NODES', type: 'EggNode[]' },
  { file: 'egg-links.mjs', exportName: 'EGG_LINKS', type: 'EggLink[]' },
  { file: 'motifs.mjs', exportName: 'MOTIFS', type: 'Motif[]' },
  { file: 'clue-pairs.mjs', exportName: 'CLUE_PAIRS', type: 'CluePair[]' },
];

const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'lenses.generated.ts');

/**
 * Render one seed array as a TS literal. The seed files already hold plain
 * JSON-compatible data (strings/numbers/booleans/arrays/objects — no
 * functions, no undefined field markers), so `JSON.stringify` produces valid
 * TypeScript object-literal syntax directly, the same reasoning
 * sync-longlive-merch.mjs's `renderArray` documents.
 */
function renderArray(items) {
  return JSON.stringify(items, null, 2);
}

/** Render the generated TypeScript module. Pure string building. */
export function renderModule(datasets) {
  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-longlive-lenses.mjs from supabase/seed/lenses/**.');
  lines.push("// Re-run that script after lenses-seed changes; don't edit this file directly.");
  lines.push('');
  lines.push(
    "import type { CluePair, EggLink, EggNode, Motif, ReRecord, Relationship, RunwayLook, SinglePeriod, ThreadMeta } from './types';",
  );
  lines.push('');
  for (const { exportName, type, data } of datasets) {
    lines.push(`export const ${exportName}: ${type} = ${renderArray(data)};`);
    lines.push('');
  }
  return lines.join('\n');
}

/** Load one supabase/seed/lenses/<file>.mjs and pull its named export. */
async function loadDataset({ file, exportName }) {
  const filePath = path.join(SEED_DIR, file);
  const mod = await import(pathToFileURL(filePath).href);
  const data = mod[exportName];
  if (!Array.isArray(data)) {
    throw new Error(`sync-longlive-lenses: ${filePath} did not export an ${exportName} array`);
  }
  return data;
}

/** Load every supabase/seed/lenses/*.mjs source file. */
async function fetchFromLocalFiles() {
  const loaded = [];
  for (const dataset of DATASETS) {
    const data = await loadDataset(dataset);
    loaded.push({ ...dataset, data });
  }
  const total = loaded.reduce((n, d) => n + d.data.length, 0);
  console.log(
    `sync-longlive-lenses: loaded ${total} entries across ${loaded.length} datasets from local seed files.`,
  );
  return loaded;
}

async function main() {
  const datasets = await fetchFromLocalFiles();
  await writeFile(OUT_FILE, renderModule(datasets), 'utf-8');
  const total = datasets.reduce((n, d) => n + d.data.length, 0);
  console.log(`Synced ${total} lens entries -> ${path.relative(ROOT, OUT_FILE)}`);
}

// Only run when invoked directly (`node scripts/sync-longlive-lenses.mjs`) —
// importing this module for its pure functions (tests) must not write files.
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  runMain(main, { name: 'sync-longlive-lenses' });
}
