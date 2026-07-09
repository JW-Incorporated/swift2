'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getEra } from '@/lib/longlive/eras';
import { contentForEra, milestonesForEra } from '@/lib/longlive/content';
import { useAppState } from '@/lib/longlive/store';
import { cn } from '@/lib/utils';

/** Reference line for "what am I reading" — header + a bit into the viewport. */
const HEADER_OFFSET = 64;
const REF_RATIO = 0.3;
/** Horizontal distance (px) of the rail line from the viewport's right edge. */
const RAIL_RIGHT = 26;
/** Density curve resolution. */
const SAMPLES = 72;

interface Anchor {
  date: number;
  top: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function fmtMonth(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function TimelineScrubber() {
  const { eraId } = useAppState();
  const era = getEra(eraId);

  const start = useMemo(() => new Date(era.start).getTime(), [era.start]);
  const end = useMemo(() => new Date(era.end).getTime(), [era.end]);
  const span = Math.max(1, end - start);

  const items = useMemo(() => contentForEra(eraId), [eraId]);
  const milestones = useMemo(() => milestonesForEra(eraId), [eraId]);

  // Smoothed activity density (Gaussian kernel over item dates).
  const density = useMemo(() => {
    const dates = items.map((i) => new Date(i.date).getTime());
    const bandwidth = span / 9;
    const raw = Array.from({ length: SAMPLES }, (_, s) => {
      // s=0 is the top of the ridge, which now represents the newest date.
      const t = end - (s / (SAMPLES - 1)) * span;
      let sum = 0;
      for (const d of dates) {
        const x = (t - d) / bandwidth;
        sum += Math.exp(-0.5 * x * x);
      }
      return sum;
    });
    const max = Math.max(...raw, 1e-6);
    return raw.map((v) => v / max);
  }, [items, span, end]);

  // Ridge path in a 0..100 × 0..1000 viewBox, stretched to the rail with
  // preserveAspectRatio="none". x=100 is the rail; smaller x bulges leftward.
  const ridgePath = useMemo(() => {
    const pts = density.map((v, s) => {
      const y = (s / (SAMPLES - 1)) * 1000;
      const x = 100 - v * 100;
      return `${x.toFixed(2)} ${y.toFixed(2)}`;
    });
    return `M 100 0 L ${pts.join(' L ')} L 100 1000 Z`;
  }, [density]);

  // Top of the rail (0%) = newest/now; bottom (100%) = the era's start.
  const pctForDate = useCallback(
    (ms: number) => clamp01((end - ms) / span) * 100,
    [end, span],
  );

  const railRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLSpanElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const anchorsRef = useRef<Anchor[]>([]);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  /** Last time we committed a React state update while dragging (ms, Date.now()). */
  const lastCommitRef = useRef(0);
  /** No React setState per pointer-move: position the handle via direct DOM
   * writes on every frame, and only commit React state (which drives the
   * date-label text) at this throttled interval, per the 60fps scrubber rule. */
  const DRAG_COMMIT_INTERVAL_MS = 120;

  const [currentDate, setCurrentDate] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<number | null>(null);
  const [active, setActive] = useState(false); // hovering or dragging
  const [nowPct, setNowPct] = useState<number | null>(null);
  // First-run legend hint: shown once, dismissed on first interaction.
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (!localStorage.getItem('ll-scrubber-hint-seen')) setShowHint(true);
    } catch {
      /* no-op */
    }
  }, []);

  const dismissHint = useCallback(() => {
    setShowHint((was) => {
      if (was) {
        try {
          localStorage.setItem('ll-scrubber-hint-seen', '1');
        } catch {
          /* no-op */
        }
      }
      return false;
    });
  }, []);

  // Measure the on-screen content items (document coordinates + their dates).
  const measure = useCallback(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-ll-item]'),
    );
    anchorsRef.current = els
      .map((el) => ({
        date: Number(el.dataset.llDate),
        top: el.getBoundingClientRect().top + window.scrollY,
      }))
      .sort((a, b) => a.top - b.top);
  }, []);

  // Feed scroll → current reading date.
  const dateFromScroll = useCallback((): number | null => {
    const a = anchorsRef.current;
    if (!a.length) return null;
    const ref = window.scrollY + HEADER_OFFSET + window.innerHeight * REF_RATIO;
    if (ref <= a[0].top) return a[0].date;
    const last = a[a.length - 1];
    if (ref >= last.top) return last.date;
    for (let i = 0; i < a.length - 1; i++) {
      if (ref >= a[i].top && ref < a[i + 1].top) {
        const f = (ref - a[i].top) / Math.max(1, a[i + 1].top - a[i].top);
        return a[i].date + f * (a[i + 1].date - a[i].date);
      }
    }
    return last.date;
  }, []);

  // Target date → feed scroll position (inverse of the above).
  // Anchors are ordered by vertical position; dates now descend as you go
  // down the page (newest at the top), so interpolate for that direction.
  const scrollToDate = useCallback((target: number) => {
    const a = anchorsRef.current;
    if (!a.length) return;
    const offset = HEADER_OFFSET + window.innerHeight * REF_RATIO;
    let y: number;
    if (target >= a[0].date) y = a[0].top;
    else if (target <= a[a.length - 1].date) y = a[a.length - 1].top;
    else {
      y = a[a.length - 1].top;
      for (let i = 0; i < a.length - 1; i++) {
        if (target <= a[i].date && target > a[i + 1].date) {
          const f = (a[i].date - target) / Math.max(1, a[i].date - a[i + 1].date);
          y = a[i].top + f * (a[i + 1].top - a[i].top);
          break;
        }
      }
    }
    window.scrollTo({ top: y - offset, behavior: draggingRef.current ? 'auto' : 'smooth' });
  }, []);

  const syncFromScroll = useCallback(() => {
    if (draggingRef.current) return;
    const d = dateFromScroll();
    if (d != null) setCurrentDate(d);
  }, [dateFromScroll]);

  // Wire up measurement + scroll listeners; re-measure on era/filter/layout change.
  useEffect(() => {
    measure();
    syncFromScroll();
    setNowPct(() => {
      const now = Date.now();
      return now >= start && now <= end ? pctForDate(now) : null;
    });

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(syncFromScroll);
    };
    const onResize = () => {
      measure();
      syncFromScroll();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Catch layout changes from filtering, image loads, era swaps.
    const ro = new ResizeObserver(() => {
      measure();
      syncFromScroll();
    });
    ro.observe(document.body);
    // A follow-up measure after paint settles (fonts/images).
    const t = window.setTimeout(() => {
      measure();
      syncFromScroll();
    }, 300);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
      window.clearTimeout(t);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [eraId, measure, syncFromScroll, pctForDate, start, end]);

  const dateFromPointer = useCallback(
    (clientY: number): number => {
      const rect = railRef.current?.getBoundingClientRect();
      if (!rect) return end;
      // Top of the rail = newest; bottom = the era's start.
      const f = clamp01((clientY - rect.top) / rect.height);
      return end - f * span;
    },
    [end, span],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      setActive(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      const d = dateFromPointer(e.clientY);
      setCurrentDate(d);
      scrollToDate(d);
    },
    [dateFromPointer, scrollToDate],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const d = dateFromPointer(e.clientY);
      const dragging = draggingRef.current;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        // Position the handle/pill imperatively every frame (no React
        // render on the hot path); only commit React state — which drives
        // the date-label text — on a throttled cadence.
        if (dragging) {
          const pct = pctForDate(d);
          if (handleRef.current) handleRef.current.style.top = `${pct}%`;
          if (pillRef.current) pillRef.current.style.top = `${pct}%`;
          scrollToDate(d);
        }
        const now = Date.now();
        if (!dragging || now - lastCommitRef.current >= DRAG_COMMIT_INTERVAL_MS) {
          lastCommitRef.current = now;
          setHoverDate(d);
          if (dragging) setCurrentDate(d);
        }
      });
    },
    [dateFromPointer, pctForDate, scrollToDate],
  );

  const endDrag = useCallback(
    (e: React.PointerEvent) => {
      if (draggingRef.current) {
        draggingRef.current = false;
        // The drag-time commit is throttled, so the last few frames of
        // motion may only exist in the DOM refs — commit the true final
        // position to React state now.
        const d = dateFromPointer(e.clientY);
        setCurrentDate(d);
        setHoverDate(d);
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          /* no-op */
        }
      }
    },
    [dateFromPointer],
  );

  const currentPct = currentDate != null ? pctForDate(currentDate) : null;
  const pillDate = draggingRef.current && hoverDate != null ? hoverDate : currentDate;

  // Nearest content item to the hovered position, for the preview tooltip.
  const hoverPct = hoverDate != null ? pctForDate(hoverDate) : null;
  const nearestItem = useMemo(() => {
    if (hoverDate == null || !items.length) return null;
    let best = items[0];
    let bestDist = Infinity;
    for (const it of items) {
      const dist = Math.abs(new Date(it.date).getTime() - hoverDate);
      if (dist < bestDist) {
        bestDist = dist;
        best = it;
      }
    }
    return best;
  }, [hoverDate, items]);
  const showTooltip = active && !draggingRef.current && hoverPct != null && nearestItem != null;

  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 z-30 flex w-16 items-center justify-end sm:w-20">
      {/* Legibility scrim */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-full"
        style={{
          background:
            'linear-gradient(to left, color-mix(in srgb, var(--era-bg) 78%, transparent), transparent)',
        }}
      />

      <div
        ref={railRef}
        role="slider"
        tabIndex={0}
        aria-label={`${era.name} timeline scrubber`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(currentPct ?? 0)}
        aria-valuetext={pillDate != null ? fmtMonth(pillDate) : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={() => {
          setActive(true);
          dismissHint();
        }}
        onPointerLeave={() => {
          if (!draggingRef.current) setActive(false);
          setHoverDate(null);
        }}
        onKeyDown={(e) => {
          if (currentDate == null) return;
          const step = span / 24;
          if (e.key === 'ArrowUp') {
            const d = Math.max(start, currentDate - step);
            setCurrentDate(d);
            scrollToDate(d);
          } else if (e.key === 'ArrowDown') {
            const d = Math.min(end, currentDate + step);
            setCurrentDate(d);
            scrollToDate(d);
          }
        }}
        className="pointer-events-auto relative h-[74vh] w-full cursor-ns-resize touch-none select-none outline-none"
      >
        {/* Activity ridge */}
        <svg
          aria-hidden
          className="absolute inset-y-0"
          style={{ right: RAIL_RIGHT, width: 48, height: '100%' }}
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
        >
          <path
            d={ridgePath}
            fill="var(--era-accent)"
            fillOpacity={active ? 0.28 : 0.18}
            stroke="var(--era-accent)"
            strokeOpacity={0.55}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
            style={{ transition: 'fill-opacity 200ms ease' }}
          />
        </svg>

        {/* Rail line */}
        <div
          aria-hidden
          className="absolute inset-y-0 w-px"
          style={{ right: RAIL_RIGHT, background: 'var(--era-line)' }}
        />

        {/* Era start / end year labels */}
        <span
          className={cn(
            'absolute -top-1 text-[10px] font-medium uppercase tracking-wider text-[color:var(--era-ink-soft)] transition-opacity',
            active ? 'opacity-100' : 'opacity-0',
          )}
          style={{ right: RAIL_RIGHT + 14, transform: 'translateY(-50%)' }}
        >
          {era.isCurrent ? 'now' : new Date(end).getFullYear()}
        </span>
        <span
          className={cn(
            'absolute text-[10px] font-medium uppercase tracking-wider text-[color:var(--era-ink-soft)] transition-opacity',
            active ? 'opacity-100' : 'opacity-0',
          )}
          style={{ right: RAIL_RIGHT + 14, bottom: -4, transform: 'translateY(50%)' }}
        >
          {new Date(start).getFullYear()}
        </span>

        {/* Item ticks */}
        {items.map((it) => {
          const pct = pctForDate(new Date(it.date).getTime());
          return (
            <span
              key={it.id}
              aria-hidden
              className="absolute rounded-full"
              style={{
                right: RAIL_RIGHT,
                top: `${pct}%`,
                height: 3,
                width: 3,
                transform: 'translate(50%, -50%)',
                background: 'var(--era-ink)',
                opacity: 0.35,
              }}
            />
          );
        })}

        {/* Milestone markers */}
        {milestones.map((m) => {
          const pct = pctForDate(new Date(m.date).getTime());
          return (
            <div key={m.id} aria-hidden>
              <span
                className="absolute rounded-full ring-2"
                style={{
                  right: RAIL_RIGHT,
                  top: `${pct}%`,
                  height: 8,
                  width: 8,
                  transform: 'translate(50%, -50%)',
                  background: 'var(--era-accent)',
                  // ring color via boxShadow to inherit bg
                  boxShadow: '0 0 0 2px var(--era-bg)',
                }}
              />
              <span
                className={cn(
                  'absolute max-w-28 text-right text-[10px] leading-tight text-[color:var(--era-ink-soft)] transition-opacity',
                  active ? 'opacity-100' : 'opacity-0',
                )}
                style={{ right: RAIL_RIGHT + 14, top: `${pct}%`, transform: 'translateY(-50%)' }}
              >
                {m.label}
              </span>
            </div>
          );
        })}

        {/* "Now" tick for the current era */}
        {nowPct != null && (
          <span
            aria-hidden
            className="absolute h-3 w-3 -translate-y-1/2 translate-x-1/2 rotate-45 border border-[color:var(--era-bg)]"
            style={{ right: RAIL_RIGHT, top: `${nowPct}%`, background: 'var(--era-ink)' }}
            title="Now"
          />
        )}

        {/* Handle + date pill */}
        {currentPct != null && (
          <>
            <span
              ref={handleRef}
              className="absolute rounded-full border-2 transition-transform"
              style={{
                right: RAIL_RIGHT,
                top: `${currentPct}%`,
                height: active ? 18 : 14,
                width: active ? 18 : 14,
                transform: 'translate(50%, -50%)',
                background: 'var(--era-accent)',
                borderColor: 'var(--era-bg)',
                boxShadow: '0 2px 10px -2px var(--era-glow)',
              }}
            />
            {pillDate != null && (
              <span
                ref={pillRef}
                className={cn(
                  'absolute whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold tabular-nums shadow-sm transition-opacity',
                  active ? 'opacity-100' : 'opacity-90',
                )}
                style={{
                  right: RAIL_RIGHT + 16,
                  top: `${currentPct}%`,
                  transform: 'translateY(-50%)',
                  background: 'var(--era-surface)',
                  borderColor: 'var(--era-line)',
                  color: 'var(--era-ink)',
                }}
              >
                {fmtMonth(pillDate)}
              </span>
            )}
          </>
        )}

        {/* Hover preview: nearest content item */}
        {showTooltip && nearestItem && hoverPct != null && (
          <>
            <span
              aria-hidden
              className="absolute h-2 w-2 rounded-full"
              style={{
                right: RAIL_RIGHT,
                top: `${hoverPct}%`,
                transform: 'translate(50%, -50%)',
                background: 'var(--era-ink)',
                opacity: 0.5,
              }}
            />
            <div
              className="pointer-events-none absolute z-10 w-40 rounded-lg border p-2.5 shadow-lg"
              style={{
                right: RAIL_RIGHT + 18,
                top: `${hoverPct}%`,
                transform: `translateY(-50%)`,
                background: 'var(--era-surface-2)',
                borderColor: 'var(--era-line)',
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--era-accent)' }}
              >
                {nearestItem.dateLabel}
              </div>
              <div className="mt-0.5 text-[12px] font-medium leading-snug text-[color:var(--era-ink)]">
                {nearestItem.title}
              </div>
            </div>
          </>
        )}

        {/* First-run legend hint: explains the density ridge, shown once. */}
        {showHint && !active && (
          <div
            className="clue-reveal pointer-events-auto absolute top-1/2 flex w-44 -translate-y-1/2 flex-col gap-1 rounded-lg border p-3 shadow-xl"
            style={{
              right: RAIL_RIGHT + 22,
              background: 'var(--era-surface-2)',
              borderColor: 'color-mix(in srgb, var(--era-accent) 40%, var(--era-line))',
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--era-accent)' }}
            >
              Timeline
            </div>
            <p className="text-[12px] leading-snug text-[color:var(--era-ink)]">
              This ridge bulges where the most happened. Drag or hover to explore {era.shortName}.
            </p>
            <button
              type="button"
              onClick={dismissHint}
              className="mt-1 self-start text-[11px] font-medium underline decoration-dotted underline-offset-2"
              style={{ color: 'var(--era-ink-soft)' }}
            >
              Got it
            </button>
            {/* Pointer toward the ridge */}
            <span
              aria-hidden
              className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-b border-r"
              style={{
                right: -5,
                background: 'var(--era-surface-2)',
                borderColor: 'color-mix(in srgb, var(--era-accent) 40%, var(--era-line))',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
