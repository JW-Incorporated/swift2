'use client';

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CAREER_START_MS,
  careerEndMs,
  ERAS,
  getEra,
} from '@swift2/experience';
import { threadPoints } from '@swift2/experience';
import type { LensId } from '@swift2/experience';
import { cn } from '@/lib/utils';
import { measureChromeHeight } from '@/lib/longlive/chrome-offset';

const REF_RATIO = 0.3;
/** Horizontal distance (px) of the rail line from the viewport's right edge. */
const RAIL_RIGHT = 16;
/** Ridge SVG width (px); shrinks with the rail footprint. */
const RIDGE_WIDTH = 28;
const SAMPLES = 90;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const fmtYear = (ms: number) => new Date(ms).getUTCFullYear().toString();

interface Anchor {
  date: number;
  top: number;
}

/**
 * Career-spanning timeline for a Thread. Unlike the era scrubber (scoped to one
 * era), this spans 2006→now so a throughline's whole arc is visible at once.
 * The density ridge shows when the thread was most active; ticks are colored by
 * the era each point belongs to, tying the thread back to the era timeline.
 * Direction matches era mode: top = now, bottom = the start of her career.
 */
export function ThreadsTimeline({ threadId }: { threadId: LensId }) {
  const start = CAREER_START_MS;
  const end = useMemo(() => careerEndMs(), []);
  const span = Math.max(1, end - start);

  const points = useMemo(() => threadPoints(threadId), [threadId]);

  const pctForDate = useCallback(
    (ms: number) => clamp01((end - ms) / span) * 100,
    [end, span],
  );

  // Smoothed density (Gaussian kernel), sampled newest→oldest down the rail.
  const density = useMemo(() => {
    const dates = points.map((p) => new Date(p.date).getTime());
    const bandwidth = span / 14;
    const raw = Array.from({ length: SAMPLES }, (_, s) => {
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
  }, [points, span, end]);

  const ridgePath = useMemo(() => {
    const pts = density.map((v, s) => {
      const y = (s / (SAMPLES - 1)) * 1000;
      const x = 100 - v * 100;
      return `${x.toFixed(2)} ${y.toFixed(2)}`;
    });
    return `M 100 0 L ${pts.join(' L ')} L 100 1000 Z`;
  }, [density]);

  // Era boundaries as faint bands so you can see which era owns each stretch.
  const eraBands = useMemo(
    () =>
      ERAS.map((e) => ({
        id: e.id,
        accent: e.theme.accent,
        top: pctForDate(new Date(e.end).getTime()),
        bottom: pctForDate(new Date(e.start).getTime()),
      })),
    [pctForDate],
  );

  const railRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLSpanElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const anchorsRef = useRef<Anchor[]>([]);
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastCommitRef = useRef(0);
  const DRAG_COMMIT_INTERVAL_MS = 120;

  const [currentDate, setCurrentDate] = useState<number | null>(null);
  const [hoverDate, setHoverDate] = useState<number | null>(null);
  const [active, setActive] = useState(false);

  const measure = useCallback(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-ll-item]'));
    anchorsRef.current = els
      .map((el) => ({
        date: Number(el.dataset.llDate),
        top: el.getBoundingClientRect().top + window.scrollY,
      }))
      .filter((a) => Number.isFinite(a.date))
      .sort((a, b) => a.top - b.top);
  }, []);

  const dateFromScroll = useCallback((): number | null => {
    const a = anchorsRef.current;
    if (!a.length) return null;
    const ref = window.scrollY + measureChromeHeight() + window.innerHeight * REF_RATIO;
    if (ref <= a[0].top) return a[0].date;
    const last = a[a.length - 1];
    if (ref >= last.top) return last.date;
    // Cards may not render in chronological order (e.g. Taylor's Version is
    // album-ordered), so interpolating a date between two DOM neighbors can
    // move backward as the user scrolls forward. Snap to whichever neighbor
    // the scroll position is nearer to instead.
    for (let i = 0; i < a.length - 1; i++) {
      if (ref >= a[i].top && ref < a[i + 1].top) {
        const midpoint = (a[i].top + a[i + 1].top) / 2;
        return ref < midpoint ? a[i].date : a[i + 1].date;
      }
    }
    return last.date;
  }, []);

  const scrollToDate = useCallback((target: number) => {
    const a = anchorsRef.current;
    if (!a.length) return;
    const offset = measureChromeHeight() + window.innerHeight * REF_RATIO;
    // Some threads (e.g. Taylor's Version) render cards out of chronological
    // order, so DOM position isn't monotonic with date — interpolating
    // between neighbors can land on the wrong card. Snap to the anchor with
    // the closest date instead.
    let y = a[0].top;
    let bestDist = Infinity;
    for (const anchor of a) {
      const dist = Math.abs(anchor.date - target);
      if (dist < bestDist) {
        bestDist = dist;
        y = anchor.top;
      }
    }
    window.scrollTo({ top: y - offset, behavior: draggingRef.current ? 'auto' : 'smooth' });
  }, []);

  const syncFromScroll = useCallback(() => {
    if (draggingRef.current) return;
    const d = dateFromScroll();
    if (d != null) setCurrentDate(d);
  }, [dateFromScroll]);

  useEffect(() => {
    measure();
    syncFromScroll();
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
    const ro = new ResizeObserver(() => {
      measure();
      syncFromScroll();
    });
    ro.observe(document.body);
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
  }, [threadId, measure, syncFromScroll]);

  const dateFromPointer = useCallback(
    (clientY: number): number => {
      const rect = railRef.current?.getBoundingClientRect();
      if (!rect) return end;
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
  const hoverPct = hoverDate != null ? pctForDate(hoverDate) : null;

  const nearestPoint = useMemo(() => {
    if (hoverDate == null || !points.length) return null;
    let best = points[0];
    let bestDist = Infinity;
    for (const p of points) {
      const dist = Math.abs(new Date(p.date).getTime() - hoverDate);
      if (dist < bestDist) {
        bestDist = dist;
        best = p;
      }
    }
    return best;
  }, [hoverDate, points]);
  const showTooltip = active && !draggingRef.current && hoverPct != null && nearestPoint != null;

  return (
    <div className="pointer-events-none fixed inset-y-0 right-0 z-30 flex w-10 items-center justify-end sm:w-12">
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
        aria-label="Career timeline"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(currentPct ?? 0)}
        aria-valuetext={pillDate != null ? fmtYear(pillDate) : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={() => setActive(true)}
        onPointerLeave={() => {
          if (!draggingRef.current) setActive(false);
          setHoverDate(null);
        }}
        onKeyDown={(e) => {
          const base = currentDate ?? end;
          const step = span / 24;
          let d: number | null = null;
          if (e.key === 'ArrowUp') d = Math.min(end, base + step);
          else if (e.key === 'ArrowDown') d = Math.max(start, base - step);
          else if (e.key === 'Home') d = end;
          else if (e.key === 'End') d = start;
          if (d != null) {
            e.preventDefault();
            setCurrentDate(d);
            scrollToDate(d);
          }
        }}
        className="pointer-events-auto relative h-[74vh] w-full cursor-ns-resize touch-none select-none outline-none"
      >
        {/* Era bands (faint, era-accent colored) */}
        {eraBands.map((b) => (
          <span
            key={b.id}
            aria-hidden
            className="absolute transition-opacity"
            style={{
              right: RAIL_RIGHT - 1,
              top: `${b.top}%`,
              height: `${Math.max(0, b.bottom - b.top)}%`,
              width: 2,
              background: b.accent,
              opacity: active ? 0.5 : 0.28,
            }}
          />
        ))}

        {/* Activity ridge */}
        <svg
          aria-hidden
          className="absolute inset-y-0"
          style={{ right: RAIL_RIGHT, width: RIDGE_WIDTH, height: '100%' }}
          viewBox="0 0 100 1000"
          preserveAspectRatio="none"
        >
          <path
            d={ridgePath}
            fill="var(--era-accent)"
            fillOpacity={active ? 0.26 : 0.16}
            stroke="var(--era-accent)"
            strokeOpacity={0.5}
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

        {/* Year end-labels */}
        <span
          className={cn(
            'absolute -top-1 text-[10px] font-medium uppercase tracking-wider text-[color:var(--era-ink-soft)] transition-opacity',
            active ? 'opacity-100' : 'opacity-60',
          )}
          style={{ right: RAIL_RIGHT + 14, transform: 'translateY(-50%)' }}
        >
          now
        </span>
        <span
          className={cn(
            'absolute text-[10px] font-medium uppercase tracking-wider text-[color:var(--era-ink-soft)] transition-opacity',
            active ? 'opacity-100' : 'opacity-60',
          )}
          style={{ right: RAIL_RIGHT + 14, bottom: -4, transform: 'translateY(50%)' }}
        >
          {fmtYear(start)}
        </span>

        {/* Thread points, colored by era */}
        {points.map((p, i) => {
          const era = getEra(p.eraId);
          const pct = pctForDate(new Date(p.date).getTime());
          return (
            <span
              key={`${p.date}-${i}`}
              aria-hidden
              className="absolute rounded-full"
              style={{
                right: RAIL_RIGHT,
                top: `${pct}%`,
                height: 6,
                width: 6,
                transform: 'translate(50%, -50%)',
                background: era.theme.accent,
                boxShadow: '0 0 0 1.5px var(--era-bg)',
              }}
            />
          );
        })}

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
                {fmtYear(pillDate)}
              </span>
            )}
          </>
        )}

        {/* Hover preview */}
        {showTooltip && nearestPoint && hoverPct != null && (
          <div
            className="pointer-events-none absolute z-10 w-44 rounded-lg border p-2.5 shadow-lg"
            style={{
              right: RAIL_RIGHT + 18,
              top: `${hoverPct}%`,
              transform: 'translateY(-50%)',
              background: 'var(--era-surface-2)',
              borderColor: 'var(--era-line)',
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: getEra(nearestPoint.eraId).theme.accent }}
            >
              {getEra(nearestPoint.eraId).shortName} · {fmtYear(new Date(nearestPoint.date).getTime())}
            </div>
            <div className="mt-0.5 text-[12px] font-medium leading-snug text-[color:var(--era-ink)]">
              {nearestPoint.label}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
