'use client';

/**
 * The merch directory (PLAN.md, Joey 2026-08-14). The site links out; there
 * is no on-site payment or checkout (docs/definition-of-done.md item 4a) —
 * every card is a plain outbound link, same seam as MomentDetail's "Shop the
 * look" (buildShopUrl / isAffiliate / SHOP_DISCLOSURE from shop.ts), so the
 * affiliate flip stays the one-file change that seam promises.
 *
 * `@/lib/longlive/merch.ts` assembles `MERCH_CATALOGUE` from three buckets:
 * `shopTheLook` (156 products already attached to fashion moments, each
 * carrying a `source` back-reference to the moment it shops), and
 * `officialStore` / `fanMade`, both genuinely empty until curated data
 * exists. `@/lib/longlive/merch-filters.ts` groups whichever bucket(s) are
 * showing into era sections (newest era first) and drives the page's own
 * in-stock / exact-piece / price-band filters.
 *
 * The official/fan-made selector is render-gated rather than hardcoded on:
 * a source chip appears only for a bucket that actually has ≥1 item, and the
 * whole selector row appears only once ≥2 buckets are non-empty. Today only
 * `shopTheLook` has data, so the row renders nothing and the page just shows
 * that bucket's era sections directly — no dead toggle, no empty stub.
 *
 * Cross-navigation (item 4a): a `source` back-reference opens that exact
 * moment via the existing `useAppActions().openItem` overlay — no new
 * navigation plumbing, the same action MomentDetail itself uses to open.
 */

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ExternalLink } from 'lucide-react';
import { useAppActions } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { buildShopUrl, isAffiliate, SHOP_DISCLOSURE } from '@/lib/longlive/shop';
import { MERCH_CATALOGUE, type MerchCategory, type MerchItem } from '@/lib/longlive/merch';
import {
  merchByEra,
  merchItemImage,
  merchMatchesFilter,
  ALL_MERCH_FILTERS,
  MERCH_FILTER_LABEL,
  type MerchFilterId,
} from '@/lib/longlive/merch-filters';
import { merchEraSectionId, merchGroupsToChips, merchSummary, suggestLinkSectionId } from '@/lib/longlive/section-jump';
import { FilterChipRow, type ChipDef } from '@/lib/longlive/filter-chips';
import { SectionJumpBar, SuggestLinkBanner } from './SectionJumpBar';
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

const SOURCE_CHIPS: readonly ChipDef<MerchCategory>[] = CATEGORY_ORDER.map((id) => ({
  id,
  label: CATEGORY_LABEL[id],
}));

const MERCH_FILTER_CHIPS: readonly ChipDef<MerchFilterId>[] = ALL_MERCH_FILTERS.map((id) => ({
  id,
  label: MERCH_FILTER_LABEL[id],
}));

