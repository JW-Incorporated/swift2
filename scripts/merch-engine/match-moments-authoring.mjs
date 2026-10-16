#!/usr/bin/env node
// E6 Moment→Product Matcher — the only script permitted to call the vision
// model, a retailer, or the metered paid-search API. The scheduled
// `merch-matcher.yml` handoff and `matchMoment`'s R6 tie-break selection
// logic (match-moments.mjs) are unchanged and reused as-is (SPEC §8).
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchMoment, planPaidSearch } from './match-moments.mjs';
import { searchAwinIndex } from './awin-index-search.mjs';
import { callMerchClaude, MERCH_LIGHT_MODEL, MERCH_VISION_MODEL } from './merch-claude.mjs';
export {
  defaultVerifyUrl,
  defaultVerifyUrl as verifyProductUrl,
  verifyAndScoreCandidates,
} from './match-moments-verification.mjs';
const SEARCH_API_ENDPOINT = 'https://serpapi.com/search.json';
function descriptorTerms(descriptors) {
  return [descriptors?.brand, descriptors?.kind, descriptors?.color, descriptors?.pattern, descriptors?.silhouette]
    .filter((term) => typeof term === 'string' && term.trim());
}

export function brandHostnameGuess(brand) {
  if (typeof brand !== 'string' || !brand.trim()) return null;
  const slug = brand.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return slug ? `${slug}.com` : null;
}

/**
 * Step 1: vision + text extraction of per-garment descriptors from the
 * moment's photo(s) and prose. Callers supply the actual model call; this
 * function only shapes and validates the result (SPEC §8 step 1).
 */
export async function extractDescriptors({ moment, momentImageUrl, extractImpl }) {
  if (typeof extractImpl !== 'function') throw new Error('extractImpl is required');
  const result = await extractImpl({ moment, momentImageUrl });
  if (result == null) return null;
  if (!result || typeof result !== 'object') return {};
  const { kind, color, pattern, silhouette, brand } = result;
  return { kind, color, pattern, silhouette, brand };
}

export async function searchBrandDirect({ descriptors, apiKey, fetchImpl = fetch, searchImpl } = {}) {
  const brand = descriptors?.brand;
  if (!brand) return [];
  if (typeof searchImpl === 'function') return searchImpl({ descriptors });
  const hostname = brandHostnameGuess(brand);
  if (!hostname || !apiKey) return [];
  return searchViaSerpApi({ descriptors, apiKey, fetchImpl, site: hostname, source: 'brand-direct' });
}

/** Search step (c): the metered paid API, retailer product pages only. */
export async function searchPaidSearch({ descriptors, apiKey, fetchImpl = fetch, searchImpl } = {}) {
  if (typeof searchImpl === 'function') return searchImpl({ descriptors });
  if (!apiKey) return [];
  return searchViaSerpApi({ descriptors, apiKey, fetchImpl, source: 'paid-search' });
}

async function searchViaSerpApi({ descriptors, apiKey, fetchImpl, site, source }) {
  const terms = descriptorTerms(descriptors).join(' ');
  if (!terms) return [];
  const url = new URL(SEARCH_API_ENDPOINT);
  url.searchParams.set('engine', 'google_shopping');
  url.searchParams.set('q', site ? `site:${site} ${terms}` : terms);
  url.searchParams.set('api_key', apiKey);
  const response = await fetchImpl(url.toString());
  if (!response.ok) throw new Error(`search API request failed (${response.status})`);
  const body = await response.json();
  return (body.shopping_results ?? []).flatMap((result) => {
    const productUrl = result.link ?? result.product_link;
    let host;
    try { host = new URL(productUrl).hostname.toLowerCase(); } catch { return []; }
    if (/(^|\.)google\.[a-z.]+$/.test(host)) return [];
    return [{
      id: result.product_id ?? productUrl,
      source,
      title: result.title,
      price: result.price,
      imageUrl: result.thumbnail,
      productUrl,
    }];
  });
}

/**
 * Strict cost-order search (SPEC §8 step 2): Awin index first (free,
 * structured), brand-direct second (free, only when a+b left a gap), paid
 * search last and only within the R5 cap. Every tier's output feeds the
 * same vision scoring pass — a later tier never replaces an earlier hit,
 * it only fills a gap the earlier tiers left empty.
 */
export async function gatherCandidates({
  moment,
  descriptors,
  indexPath,
  openDatabase,
  brandDirectSearch = searchBrandDirect,
  paidSearchImpl = searchPaidSearch,
  searchApiKey,
  fetchImpl,
  callsUsed = 0,
  cap = 0,
}) {
  const awin = await searchAwinIndex({ descriptors, indexPath, openDatabase });
  let brandDirect = [];
  let paidSearchCalls = 0;
  let paidSearchTicket = null;
  if (awin.length === 0 && descriptors?.brand) {
    const plan = planPaidSearch({ moment, callsUsed, cap });
    if (plan.allowed) {
      brandDirect = await brandDirectSearch({ descriptors, apiKey: searchApiKey, fetchImpl });
      paidSearchCalls += 1;
    } else {
      paidSearchTicket = plan.ticket;
    }
  }
  let paid = [];
  if (awin.length === 0 && brandDirect.length === 0 && !paidSearchTicket) {
    const plan = planPaidSearch({ moment, callsUsed: callsUsed + paidSearchCalls, cap });
    if (plan.allowed) {
      paid = await paidSearchImpl({ descriptors, apiKey: searchApiKey, fetchImpl });
      paidSearchCalls += 1;
    } else {
      paidSearchTicket = plan.ticket;
    }
  }
  return { candidates: [...awin, ...brandDirect, ...paid], paidSearchTicket, paidSearchCalls };
}

