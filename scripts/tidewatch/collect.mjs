#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import { gh } from '../lib/gh.mjs';
import { runMain } from '../lib/cli.mjs';
import { serviceClient } from '../lib/supabase.mjs';
import { mapLead, mapTheory } from './adapters/community.mjs';
import { mapMerch, mapMoment, mapReply, mapSocialPost } from './adapters/files.mjs';
import { mapIssues } from './adapters/issues.mjs';
import { mapNews } from './adapters/news.mjs';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGE = 1000;
const LOOKUP_PAGE = 100;
const VALID_SOURCES = new Set(['official', 'news', 'youtube', 'intake', 'merch', 'reddit', 'facebook', 'theory', 'social', 'moment']);

function parseArgs(argv, now = Date.now()) {
  const out = { dryRun: false, since: new Date(now - 24 * 3_600_000).toISOString(), fixtures: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--fixtures') out.fixtures = path.resolve(argv[++i] ?? '');
    else if (arg === '--since') {
      const value = argv[++i] ?? '';
      const relative = /^(\d+)([hm])$/.exec(value);
      const instant = relative
        ? now - Number(relative[1]) * (relative[2] === 'h' ? 3_600_000 : 60_000)
        : Date.parse(value);
      if (!Number.isFinite(instant)) throw new Error(`invalid --since value: ${value}`);
      out.since = new Date(instant).toISOString();
    } else throw new Error('usage: collect.mjs [--dry-run] [--since 24h|ISO] [--fixtures <dir>]');
  }
  if (out.fixtures && !out.dryRun) throw new Error('--fixtures is supported only with --dry-run');
  return out;
}

async function fetchRows(client, table, columns, timeColumn, since) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client.from(table).select(columns).gte(timeColumn, since)
      .order(timeColumn).order('id').range(from, from + PAGE - 1);
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

async function lastCommit(file) {
  const { stdout } = await execFileAsync('git', ['log', '-1', '--format=%cI', '--', file], { cwd: ROOT });
  const stamp = stdout.trim();
  if (!stamp) throw new Error(`no commit timestamp for ${file}`);
  return stamp;
}

async function liveSources(client) {
  const merchDir = path.join(ROOT, 'supabase', 'seed', 'merch');
  const contentDir = path.join(ROOT, 'supabase', 'seed', 'content');
  const postedDir = path.join(ROOT, 'social', 'posted');
  let issuesPromise;
  const issues = async () => {
    issuesPromise ??= gh(['issue', 'list', '--label', 'intake', '--state', 'all', '--limit', '10000', '--json', 'number,title,body,url,createdAt'])
      .then((result) => {
        if (!result.complete) throw new Error('intake issue listing was truncated; cursor not advanced');
        return mapIssues(JSON.parse(result.stdout));
      });
    return issuesPromise;
  };
  return [
    { name: 'news', load: async (since) => mapNews({
      stories: await fetchRows(client, 'news_story', 'id,canonical_title,summary,first_seen_at', 'first_seen_at', since),
      rawItems: await fetchRows(client, 'news_raw_item', 'id,source_id,external_id,url,title,snippet,story_id,created_at', 'created_at', since),
    }) },
    { name: 'appearance', load: async () => (await issues()).filter((row) => row.item.source === 'youtube') },
    { name: 'intake', load: async () => (await issues()).filter((row) => row.item.source === 'intake') },
    ...['reddit', 'facebook'].map((platform) => ({ name: platform, load: async (since) => (await fetchRows(client, 'engagement_lead', 'id,platform,community,kind,thread_id,url,locator,title,context,created_at', 'created_at', since)).filter((row) => row.platform === platform).map(mapLead) })),
    { name: 'theory', load: async (since) => (await fetchRows(client, 'fan_theory_candidate', 'id,theory_key,claim,evidence_summary,sample_urls,created_at', 'created_at', since)).map(mapTheory) },
    ...['official', 'fanmade'].map((kind) => ({ name: `merch-${kind === 'fanmade' ? 'fan' : kind}`, load: async () => {
      const file = path.join(merchDir, `${kind}.mjs`);
      const mod = await import(pathToFileURL(file).href);
      const rows = kind === 'official' ? mod.OFFICIAL : mod.FAN_MADE;
      const changedAt = await lastCommit(path.relative(ROOT, file));
      return rows.map((row) => mapMerch(row, kind === 'fanmade' ? 'fan' : kind, changedAt));
    } })),
    { name: 'social-posted', load: async () => Promise.all((await readdir(postedDir)).filter((file) => file.endsWith('.json')).map(async (file) => mapSocialPost(JSON.parse(await readFile(path.join(postedDir, file), 'utf8')), file))) },
    { name: 'social-replies', load: async () => {
      const response = await fetch('https://raw.githubusercontent.com/JW-Incorporated/swift2/social-reply-ledger/reply-ledger.json');
      if (!response.ok) throw new Error(`reply ledger read failed: HTTP ${response.status}`);
      return Object.entries((await response.json()).seen ?? {}).map(mapReply);
    } },
    { name: 'moments', load: async () => (await Promise.all((await readdir(contentDir)).filter((file) => file.endsWith('.mjs') && !file.startsWith('_')).map(async (file) => {
      const full = path.join(contentDir, file);
      const data = (await import(pathToFileURL(full).href)).default;
      const changedAt = await lastCommit(path.relative(ROOT, full));
      return data.items.map((row) => mapMoment(row, data.eraSlug, changedAt));
    }))).flat() },
  ];
}

