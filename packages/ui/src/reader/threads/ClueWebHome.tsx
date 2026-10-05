'use client';

import { useMemo } from 'react';
import { Sparkles, ArrowRight, Network, Route, Check } from 'lucide-react';
import { getEra } from '@swift2/experience';
import {
  EGG_NODES,
  MOTIFS,
  motifNodes,
  motifEraIds,
} from '@swift2/experience';
import { clueWebProgress, trailProgress } from '@swift2/experience';
import { useProgress } from '../store';
import type { Motif, MotifId } from '@swift2/experience';
import { useLiveTheories } from '../lib/use-live-theories';
import { sortByHeatDesc, matchFanSignal, fansAreSayingLine } from './lib/live-theories';
import { LiveTheoryCard } from './LiveTheoryCard';
import { LegendDot, motifIcon } from './ClueWebShared';

/* ── Home: how it works + the trail picker ───────────────────────────── */
export function ClueHome({
  onOpenTrail,
  onOpenMap,
}: {
  onOpenTrail: (m: MotifId) => void;
  onOpenMap: () => void;
}) {
  // Real exploration progress (localStorage-backed): empty on first paint,
  // then fills in after the post-mount hydrate — never an SSR mismatch.
  const { progress, hydrated } = useProgress();
  const stats = useMemo(() => {
    const clues = EGG_NODES.filter((n) => n.kind === 'clue').length;
    const eras = new Set(EGG_NODES.map((n) => n.eraId)).size;
    return { clues, eras, ...clueWebProgress(progress) };
  }, [progress]);
  const returning = hydrated && stats.eggsSeen > 0;

  // Community Engine P2-4 ("What fans are watching" cluster, plan §3.4
  // C3.1): heat-sorted fan theories, same `/vault/live/[eraId]` current-era
  // read `TheoryGuide` uses — no era filter on `live_theory` itself
  // (Stage 7's "no era_id to filter by server-side" precedent), so this is
  // always the current era's slice regardless of which era the visitor is
  // browsing. `enabled: true` unconditionally: the Clue Web mini-app has no
  // "current era only" gate the way TheoryGuide's per-era overlay does.
  const liveBoard = useLiveTheories(true);
  const WATCHING_CLUSTER_CAP = 5;
  const watchingCards = useMemo(
    () =>
      sortByHeatDesc(liveBoard.theories)
        .slice(0, WATCHING_CLUSTER_CAP)
        .map((theory) => {
          const signal = matchFanSignal(theory, liveBoard.signals);
          return { theory, fansAreSaying: signal ? fansAreSayingLine(signal) : undefined };
        }),
    [liveBoard.theories, liveBoard.signals],
  );

  return (
    <div>
      {/* How the decode works */}
      <section className="era-card rounded-2xl border p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--era-accent)]">
          <Sparkles className="h-4 w-4" />
          How the decode works
        </div>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          For twenty years, Taylor has hidden <strong className="text-[color:var(--era-ink)]">clues</strong>{' '}
          in one era that <strong className="text-[color:var(--era-ink)]">pay off</strong> in another. Follow a{' '}
          <em>trail</em> below to read one motif from its first hint to its reveal — or open the full
          constellation to see how every clue connects.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[color:var(--era-ink-soft)]">
          <LegendDot kind="clue" label="Clue planted" />
          <LegendDot kind="payoff" label="Payoff / reveal" />
          <LegendDot kind="theory" label="Fan theory (unconfirmed)" />
        </div>
      </section>

      {/* Returning-visitor progress line — only once real progress exists. */}
      {returning && (
        <p className="mt-4 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          Welcome back — you&apos;ve spotted{' '}
          <strong className="text-[color:var(--era-accent)]">
            {stats.eggsSeen} of {stats.eggsTotal}
          </strong>{' '}
          eggs across{' '}
          <strong className="text-[color:var(--era-accent)]">
            {stats.trailsExplored} of {stats.trailsTotal}
          </strong>{' '}
          trails.
        </p>
      )}

      {/* Stats — the explored counts are the visitor's own progress. */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat value={`${stats.eggsSeen}/${stats.eggsTotal}`} label="Eggs explored" />
        <MiniStat value={`${stats.trailsExplored}/${stats.trailsTotal}`} label="Trails explored" />
        <MiniStat value={String(stats.clues)} label="Clues planted" />
        <MiniStat value={String(stats.eras)} label="Eras spanned" />
      </div>

      {/* Trail picker */}
      <div className="mt-8 flex items-center gap-2">
        <Route className="h-4 w-4 text-[color:var(--era-accent)]" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--era-ink-soft)]">
          Start with a trail
        </h2>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {MOTIFS.map((m) => (
          <TrailCard key={m.id} motif={m} onOpen={() => onOpenTrail(m.id)} />
        ))}
      </div>

      {/* Community Engine P2-4: heat-sorted "What fans are watching" cluster
          (plan §3.4 C3.1) — additive over the static trail picker above;
          renders nothing when the current era has no live theories, same
          fail-soft contract `useLiveTheories` already gives every other
          caller. */}
      {watchingCards.length > 0 && (
        <>
          <div className="mt-8 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[color:var(--era-accent)]" />
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--era-ink-soft)]">
              What fans are watching
            </h2>
          </div>
          <ol className="mt-4 space-y-4">
            {watchingCards.map(({ theory, fansAreSaying }) => (
              <LiveTheoryCard key={theory.id} theory={theory} fansAreSaying={fansAreSaying} />
            ))}
          </ol>
        </>
      )}

      {/* Explore mode */}
      <button
        onClick={onOpenMap}
        className="era-card group mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border p-5 text-left transition hover:border-[color:var(--era-accent)]"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--era-surface-2)] text-[color:var(--era-accent)]">
            <Network className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-[family-name:var(--era-font)] text-lg font-semibold">
              Explore the full constellation
            </h3>
            <p className="text-sm text-[color:var(--era-ink-soft)]">
              Every clue and payoff as one connected web. For when you want to wander.
            </p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 text-[color:var(--era-accent)] transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="era-card rounded-2xl border p-4 text-center">
      <div className="font-[family-name:var(--era-font)] text-2xl font-semibold text-[color:var(--era-accent)]">
        {value}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-[color:var(--era-ink-soft)]">
        {label}
      </div>
    </div>
  );
}

