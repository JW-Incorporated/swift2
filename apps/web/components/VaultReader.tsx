'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Era, Milestone, MonthItem, VaultCategory } from '@swift2/shared';
import { eraTimelineMonths, orderedEras } from '@swift2/shared';
import type { VaultSkeleton } from '@swift2/core';
import { eraSkin } from '../lib/theme';
import { buildModel } from '../lib/scrubberModel';
import { CATEGORY_BADGES, categoriesPresent, itemMatchesFilter } from '../lib/categoryBadges';
import { useMoment } from '../lib/useMoment';
import { MomentDetail } from './MomentDetail';
import { useTrackGuide } from '../lib/useTrackGuide';
import { TrackGuide } from './TrackGuide';
import { LoupeScrubber, LOUPE_RAIL_W } from './scrubber/LoupeScrubber';

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
 * scrolling moves month-by-month and flows across eras. The Loupe scrubber on
 * the right edge — a glass dot-capsule with a riding date tag that blooms into a
 * frosted magnifier on grab — navigates the timeline. It stays in sync with
 * scroll position (two-way) and the surface re-skins to the era in view.
 */
export function VaultReader({ skeleton }: { skeleton: VaultSkeleton }) {
  const eras = orderedEras(skeleton.eras);
  const model = useMemo(
    () => buildModel(skeleton.eras, skeleton.monthItems, skeleton.milestones),
    [skeleton.eras, skeleton.monthItems, skeleton.milestones],
  );
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
      style={{ ...eraSkin(active.theme), position: 'relative', height: '100dvh', overflow: 'hidden', background: 'var(--bg)' }}
    >
      <div
        ref={scrollRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: LOUPE_RAIL_W, // scroller stops before the scrubber, so its native scrollbar never sits under the capsule
          overflowY: 'auto',
          background: 'var(--bg)',
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

      <LoupeScrubber
        model={model}
        activeIndex={activeIndex}
        scrollRef={scrollRef}
        sectionRefs={sectionRefs}
        onJumpToEra={jumpToEra}
      />

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

  // Per-era category filter — independent state per era, off (empty) by
  // default. Kept local to this component so each era's filter is scoped to
  // itself and toggling one era never touches another's.
  const [activeCats, setActiveCats] = useState<Set<VaultCategory>>(() => new Set());
  const presentCats = categoriesPresent(items.map((it) => it.category));
  const toggleCat = useCallback((cat: VaultCategory) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);
  const clearCats = useCallback(() => setActiveCats(new Set()), []);

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
        {presentCats.length > 0 ? (
          <EraFilter
            eraTitle={era.title}
            categories={presentCats}
            active={activeCats}
            onToggle={toggleCat}
            onClear={clearCats}
          />
        ) : null}
        {months.length === 0 ? (
          <p style={{ color: 'var(--ink-soft)', fontSize: 14, opacity: 0.7 }}>
            No moments logged for this era yet.
          </p>
        ) : (
          months.map(({ year, month }) => {
            const key = ymKey(year, month);
            const monthMilestones = milestonesByMonth.get(key) ?? [];
            // Hide non-matching items in place. Milestones are wavetop markers,
            // not filterable category items, so they always remain.
            const visibleItems = (itemsByMonth.get(key) ?? []).filter((it) =>
              itemMatchesFilter(it.category, activeCats),
            );
            // A filter can empty a month out — drop it (and its label) rather
            // than leave a labelled gap.
            if (visibleItems.length === 0 && monthMilestones.length === 0) return null;
            return (
              <MonthBlock
                key={key}
                label={monthLabel(year, month)}
                milestones={monthMilestones}
                items={visibleItems}
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
              <CategoryBadge category={it.category} />
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

/**
 * Fixed-color category chip: emoji + label, one stable icon+color per category
 * (see lib/categoryBadges), deliberately independent of the era accent. Renders
 * as a filled pill with white text, so its contrast is white-on-color and holds
 * on any era surface (light or dark). The label text is the accessible name;
 * the emoji is decorative.
 */
function CategoryBadge({ category }: { category: VaultCategory }) {
  const badge = CATEGORY_BADGES[category];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: '#fff',
        background: badge.color,
        borderRadius: 999,
        padding: '3px 9px',
        flex: '0 0 auto',
        whiteSpace: 'nowrap',
      }}
    >
      <span aria-hidden>{badge.icon}</span>
      <span>{badge.label}</span>
    </span>
  );
}

/**
 * Per-era category filter. Collapsed and off by default: a "Filter" toggle that
 * expands to a row of category chips reusing the badge icon/color set. Selecting
 * chips hides non-matching items in place within THIS era only (state is scoped
 * per era by the caller). Pure client-side state over already-resident Tier 0
 * data — no fetch, no payload change. Lives inside the centered content column,
 * well clear of the right-edge era rail.
 */
function EraFilter({
  eraTitle,
  categories,
  active,
  onToggle,
  onClear,
}: {
  eraTitle: string;
  categories: VaultCategory[];
  active: ReadonlySet<VaultCategory>;
  onToggle: (cat: VaultCategory) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `era-filter-${eraTitle.replace(/\s+/g, '-').toLowerCase()}`;
  const activeCount = active.size;

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 999,
            padding: '6px 13px',
            cursor: 'pointer',
          }}
        >
          <span aria-hidden>⌕</span>
          Filter{activeCount > 0 ? ` · ${activeCount}` : ''}
          <span aria-hidden style={{ fontSize: 9 }}>{open ? '▲' : '▼'}</span>
        </button>
        {activeCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--ink-soft)',
              background: 'transparent',
              border: '1px solid var(--line)',
              borderRadius: 999,
              padding: '6px 12px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        ) : null}
      </div>

      {open ? (
        <div
          id={panelId}
          role="group"
          aria-label={`Filter ${eraTitle} by category`}
          style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}
        >
          {categories.map((cat) => {
            const badge = CATEGORY_BADGES[cat];
            const on = active.has(cat);
            return (
              <button
                key={cat}
                type="button"
                aria-pressed={on}
                onClick={() => onToggle(cat)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 700,
                  color: on ? '#fff' : 'var(--ink)',
                  background: on ? badge.color : 'transparent',
                  border: `1.5px solid ${badge.color}`,
                  borderRadius: 999,
                  padding: '5px 11px',
                  cursor: 'pointer',
                }}
              >
                <span aria-hidden>{badge.icon}</span>
                <span>{badge.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
