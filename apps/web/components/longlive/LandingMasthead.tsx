'use client';

import { useLayoutEffect, useState } from 'react';
import { dailyGloss, GLOSS_SECTIONS } from '@/lib/longlive/gloss-rotation';
import type { AppMode } from '@/lib/longlive/store';
import type { CurrentItem } from '@swift2/shared';
import { summarizeCurrentActivity } from '@/lib/longlive/current-feed';

/** The viewer's local calendar day as `YYYY-MM-DD`. Client-only (see below). */
function todayKey(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * The landing page's top portion (P5, PLAN.md): eyebrow, wordmark, tagline —
 * unchanged in structure and styling from the page Joey already likes — plus
 * one rotating gloss line (R1) teaching a single section at a time.
 *
 * The gloss rotates on the same deterministic-daily-cycle pattern as
 * `EraSecretCard`: the first render (SSR + hydration) shows the pool's first
 * entry so the markup matches, then swaps in the day's pick — a text swap
 * with no hydration mismatch around a midnight boundary. `useLayoutEffect`
 * (not `useEffect`) so that swap commits before the browser paints the
 * hydrated tree, rather than one frame after — the flash a plain post-paint
 * effect caused (re-review finding F, 2026-08-13; still SSR-safe, since a
 * layout effect never runs on the server either). The button also reserves
 * two lines of height: different glosses are different lengths, and a
 * narrow viewport can wrap one but not another, which would otherwise
 * reflow the content below it.
 *
 * `currentItems` (PLAN.md Stage 5): when the current era has live data, the
 * tagline swaps to "Updated Nh ago · N new this week" — the "real-time
 * updates" claim made concrete instead of aspirational. Computed
 * client-only via `nowMs` (same SSR-safe swap-after-mount pattern as
 * `dayKey`/the gloss below) since a relative-time label is only stable
 * once we know the reader's actual clock.
 */
export function LandingMasthead({
  onNavigate,
  currentItems,
}: {
  onNavigate: (mode: AppMode) => void;
  currentItems?: CurrentItem[];
}) {
  const [dayKey, setDayKey] = useState<string | null>(null);
  useLayoutEffect(() => setDayKey(todayKey()), []);
  const gloss = (dayKey ? dailyGloss(dayKey) : GLOSS_SECTIONS[0]) ?? GLOSS_SECTIONS[0];

  const [nowMs, setNowMs] = useState<number | null>(null);
  useLayoutEffect(() => setNowMs(Date.now()), []);
  const activity = nowMs != null ? summarizeCurrentActivity(currentItems ?? [], nowMs) : null;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--era-accent-2)]">
        The Taylor Swift time machine
      </p>
      <h1 className="font-era text-5xl font-semibold tracking-tight sm:text-7xl">Long&nbsp;Live</h1>
      <p className="max-w-xs text-sm text-[color:var(--era-ink-soft)] sm:max-w-sm sm:text-base">
        {activity
          ? `Updated ${activity.updatedLabel} · ${activity.newThisWeek} new this week.`
          : 'Real-time updates on her whole life — every moment sourced and dated, back through all twelve eras.'}
      </p>
      <button
        type="button"
        onClick={() => onNavigate(gloss.mode)}
        className="era-btn-ghost mt-1 inline-flex min-h-14 items-center gap-1.5 rounded-full px-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--era-accent)]"
      >
        <span className="font-semibold text-[color:var(--era-ink)]">{gloss.label}</span>
        <span className="text-[color:var(--era-ink-soft)]">— {gloss.gloss}</span>
      </button>
    </div>
  );
}
