import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { collectEtsyEvidence, curateCandidate, discoverCandidates, fileReverificationIssues, normalizeEtsyListing, normalizeRedditPost, normalizeSubmission, reverifyFanmadeListings } from './fanmade-discovery.mjs';

describe('fan-made discovery', () => {
  it('keeps the original bounded search payload and waits one second before retrying a detail 429 without Retry-After', async () => {
    const searchPayload = { results: [{ listing_id: 42, title: 'Search-only title', search_marker: 'retain-me' }] };
    let detailAttempts = 0;
    const sleep = vi.fn(async () => {});
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/listings/active')) {
        return new Response(JSON.stringify(searchPayload), { status: 200 });
      }
      if (url.includes('/listings/42')) {
        detailAttempts += 1;
        if (detailAttempts === 1) return new Response('', { status: 429 });
        return new Response(JSON.stringify({
          listing_id: 42,
          title: 'Original lavender lyric bracelet',
          url: 'https://www.etsy.com/listing/42/original-bracelet',
          price: { amount: 2800, divisor: 100, currency_code: 'USD' },
          shop: { shop_name: 'LavenderMaker', is_vacation: false, review_count: 12 },
          images: [{ url_fullxfull: 'https://images.example.test/bracelet.jpg' }],
        }), { status: 200 });
      }
      throw new Error(`unexpected URL: ${url}`);
    });

    await expect(collectEtsyEvidence({
      etsyApiKey: 'test-key', fetchImpl, queries: ['Taylor Swift inspired'], now: '2026-08-30T00:00:00Z', sleep,
    })).resolves.toEqual(expect.objectContaining({
      candidates: [expect.objectContaining({ brand: 'LavenderMaker', imageUrl: 'https://images.example.test/bracelet.jpg' })],
      rawQueries: [expect.objectContaining({ query: 'Taylor Swift inspired', payload: searchPayload })],
      listingDetails: [expect.objectContaining({ listingId: '42', detail: expect.objectContaining({ shop: expect.any(Object), images: expect.any(Array) }) })],
    }));
    expect(sleep).toHaveBeenCalledTimes(1);
    expect(sleep).toHaveBeenCalledWith(1_000);
    const [searchUrl, detailUrl] = fetchImpl.mock.calls.map(([url]) => new URL(url));
    expect(searchUrl.pathname).toBe('/v3/application/listings/active');
    expect(searchUrl.searchParams.has('includes')).toBe(false);
    expect(searchUrl.searchParams.get('limit')).toBe('10');
    expect(detailUrl.pathname).toBe('/v3/application/listings/42');
    expect(detailUrl.searchParams.get('includes')).toBe('Images,Shop');
  });

  it('preserves incomplete Etsy detail evidence while failing it closed for candidates', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/listings/active')) return new Response(JSON.stringify({ results: [{ listing_id: 42 }] }), { status: 200 });
      return new Response(JSON.stringify({ listing_id: 42, title: 'Incomplete listing', url: 'https://www.etsy.com/listing/42/incomplete' }), { status: 200 });
    });

    await expect(collectEtsyEvidence({ etsyApiKey: 'test-key', fetchImpl, queries: ['Taylor Swift inspired'] })).resolves.toMatchObject({
      candidates: [],
      rawQueries: [{ payload: { results: [expect.objectContaining({ listing_id: 42 })] } }],
      listingDetails: [{ listingId: '42', detail: expect.objectContaining({ title: 'Incomplete listing' }) }],
    });
  });

  it('keeps the raw search evidence when a listing disappears before detail retrieval', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/listings/active')) return new Response(JSON.stringify({ results: [{ listing_id: 42 }] }), { status: 200 });
      return new Response('', { status: 404 });
    });

    await expect(collectEtsyEvidence({ etsyApiKey: 'test-key', fetchImpl, queries: ['Taylor Swift inspired'] })).resolves.toEqual({
      rawQueries: [{ query: 'Taylor Swift inspired', payload: { results: [{ listing_id: 42 }] } }],
      listingDetails: [],
      candidates: [],
    });
  });

  it('requires Etsy credentials when collecting the manual E5 artifact', async () => {
    await expect(collectEtsyEvidence({ requireCredentials: true })).rejects.toThrow('Etsy API credentials are required');
  });

  it('collects Etsy, Reddit, and submission candidates with durable provenance and URL dedupe', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/listings/active')) return new Response(JSON.stringify({ results: [{ listing_id: 42 }] }), { status: 200 });
      if (url.includes('openapi.etsy.com')) {
        return new Response(JSON.stringify({
          listing_id: 42,
          title: 'Original lavender lyric bracelet',
          url: 'https://www.etsy.com/listing/42/original-bracelet?utm_source=etsy',
          price: { amount: 2800, divisor: 100, currency_code: 'USD' },
          shop: { shop_name: 'LavenderMaker', is_vacation: false, review_count: 12 },
          images: [{ url_fullxfull: 'https://images.example.test/bracelet.jpg' }],
        }), { status: 200 });
      }
      if (url.includes('reddit.com')) {
        return new Response(JSON.stringify({ data: { children: [{ data: {
          id: 'reddit-1',
          title: 'Found an original lavender lyric bracelet',
          url: 'https://www.etsy.com/listing/42/original-bracelet',
          permalink: '/r/TaylorSwiftMerch/comments/reddit-1',
          created_utc: 1_700_000_000,
        } }] } }), { status: 200 });
      }
      throw new Error(`unexpected URL: ${url}`);
    });

    const result = await discoverCandidates({
      etsyApiKey: 'test-key',
      fetchImpl,
      submissions: [{
        number: 17,
        title: '[Link submission] merch: etsy.com',
        body: 'https://www.etsy.com/listing/42/original-bracelet',
        labels: ['merch-submission'],
        html_url: 'https://github.com/example/repo/issues/17',
        created_at: '2026-08-30T00:00:00Z',
      }],
    });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0]).toMatchObject({
      url: 'https://www.etsy.com/listing/42/original-bracelet',
      provenance: expect.arrayContaining([
        expect.objectContaining({ discoveredVia: 'etsy-search' }),
        expect.objectContaining({ discoveredVia: 'reddit' }),
        expect.objectContaining({ discoveredVia: 'submission' }),
      ]),
    });
  });

  it('deduplicates Etsy listings when a non-UTM tracking parameter is present', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/listings/active')) return new Response(JSON.stringify({ results: [{ listing_id: 42 }] }), { status: 200 });
      if (url.includes('openapi.etsy.com')) {
        return new Response(JSON.stringify({
          listing_id: 42,
          title: 'Original lavender lyric bracelet',
          url: 'https://www.etsy.com/listing/42/original-bracelet?click_key=campaign',
          price: { amount: 2800, divisor: 100, currency_code: 'USD' },
          shop: { shop_name: 'LavenderMaker', is_vacation: false, review_count: 12 },
          images: [{ url_fullxfull: 'https://images.example.test/bracelet.jpg' }],
        }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { children: [{ data: {
        id: 'reddit-1', title: 'Found it', url: 'https://www.etsy.com/listing/42/original-bracelet',
        permalink: '/r/TaylorSwiftMerch/comments/reddit-1', created_utc: 1_700_000_000,
      } }] } }), { status: 200 });
    });

    const result = await discoverCandidates({ etsyApiKey: 'test-key', fetchImpl });

    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].url).toBe('https://www.etsy.com/listing/42/original-bracelet');
  });

  it('re-verifies existing Etsy fan-made listings with live and price status without mutating seed data', async () => {
    const entries = [
      { url: 'https://www.etsy.com/listing/42/original-bracelet', price: '$28.00' },
      { url: 'https://www.etsy.com/listing/99/sold-out', price: '$30.00' },
      { url: 'https://maker.example.test/bracelet', price: '$20.00' },
    ];
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/42?')) {
        return new Response(JSON.stringify({ state: 'active', price: { amount: 3200, divisor: 100, currency_code: 'USD' } }), { status: 200 });
      }
      return new Response('', { status: 404 });
    });

    await expect(reverifyFanmadeListings({ entries, etsyApiKey: 'test-key', fetchImpl, verifiedAt: '2026-08-30T00:00:00Z' })).resolves.toEqual({
      reverified: [
        { url: 'https://www.etsy.com/listing/42/original-bracelet', status: 'live', price: '$32.00', seedPrice: '$28.00', verifiedAt: '2026-08-30T00:00:00Z' },
        { url: 'https://www.etsy.com/listing/99/sold-out', status: 'dead', price: null, seedPrice: '$30.00', verifiedAt: '2026-08-30T00:00:00Z' },
        { url: 'https://maker.example.test/bracelet', status: 'unsupported-retailer', price: null, seedPrice: '$20.00', verifiedAt: '2026-08-30T00:00:00Z' },
      ],
    });
    expect(entries).toEqual([
      { url: 'https://www.etsy.com/listing/42/original-bracelet', price: '$28.00' },
      { url: 'https://www.etsy.com/listing/99/sold-out', price: '$30.00' },
      { url: 'https://maker.example.test/bracelet', price: '$20.00' },
    ]);
  });

  it('files stale liveness and price results for the mending lane instead of only logging them', async () => {
    const fetchImpl = vi.fn(async (url: string, options?: RequestInit) => {
      if (url.endsWith('/labels')) return new Response(JSON.stringify({}), { status: 201 });
      if (url.includes('/issues?')) return new Response(JSON.stringify([]), { status: 200 });
      if (url.endsWith('/issues') && options?.method === 'POST') return new Response(JSON.stringify({}), { status: 201 });
      throw new Error(`unexpected URL: ${url}`);
    });
    const reverified = [
      { url: 'https://www.etsy.com/listing/42/original-bracelet', status: 'live', price: '$32.00', seedPrice: '$28.00', verifiedAt: '2026-08-30T00:00:00Z' },
      { url: 'https://www.etsy.com/listing/43/same-price', status: 'live', price: '$32.00', seedPrice: '$32.00', verifiedAt: '2026-08-30T00:00:00Z' },
      { url: 'https://www.etsy.com/listing/44/no-price', status: 'live', price: null, seedPrice: '$32.00', verifiedAt: '2026-08-30T00:00:00Z' },
      { url: 'https://www.etsy.com/listing/99/sold-out', status: 'dead', price: null, seedPrice: '$30.00', verifiedAt: '2026-08-30T00:00:00Z' },
      { url: 'https://www.etsy.com/listing/100/transient', status: 'unknown', price: null, seedPrice: '$20.00', verifiedAt: '2026-08-30T00:00:00Z' },
    ];

    await expect(fileReverificationIssues({ repository: 'example/repo', token: 'test-token', reverified, fetchImpl, dryRun: false })).resolves.toEqual({
      filed: ['https://www.etsy.com/listing/42/original-bracelet', 'https://www.etsy.com/listing/44/no-price', 'https://www.etsy.com/listing/99/sold-out'],
      skipped: [],
    });
    expect(fetchImpl).toHaveBeenCalledTimes(5);
  });

  it('continues re-verifying later listings when one Etsy request fails', async () => {
    const entries = [
      { url: 'https://www.etsy.com/listing/42/transient', price: '$28.00' },
      { url: 'https://www.etsy.com/listing/43/live', price: '$30.00' },
    ];
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('/42?')) throw new Error('network reset');
      return new Response(JSON.stringify({ state: 'active', price: { amount: 3000, divisor: 100, currency_code: 'USD' } }), { status: 200 });
    });

    await expect(reverifyFanmadeListings({ entries, etsyApiKey: 'test-key', fetchImpl, verifiedAt: '2026-08-30T00:00:00Z' })).resolves.toEqual({
      reverified: [
        { url: 'https://www.etsy.com/listing/42/transient', status: 'unknown', price: null, seedPrice: '$28.00', verifiedAt: '2026-08-30T00:00:00Z' },
        { url: 'https://www.etsy.com/listing/43/live', status: 'live', price: '$30.00', seedPrice: '$30.00', verifiedAt: '2026-08-30T00:00:00Z' },
      ],
    });
  });

  it('does not invent Etsy price, maker, link, or image when the API omits them', () => {
    expect(normalizeEtsyListing({ listing_id: 42, title: 'Unknown' }, 'query')).toMatchObject({
      item: 'Unknown',
      url: null,
      brand: null,
      price: null,
      imageUrl: null,
    });
  });

  it('filters Etsy listings without an active reviewed shop, sane price, and real image before filing intake', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('openapi.etsy.com')) {
        return new Response(JSON.stringify({ results: [{
          listing_id: 9, title: 'No review signal', url: 'https://www.etsy.com/listing/9',
          price: { amount: 2500, divisor: 100, currency_code: 'USD' },
          shop: { shop_name: 'Unreviewed', is_vacation: false, review_count: 0 },
          images: [{ url_fullxfull: 'https://images.example.test/item.jpg' }],
        }] }), { status: 200 });
      }
      return new Response(JSON.stringify({ data: { children: [] } }), { status: 200 });
    });

    await expect(discoverCandidates({ etsyApiKey: 'test-key', fetchImpl })).resolves.toEqual({ candidates: [] });
  });

  it('keeps the scheduled dry-run useful when Reddit temporarily rejects public JSON', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('openapi.etsy.com')) return new Response(JSON.stringify({ results: [] }), { status: 200 });
      if (url.includes('reddit.com')) return new Response('', { status: 403 });
      throw new Error(`unexpected URL: ${url}`);
    });

    await expect(discoverCandidates({ etsyApiKey: 'test-key', fetchImpl })).resolves.toEqual({ candidates: [] });
  });

  it('normalizes public Reddit and form intake without treating either as verified product facts', () => {
    expect(normalizeRedditPost({
      id: 'abc', title: 'A shop find', url: 'https://www.etsy.com/listing/7', permalink: '/r/TaylorSwiftMerch/comments/abc', created_utc: 1_700_000_000,
    })).toMatchObject({
      url: 'https://www.etsy.com/listing/7',
      brand: null,
      price: null,
      provenance: [expect.objectContaining({ discoveredVia: 'reddit' })],
    });
    expect(normalizeSubmission({
      number: 7, title: 'Merch submission', body: '- **URL:** `https://www.etsy.com/listing/7`', html_url: 'https://github.com/example/repo/issues/7', created_at: '2026-08-30T00:00:00Z',
    })).toMatchObject({
      url: 'https://www.etsy.com/listing/7',
      provenance: [expect.objectContaining({ discoveredVia: 'submission' })],
    });
  });

  it('enforces D3 as a hard reject for official-art, tour-graphic, and Taylor-photo bootlegs', () => {
    for (const prohibitedMaterial of ['official-artwork', 'tour-graphic', 'taylor-photo']) {
      expect(curateCandidate({
        item: 'candidate', url: 'https://www.etsy.com/listing/7', brand: 'Maker', price: '$20', imageUrl: 'https://images.example.test/item.jpg',
        judgment: 'inspired-original', prohibitedMaterial, listingVerified: true, imageVerified: true,
      })).toMatchObject({ accepted: false, reason: 'd3-prohibited-material' });
    }
  });

  it('admits an inspired-by original only after judged D3 and E1/E2 evidence are all present', () => {
    expect(curateCandidate({
      item: 'Original lavender lyric bracelet', kind: 'accessory', url: 'https://www.etsy.com/listing/7', brand: 'LavenderMaker', price: '$28.00', imageUrl: 'https://images.example.test/item.jpg',
      judgment: 'inspired-original', prohibitedMaterial: 'none', listingVerified: true, imageVerified: true,
      provenance: [{ discoveredVia: 'etsy-search', discoveredAt: '2026-08-30T00:00:00Z', sourceUrl: 'https://api.etsy.test/42' }],
    }, '2026-08-30T00:00:00Z')).toMatchObject({ accepted: true, seed: expect.objectContaining({ discoveredVia: 'etsy-search', kind: 'accessory', verifiedAt: '2026-08-30T00:00:00Z' }) });
  });

  it('refuses curation before either E1 or E2 verification, or without required source facts', () => {
    expect(curateCandidate({
      item: 'Original design', kind: 'accessory', url: 'https://www.etsy.com/listing/7', brand: 'Maker', price: '$20', imageUrl: 'https://images.example.test/item.jpg',
      judgment: 'inspired-original', prohibitedMaterial: 'none', listingVerified: false, imageVerified: true,
    })).toMatchObject({ accepted: false, reason: 'e1-listing-not-verified' });
    expect(curateCandidate({
      item: 'Original design', kind: 'accessory', url: 'https://www.etsy.com/listing/7', brand: 'Maker', price: null, imageUrl: 'https://images.example.test/item.jpg',
      judgment: 'inspired-original', prohibitedMaterial: 'none', listingVerified: true, imageVerified: true,
    })).toMatchObject({ accepted: false, reason: 'missing-required-source-facts' });
  });
});
