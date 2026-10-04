// Shim for apps/web/lib/longlive/merch.ts: same exports; MERCH_CATALOGUE's
// three lists are live and `fill()` populates them in place.
import {
  catalogueItems,
  merchProductJsonLd,
  newDrops,
  shopTheLookItemsFrom,
  type MerchCatalogue,
  type MerchCategory,
  type MerchItem,
  type MerchSource,
  type MomentPhotoInput,
} from '@swift2/content-enrichment';

export type { MerchCategory, MerchSource, MerchItem, MerchCatalogue, MomentPhotoInput };
export { shopTheLookItemsFrom, catalogueItems, newDrops, merchProductJsonLd };

export const MERCH_CATALOGUE: { -readonly [K in keyof MerchCatalogue]: MerchItem[] } = {
  shopTheLook: [],
  officialStore: [],
  fanMade: [],
};
