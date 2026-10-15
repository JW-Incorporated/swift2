#!/usr/bin/env node
// Tidewatch P1-04: read-only export of the calibration replay pool.
// Raw text (needed by the labeler) goes to a gitignored path; the committed
// shape (`commitShape`) carries ids, urls and short non-quoted metadata only.

import { createHash } from 'node:crypto';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { makeClient } from '../lib/pg.mjs';

export const RAW_PATH = '.scratch/tidewatch/replay-raw.json';
export const TARGETS = { newsDays: 90, newsMax: 450, reddit: 150, facebook: 50, merch: 60, theory: 40 };

const iso = (value) => (value ? new Date(value).toISOString() : null);
const hostOf = (url) => { try { return new URL(url).hostname; } catch { return null; } };
const sortKey = (id) => createHash('sha256').update(String(id)).digest('hex');

export const SQL = {
  news: `select s.id, s.canonical_title, s.summary, s.category, s.importance, s.source_count,
      s.verification_status, s.first_seen_at,
      coalesce((select jsonb_agg(jsonb_build_object('outlet', o.outlet_name, 'tier', o.tier, 'url', o.url))
        from public.news_story_source o where o.story_id = s.id), '[]'::jsonb) as sources
    from public.news_story s
    where s.first_seen_at >= now() - ($1::int * interval '1 day')
    order by s.first_seen_at desc limit $2`,
  leads: `select id, platform, community, kind, thread_id, url, title, context, relevance, status, created_at
    from public.engagement_lead where platform = $1
    order by md5(id::text) limit $2`,
};

export function shapeNews(row) {
  const sources = (row.sources ?? []).map((s) => ({ outlet: s.outlet, tier: s.tier, host: hostOf(s.url) }));
  return {
    id: `news_story:${row.id}`,
    kind: 'news_story',
    text: { title: row.canonical_title, summary: row.summary ?? '' },
    meta: {
      category: row.category, importance: row.importance, sourceCount: row.source_count,
      verificationStatus: row.verification_status, firstSeenAt: iso(row.first_seen_at), sources,
    },
  };
}

export function shapeLead(row) {
  const reddit = row.platform === 'reddit';
  return {
    id: `${reddit ? 'reddit_lead' : 'facebook_lead'}:${row.id}`,
    kind: reddit ? 'reddit_lead' : 'facebook_lead',
    // Facebook never keeps a locator, title or excerpt: only our-words context.
    text: reddit ? { title: row.title ?? '', summary: row.context ?? '' } : { title: '', summary: row.context ?? '' },
    meta: {
      leadKind: row.kind, community: reddit ? row.community : null, url: reddit ? row.url : null,
      threadId: reddit ? row.thread_id : null, relevance: row.relevance, status: row.status,
      createdAt: iso(row.created_at),
    },
  };
}

/** A theory bundle is one curated Vault seed theory (public content, not member text). */
export function shapeTheory(theory, eraSlug) {
  return {
    id: `theory_bundle:${eraSlug}:${theory.slug}`,
    kind: 'theory_bundle',
    text: { title: theory.title ?? '', summary: theory.claim ?? '' },
    meta: { eraSlug, slug: theory.slug, theoryKind: theory.kind ?? null, sourceCount: (theory.sources ?? []).length },
  };
}

export function pickTheories(eras, count) {
  return eras.flatMap((era) => (era.theories ?? []).map((t) => shapeTheory(t, era.eraSlug)))
    .sort((a, b) => sortKey(a.id).localeCompare(sortKey(b.id))).slice(0, count);
}

export function shapeMerch(entry, group) {
  return {
    id: `merch:${group}:${entry.sourceId ?? sortKey(entry.url).slice(0, 16)}`,
    kind: 'merch',
    text: { title: entry.item ?? '', summary: [entry.brand, entry.retailer].filter(Boolean).join(' / ') },
    meta: { group, brand: entry.brand ?? null, retailer: entry.retailer ?? null, url: entry.url ?? null, merchKind: entry.kind ?? null },
  };
}

export function pickMerch(official, fanMade, count) {
  const half = Math.floor(count / 2);
  const take = (list, group, n) => [...list]
    .sort((a, b) => sortKey(a.sourceId ?? a.url).localeCompare(sortKey(b.sourceId ?? b.url)))
    .slice(0, n).map((entry) => shapeMerch(entry, group));
  const fan = take(fanMade, 'fan_made', count - half);
  return [...take(official, 'official', count - fan.length), ...fan];
}

/** Committed shape: no member text. News and merch keep their public title. */
export function commitShape(item) {
  const publicTitle = ['news_story', 'merch', 'theory_bundle'].includes(item.kind);
  const { sources, ...rest } = item.meta;
  return {
    id: item.id,
    kind: item.kind,
    ...(publicTitle ? { title: item.text.title } : {}),
    meta: sources ? { ...rest, outlets: sources.map(({ outlet, tier }) => ({ outlet, tier })) } : rest,
    synthetic: item.synthetic === true,
    ...(item.expectedClass ? { expectedClass: item.expectedClass } : {}),
  };
}

