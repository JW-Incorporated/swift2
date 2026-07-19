import { describe, expect, it } from 'vitest';
import { buildShopUrl, SHOP_DISCLOSURE } from './shop';
import type { Product } from './types';

const product = (over: Partial<Product> = {}): Product => ({
  brand: 'Polo Ralph Lauren',
  item: 'Striped Silk-Blend Day Dress',
  retailer: 'ralphlauren.com',
  url: 'https://www.ralphlauren.com/some-dress',
  price: '$319.99',
  inStock: true,
  ...over,
});

describe('buildShopUrl', () => {
  it('returns the direct product URL unchanged while affiliate is off', () => {
    expect(buildShopUrl(product())).toBe('https://www.ralphlauren.com/some-dress');
  });

  it('is keyed only by the product — same product, same URL (pure/static)', () => {
    const p = product();
    expect(buildShopUrl(p)).toBe(buildShopUrl(p));
  });

  it('passes any retailer through untouched today — the seam is inert until the affiliate flip', () => {
    // When affiliate goes live these become wrapped per-retailer (LTK /
    // Amazon Associates / Skimlinks) and THIS test is the one that gets
    // updated — content never does.
    for (const retailer of ['louisvuitton.com', 'amazon.com', 'cartier.com', 'tiny-boutique.example']) {
      const url = `https://${retailer}/product/123`;
      expect(buildShopUrl(product({ retailer, url }))).toBe(url);
    }
  });

  it('never returns an empty or non-http href for a well-formed product', () => {
    expect(buildShopUrl(product())).toMatch(/^https?:\/\//);
  });
});

describe('SHOP_DISCLOSURE', () => {
  it('is a non-empty disclosure string, ready for the affiliate flip', () => {
    expect(SHOP_DISCLOSURE.length).toBeGreaterThan(10);
    expect(SHOP_DISCLOSURE.toLowerCase()).toContain('commission');
  });
});
