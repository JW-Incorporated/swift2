'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { getEra } from '@/lib/longlive/eras';
import { RELATIONSHIPS, SINGLE_PERIODS } from '@/lib/longlive/lenses';
import { allocateHitRanges, durationLabel, mergedTimeline, monthsBetween, type LoveStoryEntry } from '@/lib/longlive/love-story';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { EntryDetail } from './EntryDetail';

/** WCAG 2.5.8 minimum target size (CSS px) that the band's hit ranges aim for (#658). */
const MIN_HIT_PX = 24;

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

function entryName(entry: LoveStoryEntry): string {
  return entry.kind === 'relationship' ? entry.name : 'Solo';
}

/** "Joe Jonas, 2008 – 2008 · 3mo" — the label shared by the band button and the list row. */
function entryLabel(entry: LoveStoryEntry): string {
  const span = `${fmtYear(entry.start)}${entry.end ? `–${fmtYear(entry.end)}` : '–present'}`;
  return `${entryName(entry)}, ${span}, ${durationLabel(entry.start, entry.end)}`;
}

/**
 * The Love Story thread ("Blank Spaces"): a single continuous timeline band
 * from debut to present. Relationships are solid colored segments; solo
 * periods are the dashed, cross-hatched segments between them — first-class
 * entries, not visual afterthoughts, because who she wasn't with matters as
 * much as who she was. The ongoing Travis Kelce relationship gets an
 * arrow-tipped right edge (the "this one keeps going" cue) via the isOngoing
 * check.
 *
 * No career scrubber here — this timeline band IS the thread's scrubber; a
 * second one would duplicate it (see docs/threads-rework-2026-07-10.md).
 *
 * Two-surface structure, identical at every viewport (2026-08-11):
 *
 * - **The band** is the overview and the picker. Painted layer is purely
 *   visual; a transparent hit layer above it carries the buttons, allocated
 *   by `allocateHitRanges` so every range covers its own painted centre (see
 *   that function for the mis-targeting bug this replaced).
 * - **The chapter list** below is the authoritative control: one full-width
 *   row per entry, holding the single `EntryDetail` render site. It is what
 *   makes the band's unavoidably-narrow slivers conformant under WCAG 2.5.8's
 *   "Equivalent" exception, and it is how touch users actually pick a
 *   chapter — a phone-width band cannot give 18 entries a 24px target, so
 *   pretending otherwise (as the old mobile-only mini bar did, with 3.6px
 *   buttons covering relationships only) was the mobile bug, not a styling
 *   detail.
 *
 * Selecting from the band scrolls the matching row into view, so a band
 * interaction always has a visible result.
 */
