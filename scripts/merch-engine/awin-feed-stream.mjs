// Streaming Awin feed ingestion: bounded memory regardless of feed size.
import { StringDecoder } from 'node:string_decoder';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

// A feed that decodes past either limit is skipped (rolled back, warned, left out of the cache).
export const DEFAULT_FEED_MAX_BYTES = 1.5 * 1024 ** 3;
export const DEFAULT_FEED_MAX_ROWS = 3_000_000;
export const FEED_BATCH_SIZE = 2_000;
// One CSV record (even with quoted newlines) is never legitimately this large; guards an unterminated quote.
const MAX_RECORD_CHARS = 8 * 1024 * 1024;

export function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function sqliteText(value) {
  return value == null ? null : String(value);
}

export function parseCsvRow(line) {
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

// Incremental quote-aware record splitter. Toggling on every quote is equivalent to the
// escaped-pair rule for finding record boundaries and needs no lookahead across chunks.
export function createRecordSplitter() {
  let pending = '';
  let quoted = false;
  return {
    push(chunk) {
      const records = [];
      let start = 0;
      for (let index = 0; index < chunk.length; index += 1) {
        const code = chunk.charCodeAt(index);
        if (code === 34) quoted = !quoted;
        else if (code === 10 && !quoted) {
          records.push((pending + chunk.slice(start, index)).replace(/\r$/, ''));
          pending = '';
          start = index + 1;
        }
      }
      pending += chunk.slice(start);
      if (pending.length > MAX_RECORD_CHARS)
        throw new Error('CSV record exceeds the maximum record size');
      return records;
    },
    end() {
      const last = pending.replace(/\r$/, '');
      pending = '';
      return last ? [last] : [];
    },
  };
}

export function feedRowMapper(feed, headerRecord) {
  const names = parseCsvRow(headerRecord).map((name) => name.trim().toLowerCase());
  const value = (row, ...candidates) => {
    const index = candidates
      .map((candidate) => names.indexOf(candidate))
      .find((candidate) => candidate >= 0);
    return index === undefined ? null : text(row[index]);
  };
  return (record) => {
    const row = parseCsvRow(record);
    return {
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
    };
  };
}

// Yields the raw chunks, gunzipping when the body starts with the gzip magic bytes
// (undici already removes Content-Encoding gzip; this covers a .gz file served as-is).
async function* decodedChunks(source) {
  const iterator = source[Symbol.asyncIterator]();
  const first = await iterator.next();
  if (first.done) return;
  const rest = (async function* remaining() {
    yield first.value;
    for (;;) {
      const next = await iterator.next();
      if (next.done) return;
      yield next.value;
    }
  })();
  if (first.value[0] === 0x1f && first.value[1] === 0x8b) {
    const gunzip = createGunzip();
    pipeline(Readable.from(rest), gunzip).catch(() => undefined);
    yield* gunzip;
  } else yield* rest;
}

export function describeBytes(bytes) {
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

// Async generator of row arrays (<= batchSize). Any error thrown here is tagged feedSource so the
// caller can tell a bad/oversized feed (skip + retry) from a local SQLite failure (fatal).
export async function* feedRowBatches(
  feed,
  source,
  {
    maxBytes = DEFAULT_FEED_MAX_BYTES,
    maxRows = DEFAULT_FEED_MAX_ROWS,
    batchSize = FEED_BATCH_SIZE,
  } = {},
) {
  try {
    const splitter = createRecordSplitter();
    const decoder = new StringDecoder('utf8');
    let mapRow = null;
    let bytes = 0;
    let rows = 0;
    let batch = [];
    const consume = (records) => {
      const full = [];
      for (const record of records) {
        if (!record) continue;
        if (!mapRow) {
          mapRow = feedRowMapper(feed, record);
          continue;
        }
        const row = mapRow(record);
        if (!row.productId || !row.title) continue;
        rows += 1;
        if (rows > maxRows)
          throw new Error(
            `feed ${feed.feedId} exceeded the ${maxRows} row cap after ${describeBytes(bytes)}; skipped`,
          );
        batch.push(row);
        if (batch.length >= batchSize) {
          full.push(batch);
          batch = [];
        }
      }
      return full;
    };
    for await (const chunk of decodedChunks(source)) {
      bytes += chunk.byteLength;
      if (bytes > maxBytes)
        throw new Error(
          `feed ${feed.feedId} exceeded the ${describeBytes(maxBytes)} size cap (streamed ${describeBytes(bytes)}); skipped`,
        );
      for (const full of consume(splitter.push(decoder.write(chunk)))) yield full;
    }
    for (const full of consume(splitter.push(decoder.end()))) yield full;
    for (const full of consume(splitter.end())) yield full;
    if (batch.length > 0) yield batch;
  } catch (error) {
    const tagged = error instanceof Error ? error : new Error(String(error));
    tagged.feedSource = true;
    throw tagged;
  }
}

export async function openIndex(path) {
  const { DatabaseSync } = await import('node:sqlite');
  const database = new DatabaseSync(path);
  database.exec(
    'CREATE TABLE IF NOT EXISTS products (feed_id TEXT NOT NULL, advertiser_mid TEXT, product_id TEXT, title TEXT, description TEXT, brand TEXT, price TEXT, stock TEXT, image_url TEXT, destination_url TEXT, deeplink TEXT, category TEXT, updated_at TEXT, PRIMARY KEY(advertiser_mid, product_id));',
  );
  const columns = database.prepare('PRAGMA table_info(products)').all();
  if (!columns.some((column) => column.name === 'feed_id'))
    database.exec("ALTER TABLE products ADD COLUMN feed_id TEXT NOT NULL DEFAULT ''");
  return database;
}

export const INSERT_PRODUCT_SQL =
  'INSERT OR REPLACE INTO products (feed_id, advertiser_mid, product_id, title, description, brand, price, stock, image_url, destination_url, deeplink, category, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

export function productValues(row) {
  return [
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
  ].map(sqliteText);
}

// One transaction per feed: delete the feed's old rows, insert streamed batches, commit.
// Any error (stream or SQLite) rolls back so the feed's previous rows stay intact. Returns rows written.
export async function writeFeedStream(path, feedId, batches) {
  const database = await openIndex(path);
  const removeFeed = database.prepare('DELETE FROM products WHERE feed_id = ?');
  const insert = database.prepare(INSERT_PRODUCT_SQL);
  let written = 0;
  database.exec('BEGIN');
  try {
    removeFeed.run(feedId);
    for await (const batch of batches) {
      for (const row of batch) insert.run(...productValues(row));
      written += batch.length;
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  } finally {
    database.close();
  }
  return written;
}
