#!/usr/bin/env node
// E4 detector: fetches the public official-store catalog and writes only a
// data handoff. A separate authoring lane owns any seed or social-queue change.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STORE_URL = 'https://store.taylorswift.com';
const REQUEST_INTERVAL_MS = 1000;
const MAX_THROTTLE_RETRIES = 3;
const MAX_CATALOG_PAGES = 100;
const MAX_COLLECTIONS = 250;
const MAX_SITEMAP_PRODUCTS = 2_000;

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function price(value) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    : null;
}

export function kindFor(productType) {
  const value = String(productType ?? '').toLowerCase();
  if (/(vinyl|cd|cassette|music|album)/.test(value)) return 'music';
  if (/(hoodie|jacket|coat)/.test(value)) return 'outerwear';
  if (/(sweater|cardigan|knit)/.test(value)) return 'knitwear';
  if (/(shirt|tee|tank|top)/.test(value)) return 'top';
  if (/(pant|jean|skirt|short)/.test(value)) return 'bottom';
  if (/(dress|romper)/.test(value)) return 'dress';
  if (/(shoe|boot|slipper)/.test(value)) return 'shoes';
  if (/(necklace|ring|bracelet|earring|jewelry)/.test(value)) return 'jewelry';
  if (/(bag|tote|purse)/.test(value)) return 'bag';
  if (/(hat|cap|beanie)/.test(value)) return 'hat';
  if (/(poster|ornament|collectible|accessory)/.test(value)) return 'collectible';
  return 'other';
}

export function normalizeOfficialProduct(product, fetchedAt) {
  const handle = text(product?.handle);
  const item = text(product?.title);
  const sourceId = product?.id === undefined || product?.id === null ? null : String(product.id);
  if (!sourceId || !handle || !item) return null;
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const availableVariant = variants.find((variant) => variant?.available === true);
  const selectedVariant = availableVariant ?? variants[0];
  return {
    sourceId,
    brand: 'Taylor Swift Official',
    item,
    retailer: 'store.taylorswift.com',
    url: `${STORE_URL}/products/${encodeURIComponent(handle)}`,
    ...(price(selectedVariant?.price) ? { price: price(selectedVariant.price) } : {}),
    inStock: variants.some((variant) => variant?.available === true),
    ...(text(product?.images?.[0]?.src) ? { imageUrl: text(product.images[0].src) } : {}),
    kind: kindFor(product?.product_type),
    discoveredVia: 'shopify-sync',
    discoveredAt: fetchedAt,
    verifiedAt: fetchedAt,
  };
}

function requestHeaders(cacheHeaders) {
  const headers = { accept: 'application/json' };
  if (cacheHeaders?.etag) headers['if-none-match'] = cacheHeaders.etag;
  if (cacheHeaders?.lastModified) headers['if-modified-since'] = cacheHeaders.lastModified;
  return headers;
}

function retryAfterMs(response) {
  const value = response.headers.get('retry-after');
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  const date = Date.parse(value ?? '');
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : REQUEST_INTERVAL_MS;
}

function pageCache(cache, url, fallbackHeaders = {}) {
  return cache?.pages?.[url] ?? fallbackHeaders;
}

function cacheEntry(response, products, previous = {}) {
  return {
    etag: response.headers.get('etag') ?? previous.etag ?? null,
    lastModified: response.headers.get('last-modified') ?? previous.lastModified ?? null,
    products,
  };
}

