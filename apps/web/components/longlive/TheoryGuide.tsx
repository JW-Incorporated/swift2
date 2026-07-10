'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { X, Sparkles, Egg, HelpCircle, ArrowRight } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { theoriesForEra, resolveRelatedTheory } from '@/lib/longlive/theories';
import { eraStyle } from '@/lib/longlive/theme';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import type { Confidence, TheoryNote, TheoryOutcome } from '@/lib/longlive/types';

/**
 * The era theories & easter eggs guide — an immersive per-era overlay (same
 * pattern as TrackGuide) listing every documented egg and fan theory with the
 * REQUIRED confidence + outcome badges, so speculation never reads as fact.
 * Data is static, synced at build time from the Vault theory seed/table
 * (lib/longlive/theories.ts); no runtime fetch. Only records with a real
 * source exist in the data — never an empty placeholder.
 */

// Same wording as MomentDetail's confidence pill, extended to all 8 tiers.
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

export function TheoryGuide() {
  const { theoryGuideEraId, share } = useAppState();
  const { closeTheoryGuide } = useAppActions();

  const era = theoryGuideEraId ? getEra(theoryGuideEraId) : undefined;
  const theories = theoryGuideEraId ? theoriesForEra(theoryGuideEraId) : [];
  const open = Boolean(era && theories.length > 0);

  // Lock body scroll while open (mirrors TrackGuide/MomentDetail).
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Close on Escape — unless the share sheet is layered on top; that overlay
  // owns Escape until it closes itself.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !share) closeTheoryGuide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, closeTheoryGuide, share]);

  // Let the mobile back-swipe gesture close this guide instead of leaving the app.
  useBackDismiss(open, closeTheoryGuide);

  if (!era || theories.length === 0) return null;

  const eggCount = theories.filter((t) => t.kind === 'easter_egg').length;
  const theoryCount = theories.length - eggCount;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-[color:var(--era-bg)] detail-enter"
      style={eraStyle(era)}
      role="dialog"
      aria-modal="true"
      aria-label={`${era.name} theories and easter eggs`}
    >
      {/* Compact era-art header */}
      <div className="relative h-[28vh] min-h-44 w-full">
        <Image src={era.image || '/placeholder.svg'} alt="" fill priority className="object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 30%, transparent), var(--era-bg))',
          }}
        />
        <button
          onClick={closeTheoryGuide}
          className="era-icon-btn absolute right-4 top-4 rounded-full p-2 backdrop-blur-md"
          aria-label="Close theories guide"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="relative z-10 mx-auto -mt-12 max-w-2xl px-5 pb-24">
        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--era-ink-soft)]">
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--era-accent)]" />
          Theories &amp; eggs · {era.yearLabel}
        </span>
        <h1 className="mt-2 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight sm:text-5xl">
          {era.shortName} decoded
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {countLine(eggCount, theoryCount)} — every one sourced and graded, so you always know
          what&apos;s confirmed and what&apos;s still clowning.
        </p>

        <ol className="mt-8 space-y-4">
          {theories.map((t) => (
            <TheoryCard key={t.slug} theory={t} />
          ))}
        </ol>
      </div>
    </div>
  );
}

function countLine(eggCount: number, theoryCount: number): string {
  const parts: string[] = [];
  if (eggCount > 0) parts.push(`${eggCount} documented ${eggCount === 1 ? 'Easter egg' : 'Easter eggs'}`);
  if (theoryCount > 0) parts.push(`${theoryCount} fan ${theoryCount === 1 ? 'theory' : 'theories'}`);
  return parts.join(' and ');
}

function TheoryCard({ theory }: { theory: TheoryNote }) {
  const KindIcon = theory.kind === 'easter_egg' ? Egg : HelpCircle;
  const settled = SETTLED_OUTCOMES.has(theory.outcome);
  const { openTheoryGuide } = useAppActions();
  const related = (theory.relatedSlugs ?? [])
    .map(resolveRelatedTheory)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  return (
    <li className="era-card rounded-2xl border p-5">
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

      <p className="mt-3 text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
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
    </li>
  );
}
