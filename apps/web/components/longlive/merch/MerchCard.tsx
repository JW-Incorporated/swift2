'use client';

/**
 * Merch page redesign (PLAN.md, KEEP: "the split card treatment (On Taylor |
 * the piece) which our data genuinely supports"). Split card for the "Seen
 * on Taylor" grid — every `shopTheLook` item carries a `source` moment, so
 * the left half can always attempt the moment's own real photo (labelled
 * "Her look, not the product" — 2026-08-15, docs/decisions.md — never let a
 * photo of Taylor pass as the product shot) while the right half is the
 * product's own photo when the retailer supplied one, or a monogram tile
 * when it didn't. Never falls back to the moment photo on the right: that
 * would recreate the exact mislabeling the honesty rule above exists to stop.
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
import { hasRealPrimaryImage, primaryImage } from '@/lib/longlive/types';
import { buildShopUrl } from '@/lib/longlive/shop';
import type { MerchItem } from '@/lib/longlive/merch';

function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

function MerchCardHalf({ label, imageUrl, monogram }: { label?: string; imageUrl?: string; monogram: string }) {
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
  const exactPiece = item.isAlternative !== true;
  const monogram = item.brand.charAt(0) || '?';
  const moment = item.source ? getContentItem(item.source.momentId) : undefined;
  const onTaylorImage = moment && hasRealPrimaryImage(moment) ? primaryImage(moment) : undefined;

  return (
    <li className={`border border-[color:var(--merch-line)] bg-[color:var(--merch-ink-2)]${soldOut ? ' opacity-50' : ''}`}>
      <div className="grid grid-cols-2 gap-px bg-[color:var(--merch-line)]">
        <MerchCardHalf label={onTaylorImage ? 'Her look, not the product' : undefined} imageUrl={onTaylorImage} monogram={monogram} />
        <MerchCardHalf label={exactPiece ? 'The exact piece' : 'We found something similar'} imageUrl={item.imageUrl} monogram={monogram} />
      </div>

      <div className="p-4">
        <span className="block text-[11px] uppercase tracking-[0.14em] text-[color:var(--merch-muted)]">{item.brand}</span>
        <h3 className="mt-0.5 text-[15px] font-bold leading-snug text-[color:var(--merch-cream)]">{item.item}</h3>
        {item.source && (
          <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--merch-muted)]">
            Worn in <span className="text-[color:var(--merch-cream)]">{item.source.momentTitle}</span>
            {moment?.dateLabel ? ` · ${moment.dateLabel}` : ''}
          </p>
        )}

        {!exactPiece && item.altNote && (
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
          href={buildShopUrl(item)}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          aria-label={`Shop ${item.brand} ${item.item}${soldOut ? ' (sold out)' : ''}${!exactPiece ? ' (similar style, not the exact piece)' : ''}`}
          className="mt-3 flex min-h-[44px] items-center justify-between gap-2 border border-[color:var(--merch-line)] px-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--merch-cream)] transition-colors hover:border-[color:var(--merch-lilac)]"
        >
          <span>Shop it{item.price ? ` · ${item.price}` : ''}</span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[color:var(--merch-lilac)]" aria-hidden="true" />
        </a>

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
