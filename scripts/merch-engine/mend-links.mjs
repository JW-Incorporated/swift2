#!/usr/bin/env node
// E1 Merch Mender: converts deterministic liveness receipts into a bounded
// authoring plan. It never substitutes a product or edits seed content.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const DEAD = new Set(['dead', 'soft-404']);

export function planMends(records, verifiedAt) {
  if (!Array.isArray(records)) throw new Error('records must be an array');
  if (Number.isNaN(Date.parse(verifiedAt))) throw new Error('verifiedAt must be an ISO timestamp');

  const updates = new Map();
  const reSource = [];
  const retries = [];
  for (const record of records) {
    if (!record?.productId || !record.url || !record.verdict) {
      throw new Error('each record requires productId, url, and verdict');
    }
    const listing = record.listing ?? 'primary';
    const update = updates.get(record.productId) ?? { productId: record.productId, verifiedAt };
    updates.set(record.productId, update);
    if (listing === 'alternative') {
      if (DEAD.has(record.verdict)) {
        update.dropAltListing = true;
        reSource.push({ productId: record.productId, url: record.url, listing, reason: record.verdict });
      } else if (record.verdict === 'blocked') {
        retries.push({ productId: record.productId, url: record.url, listing, attempts: (record.consecutiveFailures ?? 0) + 1 });
      }
      continue;
    }
    if (DEAD.has(record.verdict)) {
      update.inStock = false;
      reSource.push({ productId: record.productId, url: record.url, listing, reason: record.verdict });
    } else if (record.verdict === 'sold-out') {
      update.inStock = false;
    } else if (record.verdict === 'ok') {
      update.inStock = true;
    } else if (record.verdict === 'blocked') {
      retries.push({ productId: record.productId, url: record.url, listing, attempts: (record.consecutiveFailures ?? 0) + 1 });
    }
  }
  return { updates: [...updates.values()], reSource, retries };
}

async function main() {
  const args = process.argv.slice(2);
  const inputAt = args.indexOf('--input');
  const outputAt = args.indexOf('--write');
  if (inputAt < 0 || outputAt < 0 || !args[inputAt + 1] || !args[outputAt + 1]) {
    throw new Error('usage: mend-links.mjs --input liveness.json --write mend-plan.json');
  }
  const input = JSON.parse(await readFile(resolve(args[inputAt + 1]), 'utf8'));
  const records = Array.isArray(input) ? input : input.results;
  const plan = planMends(records, new Date().toISOString());
  const output = resolve(args[outputAt + 1]);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(plan, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ updates: plan.updates.length, reSource: plan.reSource.length, retries: plan.retries.length }));
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`merch-mender: ${error.message}`);
    process.exitCode = 1;
  });
}
