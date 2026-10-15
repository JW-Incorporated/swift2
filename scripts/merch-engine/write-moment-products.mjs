#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { check as checkLink } from '../lib/link-probe.mjs';
import { auditCacheKey } from './audit-matches.mjs';
import { judgePairWithClaude, runAuthoring } from './audit-matches-authoring.mjs';
import { findMomentSpan, scanArray } from './demotion-source-scan.mjs';
import { matchMoment, tierForMatchScore } from './match-moments.mjs';
import { verifyImage } from './verify-images.mjs';

const PASSING_LINKS = new Set(['ok', 'redirect']);
const TRANSIENT_LINKS = new Set(['blocked', 'unverified', 'suspect']);

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
  return {
    status: final.length ? 'ready' : 'empty',
    products: final.map((candidate) => productFromCandidate(candidate, candidate.audit, now.toISOString())),
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
  const existing = /(^|\n)(\s*)products\s*:\s*\[/m.exec(momentText);
  if (existing) {
    const fieldStart = momentOpen + existing.index + existing[1].length + existing[2].length;
    const arrayStart = momentOpen + existing.index + existing[0].lastIndexOf('[');
    const arrayEnd = scanArray(source, arrayStart).end;
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
  const summaries = [];
  for (const match of plan.matches ?? []) {
    const prepared = await prepareMomentProducts(match, deps);
    summaries.push({ momentId: match.momentId, status: prepared.status, count: prepared.products.length });
    if (prepared.status !== 'ready') continue;
    const source = await readFile(match.sourceFile, 'utf8');
    await writeFile(match.sourceFile, writeProductsToSource(source, match.momentId, prepared.products));
  }
  console.log(JSON.stringify({ moments: summaries }));
  return summaries;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { console.error(`write-moment-products: ${error.message}`); process.exitCode = 1; });
}
