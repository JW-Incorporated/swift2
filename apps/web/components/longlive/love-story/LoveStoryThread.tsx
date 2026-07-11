'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getEra } from '@/lib/longlive/eras';
import { RELATIONSHIPS, SINGLE_PERIODS } from '@/lib/longlive/lenses';
import { durationLabel, mergedTimeline, monthsBetween, type LoveStoryEntry } from '@/lib/longlive/love-story';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { EntryDetail } from './EntryDetail';

const TIMELINE_START = new Date('2006-01-01').getTime();
const TIMELINE_END = new Date('2026-12-31').getTime();
const TOTAL_MS = TIMELINE_END - TIMELINE_START;
const YEAR_MARKERS = [2006, 2009, 2012, 2015, 2018, 2021, 2024, 2026];

function toMs(iso: string): number {
  return new Date(iso).getTime();
}
function pct(ms: number): number {
  return ((ms - TIMELINE_START) / TOTAL_MS) * 100;
}
function fmtYear(iso: string): string {
  return new Date(iso).getFullYear().toString();
}

function entryColor(entry: LoveStoryEntry): string {
  return entry.kind === 'relationship' ? getEra(entry.eraIds[0]).theme.accent : 'var(--era-line)';
}

/**
 * The Love Story thread: a single continuous timeline band from debut to
 * present. Relationships are solid colored segments; solo periods are the
 * dashed, cross-hatched segments between them — first-class entries, not
 * visual afterthoughts, because who she wasn't with matters as much as who
 * she was. The ongoing Travis Kelce relationship gets an arrow-tipped right
 * edge (the "this one keeps going" cue) via the isOngoing check.
 *
 * No career scrubber here — this timeline band IS the thread's scrubber; a
 * second one would duplicate it (see docs/threads-rework-2026-07-10.md).
 */
