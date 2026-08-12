'use client';

import { useEffect, useMemo, useState } from 'react';
import { Heart, Shirt, RefreshCw, Gem, ArrowLeft, ArrowRight, X, GitFork } from 'lucide-react';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { CAREER_START_MS, careerEndMs, ERAS, getEra } from '@/lib/longlive/eras';
import {
  CROSSING_THREADS,
  getThread,
  threadCrossings,
  threadPoints,
  type Crossing,
} from '@/lib/longlive/lenses';
import type { LensId } from '@/lib/longlive/types';
import { cn } from '@/lib/utils';
import { resolveCrossingMarkerTops } from './crossingMarkerLayout';

const THREAD_ICONS: Partial<Record<LensId, typeof Heart>> = {
  'love-story': Heart,
  fashion: Shirt,
  'taylors-version': RefreshCw,
  'the-proposal': Gem,
};

const RAIL_HEIGHT = 900;
const LANE_A_X = 24; // % from left
const LANE_B_X = 76;
const AXIS_X = 50;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const fmtYear = (ms: number) => new Date(ms).getUTCFullYear().toString();

function gapLabel(days: number): string {
  if (days <= 21) return 'same moment';
  if (days < 60) return `${days} days apart`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? '' : 's'} apart`;
}

/**
 * The intersection overlay: two narrative threads plotted on one shared career
 * axis (top = now, bottom = 2006, matching era mode and the thread scrubber).
 * Where a point from each thread lands near the same time, a connector marks a
 * "crossing" — the places their stories overlap. This is the era↔thread pivot
 * made spatial: every crossing links back out to its era and either thread.
 */
export function Crossings({ a, b }: { a: LensId; b: LensId }) {
  const { openCrossing, closeCrossing, openThread, openEra } = useAppActions();
  const { share } = useAppState();
  const [selected, setSelected] = useState<number | null>(null);

  // Close on Escape (#525) — the open crossing detail first (same as its X),
  // otherwise back to the thread gallery (same as "All threads"). The share
  // sheet owns Escape while it is open on top.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || share) return;
      if (selected !== null) setSelected(null);
      else closeCrossing();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, share, closeCrossing]);

  const start = CAREER_START_MS;
  const end = useMemo(() => careerEndMs(), []);
  const span = Math.max(1, end - start);
  const pct = (ms: number) => clamp01((end - ms) / span) * 100;

  const metaA = getThread(a);
  const metaB = getThread(b);
  const IconA = THREAD_ICONS[a] ?? Heart;
  const IconB = THREAD_ICONS[b] ?? Heart;

  const pointsA = useMemo(() => threadPoints(a), [a]);
  const pointsB = useMemo(() => threadPoints(b), [b]);
  const crossings = useMemo(() => threadCrossings(a, b), [a, b]);

  // Diamond tops after the ≥24px collision pass (#701); connectors keep the true dates.
  const markerTops = useMemo(
    () =>
      resolveCrossingMarkerTops(
        crossings.map(
          (c) => (pct(new Date(c.a.date).getTime()) + pct(new Date(c.b.date).getTime())) / 2,
        ),
        RAIL_HEIGHT,
      ),
    [crossings, end, span], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Which point indices participate in a crossing, so we can emphasize them.
  const { crossedA, crossedB } = useMemo(() => {
    const ca = new Set<string>();
    const cb = new Set<string>();
    for (const c of crossings) {
      ca.add(`${c.a.date}-${c.a.label}`);
      cb.add(`${c.b.date}-${c.b.label}`);
    }
    return { crossedA: ca, crossedB: cb };
  }, [crossings]);

  const eraBands = useMemo(
    () =>
      ERAS.map((e) => ({
        id: e.id,
        accent: e.theme.accent,
        top: pct(new Date(e.end).getTime()),
        bottom: pct(new Date(e.start).getTime()),
      })),
    [end, span], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const otherThreads = (exclude: LensId) => CROSSING_THREADS.filter((t) => t !== exclude);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-28 pt-10">
      {/* Header */}
      <header className="mx-auto max-w-2xl text-center">
        <button
          onClick={closeCrossing}
          className="era-btn-ghost mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          All threads
        </button>
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--era-line)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-[color:var(--era-ink-soft)]">
          <GitFork className="h-3.5 w-3.5" />
          Where threads cross
        </div>
        <h1 className="mt-5 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Two stories, one timeline
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-[color:var(--era-ink-soft)]">
          Lay any two threads over the same career axis and watch for where they
          line up — a wardrobe turn landing on a new romance, a re-recording
          answering an old heartbreak. Tap a crossing to pull it apart.
        </p>
      </header>

      {/* Thread pickers */}
      <div className="mx-auto mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
        <ThreadPicker
          label="Thread A"
          value={a}
          options={otherThreads(b)}
          onPick={(next) => {
            setSelected(null);
            openCrossing(next, b);
          }}
        />
        <ThreadPicker
          label="Thread B"
          value={b}
          options={otherThreads(a)}
          onPick={(next) => {
            setSelected(null);
            openCrossing(a, next);
          }}
        />
      </div>

      <p className="mt-5 text-center text-sm text-[color:var(--era-ink-soft)]">
        <span className="font-semibold text-[color:var(--era-ink)]">{crossings.length}</span>{' '}
        {crossings.length === 1 ? 'crossing' : 'crossings'} where{' '}
        <span className="font-medium text-[color:var(--era-ink)]">{metaA.title}</span> and{' '}
        <span className="font-medium text-[color:var(--era-ink)]">{metaB.title}</span> meet
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* The shared axis */}
        <div className="relative">
          {/* Lane headers */}
          <div className="mb-4 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-[color:var(--era-ink)]">
              <IconA className="h-4 w-4 text-[color:var(--era-accent)]" />
              {metaA.title}
            </span>
            <span className="uppercase tracking-widest text-[color:var(--era-ink-soft)]">
              now → 2006
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-[color:var(--era-ink)]">
              {metaB.title}
              <IconB className="h-4 w-4 text-[color:var(--era-accent)]" />
            </span>
          </div>

          <div className="relative" style={{ height: RAIL_HEIGHT }}>
            {/* Era bands on the center axis */}
            {eraBands.map((band) => (
              <div
                key={band.id}
                aria-hidden
                className="absolute"
                style={{
                  left: `${AXIS_X}%`,
                  top: `${band.top}%`,
                  height: `${Math.max(0, band.bottom - band.top)}%`,
                  width: 3,
                  transform: 'translateX(-50%)',
                  background: band.accent,
                  opacity: 0.4,
                }}
              />
            ))}

            {/* Center rail line */}
            <div
              aria-hidden
              className="absolute inset-y-0 w-px"
              style={{ left: `${AXIS_X}%`, transform: 'translateX(-50%)', background: 'var(--era-line)' }}
            />

            {/* Year ticks */}
            {[2006, 2010, 2014, 2018, 2022, 2026].map((yr) => {
              const top = pct(new Date(`${yr}-01-01`).getTime());
              if (top < 0 || top > 100) return null;
              return (
                <span
                  key={yr}
                  aria-hidden
                  className="absolute text-[10px] font-medium tabular-nums text-[color:var(--era-ink-soft)]"
                  style={{ left: `${AXIS_X}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <span className="rounded bg-[color:var(--era-bg)] px-1">{yr}</span>
                </span>
              );
            })}

            {/* Lane A points */}
            {pointsA.map((p, i) => {
              const era = getEra(p.eraId);
              const top = pct(new Date(p.date).getTime());
              const crossed = crossedA.has(`${p.date}-${p.label}`);
              return (
                <span
                  key={`a-${p.date}-${i}`}
                  aria-hidden
                  className="absolute rounded-full"
                  title={p.label}
                  style={{
                    left: `${LANE_A_X}%`,
                    top: `${top}%`,
                    height: crossed ? 11 : 7,
                    width: crossed ? 11 : 7,
                    transform: 'translate(-50%, -50%)',
                    background: era.theme.accent,
                    opacity: crossed ? 1 : 0.5,
                    boxShadow: crossed ? '0 0 0 2px var(--era-bg)' : 'none',
                  }}
                />
              );
            })}

            {/* Lane B points */}
            {pointsB.map((p, i) => {
              const era = getEra(p.eraId);
              const top = pct(new Date(p.date).getTime());
              const crossed = crossedB.has(`${p.date}-${p.label}`);
              return (
                <span
                  key={`b-${p.date}-${i}`}
                  aria-hidden
                  className="absolute rounded-full"
                  title={p.label}
                  style={{
                    left: `${LANE_B_X}%`,
                    top: `${top}%`,
                    height: crossed ? 11 : 7,
                    width: crossed ? 11 : 7,
                    transform: 'translate(-50%, -50%)',
                    background: era.theme.accent,
                    opacity: crossed ? 1 : 0.5,
                    boxShadow: crossed ? '0 0 0 2px var(--era-bg)' : 'none',
                  }}
                />
              );
            })}

            {/* Crossing connectors + markers */}
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" preserveAspectRatio="none">
              {crossings.map((c, i) => {
                const yA = pct(new Date(c.a.date).getTime());
                const yB = pct(new Date(c.b.date).getTime());
                const isSel = selected === i;
                return (
                  <line
                    key={`line-${i}`}
                    x1={`${LANE_A_X}%`}
                    y1={`${yA}%`}
                    x2={`${LANE_B_X}%`}
                    y2={`${yB}%`}
                    stroke="var(--era-accent)"
                    strokeWidth={isSel ? 2 : 1}
                    strokeOpacity={isSel ? 0.9 : selected == null ? 0.35 : 0.12}
                  />
                );
              })}
            </svg>

            {/* Crossing diamonds (interactive) */}
            {crossings.map((c, i) => {
              const yMid = markerTops[i];
              const isSel = selected === i;
              return (
                <button
                  key={`x-${i}`}
                  onClick={() => setSelected(isSel ? null : i)}
                  aria-label={`Crossing: ${c.a.label} and ${c.b.label}`}
                  className="absolute z-10 transition-transform hover:scale-125"
                  style={{
                    left: `${AXIS_X}%`,
                    top: `${yMid}%`,
                    height: 17,
                    width: 17,
                    transform: `translate(-50%, -50%) rotate(45deg) ${isSel ? 'scale(1.25)' : ''}`,
                    background: isSel
                      ? 'var(--era-accent)'
                      : 'color-mix(in srgb, var(--era-accent) 30%, var(--era-surface))',
                    border: '2px solid var(--era-accent)',
                    borderRadius: 3,
                    boxShadow: '0 0 0 3px var(--era-bg), 0 2px 8px -2px var(--era-glow)',
                    opacity: selected == null || isSel ? 1 : 0.4,
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* Detail rail */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {selected != null && crossings[selected] ? (
            <CrossingDetail
              crossing={crossings[selected]}
              metaATitle={metaA.title}
              metaBTitle={metaB.title}
              onClose={() => setSelected(null)}
              onOpenEra={openEra}
              onOpenThread={openThread}
              threadA={a}
              threadB={b}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[color:var(--era-line)] p-6 text-center text-sm text-[color:var(--era-ink-soft)]">
              <GitFork className="mx-auto mb-3 h-6 w-6 opacity-60" />
              Tap a crossing — a{' '}
              <span
                className="mx-1 inline-block h-2.5 w-2.5 align-middle"
                style={{ background: 'var(--era-accent)', transform: 'rotate(45deg)' }}
              />{' '}
              on the axis or a row in the list below — to see where the two stories meet.
            </div>
          )}

          {/* Chronological list of crossings */}
          <div className="mt-6 space-y-2">
            {crossings.map((c, i) => (
              <button
                key={`list-${i}`}
                onClick={() => setSelected(i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition',
                  selected === i
                    ? 'border-[color:var(--era-accent)] bg-[color:var(--era-surface)]'
                    : 'border-[color:var(--era-line)] hover:bg-[color:var(--era-surface)]',
                )}
              >
                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold tabular-nums"
                  style={{
                    background: `color-mix(in srgb, ${getEra(c.eraId).theme.accent} 18%, transparent)`,
                    color: getEra(c.eraId).theme.accent,
                  }}
                >
                  {fmtYear(c.date)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[color:var(--era-ink)]">{c.a.label}</span>
                  <span className="block truncate text-[color:var(--era-ink-soft)]">{c.b.label}</span>
                </span>
                <span className="shrink-0 text-[10px] uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                  {gapLabel(c.gapDays)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ThreadPicker({
  label,
  value,
  options,
  onPick,
}: {
  label: string;
  value: LensId;
  options: LensId[];
  onPick: (id: LensId) => void;
}) {
  return (
    <div className="flex-1 rounded-2xl border border-[color:var(--era-line)] bg-[color:var(--era-surface)]/50 p-3">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-[color:var(--era-ink-soft)]">
        {label}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map((id) => {
          const Icon = THREAD_ICONS[id] ?? Heart;
          const active = id === value;
          return (
            <button
              key={id}
              onClick={() => !active && onPick(id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition',
                active
                  ? 'border-transparent bg-[color:var(--era-accent)] text-[color:var(--era-bg)]'
                  : 'border-[color:var(--era-line)] text-[color:var(--era-ink-soft)] hover:text-[color:var(--era-ink)]',
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {getThread(id).title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CrossingDetail({
  crossing,
  metaATitle,
  metaBTitle,
  onClose,
  onOpenEra,
  onOpenThread,
  threadA,
  threadB,
}: {
  crossing: Crossing;
  metaATitle: string;
  metaBTitle: string;
  onClose: () => void;
  onOpenEra: (id: import('@/lib/longlive/types').EraId) => void;
  onOpenThread: (id: LensId) => void;
  threadA: LensId;
  threadB: LensId;
}) {
  const era = getEra(crossing.eraId);
  return (
    <div className="era-card rounded-2xl border p-5">
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest"
          style={{
            backgroundColor: `color-mix(in srgb, ${era.theme.accent} 16%, transparent)`,
            color: era.theme.accent,
          }}
        >
          {era.shortName} · {gapLabel(crossing.gapDays)}
        </span>
        <button
          onClick={onClose}
          className="era-icon-btn rounded-full p-1.5"
          aria-label="Close crossing detail"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
            {metaATitle}
          </div>
          <div className="mt-0.5 font-[family-name:var(--era-font)] text-lg leading-snug text-[color:var(--era-ink)]">
            {crossing.a.label}
          </div>
        </div>
        <div className="flex items-center gap-2 text-[color:var(--era-ink-soft)]">
          <span className="h-px flex-1 bg-[color:var(--era-line)]" />
          <GitFork className="h-3.5 w-3.5" />
          <span className="h-px flex-1 bg-[color:var(--era-line)]" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
            {metaBTitle}
          </div>
          <div className="mt-0.5 font-[family-name:var(--era-font)] text-lg leading-snug text-[color:var(--era-ink)]">
            {crossing.b.label}
          </div>
        </div>
      </div>

      {/* Pivot links */}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-[color:var(--era-line)] pt-4">
        <button
          onClick={() => onOpenEra(era.id)}
          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--era-line)] px-3 py-1.5 text-xs font-medium transition hover:border-[color:var(--era-accent)]"
        >
          Open {era.shortName}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            onOpenThread(threadA);
            window.scrollTo({ top: 0, behavior: 'auto' });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--era-line)] px-3 py-1.5 text-xs font-medium transition hover:border-[color:var(--era-accent)]"
        >
          {metaATitle}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            onOpenThread(threadB);
            window.scrollTo({ top: 0, behavior: 'auto' });
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--era-line)] px-3 py-1.5 text-xs font-medium transition hover:border-[color:var(--era-accent)]"
        >
          {metaBTitle}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
