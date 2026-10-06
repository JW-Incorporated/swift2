#!/usr/bin/env node
// E0 detector: keeps fresh Awin rows in the Actions cache; feeds and index are never committed.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MIN_REQUEST_INTERVAL_MS = 12_000;
const MAX_FEEDS_PER_RUN = 60;
const RUN_BUDGET_MS = 25 * 60_000;
const FEED_REQUEST_TIMEOUT_MS = 120_000;

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function sqliteText(value) {
  return value == null ? null : String(value);
}

function parseCsvRow(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      values.push(value);
      value = '';
    } else value += char;
  }
  values.push(value);
  return values;
}

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

export async function fetchChangedFeeds({ feeds, fetchImpl = fetch, sleep = (ms) => new Promise((done) => setTimeout(done, ms)), requestIntervalMs = MIN_REQUEST_INTERVAL_MS, deadlineMs = null, now = Date.now, failures = [], onFeed = null }) {
  const downloaded = [];
  const startedAt = now();
  for (let index = 0; index < feeds.length; index += 1) {
    if (deadlineMs !== null && index > 0 && now() - startedAt >= deadlineMs) break;
    if (index > 0) await sleep(requestIntervalMs);
    const feed = feeds[index];
    let csv;
    try {
      const response = await fetchImpl(feed.downloadUrl, { signal: globalThis.AbortSignal.timeout(FEED_REQUEST_TIMEOUT_MS) });
      if (!response.ok) throw new Error(`Awin feed ${feed.feedId} download failed (${response.status})`);
      csv = await response.text();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ feedId: feed.feedId, message });
      console.warn(`::warning::Awin feed ${feed.feedId} not refreshed, will retry next run: ${message}`);
      continue;
    }
    if (onFeed) {
      await onFeed({ ...feed, csv });
      downloaded.push(feed);
    } else downloaded.push({ ...feed, csv });
  }
  return downloaded;
}

export function rowsFromCsv(feed, csv) {
  const records = parseCsvRecords(String(csv).trim());
  if (records.length === 0) return [];
  const [header, ...lines] = records;
  const names = parseCsvRow(header).map((name) => name.trim().toLowerCase());
  const value = (row, ...candidates) => {
    const index = candidates.map((candidate) => names.indexOf(candidate)).find((candidate) => candidate >= 0);
    return index === undefined ? null : text(row[index]);
  };
  return lines.filter(Boolean).map(parseCsvRow).map((row) => ({
    feedId: feed.feedId,
    advertiserMid: value(row, 'merchant_id', 'advertiser id'),
    productId: value(row, 'aw_product_id', 'product id'),
    title: value(row, 'product_name', 'title'),
    description: value(row, 'description', 'product_short_description'),
    brand: value(row, 'brand_name', 'brand'),
    price: value(row, 'search_price', 'store_price', 'price'),
    stock: value(row, 'in_stock', 'stock_status'),
    imageUrl: value(row, 'aw_image_url', 'merchant_image_url', 'large_image'),
    destinationUrl: value(row, 'merchant_deep_link', 'product_url'),
    deeplink: value(row, 'aw_deep_link', 'deeplink'),
    category: value(row, 'merchant_category', 'category_name'),
    updatedAt: value(row, 'last_updated') ?? feed.updatedAt,
  })).filter((row) => row.productId && row.title);
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
  const { DatabaseSync } = await import('node:sqlite');
  const database = new DatabaseSync(path);
  database.exec('CREATE TABLE IF NOT EXISTS products (feed_id TEXT NOT NULL, advertiser_mid TEXT, product_id TEXT, title TEXT, description TEXT, brand TEXT, price TEXT, stock TEXT, image_url TEXT, destination_url TEXT, deeplink TEXT, category TEXT, updated_at TEXT, PRIMARY KEY(advertiser_mid, product_id));');
  const columns = database.prepare('PRAGMA table_info(products)').all();
  if (!columns.some((column) => column.name === 'feed_id')) database.exec("ALTER TABLE products ADD COLUMN feed_id TEXT NOT NULL DEFAULT ''");
  const removeFeed = database.prepare('DELETE FROM products WHERE feed_id = ?');
  const insert = database.prepare('INSERT OR REPLACE INTO products (feed_id, advertiser_mid, product_id, title, description, brand, price, stock, image_url, destination_url, deeplink, category, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  database.exec('BEGIN');
  try {
    for (const feedId of replacedFeedIds) removeFeed.run(feedId);
    for (const row of rows) {
      insert.run(...[
        row.feedId,
        row.advertiserMid,
        row.productId,
        row.title,
        row.description,
        row.brand,
        row.price,
        row.stock,
        row.imageUrl,
        row.destinationUrl,
        row.deeplink,
        row.category,
        row.updatedAt,
      ].map(sqliteText));
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
  for (const row of database.prepare('SELECT feed_id, product_id, title, description, brand FROM products').all()) {
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
      const rows = rowsFromCsv(feed, feed.csv);
      indexedProducts += rows.length;
      await writeSqliteImpl(indexTarget, rows, [feed.feedId], { rebuildFts: false });
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