function fixtureSources(data) {
  const issues = mapIssues(data.issues);
  return [
    { name: 'news', rows: mapNews({ stories: data.newsStories, rawItems: data.newsRawItems }) },
    { name: 'appearance', rows: issues.filter((row) => row.item.source === 'youtube') },
    { name: 'intake', rows: issues.filter((row) => row.item.source === 'intake') },
    { name: 'reddit', rows: data.engagementLeads.filter((row) => row.platform === 'reddit').map(mapLead) },
    { name: 'facebook', rows: data.engagementLeads.filter((row) => row.platform === 'facebook').map(mapLead) },
    { name: 'theory', rows: data.theories.map(mapTheory) },
    { name: 'merch-official', rows: data.officialMerch.map((row) => mapMerch(row, 'official', row.changedAt)) },
    { name: 'merch-fan', rows: data.fanMerch.map((row) => mapMerch(row, 'fan', row.changedAt)) },
    { name: 'social-posted', rows: data.socialPosts.map((row) => mapSocialPost(row, row.filename)) },
    { name: 'social-replies', rows: Object.entries(data.replies).map(mapReply) },
    { name: 'moments', rows: data.moments.map((row) => mapMoment(row, row.eraSlug, row.changedAt)) },
  ].map((source) => ({ name: source.name, load: async () => source.rows }));
}

function afterCursor(candidate, cursor, since) {
  if (candidate.cursorAt < since) return false;
  if (!cursor) return true;
  return candidate.cursorAt > cursor.at || (candidate.cursorAt === cursor.at && candidate.cursorKey > cursor.key);
}

function nextCursor(candidates) {
  const last = [...candidates].sort((a, b) => a.cursorAt.localeCompare(b.cursorAt) || a.cursorKey.localeCompare(b.cursorKey)).at(-1);
  return last ? { at: last.cursorAt, key: last.cursorKey } : null;
}

