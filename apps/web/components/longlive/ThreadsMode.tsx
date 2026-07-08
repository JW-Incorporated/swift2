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
  Quote,
  KeyRound,
  Lock,
  MoveRight,
} from 'lucide-react';
import { useAppActions, useAppState } from '@/lib/longlive/store';
import { getEra } from '@/lib/longlive/eras';
import { eraStyle } from '@/lib/longlive/theme';
import {
  RELATIONSHIPS,
  RUNWAY_LOOKS,
  RERECORDS,
  PROPOSAL_BEATS,
  CLUE_PAIRS,
  THREADS,
  getThread,
} from '@/lib/longlive/lenses';
import type { CluePair, LensId } from '@/lib/longlive/types';
import { cn } from '@/lib/utils';
import { ThreadsTimeline } from './ThreadsTimeline';
import { ClueWeb } from './ClueWeb';

const ICONS: Record<LensId, typeof Heart> = {
  'love-story': Heart,
  fashion: Shirt,
  'taylors-version': RefreshCw,
  'easter-eggs': Sparkles,
  'hidden-clues': KeyRound,
  'the-proposal': Gem,
};

/**
 * The Threads world. Entering lands on a gallery that answers "what is this?"
 * before anything else; picking a thread opens an immersive, hero-headed view
 * (as rich as an era) with a career-spanning timeline on the right.
 */
export function ThreadsMode() {
  const { lensId } = useAppState();
  if (!lensId) return <ThreadsGallery />;
  return <ThreadDetail threadId={lensId} />;
}

