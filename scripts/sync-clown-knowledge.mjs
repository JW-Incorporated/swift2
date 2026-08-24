#!/usr/bin/env node
// Canonical sync (Stage 4, PLAN.md): projects the existing Vault seed
// content — supabase/seed/content/**, supabase/seed/theories/**,
// supabase/seed/tracks/** — into the knowledge engine's shared retrieval
// index (`knowledge_doc tier='vault'`), and builds `egg_ledger` /
// `symbol_lexicon` from the same real data. Reuses the parsing the existing
// sync-longlive-*.mjs generators already do (addItem/seedItemToInput,
// buildTheoryGuide/normalizeTheory, buildTrackGuide) rather than
// re-implementing seed-file loading.
//
// `technique` stays EMPTY here on purpose (2026-08-16 brief, ratified
// docs/decisions.md 2026-08-23): this script never writes to it, and every
// row builder below degrades gracefully with zero techniques.
//
// Writes to Postgres directly (SUPABASE_DB_URL from apps/worker/.env, same
// var the db:seed:* scripts use — see docs/dev-quickstart.md), upserting
// (ON CONFLICT DO UPDATE) so re-runs are safe. When no DB credential is
// reachable (this worktree's known blocker, HUMAN-ACTIONS.md #14) the
// script builds every row from real seed data, logs the counts, and exits 0
// without writing — it never crashes `npm run sync:content`'s chain and
// never fabricates a fallback destination.
//
//   npm run sync:content   (7th step)
//   node scripts/sync-clown-knowledge.mjs

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { makeClient } from './lib/pg.mjs';
import { ROOT, SLUG_TO_ERA_ID } from './lib/longlive-sync-shared.mjs';
import { addItem, seedItemToInput } from './sync-longlive-content.mjs';
import { normalizeTheory } from './sync-longlive-theories.mjs';
import { buildTrackGuide } from './sync-longlive-tracks.mjs';
import { buildSymbolLexicon } from './lib/knowledge-symbols.mjs';
import { buildEggLedgerRow, buildMomentDoc, buildTheoryDoc, buildTrackDoc } from './lib/knowledge-rows.mjs';
import { eras } from '../supabase/seed/eras-data.mjs';

const WORKER_ENV_FILE = path.join(ROOT, 'apps', 'worker', '.env');

const ERA_START_DATE = Object.fromEntries(eras.map((e) => [e.slug, e.start_date]));
const eraIdFor = (slug) => SLUG_TO_ERA_ID[slug] ?? slug;

