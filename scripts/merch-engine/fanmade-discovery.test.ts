import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script, no declaration file
import { curateCandidate, discoverCandidates, normalizeEtsyListing, normalizeRedditPost, normalizeSubmission } from './fanmade-discovery.mjs';

describe('fan-made discovery', () => {
  it('collects Etsy, Reddit, and submission candidates with durable provenance and URL dedupe', async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes('openapi.etsy.com')) {
        return new Response(JSON.stringify({ results: [{
          listing_id: 42,
          title: 'Original lavender lyric bracelet',
          url: 'https://www.etsy.com/listing/42/original-bracelet?utm_source=etsy',
          price: { amount: 2800, divisor: 100, currency_code: 'USD' },
          shop: { shop_name: 'LavenderMaker', is_vacation: false, review_count: 12 },
          images: [{ url_fullxfull: 'https://images.example.test/bracelet.jpg' }],
        }] }), { status: 200 });
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
