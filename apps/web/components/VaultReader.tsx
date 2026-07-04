'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WheelEvent as ReactWheelEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { Era, Milestone, MonthItem, YearMonth } from '@swift2/shared';
import { monthsInEra, orderedEras } from '@swift2/shared';
import type { VaultSkeleton } from '@swift2/core';
import { eraSkin } from '../lib/theme';
import { Scrubber } from './Scrubber';
import { useMoment } from '../lib/useMoment';
import { MomentDetail } from './MomentDetail';
import { useTrackGuide } from '../lib/useTrackGuide';
import { TrackGuide } from './TrackGuide';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1] ?? '?'} ${year}`;
}

function ymKey(year: number, month: number): string {
  return `${year}-${month}`;
}

function keyFromISO(iso: string): string {
  const d = new Date(iso);
  return ymKey(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function rangeLabel(startDate: string, endDate: string): string {
  const s = new Date(startDate);
  const e = new Date(endDate);
  return `${monthLabel(s.getUTCFullYear(), s.getUTCMonth() + 1)} – ${monthLabel(
    e.getUTCFullYear(),
    e.getUTCMonth() + 1,
  )}`;
}

/** Merge month groups into one chronological, de-duplicated list. */
function sortedUniqueMonths(...groups: YearMonth[][]): YearMonth[] {
  const map = new Map<string, YearMonth>();
  for (const group of groups) {
    for (const ym of group) map.set(ymKey(ym.year, ym.month), ym);
  }
  return [...map.values()].sort((a, b) => a.year * 12 + a.month - (b.year * 12 + b.month));
}

const HEADER_OFFSET = 0.2; // detector line at 20% down the scroll viewport

/**
 * The Vault reader: one continuous vertical timeline with every era stacked, so
 * scrolling moves month-by-month and flows across eras (the "physical timeline"
 * from the spec/vision). A peek→expand scrubber rides on top for coarse era
 * jumps and stays in sync with scroll position; the surface re-skins to the era
 * currently in view.
 */
export function VaultReader({ skeleton }: { skeleton: VaultSkeleton }) {
  const eras = orderedEras(skeleton.eras);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, eras.length - 1));
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const activeRef = useRef(activeIndex);
  const touchY = useRef(0);
  const moment = useMoment();
  const trackGuide = useTrackGuide();

  const jumpToEra = useCallback((i: number) => {
    sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Default to the most recent era on first render.
  useEffect(() => {
    sectionRefs.current[eras.length - 1]?.scrollIntoView({ block: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll-spy: whichever era section covers the detector line is "active".
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return undefined;
    let ticking = false;
    const compute = () => {
      ticking = false;
      const line = root.scrollTop + root.clientHeight * HEADER_OFFSET;
      let idx = 0;
      for (let i = 0; i < sectionRefs.current.length; i += 1) {
        const el = sectionRefs.current[i];
        if (el && el.offsetTop <= line) idx = i;
      }
      if (idx !== activeRef.current) {
        activeRef.current = idx;
        setActiveIndex(idx);
      }
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(compute);
      }
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => root.removeEventListener('scroll', onScroll);
  }, [eras.length]);

  // Overscroll at the very top summons the expanded navigator (pull-to-refresh
  // muscle memory); a downward move collapses it — never fights normal scroll.
  const onWheel = useCallback((e: ReactWheelEvent) => {
    const root = scrollRef.current;
    if (!root) return;
    if (root.scrollTop <= 0 && e.deltaY < 0) setExpanded(true);
    else if (e.deltaY > 4) setExpanded(false);
  }, []);
  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    touchY.current = e.touches[0]?.clientY ?? 0;
  }, []);
  const onTouchMove = useCallback((e: ReactTouchEvent) => {
    const root = scrollRef.current;
    if (!root) return;
    const dy = (e.touches[0]?.clientY ?? 0) - touchY.current;
    if (root.scrollTop <= 0 && dy > 24) setExpanded(true);
    else if (dy < -8) setExpanded(false);
  }, []);

  const active = eras[activeIndex] ?? eras[0];
  if (!active) {
    return <main style={{ padding: '3rem', fontFamily: 'system-ui' }}>No eras yet.</main>;
  }

  const openItem = moment.state.itemId
    ? (skeleton.monthItems.find((it) => it.id === moment.state.itemId) ?? null)
    : null;

  return (
    <div
      className="era-skin"
      style={{ ...eraSkin(active.theme), display: 'flex', flexDirection: 'column', height: '100dvh' }}
    >
      <Scrubber
        eras={eras}
        index={activeIndex}
        expanded={expanded}
        onExpandedChange={setExpanded}
        onSelectEra={jumpToEra}
        milestones={skeleton.milestones}
      />
      <div
        ref={scrollRef}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        style={{ position: 'relative', flex: '1 1 auto', overflowY: 'auto', background: 'var(--bg)' }}
      >
        {eras.map((era, i) => (
          <section
            key={era.slug}
            ref={(el) => {
              sectionRefs.current[i] = el;
            }}
            data-era={era.slug}
            style={eraSkin(era.theme)}
          >
            <EraSection
              era={era}
              tint={era.theme.bg}
              nextTint={eras[i + 1]?.theme.bg ?? era.theme.bg}
              milestones={skeleton.milestones.filter((m) => m.eraSlug === era.slug)}
              items={skeleton.monthItems.filter((it) => it.eraSlug === era.slug)}
              onOpen={moment.open}
              onOpenTracks={() => trackGuide.open(era.slug, era.album)}
            />
          </section>
        ))}
      </div>

      <MomentDetail
        state={moment.state}
        title={openItem?.title ?? ''}
        onClose={moment.close}
        onRetry={() => {
          if (moment.state.itemId) moment.open(moment.state.itemId);
        }}
      />
      <TrackGuide
        state={trackGuide.state}
        onClose={trackGuide.close}
        onRetry={() => {
          if (trackGuide.state.status !== 'idle') trackGuide.open(trackGuide.state.eraSlug, trackGuide.state.album);
        }}
      />
    </div>
  );
}

function EraSection({
  era,
  tint,
  nextTint,
  milestones,
  items,
  onOpen,
  onOpenTracks,
}: {
  era: Era;
  /** This era's body background color. */
  tint: string;
  /** The next era's body color — this era fades into it at the bottom. */
  nextTint: string;
  milestones: Milestone[];
  items: MonthItem[];
  onOpen: (itemId: string) => void;
  onOpenTracks: () => void;
}) {
  // An era's story includes its lead-up and aftermath — a lead single or an
  // awards win can fall outside the album's release→next-release window. So
  // render the era's nominal months UNION the months its own items/milestones
  // land in, rather than clipping to the window (which silently drops them).
  const months = sortedUniqueMonths(
    monthsInEra(era),
    items.map((it) => ({ year: it.year, month: it.month })),
    milestones.map((m) => {
      const d = new Date(m.date);
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
    }),
  );
  const milestonesByMonth = groupBy(milestones, (m) => keyFromISO(m.date));
  const itemsByMonth = groupBy(items, (i) => ymKey(i.year, i.month));

  return (
    <div>
      {/* Hero: the vivid era gradient blooms out of and settles back into the
          era's body color, so it never hard-cuts against the timeline. */}
      <header
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: era.theme.heroGradient,
          color: '#fff',
          padding: '3rem 1.5rem 2.25rem',
          textShadow: '0 1px 12px rgba(0,0,0,0.35)',
        }}
      >
        <div
          aria-hidden
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: `linear-gradient(180deg, ${tint}, transparent)` }}
        />
        <div
          aria-hidden
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 72, background: `linear-gradient(0deg, ${tint}, transparent)` }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, margin: '0 auto' }}>
          <div style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, opacity: 0.85 }}>
            {era.theme.eyebrow}
          </div>
          <h1 style={{ margin: '0.35rem 0 0.2rem', fontSize: '2.4rem', lineHeight: 1.05 }}>{era.title}</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            {era.album} · {rangeLabel(era.startDate, era.endDate)}
          </p>
          <button
            type="button"
            onClick={onOpenTracks}
            style={{
              marginTop: 14,
              padding: '0.35rem 0.85rem',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.55)',
              background: 'rgba(255,255,255,0.14)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 13,
              backdropFilter: 'blur(2px)',
            }}
          >
            ♪ Track guide
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.25rem 1rem 2.5rem' }}>
        {months.map(({ year, month }) => {
          const key = ymKey(year, month);
          return (
            <MonthRow
              key={key}
              label={monthLabel(year, month)}
              milestones={milestonesByMonth.get(key) ?? []}
              items={itemsByMonth.get(key) ?? []}
              onOpen={onOpen}
            />
          );
        })}
      </div>

      {/* Fade bridge into the next era's color — a text-free zone, so the
          continuous timeline reads as one flowing spectrum. */}
      <div aria-hidden style={{ height: 180, background: `linear-gradient(180deg, ${tint}, ${nextTint})` }} />
    </div>
  );
}

function MonthRow({
  label,
  milestones,
  items,
  onOpen,
}: {
  label: string;
  milestones: Milestone[];
  items: MonthItem[];
  onOpen: (itemId: string) => void;
}) {
  const empty = milestones.length === 0 && items.length === 0;
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: '96px 1fr',
        gap: 12,
        padding: '0.6rem 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div style={{ color: 'var(--ink-soft)', fontSize: 13, paddingTop: 2 }}>{label}</div>
      <div>
        {empty ? (
          <div style={{ color: 'var(--ink-soft)', opacity: 0.4 }}>·</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {milestones.map((m) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span
                  aria-hidden
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: 'var(--accent)',
                    display: 'inline-block',
                    flex: '0 0 auto',
                  }}
                />
                <span style={{ fontWeight: 600 }}>{m.title}</span>
                <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>
                  {m.type === 'tour' ? 'tour' : 'release'}
                </span>
              </div>
            ))}
            {items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => onOpen(it.id)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'inherit',
                  font: 'inherit',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{it.title}</span>
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--ink-soft)',
                      border: '1px solid var(--line)',
                      borderRadius: 999,
                      padding: '1px 7px',
                      flex: '0 0 auto',
                    }}
                  >
                    {it.category}
                  </span>
                </div>
                {it.snippet ? (
                  <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{it.snippet}</div>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
