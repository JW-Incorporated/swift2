import { describe, expect, it } from 'vitest';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — E1 script is plain .mjs
import { planMends } from './mend-links.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — E2 script is plain .mjs
import { extractReplacementImage, verifyImage } from './verify-images.mjs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs script
import { productTargets } from '../check-link-liveness.mjs';

describe('E1 merch mender', () => {
  it('checks both primary and alternative listing URLs without rewriting either destination', () => {
    expect(productTargets({ shopTheLook: [{
      category: 'shop-the-look', url: 'https://shop.example/primary', imageUrl: 'https://cdn.example/item.jpg',
      altListing: { url: 'https://shop.example/alternative' }, source: { eraId: '1989', momentId: 'look' },
    }] })).toEqual([
      { productId: '1989:look:0', url: 'https://shop.example/primary', imageUrl: 'https://cdn.example/item.jpg', listing: 'primary' },
      { productId: '1989:look:0', url: 'https://shop.example/alternative', listing: 'alternative' },
    ]);
  });

  it('marks a dead listing unavailable and creates a re-source record without substituting a product', () => {
    const plan = planMends([
      { productId: 'dress-1', url: 'https://shop.example/dress', verdict: 'dead' },
    ], '2026-08-30T12:00:00.000Z');

    expect(plan.updates).toEqual([{ productId: 'dress-1', verifiedAt: '2026-08-30T12:00:00.000Z', inStock: false }]);
    expect(plan.reSource).toEqual([{ productId: 'dress-1', url: 'https://shop.example/dress', listing: 'primary', reason: 'dead' }]);
    expect(plan.updates[0]).not.toHaveProperty('url');
  });

  it('preserves blocked listings for retry instead of treating bot walls as dead', () => {
    const plan = planMends([
      { productId: 'dress-2', url: 'https://shop.example/dress', verdict: 'blocked' },
    ], '2026-08-30T12:00:00.000Z');

    expect(plan.updates).toEqual([{ productId: 'dress-2', verifiedAt: '2026-08-30T12:00:00.000Z' }]);
    expect(plan.retries).toEqual([{ productId: 'dress-2', url: 'https://shop.example/dress', listing: 'primary', attempts: 1 }]);
    expect(plan.reSource).toEqual([]);
  });

  it('keeps primary stock independent from a failed alternative listing', () => {
    const plan = planMends([
      { productId: 'dress-3', url: 'https://shop.example/primary', listing: 'primary', verdict: 'ok' },
      { productId: 'dress-3', url: 'https://shop.example/alternative', listing: 'alternative', verdict: 'dead' },
    ], '2026-08-30T12:00:00.000Z');

    expect(plan.updates).toEqual([{ productId: 'dress-3', verifiedAt: '2026-08-30T12:00:00.000Z', inStock: true, dropAltListing: true }]);
    expect(plan.reSource).toEqual([{ productId: 'dress-3', url: 'https://shop.example/alternative', listing: 'alternative', reason: 'dead' }]);
  });
});

describe('E2 image verifier', () => {
  it('falls back from HEAD and accepts only a non-trivial image response', async () => {
    const calls: string[] = [];
    const result = await verifyImage('https://cdn.example/item.jpg', {
      fetchImpl: async (_url: string, init: RequestInit) => {
        calls.push(init.method ?? 'GET');
        return init.method === 'HEAD'
          ? new Response('', { status: 405 })
          : new Response(new Uint8Array(1024), { status: 200, headers: { 'content-type': 'image/jpeg', 'content-length': '1024' } });
      },
    });

    expect(calls).toEqual(['HEAD', 'GET']);
    expect(result).toEqual({ verdict: 'ok', status: 200 });
  });

  it('uses a ranged GET when a successful HEAD omits image size', async () => {
    const calls: string[] = [];
    const result = await verifyImage('https://cdn.example/item.jpg', {
      fetchImpl: async (_url: string, init: RequestInit) => {
        calls.push(init.method ?? 'GET');
        return init.method === 'HEAD'
          ? new Response('', { status: 200, headers: { 'content-type': 'image/jpeg' } })
          : new Response(new Uint8Array(1024), { status: 206, headers: { 'content-type': 'image/jpeg' } });
      },
    });

    expect(calls).toEqual(['HEAD', 'GET']);
    expect(result).toEqual({ verdict: 'ok', status: 206 });
  });

  it('extracts an honest replacement image from product-page metadata', () => {
    expect(extractReplacementImage('<meta property="og:image" content="https://cdn.example/replacement.jpg">')).toBe(
      'https://cdn.example/replacement.jpg',
    );
  });
});
