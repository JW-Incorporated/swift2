import type { Product } from './types';

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
export function buildShopUrl(product: Product): string {
  // Affiliate seam — intentionally inert today. The flip branches on
  // product.retailer here (and makes isAffiliate below return true for the
  // wrapped retailers); see docs/decisions.md 2026-07-19.
  return product.url;
}

/**
 * Whether buildShopUrl returns an affiliate (commission-earning) link for
 * this product. Always false while the seam is inert. The UI already renders
 * SHOP_DISCLOSURE next to any shop block containing an isAffiliate product
 * (see ShopTheLook in MomentDetail), so the affiliate flip is genuinely a
 * one-FILE change: update buildShopUrl + this predicate together and the
 * FTC disclosure appears with no UI edits.
 */
export function isAffiliate(product: Product): boolean {
  void product; // will branch on product.retailer when the flip lands
  return false;
}

/**
 * FTC-required disclosure, rendered automatically wherever a shop block
 * contains an isAffiliate() product — nothing renders it while the seam is
 * inert. Kept here, next to the seam, so the flip stays a one-file change.
 */
export const SHOP_DISCLOSURE =
  'Some links may earn Long Live a commission at no extra cost to you.';
