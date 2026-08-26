'use client';

import { Flame, Radio } from 'lucide-react';
import type { LiveTheory } from '@swift2/shared';

/**
 * A live `live_theory` card in the Threads "Theories & eggs" board
 * (`TheoryGuide.tsx`, PLAN.md Stage 7) — same dashed-provisional treatment
 * as `CurrentItemCard.tsx`'s live rows, since every live theory is
 * unresolved by definition (it hasn't been promoted into a Vault theory
 * seed yet). Shows heat (corroboration x recency x fan volume, per the
 * schema) and, when `TheoryGuide` found a matching `fan_signal` row, the
 * "fans are saying" line (`lib/longlive/live-theories.ts`'s
 * `fansAreSayingLine`).
 */
export function LiveTheoryCard({ theory, fansAreSaying }: { theory: LiveTheory; fansAreSaying?: string }) {
  return (
    <li
      id={`live-theory-${theory.id}`}
      className="era-card rounded-2xl border-2 border-dashed p-5"
      style={{ borderColor: 'var(--era-accent)' }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-[color:var(--era-accent)]">
          <Radio className="h-3.5 w-3.5" aria-hidden />
          Live theory
        </span>
        <span
          className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--era-ink-soft)]"
          style={{ borderColor: 'var(--era-line)' }}
          title="Corroboration x recency x fan volume"
        >
          <Flame className="h-3 w-3" aria-hidden />
          Heat {theory.heat.toFixed(1)}
        </span>
      </div>
      <h2 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">{theory.name}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[color:var(--era-ink)]">{theory.claim}</p>
      {fansAreSaying && (
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">{fansAreSaying}</p>
      )}
    </li>
  );
}
