#!/usr/bin/env node
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { momentIds } from '../lib/moment-ids.mjs';
import { serviceClient } from '../lib/supabase.mjs';

export const DEFAULT_LOOK_CAP = 3;
export const DEFAULT_PAID_SEARCH_CAP = 5;
export const PRODUCT_FRESH_DAYS = 7;

const realMomentImage = (item) => item?.moment?.photos?.find((photo) => photo?.url)?.url ?? null;
const dated = (item) => Date.UTC(item.year ?? 0, (item.month ?? 1) - 1, item.day ?? 1);

export function needsProductRefresh(item, now = new Date()) {
  const products = item?.moment?.products;
  if (!Array.isArray(products) || products.length === 0) return true;
  const cutoff = now.getTime() - PRODUCT_FRESH_DAYS * 86_400_000;
  return products.some((product) => {
    const verified = Date.parse(product?.verifiedAt ?? '');
    return !Number.isFinite(verified) || verified < cutoff;
  });
}

export function fashionMomentInputs(corpora, { now = new Date() } = {}) {
  return corpora.flatMap(({ sourceFile, eraSlug, items = [] }) => {
    const ids = momentIds(eraSlug, items);
    return items.flatMap((item, index) => {
      const momentImageUrl = realMomentImage(item);
      if (item.category !== 'fashion' || !momentImageUrl || !needsProductRefresh(item, now)) return [];
      return [{
        source: 'fashion-moment', sourceFile, momentId: ids[index],
        moment: { id: ids[index], title: item.title, context: item.moment?.context ?? item.snippet },
        momentImageUrl, empty: !item.moment?.products?.length, occurredAt: dated(item),
      }];
    });
  });
}

export function buildMatcherInput({
  corpora, tidewatchItems = [], tidewatchClass = {}, now = new Date(),
  limit = DEFAULT_LOOK_CAP, paidSearchCap = DEFAULT_PAID_SEARCH_CAP,
}) {
  if (!Number.isInteger(limit) || limit < 1) throw new Error('look cap must be a positive integer');
  if (!Number.isInteger(paidSearchCap) || paidSearchCap < 0) throw new Error('paid-search cap must be a non-negative integer');
  const tidewatchLive = tidewatchClass.enabled === true && tidewatchClass.shadow === false;
  const fashion = fashionMomentInputs(corpora, { now });
  const tidewatch = tidewatchLive ? tidewatchItems.filter((item) => item?.moment?.id && item?.momentImageUrl) : [];
  const moments = [...fashion, ...tidewatch]
    .sort((left, right) => Number(right.empty) - Number(left.empty) || right.occurredAt - left.occurredAt)
    .slice(0, limit)
    .map((entry) => {
      const output = { ...entry };
      delete output.empty;
      delete output.occurredAt;
      return output;
    });
  return {
    moments, paidSearch: { cap: paidSearchCap },
    sources: { fashion: fashion.length, tidewatch: { enabled: tidewatchLive, used: moments.filter((row) => row.source === 'tidewatch').length } },
  };
}

export async function readTidewatchItems(client, limit = DEFAULT_LOOK_CAP) {
  if (!client) return [];
  const { data, error } = await client.from('watch_decision')
    .select('decided_at, watch_item!inner(source_ref, excerpt)')
    .eq('class', 'merch_outfit').eq('shadow', false)
    .order('decided_at', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data ?? []).flatMap((row) => {
    try {
      const source = JSON.parse(row.watch_item?.source_ref ?? 'null');
      return source?.momentImageUrl ? [{ ...source, source: 'tidewatch', occurredAt: Date.parse(row.decided_at) }] : [];
    } catch { return []; }
  });
}

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
  if (!output) throw new Error('usage: build-matcher-input.mjs --output <plan.json> [--limit 3] [--paid-search-cap 5]');
  const config = JSON.parse(await readFile('config/tidewatch.json', 'utf8'));
  const tidewatchClass = config.classes?.merch_outfit ?? {};
  const client = tidewatchClass.enabled === true && tidewatchClass.shadow === false ? serviceClient() : null;
  const input = buildMatcherInput({
    corpora: await loadCorpora('supabase/seed/content'), tidewatchClass,
    tidewatchItems: await readTidewatchItems(client),
    limit: Number(value(args, '--limit', DEFAULT_LOOK_CAP)),
    paidSearchCap: Number(value(args, '--paid-search-cap', DEFAULT_PAID_SEARCH_CAP)),
  });
  await mkdir(path.dirname(path.resolve(output)), { recursive: true });
  await writeFile(output, `${JSON.stringify(input, null, 2)}\n`);
  console.log(JSON.stringify({ moments: input.moments.length, sources: input.sources }));
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { console.error(`build-matcher-input: ${error.message}`); process.exitCode = 1; });
}
