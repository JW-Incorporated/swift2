#!/usr/bin/env node
// Generates apps/web/app/tokens.generated.css from the shared design tokens
// in packages/experience/src/tokens.ts (OS-031: docs/specs/2026-09-05-one-
// source-three-surfaces.md). This is the ONE place the web's era/clown CSS
// variable *default values* are written; globals.css imports the output
// instead of hand-declaring them, so the web and native StyleSheet (built
// by apps/mobile/lib/theme.ts from the same TOKENS object) can never drift.
//
// scripts/**/*.mjs run under plain `node`, no compile step, so this reads
// the .ts source via `tsx` (dev-only, same pattern as
// scripts/sync-source-tiers.mjs) rather than importing it directly.
//
// Run via `npm run tokens:generate`; checked by `npm run check:generated`
// (scripts/check-generated-in-sync.mjs) like every other build artifact.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { register } from 'tsx/esm/api';
import { ROOT } from './lib/generated-content.mjs';
import { runMain } from './lib/cli.mjs';

const SOURCE_FILE = path.join(ROOT, 'packages', 'experience', 'src', 'tokens.ts');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'app', 'tokens.generated.css');

async function loadTokens() {
  const unregister = register();
  try {
    return await import(pathToFileURL(SOURCE_FILE).href);
  } finally {
    await unregister();
  }
}

export function renderCss(mod) {
  const { ERA_TOKENS, CLOWN_TOKENS, ERA_CSS_VAR_NAMES, CLOWN_CSS_VAR_NAMES } = mod;
  const lines = [];
  lines.push('/* GENERATED FILE — do not edit by hand.');
  lines.push(' * Source: packages/experience/src/tokens.ts (OS-031).');
  lines.push(' * Regenerate: npm run tokens:generate');
  lines.push(' * Checked in sync by: npm run check:generated');
  lines.push(' */');
  lines.push(':root {');
  for (const key of Object.keys(ERA_CSS_VAR_NAMES)) {
    lines.push(`  ${ERA_CSS_VAR_NAMES[key]}: ${ERA_TOKENS[key]};`);
  }
  for (const key of Object.keys(CLOWN_CSS_VAR_NAMES)) {
    lines.push(`  ${CLOWN_CSS_VAR_NAMES[key]}: ${CLOWN_TOKENS[key]};`);
  }
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

async function main() {
  const mod = await loadTokens();
  await writeFile(OUT_FILE, renderCss(mod), 'utf-8');
  console.log(`Wrote ${OUT_FILE}`);
  return 0;
}

runMain(main, { name: 'generate-design-tokens' });
