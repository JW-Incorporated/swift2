import { describe, expect, it, vi } from 'vitest';

import {
  brandHostnameGuess,
  gatherCandidates,
  runMatcherAuthoring,
  searchBrandDirect,
  searchPaidSearch,
  verifyAndScoreCandidates,
} from './match-moments-authoring.mjs';

const moment = { id: 'grammys-look', title: 'Grammys look' };

describe('E6 authoring: strict cost-order search (SPEC §8 step 2)', () => {
  it('never calls brand-direct or paid search when the Awin index already answered', async () => {
    const openDatabase = vi.fn(async () => ({
      prepare: () => ({ all: () => [{ feed_id: 'f1', product_id: 'p1', title: 'Dress', price: '$40', stock: 'in stock', image_url: 'https://x/img.jpg', destination_url: 'https://x/p1', deeplink: null, brand: 'Acme', category: 'dress' }] }),
      close: () => {},
    }));
    const brandDirectSearch = vi.fn(async () => []);
    const paidSearchImpl = vi.fn(async () => []);

    const { candidates, paidSearchTicket } = await gatherCandidates({
      moment,
      descriptors: { brand: 'Acme', kind: 'dress' },
      indexPath: '/tmp/fake.sqlite',
      openDatabase,
      brandDirectSearch,
      paidSearchImpl,
      callsUsed: 0,
      cap: 5,
    });

    expect(candidates).toHaveLength(1);
    expect(candidates[0].source).toBe('awin-index');
    expect(brandDirectSearch).not.toHaveBeenCalled();
    expect(paidSearchImpl).not.toHaveBeenCalled();
    expect(paidSearchTicket).toBeNull();
  });

  it('falls to brand-direct only when the Awin index found nothing and a brand is named', async () => {
    const openDatabase = vi.fn(async () => ({ prepare: () => ({ all: () => [] }), close: () => {} }));
    const brandDirectSearch = vi.fn(async () => [{ id: 'bd1', source: 'brand-direct', price: '$80', productUrl: 'https://acme.com/p', imageUrl: 'https://acme.com/i.jpg' }]);
    const paidSearchImpl = vi.fn(async () => []);

    const { candidates } = await gatherCandidates({
      moment,
      descriptors: { brand: 'Acme', kind: 'dress' },
      indexPath: '/tmp/fake.sqlite',
      openDatabase,
      brandDirectSearch,
      paidSearchImpl,
      callsUsed: 0,
      cap: 5,
    });

    expect(brandDirectSearch).toHaveBeenCalledTimes(1);
    expect(paidSearchImpl).not.toHaveBeenCalled();
    expect(candidates.map((candidate) => candidate.source)).toEqual(['brand-direct']);
  });

  it('reaches paid search only when a+b left a gap, and never bypasses the R5 cap', async () => {
    const openDatabase = vi.fn(async () => ({ prepare: () => ({ all: () => [] }), close: () => {} }));
    const paidSearchImpl = vi.fn(async () => [{ id: 'ps1', source: 'paid-search' }]);

    const underCap = await gatherCandidates({
      moment,
      descriptors: { kind: 'dress' },
      indexPath: '/tmp/fake.sqlite',
      openDatabase,
      paidSearchImpl,
      callsUsed: 0,
      cap: 1,
    });
    expect(paidSearchImpl).toHaveBeenCalledTimes(1);
    expect(underCap.candidates.map((candidate) => candidate.source)).toEqual(['paid-search']);
    expect(underCap.paidSearchTicket).toBeNull();

    paidSearchImpl.mockClear();
    const atCap = await gatherCandidates({
      moment,
      descriptors: { kind: 'dress' },
      indexPath: '/tmp/fake.sqlite',
      openDatabase,
      paidSearchImpl,
      callsUsed: 1,
      cap: 1,
    });
    expect(paidSearchImpl).not.toHaveBeenCalled();
    expect(atCap.candidates).toEqual([]);
    expect(atCap.paidSearchTicket).toEqual(expect.objectContaining({ reason: 'paid-search-cap-reached' }));
  });

  it('guesses a brand hostname deterministically without new crawler infrastructure', () => {
    expect(brandHostnameGuess('Rowing Blazers')).toBe('rowingblazers.com');
    expect(brandHostnameGuess('')).toBeNull();
    expect(brandHostnameGuess(undefined)).toBeNull();
  });

  it('scopes brand-direct to the guessed hostname via site: restriction', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ shopping_results: [] }) }));
    await searchBrandDirect({ descriptors: { brand: 'Acme', kind: 'dress' }, apiKey: 'k', fetchImpl });
    const requestedUrl = new URL(fetchImpl.mock.calls[0][0]);
    expect(requestedUrl.searchParams.get('q')).toContain('site:acme.com');
  });

  it('returns no candidates from brand-direct when no brand is named', async () => {
    expect(await searchBrandDirect({ descriptors: { kind: 'dress' }, apiKey: 'k' })).toEqual([]);
  });

  it('returns no paid-search candidates without a configured key', async () => {
    expect(await searchPaidSearch({ descriptors: { kind: 'dress' } })).toEqual([]);
  });
});

