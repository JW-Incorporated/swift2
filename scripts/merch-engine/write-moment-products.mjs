#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { check as checkLink } from '../lib/link-probe.mjs';
import { auditCacheKey } from './audit-matches.mjs';
import { judgePairWithClaude, runAuthoring } from './audit-matches-authoring.mjs';
import { findMomentSpan, scanArray, stripComments } from './demotion-source-scan.mjs';
import { matchMoment, tierForMatchScore } from './match-moments.mjs';
import { readMatcherState, recordNoMatch, writeMatcherState } from './matcher-state.mjs';
import { verifyImage } from './verify-images.mjs';

const PASSING_LINKS = new Set(['ok', 'redirect']);
const TRANSIENT_LINKS = new Set(['blocked', 'unverified', 'suspect']);
const MATCH_TIERS = new Set(['exact', 'close', 'similar', 'inspired']);
const PRODUCT_KINDS = new Set([
  'dress', 'top', 'bottom', 'outerwear', 'knitwear', 'shoes', 'jewelry', 'bag', 'hat',
  'eyewear', 'beauty', 'accessory', 'music', 'collectible', 'home', 'other',
]);

export function productFromCandidate(candidate, judgment, verifiedAt) {
  const score = judgment.score;
  const retailer = new URL(candidate.productUrl).hostname.replace(/^www\./, '');
  return {
    brand: candidate.brand ?? retailer,
    item: candidate.title,
    retailer,
    url: candidate.productUrl,
    matchTier: tierForMatchScore(score),
    matchScore: score,
    kind: judgment.kind,
    imageUrl: candidate.imageUrl,
    ...(candidate.price ? { price: candidate.price } : {}),
    verifiedAt,
  };
}

export function validateProductRow(product) {
  const errors = [];
  for (const field of ['brand', 'item', 'retailer', 'url']) {
    if (!(typeof product?.[field] === 'string' && product[field].trim())) errors.push(`missing ${field}`);
  }
  let host = '';
  try {
    const url = new URL(product?.url);
    host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (url.protocol !== 'https:') errors.push('url is not https');
    if (/(^|\.)google\.[a-z.]+$/.test(url.hostname.toLowerCase())) errors.push('url resolves to Google');
  } catch { errors.push('url is invalid'); }
  if (typeof product?.retailer === 'string') {
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(product.retailer)) errors.push('retailer is not a bare hostname');
    if (host && host !== product.retailer && !host.endsWith(`.${product.retailer}`)) errors.push('retailer does not match url');
  }
  if (/\/search\b|[?&](q|query|search|keyword|searchterm)=/i.test(product?.url ?? '')) errors.push('url is a search page');
  if (!MATCH_TIERS.has(product?.matchTier)) errors.push('matchTier is invalid');
  if (!(Number.isFinite(product?.matchScore) && product.matchScore >= 0 && product.matchScore <= 100)) errors.push('matchScore is invalid');
  if (product?.kind != null && !PRODUCT_KINDS.has(product.kind)) errors.push('kind is invalid');
  if (product?.price != null && !(typeof product.price === 'string' && product.price.trim())) errors.push('price is invalid');
  if (product?.imageUrl != null && !(typeof product.imageUrl === 'string' && /^https:\/\//.test(product.imageUrl))) errors.push('imageUrl is invalid');
  if (!Number.isFinite(Date.parse(product?.verifiedAt ?? ''))) errors.push('verifiedAt is invalid');
  return errors;
}

export function selectAlternatives(momentId, candidates) {
  return matchMoment({
    moment: { id: momentId, title: momentId },
    candidates: candidates.map((candidate) => ({ ...candidate, urlVerified: true, imageVerified: true })),
  }).products;
}

export async function verifyForWrite(candidate, {
  linkCheck = (url) => checkLink(url, { product: true }), imageCheck = verifyImage,
} = {}) {
  let link;
  let image;
  try { link = await linkCheck(candidate.productUrl); } catch { return { status: 'hold', gate: 'E1' }; }
  if (TRANSIENT_LINKS.has(link?.verdict) || link?.status === 429 || link?.status >= 500) return { status: 'hold', gate: 'E1' };
  if (!PASSING_LINKS.has(link?.verdict)) return { status: 'reject', gate: 'E1' };
  try { image = await imageCheck(candidate.imageUrl); } catch { return { status: 'hold', gate: 'E2' }; }
  if (image?.verdict === 'blocked' || image?.status === 429 || image?.status >= 500) return { status: 'hold', gate: 'E2' };
  return image?.verdict === 'ok' ? { status: 'pass' } : { status: 'reject', gate: 'E2' };
}

export async function auditCandidates(match, auditImpl = runAuthoring) {
  const pairs = match.products.map((candidate) => {
    const pair = {
      productId: `${match.momentId}:${candidate.id}`,
      productUrl: candidate.productUrl,
      productImageUrl: candidate.imageUrl,
      momentImageUrl: match.momentImageUrl,
    };
    return { ...pair, cacheKey: auditCacheKey(pair) };
  });
  const artifact = await auditImpl({
    receipt: { judgments: [], detectorReceipt: { queued: pairs.length } },
    queue: { queue: pairs, demotions: [] },
    judge: (pair) => judgePairWithClaude(pair, { caller: 'merch-matcher-authoring' }),
  });
  return artifact.judgments ?? [];
}

export async function prepareMomentProducts(match, {
  auditImpl, linkCheck, imageCheck, now = new Date(),
} = {}) {
  if (match.status === 'hold') return { status: 'hold', reason: match.holdReason, products: [] };
  if (!match.products?.length) return { status: 'empty', products: [] };
  const judgments = await auditCandidates(match, auditImpl);
  if (judgments.some((row) => row.tier === 'unresolved')) return { status: 'hold', reason: 'E3 unresolved', products: [] };
  const byId = new Map(judgments.map((row) => [row.productId, row]));
  const audited = match.products.flatMap((candidate) => {
    const judgment = byId.get(`${match.momentId}:${candidate.id}`);
    return judgment && judgment.score >= 45 ? [{ ...candidate, score: judgment.score, audit: judgment }] : [];
  });
  const selected = selectAlternatives(match.momentId, audited);
  const passed = [];
  for (const candidate of selected) {
    const verification = await verifyForWrite(candidate, { linkCheck, imageCheck });
    if (verification.status === 'hold') return { status: 'hold', reason: `${verification.gate} transient`, products: [] };
    if (verification.status === 'pass') passed.push(candidate);
  }
  const final = selectAlternatives(match.momentId, passed);
  const products = [];
  let rowErrors = 0;
  for (const candidate of final) {
    try {
      const product = productFromCandidate(candidate, candidate.audit, now.toISOString());
      const errors = validateProductRow(product);
      if (errors.length) throw new Error(errors.join(', '));
      products.push(product);
    } catch (error) {
      rowErrors += 1;
      console.warn(`write-moment-products: dropped ${match.momentId}:${candidate.id ?? 'unknown'}: ${error.message}`);
    }
  }
  if (!products.length && rowErrors) throw new Error(`all ${rowErrors} product rows for ${match.momentId} were invalid`);
  return {
    status: products.length ? 'ready' : 'empty',
    products,
  };
}

function closingBrace(source, open) {
  let depth = 0;
  let quote = null;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (char === '\\') index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') quote = char;
    else if (char === '{') depth += 1;
    else if (char === '}' && --depth === 0) return index;
  }
  return -1;
}