export async function runCollector(sources, store, { dryRun = false, since, log = console.log } = {}) {
  const results = [];
  for (const source of sources) {
    try {
      const cursor = await store.getCursor(source.name);
      const loaded = await source.load(cursor?.at ?? since);
      const eligible = loaded.filter((row) => afterCursor(row, cursor, since));
      const byKey = new Map();
      for (const row of eligible) {
        const prior = byKey.get(row.item.item_key);
        if (!prior || row.cursorAt < prior.cursorAt) byKey.set(row.item.item_key, row);
      }
      const rows = [...byKey.values()];
      for (const row of rows) {
        if (!VALID_SOURCES.has(row.item.source)) throw new Error(`closed watch_item source vocabulary rejects ${row.item.source}`);
        if (row.item.source === 'facebook' && row.item.excerpt !== null) throw new Error('facebook excerpt must be null');
      }
      const existing = await store.existingKeys(rows.map((row) => row.item.item_key));
      const fresh = rows.filter((row) => !existing.has(row.item.item_key));
      if (!dryRun && rows.length) {
        await store.upsertItems(rows.map((row) => row.item));
        await store.upsertTimelines(rows.map((row) => ({ story_id: row.item.story_id, detected_at: row.item.first_seen_at })));
        await store.setCursor(source.name, nextCursor(eligible));
      }
      const result = { source: source.name, read: rows.length, inserted: fresh.length, errors: 0 };
      results.push(result);
      log(`${source.name}: ${result.read} read, ${result.inserted} new, 0 errors`);
    } catch (error) {
      results.push({ source: source.name, read: 0, inserted: 0, errors: 1, error: error.message });
      log(`${source.name}: 0 read, 0 new, 1 error (${error.message})`);
    }
  }
  return results;
}

export function supabaseStore(client) {
  return {
    async getCursor(source) {
      const { data, error } = await client.from('watch_cursor').select('cursor').eq('source', source).maybeSingle();
      if (error) throw error;
      return data ? JSON.parse(data.cursor) : null;
    },
    async existingKeys(keys) {
      const found = new Set();
      for (let i = 0; i < keys.length; i += LOOKUP_PAGE) {
        const { data, error } = await client.from('watch_item').select('item_key').in('item_key', keys.slice(i, i + LOOKUP_PAGE));
        if (error) throw error;
        for (const row of data) found.add(row.item_key);
      }
      return found;
    },
    async upsertItems(rows) {
      for (let i = 0; i < rows.length; i += PAGE) {
        const { error } = await client.from('watch_item').upsert(rows.slice(i, i + PAGE), { onConflict: 'item_key', ignoreDuplicates: true });
        if (error) throw error;
      }
    },
    async upsertTimelines(rows) {
      const unique = [...new Map(rows.map((row) => [row.story_id, row])).values()];
      const { error } = await client.from('story_timeline').upsert(unique, { onConflict: 'story_id', ignoreDuplicates: true });
      if (error) throw error;
    },
    async setCursor(source, cursor) {
      const { error } = await client.from('watch_cursor').upsert({ source, cursor: JSON.stringify(cursor) }, { onConflict: 'source' });
      if (error) throw error;
    },
  };
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const options = parseArgs(argv, deps.now);
  let sources;
  let store;
  if (options.fixtures) {
    const data = JSON.parse(await readFile(path.join(options.fixtures, 'sources.json'), 'utf8'));
    sources = fixtureSources(data);
    store = deps.store ?? { getCursor: async () => null, existingKeys: async () => new Set() };
  } else {
    const client = deps.client ?? serviceClient();
    if (!client) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set (use --dry-run --fixtures locally)');
    sources = await liveSources(client);
    store = deps.store ?? supabaseStore(client);
  }
  const results = await runCollector(sources, store, { ...options, log: deps.log });
  const errors = results.reduce((sum, row) => sum + row.errors, 0);
  const inserted = results.reduce((sum, row) => sum + row.inserted, 0);
  (deps.log ?? console.log)(`tidewatch collect: ${inserted} new row(s), ${errors} errors${options.dryRun ? ' (dry-run)' : ''}`);
  if (errors) throw new Error(`${errors} source(s) failed`);
  return results;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'tidewatch-collect' });
