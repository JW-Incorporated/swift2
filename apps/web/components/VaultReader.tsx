'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { Era, Milestone, MonthItem } from '@swift2/shared';
import { eraTimelineMonths, orderedEras } from '@swift2/shared';
import type { VaultSkeleton } from '@swift2/core';
import { eraSkin } from '../lib/theme';
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

const HEADER_OFFSET = 0.2; // detector line at 20% down the scroll viewport
const RAIL_W = 40; // right-edge hit strip; the visible control floats within it

/**
 * The Vault reader: one continuous vertical timeline with every era stacked, so
 * scrolling moves month-by-month and flows across eras. A persistent glass rail
 * on the right edge shows every era as a colour dot; tap or drag to jump. It
 * stays in sync with scroll position and the surface re-skins to the era in view.
 */
export function VaultReader({ skeleton }: { skeleton: VaultSkeleton }) {
  const eras = orderedEras(skeleton.eras);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, eras.length - 1));
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const activeRef = useRef(activeIndex);
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
      style={{ ...eraSkin(active.theme), position: 'relative', height: '100dvh', overflow: 'hidden' }}
    >
      <div
        ref={scrollRef}
        style={{
          height: '100%',
          overflowY: 'auto',
          background: 'var(--bg)',
          paddingRight: RAIL_W, // keep content clear of the rail
        }}
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

      <EraRail eras={eras} activeIndex={activeIndex} onSelectEra={jumpToEra} />

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

/**
 * Persistent era rail — an iOS-section-scrubber crossed with a glass control:
 * a slim frosted capsule floating on the right edge holding one small colour dot
 * per era. Restrained at rest; the active dot grows and, while dragging, a
 * magnified album "bubble" appears beside it. Snaps to eras only (v1); no
 * per-frame React state beyond the coarse era index (≤1 change per boundary).
 */
