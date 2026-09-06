'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useScrollLock } from '@/lib/longlive/useScrollLock';
import { useFocusTrap } from '@/lib/longlive/useFocusTrap';
import Image from 'next/image';
import { X, Share2, Sparkles } from 'lucide-react';
import { useAppState, useAppActions } from '@/lib/longlive/store';
import { CURRENT_ERA_ID, getEra } from '@swift2/experience';
import { theoriesForEra } from '@/lib/longlive/theories';
import { eraStyle } from '@/lib/longlive/theme';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { useLiveTheories } from '@/lib/longlive/use-live-theories';
import { fansAreSayingLine, matchFanSignal, sortByHeatDesc } from '@/lib/longlive/live-theories';
import { TheoryCard, countLine } from './TheoryCard';
import { LiveTheoryCard } from './LiveTheoryCard';

/**
 * The era theories & easter eggs guide — an immersive per-era overlay (same
 * pattern as TrackGuide) listing every documented egg and fan theory with the
 * REQUIRED confidence + outcome badges, so speculation never reads as fact.
 * Data is static, synced at build time from the Vault theory seed/table
 * (lib/longlive/theories.ts); no runtime fetch. Only records with a real
 * source exist in the data — never an empty placeholder.
 *
 * The per-theory card (badges, sources, R4 back-link) is `TheoryCard.tsx` —
 * split out to keep this file under the 300-line cap (see MAP.md).
 */

export function TheoryGuide() {
  const { theoryGuideEraId, theoryGuideHighlightSlug, share } = useAppState();
  const { closeTheoryGuide, openShare, popReturnPoint } = useAppActions();

  const era = theoryGuideEraId ? getEra(theoryGuideEraId) : undefined;
  const theories = theoryGuideEraId ? theoriesForEra(theoryGuideEraId) : [];
  const open = Boolean(era && theories.length > 0);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  // Knowledge-engine Stage 7: `live_theory` has no `era_id` to filter by
  // server-side, so only the current era's guide fetches it — every other
  // era opts out entirely rather than showing live chatter it can't
  // attribute to itself (same "current era only" precedent Stage 5 set for
  // `current_item`, see `use-era-current-feed.ts`).
  const liveBoard = useLiveTheories(theoryGuideEraId === CURRENT_ERA_ID);
  const liveTheoryCards = useMemo(
    () =>
      sortByHeatDesc(liveBoard.theories).map((theory) => {
        const signal = matchFanSignal(theory, liveBoard.signals);
        return { theory, fansAreSaying: signal ? fansAreSayingLine(signal) : undefined };
      }),
    [liveBoard.theories, liveBoard.signals],
  );

  useScrollLock(open);
  useFocusTrap(open, dialogRef);

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

  // PLAN.md P3 step 16 (back-to-position): pop this overlay's ReturnPoint —
  // pushed by an egg doorway tap right before it opened this guide — when the
  // guide closes, however that happens (X, Escape, or the back gesture all
  // collapse into `theoryGuideEraId` going back to null). This overlay never
  // changes `mode`, so there is no `restoreNav` run to hook into instead —
  // this transition IS "dismiss through the existing useBackDismiss path"
  // for this destination.
  const prevEraIdRef = useRef<typeof theoryGuideEraId>(null);
  useEffect(() => {
    const was = prevEraIdRef.current;
    prevEraIdRef.current = theoryGuideEraId;
    if (was && !theoryGuideEraId && typeof window !== 'undefined') {
      const rp = popReturnPoint();
      if (rp && rp.mode === 'era' && rp.eraId === was) {
        window.scrollTo({ top: rp.scrollY, behavior: 'auto' });
      }
    }
  }, [theoryGuideEraId, popReturnPoint]);

  // R4 ("egg/theory doorways open that single egg's detail"): scroll straight
  // to the tapped card instead of just the era's guide in general.
  // TheoryCard renders the matching highlight ring below.
  useEffect(() => {
    if (!open || !theoryGuideHighlightSlug) return;
    document.getElementById(`theory-${theoryGuideHighlightSlug}`)?.scrollIntoView({ block: 'center' });
  }, [open, theoryGuideHighlightSlug]);

  if (!era || theories.length === 0) return null;

  const eggCount = theories.filter((t) => t.kind === 'easter_egg').length;
  const theoryCount = theories.length - eggCount;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
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
        {/* This overlay covers the TopBar, so its Share button is unreachable
            here — the affordance rides in the hero controls, beside Close
            (#707). TheoryGuide uses its own hero X rather than OverlayNav, so
            the button is added here directly. */}
        <div className="absolute right-4 top-4 flex items-center gap-2">
          <button
            onClick={() => openShare({ kind: 'theoryGuide', eraId: era.id })}
            className="era-icon-btn grid size-11 place-items-center rounded-full backdrop-blur-md"
            aria-label="Share"
            title="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={closeTheoryGuide}
            className="era-icon-btn grid size-11 place-items-center rounded-full backdrop-blur-md"
            aria-label="Close theories guide"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
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

        {liveTheoryCards.length > 0 && (
          <>
            <h2 className="mt-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--era-ink-soft)]">
              Live right now
            </h2>
            <ol className="mt-4 space-y-4">
              {liveTheoryCards.map(({ theory, fansAreSaying }) => (
                <LiveTheoryCard key={theory.id} theory={theory} fansAreSaying={fansAreSaying} />
              ))}
            </ol>
          </>
        )}

        <ol className="mt-8 space-y-4">
          {theories.map((t) => (
            <TheoryCard key={t.slug} theory={t} highlighted={t.slug === theoryGuideHighlightSlug} />
          ))}
        </ol>
      </div>
    </div>
  );
}
