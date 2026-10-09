'use client';

/**
 * Merch page redesign (PLAN.md, KEEP: "the split card treatment (On Taylor |
 * the piece) which our data genuinely supports"). Split card for the "Seen
 * on Taylor" grid, used ONLY when both a real product photo and a real
 * moment photo exist (fix/merch-card-image-fallback, 2026-08-15 — a split
 * card with an empty half read as broken for the 55 moment-only items, so
 * the layout itself is now chosen by `merchItemImage()` in merch-filters.ts:
 * both photos → split, one photo → a single full-width image, neither → a
 * monogram tile). The moment half/image is always labelled "Her look, not
 * the product" (2026-08-15, docs/decisions.md); the product half/image
 * never falls back to the moment photo, which would recreate the exact
 * mislabeling that label exists to flag.
 *
 * D7=C (kanban t_28e3ad2a / t_c71f0eea, 2026-08-31, founder decision):
 * SUPERSEDES the 2026-08-15 anti-mislabeling design's non-clickable moment
 * photo. Every "Seen on Taylor" tile is now a buy link — including a
 * `moment`-kind tile (Taylor's photo only, no product photo) and the
 * moment half of a `split` tile — full consistency with "tap the picture
 * to buy," accepting the founder's explicit tradeoff that a photo of
 * Taylor herself can now be clicked to purchase the matched product. The
 * "Her look, not the product" label is kept precisely so the tile never
 * literally claims the photo depicts the item.
 *
 * Keeps: real product images, "The exact piece" vs "We found something
 * similar" with the authored `altNote` rendered as visible DOM text (not a
 * hover-only tooltip — invisible on touch, the bug this fixed), and the
 * in-app "Her look" button (`openItem(item.source.momentId)`) that opens
 * MomentDetail — the mockup's card links nowhere.
 */

import { useMemo } from 'react';
import { useHost, useReader } from '@swift2/ui';
import { ExternalLink } from 'lucide-react';
import { useAppActions } from '../store';
import { merchItemImage } from './lib/merch-filters';
import { AMAZON_DISCLOSURE, createHostShopLinkRenderer, SHOP_DISCLOSURE } from '../moment/lib/shop';
import { MerchCardHalf } from './MerchCardHalf';
import { merchProductJsonLd, type MerchItem } from '@swift2/content-enrichment';

