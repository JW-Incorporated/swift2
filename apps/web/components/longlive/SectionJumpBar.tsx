'use client';

/**
 * The section-jump / depth-preview control (PLAN.md 2026-08-14 step 3, Joey:
 * "you have no idea how much is down there"). Two states of the SAME data,
 * used by both the Social and Merch panes:
 *
 * - `rest`: sits in normal flow (scrolls away with the rest of the page) —
 *   a summary line plus a wrapping grid of chips.
 * - `compact`: renders inside `CommunitySection`'s existing 44px sticky
 *   rail chip slot — one line, horizontal scroll, edge-fade gradient (same
 *   affordance `FilterBar` uses for its own overflowing row).
 *
 * Every content chip carries its own count — the count IS the depth preview,
 * so a chip is never rendered without one. The one deliberate exception is
 * the trailing "+ Suggest a link" action chip (`suggestChip`), which has no
 * count because it isn't a content section.
 *
 * Deliberately NOT `filter-chips.tsx`'s solid-fill visual language (active =
 * filled) — these are quiet transparent-background outline anchors, so a
 * reader can tell "jump" from "filter" at a glance even when both chip rows
 * sit near the top of the same pane (the Merch pane does exactly that).
 *
 * Scroll-spy: an IntersectionObserver watches every target section (each
 * chip's `id`, resolved via `document.getElementById`) and marks the
 * topmost currently-visible one `aria-current` — auto-scrolled into view in
 * the compact row so the active chip never scrolls out of sight.
 */

import { useEffect, useRef, useState } from 'react';
import { measureChromeHeight } from '@/lib/longlive/chrome-offset';
import { scrollTargetY, type JumpChip } from '@/lib/longlive/section-jump';

export type { JumpChip };

export interface SectionJumpBarProps {
  ariaLabel: string;
  summary: string;
  chips: readonly JumpChip[];
  suggestChip: { id: string; label: string };
  variant: 'rest' | 'compact';
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Extra breathing room below the measured sticky chrome so a jumped-to
 *  section's heading isn't flush against the rail/topbar edge. */
const JUMP_PADDING_PX = 12;

export function SectionJumpBar({ ariaLabel, summary, chips, suggestChip, variant }: SectionJumpBarProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const allChips: JumpChip[] = [...chips, { id: suggestChip.id, label: suggestChip.label }];
  const chipIds = allChips.map((c) => c.id).join('|');

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const ids = chipIds.split('|').filter(Boolean);
    const targets = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el != null);
    if (targets.length === 0) return;

    const visibleTops = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleTops.set(entry.target.id, entry.boundingClientRect.top);
          else visibleTops.delete(entry.target.id);
        }
        if (visibleTops.size === 0) return;
        const topmost = [...visibleTops.entries()].sort((a, b) => a[1] - b[1])[0];
        setActiveId(topmost[0]);
      },
      // Shifts the "line" a target must cross to just below the sticky
      // chrome, and only counts the top ~30% of the viewport as "in view" —
      // so the active chip tracks the section nearest the reading position,
      // not merely any section that's partially on screen.
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [chipIds]);

  // Horizontal-only: scrolls the chip row's own `scrollLeft`, never the
  // window. `Element.scrollIntoView` was tried first and rejected — even
  // with `block: 'nearest'` it can walk past a `position: sticky` ancestor
  // and drag the WHOLE PAGE vertically to "reveal" a button that's already
  // on-screen (it's sticky), fighting a concurrent programmatic
  // `window.scrollTo` from a jump-tap and landing short of the target
  // section. Computing the row's own scroll offset avoids touching the y
  // axis at all.
  useEffect(() => {
    if (!activeId || variant !== 'compact') return;
    const row = rowRef.current;
    const btn = row?.querySelector<HTMLElement>(`[data-jump-id="${activeId}"]`);
    if (!row || !btn) return;
    const btnLeft = btn.offsetLeft;
    const btnRight = btnLeft + btn.offsetWidth;
    const viewLeft = row.scrollLeft;
    const viewRight = viewLeft + row.clientWidth;
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (btnLeft < viewLeft) {
      row.scrollTo({ left: Math.max(0, btnLeft - 8), behavior });
    } else if (btnRight > viewRight) {
      row.scrollTo({ left: btnRight - row.clientWidth + 8, behavior });
    }
  }, [activeId, variant]);

  function jumpTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const rail = document.querySelector<HTMLElement>('[data-ll-community-rail]');
    const offset = measureChromeHeight() + (rail ? rail.getBoundingClientRect().height : 0) + JUMP_PADDING_PX;
    const top = scrollTargetY(el.getBoundingClientRect().top, window.scrollY, offset);
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }

  if (variant === 'compact') {
    return (
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          ref={rowRef}
          role="group"
          aria-label={ariaLabel}
          className="flex flex-nowrap items-center gap-1.5 overflow-x-auto scrollbar-none"
        >
          {allChips.map((chip) => (
            <JumpChipButton key={chip.id} chip={chip} active={chip.id === activeId} onClick={() => jumpTo(chip.id)} />
          ))}
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[color:var(--era-bg)] to-transparent"
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-[color:var(--era-ink-soft)]">{summary}</p>
      <div ref={rowRef} role="group" aria-label={ariaLabel} className="mt-3 flex flex-wrap gap-2">
        {allChips.map((chip) => (
          <JumpChipButton key={chip.id} chip={chip} active={chip.id === activeId} onClick={() => jumpTo(chip.id)} />
        ))}
      </div>
    </div>
  );
}

function JumpChipButton({ chip, active, onClick }: { chip: JumpChip; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      data-jump-id={chip.id}
      aria-current={active ? 'true' : undefined}
      onClick={onClick}
      className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border bg-transparent px-3 text-xs font-medium text-[color:var(--era-ink)] transition"
      style={{ borderColor: active ? 'var(--era-accent)' : 'var(--era-line)' }}
    >
      {chip.dotColor && (
        <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chip.dotColor }} />
      )}
      {chip.label}
      {chip.count != null && <span className="text-[color:var(--era-ink-soft)]">{chip.count}</span>}
    </button>
  );
}
