#!/usr/bin/env node
// E0 detector: keeps fresh Awin rows in the Actions cache; feeds and index are never committed.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { runMain } from '../lib/cli.mjs';
import {
  DEFAULT_FEED_MAX_BYTES,
  DEFAULT_FEED_MAX_ROWS,
  feedRowBatches,
  feedRowMapper,
  INSERT_PRODUCT_SQL,
  openIndex,
  parseCsvRow,
  productValues,
  text,
  writeFeedStream,
} from './awin-feed-stream.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIN_REQUEST_INTERVAL_MS = 12_000;
const MAX_FEEDS_PER_RUN = 60;
const RUN_BUDGET_MS = 25 * 60_000;
// Applies to stalls (no response or no chunk), not to total feed time: a large healthy stream is never cut off.
const FEED_IDLE_TIMEOUT_MS = 120_000;

function parseCsvRecords(csv) {
  const records = [];
  let start = 0;
  let quoted = false;
  for (let index = 0; index < csv.length; index += 1) {
    if (csv[index] === '"') {
      if (quoted && csv[index + 1] === '"') index += 1;
      else quoted = !quoted;
    }
    if (csv[index] === '\n' && !quoted) {
      records.push(csv.slice(start, index).replace(/\r$/, ''));
      start = index + 1;
    }
  }
  if (start < csv.length) records.push(csv.slice(start).replace(/\r$/, ''));
  return records;
}

export function parseFeedDirectory(csv) {
  const [header, ...lines] = parseCsvRecords(String(csv).trim());
  const names = parseCsvRow(header).map((name) => name.trim().toLowerCase());
  const hasColumn = (...candidates) => candidates.some((candidate) => names.includes(candidate));
  const field = (row, ...candidates) => {
    const index = candidates.map((candidate) => names.indexOf(candidate)).find((candidate) => candidate >= 0);
    return index === undefined ? null : text(row[index]);
  };
  const rows = lines.filter(Boolean).map(parseCsvRow);
  const feeds = rows
    .map((row) => ({
      feedId: field(row, 'feed id', 'feed_id', 'fid'),
      updatedAt: field(row, 'last imported', 'last update', 'last_updated'),
      downloadUrl: field(row, 'url', 'download url', 'download_url'),
      advertiserMid: field(row, 'advertiser id', 'advertiser_id', 'merchant id', 'merchant_id'),
    }))
    .filter((feed) => feed.feedId && feed.updatedAt && feed.downloadUrl);
  return {
    complete: hasColumn('feed id', 'feed_id', 'fid')
      && hasColumn('last imported', 'last update', 'last_updated')
      && hasColumn('url', 'download url', 'download_url')
      && feeds.length === rows.length,
    feeds,
  };
}

export function parseFeedList(csv) {
  return parseFeedDirectory(csv).feeds;
}

export function buildFeedSyncPlan({ feeds = [], cache = {} }) {
  const previous = cache.feeds ?? {};
  return feeds.filter((feed) => previous[feed.feedId] !== feed.updatedAt);
}

export function removedFeedIds({ feeds = [], cache = {} }) {
  const current = new Set(feeds.map((feed) => feed.feedId));
  return Object.keys(cache.feeds ?? {}).filter((feedId) => !current.has(feedId));
}

export function buildFeedDirectorySyncPlan({ csv, cache = {} }) {
  const { complete, feeds } = parseFeedDirectory(csv);
  if (!complete) {
    return { complete: false, feeds, changed: [], removed: [] };
  }
  if (feeds.length === 0 && Object.keys(cache.feeds ?? {}).length > 0 && !cache.emptyDirectoryStreak) {
    return { complete: true, feeds, changed: [], removed: [], deferredRemoval: true };
  }
  return {
    complete,
    feeds,
    changed: buildFeedSyncPlan({ feeds, cache }),
    removed: removedFeedIds({ feeds, cache }),
  };
}

export function boundChangedFeeds(changed, maxFeeds = MAX_FEEDS_PER_RUN) {
  const byDate = (a, b) => {
    const left = Date.parse(a.updatedAt);
    const right = Date.parse(b.updatedAt);
    return Number.isNaN(left) || Number.isNaN(right) ? String(a.updatedAt).localeCompare(String(b.updatedAt)) : left - right;
  };
  const ordered = [...changed].sort((a, b) => byDate(a, b) || String(a.feedId).localeCompare(String(b.feedId)));
  return Number.isFinite(maxFeeds) && maxFeeds > 0 ? ordered.slice(0, maxFeeds) : ordered;
}

