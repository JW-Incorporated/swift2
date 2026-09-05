#!/usr/bin/env node
// Regenerates scripts/lib/source-tiers.generated.mjs — the plain-JS mirror of
// packages/shared/src/source-tiers.ts's DATA constants (R9, Fable 5.1
// review). scripts/**/*.mjs run under plain `node`, no compile step, so they
// cannot import the .ts module directly; this generator reads it once (via
// `tsx`, dev-only) and writes a plain-JS twin every other .mjs script can
// import with zero extra dependencies. `npm run check:generated` regenerates
// this and diffs it against HEAD, so the twin can never silently drift from
// the hand-authored .ts source.
//
// Only the DATA constants are mirrored (OFFICIAL_DOMAINS, ESTABLISHED_
// DOMAINS, ESTABLISHED_SOURCE_NAMES, VAULT_SOURCE_TIER_BY_TYPE,
// RUMOR_SOURCE_TIERS, OUTLET_TIER_MAP) — scripts/lib/reputable-sources.mjs
// keeps its own (unchanged) hostOf/isOfficialDomain/etc. function bodies,
// since logic duplication isn't the drift risk the domain *lists* were.

import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { register } from 'tsx/esm/api';
import { ROOT } from './lib/generated-content.mjs';

const SOURCE_FILE = path.join(ROOT, 'packages', 'shared', 'src', 'source-tiers.ts');
const OUT_FILE = path.join(ROOT, 'scripts', 'lib', 'source-tiers.generated.mjs');

async function loadSourceTiers() {
  const unregister = register();
  try {
    return await import(pathToFileURL(SOURCE_FILE).href);
  } finally {
    await unregister();
  }
}

function renderModule(mod) {
  const lines = [
    '// GENERATED FILE — do not hand-edit. Source of truth:',
    '// packages/shared/src/source-tiers.ts. Regenerate with',
    '// `node scripts/sync-source-tiers.mjs` (or `npm run sync:content`);',
    '// `npm run check:generated` fails CI if this drifts.',
    '',
    `export const OFFICIAL_DOMAINS = new Set(${JSON.stringify([...mod.OFFICIAL_DOMAINS])});`,
    '',
    `export const ESTABLISHED_DOMAINS = new Set(${JSON.stringify([...mod.ESTABLISHED_DOMAINS], null, 2)});`,
    '',
    `export const ESTABLISHED_SOURCE_NAMES = ${JSON.stringify(mod.ESTABLISHED_SOURCE_NAMES, null, 2)};`,
    '',
    `export const VAULT_SOURCE_TIER_BY_TYPE = ${JSON.stringify(mod.VAULT_SOURCE_TIER_BY_TYPE, null, 2)};`,
    '',
    `export const RUMOR_SOURCE_TIERS = ${JSON.stringify(mod.RUMOR_SOURCE_TIERS)};`,
    '',
    `export const OUTLET_TIER_MAP = ${JSON.stringify(mod.OUTLET_TIER_MAP, null, 2)};`,
    '',
  ];
  return lines.join('\n');
}

async function main() {
  const mod = await loadSourceTiers();
  await writeFile(OUT_FILE, renderModule(mod), 'utf-8');
  console.log(`Synced source tiers -> ${path.relative(ROOT, OUT_FILE)}`);
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
