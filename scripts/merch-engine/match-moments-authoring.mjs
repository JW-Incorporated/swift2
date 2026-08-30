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
import { verifyImage } from './verify-images.mjs';

const SEARCH_API_ENDPOINT = 'https://serpapi.com/search.json';

function descriptorTerms(descriptors) {
  return [descriptors?.brand, descriptors?.kind, descriptors?.color, descriptors?.pattern, descriptors?.silhouette]
    .filter((term) => typeof term === 'string' && term.trim());
}

/** Deterministic, no-new-infra hostname guess for a named designer/brand. */
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
  if (!result || typeof result !== 'object') return {};
  const { kind, color, pattern, silhouette, brand } = result;
  return { kind, color, pattern, silhouette, brand };
}

/** Search step (b): the maker's own product pages, free, only when named. */
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
  return (body.shopping_results ?? []).map((result) => ({
    id: result.product_id ?? result.link,
    source,
    title: result.title,
    price: result.price,
    imageUrl: result.thumbnail,
    productUrl: result.product_link ?? result.link,
  }));
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
  if (awin.length === 0 && descriptors?.brand) {
    brandDirect = await brandDirectSearch({ descriptors, apiKey: searchApiKey, fetchImpl });
  }
  let paidSearchTicket = null;
  let paid = [];
  if (awin.length === 0 && brandDirect.length === 0) {
    const plan = planPaidSearch({ moment, callsUsed, cap });
    if (plan.allowed) {
      paid = await paidSearchImpl({ descriptors, apiKey: searchApiKey, fetchImpl });
    } else {
      paidSearchTicket = plan.ticket;
    }
  }
  return { candidates: [...awin, ...brandDirect, ...paid], paidSearchTicket };
}

async function defaultVerifyUrl(url, { fetchImpl = fetch } = {}) {
  if (!url) return false;
  try {
    const response = await fetchImpl(url, { method: 'HEAD', redirect: 'follow' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Step 3 (SPEC §8): scores every candidate from every source together
 * against the moment photo, and applies the E1/E2 pre-merge verification
 * gates a matched candidate must clear before `matchMoment` (R1/R6,
 * unchanged) can select it.
 */
export async function verifyAndScoreCandidates(candidates, { momentImageUrl, judge, verifyUrlImpl = defaultVerifyUrl, verifyImageImpl = verifyImage, fetchImpl = fetch }) {
  const scored = [];
  for (const candidate of candidates) {
    const urlVerified = await verifyUrlImpl(candidate.productUrl, { fetchImpl });
    const imageVerified = candidate.imageUrl
      ? (await verifyImageImpl(candidate.imageUrl, { fetchImpl })).verdict === 'ok'
      : false;
    if (!urlVerified || !imageVerified) continue; // R2: an unverified candidate is never authored
    const judgment = await judge({ candidate, momentImageUrl });
    if (!Number.isFinite(judgment?.score)) continue;
    scored.push({ ...candidate, urlVerified, imageVerified, score: judgment.score });
  }
  return scored;
}

/**
 * Full E6 pipeline (SPEC §8 steps 1–3). Step 4 (author) and step 5
 * (no-candidate ticket handling) reuse the existing content lane and
 * `matchMoment`/`buildReSourceTicket` (match-moments.mjs) unchanged.
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
  verifyUrlImpl,
  verifyImageImpl,
  fetchImpl,
  callsUsed = 0,
  cap = 0,
}) {
  const descriptors = await extractDescriptors({ moment, momentImageUrl, extractImpl });
  const { candidates, paidSearchTicket } = await gatherCandidates({
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
  const verified = await verifyAndScoreCandidates(candidates, { momentImageUrl, judge, verifyUrlImpl, verifyImageImpl, fetchImpl });
  const match = matchMoment({ moment, candidates: verified });
  const ticket = match.products.length === 0 ? (paidSearchTicket ?? match.ticket) : null;
  return { ...match, ticket, descriptors };
}

async function judgeWithClaude({ candidate, momentImageUrl }, { apiKey, fetchImpl = fetch }) {
  const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 256,
      thinking: { type: 'disabled' },
      tools: [{
        name: 'record_match_score',
        description: 'Record the visual match score of a retailer candidate against the moment photo.',
        input_schema: { type: 'object', additionalProperties: false, properties: { score: { type: 'number', minimum: 0, maximum: 100 } }, required: ['score'] },
      }],
      tool_choice: { type: 'tool', name: 'record_match_score' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Candidate image: ${candidate.imageUrl}` },
          { type: 'text', text: `Moment image: ${momentImageUrl}` },
          { type: 'text', text: 'Score visual match from 0 to 100 using silhouette, color/pattern, garment type, and notable details.' },
        ],
      }],
    }),
  });
  if (!response.ok) throw new Error(`anthropic vision request failed (${response.status})`);
  const body = await response.json();
  const toolUse = (body?.content ?? []).find((block) => block?.type === 'tool_use' && block.name === 'record_match_score');
  return toolUse?.input ?? null;
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
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) throw new Error('ANTHROPIC_API_KEY is required for E6 vision scoring');
  const searchApiKey = process.env.SEARCH_API_KEY;
  const cap = Number.isInteger(input.paidSearch?.cap) ? input.paidSearch.cap : 0;

  const results = [];
  for (const entry of input.moments) {
    const callsUsed = results.reduce((total, result) => total + (result.usedPaidSearch ? 1 : 0), 0);
    const result = await runMatcherAuthoring({
      moment: entry.moment,
      momentImageUrl: entry.momentImageUrl,
      extractImpl: (payload) => extractDescriptorsWithClaude(payload, { apiKey: anthropicKey }),
      indexPath,
      searchApiKey,
      judge: (payload) => judgeWithClaude(payload, { apiKey: anthropicKey }),
      callsUsed,
      cap,
    });
    results.push(result);
  }
  const tickets = results.flatMap((result) => (result.ticket ? [result.ticket] : []));
  const output = { matches: results, tickets, authoring: { lane: 'merch-re-source-authoring', queue: tickets } };
  const target = resolve(outputPath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ moments: results.length, products: results.reduce((total, result) => total + result.products.length, 0), tickets: tickets.length }));
}

async function extractDescriptorsWithClaude({ moment, momentImageUrl }, { apiKey, fetchImpl = fetch }) {
  const response = await fetchImpl('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-5',
      max_tokens: 256,
      thinking: { type: 'disabled' },
      tools: [{
        name: 'record_descriptors',
        description: 'Record per-garment descriptors extracted from a fashion moment.',
        input_schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            kind: { type: 'string' },
            color: { type: 'string' },
            pattern: { type: 'string' },
            silhouette: { type: 'string' },
            brand: { type: 'string' },
          },
        },
      }],
      tool_choice: { type: 'tool', name: 'record_descriptors' },
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `Moment: ${moment?.title ?? moment?.id}` },
          { type: 'text', text: `Photo: ${momentImageUrl}` },
          { type: 'text', text: 'Extract kind, color, pattern, silhouette, and named brand/designer if stated. Do not infer a brand that is not named.' },
        ],
      }],
    }),
  });
  if (!response.ok) throw new Error(`anthropic descriptor request failed (${response.status})`);
  const body = await response.json();
  const toolUse = (body?.content ?? []).find((block) => block?.type === 'tool_use' && block.name === 'record_descriptors');
  return toolUse?.input ?? {};
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`merch-matcher-authoring: ${error.message}`);
    process.exitCode = 1;
  });
}