describe('E6 authoring: verification gate (R2/E1/E2)', () => {
  it('drops a candidate that fails URL or image verification before scoring', async () => {
    const judge = vi.fn(async () => ({ score: 95 }));
    const verifyUrlImpl = vi.fn(async (url) => url === 'https://ok/p');
    const verifyImageImpl = vi.fn(async (url) => ({ verdict: url === 'https://ok/img.jpg' ? 'ok' : 'invalid' }));

    const scored = await verifyAndScoreCandidates(
      [
        { id: 'good', productUrl: 'https://ok/p', imageUrl: 'https://ok/img.jpg' },
        { id: 'bad-url', productUrl: 'https://bad/p', imageUrl: 'https://ok/img.jpg' },
        { id: 'bad-image', productUrl: 'https://ok/p', imageUrl: 'https://bad/img.jpg' },
      ],
      { momentImageUrl: 'https://moment/img.jpg', judge, verifyUrlImpl, verifyImageImpl },
    );

    expect(scored.map((candidate) => candidate.id)).toEqual(['good']);
    expect(judge).toHaveBeenCalledTimes(1);
  });
});

describe('E6 authoring: full pipeline reuses matchMoment/R6 unchanged', () => {
  it('extracts, searches in cost order, scores, and selects via the existing matcher', async () => {
    const openDatabase = vi.fn(async () => ({
      prepare: () => ({
        all: () => [
          { feed_id: 'f1', product_id: 'awin1', title: 'Dress', price: '$60', stock: 'in stock', image_url: 'https://ok/awin.jpg', destination_url: 'https://ok/awin', deeplink: null, brand: 'Acme', category: 'dress' },
        ],
      }),
      close: () => {},
    }));
    const extractImpl = vi.fn(async () => ({ kind: 'dress', brand: 'Acme', color: 'red' }));
    const judge = vi.fn(async ({ candidate }) => ({ score: candidate.source === 'awin-index' ? 75 : 92 }));
    const verifyUrlImpl = vi.fn(async () => true);
    const verifyImageImpl = vi.fn(async () => ({ verdict: 'ok' }));
    const brandDirectSearch = vi.fn(async () => [{ id: 'direct1', source: 'brand-direct', productUrl: 'https://ok/direct', imageUrl: 'https://ok/direct.jpg', price: '$300' }]);

    const result = await runMatcherAuthoring({
      moment,
      momentImageUrl: 'https://ok/moment.jpg',
      extractImpl,
      indexPath: '/tmp/fake.sqlite',
      openDatabase,
      brandDirectSearch,
      judge,
      verifyUrlImpl,
      verifyImageImpl,
      callsUsed: 0,
      cap: 5,
    });

    // Awin index answered, so brand-direct must not even be called.
    expect(brandDirectSearch).not.toHaveBeenCalled();
    expect(result.products.map((product) => product.id)).toEqual(['f1:awin1']);
    expect(result.ticket).toBeNull();
    expect(result.descriptors).toEqual({ kind: 'dress', brand: 'Acme', color: 'red', pattern: undefined, silhouette: undefined });
  });

  it('files a re-source ticket when nothing clears the similar floor, exactly like the deterministic matcher', async () => {
    const openDatabase = vi.fn(async () => ({ prepare: () => ({ all: () => [] }), close: () => {} }));
    const extractImpl = vi.fn(async () => ({ kind: 'dress' }));
    const judge = vi.fn(async () => ({ score: 10 }));
    const verifyUrlImpl = vi.fn(async () => true);
    const verifyImageImpl = vi.fn(async () => ({ verdict: 'ok' }));
    const paidSearchImpl = vi.fn(async () => [{ id: 'weak', source: 'paid-search', productUrl: 'https://ok/p', imageUrl: 'https://ok/i.jpg' }]);

    const result = await runMatcherAuthoring({
      moment,
      momentImageUrl: 'https://ok/moment.jpg',
      extractImpl,
      indexPath: '/tmp/fake.sqlite',
      openDatabase,
      paidSearchImpl,
      judge,
      verifyUrlImpl,
      verifyImageImpl,
      callsUsed: 0,
      cap: 5,
    });

    expect(result.products).toEqual([]);
    expect(result.ticket).toEqual(expect.objectContaining({ momentId: moment.id, reason: 'no-qualifying-candidate' }));
  });
});
