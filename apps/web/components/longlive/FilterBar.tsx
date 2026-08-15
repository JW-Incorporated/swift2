'use client';

import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Clapperboard, Heart, Mic2, Music, ScrollText, Shirt } from 'lucide-react';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { useIsomorphicLayoutEffect } from '@/lib/longlive/useIsomorphicLayoutEffect';
import { TAG_META } from '@/lib/longlive/tags';
import { TAG_COLORS } from '@/lib/longlive/tagBadges';
import { ALL_FILTERS, type FilterId } from '@/lib/longlive/filters';

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

// The isomorphic guard keeps SSR builds warning-free without changing
// behaviour. It moved to lib/longlive/useIsomorphicLayoutEffect.ts when
// TopBar's sliding indicator needed the same thing — one definition, not one
// per component.

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

  const allActive = filters.size === 0;

  return (
    <div
      data-ll-filterbar
      role="group"
      aria-label="Filter the timeline"
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
        <div className="mx-auto flex max-w-4xl flex-nowrap items-center justify-center gap-1.5 overflow-x-auto scrollbar-none px-4 py-1.5 md:px-6">
          <button
            type="button"
            aria-pressed={allActive}
            onClick={clearFilters}
            className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition"
            style={{
              backgroundColor: allActive ? 'var(--era-accent)' : 'transparent',
              borderColor: 'var(--era-accent)',
              color: allActive ? 'var(--era-bg)' : 'var(--era-ink)',
            }}
          >
            All
          </button>
          {ALL_FILTERS.map((id) => {
            const active = filters.has(id);
            const Icon = FILTER_ICON[id];
            const color = FILTER_COLOR[id];
            const cue = `color-mix(in srgb, ${color} 70%, var(--era-ink))`;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => toggleFilter(id)}
                className="inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition"
                style={{
                  backgroundColor: active ? color : 'transparent',
                  borderColor: active ? color : cue,
                  color: active ? '#fff' : 'var(--era-ink)',
                }}
              >
                <Icon
                  className="h-3 w-3"
                  aria-hidden
                  style={{ color: active ? '#fff' : cue }}
                />
                {FILTER_LABEL[id]}
              </button>
            );
          })}
        </div>
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