function renderedProducts(products, indent) {
  const json = JSON.stringify(products, null, 2).split('\n');
  const body = json.map((line, index) => index === 0 ? line : `${' '.repeat(indent)}${line}`).join('\n');
  return `products: ${body}`;
}

export function writeProductsToSource(source, momentId, products) {
  const item = findMomentSpan(source, momentId);
  if (!item) throw new Error(`moment ${momentId} not found in source file`);
  const text = source.slice(item.start, item.end);
  const marker = /\bmoment\s*:\s*\{/.exec(text);
  if (!marker) throw new Error(`moment ${momentId} has no detail object`);
  const momentOpen = item.start + marker.index + marker[0].lastIndexOf('{');
  const momentClose = closingBrace(source, momentOpen);
  const momentText = source.slice(momentOpen, momentClose + 1);
  const existing = /(^|\n|[,{])([ \t]*)products\s*:\s*\[/m.exec(momentText);
  if (existing) {
    const fieldStart = momentOpen + existing.index + existing[1].length + existing[2].length;
    const arrayStart = momentOpen + existing.index + existing[0].lastIndexOf('[');
    const scanned = scanArray(source, arrayStart);
    const content = stripComments(source.slice(arrayStart + 1, scanned.end - 1)).replaceAll(',', '').trim();
    if (content) throw new Error(`moment ${momentId} already has products`);
    const arrayEnd = scanned.end;
    return `${source.slice(0, fieldStart)}${renderedProducts(products, existing[2].length)}${source.slice(arrayEnd)}`;
  }
  const lineStart = source.lastIndexOf('\n', momentClose) + 1;
  const closeIndent = momentClose - lineStart;
  const indent = closeIndent + 2;
  const insertion = `${' '.repeat(indent)}${renderedProducts(products, indent)},\n`;
  return `${source.slice(0, lineStart)}${insertion}${source.slice(lineStart)}`;
}

function value(args, name) {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1];
}

export async function main(args = process.argv.slice(2), deps = {}) {
  const planPath = value(args, '--plan');
  if (!planPath) throw new Error('usage: write-moment-products.mjs --plan <matcher-result.json>');
  const plan = JSON.parse(await readFile(planPath, 'utf8'));
  const statePath = value(args, '--state');
  let state = await readMatcherState(statePath);
  const now = deps.now ?? new Date();
  const summaries = [];
  for (const match of plan.matches ?? []) {
    const prepared = await prepareMomentProducts(match, { ...deps, now });
    summaries.push({ momentId: match.momentId, status: prepared.status, count: prepared.products.length });
    if (prepared.status === 'empty' && match.ticket?.reason !== 'paid-search-cap-reached') {
      state = recordNoMatch(state, match.momentId, now);
    }
    if (prepared.status !== 'ready') continue;
    const source = await readFile(match.sourceFile, 'utf8');
    await writeFile(match.sourceFile, writeProductsToSource(source, match.momentId, prepared.products));
  }
  await writeMatcherState(statePath, state, now);
  console.log(JSON.stringify({ moments: summaries }));
  return summaries;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { console.error(`write-moment-products: ${error.message}`); process.exitCode = 1; });
}