function EraRail({
  eras,
  activeIndex,
  onSelectEra,
}: {
  eras: Era[];
  activeIndex: number;
  onSelectEra: (i: number) => void;
}) {
  const capsuleRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);
  const [scrubbing, setScrubbing] = useState(false);
  const n = eras.length;

  // Map a pointer's Y to an era over the glass capsule's extent (where the dots
  // live), so the drag lines up with what's on screen.
  const eraAtClientY = (clientY: number): number => {
    const el = capsuleRef.current;
    if (!el) return activeIndex;
    const rect = el.getBoundingClientRect();
    const f = rect.height ? (clientY - rect.top) / rect.height : 0;
    return Math.min(n - 1, Math.max(0, Math.floor(f * n)));
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setScrubbing(true);
    onSelectEra(eraAtClientY(e.clientY));
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragging.current) onSelectEra(eraAtClientY(e.clientY));
  };
  const endDrag = () => {
    dragging.current = false;
    setScrubbing(false);
  };

  if (n === 0) return null;

  return (
    // Transparent full-height hit strip (comfortable touch target); the visible
    // control is the slim glass capsule floating within it.
    <div
      role="slider"
      aria-label="Era timeline"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={n - 1}
      aria-valuenow={activeIndex}
      aria-valuetext={eras[activeIndex]?.album}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown' && activeIndex < n - 1) {
          e.preventDefault();
          onSelectEra(activeIndex + 1);
        } else if (e.key === 'ArrowUp' && activeIndex > 0) {
          e.preventDefault();
          onSelectEra(activeIndex - 1);
        }
      }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: RAIL_W,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        touchAction: 'none',
        cursor: 'pointer',
        zIndex: 5,
      }}
    >
      <div
        ref={capsuleRef}
        style={{
          position: 'relative',
          marginRight: 7,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 9,
          padding: '10px 6px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.10)',
          backdropFilter: 'blur(14px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(14px) saturate(1.5)',
          border: '1px solid rgba(255,255,255,0.22)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.22)',
        }}
      >
        {eras.map((era, i) => {
          const isActive = i === activeIndex;
          return (
            <span
              key={era.slug}
              aria-hidden
              style={{
                width: isActive ? 10 : 6,
                height: isActive ? 10 : 6,
                borderRadius: 999,
                background: era.theme.accent,
                opacity: isActive ? 1 : 0.45,
                boxShadow: isActive ? '0 0 0 3px rgba(255,255,255,0.30)' : 'none',
                transition: 'width 180ms ease, height 180ms ease, opacity 180ms ease, box-shadow 180ms ease',
              }}
            />
          );
        })}

        {/* iOS-style scrub bubble: the current album, magnified beside the dot. */}
        {scrubbing ? (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: 'calc(100% + 12px)',
              top: `${((activeIndex + 0.5) / n) * 100}%`,
              transform: 'translateY(-50%)',
              padding: '7px 14px',
              borderRadius: 12,
              background: 'rgba(17,17,22,0.92)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 6px 22px rgba(0,0,0,0.45)',
            }}
          >
            {eras[activeIndex]?.album}
          </div>
        ) : null}
      </div>
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
  // awards win can fall outside the album's release→next-release window, so this
  // unions the nominal span with the months its items/milestones land in rather
  // than clipping (shared domain logic, also reused by mobile).
  const milestonesByMonth = groupBy(milestones, (m) => keyFromISO(m.date));
  const itemsByMonth = groupBy(items, (i) => ymKey(i.year, i.month));
  // Only render months that actually have something — empty months just add
  // whitespace and squish the real content. Order preserved (chronological).
  const months = eraTimelineMonths(era, items, milestones).filter(({ year, month }) => {
    const key = ymKey(year, month);
    return (itemsByMonth.get(key)?.length ?? 0) > 0 || (milestonesByMonth.get(key)?.length ?? 0) > 0;
  });

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

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.25rem 1rem 2.5rem' }}>
        {months.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, opacity: 0.7 }}>
            No moments logged for this era yet.
          </p>
        ) : (
          months.map(({ year, month }) => {
            const key = ymKey(year, month);
            return (
              <MonthBlock
                key={key}
                label={monthLabel(year, month)}
                milestones={milestonesByMonth.get(key) ?? []}
                items={itemsByMonth.get(key) ?? []}
                onOpen={onOpen}
              />
            );
          })
        )}
      </div>

      {/* Fade bridge into the next era's color — a text-free zone, so the
          continuous timeline reads as one flowing spectrum. */}
      <div aria-hidden style={{ height: 160, background: `linear-gradient(180deg, ${tint}, ${nextTint})` }} />
    </div>
  );
}

/**
 * One month's worth of content: a light date label, then full-width moment
 * cards (roomy, tappable, with space a future thumbnail can slot into).
 */
function MonthBlock({
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
  return (
    <section style={{ margin: '0 0 1.5rem' }}>
      <div
        style={{
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.09em',
          color: 'var(--ink-soft)',
          fontWeight: 700,
          marginBottom: 10,
        }}
      >
        {label}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {milestones.map((m) => (
          <div
            key={m.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 12,
              background: 'var(--accent)',
              color: 'var(--bg)',
            }}
          >
            <span aria-hidden style={{ fontSize: 15 }}>{m.type === 'tour' ? '🎤' : '💿'}</span>
            <span style={{ fontWeight: 700 }}>{m.title}</span>
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
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: '13px 15px',
              cursor: 'pointer',
              color: 'inherit',
              font: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontWeight: 700, fontSize: 16, lineHeight: 1.25 }}>{it.title}</span>
              <span
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--ink-soft)',
                  border: '1px solid var(--line)',
                  borderRadius: 999,
                  padding: '2px 8px',
                  flex: '0 0 auto',
                }}
              >
                {it.category}
              </span>
            </div>
            {it.snippet ? (
              <div style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.45, marginTop: 6 }}>
                {it.snippet}
              </div>
            ) : null}
          </button>
        ))}
      </div>
    </section>
  );
}
