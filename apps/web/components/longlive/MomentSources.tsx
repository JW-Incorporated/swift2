'use client';

// Split out of MomentDetail.tsx (R20). The moment's footer record: the
// citation footnote (with any YouTube citations embedded above it) and the
// "Shop the look" product list.

import { ExternalLink, ShoppingBag } from 'lucide-react';
import type { EggSource, Product } from '@swift2/experience';
import type { FootnoteVideoSource } from '@/lib/longlive/video-affordance';
import { renderMomentShopLink, SHOP_DISCLOSURE } from '@/lib/longlive/shop';
import { MomentVideo } from './MomentVideo';

/** Citations, footnote-scale. Renders nothing when the moment has no sources. */
export function MomentSources({
  sources,
  sourceVideos,
}: {
  sources: EggSource[] | undefined;
  sourceVideos: FootnoteVideoSource[];
}) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-8 border-t pt-4" style={{ borderColor: 'var(--era-line)' }}>
      {/* A source that is a YouTube link embeds as a click-to-play facade
          (poster thumbnail only until the reader opts in — no iframe loads
          on mount, so this stays cheap in the feed), reusing MomentVideo.
          The citation line below still lists every source for the record.

          Which sources land here is decided by footnoteVideoSources,
          which drops only a citation duplicating the moment's own video
          (it would otherwise render twice on one page). Promoting a lone
          citation UP to the lead slot was considered and deliberately not
          done — see detailVideoFor. */}
      {sourceVideos.map((s, i) => (
        <MomentVideo
          key={`src-vid-${s.url}-${i}`}
          video={{ youtubeId: s.youtubeId, title: s.name }}
          caption={s.name}
          className="mb-4"
        />
      ))}
      {/* Footnote-scale, academic-text style — citations belong here on
          the expanded page, small, not competing with the article. */}
      <p className="text-[10px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
        {sources.length > 1 ? 'Sources:' : 'Source:'}{' '}
        {sources.map((s, i) => (
          <span key={`${s.url}-${i}`}>
            {i > 0 && ', '}
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
            >
              {s.name}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}

/**
 * "Shop the look" — the moment's shoppable products (ContentItem.products),
 * each row a DIRECT link to the exact retailer product page. Every href goes
 * through buildShopUrl() (lib/longlive/shop.ts) — never product.url directly
 * — so the later direct→affiliate flip is a one-function change with zero
 * content edits; rel="nofollow sponsored noopener noreferrer" is already the
 * correct annotation for both direct and paid links (noreferrer matches the
 * sources links' privacy posture — retailers don't get the referring moment
 * URL; affiliate attribution lives in the wrapped URL, not the Referer). A
 * product verified sold-out
 * (inStock: false) stays listed for the fashion record but renders dimmed
 * with an explicit "Sold out" label, never silently as purchasable. A
 * product that isn't the exact piece she wore (isAlternative: true — the
 * real one is custom/couture/discontinued) gets an explicit "Similar style"
 * label plus its altNote, never presented as the literal garment.
 */
export function ShopTheLook({
  products,
  context,
}: {
  products: Product[] | undefined;
  context: { eraId: string; momentId: string };
}) {
  if (!products || products.length === 0) return null;
  return (
    <div className="era-card mt-8 rounded-2xl border p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
        <ShoppingBag className="h-4 w-4" />
        Shop the look
      </div>
      <ul className="mt-3">
        {products.map((p, i) => {
          const soldOut = p.inStock === false;
          const shopLink = renderMomentShopLink(p, context);
          return (
            // border-t on the li itself (not divide-y on the ul): the era-line
            // color must sit on the element that owns the border, since
            // border-color doesn't inherit from the parent.
            <li
              key={`${p.url}-${i}`}
              className={`border-t first:border-t-0${soldOut ? ' opacity-50' : ''}`}
              style={{ borderColor: 'var(--era-line)' }}
            >
              <a
                href={shopLink.href}
                target="_blank"
                rel="nofollow sponsored noopener noreferrer"
                className="group flex items-center justify-between gap-3 py-3"
                aria-label={`Shop ${p.brand} ${p.item}${soldOut ? ' (sold out)' : ''}${p.isAlternative ? ' (similar style, not the exact piece)' : ''} at ${p.retailer}`}
              >
                <span className="min-w-0">
                  <span className="block text-xs uppercase tracking-[0.12em] text-[color:var(--era-ink-soft)]">
                    {p.brand}
                  </span>
                  <span className="mt-0.5 block text-[15px] leading-snug text-[color:var(--era-ink)] underline-offset-2 group-hover:underline">
                    {p.item}
                  </span>
                  {soldOut && (
                    <span
                      className="mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--era-ink-soft)]"
                      style={{ borderColor: 'var(--era-line)' }}
                    >
                      Sold out
                    </span>
                  )}
                  {/* Never let a close match pass as the literal piece she
                      wore (2026-07-20, docs/decisions.md) — same "Sold out"
                      pill treatment, era-accent color so it doesn't read as
                      a warning. */}
                  {p.isAlternative && (
                    <span
                      className="mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--era-accent)]"
                      style={{ borderColor: 'var(--era-accent)' }}
                      title={p.altNote}
                    >
                      Similar style
                    </span>
                  )}
                  {p.isAlternative && p.altNote && (
                    <span className="mt-1 block max-w-[26rem] text-xs leading-snug text-[color:var(--era-ink-soft)]">
                      {p.altNote}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-1.5 text-sm text-[color:var(--era-ink-soft)]">
                  {p.price}
                  <ExternalLink className="h-3.5 w-3.5" />
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      {/* Renders only once buildShopUrl actually returns affiliate links —
          wiring it now is what makes the affiliate flip a shop.ts-only change. */}
      {products.some((product) => renderMomentShopLink(product, context).isAffiliate) && (
        <p className="mt-3 text-[10px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
          {SHOP_DISCLOSURE}
        </p>
      )}
    </div>
  );
}
