#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import Parser from 'rss-parser';
import { createJevClient, createJevUsageLogger, noulQuestion } from '../lib/jev.mjs';
import { runMain } from '../lib/cli.mjs';
import { serviceClient } from '../lib/supabase.mjs';

export const MAX_JEV_CALLS = 40;
const PAGE = 1000;
const DAY_MS = 86_400_000;
const SAME_STORY = noulQuestion(
  'same_story',
  'Do the reference headline and seen-item summary describe the same real-world event?',
);
const FEEDS = [
  { kind: 'google_news', url: 'https://news.google.com/rss/search?q=%22Taylor+Swift%22&hl=en-US&gl=US&ceid=US:en&scoring=n' },
  { kind: 'official_upload', url: 'https://www.youtube.com/feeds/videos.xml?channel_id=UCqECaJ8Gagnn7YCbPEzWH6g' },
];

function parseArgs(argv) {
  const options = { out: 'docs/ops/dashboard/news.json', fixture: null, fileIssues: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--out') options.out = argv[++index];
    else if (arg === '--fixture') options.fixture = argv[++index];
    else if (arg === '--file-issues') options.fileIssues = true;
    else throw new Error('usage: recall.mjs [--out <file>] [--fixture <file>] [--file-issues]');
  }
  if (!options.out || (options.fixture !== null && !options.fixture)) throw new Error('path argument cannot be empty');
  return options;
}

function cleanText(value) {
  return String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function reference(kind, item) {
  const publishedAt = item.isoDate ?? item.pubDate;
  if (!item.title || !item.link || !Number.isFinite(Date.parse(publishedAt))) return null;
  return {
    source: kind,
    title: cleanText(item.title),
    url: item.link,
    published_at: new Date(publishedAt).toISOString(),
    critical: kind === 'official_upload',
  };
}

export async function collectReferences({ fetchImpl = fetch, parser = new Parser(), now = Date.now() } = {}) {
  const references = [];
  for (const feed of FEEDS) {
    const response = await fetchImpl(feed.url, { headers: { 'user-agent': 'swift2-recall-audit/1.0' } });
    if (!response.ok) throw new Error(`${feed.kind} reference read failed: HTTP ${response.status}`);
    const parsed = await parser.parseString(await response.text());
    references.push(...parsed.items.map((item) => reference(feed.kind, item)).filter(Boolean));
  }
  const reddit = await fetchImpl('https://www.reddit.com/r/TaylorSwift/top.json?t=week&limit=100', {
    headers: { 'user-agent': 'swift2-recall-audit/1.0' },
  });
  if (!reddit.ok) throw new Error(`fan reference read failed: HTTP ${reddit.status}`);
  const bestByDay = new Map();
  for (const child of (await reddit.json())?.data?.children ?? []) {
    const post = child?.data;
    if (!post?.title || !post?.permalink || !Number.isFinite(post.created_utc)) continue;
    const publishedAt = new Date(post.created_utc * 1000);
    const day = publishedAt.toISOString().slice(0, 10);
    if ((bestByDay.get(day)?.score ?? -1) >= (post.score ?? 0)) continue;
    bestByDay.set(day, { score: post.score ?? 0, value: reference('fan_post', {
      title: post.title,
      link: new URL(post.permalink, 'https://www.reddit.com').href,
      isoDate: publishedAt.toISOString(),
    }) });
  }
  references.push(...[...bestByDay.values()].map((entry) => entry.value));
  const floor = now - 7 * DAY_MS;
  return [...new Map(references
    .filter((item) => Date.parse(item.published_at) >= floor && Date.parse(item.published_at) <= now)
    .map((item) => [item.url, item])).values()];
}

async function readAll(client, table, columns) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client.from(table).select(columns).range(from, from + PAGE - 1);
    if (error) throw new Error(`${table} read failed: ${error.message}`);
    rows.push(...data);
    if (data.length < PAGE) return rows;
  }
}

export async function readAuditInputs(client) {
  const [seen, decisions, timelines] = await Promise.all([
    readAll(client, 'watch_item', 'id,item_key,source,source_ref,story_id,first_seen_at,excerpt,status'),
    readAll(client, 'watch_decision', 'item_id,class,shadow,decided_at'),
    readAll(client, 'story_timeline', 'story_id,first_public_at,detected_at,classified_at,on_site_at'),
  ]);
  return { seen, decisions, timelines };
}

