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
  // Affiliate seam (intentionally inert today). Example of the future shape:
  //
  //   switch (product.retailer) {
  //     case 'amazon.com':
  //       return withQueryParam(product.url, 'tag', AMAZON_ASSOCIATES_TAG);
  //     default:
  //       return LTK_RETAILERS.has(product.retailer)
  //         ? ltkWrap(product.url)
  //         : skimlinksWrap(product.url);
  //   }
  return product.url;
}

/**
 * FTC-required disclosure for when buildShopUrl starts returning affiliate
 * links. Not rendered today (links are plain direct URLs); the affiliate flip
 * must render this alongside any "Shop the look" block. Kept here, next to
 * the seam, so the flip is a one-file change.
 */
export const SHOP_DISCLOSURE =
  'Some links may earn Long Live a commission at no extra cost to you.';