export function nextFeedCache({ feeds, cache = {}, refreshed }) {
  const previous = cache.feeds ?? {};
  const done = new Set(refreshed.map((feed) => feed.feedId));
  const next = {};
  for (const feed of feeds) {
    if (done.has(feed.feedId)) next[feed.feedId] = feed.updatedAt;
    else if (feed.feedId in previous) next[feed.feedId] = previous[feed.feedId];
  }
  return { feeds: next };
}

async function* idleWatched(stream, arm) {
  for await (const chunk of stream) {
    arm();
    yield chunk;
  }
}

export async function fetchChangedFeeds({ feeds, fetchImpl = fetch, sleep = (ms) => new Promise((done) => setTimeout(done, ms)), requestIntervalMs = MIN_REQUEST_INTERVAL_MS, deadlineMs = null, now = Date.now, failures = [], onFeed = null, idleTimeoutMs = FEED_IDLE_TIMEOUT_MS }) {
  const downloaded = [];
  const startedAt = now();
  for (let index = 0; index < feeds.length; index += 1) {
    if (deadlineMs !== null && index > 0 && now() - startedAt >= deadlineMs) break;
    if (index > 0) await sleep(requestIntervalMs);
    const feed = feeds[index];
    const controller = new AbortController();
    let timer;
    const arm = () => {
      clearTimeout(timer);
      timer = setTimeout(() => controller.abort(), idleTimeoutMs);
    };
    let stream = null;
    try {
      arm();
      const response = await fetchImpl(feed.downloadUrl, { signal: controller.signal });
      if (!response.ok) throw new Error(`Awin feed ${feed.feedId} download failed (${response.status})`);
      stream = response.body ? Readable.fromWeb(response.body) : Readable.from([]);
      if (onFeed) await onFeed({ ...feed, body: idleWatched(stream, arm), contentLength: response.headers?.get('content-length') ?? null });
      downloaded.push(feed);
    } catch (error) {
      if (stream && !error?.feedSource) throw error;
      const message = controller.signal.aborted ? `stalled, no data for ${idleTimeoutMs / 1000}s` : error instanceof Error ? error.message : String(error);
      failures.push({ feedId: feed.feedId, message });
      console.warn(`::warning::Awin feed ${feed.feedId} not refreshed, will retry next run: ${message}`);
    } finally {
      clearTimeout(timer);
      stream?.destroy();
    }
  }
  return downloaded;
}

export function rowsFromCsv(feed, csv) {
  const records = parseCsvRecords(String(csv).trim());
  if (records.length === 0) return [];
  const [header, ...lines] = records;
  const mapRow = feedRowMapper(feed, header);
  return lines.filter(Boolean).map(mapRow).filter((row) => row.productId && row.title);
}

