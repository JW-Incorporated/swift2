'use client';

/**
 * "Seen on Taylor" — the one populated merch bucket (PLAN.md). Owns its own
 * era-filter + real-filter state so `MerchSection.tsx` stays a plain
 * composition of sections. `EraSpine` filters (never anchor-jumps) the 156
 * `shopTheLook` items; the real filter row sits in the mockup garment-type
 * row's visual POSITION per R1 — it never fakes a `kind` field that doesn't
 * exist on `Product`.
 */

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { getContentItem } from '@/lib/longlive/content';
import { ERAS, getEra } from '@/lib/longlive/eras';
import { MERCH_CATALOGUE, type MerchItem } from '@/lib/longlive/merch';
import {
  merchMatchesFilter,
  ALL_MERCH_FILTERS,
  MERCH_FILTER_LABEL,
  MERCH_KIND_LABEL,
  merchKinds,
  type MerchFilterId,
} from '@/lib/longlive/merch-filters';
import type { EraId, Product } from '@/lib/longlive/types';
import { EraSpine, type EraSpineEntry } from './EraSpine';
import { MerchCard } from './MerchCard';
import { MerchEmptyPanel } from './MerchEmptyPanel';

const PAGE_SIZE = 9;

function FilterPill({
  active,
  accent,
  onClick,
  children,
}: {
  active: boolean;
  accent: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="min-h-[36px] border px-3 py-[7px] text-[11px] font-medium uppercase tracking-[0.14em] transition-colors hover:text-[color:var(--merch-cream)]"
      style={{
        backgroundColor: active ? accent : 'transparent',
        borderColor: active ? accent : 'transparent',
        color: active ? 'var(--merch-ink)' : 'var(--merch-muted)',
      }}
    >
      {children}
    </button>
  );
}

