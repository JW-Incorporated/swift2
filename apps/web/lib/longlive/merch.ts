/**
 * Long Live — the Marketplace section's data (item 4a,
 * docs/definition-of-done.md:126-135).
 *
 * Aggregates three sources into one catalogue:
 *   1. shopTheLook — the existing "shop the look" `Product`s already attached
 *      to fashion moments in `content-vault.generated.ts` (via `CONTENT`),
 *      the same products rendered as "Shop the look" in MomentDetail. Never
 *      re-authored here — read straight off `CONTENT`, so this file cannot
 *      drift from the moment data.
 *   2. officialStore — Taylor's official store (store.taylorswift.com),
 *      sourced from the checked-in, engine-authored
 *      `supabase/seed/merch/official.mjs` (`OFFICIAL`). Direct official-store
 *      URLs and verified Amazon secondary listings only (D1-a) — see
 *      merch.test.ts for the source proof.
 *   3. fanMade — curated fan-made items, sourced from the checked-in,
 *      evidence-backed `supabase/seed/merch/fanmade.mjs` (`FAN_MADE`). Each
 *      row is independently evidenced per the E5 evidence workflow; see
 *      merch.test.ts for the source proof.
 *
 * Cross-navigation (item 4a): every shopTheLook item carries a `source`
 * back-reference to the era/moment it came from, because `CONTENT` has that
 * data. officialStore/fanMade items would carry the same `source` field IF
 * curated with a moment link — the shape supports it, nothing here invents it.
 */

import { CONTENT } from './content';
// Generated from supabase/seed/merch/{official,fanmade}.mjs by
// scripts/sync-longlive-merch.mjs (Fable 5.1 architecture review, R11) — the
// same generated-file pattern as the other vault modules in this directory.
// Do not import supabase/seed/** directly from app code; regenerate instead
// (`npm run sync:content` / `npm run check:generated`).
import { OFFICIAL, FAN_MADE } from './merch.generated';
import {
  buildMerchCatalogue,
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

/**
 * Long Live — the Marketplace section's data (item 4a,
 * docs/definition-of-done.md:126-135).
 *
 * OS-014b-1: the pure catalogue-construction logic
 * (`shopTheLookItemsFrom`/`catalogueItems`/`newDrops`/`merchProductJsonLd`/
 * `buildMerchCatalogue`) moved to `@swift2/content-enrichment` so
 * `scripts/build-content-bundle.mjs` can call it with zero `apps/web`
 * dependency. Re-exported here unchanged so every existing caller/test of
 * this module keeps working.
 *
 * BUNDLE AS SOURCE OF TRUTH, LITERAL AS RUNTIME VALUE (OS-014b-4, same
 * reasoning recorded for era-secrets.ts and clownbot-lore.ts's OS-014b-5 —
 * see those files' headers for the fuller writeup): `OFFICIAL`/`FAN_MADE`
 * keep importing straight from `merch.generated.ts` (plain array literals
 * with zero imports) rather than reading the published bundle's
 * `merch.json` via `packages/content`'s async `loadBundle()` or the
 * synchronous `readBundleArtifact()` helper (`./read-bundle-artifact.ts`).
 *
 * This module is reachable from `MerchCard.tsx`/`MerchStyleSection.tsx`,
 * both `'use client'` components — Next.js/Turbopack statically traces
 * every module in a client component's import graph and refuses to bundle
 * `node:fs`/`node:path` for the browser, so `readBundleArtifact()` is not
 * usable here. `loadBundle()` is likewise the wrong shape: it is an async
 * HTTP client, and `MERCH_CATALOGUE` is read synchronously by every one of
 * its ~100+ call sites today (this migration's explicit "zero
 * pixel/behavior change" bar) — an async load would ripple into every
 * consumer's render path for no benefit apps/web's own build doesn't
 * already get for free (the generated files are produced from the exact
 * same `supabase/seed/merch/**` sources the bundle is built from, by the
 * same `prebuild` step, before either is read).
 *
 * `merch.test.ts` enforces the actual invariant instead: a
 * byte-identical-to-the-published-bundle regression check on
 * `MERCH_CATALOGUE`, so any drift between the generated-literal path and
 * `merch.json` fails the suite immediately — see that file for the
 * assertion.
 *
 * Aggregates three sources into one catalogue:
 *   1. shopTheLook — the existing "shop the look" `Product`s already attached
 *      to fashion moments in `content-vault.generated.ts` (via `CONTENT`),
 *      the same products rendered as "Shop the look" in MomentDetail. Never
 *      re-authored here — read straight off `CONTENT`, so this file cannot
 *      drift from the moment data.
 *   2. officialStore — Taylor's official store (store.taylorswift.com),
 *      sourced from the checked-in, engine-authored
 *      `supabase/seed/merch/official.mjs` (`OFFICIAL`). Direct official-store
 *      URLs and verified Amazon secondary listings only (D1-a) — see
 *      merch.test.ts for the source proof.
 *   3. fanMade — curated fan-made items, sourced from the checked-in,
 *      evidence-backed `supabase/seed/merch/fanmade.mjs` (`FAN_MADE`). Each
 *      row is independently evidenced per the E5 evidence workflow; see
 *      merch.test.ts for the source proof.
 *
 * Cross-navigation (item 4a): every shopTheLook item carries a `source`
 * back-reference to the era/moment it came from, because `CONTENT` has that
 * data.
 */

export type { MerchCategory, MerchSource, MerchItem, MerchCatalogue };
export { shopTheLookItemsFrom, catalogueItems, newDrops, merchProductJsonLd };
export type { MomentPhotoInput };

/**
 * The full Marketplace catalogue, assembled only from authored engine output.
 */
export const MERCH_CATALOGUE: MerchCatalogue = buildMerchCatalogue(CONTENT, OFFICIAL, FAN_MADE);
