'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Clapperboard, Heart, Mic2, Music, ScrollText, Shirt } from 'lucide-react';
import { useAppActions, useAppState } from '@/lib/longlive/store';
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
 * Sticks directly under TopBar. TopBar's own height varies (it grows a
 * TimelineScrubber row in era mode, and its padding is responsive), so rather
 * than hardcode an offset this measures TopBar's live rendered height via
 * ResizeObserver — the same imperative-DOM-measurement pattern EraStream and
 * TimelineScrubber already use for cross-component layout facts. TopBar
 * exposes `data-ll-topbar` for exactly this.
 */
/** TopBar's shipped resting height. Only the seed value: the effect below
 *  measures the real one before the user can scroll. Starting at 0 instead
 *  would park the bar over TopBar for a frame and visibly jump on load. */
const TOPBAR_RESTING_HEIGHT = 52;

export function FilterBar() {
  const { filters } = useAppState();
  const { toggleFilter, clearFilters } = useAppActions();
  const [top, setTop] = useState(TOPBAR_RESTING_HEIGHT);

  useEffect(() => {
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
      role="group"
      aria-label="Filter the timeline"
      className="sticky z-30 border-b border-[color:var(--era-line)] bg-[color:var(--era-bg)]/90 backdrop-blur-xl"
      style={{ top }}
    >
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 py-2 md:px-6">
        <button
          type="button"
          aria-pressed={allActive}
          onClick={clearFilters}
          className="inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-semibold transition"
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
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition"
              style={{
                backgroundColor: active ? color : 'transparent',
                borderColor: active ? color : cue,
                color: active ? '#fff' : 'var(--era-ink)',
              }}
            >
              <Icon
                className="h-3.5 w-3.5"
                aria-hidden
                style={{ color: active ? '#fff' : cue }}
              />
              {FILTER_LABEL[id]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
