#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { momentIds } from '../lib/moment-ids.mjs';
import { inNoMatchCooldown, readMatcherState } from './matcher-state.mjs';

export const DEFAULT_LOOK_CAP = 3;
export const DEFAULT_PAID_SEARCH_CAP = 5;
export const DEFAULT_TIDEWATCH_QUEUE = path.join('.cache', 'tidewatch-merch-outfit.jsonl');

const realMomentImage = (item) => item?.moment?.photos?.find((photo) => photo?.url)?.url ?? null;
const dated = (item) => Date.UTC(item.year ?? 0, (item.month ?? 1) - 1, item.day ?? 1);

export function hasNoProducts(item) {
  const products = item?.moment?.products;
  return products === undefined || (Array.isArray(products) && products.length === 0);
}

export function fashionMomentInputs(corpora, { now = new Date(), state } = {}) {
  return corpora.flatMap(({ sourceFile, eraSlug, items = [] }) => {
    const ids = momentIds(eraSlug, items);
    return items.flatMap((item, index) => {
      const momentImageUrl = realMomentImage(item);
      if (item.category !== 'fashion' || !momentImageUrl || !hasNoProducts(item) || inNoMatchCooldown(ids[index], state, now)) return [];
      return [{
        source: 'fashion-moment', sourceFile, momentId: ids[index],
        moment: { id: ids[index], title: item.title, context: item.moment?.context ?? item.snippet },
        momentImageUrl, occurredAt: dated(item),
      }];
    });
  });
}

function occupiedMomentIds(corpora) {
  return new Set(corpora.flatMap(({ eraSlug, items = [] }) => {
    const ids = momentIds(eraSlug, items);
    return items.flatMap((item, index) => hasNoProducts(item) ? [] : [ids[index]]);
  }));
}

export function buildMatcherInput({
  corpora, tidewatchItems = [], tidewatchClass = {}, now = new Date(),
  limit = DEFAULT_LOOK_CAP, paidSearchCap = DEFAULT_PAID_SEARCH_CAP, state,
}) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('look cap must be a positive integer');
  if (!Number.isInteger(paidSearchCap) || paidSearchCap < 0) throw new Error('paid-search cap must be a non-negative integer');
  const tidewatchLive = tidewatchClass.enabled === true && tidewatchClass.shadow === false;
  const fashion = fashionMomentInputs(corpora, { now, state });
  const occupied = occupiedMomentIds(corpora);
  const tidewatch = tidewatchLive ? tidewatchItems.filter((item) => {
    const id = item?.moment?.id;
    return id && item?.momentImageUrl && !occupied.has(id) && !inNoMatchCooldown(id, state, now);
  }) : [];
  const moments = [...fashion, ...tidewatch]
    .sort((left, right) => right.occurredAt - left.occurredAt)
    .slice(0, limit)
    .map((entry) => {
      const output = { ...entry };
      delete output.occurredAt;
      return output;
    });
  return {
    moments, paidSearch: { cap: paidSearchCap },
    sources: { fashion: fashion.length, tidewatch: { enabled: tidewatchLive, used: moments.filter((row) => row.source === 'tidewatch').length } },
  };
}

export async function readTidewatchQueue(file = DEFAULT_TIDEWATCH_QUEUE) {
  let source;
  try {
    source = await readFile(file, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  if (!source.trim()) return [];
  return source.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
}

export const serializeMatcherInput = (input) => `${JSON.stringify(input, null, 2)}\n`;

async function loadCorpora(seedDir) {
  const files = (await readdir(seedDir)).filter((file) => file.endsWith('.mjs')).sort();
  return Promise.all(files.map(async (file) => {
    const sourceFile = path.join(seedDir, file).replaceAll('\\', '/');
    const corpus = (await import(pathToFileURL(path.resolve(sourceFile)).href)).default;
    return { sourceFile, eraSlug: corpus.eraSlug, items: corpus.items };
  }));
}

function value(args, name, fallback) {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
}

export async function main(args = process.argv.slice(2)) {
  const output = value(args, '--output');
  if (!output) throw new Error('usage: build-matcher-input.mjs --output <plan.json> [--limit 3] [--paid-search-cap 5] [--tidewatch-queue <queue.jsonl>]');
  const config = JSON.parse(await readFile('config/tidewatch.json', 'utf8'));
  const tidewatchClass = config.classes?.merch_outfit ?? {};
  const state = await readMatcherState(value(args, '--state'));
  const input = buildMatcherInput({
    corpora: await loadCorpora('supabase/seed/content'), tidewatchClass,
    tidewatchItems: await readTidewatchQueue(value(args, '--tidewatch-queue', DEFAULT_TIDEWATCH_QUEUE)),
    limit: Number(value(args, '--limit', DEFAULT_LOOK_CAP)),
    paidSearchCap: Number(value(args, '--paid-search-cap', DEFAULT_PAID_SEARCH_CAP)),
    state,
  });
  await mkdir(path.dirname(path.resolve(output)), { recursive: true });
  await writeFile(output, serializeMatcherInput(input));
  console.log(JSON.stringify({ moments: input.moments.length, sources: input.sources }));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { console.error(`build-matcher-input: ${error.message}`); process.exitCode = 1; });
}