export function MerchSection() {
  const nonEmptyCategories = useMemo(() => CATEGORY_ORDER.filter((c) => categoryItems(c).length > 0), []);
  const [activeSource, setActiveSource] = useState<Set<MerchCategory>>(new Set());
  const [activeFilters, setActiveFilters] = useState<Set<MerchFilterId>>(new Set());

  const toggleSource = (id: MerchCategory) => setActiveSource(new Set(activeSource.has(id) ? [] : [id]));
  const clearSource = () => setActiveSource(new Set());

  const toggleFilter = (id: MerchFilterId) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearFilters = () => setActiveFilters(new Set());

  const visibleItems = useMemo(() => {
    if (activeSource.size > 0) {
      const [only] = activeSource;
      return categoryItems(only);
    }
    return nonEmptyCategories.flatMap(categoryItems);
  }, [activeSource, nonEmptyCategories]);

  // Baseline era groups (source-filtered only) — every header's "of N" figure
  // comes from here, so a stock/price/exact-piece filter can zero out a
  // section without making it vanish (below).
  const totalGroups = useMemo(() => merchByEra(visibleItems), [visibleItems]);

  // The jump bar's own preview of depth — always the FULL catalogue,
  // independent of the source/stock/price filters above (an index shows
  // total depth, not the currently filtered view; today there's only one
  // non-empty source bucket so the two agree in practice).
  const jumpGroups = useMemo(() => merchByEra(), []);
  const jumpChips = useMemo(
    () => merchGroupsToChips(jumpGroups, (eraId) => getEra(eraId).theme.accent),
    [jumpGroups],
  );
  const jumpSummaryText = merchSummary(MERCH_CATALOGUE.shopTheLook.length, jumpChips.length);

  const filteredByEra = useMemo(() => {
    const filteredItems = visibleItems.filter((item) => merchMatchesFilter(item, activeFilters));
    return new Map(merchByEra(filteredItems).map((g) => [g.eraId, g]));
  }, [visibleItems, activeFilters]);

  const anyAffiliate = CATEGORY_ORDER.some((c) => categoryItems(c).some(isAffiliate));
  const filtersActive = activeFilters.size > 0;

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

      <div className="mt-5">
        <SuggestLinkBanner id={suggestLinkSectionId('merch')} label="Found something we should add? Suggest it" />
      </div>

      {jumpChips.length > 0 && (
        <div className="mt-6">
          <SectionJumpBar
            ariaLabel="Jump to merch era"
            variant="rest"
            summary={jumpSummaryText}
            chips={jumpChips}
          />
        </div>
      )}

      {nonEmptyCategories.length >= 2 && (
        <div className="mt-6">
          <FilterChipRow
            ariaLabel="Merch source"
            chips={SOURCE_CHIPS.filter((c) => nonEmptyCategories.includes(c.id))}
            active={activeSource}
            onToggle={toggleSource}
            allLabel="All"
            onClearAll={clearSource}
          />
        </div>
      )}

      {visibleItems.length > 0 && (
        <div className="mt-4">
          <FilterChipRow
            ariaLabel="Filter merch"
            chips={MERCH_FILTER_CHIPS}
            active={activeFilters}
            onToggle={toggleFilter}
            allLabel="All"
            onClearAll={clearFilters}
          />
        </div>
      )}

      <div className="mt-8 space-y-10">
        {totalGroups.length === 0 ? (
          <p className="text-sm text-[color:var(--era-ink-soft)]">Nothing curated here yet — check back soon.</p>
        ) : (
          totalGroups.map((group) => {
            const filteredGroup = filteredByEra.get(group.eraId);
            const matchCount = filteredGroup?.items.length ?? 0;
            return (
              <section key={group.eraId} id={merchEraSectionId(group.eraId)} aria-label={group.eraLabel}>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                  {group.eraLabel}
                </h2>
                <p className="mt-0.5 text-xs text-[color:var(--era-ink-soft)]">
                  {filtersActive
                    ? `${matchCount} of ${group.count} match`
                    : `${group.count} piece${group.count === 1 ? '' : 's'}`}
                </p>
                {matchCount > 0 && (
                  <ul className="mt-3 grid grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-5">
                    {filteredGroup!.items.map((item, i) => (
                      <MerchCard key={`${item.url}-${i}`} item={item} />
                    ))}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </div>

      {anyAffiliate && (
        <p className="mt-6 text-[11px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
          {SHOP_DISCLOSURE}
        </p>
      )}

      <div id={suggestLinkSectionId('merch')}>
        <SubmitLinkForm section="merch" />
      </div>
    </div>
  );
}

export function MerchCard({ item }: { item: MerchItem }) {
  const { openItem } = useAppActions();
  const soldOut = item.inStock === false;
  const exactPiece = item.isAlternative !== true;
  const image = merchItemImage(item);

  return (
    <li className={`era-card rounded-2xl border p-4${soldOut ? ' opacity-50' : ''}`}>
      <a
        href={buildShopUrl(item)}
        target="_blank"
        rel="nofollow sponsored noopener noreferrer"
        className="group flex items-start gap-3"
        aria-label={`Shop ${item.brand} ${item.item}${soldOut ? ' (sold out)' : ''}${!exactPiece ? ' (similar style, not the exact piece)' : ''} at ${item.retailer}`}
      >
        <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg md:h-[88px] md:w-[88px]">
          {image.kind === 'photo' ? (
            <Image
              src={image.url}
              alt=""
              fill
              unoptimized={/^https?:\/\//.test(image.url)}
              loading="lazy"
              sizes="(min-width: 768px) 88px, 72px"
              className="object-cover"
            />
          ) : (
            <span
              className="flex h-full w-full items-center justify-center bg-[color:var(--era-surface-2)] font-[family-name:var(--era-font)] text-[28px] text-[color:var(--era-accent)]"
              aria-hidden="true"
            >
              {item.brand.charAt(0)}
            </span>
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-xs uppercase tracking-[0.12em] text-[color:var(--era-ink-soft)]">
            {item.brand}
          </span>
          <span className="mt-0.5 line-clamp-2 block text-sm font-medium leading-snug text-[color:var(--era-ink)] group-hover:underline">
            {item.item}
          </span>
          <span className="mt-1 flex items-center gap-1.5 text-sm text-[color:var(--era-ink-soft)]">
            {item.price}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {soldOut && (
              <span className="inline-block rounded-full border border-[color:var(--era-line)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--era-ink-soft)]">
                Sold out
              </span>
            )}
            {exactPiece && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--era-accent)] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[color:var(--era-accent)]">
                The exact piece
              </span>
            )}
          </span>
          {!exactPiece && (
            <span
              className="mt-1.5 block rounded-lg border px-2.5 py-1.5"
              style={{ backgroundColor: 'var(--status-pending)', borderColor: 'var(--status-pending-ink)' }}
              title={item.altNote}
            >
              <span className="block text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--status-pending-ink)' }}>
                We found something similar
              </span>
              {item.altNote && (
                <span className="mt-0.5 block text-xs leading-snug text-[color:var(--era-ink)]">{item.altNote}</span>
              )}
            </span>
          )}
        </span>
      </a>

      {item.source && (
        <button
          type="button"
          onClick={() => openItem(item.source!.momentId)}
          className="mt-3 inline-flex min-h-[44px] items-center text-xs font-medium text-[color:var(--era-ink-soft)] underline-offset-2 hover:underline"
        >
          Her look · {item.source.momentTitle}
        </button>
      )}
    </li>
  );
}
