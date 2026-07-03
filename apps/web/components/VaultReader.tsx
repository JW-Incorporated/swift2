'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { WheelEvent as ReactWheelEvent, TouchEvent as ReactTouchEvent } from 'react';
import type { Era, Milestone, MonthItem } from '@swift2/shared';
import { monthsInEra, orderedEras } from '@swift2/shared';
import type { VaultSkeleton } from '@swift2/core';
import { eraSkin } from '../lib/theme';
import { Scrubber } from './Scrubber';

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
              milestones={skeleton.milestones.filter((m) => m.eraSlug === era.slug)}
              items={skeleton.monthItems.filter((it) => it.eraSlug === era.slug)}
            />
          </section>
        ))}
      </div>
    </div>
  );
}

function EraSection({
  era,
  milestones,
  items,
}: {
  era: Era;
  milestones: Milestone[];
  items: MonthItem[];
}) {
  const months = monthsInEra(era);
  const milestonesByMonth = groupBy(milestones, (m) => keyFromISO(m.date));
  const itemsByMonth = groupBy(items, (i) => ymKey(i.year, i.month));

  return (
    <div>
      <header
        style={{
          background: era.theme.heroGradient,
          color: '#fff',
          padding: '2.75rem 1.5rem 2rem',
          textShadow: '0 1px 12px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, opacity: 0.85 }}>
            {era.theme.eyebrow}
          </div>
          <h1 style={{ margin: '0.35rem 0 0.2rem', fontSize: '2.4rem', lineHeight: 1.05 }}>{era.title}</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            {era.album} · {rangeLabel(era.startDate, era.endDate)}
          </p>
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
            />
          );
        })}
      </div>
    </div>
  );
}

function MonthRow({
  label,
  milestones,
  items,
}: {
  label: string;
  milestones: Milestone[];
  items: MonthItem[];
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
              <div key={it.id}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontWeight: 600 }}>{it.title}</span>
                  <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{it.category}</span>
                </div>
                {it.snippet ? (
                  <div style={{ color: 'var(--ink-soft)', fontSize: 14 }}>{it.snippet}</div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
