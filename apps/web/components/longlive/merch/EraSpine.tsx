'use client';

import { useEffect, useRef } from 'react';
import type { JSX } from 'react';

export interface EraSpineEntry {
  key: string;
  name: string;
  year: string;
  color: string;
  count: number;
}

const SCROLL_STEP_PX = 350;

/** A count of 0 means "nothing catalogued", not a real measurement — same
 * honesty rule as the Community page's null member counts. It renders an
 * em-dash, never "0", and the caller is expected to also disable that entry's
 * button. Never rounds or invents a number; renders exactly what it's given. */
export function formatEraCount(count: number): string {
  return count === 0 ? '—' : String(count);
}

/**
 * Horizontal snap-scrolling era timeline, used as a filter for the
 * "Seen on Taylor" shop-the-look grid. The caller supplies every entry,
 * including the leading "All eras" one (its `color` may be any valid CSS
 * `background` value, e.g. a `linear-gradient(...)` across every era colour,
 * so this component never special-cases it).
 */
export function EraSpine({
  entries,
  activeKey,
  onSelect,
}: {
  entries: readonly EraSpineEntry[];
  activeKey: string;
  onSelect: (key: string) => void;
}): JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    buttonRefs.current[activeKey]?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    });
  }, [activeKey]);

  const scrollByStep = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({ left: direction * SCROLL_STEP_PX, behavior: 'smooth' });
  };

  return (
    <div className="border border-[color:var(--merch-line-strong)] bg-[color:var(--merch-ink-2)]/60">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[color:var(--merch-line)] px-4 py-3.5">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--merch-cream)]">
            Filter by era
          </span>
          <span className="text-[13px] text-[color:var(--merch-muted)]">
            Pick an era to see only those looks
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            aria-label="Earlier eras"
            onClick={() => scrollByStep(-1)}
            className="h-8 w-8 border border-[color:var(--merch-line)] text-[15px] leading-none text-[color:var(--merch-muted)] transition-colors hover:border-[color:var(--merch-lilac)] hover:text-[color:var(--merch-cream)]"
          >
            &lsaquo;
          </button>
          <button
            type="button"
            aria-label="Later eras"
            onClick={() => scrollByStep(1)}
            className="h-8 w-8 border border-[color:var(--merch-line)] text-[15px] leading-none text-[color:var(--merch-muted)] transition-colors hover:border-[color:var(--merch-lilac)] hover:text-[color:var(--merch-cream)]"
          >
            &rsaquo;
          </button>
        </div>
      </div>
      <div className="relative">
        <div
          ref={trackRef}
          role="group"
          aria-label="Era filter"
          className="flex flex-nowrap overflow-x-auto scrollbar-none [scroll-snap-type:x_proximity]"
        >
          {entries.map((entry) => {
            const isActive = entry.key === activeKey;
            const isDisabled = entry.count === 0;
            return (
              <button
                key={entry.key}
                ref={(node) => {
                  buttonRefs.current[entry.key] = node;
                }}
                type="button"
                disabled={isDisabled}
                aria-pressed={isActive}
                onClick={() => onSelect(entry.key)}
                className="group min-w-[114px] flex-none border-r border-[color:var(--merch-line)] px-4 pt-3.5 text-left transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-25 enabled:hover:bg-[color:var(--merch-cream)]/[0.06]"
                style={{
                  scrollSnapAlign: 'start',
                  background: isActive ? entry.color : undefined,
                }}
              >
                <span
                  className="block text-[10px] tracking-[0.2em] uppercase"
                  style={{
                    color: isActive ? 'var(--merch-ink)' : 'var(--merch-muted)',
                    opacity: isActive ? undefined : 0.6,
                  }}
                >
                  {entry.year}
                </span>
                <span
                  className="block whitespace-nowrap text-base leading-tight"
                  style={{
                    fontFamily: 'var(--font-bodoni)',
                    color: isActive ? 'var(--merch-ink)' : 'var(--merch-cream)',
                    opacity: isActive ? 1 : 0.72,
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {entry.name}
                </span>
                <span
                  className="mt-2 mb-3.5 block text-[10px] tracking-[0.14em]"
                  style={{
                    color: isActive ? 'var(--merch-ink)' : 'var(--merch-muted)',
                    opacity: isActive ? undefined : 0.5,
                  }}
                >
                  {formatEraCount(entry.count)}
                </span>
                <span
                  aria-hidden
                  className="block h-1 opacity-30 transition-opacity duration-200 group-hover:opacity-65"
                  style={{
                    background: isActive ? 'var(--merch-ink)' : entry.color,
                    opacity: isActive ? 1 : undefined,
                  }}
                />
              </button>
            );
          })}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-[52px] bg-gradient-to-l from-[color:var(--merch-ink-2)] to-transparent"
        />
      </div>
    </div>
  );
}
