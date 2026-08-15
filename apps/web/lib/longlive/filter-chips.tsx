'use client';

import type { LucideIcon } from 'lucide-react';

/**
 * One filter chip's static shape — shared by `FilterBar` (the six global
 * topic/video chips) and the Merch pane's own filters (stock / exact-piece /
 * price bands), so there is exactly ONE chip rendering implementation in the
 * app. Forking this per-surface is the repo's recurring "two mechanisms for
 * one fact" defect (docs/engineering-lessons.md) — extracted here instead.
 */
export interface ChipDef<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Solid identity color when active. Falls back to var(--era-accent). */
  color?: string;
}

export interface FilterChipRowProps<T extends string> {
  ariaLabel: string;
  chips: readonly ChipDef<T>[];
  active: ReadonlySet<T>;
  onToggle: (id: T) => void;
  /** Renders a leading "All" chip, active when `active` is empty. Omit to skip it. */
  allLabel?: string;
  onClearAll?: () => void;
  /** Extra classes on the scrollable row (e.g. spacing/width the caller owns). */
  className?: string;
}

/**
 * One row of solid-fill-when-active filter chips — the visual language shared
 * by every FILTER surface in the app (as opposed to the quiet outline anchor
 * chips a jump/index control uses). Callers own their own sticky positioning,
 * chip data, and matching logic; this owns only the chip markup + toggle
 * wiring, so it stays a pure presentational piece.
 */
export function FilterChipRow<T extends string>({
  ariaLabel,
  chips,
  active,
  onToggle,
  allLabel,
  onClearAll,
  className,
}: FilterChipRowProps<T>) {
  const allActive = active.size === 0;

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-none${className ? ` ${className}` : ''}`}
    >
      {allLabel !== undefined && onClearAll && (
        <button
          type="button"
          aria-pressed={allActive}
          onClick={onClearAll}
          className="inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition"
          style={{
            backgroundColor: allActive ? 'var(--era-accent)' : 'transparent',
            borderColor: 'var(--era-accent)',
            color: allActive ? 'var(--era-bg)' : 'var(--era-ink)',
          }}
        >
          {allLabel}
        </button>
      )}
      {chips.map((chip) => {
        const isActive = active.has(chip.id);
        const color = chip.color ?? 'var(--era-accent)';
        const cue = `color-mix(in srgb, ${color} 70%, var(--era-ink))`;
        const Icon = chip.icon;
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(chip.id)}
            className="inline-flex h-9 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 text-xs font-semibold transition"
            style={{
              backgroundColor: isActive ? color : 'transparent',
              borderColor: isActive ? color : cue,
              color: isActive ? '#fff' : 'var(--era-ink)',
            }}
          >
            {Icon && <Icon className="h-3 w-3" aria-hidden style={{ color: isActive ? '#fff' : cue }} />}
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
