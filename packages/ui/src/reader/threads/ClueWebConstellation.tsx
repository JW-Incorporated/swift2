'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { getEra } from '@swift2/experience';
import { EGG_NODES, EGG_LINKS, MOTIFS, MOTIF_BY_ID, motifOf } from '@swift2/experience';
import { useProgressActions } from '../store';
import type { MotifId } from '@swift2/experience';
import { ClueWebNodes } from './ClueWebNode';
import { LegendDot } from './ClueWebShared';

/* ── Constellation: the free-form explore map (opt-in) ───────────────── */
export function ConstellationView({
  initialMotif,
  initialNodeId = null,
  onBack,
}: {
  initialMotif: MotifId | null;
  initialNodeId?: string | null;
  onBack: () => void;
}) {
  const [active, setActive] = useState<string | null>(initialNodeId);
  const [hovered, setHovered] = useState<string | null>(null);
  const [filter, setFilter] = useState<MotifId | null>(initialMotif);

  // Revealing a node's detail panel counts as reading it. Effect (not the
  // click handler) so a cross-link's initialNodeId is recorded too.
  const { markEggsSeen } = useProgressActions();
  useEffect(() => {
    if (active) markEggsSeen([active]);
  }, [active, markEggsSeen]);

  const nodeById = (id: string) => EGG_NODES.find((n) => n.id === id)!;
  const activeNode = active ? nodeById(active) : null;

  const focus = active ?? hovered;
  const neighbors = new Set<string>();
  if (focus) {
    neighbors.add(focus);
    for (const l of EGG_LINKS) {
      if (l.from === focus) neighbors.add(l.to);
      if (l.to === focus) neighbors.add(l.from);
    }
  }
  const linkedTo = activeNode
    ? EGG_LINKS.filter((l) => l.from === active || l.to === active).map((l) => ({
        node: nodeById(l.from === active ? l.to : l.from),
        label: l.label,
      }))
    : [];

  const inFilter = (id: string) => !filter || motifOf(id) === filter;
  // A node's label shows only for the focused neighborhood.
  const showLabel = (id: string) => (focus ? neighbors.has(id) : false);
  // Muted when a filter excludes it, or when another node's neighborhood is focused.
  const muted = (id: string) => !inFilter(id) || (Boolean(focus) && !neighbors.has(id));

  return (
    <div>
      <button
        onClick={onBack}
        className="era-btn-ghost inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        All trails
      </button>

      {/* Motif filter */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        <FilterChip active={filter === null} onClick={() => setFilter(null)}>
          All clues
        </FilterChip>
        {MOTIFS.map((m) => (
          <FilterChip key={m.id} active={filter === m.id} onClick={() => setFilter(m.id)}>
            {m.label}
          </FilterChip>
        ))}
      </div>

      <div className="era-card mt-4 overflow-hidden rounded-2xl border">
        <div
          className="relative aspect-[4/3] w-full sm:aspect-[16/9]"
          onMouseLeave={() => setHovered(null)}
        >
          <svg
            viewBox="0 0 100 56.25"
            className="h-full w-full"
            role="group"
            aria-label="Clue web constellation"
          >
            {EGG_LINKS.map((link) => {
              const a = nodeById(link.from);
              const b = nodeById(link.to);
              const lit = focus === link.from || focus === link.to;
              const linkInFilter = inFilter(link.from) && inFilter(link.to);
              return (
                <line
                  key={`${link.from}-${link.to}`}
                  x1={a.x}
                  y1={a.y * 0.5625}
                  x2={b.x}
                  y2={b.y * 0.5625}
                  stroke="var(--era-accent)"
                  strokeWidth={lit ? 0.6 : 0.2}
                  strokeOpacity={lit ? 0.95 : focus ? 0.1 : linkInFilter ? 0.3 : 0.06}
                  strokeDasharray="1.5 1.5"
                />
              );
            })}
            <ClueWebNodes
              active={active}
              muted={muted}
              onToggle={(id) => setActive(active === id ? null : id)}
              onHover={setHovered}
            />
          </svg>

          {EGG_NODES.filter((n) => showLabel(n.id) || active === n.id).map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(active === n.id ? null : n.id)}
              onMouseEnter={() => setHovered(n.id)}
              className="pointer-events-auto absolute z-10 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm transition"
              style={{
                left: `${n.x}%`,
                // Unlike the SVG <circle>, this label is positioned via CSS
                // against the container's own box, which isn't in the SVG's
                // 100×56.25 viewBox space — use n.y directly, not *0.5625.
                top: `calc(${n.y}% + 2.5%)`,
                backgroundColor:
                  active === n.id
                    ? 'var(--era-accent)'
                    : 'color-mix(in srgb, var(--era-surface) 92%, transparent)',
                color: active === n.id ? 'var(--era-bg)' : 'var(--era-ink)',
                border: '1px solid var(--era-line)',
              }}
            >
              {n.label}
            </button>
          ))}

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-2 left-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[color:var(--era-ink-soft)]">
            <LegendDot kind="clue" label="Clue" />
            <LegendDot kind="payoff" label="Payoff" />
            <LegendDot kind="theory" label="Fan theory" />
          </div>
        </div>

        <div className="border-t border-[color:var(--era-line)] p-5">
          {activeNode ? (
            <div className="clue-reveal">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                <span
                  className="rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${getEra(activeNode.eraId).theme.accent} 16%, transparent)`,
                    color: getEra(activeNode.eraId).theme.accent,
                  }}
                >
                  {getEra(activeNode.eraId).shortName} · {activeNode.year}
                </span>
                <span>{activeNode.kind === 'clue' ? 'Clue planted' : 'Payoff'}</span>
                <span
                  className="rounded-full border px-2 py-0.5"
                  style={{ borderColor: 'var(--era-line)' }}
                >
                  {activeNode.confirmed === false ? 'Fan theory' : 'Confirmed'}
                </span>
                {motifOf(activeNode.id) && (
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: 'var(--era-surface-2)', color: 'var(--era-accent)' }}
                  >
                    {MOTIF_BY_ID[motifOf(activeNode.id)!].label}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink)]">
                {activeNode.detail}
              </p>

              {linkedTo.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                    Pull the thread
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {linkedTo.map(({ node, label }) => (
                      <button
                        key={node.id}
                        onClick={() => setActive(node.id)}
                        className="rounded-full border px-2.5 py-1 text-xs transition hover:bg-[color:var(--era-surface-2)]"
                        style={{ borderColor: 'var(--era-line)', color: 'var(--era-ink)' }}
                      >
                        {label} → {node.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeNode.sources && activeNode.sources.length > 0 && (
                <p className="mt-4 text-xs text-[color:var(--era-ink-soft)]">
                  Source:{' '}
                  {activeNode.sources.map((s, i) => (
                    <span key={s.url}>
                      {i > 0 && ', '}
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline underline-offset-2 hover:text-[color:var(--era-ink)]"
                      >
                        {s.name}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[color:var(--era-ink-soft)]">
              Tap any node to reveal the clue it planted — or the payoff it became — then follow the
              threads it connects to. Use the filters above to isolate a single motif.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium transition"
      style={{
        borderColor: active ? 'var(--era-accent)' : 'var(--era-line)',
        backgroundColor: active ? 'var(--era-accent)' : 'transparent',
        color: active ? 'var(--era-bg)' : 'var(--era-ink-soft)',
      }}
    >
      {children}
    </button>
  );
}
