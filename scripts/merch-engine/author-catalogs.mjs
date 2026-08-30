#!/usr/bin/env node
// E4/E5 authoring consumes reviewed artifacts only. It never fetches, sends,
// or wraps links; callers explicitly write the resulting seed modules in a PR.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { curateCandidate } from './fanmade-discovery.mjs';

const OFFICIAL_HOST = 'store.taylorswift.com';
const AMAZON_HOSTS = new Set(['amazon.com', 'www.amazon.com']);

function text(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function directOfficialUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === OFFICIAL_HOST && url.pathname.startsWith('/products/')
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function verifiedAmazonUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && AMAZON_HOSTS.has(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function verifiedTwinUrl(verifiedAmazonTwins, sourceId) {
  return verifiedAmazonTwins instanceof Map ? verifiedAmazonTwins.get(sourceId) : null;
}

function productsFromPlan(plan) {
  if (plan?.plan && typeof plan.plan === 'object') {
    return ['added', 'updated', 'discontinued'].flatMap((key) =>
      Array.isArray(plan.plan[key]) ? plan.plan[key] : [],
    );
  }
  return Array.isArray(plan?.products) ? plan.products : [];
}

function eraFor(collectionHandles, collectionEraMap) {
  for (const handle of Array.isArray(collectionHandles) ? collectionHandles : []) {
    if (typeof collectionEraMap?.[handle] === 'string' && collectionEraMap[handle]) return collectionEraMap[handle];
  }
  return null;
}

export function authorOfficialCatalog({ plan, collectionEraMap = {}, verifiedAmazonTwins = new Map() } = {}) {
  const catalog = [];
  const rejected = [];
  for (const candidate of productsFromPlan(plan)) {
    const sourceId = text(candidate?.sourceId);
    if (candidate?.discoveredVia !== 'shopify-sync' || !text(candidate?.verifiedAt) || !sourceId) {
      rejected.push({ sourceId: sourceId ?? null, reason: 'official-verification-required' });
      continue;
    }
    const url = directOfficialUrl(candidate?.url);
    if (!url) {
      rejected.push({ sourceId, reason: 'direct-official-url-required' });
      continue;
    }
    const row = { ...candidate, retailer: OFFICIAL_HOST, url };
    delete row.collectionHandles;
    delete row.altListing;
    const eraId = eraFor(candidate.collectionHandles, collectionEraMap);
    if (eraId) row.eraId = eraId;
    const twin = candidate?.altListing;
    if (
      twin?.retailer === 'amazon.com' &&
      verifiedAmazonUrl(twin.url) &&
      verifiedTwinUrl(verifiedAmazonTwins, sourceId) === twin.url
    ) row.altListing = { retailer: 'amazon.com', url: twin.url };
    catalog.push(row);
  }
  catalog.sort((left, right) => left.sourceId.localeCompare(right.sourceId));
  return {
    catalog,
    rejected,
    summary: {
      eraAttributed: catalog.filter((row) => row.eraId).length,
      verifiedAlternate: catalog.filter((row) => row.altListing).length,
    },
    socialDraft: {
      type: 'merch-drop-draft',
      products: catalog.map(({ sourceId, item, url }) => ({ sourceId, item, url })),
    },
  };
}

export function authorFanmadeCatalog({ curation = [], verifiedAt = new Date().toISOString() } = {}) {
  const catalog = [];
  const rejected = [];
  for (const candidate of curation) {
    const result = curateCandidate(candidate, verifiedAt);
    if (!result.accepted) {
      rejected.push({ sourceId: text(candidate?.sourceId), reason: result.reason });
      continue;
    }
    catalog.push(result.seed);
  }
  catalog.sort((left, right) => left.url.localeCompare(right.url));
  return { catalog, rejected };
}

export function moduleSource(exportName, catalog) {
  if (!/^[A-Z_]+$/.test(exportName)) throw new Error('export name must be uppercase snake case');
  if (!Array.isArray(catalog)) throw new Error('catalog must be an array');
  return `export const ${exportName} = ${JSON.stringify(catalog, null, 2)};\n\nexport default ${exportName};\n`;
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(path), 'utf8'));
}

function verifiedAmazonTwinsFrom(value) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return new Map();
  return new Map(
    Object.entries(value).filter(([sourceId, url]) => text(sourceId) && verifiedAmazonUrl(url)),
  );
}

function option(args, name) {
  const index = args.indexOf(name);
  if (index < 0) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a path`);
  return value;
}

async function writeModule(path, exportName, catalog) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, moduleSource(exportName, catalog), 'utf8');
}

async function main() {
  const args = process.argv.slice(2);
  const officialPlan = option(args, '--official-plan');
  const collectionEraMapPath = option(args, '--collection-era-map');
  const verifiedAmazonTwinsPath = option(args, '--verified-amazon-twins');
  const fanmadeCuration = option(args, '--fanmade-curation');
  const officialOut = option(args, '--write-official');
  const fanmadeOut = option(args, '--write-fanmade');
  if ((officialPlan && !officialOut) || (fanmadeCuration && !fanmadeOut) || (!officialPlan && !fanmadeCuration)) {
    throw new Error('usage: author-catalogs.mjs [--official-plan plan.json --write-official official.mjs [--collection-era-map map.json] [--verified-amazon-twins twins.json]] [--fanmade-curation curation.json --write-fanmade fanmade.mjs]');
  }
  const summary = {};
  if (officialPlan) {
    const collectionEraMap = collectionEraMapPath ? await readJson(collectionEraMapPath) : {};
    const verifiedAmazonTwins = verifiedAmazonTwinsFrom(
      verifiedAmazonTwinsPath ? await readJson(verifiedAmazonTwinsPath) : {},
    );
    const result = authorOfficialCatalog({ plan: await readJson(officialPlan), collectionEraMap, verifiedAmazonTwins });
    await writeModule(officialOut, 'OFFICIAL', result.catalog);
    summary.official = {
      authored: result.catalog.length,
      rejected: result.rejected.length,
      ...result.summary,
      socialDraft: result.socialDraft,
    };
  }
  if (fanmadeCuration) {
    const artifact = await readJson(fanmadeCuration);
    const result = authorFanmadeCatalog({ curation: artifact.curation ?? artifact.candidates ?? [] });
    await writeModule(fanmadeOut, 'FAN_MADE', result.catalog);
    summary.fanmade = { authored: result.catalog.length, rejected: result.rejected.length };
  }
  console.log(JSON.stringify(summary));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`merch-catalog-authoring: ${error.message}`);
    process.exitCode = 1;
  });
}