async function jsonFrom(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function writeSqlite(path, rows, replacedFeedIds, { rebuildFts = true } = {}) {
  const database = await openIndex(path);
  const removeFeed = database.prepare('DELETE FROM products WHERE feed_id = ?');
  const insert = database.prepare(INSERT_PRODUCT_SQL);
  database.exec('BEGIN');
  try {
    for (const feedId of replacedFeedIds) removeFeed.run(feedId);
    for (const row of rows) {
      insert.run(...productValues(row));
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    database.close();
    throw error;
  }
  if (!rebuildFts) {
    database.close();
    return;
  }
  database.exec('DROP TABLE IF EXISTS products_fts; CREATE VIRTUAL TABLE products_fts USING fts5(product_key UNINDEXED, title, description, brand);');
  const insertFts = database.prepare('INSERT INTO products_fts (product_key, title, description, brand) VALUES (?, ?, ?, ?)');
  for (const row of database.prepare('SELECT feed_id, product_id, title, description, brand FROM products').iterate()) {
    insertFts.run(`${row.feed_id}:${row.product_id}`, row.title, row.description, row.brand);
  }
  database.close();
}

export async function syncAwinFeeds({
  cachePath = 'awin-feed-cache.json',
  indexPath = 'awin-product-index.sqlite',
  apiKey,
  fetchImpl = fetch,
  writeSqliteImpl = writeSqlite,
  writeFeedImpl = writeFeedStream,
  maxFeedBytes = Number(process.env.AWIN_FEED_MAX_BYTES) || DEFAULT_FEED_MAX_BYTES,
  maxFeedRows = DEFAULT_FEED_MAX_ROWS,
  maxFeeds = MAX_FEEDS_PER_RUN,
  deadlineMs = RUN_BUDGET_MS,
} = {}) {
  if (!apiKey) throw new Error('AWIN_FEED_API_KEY is required');
  const cache = await jsonFrom(resolve(ROOT, cachePath), { feeds: {} });
  const cacheTarget = resolve(ROOT, cachePath);
  const list = await fetchImpl(`https://productdata.awin.com/datafeed/list/apikey/${encodeURIComponent(apiKey)}`);
  if (!list.ok) throw new Error(`Awin feed list request failed (${list.status})`);
  const { complete, feeds, changed, removed, deferredRemoval } = buildFeedDirectorySyncPlan({ csv: await list.text(), cache });
  if (!complete) throw new Error('Awin feed directory response is incomplete; leaving local index untouched');
  if (deferredRemoval) {
    await mkdir(dirname(cacheTarget), { recursive: true });
    await writeFile(cacheTarget, `${JSON.stringify({ ...cache, feeds: cache.feeds ?? {}, emptyDirectoryStreak: 1 }, null, 2)}\n`);
    console.warn('Awin feed directory is empty; deferring all-feed removal until the next consecutive response');
    return;
  }
  if (feeds.length > 0 && cache.emptyDirectoryStreak) {
    const cacheWithoutEmptyDirectoryStreak = { ...cache };
    delete cacheWithoutEmptyDirectoryStreak.emptyDirectoryStreak;
    await mkdir(dirname(cacheTarget), { recursive: true });
    await writeFile(cacheTarget, `${JSON.stringify(cacheWithoutEmptyDirectoryStreak, null, 2)}\n`);
  }
  if (changed.some((feed) => !feed.advertiserMid)) throw new Error('Awin feed list must identify each changed advertiser');
  const failures = [];
  const attempted = boundChangedFeeds(changed, maxFeeds);
  const indexTarget = resolve(ROOT, indexPath);
  let indexedProducts = 0;
  const downloaded = await fetchChangedFeeds({
    feeds: attempted,
    fetchImpl,
    deadlineMs,
    failures,
    onFeed: async (feed) => {
      const feedStartedAt = Date.now();
      const rows = await writeFeedImpl(indexTarget, feed.feedId, feedRowBatches(feed, feed.body, { maxBytes: maxFeedBytes, maxRows: maxFeedRows }));
      indexedProducts += rows;
      console.log(`Awin feed ${feed.feedId} (advertiser ${feed.advertiserMid}): content-length ${feed.contentLength ?? 'n/a'}, ${rows} rows, ${Date.now() - feedStartedAt}ms`);
    },
  });
  if (downloaded.length === 0 && failures.length > 0) throw new Error(`All ${failures.length} attempted Awin feed downloads failed; first: ${failures[0].message}`);
  await mkdir(dirname(cacheTarget), { recursive: true });
  if (downloaded.length > 0 || removed.length > 0) await writeSqliteImpl(indexTarget, [], removed, { rebuildFts: true });
  await writeFile(cacheTarget, `${JSON.stringify(nextFeedCache({ feeds, cache, refreshed: downloaded }), null, 2)}\n`);
  console.log(JSON.stringify({ changedFeeds: downloaded.length, failedFeeds: failures.length, pendingFeeds: changed.length - downloaded.length, removedFeeds: removed.length, indexedProducts }));
}

async function main() {
  const args = process.argv.slice(2);
  const option = (name) => args.includes(name) ? args[args.indexOf(name) + 1] : null;
  await syncAwinFeeds({
    cachePath: option('--cache') || 'awin-feed-cache.json',
    indexPath: option('--index') || 'awin-product-index.sqlite',
    apiKey: process.env.AWIN_FEED_API_KEY,
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) runMain(main, { name: 'sync-awin-feeds' });
