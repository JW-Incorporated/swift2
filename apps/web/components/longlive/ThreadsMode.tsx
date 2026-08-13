'use client';

import type React from 'react';
import { useState } from 'react';
import Image from 'next/image';
import {
  Heart,
  Shirt,
  RefreshCw,
  Sparkles,
  Music,
  ArrowLeft,
  ArrowRight,
  Gem,
  KeyRound,
  GitFork,
} from 'lucide-react';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { eraStyle } from '@/lib/longlive/theme';
import {
  THREADS,
  getThread,
  heroGridColumns,
  threadHeroCredit,
  threadHeroSourceUrl,
  threadHeroTiles,
} from '@/lib/longlive/lenses';
import type { ThreadMeta } from '@/lib/longlive/lenses';
import type { LensId } from '@/lib/longlive/types';
import { cn } from '@/lib/utils';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';
import { ThreadsTimeline } from './ThreadsTimeline';
import { RunwayThread } from './runway/RunwayThread';
import { ClueWeb } from './ClueWeb';
import { Crossings } from './Crossings';
import { TaylorsVersionThread } from './taylors-version/TaylorsVersionThread';
import { DecodeThread } from './decode/DecodeThread';
import { LoveStoryThread } from './love-story/LoveStoryThread';
import { ProposalThread } from './proposal/ProposalThread';

const ICONS: Record<LensId, typeof Heart> = {
  'love-story': Heart,
  fashion: Shirt,
  'taylors-version': RefreshCw,
  'easter-eggs': Sparkles,
  'hidden-clues': KeyRound,
  'the-proposal': Gem,
};

/** Threads with their own self-contained temporal axis — the career scrubber
 * would be a redundant, competing timeline for these. */
const NO_SCRUBBER_THREADS = new Set<LensId>([
  'easter-eggs',
  'taylors-version',
  'hidden-clues',
  'love-story',
  // The Proposal spans only 2023-2026; the shared 2006-today scrubber would
  // crush this tight arc into ~15% of the rail.
  'the-proposal',
]);

/**
 * A thread's hero art, shared by the gallery card and the detail header so the
 * two can never drift apart.
 *
 * Two shapes (Joey, 2026-08-13 — DoD item 2, "the two relationship cards must
 * not read as the same thread"):
 *   - **one photo** — the default. Era album art for most threads; End Game
 *     carries an actual photo of Travis, which is the whole point of its card.
 *   - **a grid of portraits** — when the thread's subject is a *set* of people
 *     (`threadHeroTiles`). Blank Spaces is the wall of her past relationships,
 *     deliberately many so no single ex reads as the face of the thread.
 *
 * Within a grid hero the tiles are `alt=""` under one `role="img"` label
 * rather than one alt each: a screen reader should hear "portraits of eight
 * past partners: …", not eight consecutive "portrait of" announcements for
 * what is visually a single piece of card art.
 *
 * `decorative` is how the gallery uses it. Each gallery card is a `<button>`
 * whose accessible name is computed from its contents, so a described hero
 * would read the eight ex-partners (or Travis) BEFORE the kicker and title —
 * a screen-reader user would hear the art before learning which thread the
 * button opens. In the gallery the art is decoration for copy that already
 * says everything; on the detail header, where it is the page's own image and
 * competes with nothing, it keeps its description.
 */
