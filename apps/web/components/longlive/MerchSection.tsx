'use client';

/**
 * The merch directory (PLAN.md, Joey 2026-08-14). The site links out; there
 * is no on-site payment or checkout (docs/definition-of-done.md item 4a) —
 * every card is a plain outbound link, same seam as MomentDetail's "Shop the
 * look" (buildShopUrl / isAffiliate / SHOP_DISCLOSURE from shop.ts), so the
 * affiliate flip stays the one-file change that seam promises.
 *
 * `@/lib/longlive/merch.ts` (built in parallel by a sibling agent, PLAN.md
 * step 1) assembles `MERCH_CATALOGUE` from three sources: `shopTheLook`
 * (existing "Shop the look" products, each carrying a `source` back-reference
 * to the moment it shops), and `officialStore` / `fanMade`, both genuinely
 * empty until curated data exists for them — rendered as an honest empty
 * state, never an invented placeholder product.
 *
 * Cross-navigation (item 4a): a `source` back-reference opens that exact
 * moment via the existing `useAppActions().openItem` overlay — no new
 * navigation plumbing, the same action MomentDetail itself uses to open.
 */

import { ExternalLink } from 'lucide-react';
import { useAppActions } from '@/lib/longlive/store';
import { buildShopUrl, isAffiliate, SHOP_DISCLOSURE } from '@/lib/longlive/shop';
import { MERCH_CATALOGUE, type MerchCategory, type MerchItem } from '@/lib/longlive/merch';
import { SubmitLinkForm } from './SubmitLinkForm';

const CATEGORY_LABEL: Record<MerchCategory, string> = {
  'shop-the-look': 'Shop the look',
  'official-store': 'Official store',
  'fan-made': 'Fan-made',
};

const CATEGORY_ORDER: readonly MerchCategory[] = ['shop-the-look', 'official-store', 'fan-made'];

function categoryItems(category: MerchCategory): readonly MerchItem[] {
  if (category === 'shop-the-look') return MERCH_CATALOGUE.shopTheLook;
  if (category === 'official-store') return MERCH_CATALOGUE.officialStore;
  return MERCH_CATALOGUE.fanMade;
}

export function MerchSection() {
  const categories = CATEGORY_ORDER.map((category) => ({ category, items: categoryItems(category) }));
  const anyAffiliate = categories.some((group) => group.items.some(isAffiliate));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:pr-8">
      <header>
        <h1 className="font-[family-name:var(--era-font)] text-3xl font-semibold text-[color:var(--era-ink)]">
          Merch
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          Every link here sends you to buy elsewhere — nothing checks out on this site.
        </p>
      </header>

      <div className="mt-8 space-y-10">
        {categories.map((group) => (
          <section key={group.category} aria-label={CATEGORY_LABEL[group.category]}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
              {CATEGORY_LABEL[group.category]}
            </h2>
            {group.items.length === 0 ? (
              <p className="mt-3 text-sm text-[color:var(--era-ink-soft)]">
                Nothing curated here yet — check back soon.
              </p>
            ) : (
              <ul className="mt-3 grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6">
                {group.items.map((item, i) => (
                  <MerchCard key={`${item.url}-${i}`} item={item} />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {anyAffiliate && (
        <p className="mt-6 text-[11px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
          {SHOP_DISCLOSURE}
        </p>
      )}

      <SubmitLinkForm section="merch" />
    </div>
  );
}

function MerchCard({ item }: { item: MerchItem }) {
  const { openItem } = useAppActions();
  const soldOut = item.inStock === false;

  return (
    <li className={`era-card rounded-2xl border p-4${soldOut ? ' opacity-50' : ''}`}>
      <a
        href={buildShopUrl(item)}
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        className="group flex items-start justify-between gap-3"
        aria-label={`Shop ${item.brand} ${item.item}${soldOut ? ' (sold out)' : ''}${item.isAlternative ? ' (similar style, not the exact piece)' : ''} at ${item.retailer}`}
      >
        <span className="min-w-0">
          <span className="block text-xs uppercase tracking-[0.12em] text-[color:var(--era-ink-soft)]">
            {item.brand}
          </span>
          <span className="mt-0.5 block text-sm font-medium leading-snug text-[color:var(--era-ink)] group-hover:underline">
            {item.item}
          </span>
          {soldOut && (
            <span className="mt-1.5 inline-block rounded-full border border-[color:var(--era-line)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--era-ink-soft)]">
              Sold out
            </span>
          )}
          {item.isAlternative && (
            <span
              className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[color:var(--era-accent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--era-accent)]"
              title={item.altNote}
            >
              Similar style
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5 text-sm text-[color:var(--era-ink-soft)]">
          {item.price}
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </a>

      {item.source && (
        <button
          type="button"
          onClick={() => openItem(item.source!.momentId)}
          className="mt-3 inline-flex min-h-[44px] items-center text-xs font-medium text-[color:var(--era-accent)] underline-offset-2 hover:underline"
        >
          From {item.source.momentTitle}
        </button>
      )}
    </li>
  );
}