function decodeXmlEntities(value) {
  return String(value)
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

function productUrlsFromSitemap(xml) {
  return [...String(xml).matchAll(/<loc>([^<]*\/products\/[^<]+)<\/loc>/g)].map((match) =>
    decodeXmlEntities(match[1]),
  );
}

function productSitemapUrlsFromIndex(xml) {
  return [...String(xml).matchAll(/<loc>([^<]*\/sitemap_products_[^<]+)<\/loc>/g)].map(
    (match) => decodeXmlEntities(match[1]),
  );
}

function productFromAjax(product) {
  return {
    ...product,
    variants: Array.isArray(product?.variants)
      ? product.variants.map((variant) => ({
          ...variant,
          ...(Number.isFinite(Number(variant?.price)) ? { price: Number(variant.price) / 100 } : {}),
        }))
      : product?.variants,
  };
}

export async function fetchOfficialProducts({
  fetchImpl = fetch,
  sleep = (milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds)),
  cache = {},
  cacheHeaders = {},
  baseUrl = STORE_URL,
} = {}) {
  let lastRequestAt = null;
  const pages = { ...(cache?.pages ?? {}) };
  const request = async (url, cached = {}) => {
    let response;
    for (let attempt = 0; attempt <= MAX_THROTTLE_RETRIES; attempt += 1) {
      const elapsed = lastRequestAt === null ? REQUEST_INTERVAL_MS : Date.now() - lastRequestAt;
      if (elapsed < REQUEST_INTERVAL_MS) await sleep(REQUEST_INTERVAL_MS - elapsed);
      lastRequestAt = Date.now();
      response = await fetchImpl(url, { headers: requestHeaders(cached) });
      if (response.status !== 429) break;
      if (attempt === MAX_THROTTLE_RETRIES)
        throw new Error(`Shopify throttled ${MAX_THROTTLE_RETRIES + 1} consecutive requests`);
      await sleep(Math.max(REQUEST_INTERVAL_MS, retryAfterMs(response)));
    }
    return response;
  };
  const catalog = [];
  let changed = false;

  try {
    for (let page = 1; page <= MAX_CATALOG_PAGES; page += 1) {
      const url = `${baseUrl}/products.json?limit=250&page=${page}`;
      const cached = pageCache(cache, url, page === 1 ? cacheHeaders : {});
      const response = await request(url, cached);
      if (response.status === 304) {
        if (!Array.isArray(cached.products)) {
          if (page === 1)
            return {
              products: [],
              notModified: true,
              cacheHeaders: {
                etag: cached.etag ?? null,
                lastModified: cached.lastModified ?? null,
              },
              cache: { pages },
              complete: false,
              degraded: true,
              source: 'catalog',
            };
          throw new Error(`Shopify returned 304 without a cached page listing for ${url}`);
        }
        catalog.push(...cached.products);
        if (cached.products.length < 250)
          return {
            products: catalog,
            notModified: !changed,
            cacheHeaders: cached,
            cache: { pages },
            complete: true,
            degraded: false,
            source: 'catalog',
          };
        continue;
      }
      if (!response.ok) throw new Error(`Shopify request failed (${response.status}) for ${url}`);
      const payload = await response.json();
      const batch = Array.isArray(payload?.products) ? payload.products : [];
      pages[url] = cacheEntry(response, batch, cached);
      catalog.push(...batch);
      changed = true;
      if (batch.length < 250)
        return {
          products: catalog,
          notModified: false,
          cacheHeaders: pages[url],
          cache: { pages },
          complete: true,
          degraded: false,
          source: 'catalog',
        };
    }
    throw new Error(`Shopify catalog exceeded ${MAX_CATALOG_PAGES} pages`);
  } catch (catalogError) {
    const collectionUrl = `${baseUrl}/collections.json?limit=${MAX_COLLECTIONS}&page=1`;
    try {
      const collectionsResponse = await request(collectionUrl);
      if (!collectionsResponse.ok)
        throw new Error(`Shopify collection index failed (${collectionsResponse.status})`, {
          cause: catalogError,
        });
      const collections = (await collectionsResponse.json())?.collections ?? [];
      if (
        !Array.isArray(collections) ||
        collections.length === 0 ||
        collections.length >= MAX_COLLECTIONS
      )
        throw new Error('Shopify collection index is incomplete', { cause: catalogError });
      const byId = new Map();
      for (const collection of collections) {
        if (!text(collection?.handle)) continue;
        for (let page = 1; page <= MAX_CATALOG_PAGES; page += 1) {
          const url = `${baseUrl}/collections/${encodeURIComponent(collection.handle)}/products.json?limit=250&page=${page}`;
          const response = await request(url);
          if (!response.ok)
            throw new Error(`Shopify collection failed (${response.status}) for ${url}`, {
              cause: catalogError,
            });
          const batch = (await response.json())?.products ?? [];
          for (const product of batch) byId.set(String(product.id), product);
          if (batch.length < 250) break;
          if (page === MAX_CATALOG_PAGES)
            throw new Error(`Shopify collection exceeded ${MAX_CATALOG_PAGES} pages`, {
              cause: catalogError,
            });
        }
      }
      return {
        products: [...byId.values()],
        notModified: false,
        cacheHeaders: {},
        cache: { pages },
        complete: false,
        degraded: true,
        source: 'collections',
        error: catalogError.message,
      };
    } catch (collectionError) {
      const sitemapResponse = await request(`${baseUrl}/sitemap.xml`);
      if (!sitemapResponse.ok)
        throw new Error(
          `Shopify catalog, collection, and sitemap fetches failed: ${catalogError.message}; ${collectionError.message}; sitemap ${sitemapResponse.status}`,
          { cause: collectionError },
        );
      const sitemapXml = await sitemapResponse.text();
      const productSitemaps = productSitemapUrlsFromIndex(sitemapXml);
      const productUrls = productUrlsFromSitemap(sitemapXml);
      for (const url of productSitemaps) {
        const response = await request(url);
        if (!response.ok)
          throw new Error(`Shopify product sitemap failed (${response.status}) for ${url}`, {
            cause: collectionError,
          });
        productUrls.push(...productUrlsFromSitemap(await response.text()));
      }
      if (productUrls.length === 0 || productUrls.length > MAX_SITEMAP_PRODUCTS)
        throw new Error(
          `Shopify sitemap product count is outside safe bounds (${productUrls.length})`,
          { cause: collectionError },
        );
      const products = [];
      for (const productUrl of productUrls) {
        const endpoint = new URL(productUrl);
        endpoint.pathname = `${endpoint.pathname.replace(/\/$/, '')}.js`;
        const response = await request(String(endpoint));
        if (!response.ok)
          throw new Error(`Shopify sitemap product failed (${response.status}) for ${endpoint}`, {
            cause: collectionError,
          });
        products.push(productFromAjax(await response.json()));
      }
      return {
        products,
        notModified: false,
        cacheHeaders: {},
        cache: { pages },
        complete: true,
        degraded: true,
        source: 'sitemap',
        error: `${catalogError.message}; ${collectionError.message}`,
      };
    }
  }
}

