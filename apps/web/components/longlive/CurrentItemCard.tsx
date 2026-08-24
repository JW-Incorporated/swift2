'use client';

import { Radio } from 'lucide-react';
import type { CurrentItem } from '@swift2/shared';
import type { EraId } from '@/lib/longlive/types';
import { formatFullDate } from '@/lib/longlive/format';
import { outletFor } from '@/lib/longlive/current-feed';

/**
 * A live `current_item` card in the feed (PLAN.md Stage 5). Same full-width
 * `era-card` silhouette as `DoorwayCard.tsx` (one `<button>` body, no nested
 * interactive elements, `md:col-span-2`) so a live update reads as part of
 * the timeline rather than an ad — but with the dashed-unconfirmed border
 * `MomentDetail.tsx`'s `RumorSection`/`ConfidenceBanner` use for anything
 * not yet confirmed, since every current_item is provisional by definition
 * (it hasn't been promoted into the Vault yet).
 *
 * `data-ll-item`/`data-ll-era`/`data-ll-date`/`data-ll-exact` match every
 * other feed card so TimelineScrubber measures these as real rail anchors —
 * always `data-ll-exact="1"`, since `observedOn` is always a real, authored
 * date (see current-feed.ts's `currentFeedEntries`, never era-scattered).
 */
export function CurrentItemCard({
  item,
  eraId,
  sortDate,
  displayDate,
  onOpen,
}: {
  item: CurrentItem;
  eraId: EraId;
  /** Positioning only — see anchor-date.ts's honesty rule. Never rendered. */
  sortDate: string;
  /** Always non-null for a current item (observedOn is always exact). */
  displayDate: string | null;
  onOpen: () => void;
}) {
  const outlet = outletFor(item);
  return (
    <li
      className="relative min-w-0 scroll-mt-28 md:col-span-2"
      data-ll-item={`era-current-${item.id}`}
      data-ll-era={eraId}
      data-ll-date={new Date(sortDate).getTime()}
      data-ll-exact={displayDate != null ? '1' : '0'}
    >
      <button
        onClick={onOpen}
        className="era-card group block w-full rounded-2xl border-2 border-dashed p-5 text-left transition"
        style={{ borderColor: 'var(--era-accent)' }}
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--era-accent)]">
          <Radio className="h-3.5 w-3.5" aria-hidden />
          Live{outlet ? ` · reported by ${outlet}` : ''}
        </span>
        <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">
          {item.headline}
        </h3>
        {displayDate && (
          <p className="mt-1 text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
            {formatFullDate(displayDate)}
          </p>
        )}
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">{item.summary}</p>
      </button>
    </li>
  );
}