function TrailCard({ motif, onOpen }: { motif: Motif; onOpen: () => void }) {
  const Icon = motifIcon(motif);
  const nodes = motifNodes(motif.id);
  const eraIds = motifEraIds(motif.id);
  // Per-trail visited progress; empty until the post-mount hydrate.
  const { progress } = useProgress();
  const tp = trailProgress(progress.eggs, motif.id);
  return (
    <button
      onClick={onOpen}
      className="era-card group flex flex-col rounded-2xl border p-5 text-left transition hover:border-[color:var(--era-accent)]"
    >
      <div className="flex items-center gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--era-surface-2)] text-[color:var(--era-accent)]">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-[family-name:var(--era-font)] text-lg font-semibold leading-tight">
            {motif.label}
          </h3>
          <span className="text-xs text-[color:var(--era-ink-soft)]">
            {nodes.length} clues · {eraIds.length} eras
            {tp.complete ? (
              <span className="ml-1.5 inline-flex items-center gap-0.5 font-medium text-[color:var(--era-accent)]">
                <Check className="h-3 w-3" aria-hidden />
                Decoded
              </span>
            ) : (
              tp.seen > 0 && (
                <span className="ml-1.5 text-[color:var(--era-accent)]">
                  · {tp.seen}/{tp.total} seen
                </span>
              )
            )}
          </span>
        </div>
      </div>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
        {motif.blurb}
      </p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          {eraIds.map((id) => {
            const era = getEra(id);
            return (
              <span
                key={id}
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: era.theme.accent }}
                title={era.shortName}
              />
            );
          })}
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-[color:var(--era-accent)]">
          Follow
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
