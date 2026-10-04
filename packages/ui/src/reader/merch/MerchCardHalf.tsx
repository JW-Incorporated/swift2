'use client';

// The split-card half / single image tile of MerchCard (extracted to keep both files under 300 lines).
import { useHost } from '@swift2/ui';

function isRemoteUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
}

/**
 * `shopHref`, when present, makes the whole tile the same buy link as the
 * card's "Shop it" button — reusing `renderMerchShopLink`/`buildShopUrl`
 * via the caller, so it carries the identical affiliate URL and triggers
 * the same FTC disclosure the "Shop it" click does; never a second,
 * independently-built link.
 *
 * SUPERSEDES the 2026-08-15 anti-mislabeling design and the t_49a63ae1 fix,
 * which deliberately withheld `shopHref` from the moment/"Her look, not the
 * product" photo (a photo of Taylor, not the item) to avoid it reading as a
 * buy affordance on a photo that isn't the product. Founder decision D7=C
 * (kanban task t_28e3ad2a / t_c71f0eea, 2026-08-31) explicitly overrides
 * that call: "make the whole tile a buy link even when it's Taylor's photo"
 * — full consistency with "tap the picture to buy," accepting the known
 * mislabeling tradeoff. The "Her look, not the product" label stays visible
 * so the tile never claims the photo literally depicts the item — only that
 * clicking it buys the matched product.
 */
export function MerchCardHalf({
  label,
  imageUrl,
  monogram,
  shopHref,
  shopAriaLabel,
}: {
  label?: string;
  imageUrl?: string;
  monogram: string;
  shopHref?: string;
  shopAriaLabel?: string;
}) {
  const { Image } = useHost();
  const photo = imageUrl ? (
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
  );

  return (
    <div className="relative aspect-square overflow-hidden bg-[color:var(--merch-ink)]">
      {imageUrl && shopHref ? (
        <a
          href={shopHref}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          aria-label={shopAriaLabel}
          className="absolute inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color:var(--merch-lilac)]"
        >
          {photo}
        </a>
      ) : (
        photo
      )}
      {label && (
        <span className="absolute left-2 top-2 border border-[rgba(246,239,228,.2)] bg-[rgba(23,16,43,.8)] px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-[color:var(--merch-cream)]">
          {label}
        </span>
      )}
    </div>
  );
}