export function MerchStyleSection() {
  const [activeEraKey, setActiveEraKey] = useState<string>('all');
  const [activeFilters, setActiveFilters] = useState<ReadonlySet<MerchFilterId>>(new Set());
  const [activeKind, setActiveKind] = useState<NonNullable<Product['kind']> | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const toggleFilter = (id: MerchFilterId) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearFilters = () => setActiveFilters(new Set());
  const resetAll = () => {
    setActiveEraKey('all');
    clearFilters();
    setActiveKind(null);
  };

  // Counts respond to the active price/stock/exact filters, same as the
  // mockup's own type-row-driven era counts — but never to era itself
  // (every era option must stay comparable against the same filtered pool).
  const filterMatched = useMemo(
    () =>
      MERCH_CATALOGUE.shopTheLook.filter(
        (item) =>
          merchMatchesFilter(item, activeFilters) && (!activeKind || item.kind === activeKind),
      ),
    [activeFilters, activeKind],
  );

  const eraSpineEntries: readonly EraSpineEntry[] = useMemo(() => {
    const counts = new Map<EraId, number>();
    for (const item of filterMatched) {
      if (!item.source) continue;
      counts.set(item.source.eraId, (counts.get(item.source.eraId) ?? 0) + 1);
    }
    const allGradient = `linear-gradient(90deg, ${ERAS.map((e) => e.theme.accent).join(', ')})`;
    return [
      {
        key: 'all',
        name: 'All eras',
        year: 'All',
        color: allGradient,
        count: filterMatched.length,
      },
      ...ERAS.map((era) => ({
        key: era.id,
        name: era.shortName,
        year: era.yearLabel,
        color: era.theme.accent,
        count: counts.get(era.id) ?? 0,
      })),
    ];
  }, [filterMatched]);

  // If the active era's count drops to zero (a filter change zeroed it out),
  // fall back to "All eras" rather than leaving the reader stuck on a
  // now-disabled entry — same recovery the mockup's own type-row does.
  useEffect(() => {
    if (activeEraKey === 'all') return;
    const entry = eraSpineEntries.find((e) => e.key === activeEraKey);
    if (!entry || entry.count === 0) setActiveEraKey('all');
  }, [activeEraKey, eraSpineEntries]);

  const filteredItems = useMemo(() => {
    const pool =
      activeEraKey === 'all'
        ? filterMatched
        : filterMatched.filter((item) => item.source?.eraId === activeEraKey);
    const dateOf = (item: MerchItem) =>
      item.source ? (getContentItem(item.source.momentId)?.date ?? '') : '';
    return [...pool].sort((a, b) => dateOf(b).localeCompare(dateOf(a)));
  }, [filterMatched, activeEraKey]);

  useEffect(() => setVisibleCount(PAGE_SIZE), [activeEraKey, activeFilters, activeKind]);

  const pageItems = filteredItems.slice(0, visibleCount);
  const remaining = filteredItems.length - pageItems.length;
  const activeEra = activeEraKey !== 'all' ? getEra(activeEraKey) : undefined;
  const filtersActive = activeEraKey !== 'all' || activeFilters.size > 0 || activeKind !== null;
  const tallyLabel = [
    activeEra ? `${activeEra.shortName} (${activeEra.yearLabel})` : null,
    activeFilters.size > 0
      ? [...activeFilters].map((id) => MERCH_FILTER_LABEL[id]).join(', ')
      : null,
    activeKind ? MERCH_KIND_LABEL[activeKind] : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <>
      <div>
        <EraSpine entries={eraSpineEntries} activeKey={activeEraKey} onSelect={setActiveEraKey} />
        <div className="-mt-px flex flex-wrap items-center gap-3 border-x border-b border-[color:var(--merch-line-strong)] bg-[color:var(--merch-ink-2)]/60 px-[18px] py-[11px]">
          <span className="text-[10px] uppercase tracking-[0.22em] text-[color:var(--merch-muted)]">
            Narrow by
          </span>
          <div className="flex flex-wrap gap-px">
            <FilterPill
              active={activeFilters.size === 0}
              accent="var(--merch-lilac)"
              onClick={clearFilters}
            >
              All items
            </FilterPill>
            {ALL_MERCH_FILTERS.map((id) => (
              <FilterPill
                key={id}
                active={activeFilters.has(id)}
                accent="var(--merch-lilac)"
                onClick={() => toggleFilter(id)}
              >
                {MERCH_FILTER_LABEL[id]}
              </FilterPill>
            ))}
            {merchKinds(MERCH_CATALOGUE.shopTheLook).map((kind) => (
              <FilterPill
                key={kind}
                active={activeKind === kind}
                accent="var(--merch-lilac)"
                onClick={() => setActiveKind((current) => (current === kind ? null : kind))}
              >
                {MERCH_KIND_LABEL[kind]}
              </FilterPill>
            ))}
          </div>
        </div>
      </div>

      <div className="my-6 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-[color:var(--merch-muted)]">
        <span>
          Showing <b className="font-medium text-[color:var(--merch-cream)]">{pageItems.length}</b>{' '}
          of <b className="font-medium text-[color:var(--merch-cream)]">{filteredItems.length}</b>{' '}
          looks
        </span>
        {filtersActive && (
          <>
            <span>
              in <b className="font-medium text-[color:var(--merch-cream)]">{tallyLabel}</b>
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="min-h-[28px] border px-[11px] py-[5px] text-[10px] uppercase tracking-[0.16em]"
              style={{ borderColor: 'var(--merch-lilac)', color: 'var(--merch-lilac)' }}
            >
              Clear filters ×
            </button>
          </>
        )}
      </div>

      {filteredItems.length === 0 ? (
        <MerchEmptyPanel message="Nothing catalogued here yet. Try another era, or tell us what we missed." />
      ) : (
        <ul className="grid grid-cols-1 items-start gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((item, i) => (
            <MerchCard key={`${item.url}-${i}`} item={item} />
          ))}
        </ul>
      )}

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
          className="mx-auto mt-8 block min-h-[44px] border px-7 text-[11px] font-medium uppercase tracking-[0.2em] text-[color:var(--merch-muted)] transition-colors hover:text-[color:var(--merch-cream)]"
          style={{ borderColor: 'var(--merch-line)' }}
        >
          Load {Math.min(PAGE_SIZE, remaining)} more
        </button>
      )}
    </>
  );
}
