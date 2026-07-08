'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { ERAS, getEra } from '@/lib/longlive/eras';
import { MILESTONES } from '@/lib/longlive/content';
import { eraStyle } from '@/lib/longlive/theme';
import type { Milestone } from '@/lib/longlive/types';
import { cn } from '@/lib/utils';

// Milestone lookup table (built once; avoids re-filtering on every render).
const MILESTONES_BY_ERA: Record<string, Milestone[]> = MILESTONES.reduce(
  (acc, m) => {
    (acc[m.eraId] ??= []).push(m);
    return acc;
  },
  {} as Record<string, Milestone[]>,
);

// Timeline spans the first era start → last era end.
const T_START = new Date(ERAS[0].start).getTime();
const T_END = new Date(ERAS[ERAS.length - 1].end).getTime();
const T_SPAN = T_END - T_START;

function toPct(dateMs: number): number {
  return ((dateMs - T_START) / T_SPAN) * 100;
}

export function TimelineScrubber() {
  const { eraId } = useAppState();
  const { setEra } = useAppActions();
  const [expanded, setExpanded] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  // Computed on the client only (depends on Date.now()) to avoid SSR mismatch.
  const [nowPct, setNowPct] = useState<number | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    setNowPct(Math.min(100, Math.max(0, toPct(Date.now()))));
  }, []);

  // rAF-throttled pointer tracking for a buttery preview readout.
  const handleMove = useCallback((clientX: number) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const el = trackRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
      setHoverPct(pct);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Which era does a given percent fall into?
  const eraAtPct = useCallback((pct: number) => {
    const t = T_START + (pct / 100) * T_SPAN;
    return ERAS.find((e) => t >= new Date(e.start).getTime() && t <= new Date(e.end).getTime()) ?? ERAS[ERAS.length - 1];
  }, []);

  const previewEra = hoverPct != null ? eraAtPct(hoverPct) : getEra(eraId);
  const activeEra = getEra(eraId);
  const activePct = (toPct(new Date(activeEra.start).getTime()) + toPct(new Date(activeEra.end).getTime())) / 2;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex flex-col items-stretch">
      {/* Expanded navigator */}
      {expanded && (
        <div className="pointer-events-auto border-t border-[color:var(--era-line)] bg-[color:var(--era-bg)]/95 px-5 pb-5 pt-4 backdrop-blur-xl detail-enter">
          <div className="mx-auto max-w-5xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
                Timeline · 2006 – now
              </span>
              <span className="font-[family-name:var(--era-font)] text-sm font-semibold">
                {previewEra.name}
              </span>
            </div>

            {/* Era band */}
            <div className="flex h-2 w-full overflow-hidden rounded-full">
              {ERAS.map((e) => {
                const w = toPct(new Date(e.end).getTime()) - toPct(new Date(e.start).getTime());
                return (
                  <button
                    key={e.id}
                    onClick={() => setEra(e.id)}
                    title={e.name}
                    className="h-full transition-opacity hover:opacity-100"
                    style={{
                      width: `${w}%`,
                      backgroundColor: e.theme.accent,
                      opacity: e.id === previewEra.id ? 1 : 0.4,
                    }}
                    aria-label={`Go to ${e.name}`}
                  />
                );
              })}
            </div>

            {/* Milestone markers for the previewed era */}
            <div className="relative mt-4 h-16">
              {ERAS.map((e) =>
                e.id === previewEra.id ? (
                  <EraMilestones key={e.id} eraId={e.id} />
                ) : null,
              )}
            </div>
          </div>
        </div>
      )}

      {/* Peek strip (always visible) */}
      <button
        onClick={() => setExpanded((v) => !v)}
        onPointerMove={(e) => expanded && handleMove(e.clientX)}
        onPointerLeave={() => setHoverPct(null)}
        aria-label={expanded ? 'Close timeline' : 'Open timeline navigator'}
        aria-expanded={expanded}
        className="pointer-events-auto group relative w-full border-t border-[color:var(--era-line)] bg-[color:var(--era-bg)]/90 px-5 py-2.5 backdrop-blur-xl"
      >
        <div ref={trackRef} className="mx-auto flex max-w-5xl items-center gap-3">
          <ChevronUp
            className={cn(
              'h-4 w-4 shrink-0 text-[color:var(--era-ink-soft)] transition-transform',
              expanded && 'rotate-180',
            )}
          />
          {/* Mini era rail */}
          <div className="relative h-1.5 flex-1 overflow-visible rounded-full bg-[color:var(--era-line)]">
            <div className="absolute inset-0 flex overflow-hidden rounded-full">
              {ERAS.map((e) => {
                const w = toPct(new Date(e.end).getTime()) - toPct(new Date(e.start).getTime());
                return (
                  <span
                    key={e.id}
                    style={{
                      width: `${w}%`,
                      backgroundColor: e.theme.accent,
                      opacity: e.id === activeEra.id ? 1 : 0.35,
                    }}
                  />
                );
              })}
            </div>
            {/* Active position dot */}
            <span
              className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--era-bg)]"
              style={{ left: `${activePct}%`, backgroundColor: 'var(--era-accent)' }}
            />
            {/* Now marker (client-only) */}
            {nowPct != null && (
              <span
                className="absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--era-ink)]"
                style={{ left: `${nowPct}%` }}
                title="Now"
              />
            )}
          </div>
          <span className="shrink-0 text-xs font-medium text-[color:var(--era-ink-soft)]">
            {expanded ? 'Close' : activeEra.shortName}
          </span>
        </div>
      </button>
    </div>
  );
}

function EraMilestones({ eraId }: { eraId: string }) {
  const { setEra } = useAppActions();
  const era = getEra(eraId);
  const milestones = MILESTONES_BY_ERA[eraId] ?? [];
  const start = new Date(era.start).getTime();
  const end = new Date(era.end).getTime();
  const span = Math.max(1, end - start);

  return (
    <div className="relative h-full" style={eraStyle(era)}>
      <div className="absolute left-0 right-0 top-2 h-px bg-[color:var(--era-line)]" />
      {milestones.map((m) => {
        const pct = ((new Date(m.date).getTime() - start) / span) * 100;
        return (
          <div
            key={m.id}
            className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${Math.min(96, Math.max(4, pct))}%` }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: 'var(--era-accent)' }}
            />
            <span className="mt-1.5 max-w-24 text-center text-[10px] leading-tight text-[color:var(--era-ink-soft)]">
              {m.label}
            </span>
          </div>
        );
      })}
      <button
        onClick={() => setEra(era.id)}
        className="era-btn-ghost absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full px-4 py-1.5 text-xs font-medium"
      >
        Enter {era.shortName}
      </button>
    </div>
  );
}
