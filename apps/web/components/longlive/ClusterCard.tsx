'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { formatFullDate } from '@/lib/longlive/format';
import { MomentCard } from './MomentCard';
import type { ContentItem, Era } from '@/lib/longlive/types';
import type { CardTier } from '@/lib/longlive/feed-tiers';
import { cn } from '@/lib/utils';

/**
 * A release-day pileup (#696) collapsed into one card: a same-day run of
 * `CLUSTER_MIN_SIZE`+ moments (era-feed-clusters.ts) reads as one deliberate
 * "release day, track by track" chapter instead of a wall of identical-date
 * cards. Collapsed by default; expanding renders every story as its normal
 * `MomentCard` (own tier, own video affordance, own tap-to-open) — nothing
 * is summarized, dropped, or re-tiered, only the initial scroll is shorter.
 */
export function ClusterCard({
  items,
  sortDate,
  eraId,
  tiers,
  videoOwnerIds,
  imageHiddenIds,
  onOpenItem,
}: {
  items: ContentItem[];
  /** `Anchored.sortDate` shared by every item in this cluster (YYYY-MM-DD). */
  sortDate: string;
  eraId: Era['id'];
  tiers: Map<string, CardTier>;
  videoOwnerIds: Set<string>;
  imageHiddenIds: Set<string>;
  onOpenItem: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const panelId = `ll-cluster-${eraId}-${sortDate}`;

  return (
    <li
      className="relative min-w-0 scroll-mt-28 md:col-span-2"
      data-ll-item={`era-cluster-${eraId}-${sortDate}`}
      data-ll-era={eraId}
      data-ll-date={new Date(`${sortDate}T00:00:00Z`).getTime()}
    >
      <div className="era-card block w-full rounded-2xl border p-5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls={panelId}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="min-w-0">
            <span className="block text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
              {formatFullDate(sortDate)}
            </span>
            <h3 className="mt-1 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">
              Release day, track by track — {items.length} stories
            </h3>
          </span>
          <ChevronDown
            aria-hidden
            className={cn('h-5 w-5 shrink-0 transition-transform', expanded && 'rotate-180')}
          />
        </button>

        {!expanded && (
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
            {items
              .slice(0, 3)
              .map((it) => it.title)
              .join(', ')}
            {items.length > 3 ? `, and ${items.length - 3} more` : ''}
          </p>
        )}
      </div>

      {expanded && (
        <ol
          id={panelId}
          className="mt-4 grid grid-cols-1 items-start gap-5 md:grid-cols-2 md:gap-6"
        >
          {items.map((item) => (
            <MomentCard
              key={item.id}
              item={item}
              tier={tiers.get(item.id) ?? 'text'}
              ownsVideo={videoOwnerIds.has(item.id)}
              hideImage={imageHiddenIds.has(item.id)}
              onOpen={() => onOpenItem(item.id)}
            />
          ))}
        </ol>
      )}
    </li>
  );
}
