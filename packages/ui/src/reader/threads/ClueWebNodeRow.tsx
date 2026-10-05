'use client';

import { useEffect, useRef } from 'react';
import { getEra } from '@swift2/experience';
import { useProgressActions } from '../store';
import type { EggNode } from '@swift2/experience';
import { linksFor } from './ClueWebShared';

export function NodeRow({
  node,
  onOpenNode,
}: {
  node: EggNode;
  onOpenNode: (nodeId: string) => void;
}) {
  const era = getEra(node.eraId);
  const isTheory = node.confirmed === false;
  const isPayoff = node.kind === 'payoff';
  const links = linksFor(node.id);

  // Reading a node marks it seen: once the card is meaningfully in view
  // (~60%), record it and disconnect. Marking is idempotent, so re-renders
  // and StrictMode double-mounts are harmless.
  const { markEggsSeen } = useProgressActions();
  const rowRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rowRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          markEggsSeen([node.id]);
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [node.id, markEggsSeen]);

  return (
    <div className="relative" ref={rowRef}>
      <span
        aria-hidden
        className="absolute -left-6 top-2 h-3.5 w-3.5 rounded-full border-2"
        style={{
          borderColor: era.theme.accent,
          backgroundColor: isPayoff ? era.theme.accent : 'var(--era-bg)',
          borderStyle: isTheory ? 'dashed' : 'solid',
        }}
      />
      <article className="era-card rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest"
            style={{
              backgroundColor: `color-mix(in srgb, ${era.theme.accent} 14%, transparent)`,
              color: era.theme.accent,
            }}
          >
            {era.shortName} · {node.year}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-[color:var(--era-ink-soft)]">
              {isPayoff ? 'Payoff' : 'Clue planted'}
            </span>
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--era-ink-soft)]"
              style={{ borderColor: 'var(--era-line)' }}
            >
              {isTheory ? 'Fan theory' : 'Confirmed'}
            </span>
          </div>
        </div>
        <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold">
          {node.label}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {node.detail}
        </p>

        {links.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-widest text-[color:var(--era-ink-soft)]">
              Connects to
            </span>
            {links.map(({ other, label }) => (
              <button
                key={other.id}
                type="button"
                onClick={() => onOpenNode(other.id)}
                className="rounded-full border px-2 py-0.5 text-[11px] text-[color:var(--era-ink-soft)] transition hover:bg-[color:var(--era-surface-2)] hover:text-[color:var(--era-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--era-accent)]"
                style={{ borderColor: 'var(--era-line)' }}
                title={label}
                aria-label={`${label}: see ${other.label} on the constellation`}
              >
                {other.label}
              </button>
            ))}
          </div>
        )}

        {node.sources && node.sources.length > 0 && (
          <p className="mt-3 text-xs text-[color:var(--era-ink-soft)]">
            Source:{' '}
            {node.sources.map((s, i) => (
              <span key={`${s.url}-${i}`}>
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
      </article>
    </div>
  );
}
