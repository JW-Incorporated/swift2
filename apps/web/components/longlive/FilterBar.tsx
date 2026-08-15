'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Clapperboard, Heart, Mic2, Music, ScrollText, Shirt } from 'lucide-react';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { TAG_META } from '@/lib/longlive/tags';
import { TAG_COLORS } from '@/lib/longlive/tagBadges';
import { ALL_FILTERS, type FilterId } from '@/lib/longlive/filters';
import { FilterChipRow, type ChipDef } from '@/lib/longlive/filter-chips';

const FILTER_ICON: Record<FilterId, LucideIcon> = {
  Music,
  Fashion: Shirt,
  Tour: Mic2,
  Relationship: Heart,
  Lore: ScrollText,
  Videos: Clapperboard,
};

const FILTER_LABEL: Record<FilterId, string> = {
  Music: TAG_META.Music.label,
  Fashion: TAG_META.Fashion.label,
  Tour: TAG_META.Tour.label,
  Relationship: TAG_META.Relationship.label,
  Lore: TAG_META.Lore.label,
  Videos: 'Videos',
};

/** Solid identity color per chip. The five topic tags reuse TAG_COLORS (fixed,
 * era-accent-independent — see tagBadges.ts); Videos isn't a ContentTag so it
 * takes the era accent, the pairing EraSection's old per-era Videos chip used. */
const FILTER_COLOR: Record<FilterId, string> = {
  Music: TAG_COLORS.Music,
  Fashion: TAG_COLORS.Fashion,
  Tour: TAG_COLORS.Tour,
  Relationship: TAG_COLORS.Relationship,
  Lore: TAG_COLORS.Lore,
  Videos: 'var(--era-accent)',
};

const FILTER_CHIPS: readonly ChipDef<FilterId>[] = ALL_FILTERS.map((id) => ({
  id,
  label: FILTER_LABEL[id],
  icon: FILTER_ICON[id],
  color: FILTER_COLOR[id],
}));

/**
 * The one global sticky filter row for the whole Eras timeline (R2): the five
 * topic tags plus Videos — six chips, Videos a peer, not a second axis — plus
 * an "All" chip that clears the set. Mounted once by EraStream, never per
 * era, so a chip picked while scrolling stays picked across every era after.
 *
 * Sticks directly under TopBar. TopBar's own height varies (its padding is
 * responsive) — NOT because of TimelineScrubber, whose root is
 * `position: fixed` (SCRUBBER_SHELL_CLASS, timelineScrubberLayout.ts) and so
 * contributes 0 to TopBar's flow height despite rendering inside it in era
 * mode. Rather than hardcode an offset this measures TopBar's live rendered
 * height via ResizeObserver — the same imperative-DOM-measurement pattern
 * EraStream and TimelineScrubber already use for cross-component layout
 * facts. TopBar exposes `data-ll-topbar` for exactly this; this component
 * exposes `data-ll-filterbar` in turn, so chrome-offset.ts's
 * `measureChromeHeight()` can measure both together.
 */
/** SSR-render seed only — the layout effect below overwrites it with the
 *  real measured height BEFORE the browser paints, so this number is never
 *  actually seen (adversarial review finding #5, 2026-08-13: TopBar's mobile
 *  contents are being edited concurrently elsewhere, so any hardcoded number
 *  here would just go stale again — the fix is not depending on this value
 *  being accurate, not picking a better constant). Starting at 0 instead
 *  would park the bar over TopBar for the seed's brief existence instead of
 *  approximately in place. */
const TOPBAR_RESTING_HEIGHT = 52;

// useLayoutEffect is a no-op with a dev warning on the server; this repo's
// FilterBar only ever runs client-side post-hydration in practice, but the
// isomorphic guard keeps SSR builds warning-free without changing behavior.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function FilterBar() {
  const { filters } = useAppState();
  const { toggleFilter, clearFilters } = useAppActions();
  const [top, setTop] = useState(TOPBAR_RESTING_HEIGHT);

  // Layout effect, not a plain effect: this runs synchronously after the DOM
  // commits but BEFORE the browser paints that frame, so the real measured
  // height replaces the seed constant before the reader's eyes ever see it —
  // no post-paint jump, regardless of TopBar's actual (and changing) height
  // or the reader's scroll position on load.
  useIsomorphicLayoutEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-ll-topbar]');
    if (!header) return;
    const update = () => setTop(header.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      data-ll-filterbar
      className="sticky z-30 border-b border-[color:var(--era-line)] bg-[color:var(--era-bg)]/90 backdrop-blur-xl"
      style={{ top }}
    >
      {/* Relative wrapper so the edge-fade below can sit over the scrollable
          row without adding to its height. One line, always (founder: "the
          filters are way too big... one line always") — horizontal scroll
          instead of wrapping, with the fade signalling there's more to the
          right. scrollbar-none hides the mobile scrollbar chrome; the row
          stays reachable by touch/trackpad either way. */}
      <div className="relative">
        <FilterChipRow
          ariaLabel="Filter the timeline"
          chips={FILTER_CHIPS}
          active={filters}
          onToggle={toggleFilter}
          allLabel="All"
          onClearAll={clearFilters}
          className="mx-auto max-w-4xl px-4 py-1.5 md:px-6"
        />
        {/* Edge-fade affordance: reads as "more chips this way" instead of a
            hard cut, without adding a visible scrollbar on mobile. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[color:var(--era-bg)] to-transparent"
        />
      </div>
    </div>
  );
}
