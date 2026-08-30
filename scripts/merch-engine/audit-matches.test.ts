import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  auditCacheKey,
  authoringRequestFor,
  detectAuditQueue,
  tierForScore,
} from './audit-matches.mjs';

describe('E3 match auditor thresholds', () => {
  it.each([
    [90, 'exact'],
    [70, 'close'],
    [45, 'similar'],
    [25, 'inspired'],
    [24, 'mismatch'],
  ] as const)('maps score %i to %s', (score, tier) => {
    expect(tierForScore(score)).toBe(tier);
  });

  it('marks records without a comparable pair as unscored without a matchScore', () => {
    const plan = detectAuditQueue({
      records: [
        { productId: 'beauty', productImageUrl: null, hasRealPrimaryImage: true },
        { productId: 'era-art', productImageUrl: 'https://images.example/product.jpg', hasRealPrimaryImage: false },
      ],
      cache: {},
    });

    expect(plan.queue).toEqual([]);
    expect(plan.unscored).toEqual([
      { productId: 'beauty', matchTier: 'unscored' },
      { productId: 'era-art', matchTier: 'unscored' },
    ]);
    expect(plan.unscored.every((record) => !('matchScore' in record))).toBe(true);
  });

  it('queues a real-photo listing without an image for judged og:image discovery', () => {
    const plan = detectAuditQueue({
      records: [{
        productId: 'listing-image-discovery',
        productUrl: 'https://shop.example/products/dress',
        productImageUrl: null,
        momentImageUrl: 'https://images.example/moment.jpg',
        hasRealPrimaryImage: true,
      }],
      cache: {},
    });

    expect(plan.queue).toEqual([{
      productId: 'listing-image-discovery',
      productUrl: 'https://shop.example/products/dress',
      productImageUrl: null,
      momentImageUrl: 'https://images.example/moment.jpg',
      cacheKey: null,
    }]);
    expect(plan.unscored).toEqual([]);
  });

  it('retains an image-less listing after the judged lane writes its tier', () => {
    const plan = detectAuditQueue({
      records: [{
        productId: 'already-judged-listing',
        productUrl: 'https://shop.example/products/dress',
        productImageUrl: null,
        momentImageUrl: 'https://images.example/moment.jpg',
        hasRealPrimaryImage: true,
        matchTier: 'mismatch',
      }],
      cache: {},
    });

    expect(plan.queue).toEqual([]);
    expect(plan.reused).toEqual([{ productId: 'already-judged-listing', cacheKey: null }]);
  });

  it('queues an image-less listing again when a product image later appears', () => {
    const plan = detectAuditQueue({
      records: [{
        productId: 'listing-with-new-image',
        productUrl: 'https://shop.example/products/dress',
        productImageUrl: 'https://images.example/product.jpg',
        momentImageUrl: 'https://images.example/moment.jpg',
        hasRealPrimaryImage: true,
        matchTier: 'close',
      }],
      cache: {},
    });

    expect(plan.queue.map((entry) => entry.productId)).toEqual(['listing-with-new-image']);
    expect(plan.reused).toEqual([]);
  });
});

describe('E3 cache and source eligibility', () => {
  it('reuses a content-hash cache entry instead of re-queueing the pair', () => {
    const record = {
      productId: 'dress',
      productImageUrl: 'https://images.example/product.jpg',
      productImageHash: 'product-bytes-hash',
      momentImageUrl: 'https://images.example/moment.jpg',
      momentImageHash: 'moment-bytes-hash',
      hasRealPrimaryImage: true,
      matchTier: 'exact',
    };
    const key = auditCacheKey(record);
    const plan = detectAuditQueue({
      records: [record],
      cache: { [key]: { matchTier: 'exact', matchScore: 91 } },
    });

    expect(plan.queue).toEqual([]);
    expect(plan.reused).toEqual([{ productId: 'dress', cacheKey: key }]);
  });

  it('requeues a cached pair when the product matchTier is missing', () => {
    const record = {
      productId: 'ungraded-dress',
      productImageUrl: 'https://images.example/product.jpg',
      momentImageUrl: 'https://images.example/moment.jpg',
      hasRealPrimaryImage: true,
    };
    const key = auditCacheKey(record);
    const plan = detectAuditQueue({
      records: [record],
      cache: { [key]: { matchTier: 'exact', matchScore: 91 } },
    });

    expect(plan.reused).toEqual([]);
    expect(plan.queue.map((entry) => entry.productId)).toEqual(['ungraded-dress']);
  });

  it('only queues a source moment with hasRealPrimaryImage()', () => {
    const plan = detectAuditQueue({
      records: [
        {
          productId: 'real-photo',
          productImageUrl: 'https://images.example/product.jpg',
          momentImageUrl: 'https://images.example/moment.jpg',
          hasRealPrimaryImage: true,
        },
        {
          productId: 'era-art',
          productImageUrl: 'https://images.example/product.jpg',
          momentImageUrl: '/eras/1989.png',
          hasRealPrimaryImage: false,
        },
      ],
      cache: {},
    });

    expect(plan.queue.map((entry) => entry.productId)).toEqual(['real-photo']);
    expect(plan.unscored).toEqual([{ productId: 'era-art', matchTier: 'unscored' }]);
  });
});

describe('R1 lane separation', () => {
  it('emits data-only authoring requests and never invokes a scorer from detection', () => {
    const plan = detectAuditQueue({
      records: [{ productId: 'dress', productImageUrl: 'https://images.example/product.jpg', momentImageUrl: 'https://images.example/moment.jpg', hasRealPrimaryImage: true }],
      cache: {},
    });

    expect(plan.queue).toHaveLength(1);
    expect(authoringRequestFor(plan)).toEqual({
      lane: 'merch-audit-authoring',
      queue: plan.queue,
      unscored: [],
    });
  });

  it('keeps the scheduled workflow in the detector lane', () => {
    const workflow = readFileSync('.github/workflows/merch-audit-detect.yml', 'utf8');
    expect(workflow).toContain('audit-matches.mjs --detect');
    expect(workflow).toContain('merch-audit-authoring');
    expect(workflow).toContain('push:');
    expect(workflow).toContain('apps/web/lib/longlive/content.ts');
    expect(workflow).not.toMatch(/(ask-|openai|anthropic|gemini|vision)/i);
  });
});

describe('fixture-only dry run', () => {
  it('writes a queue artifact without changing seed files', () => {
    const root = process.cwd();
    const fixtureDir = mkdtempSync(join(tmpdir(), 'merch-audit-'));
    const fixturePath = join(fixtureDir, 'fixture.json');
    const queuePath = join(fixtureDir, 'queue.json');
    const seedBefore = execFileSync('git', ['diff', '--', 'supabase/seed'], { cwd: root, encoding: 'utf8' });
    writeFileSync(fixturePath, JSON.stringify({ records: [
      { productId: 'fixture-product', productImageUrl: 'https://images.example/product.jpg', momentImageUrl: 'https://images.example/moment.jpg', hasRealPrimaryImage: true },
    ] }));

    try {
      execFileSync('npx', ['tsx', 'scripts/merch-engine/audit-matches.mjs', '--detect', '--fixture', fixturePath, '--write-queue', queuePath], { cwd: root, encoding: 'utf8' });
      expect(JSON.parse(readFileSync(queuePath, 'utf8')).queue).toHaveLength(1);
      expect(execFileSync('git', ['diff', '--', 'supabase/seed'], { cwd: root, encoding: 'utf8' })).toBe(seedBefore);
    } finally {
      rmSync(fixtureDir, { recursive: true, force: true });
    }
  });
});