export function LoveStoryThread() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const timeline = mergedTimeline(RELATIONSHIPS, SINGLE_PERIODS);
  const activeEntry = activeId ? timeline.find((e) => e.id === activeId) ?? null : null;

  const toggle = (id: string) => setActiveId((prev) => (prev === id ? null : id));

  // Let the mobile back-swipe gesture close an expanded entry instead of
  // leaving the app — same pattern as the app's other overlays.
  useBackDismiss(Boolean(activeId), () => setActiveId(null));

  const relCount = RELATIONSHIPS.length;
  const totalRelMonths = RELATIONSHIPS.reduce((acc, r) => acc + monthsBetween(r.start, r.end), 0);
  const totalSoloMonths = SINGLE_PERIODS.reduce((acc, s) => acc + monthsBetween(s.start, s.end), 0);

  return (
    <div className="pt-8">
      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Relationships', value: String(relCount) },
          { label: 'Months in relationships', value: String(totalRelMonths) },
          { label: 'Months solo', value: String(totalSoloMonths) },
          { label: 'Years tracked', value: '20' },
        ].map((stat) => (
          <div key={stat.label} className="era-card rounded-2xl border p-4 text-center">
            <div className="font-[family-name:var(--era-font)] text-2xl font-semibold" style={{ color: 'var(--era-accent)' }}>
              {stat.value}
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider" style={{ color: 'var(--era-ink-soft)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop band */}
      <section className="mb-2 hidden sm:block" aria-label="Timeline visualization">
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
            2006 → 2026
          </p>
          <p className="text-[10px]" style={{ color: 'var(--era-ink-soft)' }}>
            Tap any block — relationships and solo stretches — for the full chapter
          </p>
        </div>

        <div className="relative mb-1 h-5">
          {YEAR_MARKERS.map((yr) => (
            <span key={yr} className="absolute -translate-x-1/2 text-[9px] tabular-nums" style={{ left: `${pct(toMs(`${yr}-01-01`))}%`, color: 'var(--era-ink-soft)' }}>
              {yr}
            </span>
          ))}
        </div>

        <div className="relative h-11 overflow-hidden rounded-md" style={{ background: 'var(--era-surface)', border: '1px solid var(--era-line)' }} aria-label="Love life timeline">
          {timeline.map((entry) => {
            const isRel = entry.kind === 'relationship';
            const color = entryColor(entry);
            const startPct = pct(toMs(entry.start));
            const endPct = pct(toMs(entry.end ?? new Date().toISOString()));
            const widthPct = Math.max(endPct - startPct, 0.6);
            const isOngoing = isRel && entry.end === null;
            const active = activeId === entry.id;

            return (
              <button
                key={entry.id}
                onClick={() => toggle(entry.id)}
                className={['group absolute top-0 h-full cursor-pointer transition-all duration-200', isOngoing ? 'rounded-l-sm rounded-r-none' : 'rounded-sm'].join(' ')}
                style={{
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                  minWidth: '4px',
                  backgroundColor: isRel ? (active ? color : `${color}CC`) : 'var(--era-surface-2)',
                  backgroundImage: isRel ? undefined : 'repeating-linear-gradient(45deg, var(--era-line) 0 1px, transparent 1px 6px)',
                  border: isRel ? (isOngoing ? 'none' : `1px solid ${color}`) : active ? '1px dashed var(--era-ink-soft)' : '1px dashed var(--era-line)',
                  clipPath: isOngoing ? 'polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%)' : undefined,
                  boxShadow: active ? (isRel ? `0 0 0 2px ${color}55` : '0 0 0 2px var(--era-ink-soft)33') : undefined,
                  zIndex: isRel ? 2 : 1,
                }}
                aria-label={isRel ? `${entry.name}, open details` : 'Solo period, open details'}
                aria-pressed={active}
              >
                {isRel && widthPct > 6 && (
                  <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 truncate px-1 text-center text-[9px] font-semibold leading-none" style={{ color: '#fff' }}>
                    {entry.name.split(' ')[0]}
                  </span>
                )}
              </button>
            );
          })}
          {YEAR_MARKERS.map((yr) => (
            <div key={yr} className="pointer-events-none absolute bottom-0 top-0 w-px" style={{ left: `${pct(toMs(`${yr}-01-01`))}%`, background: 'var(--era-line)', opacity: 0.5 }} />
          ))}
        </div>

        {activeEntry && <EntryDetail entry={activeEntry} timeline={timeline} onClose={() => setActiveId(null)} />}
      </section>

      {/* Mobile: mini bar + list */}
      <section className="mb-6 sm:hidden" aria-label="Timeline">
        <div className="mb-4">
          <div className="relative overflow-hidden rounded" style={{ background: 'var(--era-surface)', border: '1px solid var(--era-line)', height: 20 }}>
            {timeline
              .filter((e) => e.kind === 'relationship')
              .map((entry) => {
                const color = entryColor(entry);
                const startP = pct(toMs(entry.start));
                const endP = pct(toMs(entry.end ?? new Date().toISOString()));
                const w = Math.max(endP - startP, 1);
                return (
                  <button
                    key={entry.id}
                    onClick={() => toggle(entry.id)}
                    className="absolute top-0 h-full rounded-sm transition-opacity"
                    style={{ left: `${startP}%`, width: `${w}%`, minWidth: 3, background: color, opacity: activeId === entry.id ? 1 : 0.75, zIndex: 2 }}
                    aria-label={entry.kind === 'relationship' ? entry.name : 'Solo period'}
                  />
                );
              })}
            {YEAR_MARKERS.map((yr) => (
              <div key={yr} className="pointer-events-none absolute bottom-0 top-0 w-px" style={{ left: `${pct(toMs(`${yr}-01-01`))}%`, background: 'var(--era-line)', opacity: 0.5 }} />
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[9px]" style={{ color: 'var(--era-ink-soft)' }}>
            <span>2006</span>
            <span>2026</span>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--era-line)', background: 'var(--era-surface)' }}>
          {timeline.map((entry) => {
            const isRel = entry.kind === 'relationship';
            const color = entryColor(entry);
            const active = activeId === entry.id;
            return (
              <div key={entry.id}>
                <button onClick={() => toggle(entry.id)} className="group flex w-full items-center gap-3 py-2.5 text-left" aria-expanded={active}>
                  <div className="w-1 shrink-0 self-stretch rounded-full" style={{ background: color, minHeight: 32 }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="truncate text-sm font-semibold" style={{ color: 'var(--era-ink)' }}>
                        {isRel ? entry.name : 'Solo'}
                      </span>
                      {entry.id === 'kelce' && (
                        <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ background: `${color}22`, color }}>
                          married 2026
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--era-ink-soft)' }}>
                      {fmtYear(entry.start)}
                      {entry.end ? ` – ${fmtYear(entry.end)}` : ' – present'} · {durationLabel(entry.start, entry.end)}
                    </p>
                  </div>
                  <div className="shrink-0 transition-transform" style={{ color: 'var(--era-ink-soft)' }}>
                    {active ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>
                {active && <EntryDetail entry={entry} timeline={timeline} onClose={() => toggle(entry.id)} />}
                <div className="h-px w-full" style={{ background: 'var(--era-line)' }} />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
