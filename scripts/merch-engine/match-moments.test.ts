import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  buildMatcherPlan,
  buildReSourceTicket,
  matchMoment,
  planPaidSearch,
  priceBandFor,
  reSourceAuthoringRequestFor,
  searchPlanFor,
} from './match-moments.mjs';

const moment = { id: 'midnights-grammys', title: 'Grammys look' };
const verified = { urlVerified: true, imageVerified: true };

describe('moment-to-product matcher', () => {
  it('never lets an Awin candidate override a higher match tier', () => {
    const result = matchMoment({
      moment,
      candidates: [
        { ...verified, id: 'direct-exact', source: 'brand-direct', score: 92 },
        { ...verified, id: 'awin-close', source: 'awin-index', score: 82 },
      ],
    });

    expect(result.products.map((product) => product.id)).toEqual(['direct-exact']);
  });

  it('prefers Awin candidates only as an equal-tier tie-breaker', () => {
    const result = matchMoment({
      moment,
      candidates: [
        { ...verified, id: 'direct-close', source: 'brand-direct', score: 73, price: '$200' },
        { ...verified, id: 'awin-close', source: 'awin-index', score: 72, price: '$25' },
      ],
    });

    expect(result.products.map((product) => product.id)).toEqual(['awin-close', 'direct-close']);
  });

  it('retains direct lower-tier alternatives from distinct price bands without admitting lower-tier Awin', () => {
    const result = matchMoment({
      moment,
      candidates: [
        { ...verified, id: 'direct-exact', source: 'brand-direct', score: 92, price: '$300' },
        { ...verified, id: 'direct-close-under', source: 'brand-direct', score: 75, price: '$30' },
        { ...verified, id: 'direct-close-same-band', source: 'brand-direct', score: 73, price: '$25' },
        { ...verified, id: 'direct-similar-mid', source: 'brand-direct', score: 50, price: '$100' },
        { ...verified, id: 'awin-close', source: 'awin-index', score: 82, price: '$90' },
      ],
    });

    expect(result.products.map((product) => product.id)).toEqual([
      'direct-exact',
      'direct-close-under',
      'direct-similar-mid',
    ]);
  });

  it('mirrors the existing merch price-band boundaries', () => {
    expect(priceBandFor('$49.99')).toBe('under50');
    expect(priceBandFor('$50')).toBe('50to200');
    expect(priceBandFor('$200')).toBe('50to200');
    expect(priceBandFor('$200.01')).toBe('200plus');
    expect(priceBandFor(undefined)).toBeUndefined();
  });

  it('files a cap ticket before paid search spending', () => {
    expect(planPaidSearch({ moment, callsUsed: 3, cap: 3 })).toEqual({
      allowed: false,
      ticket: buildReSourceTicket(moment, 'paid-search-cap-reached'),
    });
  });

  it('uses E0, brand-direct, then paid search in cost order', () => {
    expect(searchPlanFor({ moment, callsUsed: 0, cap: 1 })).toEqual({
      sources: ['awin-index', 'brand-direct', 'paid-search'],
      paidSearch: { allowed: true, ticket: null },
    });
  });

  it('authors no product and files a retry ticket when no candidate clears similar', () => {
    const result = matchMoment({
      moment,
      candidates: [{ ...verified, id: 'weak', source: 'awin-index', score: 44 }],
    });

    expect(result.products).toEqual([]);
    expect(result.ticket).toEqual(buildReSourceTicket(moment, 'no-qualifying-candidate'));
  });

  it('emits no-candidate tickets through the bounded re-source authoring interface', () => {
    const ticket = buildReSourceTicket(moment, 'no-qualifying-candidate');

    expect(reSourceAuthoringRequestFor([ticket])).toEqual({
      lane: 'merch-re-source-authoring',
      queue: [ticket],
    });
  });

  it('includes a cap-reached ticket in the generated authoring handoff', () => {
    const plan = buildMatcherPlan({
      moments: [{ moment, candidates: [] }],
      paidSearch: { callsUsed: 1, cap: 1 },
    });

    expect(plan.authoring.queue).toContainEqual(buildReSourceTicket(moment, 'paid-search-cap-reached'));
  });

  it('keeps the staged workflow dispatch-only and records the canonical price-band rules', () => {
    const workflow = readFileSync('.github/workflows/merch-matcher.yml', 'utf8');
    const filters = readFileSync('apps/web/lib/longlive/merch-filters.ts', 'utf8');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).not.toContain('\n  push:');
    expect(filters).toContain("price.replace(/[^0-9.]/g, '')");
    expect(filters).toContain("if (price < 50) return 'under50'");
    expect(filters).toContain("if (price <= 200) return '50to200'");
  });

  it('rejects candidates that have not passed E1 and E2 verification', () => {
    const result = matchMoment({
      moment,
      candidates: [
        { ...verified, id: 'verified', source: 'brand-direct', score: 70 },
        { id: 'unverified-url', source: 'awin-index', score: 95, imageVerified: true },
        { id: 'unverified-image', source: 'awin-index', score: 95, urlVerified: true },
      ],
    });

    expect(result.products.map((product) => product.id)).toEqual(['verified']);
  });
});