const CRITICAL = [
  ['Taylor Swift announces a new studio album with a release date', 'Her official site and label confirm the album title and date.'],
  ['Official: Taylor Swift adds three stadium dates to her tour', 'The official tour page lists the new dates and the on-sale time.'],
  ['Presale opens today for newly added Taylor Swift shows', 'The official ticketing page opened a presale for the added dates.'],
  ['Taylor Swift releases a surprise single tonight', 'The single is live on all platforms and announced on her official account.'],
  ['Taylor Swift confirms a re-recorded album release date', 'A statement from her team gives the date and track list.'],
  ['Official statement: Taylor Swift announces a new concert film', 'Her team confirmed the film and its premiere date in a statement.'],
  ['Taylor Swift drops a new album tracklist on her official site', 'The full tracklist appears on the official store and site.'],
  ['Taylor Swift announces a one-night-only global livestream event', 'The official channels confirm the date and ticket link.'],
  ['Her team confirms a new single arrives at midnight', 'The management statement names the song and the time.'],
  ['Taylor Swift reveals cover art and date for her next album', 'The official account posted the artwork with the release date.'],
  ['Tour dates for a new international leg announced by Taylor Swift', 'The announcement lists cities and dates; three major outlets carry it.'],
  ['Official: Taylor Swift to headline a major festival next summer', 'The festival and Taylor Swift confirmed the headline slot.'],
  ['Taylor Swift confirms a vinyl exclusive drop starting in one hour', 'The official store countdown went live with an announcement.'],
  ['Taylor Swift releases a deluxe edition of her latest album today', 'The deluxe edition with bonus tracks is live on streaming services.'],
  ['Taylor Swift wins a major award and her team issues an official statement', 'The organizers and her team confirmed the win.'],
];
const PERSONAL = [
  ['Taylor Swift announces her engagement on her own account', 'She shared the news herself; a representative confirmed to major outlets.'],
  ['Taylor Swift and her partner announce their marriage', 'Her representative confirmed the wedding to two tier-one outlets.'],
  ['Taylor Swift announces she is expecting her first child', 'She posted the announcement herself; her team confirmed.'],
  ['Taylor Swift announces the birth of her baby', 'A statement from her team and her own post confirm the birth.'],
  ['Representative confirms Taylor Swift is engaged', 'Two major outlets quote the representative statement as settled fact.'],
  ['Taylor Swift shares news of her pregnancy in a personal message to fans', 'The announcement came from her official account.'],
];

export function syntheticItems(needCritical, needPersonal) {
  const make = (list, cls, group) => list.map(([title, summary], n) => ({
    id: `synthetic:${cls}:${n + 1}`, kind: 'news_story', synthetic: true, expectedClass: cls,
    text: { title, summary },
    meta: { category: group, importance: 10, sourceCount: 3, verificationStatus: 'official', firstSeenAt: null,
      sources: [{ outlet: 'Synthetic Wire', tier: 'official', url: 'https://example.com/' }] },
  }));
  return [...(needCritical ? make(CRITICAL, 'critical_breaking', 'music') : []),
    ...(needPersonal ? make(PERSONAL, 'critical_personal', 'relationship') : [])];
}

export async function buildPool(client, merch, targets = TARGETS) {
  const news = await client.query(SQL.news, [targets.newsDays, targets.newsMax]);
  const reddit = await client.query(SQL.leads, ['reddit', targets.reddit]);
  const facebook = await client.query(SQL.leads, ['facebook', targets.facebook]);
  return [
    ...news.rows.map(shapeNews), ...reddit.rows.map(shapeLead), ...facebook.rows.map(shapeLead),
    ...pickMerch(merch.official, merch.fanMade, targets.merch), ...pickTheories(merch.theories, targets.theory),
  ];
}

async function loadTheories() {
  const dir = path.resolve(import.meta.dirname, '../../supabase/seed/theories');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.mjs') && !f.startsWith('_')).sort();
  return Promise.all(files.map(async (f) => (await import(pathToFileURL(path.join(dir, f)).href)).default));
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const unknown = argv.filter((arg) => arg !== '--dry-run');
  if (unknown.length > 0) throw new Error('usage: export-replay.mjs [--dry-run]');
  const connectionString = deps.connectionString ?? process.env.SUPABASE_DB_URL;
  if (!connectionString && !deps.client) throw new Error('SUPABASE_DB_URL not set (use node --env-file=<worker .env>)');
  const merch = deps.merch ?? {
    official: (await import('../../supabase/seed/merch/official.mjs')).OFFICIAL,
    fanMade: (await import('../../supabase/seed/merch/fanmade.mjs')).FAN_MADE,
    theories: await loadTheories(),
  };
  const client = deps.client ?? makeClient(connectionString, { readOnly: true });
  const ownsClient = !deps.client;
  if (ownsClient) await client.connect();
  let pool;
  try { pool = await buildPool(client, merch); } finally { if (ownsClient) await client.end(); }
  const counts = {};
  for (const item of pool) counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  const out = deps.rawPath ?? RAW_PATH;
  if (!argv.includes('--dry-run')) {
    await mkdir(path.dirname(out), { recursive: true });
    await writeFile(out, JSON.stringify({ exportedAt: new Date().toISOString(), items: pool }));
  }
  (deps.log ?? console.log)(`tidewatch export: ${pool.length} items ${JSON.stringify(counts)}${argv.includes('--dry-run') ? ' (dry-run, nothing written)' : ` -> ${out}`}`);
  return { pool, counts };
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'tidewatch-export-replay' });
