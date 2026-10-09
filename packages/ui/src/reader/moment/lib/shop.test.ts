import { describe, expect, it } from 'vitest';
import {
  createHostShopLinkRenderer,
  createShopLinkBuilder,
  AMAZON_DISCLOSURE,
  createShopLinkRenderer,
  renderMomentShopLink,
  SHOP_DISCLOSURE,
} from './shop';
import type { MerchItem } from '@swift2/content-enrichment';
import type { Product } from '@swift2/experience';

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

describe('host-supplied affiliate ids (WP2.5 A2)', () => {
  const amazon = product({ retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B0' });

  it('tags links from host affiliate env and stays direct when absent', () => {
    const tagged = createHostShopLinkRenderer({ amazonAssociatesTag: 'tag-20' });
    expect(renderMomentShopLink(amazon, context, tagged)).toEqual({
      href: 'https://www.amazon.com/dp/B0?tag=tag-20&ascsubtag=midnights.bejeweled-video',
      isAffiliate: true,
    });
    const direct = createHostShopLinkRenderer({});
    expect(renderMomentShopLink(amazon, context, direct)).toEqual({
      href: amazon.url,
      isAffiliate: false,
    });
  });
});

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

describe('render-context adapters', () => {
  const affiliateRenderer = createShopLinkRenderer(
    createShopLinkBuilder({
      awinAdvertisers: { 'ralphlauren.com': '1234' },
      awinId: 'affiliate-42',
    }),
  );

  it('keeps a moment href and disclosure predicate on the same era and moment context', () => {
    const link = affiliateRenderer.forMoment(product(), {
      eraId: 'midnights',
      momentId: 'bejeweled-video',
    });

    expect(link.href).toContain('clickref=midnights.bejeweled-video');
    expect(link.isAffiliate).toBe(true);
  });

  it('uses a merch bucket context for both the href and disclosure predicate', () => {
    const link = affiliateRenderer.forMerch(product(), 'fanmade');

    expect(link.href).toContain('clickref=fanmade');
    expect(link.isAffiliate).toBe(true);
  });

  it('keeps official primary listings direct and fan-made listings in their bucket', () => {
    const sourcedOfficial: MerchItem = {
      ...product(),
      category: 'official-store',
      source: { eraId: 'midnights', momentId: 'bejeweled-video', momentTitle: 'Bejeweled' },
    };
    const sourcedFanMade: MerchItem = { ...sourcedOfficial, category: 'fan-made' };

    expect(affiliateRenderer.forMerchItem(sourcedOfficial)).toEqual({
      href: sourcedOfficial.url,
      isAffiliate: false,
    });
    expect(affiliateRenderer.forMerchItem(sourcedFanMade).href).toContain('clickref=fanmade');
    expect(affiliateRenderer.forMerchItem(sourcedFanMade).isAffiliate).toBe(true);
  });

  it('detects affiliate links across every non-exempt rendered merch bucket', () => {
    const official: MerchItem = { ...product(), category: 'official-store' };
    const fanMade: MerchItem = { ...product(), category: 'fan-made' };

    expect(affiliateRenderer.hasAffiliateMerch([official])).toBe(false);
    expect(affiliateRenderer.hasAffiliateMerch([official, fanMade])).toBe(true);
  });

  it('leaves the direct no-credential path unchanged through both adapters', () => {
    const directRenderer = createShopLinkRenderer(
      createShopLinkBuilder({ awinAdvertisers: { 'ralphlauren.com': '1234' } }),
    );

    for (const link of [
      directRenderer.forMoment(product(), { eraId: 'midnights', momentId: 'bejeweled-video' }),
      directRenderer.forMerch(product(), 'official'),
    ]) {
      expect(link.href).toBe(product().url);
      expect(link.isAffiliate).toBe(false);
    }
  });
});

describe('AMAZON_DISCLOSURE', () => {
  const amazon = product({ retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B0' });

  it('is the exact Amazon Associates Operating Agreement statement', () => {
    expect(AMAZON_DISCLOSURE).toBe('As an Amazon Associate I earn from qualifying purchases.');
  });

  it('flags only Amazon affiliate links, never untagged Amazon or other networks', () => {
    const tagged = createHostShopLinkRenderer({ amazonAssociatesTag: 'tag-20', awinId: 'a' });
    expect(tagged.isAmazonMoment(amazon, context)).toBe(true);
    expect(tagged.isAmazonMoment(product(), context)).toBe(false);
    expect(createHostShopLinkRenderer({}).isAmazonMoment(amazon, context)).toBe(false);
  });

  it('hasAmazonMerch is true only with a tagged Amazon merch item', () => {
    const item = { ...product({ retailer: 'amazon.com', url: 'https://www.amazon.com/dp/B0' }), category: 'fan-made' } as MerchItem;
    const other = { ...product(), category: 'fan-made' } as MerchItem;
    const tagged = createHostShopLinkRenderer({ amazonAssociatesTag: 'tag-20' });
    expect(tagged.hasAmazonMerch([other, item])).toBe(true);
    expect(tagged.hasAmazonMerch([other])).toBe(false);
    expect(createHostShopLinkRenderer({}).hasAmazonMerch([item])).toBe(false);
  });
});

describe('SHOP_DISCLOSURE', () => {
  it('is a non-empty disclosure string, ready for the affiliate flip', () => {
    expect(SHOP_DISCLOSURE.length).toBeGreaterThan(10);
    expect(SHOP_DISCLOSURE.toLowerCase()).toContain('commission');
  });
});
