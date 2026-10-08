#!/usr/bin/env node
// Produces an artifact receipt only. It never evaluates D3/E1/E2 or writes catalog data.

import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

function value(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function listingId(listing) {
  const id = listing?.listing_id;
  return Number.isInteger(id) && id > 0 ? String(id) : null;
}

function rawImages(detail) {
  return Array.isArray(detail?.images)
    ? detail.images.filter((image) => image && typeof image === 'object')
    : [];
}

function rawShop(detail) {
  return detail?.shop && typeof detail.shop === 'object' && !Array.isArray(detail.shop)
    ? detail.shop
    : null;
}

export function collectListingIds(searchPayloads) {
  return [
    ...new Set(
      searchPayloads.flatMap((payload) =>
        (Array.isArray(payload?.results) ? payload.results : []).map(listingId).filter(Boolean),
      ),
    ),
  ].sort((left, right) => Number(left) - Number(right));
}

export function buildE5CandidateReceipt({ searchPayloads, listingDetailsById }) {
  const candidates = [];
  for (const id of collectListingIds(searchPayloads)) {
    const detail = listingDetailsById.get(id);
    const shop = rawShop(detail);
    const images = rawImages(detail);
    if (listingId(detail) !== id || !shop || images.length === 0) continue;
    candidates.push({
      listingId: id,
      title: value(detail.title),
      listingUrl: value(detail.url),
      evidence: {
        e1ListingSource: `raw/listings/${id}.json`,
        e2ImageSource: `raw/listings/${id}.json`,
        shopSource: `raw/listings/${id}.json`,
        imageCount: images.length,
        shopId: shop.shop_id ?? null,
      },
    });
  }
  return { candidates };
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function receiptFromRawDirectory(rawDirectory) {
  const queryFiles = (await readdir(rawDirectory))
    .filter((file) => /^query-\d+\.json$/.test(file))
    .sort((left, right) => left.localeCompare(right));
  const searchPayloads = await Promise.all(
    queryFiles.map((file) => readJson(path.join(rawDirectory, file))),
  );
  const listingDirectory = path.join(rawDirectory, 'listings');
  const listingFiles = (await readdir(listingDirectory))
    .filter((file) => /^\d+\.json$/.test(file))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const listingDetailsById = new Map(
    await Promise.all(
      listingFiles.map(async (file) => [
        file.slice(0, -'.json'.length),
        await readJson(path.join(listingDirectory, file)),
      ]),
    ),
  );
  return buildE5CandidateReceipt({ searchPayloads, listingDetailsById });
}

async function main() {
  const [command, ...paths] = process.argv.slice(2);
  if (command === 'listing-ids') {
    const searchPayloads = await Promise.all(paths.map(readJson));
    const ids = collectListingIds(searchPayloads);
    process.stdout.write(ids.length ? `${ids.join('\n')}\n` : '');
    return;
  }
  if (command === 'receipt' && paths.length === 1) {
    process.stdout.write(`${JSON.stringify(await receiptFromRawDirectory(paths[0]), null, 2)}\n`);
    return;
  }
  throw new Error(
    'Usage: e5-evidence-artifact.mjs listing-ids <query-files...> | receipt <raw-directory>',
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