function equalListing(left, right) {
  return (
    JSON.stringify({ ...left, discoveredAt: undefined, verifiedAt: undefined }) ===
    JSON.stringify({ ...right, discoveredAt: undefined, verifiedAt: undefined })
  );
}

export function buildOfficialSyncPlan({ products, current = [], fetchedAt, complete = true }) {
  const observed = new Map(
    (products ?? [])
      .map((product) => normalizeOfficialProduct(product, fetchedAt))
      .filter(Boolean)
      .map((product) => [product.sourceId, product]),
  );
  const existing = new Map(
    (current ?? [])
      .filter((product) => product?.sourceId)
      .map((product) => [product.sourceId, product]),
  );
  const added = [];
  const updated = [];
  const discontinued = [];

  for (const [sourceId, product] of observed) {
    const before = existing.get(sourceId);
    if (!before) {
      added.push(product);
      continue;
    }
    const next = { ...product, discoveredAt: before.discoveredAt ?? fetchedAt };
    if (!equalListing(before, next)) updated.push(next);
  }
  for (const [sourceId, product] of existing) {
    if (complete && !observed.has(sourceId) && product.inStock !== false)
      discontinued.push({ ...product, inStock: false, verifiedAt: fetchedAt });
  }
  return { added, updated, discontinued };
}

export function catalogForCache({ products, current = [], fetchedAt, complete = true }) {
  const observed = (products ?? [])
    .map((product) => normalizeOfficialProduct(product, fetchedAt))
    .filter(Boolean);
  if (complete) return observed;
  const merged = new Map(
    (current ?? [])
      .filter((product) => product?.sourceId)
      .map((product) => [product.sourceId, product]),
  );
  for (const product of observed) {
    const previous = merged.get(product.sourceId);
    merged.set(product.sourceId, { ...product, discoveredAt: previous?.discoveredAt ?? fetchedAt });
  }
  return [...merged.values()];
}

export function outputForFetch(fetched, { current, fetchedAt, pendingPlan = null }) {
  return fetched.notModified
    ? { ...fetched, plan: pendingPlan }
    : {
        ...fetched,
        plan: buildOfficialSyncPlan({
          products: fetched.products,
          current,
          fetchedAt,
          complete: fetched.complete,
        }),
      };
}

async function jsonFrom(path, fallback) {
  if (!path) return fallback;
  try {
    return JSON.parse(await readFile(resolve(path), 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function currentFrom(path, fallback) {
  if (!path) return fallback;
  if (path.endsWith('.mjs')) {
    const catalog = (await import(pathToFileURL(resolve(path)).href)).default;
    if (!Array.isArray(catalog)) throw new Error('current catalog module must export an array');
    return catalog;
  }
  return jsonFrom(path, fallback);
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a path`);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const outputPath = option(args, '--write-plan');
  const cachePath = option(args, '--cache');
  if (!args.includes('--detect') || !outputPath)
    throw new Error(
      'usage: sync-official.mjs --detect --write-plan <plan.json> [--current current.json]',
    );
  const currentPath = option(args, '--current');
  const cache = await jsonFrom(cachePath, {});
  if (!cache || Array.isArray(cache) || typeof cache !== 'object')
    throw new Error('cache input must be an object');
  const current = await currentFrom(currentPath, currentPath ? [] : (cache.catalog ?? []));
  if (!Array.isArray(current)) throw new Error('current catalog input must be an array');
  const cacheHeaders = cache.headers ?? cache;
  const fetched = await fetchOfficialProducts({ cache, cacheHeaders });
  const fetchedAt = new Date().toISOString();
  const output = outputForFetch(fetched, { current, fetchedAt, pendingPlan: cache.plan ?? null });
  const target = resolve(outputPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  if (cachePath) {
    const cacheTarget = resolve(cachePath);
    await mkdir(dirname(cacheTarget), { recursive: true });
    const catalog = fetched.notModified
      ? current
      : catalogForCache({
          products: fetched.products,
          current,
          fetchedAt,
          complete: fetched.complete,
        });
    await writeFile(
      cacheTarget,
      `${JSON.stringify(
        { headers: fetched.cacheHeaders, pages: fetched.cache.pages, catalog, plan: output.plan },
        null,
        2,
      )}\n`,
      'utf8',
    );
  }
  console.log(
    JSON.stringify({
      products: fetched.products.length,
      notModified: fetched.notModified,
      added: output.plan?.added.length ?? 0,
      updated: output.plan?.updated.length ?? 0,
      discontinued: output.plan?.discontinued.length ?? 0,
    }),
  );
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`merch-official-sync: ${error.message}`);
    process.exitCode = 1;
  });
}
