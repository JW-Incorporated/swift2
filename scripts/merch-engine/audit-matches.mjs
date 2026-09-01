#!/usr/bin/env node
// E3 Match Auditor — deterministic detection only. This file never imports or
// invokes an LLM: it creates a content-addressed queue for the separate
// merch-audit-authoring lane, which owns every judged score/write.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CACHE_VERSION = 1;

export function tierForScore(score) {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new Error(`score must be a number from 0 through 100, got ${score}`);
  }
  if (score >= 90) return 'exact';
  if (score >= 70) return 'close';
  if (score >= 45) return 'similar';
  if (score >= 25) return 'inspired';
  return 'mismatch';
}

function digest(value) {
  return createHash('sha256').update(String(value)).digest('hex');
}

function imageHash(record, side) {
  const supplied = record[`${side}ImageHash`];
  const url = record[`${side}ImageUrl`];
  // URL hashing is deliberately the stable, zero-network fallback. Callers
  // that own image bytes may provide `${side}ImageHash` to invalidate a
  // same-URL asset replacement without making this scheduled detector fetch
  // third-party CDNs (which would create unreliable, costly queue churn).
  return supplied || (url ? digest(url) : null);
}

export function auditCacheKey(record) {
  const product = imageHash(record, 'product');
  const moment = imageHash(record, 'moment');
  if (!product || !moment) return null;
  return digest(`${CACHE_VERSION}\0${product}\0${moment}`);
}

/**
 * Builds an authoring queue without judging or writing seed content. A moment
 * enters scoring only when the caller established hasRealPrimaryImage() first.
 *
 * Below-25 (`mismatch`) is never treated as a reusable, durable tier (spec
 * P2, issue #3447): a mismatch is routed to `demotions` so the authoring/
 * content lane can remove the product from the moment and file an E6
 * re-source ticket with the auditor's reasons attached, instead of silently
 * leaving a known-bad pairing in place forever.
 */
export function detectAuditQueue({ records, cache }) {
  const queue = [];
  const reused = [];
  const unscored = [];
  const demotions = [];
  for (const record of records) {
    const cacheKey = auditCacheKey(record);
    if (!record.hasRealPrimaryImage || !record.momentImageUrl) {
      unscored.push({ productId: record.productId, matchTier: 'unscored' });
      continue;
    }
    // A listing URL makes the pair comparable: the judged lane may discover
    // its og:image. It cannot be cache-keyed until that image is known, so it
    // deliberately remains queued rather than being silently marked unscored.
    if (!record.productImageUrl) {
      if (record.productUrl) {
        if (record.matchTier === 'mismatch') {
          demotions.push({
            productId: record.productId,
            url: record.productUrl,
            reason: 'vision-audited-mismatch',
          });
        } else if (['exact', 'close', 'similar', 'inspired'].includes(record.matchTier)) {
          reused.push({ productId: record.productId, cacheKey: null });
        } else {
          queue.push({
            productId: record.productId,
            productUrl: record.productUrl,
            productImageUrl: null,
            momentImageUrl: record.momentImageUrl,
            cacheKey: null,
          });
        }
      } else {
        unscored.push({ productId: record.productId, matchTier: 'unscored' });
      }
      continue;
    }
    if (!cacheKey) {
      unscored.push({ productId: record.productId, matchTier: 'unscored' });
      continue;
    }
    const cached = cache[cacheKey];
    const cacheHasScore = cached && typeof cached === 'object' &&
      ['exact', 'close', 'similar', 'inspired', 'mismatch'].includes(cached.matchTier);
    if (cacheHasScore && cached.matchTier === 'mismatch') {
      demotions.push({
        productId: record.productId,
        url: record.productUrl ?? null,
        reason: 'vision-audited-mismatch',
        ...(Array.isArray(cached.reasons) ? { auditorReasons: cached.reasons } : {}),
      });
      continue;
    }
    const productHasTier = ['exact', 'close', 'similar', 'inspired'].includes(record.matchTier);
    if (cacheHasScore && productHasTier) {
      reused.push({ productId: record.productId, cacheKey });
      continue;
    }
    queue.push({
      productId: record.productId,
      productImageUrl: record.productImageUrl,
      momentImageUrl: record.momentImageUrl,
      cacheKey,
    });
  }
  return { queue, reused, unscored, demotions };
}

/** The only handoff to the judged lane; it is data, not a score invocation. */
export function authoringRequestFor(plan) {
  return {
    lane: 'merch-audit-authoring',
    queue: plan.queue,
    unscored: plan.unscored,
    demotions: plan.demotions ?? [],
  };
}

/**
 * Renewable score cache (issue #3447 P1): folds this run's resolved
 * judgments into the previously-restored cache, keyed by `cacheKey`, so a
 * future detector run restoring the latest saved key can see newly scored
 * pairs. `mismatch` scores are cached too (so a re-detected mismatch pair
 * isn't re-queued for another paid vision call) even though `mismatch` is
 * never written into a Product's own `matchTier` (that value is stripped by
 * `productsFrom()` — a mismatch is removed, not persisted as a tier).
 */
export function buildScoreCache(judgments, previousCache = {}) {
  const cache = { ...previousCache };
  for (const judgment of Array.isArray(judgments) ? judgments : []) {
    if (!judgment?.cacheKey) continue;
    if (!['exact', 'close', 'similar', 'inspired', 'mismatch'].includes(judgment.tier)) continue;
    cache[judgment.cacheKey] = {
      matchTier: judgment.tier,
      matchScore: judgment.score,
      kind: judgment.kind,
      reasons: judgment.reasons,
    };
  }
  return cache;
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function recordsFromContent() {
  const { CONTENT } = await import('../../apps/web/lib/longlive/content.ts');
  const { hasRealPrimaryImage, primaryImageRef } = await import('../../apps/web/lib/longlive/types.ts');
  return CONTENT.flatMap((moment) => {
    const momentImageUrl = primaryImageRef(moment)?.url ?? null;
    return (moment.products ?? []).map((product, index) => ({
      productId: `${moment.id}:${index}:${product.url}`,
      productUrl: product.url,
      productImageUrl: product.imageUrl ?? null,
      momentImageUrl,
      hasRealPrimaryImage: hasRealPrimaryImage(moment),
      matchTier: product.matchTier,
    }));
  });
}

function argValue(args, name) {
  const at = args.indexOf(name);
  if (at === -1) return null;
  const value = args[at + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a path`);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  if (!args.includes('--detect')) {
    throw new Error('usage: audit-matches.mjs --detect [--fixture file.json] [--cache file.json] [--write-queue file.json]');
  }
  const fixturePath = argValue(args, '--fixture');
  const cachePath = argValue(args, '--cache');
  const queuePath = argValue(args, '--write-queue');
  const input = fixturePath ? await readJson(resolve(fixturePath), {}) : { records: await recordsFromContent() };
  if (!Array.isArray(input.records)) throw new Error('input must contain a records array');
  const cache = cachePath ? await readJson(resolve(cachePath), {}) : {};
  if (!cache || Array.isArray(cache) || typeof cache !== 'object') throw new Error('cache must be an object keyed by audit cache key');

  const plan = detectAuditQueue({ records: input.records, cache });
  const output = { ...plan, authoring: authoringRequestFor(plan) };
  if (queuePath) {
    const target = resolve(queuePath);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  }
  console.log(JSON.stringify({ records: input.records.length, queued: plan.queue.length, reused: plan.reused.length, unscored: plan.unscored.length }));
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`merch-audit-detect: ${error.message}`);
    process.exitCode = 1;
  });
}