/* ── Landing gallery ─────────────────────────────────────────────── */
function ThreadsGallery() {
  const { setLens } = useAppActions();

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

        <div className="relative mx-auto max-w-3xl px-5 pb-10 pt-12 md:pr-16">
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

      <div className={cn('mx-auto max-w-3xl px-5 pb-28', threadId !== 'easter-eggs' && 'md:pr-16')}>
        {threadId === 'love-story' && <LoveStory />}
        {threadId === 'fashion' && <Runway />}
        {threadId === 'taylors-version' && <TaylorsVersion />}
        {threadId === 'easter-eggs' && <ClueWeb />}
        {threadId === 'hidden-clues' && <Decode />}
        {threadId === 'the-proposal' && <TheProposal />}
      </div>

      {/* The Clue Web is its own spatial layout, so the career scrubber is redundant there. */}
      {threadId !== 'easter-eggs' && <ThreadsTimeline threadId={threadId} />}
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

/* ── Love Story ───────────────────────────────�����──────────────────── */
function LoveStory() {
  return (
    <div className="space-y-4 pt-8">
      {RELATIONSHIPS.map((rel) => {
        const start = new Date(rel.start).getFullYear();
        const end = rel.end ? new Date(rel.end).getFullYear() : 'now';
        return (
          <ThreadItem key={rel.id} date={rel.start}>
            <article className="era-card rounded-2xl border p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-[family-name:var(--era-font)] text-xl font-semibold">{rel.name}</h3>
                <span className="text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                  {start} – {end}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">{rel.note}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {rel.eraIds.map((id) => {
                  const era = getEra(id);
                  return (
                    <span
                      key={id}
                      className="rounded-full border px-2.5 py-0.5 text-xs font-medium"
                      style={{
                        borderColor: era.theme.accent,
                        color: era.theme.accent,
                        backgroundColor: `color-mix(in srgb, ${era.theme.accent} 12%, transparent)`,
                      }}
                    >
                      {era.shortName}
                    </span>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--era-ink)]">
                {rel.songs.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5">
                    <Music className="h-3.5 w-3.5 text-[color:var(--era-accent)]" />
                    {s}
                  </span>
                ))}
              </div>
            </article>
          </ThreadItem>
        );
      })}
    </div>
  );
}

/* ── The Proposal (sourced story thread) ─────────────────────────── */
function TheProposal() {
  return (
    <div className="pt-8">
      <div className="relative space-y-4 pl-6">
        {/* Vertical spine */}
        <span
          aria-hidden
          className="absolute bottom-2 left-[7px] top-2 w-px"
          style={{ backgroundColor: 'var(--era-line)' }}
        />
        {PROPOSAL_BEATS.map((beat) => {
          const era = getEra(beat.eraId);
          return (
            <ThreadItem key={beat.id} date={beat.date}>
              <div className="relative">
                {/* Era-colored node on the spine */}
                <span
                  aria-hidden
                  className="absolute -left-6 top-2 h-3.5 w-3.5 rounded-full border-2"
                  style={{ borderColor: era.theme.accent, backgroundColor: 'var(--era-bg)' }}
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
                      {era.shortName} · {beat.dateLabel}
                    </span>
                    {beat.source && (
                      <span className="text-[11px] uppercase tracking-wider text-[color:var(--era-ink-soft)]">
                        Source: {beat.source}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold">
                    {beat.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
                    {beat.body}
                  </p>
                  {beat.quote && (
                    <blockquote className="mt-3 flex gap-2 border-l-2 pl-3 text-[15px] italic leading-relaxed text-[color:var(--era-ink)]" style={{ borderColor: era.theme.accent }}>
                      <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--era-accent)]" />
                      <span>{beat.quote}</span>
                    </blockquote>
                  )}
                </article>
              </div>
            </ThreadItem>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
        Compiled from public reporting by an independent fan project. Not affiliated with or endorsed by Taylor Swift.
      </p>
    </div>
  );
}

/* ── The Decode (hidden clue → payoff reveal) ────────────────────── */
function monthsBetween(a: string, b: string): string {
  const d1 = new Date(a);
  const d2 = new Date(b);
  const months = Math.max(
    0,
    (d2.getFullYear() - d1.getFullYear()) * 12 + (d2.getMonth() - d1.getMonth()),
  );
  if (months < 1) return 'days later';
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} later`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem === 0
    ? `${years} year${years === 1 ? '' : 's'} later`
    : `${years} yr ${rem} mo later`;
}

function DecodeCard({ clue }: { clue: CluePair }) {
  const [decoded, setDecoded] = useState(false);
  const plantEra = getEra(clue.plant.eraId);
  const payoffEra = getEra(clue.payoff.eraId);

  return (
    <ThreadItem date={clue.plant.date}>
      <article className="era-card overflow-hidden rounded-2xl border">
        {/* Plant */}
        <div className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest"
            style={{
              backgroundColor: `color-mix(in srgb, ${plantEra.theme.accent} 14%, transparent)`,
              color: plantEra.theme.accent,
            }}
          >
            Planted · {plantEra.shortName} · {clue.plant.dateLabel}
          </span>
          <span
            className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider text-[color:var(--era-ink-soft)]"
            style={{ borderColor: 'var(--era-line)' }}
          >
            {clue.confirmed ? 'Confirmed' : 'Fan theory'}
          </span>
        </div>
        <h3 className="mt-2 font-[family-name:var(--era-font)] text-xl font-semibold">
          {clue.title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          {clue.plant.what}
        </p>
      </div>

      {/* The thread across time */}
      <div
        className="relative flex items-center gap-3 border-y px-5 py-2.5"
        style={{ borderColor: 'var(--era-line)' }}
      >
        <span
          aria-hidden
          className="h-px flex-1"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, var(--era-accent) 0 4px, transparent 4px 8px)',
            opacity: decoded ? 0.9 : 0.4,
            transition: 'opacity 400ms',
          }}
        />
        <span className="whitespace-nowrap text-[11px] uppercase tracking-widest text-[color:var(--era-ink-soft)]">
          {monthsBetween(clue.plant.date, clue.payoff.date)}
        </span>
        <span
          aria-hidden
          className="h-px flex-1"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, var(--era-accent) 0 4px, transparent 4px 8px)',
            opacity: decoded ? 0.9 : 0.4,
            transition: 'opacity 400ms',
          }}
        />
      </div>

      {/* Payoff — sealed until decoded */}
      {decoded ? (
        <div className="clue-reveal p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest"
              style={{
                backgroundColor: `color-mix(in srgb, ${payoffEra.theme.accent} 14%, transparent)`,
                color: payoffEra.theme.accent,
              }}
            >
              Payoff · {payoffEra.shortName} · {clue.payoff.dateLabel}
            </span>
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink)]">
            {clue.payoff.what}
          </p>
          <p className="mt-3 flex items-start gap-2 text-sm italic leading-relaxed text-[color:var(--era-ink-soft)]">
            <MoveRight className="mt-1 h-3.5 w-3.5 shrink-0 text-[color:var(--era-accent)]" />
            <span>{clue.connection}</span>
          </p>
          <p className="mt-3 text-xs text-[color:var(--era-ink-soft)]">
            Source:{' '}
            {clue.sources.map((s, i) => (
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
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setDecoded(true)}
          className="group flex w-full items-center justify-center gap-2 p-5 text-sm font-semibold transition-colors hover:bg-[color:var(--era-surface-2)]"
          style={{ color: 'var(--era-accent)' }}
        >
          <Lock className="h-4 w-4 transition-transform group-hover:-translate-y-px" />
          Decode the payoff
        </button>
      )}
      </article>
    </ThreadItem>
  );
}

function Decode() {
  return (
    <div className="pt-8">
      <div className="space-y-4">
        {CLUE_PAIRS.map((clue) => (
          <DecodeCard key={clue.id} clue={clue} />
        ))}
      </div>
      <p className="mt-6 text-center text-xs leading-relaxed text-[color:var(--era-ink-soft)]">
        Clues compiled from public reporting by an independent fan project. “Fan theory” tags mark connections Taylor has not confirmed.
      </p>
    </div>
  );
}

/* ── Runway (Fashion) ────────────────────────────────────────────── */
function Runway() {
  return (
    <div className="space-y-4 pt-8">
      {RUNWAY_LOOKS.map((look) => {
        const era = getEra(look.eraId);
        return (
          <ThreadItem key={look.id} date={era.start}>
            <article
              style={eraStyle(era)}
              className="era-card overflow-hidden rounded-2xl border bg-[color:var(--era-bg)] text-[color:var(--era-ink)]"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="relative aspect-[4/3] sm:aspect-auto sm:w-56 sm:shrink-0">
                  <Image src={look.image || '/placeholder.svg'} alt="" fill className="object-cover" />
                </div>
                <div className="p-5">
                  <div className="text-[11px] font-medium uppercase tracking-[0.25em] text-[color:var(--era-accent)]">
                    {era.shortName} · {era.yearLabel}
                  </div>
                  <h3 className="mt-1 font-[family-name:var(--era-font)] text-xl font-semibold">{look.name}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
                    {look.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {look.shopTags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-[color:var(--era-line)] px-2 py-0.5 text-[11px] text-[color:var(--era-ink-soft)]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </ThreadItem>
        );
      })}
    </div>
  );
}

/* ── Taylor's Version ────────────────────────────────────────────── */
function TaylorsVersion() {
  const reclaimed = RERECORDS.filter((r) => r.reclaimedYear).length;
  const totalVault = RERECORDS.reduce((n, r) => n + r.vaultTracks, 0);
  return (
    <div className="pt-8">
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Albums reclaimed" value={`${reclaimed} / ${RERECORDS.length}`} />
        <Stat label="Vault tracks freed" value={String(totalVault)} />
        <Stat label="Still awaiting" value={String(RERECORDS.length - reclaimed)} />
      </div>
      <div className="space-y-3">
        {RERECORDS.map((r) => {
          const done = Boolean(r.reclaimedYear);
          return (
            <ThreadItem key={r.id} date={`${r.reclaimedYear ?? r.originalYear}-06-01`}>
              <article className="era-card flex items-center gap-4 rounded-2xl border p-4">
                <div
                  className={cn(
                    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                    done
                      ? 'border-transparent bg-[color:var(--era-accent)] text-[color:var(--era-bg)]'
                      : 'border-dashed border-[color:var(--era-line)] text-[color:var(--era-ink-soft)]',
                  )}
                >
                  {done ? '✓' : '…'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <h3 className="font-[family-name:var(--era-font)] text-lg font-semibold">{r.album}</h3>
                    <span className="text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                      {r.originalYear}
                      {r.reclaimedYear ? ` → ${r.reclaimedYear}` : ' → pending'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">{r.note}</p>
                  {r.vaultTracks > 0 && (
                    <span className="mt-2 inline-block rounded-full bg-[color:var(--era-surface-2)] px-2.5 py-0.5 text-[11px] font-medium text-[color:var(--era-accent)]">
                      +{r.vaultTracks} vault tracks
                    </span>
                  )}
                </div>
              </article>
            </ThreadItem>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="era-card rounded-2xl border p-4 text-center">
      <div className="font-[family-name:var(--era-font)] text-3xl font-semibold text-[color:var(--era-accent)]">
        {value}
      </div>
      <div className="mt-1 text-xs uppercase tracking-wider text-[color:var(--era-ink-soft)]">{label}</div>
    </div>
  );
}