async function scoreCandidates(candidates, momentImageUrl, judge) {
  const scored = [];
  for (const candidate of candidates) {
    const judgment = await judge({ candidate, momentImageUrl });
    if (judgment == null) return { scored: [], hold: true };
    if (Number.isFinite(judgment.score)) scored.push({ ...candidate, urlVerified: true, imageVerified: true, score: judgment.score });
  }
  return { scored, hold: false };
}

/**
 * Full E6 search/scoring pipeline (SPEC §8 steps 1–3). Step 4 owns E1/E2
 * verification before any staged selection can reach seed content.
 */
export async function runMatcherAuthoring({
  moment,
  momentImageUrl,
  extractImpl,
  indexPath,
  openDatabase,
  brandDirectSearch,
  paidSearchImpl,
  searchApiKey,
  judge,
  fetchImpl,
  callsUsed = 0,
  cap = 0,
}) {
  const descriptors = await extractDescriptors({ moment, momentImageUrl, extractImpl });
  if (descriptors == null) {
    return { momentId: moment.id, products: [], ticket: null, descriptors: null, paidSearchCalls: 0, status: 'hold', holdReason: 'vision-unavailable' };
  }
  const { candidates, paidSearchTicket, paidSearchCalls } = await gatherCandidates({
    moment,
    descriptors,
    indexPath,
    openDatabase,
    brandDirectSearch,
    paidSearchImpl,
    searchApiKey,
    fetchImpl,
    callsUsed,
    cap,
  });
  const scoring = await scoreCandidates(candidates, momentImageUrl, judge);
  if (scoring.hold) {
    return { momentId: moment.id, products: [], ticket: null, descriptors, paidSearchCalls, status: 'hold', holdReason: 'vision-unavailable' };
  }
  const match = matchMoment({ moment, candidates: scoring.scored });
  const ticket = match.products.length === 0 ? (paidSearchTicket ?? match.ticket) : null;
  return { ...match, ticket, descriptors, paidSearchCalls };
}

export async function judgeWithClaude({ candidate, momentImageUrl }, options = {}) {
  return callMerchClaude({
    caller: 'merch-matcher-authoring',
    model: MERCH_VISION_MODEL,
    system: 'Judge visual product matches from only the supplied images.',
    user: 'Compare the candidate image first with the moment image second. Score visual match from 0 to 100 using silhouette, color or pattern, garment type, and notable details.',
    schema: { type: 'object', additionalProperties: false, properties: { score: { type: 'number', minimum: 0, maximum: 100 } }, required: ['score'] },
    imageUrls: [candidate.imageUrl, momentImageUrl],
    ...options,
  });
}

async function readJson(path) {
  return JSON.parse(await readFile(resolve(path), 'utf8'));
}

function argValue(args, name) {
  const at = args.indexOf(name);
  if (at === -1) return null;
  const value = args[at + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const inputPath = argValue(args, '--input');
  const outputPath = argValue(args, '--output');
  const indexPath = argValue(args, '--index') || 'awin-product-index.sqlite';
  if (!inputPath || !outputPath) {
    throw new Error('usage: match-moments-authoring.mjs --input plan.json --output result.json [--index awin-product-index.sqlite]');
  }
  const input = await readJson(inputPath);
  if (!Array.isArray(input.moments)) throw new Error('input must contain a moments array');
  const searchApiKey = process.env.SEARCH_API_KEY;
  const cap = Number.isInteger(input.paidSearch?.cap) ? input.paidSearch.cap : 0;

  const results = [];
  let paidSearchCalls = 0;
  for (const entry of input.moments) {
    const result = await runMatcherAuthoring({
      moment: entry.moment,
      momentImageUrl: entry.momentImageUrl,
      extractImpl: (payload) => extractDescriptorsWithClaude(payload),
      indexPath,
      searchApiKey,
      judge: (payload) => judgeWithClaude(payload),
      callsUsed: paidSearchCalls,
      cap,
    });
    paidSearchCalls += result.paidSearchCalls;
    results.push({
      ...result,
      source: entry.source,
      sourceFile: entry.sourceFile,
      momentImageUrl: entry.momentImageUrl,
    });
  }
  const tickets = results.flatMap((result) => (result.ticket ? [result.ticket] : []));
  const output = { matches: results, tickets, authoring: { lane: 'merch-re-source-authoring', queue: tickets } };
  const target = resolve(outputPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ moments: results.length, products: results.reduce((total, result) => total + result.products.length, 0), tickets: tickets.length }));
}

export async function extractDescriptorsWithClaude({ moment, momentImageUrl }, options = {}) {
  return callMerchClaude({
    caller: 'merch-matcher-authoring',
    model: MERCH_LIGHT_MODEL,
    system: 'Extract concise garment descriptors from the supplied image and trusted moment title.',
    user: `Moment: ${moment?.title ?? moment?.id}\nExtract kind, color, pattern, silhouette, and named brand or designer if stated. Do not infer a brand that is not named.`,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        kind: { type: 'string' }, color: { type: 'string' }, pattern: { type: 'string' },
        silhouette: { type: 'string' }, brand: { type: 'string' },
      },
    },
    imageUrls: [momentImageUrl],
    ...options,
  });
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`merch-matcher-authoring: ${error.message}`);
    process.exitCode = 1;
  });
}
