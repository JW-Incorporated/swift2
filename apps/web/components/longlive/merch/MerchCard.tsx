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
 * the product" (2026-08-15, docs/decisions.md — never let a photo of Taylor
 * pass as the product shot); the product half/image never falls back to the
 * moment photo, which would recreate the exact mislabeling that rule exists
 * to stop.
 *
 * Keeps: real product images, "The exact piece" vs "We found something
 * similar" with the authored `altNote` rendered as visible DOM text (not a
 * hover-only tooltip — invisible on touch, the bug this fixed), and the
 * in-app "Her look" button (`openItem(item.source.momentId)`) that opens
 * MomentDetail — the mockup's card links nowhere.
 */

import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { useAppActions } from '@/lib/longlive/store';
import { getContentItem } from '@/lib/longlive/content';
import { merchItemImage } from '@/lib/longlive/merch-filters';
import {
  buildShopUrl,
  isAffiliateListing,
  renderMerchShopLink,
  SHOP_DISCLOSURE,
} from '@/lib/longlive/shop';
import { merchProductJsonLd, type MerchItem } from '@/lib/longlive/merch';

function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

function MerchCardHalf({
  label,
  imageUrl,
  monogram,
}: {
  label?: string;
  imageUrl?: string;
  monogram: string;
}) {
  return (
    <div className="relative aspect-square overflow-hidden bg-[color:var(--merch-ink)]">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          unoptimized={isRemoteUrl(imageUrl)}
          loading="lazy"
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 45vw, 50vw"
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center font-[family-name:var(--font-bodoni)] text-[28px] text-[color:var(--merch-lilac)]"
        >
          {monogram}
        </span>
      )}
      {label && (
        <span className="absolute left-2 top-2 border border-[rgba(246,239,228,.2)] bg-[rgba(23,16,43,.8)] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-[color:var(--merch-cream)]">
          {label}
        </span>
      )}
    </div>
  );
}

export function MerchCard({ item }: { item: MerchItem }) {
  const { openItem } = useAppActions();
  const soldOut = item.inStock === false;
  const showsMatch = item.category === 'shop-the-look';
  const exactPiece = item.matchTier ? item.matchTier === 'exact' : item.isAlternative !== true;
  const monogram = item.brand.charAt(0) || '?';
  const moment = item.source ? getContentItem(item.source.momentId) : undefined;
  const image = merchItemImage(item);
  const productLabel = showsMatch
    ? exactPiece
      ? 'The exact piece'
      : 'We found something similar'
    : item.category === 'official-store'
      ? 'Official item'
      : 'Fan-made item';
  const shopLink = renderMerchShopLink(item);
  const alternateLink = item.altListing
    ? item.category === 'official-store'
      ? {
          href: buildShopUrl(item.altListing, { bucket: 'official' }),
          isAffiliate: isAffiliateListing(item.altListing, { bucket: 'official' }),
        }
      : renderMerchShopLink({ ...item, ...item.altListing })
    : undefined;
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
            <MerchCardHalf
              label="Her look, not the product"
              imageUrl={image.momentUrl}
              monogram={monogram}
            />
            <MerchCardHalf label={productLabel} imageUrl={image.productUrl} monogram={monogram} />
          </>
        )}
        {image.kind === 'product' && (
          <MerchCardHalf label={productLabel} imageUrl={image.url} monogram={monogram} />
        )}
        {image.kind === 'moment' && (
          <MerchCardHalf
            label="Her look, not the product"
            imageUrl={image.url}
            monogram={monogram}
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

        <a
          href={shopLink.href}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          aria-label={`Shop ${item.brand} ${item.item}${soldOut ? ' (sold out)' : ''}${showsMatch && !exactPiece ? ' (similar style, not the exact piece)' : ''}`}
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
