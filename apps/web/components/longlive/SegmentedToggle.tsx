'use client';

/**
 * Generic segmented control (PLAN.md 2026-08-14 step 2) — no segmented
 * control existed in this repo before the combined Community section's
 * full-width 50/50 Social/Merch toggle. Deliberately NOT hardcoded to those
 * two labels: it takes its options as data, exactly like ModeToggle
 * (TopBar.tsx) takes `mode`/`onChange`, so later surfaces can reuse it
 * without a fork (the repo's recurring "two mechanisms for one fact" defect).
 *
 * Two sizes: `default` (48px, the big in-flow toggle under the section H1)
 * and `compact` (for the 44px sticky rail's mini-toggle) — the compact
 * button's visual height is smaller than 44px, so it grows its tap target
 * with an invisible `before:-inset-y-*` overlay rather than inflating the
 * visible control (era-token styling either way — `bg-accent`/`text-bg`/
 * `text-ink-soft`/`border-line`/`bg-surface` all alias the `--era-*` custom
 * properties, see app/globals.css, same pattern ModeToggle already uses).
 */

import { cn } from '@/lib/utils';

export interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedToggleProps<T extends string> {
  options: readonly SegmentedToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Accessible name for the `tablist` — describes what the toggle switches, not its options. */
  ariaLabel: string;
  size?: 'default' | 'compact';
  className?: string;
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'default',
  className,
}: SegmentedToggleProps<T>) {
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const n = Math.max(1, options.length);
  const compact = size === 'compact';

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        'relative flex w-full items-stretch rounded-full border border-line bg-surface p-1',
        compact ? 'h-8' : 'h-12',
        className,
      )}
    >
      <span
        aria-hidden
        className="absolute inset-y-1 rounded-full bg-accent transition-transform duration-300 ease-out"
        style={{ width: `calc((100% - 0.5rem) / ${n})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative z-10 flex flex-1 basis-0 items-center justify-center whitespace-nowrap rounded-full px-3 font-semibold transition-colors',
              compact
                ? // Visible hit area is only 32px (h-8); the invisible pseudo
                  // element widens the actual tap target to the 44px minimum
                  // without inflating the compact rail's visual height.
                  'before:absolute before:-inset-y-[6px] before:inset-x-0 before:content-[\'\'] text-xs'
                : 'text-sm',
              active ? 'text-bg' : 'text-ink-soft hover:text-ink',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