/** Best-effort .env loader for apps/worker/.env — never throws when the (gitignored) file is absent. */
export async function loadWorkerEnvLocal() {
  let raw;
  try {
    raw = await readFile(WORKER_ENV_FILE, 'utf-8');
  } catch {
    return;
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

async function loadRawEntries(seedDir, arrayKey, skip = []) {
  const files = (await readdir(seedDir)).filter(
    (f) => f.endsWith('.mjs') && !f.startsWith('_') && !skip.some((s) => f.endsWith(s)),
  );
  const entries = [];
  for (const file of files.sort()) {
    const mod = await import(pathToFileURL(path.join(seedDir, file)).href);
    const { eraSlug, [arrayKey]: items } = mod.default ?? mod;
    if (!eraSlug || !Array.isArray(items)) continue;
    for (const item of items) entries.push({ eraSlug, ...item });
  }
  return entries;
}

async function loadContentByEra() {
  const dir = path.join(ROOT, 'supabase', 'seed', 'content');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mjs') && f !== '_example.mjs');
  const byEra = {};
  const seenIdsByEra = {};
  for (const file of files) {
    const mod = await import(pathToFileURL(path.join(dir, file)).href);
    const { eraSlug, items } = mod.default;
    for (const item of items) {
      addItem(byEra, seenIdsByEra, item.eraSlug ?? eraSlug, seedItemToInput(item));
    }
  }
  return byEra;
}

/** Everything this sync needs, built once from real seed data. Pure I/O aside, no DB writes. */
export async function buildAll() {
  const contentByEra = await loadContentByEra();
  const trackEntries = await loadRawEntries(path.join(ROOT, 'supabase', 'seed', 'tracks'), 'tracks', [
    '.dossiers.mjs',
  ]);
  const trackByEra = buildTrackGuide(trackEntries);
  const theoryEntries = await loadRawEntries(path.join(ROOT, 'supabase', 'seed', 'theories'), 'theories');

  const lexicon = buildSymbolLexicon(trackByEra);

  const knowledgeDocs = [];
  for (const [eraId, items] of Object.entries(contentByEra)) {
    for (const item of items) knowledgeDocs.push(buildMomentDoc(item, eraId, lexicon));
  }
  for (const [eraId, tracks] of Object.entries(trackByEra)) {
    for (const t of tracks) knowledgeDocs.push(buildTrackDoc(t, eraId, lexicon));
  }

  const eggLedgerRows = [];
  for (const raw of theoryEntries) {
    const normalized = normalizeTheory(raw);
    if (!normalized) continue;
    const eraId = eraIdFor(raw.eraSlug);
    knowledgeDocs.push(buildTheoryDoc(normalized, eraId, lexicon));
    if (normalized.kind === 'easter_egg' && normalized.outcome === 'confirmed') {
      eggLedgerRows.push(
        buildEggLedgerRow(normalized, raw.sources, eraId, ERA_START_DATE[raw.eraSlug] ?? null, lexicon),
      );
    }
  }

  return { knowledgeDocs, eggLedgerRows, symbolLexicon: lexicon };
}

async function upsertKnowledgeDocs(client, rows) {
  for (const r of rows) {
    await client.query(
      `insert into public.knowledge_doc
         (id, kind, tier, title, text, date, recency_date, open, status,
          source_tier, sources, era_id, symbols, entities, expires_at, redline_ok, updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,now())
       on conflict (id) do update set
         kind = excluded.kind, tier = excluded.tier, title = excluded.title, text = excluded.text,
         date = excluded.date, recency_date = excluded.recency_date, open = excluded.open,
         status = excluded.status, source_tier = excluded.source_tier, sources = excluded.sources,
         era_id = excluded.era_id, symbols = excluded.symbols, entities = excluded.entities,
         expires_at = excluded.expires_at, redline_ok = excluded.redline_ok, updated_at = now()`,
      [
        r.id, r.kind, r.tier, r.title, r.text, r.date, r.recency_date, r.open, r.status,
        r.source_tier, JSON.stringify(r.sources), r.era_id, r.symbols, r.entities, r.expires_at, r.redline_ok,
      ],
    );
  }
}

async function upsertEggLedger(client, rows) {
  for (const r of rows) {
    await client.query(
      `insert into public.egg_ledger
         (id, hint_doc_id, reveal_doc_id, hint_date, reveal_date, mechanism, symbols,
          era_id, confirmed, outcome, summary, sources)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb)
       on conflict (id) do update set
         hint_doc_id = excluded.hint_doc_id, reveal_doc_id = excluded.reveal_doc_id,
         hint_date = excluded.hint_date, reveal_date = excluded.reveal_date,
         mechanism = excluded.mechanism, symbols = excluded.symbols, era_id = excluded.era_id,
         confirmed = excluded.confirmed, outcome = excluded.outcome, summary = excluded.summary,
         sources = excluded.sources`,
      [
        r.id, r.hint_doc_id, r.reveal_doc_id, r.hint_date, r.reveal_date, r.mechanism, r.symbols,
        r.era_id, r.confirmed, r.outcome, r.summary, JSON.stringify(r.sources),
      ],
    );
  }
}

async function upsertSymbolLexicon(client, rows) {
  for (const r of rows) {
    await client.query(
      `insert into public.symbol_lexicon (key, label, aliases, category, linked_eras, note)
       values ($1,$2,$3,$4,$5,$6)
       on conflict (key) do update set
         label = excluded.label, aliases = excluded.aliases, category = excluded.category,
         linked_eras = excluded.linked_eras, note = excluded.note`,
      [r.key, r.label, r.aliases, r.category, r.linked_eras, r.note],
    );
  }
}

async function main() {
  await loadWorkerEnvLocal();
  const { knowledgeDocs, eggLedgerRows, symbolLexicon } = await buildAll();
  console.log(
    `sync-clown-knowledge: built ${knowledgeDocs.length} knowledge_doc row(s), ` +
      `${eggLedgerRows.length} egg_ledger row(s), ${symbolLexicon.length} symbol_lexicon row(s) from real Vault seed data.`,
  );

  const connectionString = process.env.SUPABASE_DB_URL;
  if (!connectionString) {
    console.log(
      'sync-clown-knowledge: no SUPABASE_DB_URL (apps/worker/.env not reachable — see HUMAN-ACTIONS.md #14). ' +
        'Rows built above from real data but NOT written to any database.',
    );
    return;
  }

  const client = makeClient(connectionString);
  await client.connect();
  try {
    await upsertKnowledgeDocs(client, knowledgeDocs);
    await upsertEggLedger(client, eggLedgerRows);
    await upsertSymbolLexicon(client, symbolLexicon);
    console.log('sync-clown-knowledge: synced knowledge_doc / egg_ledger / symbol_lexicon.');
  } finally {
    await client.end();
  }
}

const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