export function MerchCard({ item }: { item: MerchItem }) {
  const q = useReader();
  // Affiliate ids come from the host (web supplies them, the app none): never the process env.
  const affiliate = useHost().env.affiliate;
  const renderer = useMemo(() => createHostShopLinkRenderer(affiliate ?? {}), [affiliate]);
  const { openItem } = useAppActions();
  const soldOut = item.inStock === false;
  const showsMatch = item.category === 'shop-the-look';
  const exactPiece = item.matchTier ? item.matchTier === 'exact' : item.isAlternative !== true;
  const monogram = item.brand.charAt(0) || '?';
  const moment = item.source ? q.getContentItem(item.source.momentId) : undefined;
  const image = merchItemImage(item, q.getContentItem);
  const productLabel = showsMatch
    ? exactPiece
      ? 'The exact piece'
      : 'We found something similar'
    : item.category === 'official-store'
      ? 'Official item'
      : 'Fan-made item';
  const shopLink = renderer.forMerchItem(item);
  const shopAriaLabel = `Shop ${item.brand} ${item.item}${soldOut ? ' (sold out)' : ''}${showsMatch && !exactPiece ? ' (similar style, not the exact piece)' : ''}`;
  const alternateLink = item.altListing
    ? item.category === 'official-store'
      ? renderer.forMerch(item.altListing, 'official')
      : renderer.forMerchItem({ ...item, ...item.altListing })
    : undefined;
  const showsAmazon =
    renderer.isAmazonMerchItem(item) ||
    (item.altListing
      ? item.category === 'official-store'
        ? renderer.isAmazonMerch(item.altListing, 'official')
        : renderer.isAmazonMerchItem({ ...item, ...item.altListing })
      : false);
  // SEO (SPEC.merch-autonomy.md §9): schema.org Product JSON-LD, `offers`
  // included only when merchProductJsonLd() itself finds a fresh,
  // machine-verified price+stock pair — never asserted here.
  const productJsonLd = merchProductJsonLd(item);

  return (
    <li
      className={`border border-[color:var(--merch-line)] bg-[color:var(--merch-ink-2)]${soldOut ? ' opacity-50' : ''}`}
    >
      <script
        type="application/ld+json"
        suppressHydrationWarning
        // Derived from authored/verified catalogue data, not user input —
        // the `<` strip matches app/layout.tsx's existing JSON-LD script.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <div
        className={
          image.kind === 'split'
            ? 'grid grid-cols-2 gap-px bg-[color:var(--merch-line)]'
            : undefined
        }
      >
        {image.kind === 'split' && (
          <>
            {/* D7=C (t_28e3ad2a / t_c71f0eea): full-consistency reading —
                the moment half is now also a buy link, same as the product
                half, so no non-clickable Taylor photo remains anywhere in
                shop-the-look. */}
            <MerchCardHalf
              label="Her look, not the product"
              imageUrl={image.momentUrl}
              monogram={monogram}
              shopHref={shopLink.href}
              shopAriaLabel={shopAriaLabel}
            />
            <MerchCardHalf
              label={productLabel}
              imageUrl={image.productUrl}
              monogram={monogram}
              shopHref={shopLink.href}
              shopAriaLabel={shopAriaLabel}
            />
          </>
        )}
        {image.kind === 'product' && (
          <MerchCardHalf
            label={productLabel}
            imageUrl={image.url}
            monogram={monogram}
            shopHref={shopLink.href}
            shopAriaLabel={shopAriaLabel}
          />
        )}
        {image.kind === 'moment' && (
          // D7=C (t_28e3ad2a / t_c71f0eea): supersedes the 2026-08-15
          // anti-mislabeling design — the whole tile is now a buy link even
          // though the only photo available is Taylor's own (moment-kind,
          // no separate product photo). The label stays visible so the
          // tile never claims the photo literally depicts the item.
          <MerchCardHalf
            label="Her look, not the product"
            imageUrl={image.url}
            monogram={monogram}
            shopHref={shopLink.href}
            shopAriaLabel={shopAriaLabel}
          />
        )}
        {image.kind === 'monogram' && <MerchCardHalf label={productLabel} monogram={monogram} />}
      </div>

      <div className="p-4">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[color:var(--merch-muted)]">
          {item.brand}
        </span>
        <h3 className="mt-0.5 text-[15px] font-bold leading-snug text-[color:var(--merch-cream)]">
          {item.item}
        </h3>
        {showsMatch && item.matchTier && item.matchTier !== 'unscored' && (
          <span className="mt-2 inline-block border border-[color:var(--merch-lilac)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--merch-lilac)]">
            {item.matchTier} match
          </span>
        )}
        {item.source && (
          <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--merch-muted)]">
            Worn in{' '}
            <span className="text-[color:var(--merch-cream)]">{item.source.momentTitle}</span>
            {moment?.dateLabel ? ` · ${moment.dateLabel}` : ''}
          </p>
        )}

        {showsMatch && !exactPiece && item.altNote && (
          <p className="mt-2 border-l-2 border-[color:var(--merch-lilac)] bg-[color:var(--merch-lilac)]/10 px-2.5 py-1.5 text-xs leading-snug text-[color:var(--merch-cream)]">
            {item.altNote}
          </p>
        )}

        {soldOut && (
          <span className="mt-2 inline-block border border-[color:var(--merch-line)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--merch-muted)]">
            Sold out
          </span>
        )}

        {showsAmazon && (
          <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--merch-muted)]">
            {AMAZON_DISCLOSURE}
          </p>
        )}

        <a
          href={shopLink.href}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          aria-label={shopAriaLabel}
          className="mt-3 flex min-h-[44px] items-center justify-between gap-2 border border-[color:var(--merch-line)] px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--merch-cream)] transition-colors hover:border-[color:var(--merch-lilac)]"
        >
          <span>Shop it{item.price ? ` · ${item.price}` : ''}</span>
          <ExternalLink
            className="h-3.5 w-3.5 shrink-0 text-[color:var(--merch-lilac)]"
            aria-hidden="true"
          />
        </a>

        {alternateLink && (
          <a
            href={alternateLink.href}
            target="_blank"
            rel="nofollow sponsored noopener noreferrer"
            className="mt-2 flex min-h-[44px] items-center justify-between gap-2 border border-[color:var(--merch-line)] px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--merch-cream)] transition-colors hover:border-[color:var(--merch-lilac)]"
          >
            <span>Also at {item.altListing!.retailer}</span>
            <ExternalLink
              className="h-3.5 w-3.5 shrink-0 text-[color:var(--merch-lilac)]"
              aria-hidden="true"
            />
          </a>
        )}

        {(shopLink.isAffiliate || alternateLink?.isAffiliate) && (
          <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--merch-muted)]">
            {SHOP_DISCLOSURE}
          </p>
        )}

        {item.source && (
          <button
            type="button"
            onClick={() => openItem(item.source!.momentId)}
            className="mt-2 inline-flex min-h-[44px] items-center text-xs font-medium text-[color:var(--merch-muted)] underline-offset-2 hover:underline"
          >
            Her look · {item.source.momentTitle}
          </button>
        )}
      </div>
    </li>
  );
}
