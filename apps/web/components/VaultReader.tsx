'use client';

import { useState } from 'react';
import type { CSSProperties } from 'react';
import type { Milestone, MonthItem } from '@swift2/shared';
import { monthsInEra, orderedEras } from '@swift2/shared';
import type { VaultSkeleton } from '@swift2/core';
import { eraSkin } from '../lib/theme';

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

export function VaultReader({ skeleton }: { skeleton: VaultSkeleton }) {
  const eras = orderedEras(skeleton.eras);
  const [index, setIndex] = useState(Math.max(0, eras.length - 1));
  const era = eras[index];

  if (!era) {
    return <main style={{ padding: '3rem', fontFamily: 'system-ui' }}>No eras yet.</main>;
  }

  const months = monthsInEra(era);
  const eraMilestones = skeleton.milestones.filter((m) => m.eraSlug === era.slug);
  const eraItems = skeleton.monthItems.filter((i) => i.eraSlug === era.slug);
  const milestonesByMonth = groupBy(eraMilestones, (m) => keyFromISO(m.date));
  const itemsByMonth = groupBy(eraItems, (i) => ymKey(i.year, i.month));

  return (
    <div className="era-skin" style={eraSkin(era.theme)}>
      <header
        style={{
          background: era.theme.heroGradient,
          color: '#fff',
          padding: '3.5rem 1.5rem 2.5rem',
          textShadow: '0 1px 12px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, opacity: 0.85 }}>
            {era.theme.eyebrow}
          </div>
          <h1 style={{ margin: '0.35rem 0 0.2rem', fontSize: '2.6rem', lineHeight: 1.05 }}>{era.title}</h1>
          <p style={{ margin: 0, opacity: 0.9 }}>
            {era.album} · {rangeLabel(era.startDate, era.endDate)}
          </p>
        </div>
      </header>

      {/* Era switcher — a placeholder for the gesture scrubber that lands in W4. */}
      <nav
        aria-label="Eras"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 2,
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '0.75rem 1rem',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--line)',
        }}
      >
        {eras.map((e, i) => {
          const active = i === index;
          const style: CSSProperties = {
            flex: '0 0 auto',
            padding: '0.4rem 0.8rem',
            borderRadius: 999,
            border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
            background: active ? 'var(--accent)' : 'transparent',
            color: active ? 'var(--bg)' : 'var(--ink-soft)',
            cursor: 'pointer',
            fontSize: 13,
            whiteSpace: 'nowrap',
          };
          return (
            <button
              key={e.slug}
              type="button"
              aria-current={active ? 'true' : undefined}
              style={style}
              onClick={() => setIndex(i)}
            >
              {e.album}
            </button>
          );
        })}
      </nav>

      <main style={{ maxWidth: 760, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
        {months.map(({ year, month }) => {
          const key = ymKey(year, month);
          const ms = milestonesByMonth.get(key) ?? [];
          const items = itemsByMonth.get(key) ?? [];
          return <MonthRow key={key} label={monthLabel(year, month)} milestones={ms} items={items} />;
        })}
      </main>
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
