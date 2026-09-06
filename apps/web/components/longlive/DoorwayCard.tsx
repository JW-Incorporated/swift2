'use client';

import { ArrowRight, Egg, Gem, Heart, HelpCircle, RefreshCw, Shirt, Sparkles } from 'lucide-react';
import type { ThreadDoorway, EggDoorway } from '@swift2/experience';
import type { EraId, LensId } from '@swift2/experience';
import { formatMonthYear } from '@swift2/experience';

/**
 * Timeline doorway cards (PLAN.md P3 step 15) — thread and egg variants.
 * Same silhouette as `VideoMomentCard` (full-width `era-card`, one `<button>`
 * body, no nested interactive elements) so a doorway reads as part of the
 * story rather than an advert, per the mockup: "same card shape as a moment,
 * so it reads as part of the story." Desktop: `md:col-span-2` spans both grid
 * columns, so a doorway reads as a chapter break rather than another moment.
 *
 * `data-ll-item`/`data-ll-era`/`data-ll-date` match every other feed card so
 * TimelineScrubber measures doorways as real rail anchors (see anchor-date.ts
 * and PLAN.md P3 step 14a — the date rendered here is only ever the honest
 * `displayDate`, never the synthetic `sortDate` a clamped/scattered anchor
 * carries). `data-ll-exact` tells the scrubber whether THIS position's date
 * may ever be shown/announced (adversarial review finding #1, 2026-08-13) —
 * a thread doorway carries it when it has a real `displayDate`, an egg
 * doorway never does (era-scatter only).
 *
 * `isAnchor` (adversarial review finding #2, 2026-08-13): false for a
 * doorway `spaceDoorways` displaced to satisfy the gap rule — it kept its
 * original `sortDate` for ordering, but its rendered position no longer
 * matches that date, so it must not vote in the scrubber's rail-anchor set
 * (see space-doorways.ts). `data-ll-date`/`data-ll-exact` are omitted
 * entirely in that case rather than sent with a misleading value, so
 * TimelineScrubber's `[data-ll-item][data-ll-era]` query still finds the
 * element (nothing else depends on that) but `measure()` skips it for
 * having no date.
 */

/** One stable icon per thread — same pairing EraSection's old pivot strip
 * used, extended to the two theory/egg threads for the doorway card's icon. */
const THREAD_ICONS: Partial<Record<LensId, typeof Heart>> = {
  'love-story': Heart,
  fashion: Shirt,
  'taylors-version': RefreshCw,
  'the-proposal': Gem,
  'easter-eggs': Egg,
  'hidden-clues': HelpCircle,
};

export function ThreadDoorwayCard({
  doorway,
  eraId,
  sortDate,
  displayDate,
  isAnchor,
  onOpen,
}: {
  doorway: ThreadDoorway;
  eraId: EraId;
  /** Positioning only — see anchor-date.ts's honesty rule. Never rendered. */
  sortDate: string;
  /** Rendered only when non-null — a real, authored date. */
  displayDate: string | null;
  /** False when `spaceDoorways` displaced this card — see the header note. */
  isAnchor: boolean;
  onOpen: () => void;
}) {
  const Icon = THREAD_ICONS[doorway.threadId] ?? Sparkles;
  return (
    <li
      className="relative min-w-0 scroll-mt-28 md:col-span-2"
      data-ll-item={`era-thread-${eraId}-${doorway.threadId}`}
      data-ll-era={eraId}
      data-ll-date={isAnchor ? new Date(sortDate).getTime() : undefined}
      data-ll-exact={isAnchor ? (displayDate != null ? '1' : '0') : undefined}
    >
      <button
        onClick={onOpen}
        className="era-card group block w-full rounded-2xl border p-5 text-left transition"
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-[color:var(--era-accent-text)]">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {doorway.kicker}
        </span>
        <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">
          {doorway.title}
        </h3>
        {displayDate && (
          <p className="mt-1 text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
            {formatMonthYear(displayDate)}
          </p>
        )}
        <p className="mt-1.5 text-sm italic leading-relaxed text-[color:var(--era-ink-soft)]">
          &ldquo;{doorway.example}&rdquo;
        </p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--era-accent-text)]">
          Follow this thread
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </button>
    </li>
  );
}

export function EggDoorwayCard({
  doorway,
  eraId,
  sortDate,
  isAnchor,
  onOpen,
}: {
  doorway: EggDoorway;
  eraId: EraId;
  /** Positioning only — every egg doorway anchors via era-scatter (never
   * exact), so there is no displayDate to accept here at all. */
  sortDate: string;
  /** False when `spaceDoorways` displaced this card — see the header note. */
  isAnchor: boolean;
  onOpen: () => void;
}) {
  const Icon = doorway.threadId ? (THREAD_ICONS[doorway.threadId] ?? Egg) : Egg;
  return (
    <li
      className="relative min-w-0 scroll-mt-28 md:col-span-2"
      data-ll-item={`era-egg-${doorway.eggId}`}
      data-ll-era={eraId}
      data-ll-date={isAnchor ? new Date(sortDate).getTime() : undefined}
      data-ll-exact={isAnchor ? '0' : undefined}
    >
      <button
        onClick={onOpen}
        className="era-card group block w-full rounded-2xl border p-5 text-left transition"
      >
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-[color:var(--era-accent-text)]">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {doorway.kicker}
        </span>
        <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">
          {doorway.title}
        </h3>
        <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--era-accent-text)]">
          See this in Theories &amp; eggs
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
        </span>
      </button>
    </li>
  );
}
