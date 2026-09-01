import { readFileSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  auditCacheKey,
  authoringRequestFor,
  buildScoreCache,
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

  it('demotes an image-less listing already judged as a mismatch, instead of reusing it', () => {
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
    expect(plan.reused).toEqual([]);
    expect(plan.demotions).toEqual([{
      productId: 'already-judged-listing',
      url: 'https://shop.example/products/dress',
      reason: 'vision-audited-mismatch',
    }]);
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

  it('demotes a cached mismatch pair instead of re-queuing or reusing it', () => {
    const record = {
      productId: 'cached-mismatch-dress',
      productUrl: 'https://shop.example/products/dress',
      productImageUrl: 'https://images.example/product.jpg',
      momentImageUrl: 'https://images.example/moment.jpg',
      hasRealPrimaryImage: true,
    };
    const key = auditCacheKey(record);
    const plan = detectAuditQueue({
      records: [record],
      cache: {
        [key]: {
          matchTier: 'mismatch',
          matchScore: 12,
          reasons: ['wrong silhouette'],
        },
      },
    });

    expect(plan.queue).toEqual([]);
    expect(plan.reused).toEqual([]);
    expect(plan.demotions).toEqual([{
      productId: 'cached-mismatch-dress',
      url: 'https://shop.example/products/dress',
      reason: 'vision-audited-mismatch',
      auditorReasons: ['wrong silhouette'],
    }]);
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

describe('renewable score cache (#3447 P1)', () => {
  it('folds resolved judgments into a previously restored cache without losing older entries', () => {
    const previous = { 'existing-key': { matchTier: 'close', matchScore: 75 } };
    const cache = buildScoreCache(
      [
        { cacheKey: 'new-key', tier: 'exact', score: 95, kind: 'dress', reasons: ['same dress'] },
        { cacheKey: null, tier: 'exact', score: 95, kind: 'dress', reasons: ['no key, skipped'] },
        { cacheKey: 'unresolved-key', tier: 'unresolved', score: null, kind: null, reasons: ['x'] },
      ],
      previous,
    );

    expect(cache).toEqual({
      'existing-key': { matchTier: 'close', matchScore: 75 },
      'new-key': { matchTier: 'exact', matchScore: 95, kind: 'dress', reasons: ['same dress'] },
    });
  });

  it('caches mismatch judgments too, so a re-detected pair is not re-queued', () => {
    const cache = buildScoreCache([
      { cacheKey: 'mismatch-key', tier: 'mismatch', score: 10, kind: 'dress', reasons: ['wrong color'] },
    ]);

    expect(cache['mismatch-key']).toMatchObject({ matchTier: 'mismatch', matchScore: 10 });
  });
});

describe('R1 lane separation', () => {
  it('emits data-only authoring requests and never invokes a scorer from detection', () => {
    const plan = detectAuditQueue({
      records: [{ productId: 'dress', productUrl: 'https://shop.example/products/dress', productImageUrl: 'https://images.example/product.jpg', momentImageUrl: 'https://images.example/moment.jpg', hasRealPrimaryImage: true }],
      cache: {},
    });

    expect(plan.queue).toHaveLength(1);
    // #3447 P2 regression: productUrl must survive onto the queued entry
    // even when the pair already has an image — otherwise a fresh mismatch
    // judgment for this pair has no url apply-demotions.mjs can act on.
    expect(plan.queue[0].productUrl).toBe('https://shop.example/products/dress');
    expect(authoringRequestFor(plan)).toEqual({
      lane: 'merch-audit-authoring',
      queue: plan.queue,
      unscored: [],
      demotions: [],
    });
  });

  it('keeps the scheduled workflow in the detector lane', () => {
    const workflow = readFileSync('.github/workflows/merch-audit-detect.yml', 'utf8');
    expect(workflow).toContain('audit-matches.mjs --detect');
    expect(workflow).toContain('merch-audit-authoring');
    expect(workflow).toContain('push:');
    expect(workflow).toContain('apps/web/lib/longlive/content.ts');
    expect(workflow).not.toMatch(/(ask-|openai|anthropic|gemini|vision)/i);
    // Renewable save-key lifecycle (#3447 P1): the detector must restore via
    // a prefix, not a single pinned key, or a newly renewed key is invisible
    // to it.
    expect(workflow).toContain('restore-keys');
    expect(workflow).toContain('merch-audit-scores-v1-${{ github.ref_name }}-');
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
