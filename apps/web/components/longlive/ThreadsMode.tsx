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
} from '@/lib/longlive/lenses';
import type { LensId } from '@/lib/longlive/types';
import { cn } from '@/lib/utils';
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
 * The Threads world. Entering lands on a gallery that answers "what is this?"
 * before anything else; picking a thread opens an immersive, hero-headed view
 * (as rich as an era) with a career-spanning timeline on the right.
 */
export function ThreadsMode() {
  const { lensId, crossing } = useAppState();
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
              <div className="relative aspect-[16/10]">
                <Image src={t.hero || '/placeholder.svg'} alt="" fill className="object-cover transition duration-500 group-hover:scale-105" />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, var(--era-bg) 8%, color-mix(in srgb, var(--era-bg) 30%, transparent) 55%, transparent)',
                  }}
                />
                <div className="absolute left-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--era-accent)] text-[color:var(--era-bg)]">
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-[color:var(--era-accent)]">
                  {t.kicker}
                </div>
                <h2 className="mt-1.5 font-[family-name:var(--era-font)] text-2xl font-semibold">
                  {t.title}
                </h2>
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
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

  return (
    <div>
      {/* Hero header — matches the grandeur of an era hero. */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image src={meta.hero || '/placeholder.svg'} alt="" fill priority className="object-cover opacity-40" />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to bottom, color-mix(in srgb, var(--era-bg) 45%, transparent) 0%, var(--era-bg) 92%)',
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
          <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-[color:var(--era-ink-soft)] sm:text-lg">
            {meta.what}
          </p>
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
