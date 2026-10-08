#!/usr/bin/env node
// E6 search step (a): read-only FTS lookup against the E0-built Awin product
// index (SQLite in the Actions cache, never committed — see sync-awin-feeds.mjs).
// Zero-LLM, zero-write. Free by construction: this never counts against the
// paid-search cap and always runs before brand-direct or paid search (SPEC §8).

function ftsQueryFor(descriptors) {
  const terms = [descriptors?.brand, descriptors?.kind, descriptors?.color, descriptors?.pattern, descriptors?.silhouette]
    .filter((term) => typeof term === 'string' && term.trim())
    .map((term) => `"${term.trim().replace(/"/g, '""')}"`);
  if (terms.length === 0) return null;
  return terms.join(' OR ');
}

export function candidateFromRow(row) {
  return {
    id: `${row.feed_id}:${row.product_id}`,
    source: 'awin-index',
    title: row.title,
    price: row.price,
    stock: row.stock,
    imageUrl: row.image_url,
    productUrl: row.destination_url,
    deeplink: row.deeplink,
    brand: row.brand,
    category: row.category,
  };
}

/**
 * Queries the read-only Awin product index. Returns [] (never throws) when
 * the index is absent or empty — E0 not having run yet is a degrade-to-b/c
 * condition, not a matcher failure (SPEC §8, docs/decisions.md E6 disposition).
 */
export async function searchAwinIndex({ descriptors, indexPath, limit = 10, openDatabase } = {}) {
  const query = ftsQueryFor(descriptors);
  if (!query) return [];
  let database;
  try {
    const open = openDatabase ?? (async (path) => {
      const { DatabaseSync } = await import('node:sqlite');
      return new DatabaseSync(path, { readOnly: true });
    });
    database = await open(indexPath);
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'SQLITE_CANTOPEN') return [];
    throw error;
  }
  try {
    const rows = database
      .prepare(
        `SELECT p.* FROM products_fts f
         JOIN products p ON (p.feed_id || ':' || p.product_id) = f.product_key
         WHERE products_fts MATCH ?
         LIMIT ?`,
      )
      .all(query, limit);
    return rows.map(candidateFromRow);
  } finally {
    database.close?.();
  }
}
