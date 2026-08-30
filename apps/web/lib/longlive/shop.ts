import type { Product } from './types';
import { createNetworkResolver, networkFor, type AwinAdvertisers, type NetworkResolution } from './shop-networks';

declare const process: {
  env: {
    NEXT_PUBLIC_AWIN_ID?: string;
    NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG?: string;
    NEXT_PUBLIC_CATCHALL_ID?: string;
  };
};

export type ShopListing = Pick<Product, 'retailer' | 'url'>;

export type ShopLinkContext =
  | { eraId: string; momentId: string }
  | { bucket: 'official' | 'fanmade' };

interface ShopNetworkCredentials {
  awinId?: string;
  amazonAssociatesTag?: string;
  catchallId?: string;
}

interface ShopLinkBuilderConfig extends ShopNetworkCredentials {
  awinAdvertisers?: AwinAdvertisers;
  resolveNetwork?: (retailer: string) => NetworkResolution;
}

function subidFor(context: ShopLinkContext | undefined): string | undefined {
  if (!context) return undefined;
  return 'bucket' in context ? context.bucket : `${context.eraId}.${context.momentId}`;
}

function hasValidUrl(listing: ShopListing): boolean {
  try {
    new URL(listing.url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Builds and classifies links from an explicit configuration. Tests use this
 * boundary to exercise a generated-map fixture without ever hard-coding an
 * advertiser into the production resolver.
 */
export function createShopLinkBuilder(config: ShopLinkBuilderConfig = {}) {
  const resolveNetwork =
    config.resolveNetwork ??
    (config.awinAdvertisers ? createNetworkResolver(config.awinAdvertisers) : networkFor);

  function isAffiliate(listing: ShopListing, context?: ShopLinkContext): boolean {
    const subid = subidFor(context);
    if (!subid || !hasValidUrl(listing)) return false;

    const resolution = resolveNetwork(listing.retailer);
    return (
      (resolution.network === 'awin' && Boolean(config.awinId)) ||
      (resolution.network === 'amazon' && Boolean(config.amazonAssociatesTag))
    );
  }

  function buildUrl(listing: ShopListing, context?: ShopLinkContext): string {
    const subid = subidFor(context);
    if (!subid || !isAffiliate(listing, context)) return listing.url;

    const resolution = resolveNetwork(listing.retailer);
    if (resolution.network === 'awin' && config.awinId) {
      return `https://www.awin1.com/cread.php?awinmid=${encodeURIComponent(resolution.awinmid)}&awinaffid=${encodeURIComponent(config.awinId)}&clickref=${encodeURIComponent(subid)}&ued=${encodeURIComponent(listing.url)}`;
    }

    if (resolution.network === 'amazon' && config.amazonAssociatesTag) {
      const destination = new URL(listing.url);
      destination.searchParams.set('tag', config.amazonAssociatesTag);
      destination.searchParams.set('ascsubtag', subid);
      return destination.toString();
    }

    return listing.url;
  }

  return { buildUrl, isAffiliate };
}

const productionShopLinks = createShopLinkBuilder({
  awinId: process.env.NEXT_PUBLIC_AWIN_ID,
  amazonAssociatesTag: process.env.NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG,
  catchallId: process.env.NEXT_PUBLIC_CATCHALL_ID,
});

/**
 * The ONE place a product's stored URL becomes the href the UI renders.
 *
 * Today this returns the direct retailer URL unchanged. When affiliate
 * monetization goes live, the wrapping happens HERE and only here, keyed by
 * `product.retailer` — content (seed files, the generated vault) never
 * changes, because content stores only the plain destination URL:
 *
 *   - LTK / RewardStyle: most fashion retailers (ralphlauren.com,
 *     louisvuitton.com, …) — wrap as an LTK redirect link.
 *   - Amazon Associates: amazon.com — append the `tag=` partner parameter.
 *   - Skimlinks: long-tail retailers — wrap via the Skimlinks redirect.
 *
 * Rules that keep this seam safe to flip:
 *   - Every product link in the UI MUST go through this function; never
 *     render `product.url` directly.
 *   - This stays a pure function of the product (no per-user state), so
 *     the vault remains fully static per the cost-discipline rule.
 *   - When any retailer branch starts returning an affiliate URL, the UI
 *     must also start showing SHOP_DISCLOSURE (below) next to shop links —
 *     see the `isAffiliate` helper the flip should add.
 */
export function buildShopUrl(listing: ShopListing, context?: ShopLinkContext): string {
  return productionShopLinks.buildUrl(listing, context);
}

/**
 * Whether buildShopUrl returns an affiliate (commission-earning) link for
 * this product. Always false while the seam is inert. The UI already renders
 * SHOP_DISCLOSURE next to any shop block containing an isAffiliate product
 * (see ShopTheLook in MomentDetail), so the affiliate flip is genuinely a
 * one-FILE change: update buildShopUrl + this predicate together and the
 * FTC disclosure appears with no UI edits.
 */
export function isAffiliate(listing: ShopListing): boolean {
  return productionShopLinks.isAffiliate(listing);
}

/** The context-aware predicate for future primary and alternate listing renderers. */
export function isAffiliateListing(listing: ShopListing, context: ShopLinkContext): boolean {
  return productionShopLinks.isAffiliate(listing, context);
}

/**
 * FTC-required disclosure, rendered automatically wherever a shop block
 * contains an isAffiliate() product — nothing renders it while the seam is
 * inert. Kept here, next to the seam, so the flip stays a one-file change.
 */
export const SHOP_DISCLOSURE =
  'Some links may earn Long Live a commission at no extra cost to you.';
