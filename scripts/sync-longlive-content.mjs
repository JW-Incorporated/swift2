#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/content-vault.generated.ts from the
// Supabase content seed files (supabase/seed/content/*.mjs) — the
// well-sourced dataset Wyatt's team maintains. The LongLive UI is a
// static, in-repo data layer (see docs/longlive-experience.md §9); rather
// than wire a live DB read into it (runtime cost, RLS, loading states),
// this script keeps that layer static while syncing it from the seed data
// at author time. Re-run whenever supabase/seed/content/** changes.
//
// Hand-curated items in content.ts are untouched — this only produces the
// separate VAULT_RAW export that content.ts merges in alongside them.

import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'content');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'content-vault.generated.ts');

const SLUG_TO_ERA_ID = {
  'the-life-of-a-showgirl': 'tloas',
  'tortured-poets': 'ttpd',
};

const CATEGORY_TO_TAG = {
  music: 'Music',
  fashion: 'Fashion',
  tour: 'Tour',
  relationship: 'Relationship',
  sighting: 'Lore',
  business: 'Lore',
  release: 'Music',
  video: 'Music',
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/['’"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function esc(s) {
  return JSON.stringify(s);
}

async function main() {
  const files = (await readdir(SEED_DIR)).filter((f) => f.endsWith('.mjs') && f !== '_example.mjs');

  /** @type {Record<string, {id:string, date:string, dateLabel:string, title:string, summary:string, body:string[], tags:string[]}[]>} */
  const byEra = {};

  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(SEED_DIR, file)).href);
    const { eraSlug, items } = mod.default;
    const eraId = SLUG_TO_ERA_ID[eraSlug] ?? eraSlug;
    const seenIds = new Set();

    for (const item of items) {
      const baseId = `vault-${eraId}-${slugify(item.title)}`;
      let id = baseId;
      let n = 2;
      while (seenIds.has(id)) {
        id = `${baseId}-${n++}`;
      }
      seenIds.add(id);

      const mm = String(item.month).padStart(2, '0');
      const date = `${item.year}-${mm}-01`;
      const dateLabel = `${MONTHS[item.month - 1]} ${item.year}`;
      const tag = CATEGORY_TO_TAG[item.category] ?? 'Lore';
      const body = item.moment?.context ? [item.moment.context] : [item.snippet];

      (byEra[eraId] ??= []).push({
        id,
        date,
        dateLabel,
        title: item.title,
        summary: item.snippet,
        body,
        tags: [tag],
      });
    }
  }

  const lines = [];
  lines.push('// GENERATED FILE — do not hand-edit.');
  lines.push('// Produced by scripts/sync-longlive-content.mjs from supabase/seed/content/**.');
  lines.push("// Re-run that script after content-seed changes; don't edit this file directly.");
  lines.push('');
  lines.push("import type { ContentTag, EraId } from './types';");
  lines.push('');
  lines.push('type VaultRawItem = {');
  lines.push('  id: string;');
  lines.push('  date: string;');
  lines.push('  dateLabel: string;');
  lines.push('  title: string;');
  lines.push('  summary: string;');
  lines.push('  body: string[];');
  lines.push('  tags: ContentTag[];');
  lines.push('};');
  lines.push('');
  lines.push('export const VAULT_RAW: Partial<Record<EraId, VaultRawItem[]>> = {');
  for (const eraId of Object.keys(byEra).sort()) {
    lines.push(`  ${esc(eraId)}: [`);
    for (const it of byEra[eraId]) {
      lines.push('    {');
      lines.push(`      id: ${esc(it.id)},`);
      lines.push(`      date: ${esc(it.date)},`);
      lines.push(`      dateLabel: ${esc(it.dateLabel)},`);
      lines.push(`      title: ${esc(it.title)},`);
      lines.push(`      summary: ${esc(it.summary)},`);
      lines.push(`      body: [${it.body.map(esc).join(', ')}],`);
      lines.push(`      tags: [${it.tags.map(esc).join(', ')}],`);
      lines.push('    },');
    }
    lines.push('  ],');
  }
  lines.push('};');
  lines.push('');

  const { writeFile } = await import('node:fs/promises');
  await writeFile(OUT_FILE, lines.join('\n'), 'utf-8');

  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(`Synced ${total} items across ${Object.keys(byEra).length} eras -> ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
