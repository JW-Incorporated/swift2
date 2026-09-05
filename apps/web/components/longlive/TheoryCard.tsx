'use client';

import { Egg, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAppActions } from '@/lib/longlive/store';
import { getEra } from '@swift2/experience';
import { resolveRelatedTheory } from '@/lib/longlive/theories';
import { theoryThreadId } from '@/lib/longlive/doorways';
import { getThread } from '@swift2/experience';
import type { Confidence, TheoryNote, TheoryOutcome } from '@swift2/experience';

// Split out of TheoryGuide.tsx (PLAN.md P3 step 17 — see MAP.md; kept that
// file under the 300-line cap once R4's back-link block landed).

// Quiet per-tier wording for the theory guide's badges. MomentDetail no
// longer shares this wording: since 2026-07-19 (rumor tier) it renders
// sub-confirmed moments with its own LOUD banner labels (CONFIDENCE_BANNER —
// "Reported — not confirmed" / "Debunked"). The divergence is intentional:
// a theory card is framed as speculation by its whole surface, a moment page
// is framed as fact, so the moment needs the louder language.
const CONFIDENCE_LABEL: Record<Confidence, string> = {
  official: 'Official',
  confirmed_interview: 'Confirmed in interview',
  reputable_reporting: 'Reported',
  strong_fan_consensus: 'Fan consensus',
  plausible: 'Plausible',
  clowning: 'Clowning',
  disproven: 'Disproven',
  joke_meme: 'Joke / meme',
};

const OUTCOME_LABEL: Record<TheoryOutcome, string> = {
  confirmed: 'Confirmed',
  partially_confirmed: 'Partially confirmed',
  pending: 'Pending',
  debunked: 'Debunked',
  abandoned: 'Abandoned',
  unfalsifiable: 'Unfalsifiable',
};

/** Outcomes that earned the accent treatment — the payoff landed. */
const SETTLED_OUTCOMES: ReadonlySet<TheoryOutcome> = new Set(['confirmed', 'partially_confirmed']);

export function countLine(eggCount: number, theoryCount: number): string {
  const parts: string[] = [];
  if (eggCount > 0) parts.push(`${eggCount} documented ${eggCount === 1 ? 'Easter egg' : 'Easter eggs'}`);
  if (theoryCount > 0) parts.push(`${theoryCount} fan ${theoryCount === 1 ? 'theory' : 'theories'}`);
  return parts.join(' and ');
}

export function TheoryCard({ theory, highlighted }: { theory: TheoryNote; highlighted: boolean }) {
  const KindIcon = theory.kind === 'easter_egg' ? Egg : HelpCircle;
  const settled = SETTLED_OUTCOMES.has(theory.outcome);
  const { openTheoryGuide, openThread, setMode } = useAppActions();
  const related = (theory.relatedSlugs ?? [])
    .map(resolveRelatedTheory)
    .filter((r): r is NonNullable<typeof r> => r !== null);
  // R4: every egg/theory detail points back to the thread it belongs to
  // (doorways.ts's `theoryThreadId` — the same mapping `EggDoorway.threadId`
  // uses, so the doorway card and this detail never disagree).
  const threadId = theoryThreadId(theory);

  return (
    <li
      id={`theory-${theory.slug}`}
      className="era-card scroll-mt-28 rounded-2xl border p-5 transition"
      style={
        highlighted
          ? { borderColor: 'var(--era-accent)', boxShadow: '0 0 0 2px var(--era-accent)' }
          : undefined
      }
    >
      {/* Kind eyebrow + the required confidence/outcome badges (Clue Web pill styling). */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-[color:var(--era-ink-soft)]">
          <KindIcon className="h-3.5 w-3.5 text-[color:var(--era-accent)]" />
          {theory.kind === 'easter_egg' ? 'Easter egg' : 'Fan theory'}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--era-ink-soft)]"
            style={{ borderColor: 'var(--era-line)' }}
            title="How much weight the claim carries"
          >
            {CONFIDENCE_LABEL[theory.confidence]}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider"
            style={
              settled
                ? {
                    backgroundColor: 'color-mix(in srgb, var(--era-accent) 16%, transparent)',
                    color: 'var(--era-accent)',
                  }
                : {
                    border: '1px solid var(--era-line)',
                    color: 'var(--era-ink-soft)',
                  }
            }
            title="Where the claim landed"
          >
            {OUTCOME_LABEL[theory.outcome]}
          </span>
        </div>
      </div>

      <h2 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold leading-snug">
        {theory.title}
      </h2>
      <p className="mt-1.5 text-[15px] leading-relaxed text-[color:var(--era-ink)]">{theory.claim}</p>
      {theory.evidence && (
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {theory.evidence}
        </p>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-[color:var(--era-ink-soft)] opacity-80">
        {theory.sources.length > 1 ? 'Sources:' : 'Source:'}{' '}
        {theory.sources.map((s, i) => (
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

      {related.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {related.map(({ eraId, theory: t }) => (
            <button
              key={`${eraId}:${t.slug}`}
              onClick={() => openTheoryGuide(eraId)}
              className="era-btn-ghost inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
            >
              {t.title}
              <span className="text-[10px] text-[color:var(--era-ink-soft)]">
                {getEra(eraId).shortName}
              </span>
              <ArrowRight className="h-3 w-3 text-[color:var(--era-ink-soft)]" />
            </button>
          ))}
        </div>
      )}

      {/* R4, unconditional: every detail points back to the thread it belongs
          to when one genuinely fits, and otherwise still teaches the reader
          that a whole section exists for stories like this one — a null
          `threadId` must never read as "nothing to see here" (PLAN.md P3
          step 17). */}
      <div className="mt-4 border-t pt-3" style={{ borderColor: 'var(--era-line)' }}>
        {threadId ? (
          <button
            onClick={() => openThread(threadId)}
            className="era-btn-ghost inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
          >
            <Sparkles className="h-3 w-3 text-[color:var(--era-accent)]" aria-hidden />
            Part of the {getThread(threadId).title} thread — see the whole story
            <ArrowRight className="h-3 w-3 text-[color:var(--era-ink-soft)]" aria-hidden />
          </button>
        ) : (
          <button
            onClick={() => setMode('threads')}
            className="era-btn-ghost inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
          >
            <Sparkles className="h-3 w-3 text-[color:var(--era-accent)]" aria-hidden />
            There&apos;s a whole section for theories &amp; eggs like this — explore Threads
            <ArrowRight className="h-3 w-3 text-[color:var(--era-ink-soft)]" aria-hidden />
          </button>
        )}
      </div>
    </li>
  );
}
