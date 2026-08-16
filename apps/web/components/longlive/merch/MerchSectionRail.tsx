'use client';

/**
 * Merch page redesign, Agent B (PLAN.md "MerchSectionRail.tsx"). The sticky
 * three-up navigation between the page's three sections (official / fan-made
 * / shop-the-look), reproducing the mockup's `.rail` / `.rail-in` / `.rail a`
 * treatment: translucent blurred background, hairline top/bottom borders, a
 * per-section accent dot, and an IntersectionObserver scrollspy that marks
 * the entry active as its section scrolls into the reading position
 * (`rootMargin: "-20% 0px -70% 0px"`, matching the mockup's script).
 *
 * Sticky offset: NEVER a hardcoded constant (docs/engineering-lessons.md,
 * "a sum of heights is not a position" — four failed fixes). `top` is the
 * live `measureChromeBottom()` reading (the existing TopBar/FilterBar
 * chrome's current bottom edge), re-measured on every scroll frame via rAF
 * throttle — same pattern as `TimelineScrubber.tsx` — because pre-stick that
 * edge moves every frame; a resize listener covers layout/viewport changes.
 *
 * Clicking an entry scrolls the target section just below BOTH the live
 * chrome AND this rail's own height (it becomes sticky above the section),
 * via the same `scrollTargetY` pure helper `SectionJumpBar` uses. The reader
 * has no URL routes (docs/engineering-lessons.md) — this never touches
 * `window.location` or history, only `window.scrollTo`.
 */

import { useEffect, useRef, useState } from 'react';
import { measureChromeBottom } from '@/lib/longlive/chrome-offset';
import { scrollTargetY } from '@/lib/longlive/section-jump';
import { cn } from '@/lib/utils';

export interface MerchRailSection {
  id: string;
  label: string;
  count: number;
  accent: string;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Extra breathing room below the rail so a scrolled-to section's heading
 *  isn't flush against its bottom edge — same intent as SectionJumpBar's
 *  own `JUMP_PADDING_PX`. */
const RAIL_SCROLL_PADDING_PX = 12;

export function MerchSectionRail({ sections }: { sections: readonly MerchRailSection[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(sections[0]?.id ?? null);
  const [railTop, setRailTop] = useState(0);
  const sectionIds = sections.map((s) => s.id).join('|');

  // Live sticky offset — recomputed on scroll (rAF-throttled, pre-stick the
  // chrome's bottom edge moves every frame) and on resize.
  useEffect(() => {
    const recompute = () => setRailTop(measureChromeBottom());
    recompute();
    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recompute);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', recompute);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', recompute);
    };
  }, []);

  // Scrollspy: tracks the currently-intersecting set and picks the topmost —
  // never a stored `boundingClientRect` snapshot, which goes stale the
  // instant a later entry is compared against it (SectionJumpBar's own
  // documented fix for this exact defect).
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const ids = sectionIds.split('|').filter(Boolean);
    const targets = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el != null);
    if (targets.length === 0) return;

    const visibleIds = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visibleIds.add(entry.target.id);
          else visibleIds.delete(entry.target.id);
        }
        if (visibleIds.size === 0) return;
        let topmostId: string | null = null;
        let topmostY = Number.POSITIVE_INFINITY;
        for (const id of visibleIds) {
          const el = document.getElementById(id);
          if (!el) continue;
          const top = el.getBoundingClientRect().top;
          if (top < topmostY) {
            topmostY = top;
            topmostId = id;
          }
        }
        if (topmostId) setActiveId(topmostId);
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sectionIds]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const railHeight = railRef.current?.getBoundingClientRect().height ?? 0;
    const offset = measureChromeBottom() + railHeight + RAIL_SCROLL_PADDING_PX;
    const top = scrollTargetY(el.getBoundingClientRect().top, window.scrollY, offset);
    window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <div
      ref={railRef}
      data-ll-merchrail
      className="sticky z-30 overflow-hidden border-y border-[color:var(--merch-line)] backdrop-blur-[14px]"
      style={{ top: `${railTop}px`, backgroundColor: 'color-mix(in srgb, var(--merch-ink) 86%, transparent)' }}
    >
      <div className="grid grid-cols-3">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <button
              key={section.id}
              type="button"
              aria-current={active ? 'true' : undefined}
              onClick={() => scrollToSection(section.id)}
              className={cn(
                'flex min-w-0 items-center justify-center gap-[9px] border-b-2 px-2.5 py-[15px] text-center text-[11px] font-medium uppercase tracking-[0.2em] transition-colors',
                active ? 'text-[color:var(--merch-cream)]' : 'text-[color:var(--merch-muted)] hover:text-[color:var(--merch-cream)]',
                'max-[640px]:gap-1.5 max-[640px]:px-1.5 max-[640px]:py-[13px] max-[640px]:text-[10px] max-[640px]:tracking-[0.08em]',
              )}
              style={{ borderBottomColor: active ? section.accent : 'transparent' }}
            >
              <span
                aria-hidden
                className={cn('h-[7px] w-[7px] shrink-0 rounded-full', active ? 'opacity-100' : 'opacity-45')}
                style={{ backgroundColor: section.accent }}
              />
              <span className="truncate">{section.label}</span>
              <span className="opacity-50 max-[400px]:hidden">{section.count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
