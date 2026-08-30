import { describe, expect, it } from 'vitest';
import { createShopLinkBuilder, SHOP_DISCLOSURE } from './shop';
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

const context = { eraId: 'midnights', momentId: 'bejeweled-video' };

describe('listing-scoped affiliate wrapping', () => {
  it('wraps an Awin-mapped primary listing with the listing subid', () => {
    const shop = createShopLinkBuilder({
      awinAdvertisers: { 'ralphlauren.com': '1234' },
      awinId: 'affiliate-42',
    });

    expect(shop.buildUrl(product(), context)).toBe(
      'https://www.awin1.com/cread.php?awinmid=1234&awinaffid=affiliate-42&clickref=midnights.bejeweled-video&ued=https%3A%2F%2Fwww.ralphlauren.com%2Fsome-dress',
    );
    expect(shop.isAffiliate(product(), context)).toBe(true);
  });

  it('adds Amazon attribution without dropping pre-existing destination parameters', () => {
    const shop = createShopLinkBuilder({ amazonAssociatesTag: 'longlive-20' });
    const listing = product({
      retailer: 'amazon.com',
      url: 'https://www.amazon.com/dp/B123?color=blue&tag=old-tag',
    });

    expect(shop.buildUrl(listing, context)).toBe(
      'https://www.amazon.com/dp/B123?color=blue&tag=longlive-20&ascsubtag=midnights.bejeweled-video',
    );
  });

  it('keeps the dormant catch-all and unmapped hosts direct', () => {
    const shop = createShopLinkBuilder({
      catchallId: 'unused-until-approved',
      awinAdvertisers: {},
    });

    for (const retailer of ['cartier.com', 'tiny-boutique.example']) {
      const listing = product({ retailer, url: `https://${retailer}/product/123` });
      expect(shop.buildUrl(listing, context)).toBe(listing.url);
      expect(shop.isAffiliate(listing, context)).toBe(false);
    }
  });

  it('keeps a catch-all resolution inert until its wrapping format is approved', () => {
    const shop = createShopLinkBuilder({
      catchallId: 'unused-until-approved',
      resolveNetwork: () => ({ network: 'catchall' }),
    });

    expect(shop.buildUrl(product(), context)).toBe(product().url);
    expect(shop.isAffiliate(product(), context)).toBe(false);
  });

  it('routes an alternate listing independently of its direct primary listing', () => {
    const shop = createShopLinkBuilder({ amazonAssociatesTag: 'longlive-20' });
    const primary = product({ retailer: 'store.taylorswift.com' });
    const altListing = { retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B123' };

    expect(shop.buildUrl(primary, { bucket: 'official' })).toBe(primary.url);
    expect(shop.isAffiliate(primary, { bucket: 'official' })).toBe(false);
    expect(shop.buildUrl(altListing, { bucket: 'official' })).toBe(
      'https://www.amazon.com/dp/B123?tag=longlive-20&ascsubtag=official',
    );
    expect(shop.isAffiliate(altListing, { bucket: 'official' })).toBe(true);
  });

  it('fails closed without the credential or listing context, so wrapping and disclosure stay atomic', () => {
    const credentialless = createShopLinkBuilder({ awinAdvertisers: { 'ralphlauren.com': '1234' } });
    const contextual = createShopLinkBuilder({
      awinAdvertisers: { 'ralphlauren.com': '1234' },
      awinId: 'affiliate-42',
    });

    expect(credentialless.buildUrl(product(), context)).toBe(product().url);
    expect(credentialless.isAffiliate(product(), context)).toBe(false);
    expect(contextual.buildUrl(product())).toBe(product().url);
    expect(contextual.isAffiliate(product())).toBe(false);
  });
});

describe('SHOP_DISCLOSURE', () => {
  it('is a non-empty disclosure string, ready for the affiliate flip', () => {
    expect(SHOP_DISCLOSURE.length).toBeGreaterThan(10);
    expect(SHOP_DISCLOSURE.toLowerCase()).toContain('commission');
  });
});