function ThreadHeroArt({
  meta,
  className,
  priority,
  decorative,
}: {
  meta: ThreadMeta;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
}) {
  const tiles = threadHeroTiles(meta.id);

  if (tiles.length > 0) {
    const columns = heroGridColumns(tiles.length);
    return (
      <div
        className={cn('absolute inset-0 grid auto-rows-fr', className)}
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        {...(decorative
          ? { 'aria-hidden': true }
          : {
              role: 'img',
              'aria-label': `Portraits of ${tiles.length} of Taylor Swift's past partners: ${tiles
                .map((t) => t.name)
                .join(', ')}.`,
            })}
      >
        {tiles.map((tile, i) => (
          <img
            key={tile.id}
            src={tile.url}
            alt=""
            // The hero is above the fold on the detail header, so `priority`
            // has to reach these too — lazy tiles there paint an empty hero
            // and hand back the LCP the single-photo branch already protects.
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            className="h-full w-full object-cover"
            // An odd tile count leaves one empty cell in the last row; the
            // final portrait widens to fill it, so the wall stays solid at any
            // count rather than only at multiples of the column count.
            style={{
              objectPosition: '50% 22%',
              gridColumn: i === tiles.length - 1 && tiles.length % columns !== 0 ? 'span 2' : undefined,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <Image
      src={meta.hero || '/placeholder.svg'}
      alt={decorative ? '' : (meta.heroAlt ?? '')}
      fill
      priority={priority}
      className={cn('object-cover', className)}
      style={meta.heroPosition ? { objectPosition: meta.heroPosition } : undefined}
    />
  );
}

/**
 * The Threads world. Entering lands on a gallery that answers "what is this?"
 * before anything else; picking a thread opens an immersive, hero-headed view
 * (as rich as an era) with a career-spanning timeline on the right.
 */
export function ThreadsMode() {
  const { lensId, crossing } = useAppState();
  const { clearLens } = useAppActions();

  // Let the mobile back-swipe gesture (and the browser back button) return to
  // the thread gallery instead of leaving the app — same pattern as the other
  // 8 overlays that already use this hook.
  useBackDismiss(Boolean(lensId), clearLens);

  if (crossing) return <Crossings a={crossing.a} b={crossing.b} />;
  if (!lensId) return <ThreadsGallery />;
  return <ThreadDetail threadId={lensId} />;
}

/* ── Landing gallery ─────────────────────────────────────────────── */
function ThreadsGallery() {
  const { setLens, openCrossing } = useAppActions();

  return (
    <div className="mx-auto max-w-5xl px-5 pb-28 pt-10">
      <header className="mx-auto max-w-2xl text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--era-line)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-[color:var(--era-ink-soft)]">
          <Sparkles className="h-3.5 w-3.5" />
          The Threads
        </div>
        <h1 className="mt-5 font-[family-name:var(--era-font)] text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          The stories between the eras
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-pretty leading-relaxed text-[color:var(--era-ink-soft)]">
          Eras move forward in time. Threads cut sideways — following a single
          story as it weaves through every chapter. Pick one to pull it loose.
        </p>
      </header>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        {THREADS.map((t) => {
          const Icon = ICONS[t.id];
          return (
            <button
              key={t.id}
              onClick={() => {
                setLens(t.id);
                window.scrollTo({ top: 0, behavior: 'auto' });
              }}
              className="group relative overflow-hidden rounded-3xl border border-[color:var(--era-line)] text-left transition hover:border-[color:var(--era-accent)]"
            >
              {/* Taller at phone width. Measured at 390px: the blurb wraps to
                  THREE lines there and the text block needs ~238px, which does
                  not fit a 16:10 card (244px) once the icon row is inline — the
                  kicker would clip against overflow-hidden. 4:3 gives the room;
                  the wider card keeps 16:10 where the blurb wraps to two. */}
              <div className="relative aspect-[4/3] sm:aspect-[16/10]">
                <ThreadHeroArt meta={t} decorative className="transition duration-500 group-hover:scale-105" />
                {/* Light vignette only — the readable backing lives on the text
                    block itself (below), not here. */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, color-mix(in srgb, var(--era-bg) 60%, transparent) 0%, transparent 60%)',
                  }}
                />
              </div>
              {/* The scrim is anchored to the TEXT, not to a percentage of the
                  image. That distinction is the whole fix (Wyatt, 2026-07-26,
                  reported from mobile): this block is bottom-anchored and
                  auto-height, so at narrow widths the blurb wraps to three
                  lines and the block grows — and the backing grows with it.
                  Any percentage-based ramp on the image is tuned for one
                  wrap count at one viewport and is wrong at every other, which
                  is why mobile was far worse than desktop. */}
              <div
                className="absolute inset-x-0 bottom-0 p-5 pt-12"
                style={{
                  background:
                    'linear-gradient(to top, var(--era-bg) 0%, color-mix(in srgb, var(--era-bg) 94%, transparent) 45%, color-mix(in srgb, var(--era-bg) 72%, transparent) 74%, transparent 100%)',
                }}
              >
                {/* Icon sits INLINE with the kicker, matching the detail hero.
                    It used to float at the image's top-left, where a tall
                    (three-line) card on mobile ran the kicker straight under
                    it — "A LOVE STORY" rendered as "A ⬤VE STORY". */}
                <div className="flex items-center gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--era-accent)] text-[color:var(--era-bg)]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-[color:var(--era-accent)]">
                    {t.kicker}
                  </div>
                </div>
                <h2 className="mt-1.5 font-[family-name:var(--era-font)] text-2xl font-semibold">
                  {t.title}
                </h2>
                {/* Full-strength ink, not ink-soft: ink-soft is tuned for a
                    SOLID era surface, and over imagery it drops well under
                    the 4.5:1 body-text floor (WCAG 1.4.3). */}
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[color:var(--era-ink)]">
                  {t.what}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--era-ink)]">
                  Pull the thread
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Cross-thread pivot: lay two threads over the shared career axis. */}
      <button
        onClick={() => {
          openCrossing('fashion', 'love-story');
          window.scrollTo({ top: 0, behavior: 'auto' });
        }}
        className="group mt-5 flex w-full items-center gap-4 rounded-3xl border border-[color:var(--era-line)] p-5 text-left transition hover:border-[color:var(--era-accent)]"
      >
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--era-accent)] text-[color:var(--era-bg)]">
          <GitFork className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-[family-name:var(--era-font)] text-xl font-semibold">
            Where threads cross
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
            Overlay any two threads on one timeline and find the moments where her
            stories intersect.
          </span>
        </span>
        <ArrowRight className="h-5 w-5 shrink-0 text-[color:var(--era-ink-soft)] transition group-hover:translate-x-1 group-hover:text-[color:var(--era-accent)]" />
      </button>
    </div>
  );
}

/* ── Immersive thread detail ─────────────────────────────────────── */
function ThreadDetail({ threadId }: { threadId: LensId }) {
  const { clearLens } = useAppActions();
  const meta = getThread(threadId);
  const Icon = ICONS[threadId];
  // Attribution is a LICENCE CONDITION on the CC BY / CC BY-SA portraits in the
  // Blank Spaces grid, not a nicety — it has to render, not sit in the data
  // (same rule as the Love Story entry portraits). Public-domain heroes carry
  // one too, because saying where a photo came from is the habit here.
  const heroCredit = threadHeroCredit(threadId);
  const heroSourceUrl = threadHeroSourceUrl(threadId);

  return (
    <div>
      {/* Hero header — matches the grandeur of an era hero. */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <ThreadHeroArt meta={meta} priority className="opacity-40" />
          {/* Same fix as the gallery card: the kicker, title and blurb all sit
              in the TOP half of this hero, where the old ramp was only 45%
              opaque. Raised so the whole text column has a near-solid base;
              the hero image still reads as texture at opacity-40. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 70%, transparent) 0%, color-mix(in srgb, var(--era-bg) 85%, transparent) 40%, var(--era-bg) 90%)',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-12 md:pr-8">
          <button
            onClick={() => {
              clearLens();
              window.scrollTo({ top: 0, behavior: 'auto' });
            }}
            className="era-btn-ghost inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            All threads
          </button>

          <div className="mt-8 flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--era-accent)] text-[color:var(--era-bg)]">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-[color:var(--era-accent)]">
              {meta.kicker}
            </span>
          </div>

          <h1 className="mt-4 font-[family-name:var(--era-font)] text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            {meta.title}
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-[color:var(--era-ink)] sm:text-lg">
            {meta.what}
          </p>
          {heroCredit && (
            // Full-strength ink, not ink-soft: this sits over hero imagery,
            // where ink-soft drops under the 4.5:1 body-text floor (WCAG 1.4.3)
            // — the same reason the blurb above it uses ink.
            <p className="mt-5 max-w-xl text-[11px] leading-relaxed text-[color:var(--era-ink)]">
              {/* Linked, not just named: CC BY / CC BY-SA ask for a URI to the
                  licensed material, and the Commons page carries the licence
                  deed and the full author record. A grid hero has no single
                  page to point at, so it stays plain text. */}
              {heroSourceUrl ? (
                <a
                  href={heroSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:decoration-solid"
                >
                  {heroCredit}
                </a>
              ) : (
                heroCredit
              )}
            </p>
          )}
        </div>
      </header>

      <div className={cn('mx-auto max-w-4xl px-4 pb-28', !NO_SCRUBBER_THREADS.has(threadId) && 'md:pr-8')}>
        {threadId === 'love-story' && <LoveStoryThread />}
        {threadId === 'fashion' && <RunwayThread />}
        {threadId === 'taylors-version' && <TaylorsVersionThread />}
        {threadId === 'easter-eggs' && <ClueWeb />}
        {threadId === 'hidden-clues' && <DecodeThread />}
        {threadId === 'the-proposal' && <ProposalThread />}
      </div>

      {/* The Clue Web is its own spatial layout, and Taylor's Version has its own
          ownership-timeline chart as its temporal axis — a second scrubber would
          create two competing time axes for both (see docs/threads-rework-2026-07-10.md). */}
      {!NO_SCRUBBER_THREADS.has(threadId) && <ThreadsTimeline threadId={threadId} />}
    </div>
  );
}

/* Wrap each dated entry so the career timeline can scroll-sync to it. */
function ThreadItem({
  date,
  children,
}: {
  date: string;
  children: React.ReactNode;
}) {
  return (
    <div data-ll-item data-ll-date={new Date(date).getTime()} className="scroll-mt-28">
      {children}
    </div>
  );
}

/* Love Story now lives in ./love-story/LoveStoryThread.tsx — see
   docs/threads-rework-2026-07-10.md for why it replaced this. */

/* The Proposal now lives in ./proposal/ProposalThread.tsx — see
   docs/threads-rework-2026-07-10.md for why it replaced this. */

/* The Decode now lives in ./decode/DecodeThread.tsx — see
   docs/threads-rework-2026-07-10.md for why it replaced this. */

/* Runway (Fashion) now lives in ./runway/RunwayThread.tsx — see
   docs/threads-rework-2026-07-10.md for why it replaced this. */

/* Taylor's Version now lives in ./taylors-version/TaylorsVersionThread.tsx —
   see docs/threads-rework-2026-07-10.md for why it replaced this. */
