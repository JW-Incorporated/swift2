// OS-037 — native shop-link seam. Mirrors `apps/web/lib/longlive/shop.ts`'s
// `buildShopUrl()` invariant (see `packages/experience/src/types.ts`'s
// `Product.url` doc: "the UI must never link `url` directly — always via
// buildShopUrl()") so a future affiliate-wiring pass is a two-file change
// (this + the web's) instead of a UI-call-site hunt across both surfaces.
//
// Currently INERT, same as the web's seam: native has no equivalent of the
// web's `NEXT_PUBLIC_AWIN_ID`/`NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG` env wiring
// or the E0 advertiser map (`shop-networks.ts`) ported here yet — that's a
// dedicated follow-up, not this card's scope (OS-037 is the merch directory
// screen, not affiliate infrastructure). This returns the raw URL unchanged
// until that follow-up lands, but every render call site goes through this
// function now so the flip stays a one-file change here too.
export interface ShopListing {
  retailer: string;
  url: string;
}

export function buildShopUrl(listing: ShopListing): string {
  return listing.url;
}
