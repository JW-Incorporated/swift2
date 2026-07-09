#!/usr/bin/env node
// Regenerates apps/web/lib/longlive/content-vault.generated.ts — the
// LongLive UI's static content layer (see docs/longlive-experience.md §9).
//
// Source of truth, in priority order:
//   1. Live Supabase `month_item` table, when NEXT_PUBLIC_SUPABASE_URL +
//      NEXT_PUBLIC_SUPABASE_ANON_KEY are set (same public/RLS-read creds as
//      apps/web/.env.local — see docs/dev-quickstart.md). This is what makes
//      content changes flow to the live site: seed the DB, redeploy, the
//      build picks up fresh data. No live per-request DB calls — this runs
//      at build time (wired as `prebuild` in apps/web/package.json), keeping
//      the shipped UI fully static per the project's cost-discipline rule.
//   2. Local supabase/seed/content/*.mjs files, when Supabase isn't
//      configured or the live fetch fails (local dev without secrets, CI,
//      or before the DB has been seeded). Same output shape either way.
//
// Hand-curated items in content.ts are untouched — this only produces the
// separate VAULT_RAW export that content.ts merges in alongside them.

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEED_DIR = path.join(ROOT, 'supabase', 'seed', 'content');
const OUT_FILE = path.join(ROOT, 'apps', 'web', 'lib', 'longlive', 'content-vault.generated.ts');
const WEB_ENV_FILE = path.join(ROOT, 'apps', 'web', '.env.local');

/**
 * This runs as a plain `node` prebuild step, before Next's own env-file
 * loading kicks in, so apps/web/.env.local (where the documented local
 * Supabase creds live — see docs/dev-quickstart.md) wouldn't otherwise be
 * seen. Load it here, without overriding real env vars a deploy platform
 * (Vercel) already injected.
 */
async function loadWebEnvLocal() {
  let raw;
  try {
    raw = await readFile(WEB_ENV_FILE, 'utf-8');
  } catch {
    return; // no .env.local — fine, e.g. on Vercel where env is injected directly
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

// Same column list as packages/core/src/vault.ts's Tier 0 skeleton fetch —
// keep these in sync if that query changes.
const MONTH_ITEM_COLS = 'id,era_slug,year,month,category,title,snippet,source_url,thumbnail_url';
const TIER0_MAX_ROWS = 2000;

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

/** Appends one normalized item to byEra, de-duping ids within the era. */
function addItem(byEra, seenIdsByEra, eraSlug, { year, month, category, title, snippet, context }) {
  const eraId = SLUG_TO_ERA_ID[eraSlug] ?? eraSlug;
  const seenIds = (seenIdsByEra[eraId] ??= new Set());

  const baseId = `vault-${eraId}-${slugify(title)}`;
  let id = baseId;
  let n = 2;
  while (seenIds.has(id)) {
    id = `${baseId}-${n++}`;
  }
  seenIds.add(id);

  const mm = String(month).padStart(2, '0');
  const date = `${year}-${mm}-01`;
  const dateLabel = `${MONTHS[month - 1]} ${year}`;
  const tag = CATEGORY_TO_TAG[category] ?? 'Lore';
  const body = context ? [context] : [snippet];

  (byEra[eraId] ??= []).push({ id, date, dateLabel, title, summary: snippet, body, tags: [tag] });
}

function supabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return { supabaseUrl, supabaseKey };
}

/** Live source: the Supabase month_item table. Returns null if unreachable/unconfigured. */
async function fetchFromSupabase() {
  const env = supabaseEnv();
  if (!env) {
    console.log('sync-longlive-content: no Supabase env, falling back to local seed files.');
    return null;
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('month_item')
    .select(MONTH_ITEM_COLS)
    .order('year', { ascending: true })
    .order('month', { ascending: true })
    .order('id', { ascending: true })
    .limit(TIER0_MAX_ROWS);

  if (error) {
    console.warn(`sync-longlive-content: Supabase fetch failed (${error.message}), falling back to local seed files.`);
    return null;
  }
  if (!data || data.length === 0) {
    console.warn('sync-longlive-content: Supabase returned 0 month_items, falling back to local seed files.');
    return null;
  }
  if (data.length >= TIER0_MAX_ROWS) {
    // A `.limit()` hit means this is a partial page, not the full table —
    // writing it as VAULT_RAW would silently ship truncated content. Treat
    // it as a failed live fetch (same as the runtime client's explicit cap
    // check in packages/core/src/vault.ts) and fall back to the complete
    // local seed files instead.
    console.warn(
      `sync-longlive-content: Supabase month_item hit the ${TIER0_MAX_ROWS}-row cap — result would be truncated, falling back to local seed files.`,
    );
    return null;
  }

  const byEra = {};
  const seenIdsByEra = {};
  for (const row of data) {
    addItem(byEra, seenIdsByEra, row.era_slug, {
      year: row.year,
      month: row.month,
      category: row.category,
      title: row.title,
      snippet: row.snippet,
      // Tier 1 `moment.context` isn't fetched here (would be 400+ individual
      // queries at build time) — body falls back to the snippet, same as any
      // local-seed item with no moment.context. Follow-up if body richness
      // from live data turns out to matter.
      context: null,
    });
  }

  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(`sync-longlive-content: loaded ${total} items from Supabase (live).`);
  return byEra;
}

/** Fallback source: the local supabase/seed/content/*.mjs files. */
async function fetchFromLocalFiles() {
  const files = (await readdir(SEED_DIR)).filter((f) => f.endsWith('.mjs') && f !== '_example.mjs');

  const byEra = {};
  const seenIdsByEra = {};

  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(SEED_DIR, file)).href);
    const { eraSlug, items } = mod.default;

    for (const item of items) {
      addItem(byEra, seenIdsByEra, eraSlug, {
        year: item.year,
        month: item.month,
        category: item.category,
        title: item.title,
        snippet: item.snippet,
        context: item.moment?.context ?? null,
      });
    }
  }

  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(`sync-longlive-content: loaded ${total} items from local seed files (fallback).`);
  return byEra;
}

async function main() {
  await loadWebEnvLocal();
  const byEra = (await fetchFromSupabase()) ?? (await fetchFromLocalFiles());

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

  await writeFile(OUT_FILE, lines.join('\n'), 'utf-8');

  const total = Object.values(byEra).reduce((n, arr) => n + arr.length, 0);
  console.log(`Synced ${total} items across ${Object.keys(byEra).length} eras -> ${path.relative(ROOT, OUT_FILE)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