export function LoveStoryThread() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const timeline = mergedTimeline(RELATIONSHIPS, SINGLE_PERIODS);

  // Let the mobile back-swipe gesture close an expanded entry instead of
  // leaving the app — same pattern as the app's other overlays.
  useBackDismiss(Boolean(activeId), () => setActiveId(null));

  // Refs point at each row's HEADER button, not its wrapper: the wrapper grows
  // to include the expanded EntryDetail, and centring a tall wrapper puts its
  // top above the viewport — you'd scroll to a chapter and land in the middle
  // of it. Centring the 44px header always lands on the row you picked.
  const rowRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const setRowRef = useCallback((id: string, el: HTMLButtonElement | null) => {
    if (el) rowRefs.current.set(id, el);
    else rowRefs.current.delete(id);
  }, []);

  const toggle = useCallback((id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
  }, []);

  /**
   * Band selection. Opens the entry and brings its list row on screen — a tap
   * on the band used to expand a row hundreds of pixels below the fold with
   * no scroll, which is what "the bar doesn't work at all on mobile" looked
   * like from the outside even when the tap did land.
   */
  const selectFromBand = useCallback(
    (id: string) => {
      const isOpening = activeId !== id;
      toggle(id);
      if (!isOpening) return;
      // Let the row expand first so we scroll to its final position.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rowRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      });
    },
    [activeId, toggle],
  );

  // Hit ranges need the band's pixel width to express 24px in %; the
  // fallback only matters before the first measure.
  const bandRef = useRef<HTMLDivElement | null>(null);
  const [bandWidth, setBandWidth] = useState(1024);
  useEffect(() => {
    const el = bandRef.current;
    if (!el) return;
    const measure = () => {
      if (el.clientWidth > 0) setBandWidth(el.clientWidth);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const positioned = timeline.map((entry) => {
    const startPct = pct(toMs(entry.start));
    const endPct = pct(toMs(entry.end ?? new Date().toISOString()));
    return { entry, startPct, widthPct: Math.max(endPct - startPct, 0.6) };
  });
  const hitRanges = allocateHitRanges(
    positioned.map((p) => ({ start: p.startPct, end: p.startPct + p.widthPct })),
    (MIN_HIT_PX / bandWidth) * 100,
  );

  // --- touch scrub layer (< sm): one control, resolved by nearest centre ---
  const scrubbingRef = useRef(false);
  const centres = positioned.map((p) => p.startPct + p.widthPct / 2);
  /** Index of the painted block whose centre is closest to a pointer x. */
  function nearestAt(clientX: number, el: HTMLElement): number {
    const r = el.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * 100;
    let best = 0;
    for (let i = 1; i < centres.length; i++) {
      if (Math.abs(centres[i] - x) < Math.abs(centres[best] - x)) best = i;
    }
    return best;
  }
  function onScrubDown(e: ReactPointerEvent<HTMLDivElement>) {
    scrubbingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    setHoverId(timeline[nearestAt(e.clientX, e.currentTarget)].id);
  }
  function onScrubMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!scrubbingRef.current) return;
    setHoverId(timeline[nearestAt(e.clientX, e.currentTarget)].id);
  }
  function onScrubUp(e: ReactPointerEvent<HTMLDivElement>) {
    scrubbingRef.current = false;
    selectFromBand(timeline[nearestAt(e.clientX, e.currentTarget)].id);
    setHoverId(null);
  }
  /** The slider's value: whatever is cued mid-drag, else the open entry. */
  const scrubIndex = Math.max(0, timeline.findIndex((e) => e.id === (hoverId ?? activeId)));
  function onScrubKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    const delta =
      e.key === 'ArrowRight' || e.key === 'ArrowUp' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -1 : 0;
    if (delta === 0) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectFromBand(timeline[scrubIndex].id);
      }
      return;
    }
    e.preventDefault();
    selectFromBand(timeline[Math.min(timeline.length - 1, Math.max(0, scrubIndex + delta))].id);
  }

  const relCount = RELATIONSHIPS.length;
  const totalRelMonths = RELATIONSHIPS.reduce((acc, r) => acc + monthsBetween(r.start, r.end), 0);
  const totalSoloMonths = SINGLE_PERIODS.reduce((acc, s) => acc + monthsBetween(s.start, s.end), 0);

  // What the caption under the band names: whatever the pointer/keyboard is
  // on, else the open entry. Confirming the target BEFORE the click is what
  // makes a sliver comfortable to hit, independent of its pixel width.
  const cued = timeline.find((e) => e.id === (hoverId ?? activeId)) ?? null;

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

      {/* Timeline band — every viewport */}
      <section className="mb-6" aria-label="Timeline visualization">
        <div className="mb-2 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--era-ink-soft)' }}>
            2006 → 2026
          </p>
          <p className="text-[10px]" style={{ color: 'var(--era-ink-soft)' }}>
            Tap or drag the bar — relationships and solo stretches — for the full chapter
          </p>
        </div>

        <div className="relative mb-1 hidden h-5 sm:block">
          {YEAR_MARKERS.map((yr) => (
            <span key={yr} className="absolute -translate-x-1/2 text-[9px] tabular-nums" style={{ left: `${pct(toMs(`${yr}-01-01`))}%`, color: 'var(--era-ink-soft)' }}>
              {yr}
            </span>
          ))}
        </div>

        <div
          ref={bandRef}
          className="relative h-11 overflow-hidden rounded-md"
          style={{ background: 'var(--era-surface)', border: '1px solid var(--era-line)' }}
          onPointerLeave={() => setHoverId(null)}
        >
          {/* Painted layer — purely visual; interaction lives on the hit
              layer so sliver segments keep proportional widths. */}
          {positioned.map(({ entry, startPct, widthPct }) => {
            const isRel = entry.kind === 'relationship';
            const color = entryColor(entry);
            const isOngoing = isRel && entry.end === null;
            const lit = activeId === entry.id || hoverId === entry.id;

            return (
              <div
                key={entry.id}
                aria-hidden="true"
                className={['pointer-events-none absolute top-0 h-full transition-all duration-200', isOngoing ? 'rounded-l-sm rounded-r-none' : 'rounded-sm'].join(' ')}
                style={{
                  left: `${startPct}%`,
                  width: `${widthPct}%`,
                  minWidth: '4px',
                  backgroundColor: isRel ? (lit ? color : `${color}CC`) : 'var(--era-surface-2)',
                  backgroundImage: isRel ? undefined : 'repeating-linear-gradient(45deg, var(--era-line) 0 1px, transparent 1px 6px)',
                  border: isRel ? (isOngoing ? 'none' : `1px solid ${color}`) : lit ? '1px dashed var(--era-ink-soft)' : '1px dashed var(--era-line)',
                  clipPath: isOngoing ? 'polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%)' : undefined,
                  boxShadow: lit ? (isRel ? `0 0 0 2px ${color}55` : '0 0 0 2px var(--era-ink-soft)33') : undefined,
                  zIndex: isRel ? 2 : 1,
                }}
              >
                {isRel && widthPct > 6 && (
                  <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 truncate px-1 text-center text-[9px] font-semibold leading-none" style={{ color: '#fff' }}>
                    {entry.name.split(' ')[0]}
                  </span>
                )}
              </div>
            );
          })}
          {YEAR_MARKERS.map((yr) => (
            <div key={yr} className="pointer-events-none absolute bottom-0 top-0 w-px" style={{ left: `${pct(toMs(`${yr}-01-01`))}%`, background: 'var(--era-line)', opacity: 0.5 }} />
          ))}
          {/* POINTER hit layer (>= sm) — transparent, non-overlapping buttons
              tiling the band, each guaranteed to cover its own painted
              block's centre. Same timeline order, so keyboard focus order
              matches. Hidden below sm: 18 discrete targets cannot exist on a
              ~360px band (they'd be 3-20px), and pretending they can is what
              made the bar unusable on a phone. */}
          <div className="pointer-events-none absolute inset-0 hidden sm:block" style={{ zIndex: 3 }}>
            {positioned.map(({ entry }, i) => {
              const hit = hitRanges[i];
              const label = entryLabel(entry);
              return (
                <button
                  key={entry.id}
                  onClick={() => selectFromBand(entry.id)}
                  onPointerEnter={() => setHoverId(entry.id)}
                  onFocus={() => setHoverId(entry.id)}
                  onBlur={() => setHoverId(null)}
                  className="pointer-events-auto absolute top-0 h-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
                  style={{ left: `${hit.start}%`, width: `${hit.end - hit.start}%`, outlineColor: 'var(--era-ink)' }}
                  title={label}
                  aria-label={`${label}. Open details`}
                  aria-pressed={activeId === entry.id}
                />
              );
            })}
          </div>

          {/* TOUCH scrub layer (< sm) — ONE full-width control. Drag to sweep
              the caption through the chapters, release (or tap) to open the
              nearest one. Trades per-block targets for a single target the
              size of the whole band, which is the only shape that both works
              with a thumb and satisfies WCAG 2.5.8 at phone widths. */}
          <div
            role="slider"
            tabIndex={0}
            aria-label="Scrub the love-story timeline"
            aria-valuemin={0}
            aria-valuemax={timeline.length - 1}
            aria-valuenow={scrubIndex}
            aria-valuetext={entryLabel(timeline[scrubIndex])}
            onPointerDown={onScrubDown}
            onPointerMove={onScrubMove}
            onPointerUp={onScrubUp}
            onPointerCancel={() => setHoverId(null)}
            onKeyDown={onScrubKey}
            className="absolute inset-0 cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 sm:hidden"
            style={{ zIndex: 3, outlineColor: 'var(--era-ink)', touchAction: 'pan-y' }}
          />
        </div>

        {/* Names what the pointer/keyboard is currently over, so a two-month
            sliver is identifiable before you commit the click. aria-live is
            deliberately off — the buttons carry their own labels. */}
        <p
          aria-hidden
          className="mt-1.5 truncate text-[10px] font-medium"
          style={{ color: 'var(--era-ink)', minHeight: '1rem' }}
        >
          {cued ? entryLabel(cued) : ''}
        </p>
      </section>

      {/* Chapter list — every viewport. The authoritative control (WCAG 2.5.8
          "Equivalent"): one full-width row per entry, and the single place
          EntryDetail renders. */}
      <div className="overflow-hidden rounded-lg" style={{ border: '1px solid var(--era-line)', background: 'var(--era-surface)' }}>
        {timeline.map((entry) => {
          const color = entryColor(entry);
          const active = activeId === entry.id;
          return (
            <div key={entry.id}>
              <button
                ref={(el) => setRowRef(entry.id, el)}
                onClick={() => toggle(entry.id)}
                onPointerEnter={() => setHoverId(entry.id)}
                onPointerLeave={() => setHoverId(null)}
                className="group flex w-full items-center gap-3 px-3 py-2.5 text-left"
                aria-expanded={active}
              >
                <div className="w-1 shrink-0 self-stretch rounded-full" style={{ background: color, minHeight: 32 }} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="truncate text-sm font-semibold" style={{ color: 'var(--era-ink)' }}>
                      {entryName(entry)}
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
    </div>
  );
}