function words(value) {
  return new Set(cleanText(value).toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
}

function candidatesFor(item, seen) {
  const refWords = words(item.title);
  const published = Date.parse(item.published_at);
  return seen.filter((candidate) => {
    const detected = Date.parse(candidate.first_seen_at);
    if (detected < published - 6 * 3_600_000 || detected > published + 48 * 3_600_000) return false;
    let overlap = 0;
    for (const word of words(candidate.excerpt)) if (refWords.has(word)) overlap += 1;
    return overlap >= 2;
  }).slice(0, 3);
}

export async function matchReferences(references, seen, { jev, cap = MAX_JEV_CALLS } = {}) {
  if (!Number.isInteger(cap) || cap < 0 || cap > MAX_JEV_CALLS) throw new Error(`Jev cap must be 0-${MAX_JEV_CALLS}`);
  const matches = [];
  let calls = 0;
  for (const item of references) {
    let matched = null;
    for (const candidate of candidatesFor(item, seen)) {
      if (calls >= cap) break;
      calls += 1;
      const result = await jev.ask({
        caller: 'news-recall',
        state: `Reference headline: ${item.title}\nSeen-item summary: ${candidate.excerpt ?? ''}`,
        questions: [SAME_STORY],
      });
      if (result.answers.same_story?.probability >= 0.75) {
        matched = candidate;
        break;
      }
    }
    matches.push({ reference: item, match: matched });
  }
  return { matches, calls, cap, capped: calls >= cap };
}

function ratio(numerator, denominator) {
  return denominator ? Number((numerator / denominator).toFixed(4)) : null;
}

export function buildReport({ references, matching, inputs, now, filingRequested = false }) {
  const age = (item) => now - Date.parse(item.reference.published_at);
  const eligible48 = matching.matches.filter((item) => age(item) >= 48 * 3_600_000);
  const critical1 = matching.matches.filter((item) => item.reference.critical && age(item) >= 3_600_000);
  return {
    schema_version: 1,
    generated_at: new Date(now).toISOString(),
    window_start: new Date(now - 7 * DAY_MS).toISOString(),
    events: references.length,
    hit_48h: ratio(eligible48.filter((item) => item.match).length, eligible48.length),
    hit_1h_critical: ratio(critical1.filter((item) => item.match
      && Date.parse(item.match.first_seen_at) - Date.parse(item.reference.published_at) <= 3_600_000).length, critical1.length),
    missed: eligible48.filter((item) => !item.match).map((item) => item.reference),
    denominators: { eligible_48h: eligible48.length, critical_1h: critical1.length },
    inputs_read: { seen: inputs.seen.length, decisions: inputs.decisions.length, timelines: inputs.timelines.length },
    jev: { calls: matching.calls, cap: matching.cap, capped: matching.capped },
    filing: { requested: filingRequested, enabled: false, filed: 0 },
  };
}

async function emitReport(file, row) {
  let dashboard = { schema_version: 1, rows: [] };
  try { dashboard = JSON.parse(await readFile(file, 'utf8')); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  if (!Array.isArray(dashboard.rows)) throw new Error('report JSON rows must be an array');
  dashboard.rows.push(row);
  await mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await writeFile(file, `${JSON.stringify(dashboard, null, 2)}\n`, 'utf8');
}

export async function main(argv = process.argv.slice(2), deps = {}) {
  const options = parseArgs(argv);
  const now = deps.now ?? Date.now();
  const references = options.fixture
    ? JSON.parse(await readFile(options.fixture, 'utf8')).references
    : await (deps.collectReferences ?? collectReferences)({ now });
  const client = deps.client ?? serviceClient();
  if (!client) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set');
  const inputs = await readAuditInputs(client);
  const jev = deps.jev ?? createJevClient({ usageLogger: createJevUsageLogger(client) });
  const matching = await matchReferences(references, inputs.seen, { jev });
  const report = buildReport({ references, matching, inputs, now, filingRequested: options.fileIssues });
  await (deps.emitReport ?? emitReport)(options.out, report);
  (deps.log ?? console.log)(JSON.stringify(report));
  return report;
}

const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedDirectly) runMain(main, { name: 'news-recall' });
