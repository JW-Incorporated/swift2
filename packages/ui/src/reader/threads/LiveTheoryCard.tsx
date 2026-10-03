'use client';

import { Flame, Radio } from 'lucide-react';
import type { LiveTheory } from '@swift2/shared';

/** `stance` chip copy — fan-side confidence, never ours (matches the
 * corpus's own framing, `docs/proposals/2026-09-06-community-engine-plan.md`
 * §3.3: "fan-side confidence"). Undefined/unset stance renders no chip at
 * all, same "never fabricate a value" rule the rest of this card follows. */
const STANCE_LABEL: Record<NonNullable<LiveTheory['stance']>, string> = {
  believed: 'Fans believe this',
  contested: 'Fans are split',
  debunked_by_fans: 'Fans say debunked',
};

/** The Clue Web / eggs-board origin badge (Community Engine plan §3.4:
 * "fan theory · 340 mentions · r/TaylorSwift"). Built only from fields the
 * corpus promotion pass actually populates (`theory.mentionCount`,
 * `theory.communities`) — a fan-origin row the corpus hasn't touched yet
 * (mentionCount undefined) renders no count rather than a fabricated one,
 * and a row with no communities renders no community name. Non-fan origins
 * (`bot`/`site`) never render this badge at all (see `LiveTheoryCard` below).
 */
function originBadgeText(theory: LiveTheory): string {
  const parts = ['fan theory'];
  if (typeof theory.mentionCount === 'number') {
    parts.push(`${theory.mentionCount} ${theory.mentionCount === 1 ? 'mention' : 'mentions'}`);
  }
  const community = theory.communities?.[0];
  if (community) parts.push(`r/${community}`);
  return parts.join(' · ');
}

/**
 * A live `live_theory` card in the Threads "Theories & eggs" board
 * (`TheoryGuide.tsx`, PLAN.md Stage 7) — same dashed-provisional treatment
 * as `CurrentItemCard.tsx`'s live rows, since every live theory is
 * unresolved by definition (it hasn't been promoted into a Vault theory
 * seed yet). Shows heat (corroboration x recency x fan volume, per the
 * schema) and, when `TheoryGuide` found a matching `fan_signal` row, the
 * "fans are saying" line (`lib/longlive/live-theories.ts`'s
 * `fansAreSayingLine`).
 *
 * Community Engine P2-4: fan-origin (`origin === 'fan'`) rows additionally
 * carry the corpus provenance badge — "fan theory · N mentions ·
 * r/community" — plus a fan-side stance chip when the corpus set one.
 * Bot/site-origin rows render neither, since those columns are only ever
 * populated by the corpus promotion pass (`theory-promote.ts`).
 */
export function LiveTheoryCard({ theory, fansAreSaying }: { theory: LiveTheory; fansAreSaying?: string }) {
  const isFanOrigin = theory.origin === 'fan';
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
      {isFanOrigin && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--era-accent) 14%, transparent)',
              color: 'var(--era-accent)',
            }}
            title="Mined from the year-deep fan-theory corpus crawl"
          >
            {originBadgeText(theory)}
          </span>
          {theory.stance && (
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--era-ink-soft)]"
              style={{ borderColor: 'var(--era-line)' }}
            >
              {STANCE_LABEL[theory.stance]}
            </span>
          )}
        </div>
      )}
      <h2 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">{theory.name}</h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[color:var(--era-ink)]">{theory.claim}</p>
      {fansAreSaying && (
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">{fansAreSaying}</p>
      )}
    </li>
  );
}
