'use client';

import type React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Hash,
  Type,
  Spline,
  Palette,
  Clock,
  DoorOpen,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Network,
  Route,
  Check,
} from 'lucide-react';
import { getEra } from '@swift2/experience';
import {
  EGG_NODES,
  EGG_LINKS,
  MOTIFS,
  MOTIF_BY_ID,
  motifNodes,
  motifEraIds,
  motifOf,
} from '@swift2/experience';
import { clueWebProgress, trailProgress } from '@swift2/experience';
import {
  useAppActions,
  useAppState,
  useProgress,
  useProgressActions,
} from '@/lib/longlive/store';
import type { EggNode, Motif, MotifId } from '@swift2/experience';
import { useBackDismiss } from '@/lib/longlive/useBackDismiss';

/** Motif icon strings (from the data) resolved to lucide components. */
const MOTIF_ICONS: Record<string, typeof Hash> = {
  Hash,
  Type,
  Spline,
  Palette,
  Clock,
  DoorOpen,
  RefreshCw,
};

function motifIcon(motif: Motif) {
  return MOTIF_ICONS[motif.icon] ?? Sparkles;
}

/** Linked eggs for a node (either direction), with the connection's label. */
function linksFor(nodeId: string): { other: EggNode; label: string }[] {
  const out: { other: EggNode; label: string }[] = [];
  for (const l of EGG_LINKS) {
    if (l.from !== nodeId && l.to !== nodeId) continue;
    const otherId = l.from === nodeId ? l.to : l.from;
    const other = EGG_NODES.find((n) => n.id === otherId);
    if (other) out.push({ other, label: l.label });
  }
  return out;
}

type View =
  | { kind: 'home' }
  | { kind: 'trail'; motif: MotifId }
  | { kind: 'map'; motif: MotifId | null; nodeId?: string };

/**
 * The Clue Web — a self-contained mini-app. It has its own internal navigation
 * so the visitor always knows what they're doing: a guided home screen leads
 * into a readable "trail" for one motif, with the free-form constellation kept
 * as an explicit, opt-in "explore" mode rather than the confusing front door.
 */
export function ClueWeb() {
  // A cross-link (a moment's "follow this thread") may have queued a trail to
  // land on; start there instead of home. Initialized from state so the first
  // paint is already the trail (no home-screen flash).
  const { clueWebTrail } = useAppState();
  const { clearClueWebTrail } = useAppActions();
  const [view, setView] = useState<View>(() =>
    clueWebTrail ? { kind: 'trail', motif: clueWebTrail } : { kind: 'home' },
  );
  const topRef = useRef<HTMLDivElement>(null);

  // Consume the pending focus once landed — and honor a new one if a cross-
  // link fires while the Clue Web is already mounted.
  useEffect(() => {
    if (!clueWebTrail) return;
    setView({ kind: 'trail', motif: clueWebTrail });
    clearClueWebTrail();
  }, [clueWebTrail, clearClueWebTrail]);

  const go = (next: View) => {
    setView(next);
    // Re-anchor to the top of the mini-app so a new view starts in view.
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  // Let the mobile back-swipe gesture return to the Clue Web's home screen
  // instead of leaving the app — same pattern as the app's other overlays.
  // Matches the existing in-app back buttons, which already return straight
  // to home rather than stepping back one level at a time.
  useBackDismiss(view.kind !== 'home', () => go({ kind: 'home' }));

  return (
    <div ref={topRef} className="scroll-mt-24 pt-8">
      {view.kind === 'home' && (
        <ClueHome
          onOpenTrail={(m) => go({ kind: 'trail', motif: m })}
          onOpenMap={() => go({ kind: 'map', motif: null })}
        />
      )}
      {view.kind === 'trail' && (
        <TrailView
          motifId={view.motif}
          onBack={() => go({ kind: 'home' })}
          onOpenMap={(m) => go({ kind: 'map', motif: m })}
          onOpenNode={(id) => go({ kind: 'map', motif: null, nodeId: id })}
        />
      )}
      {view.kind === 'map' && (
        <ConstellationView
          initialMotif={view.motif}
          initialNodeId={view.nodeId ?? null}
          onBack={() => go({ kind: 'home' })}
        />
      )}
    </div>
  );
}

/* ── Home: how it works + the trail picker ───────────────────────────── */
function ClueHome({
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

function LegendDot({ kind, label }: { kind: 'clue' | 'payoff' | 'theory'; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={
          kind === 'theory'
            ? 'inline-block h-2.5 w-2.5 rounded-full border border-dashed'
            : kind === 'payoff'
              ? 'inline-block h-2.5 w-2.5 rounded-full'
              : 'inline-block h-2.5 w-2.5 rounded-full border'
        }
        style={
          kind === 'payoff'
            ? { backgroundColor: 'var(--era-accent)' }
            : { borderColor: 'var(--era-accent)' }
        }
      />
      {label}
    </span>
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

/* ── Trail: one motif, read as a story ───────────────────────────────── */
function TrailView({
  motifId,
  onBack,
  onOpenMap,
  onOpenNode,
}: {
  motifId: MotifId;
  onBack: () => void;
  onOpenMap: (m: MotifId) => void;
  onOpenNode: (nodeId: string) => void;
}) {
  const motif = MOTIF_BY_ID[motifId];
  const Icon = motifIcon(motif);
  const nodes = motifNodes(motifId);

  // Opening a trail records it as explored (drives the home "X/Y" counts).
  const { progress, hydrated } = useProgress();
  const { markTrailSeen } = useProgressActions();
  useEffect(() => {
    markTrailSeen(motifId);
  }, [motifId, markTrailSeen]);

  // The end-state: once every node on this trail has been read (this visit or
  // a previous one), a completion card closes out the spine. Gated on hydrated
  // so it can only appear post-mount — a stable first paint, no SSR mismatch.
  const tp = trailProgress(progress.eggs, motifId);
  const complete = hydrated && tp.complete;

  return (
    <div>
      <button
        onClick={onBack}
        className="era-btn-ghost inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        All trails
      </button>

      <header className="mt-5 flex items-start gap-3">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--era-accent)] text-[color:var(--era-bg)]">
          <Icon className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-[family-name:var(--era-font)] text-3xl font-semibold leading-tight">
            {motif.label}
          </h2>
          <p className="mt-1 max-w-xl text-pretty text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
            {motif.blurb}
          </p>
        </div>
      </header>

      {/* The trail, oldest → newest, on a vertical spine. */}
      <div className="relative mt-8 space-y-4 pl-6">
        <span
          aria-hidden
          className="absolute bottom-2 left-[7px] top-2 w-px"
          style={{ backgroundColor: 'var(--era-line)' }}
        />
        {nodes.map((node) => (
          <NodeRow key={node.id} node={node} onOpenNode={onOpenNode} />
        ))}
      </div>

      {complete && <TrailCompleteCard motif={motif} nodes={nodes} onBack={onBack} />}

      <button
        onClick={() => onOpenMap(motifId)}
        className="era-card group mt-6 flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-left transition hover:border-[color:var(--era-accent)]"
      >
        <span className="flex items-center gap-2.5 text-sm font-medium text-[color:var(--era-ink)]">
          <Network className="h-4 w-4 text-[color:var(--era-accent)]" />
          See how this trail connects to the others
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-[color:var(--era-accent)] transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

/**
 * The trail's end-state: shown once every node has been read. Themed to the
 * era the trail resolves in (the payoff end), with the full era span as dots —
 * a quiet payoff, not a trophy screen.
 */
function TrailCompleteCard({
  motif,
  nodes,
  onBack,
}: {
  motif: Motif;
  nodes: EggNode[];
  onBack: () => void;
}) {
  const finalEra = getEra(nodes[nodes.length - 1].eraId);
  const eraIds = motifEraIds(motif.id);
  return (
    <div
      className="clue-reveal era-card relative mt-6 overflow-hidden rounded-2xl border p-6 text-center"
      style={{ borderColor: finalEra.theme.accent }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, color-mix(in srgb, ${finalEra.theme.accent} 12%, transparent), transparent 65%)`,
        }}
      />
      <div className="relative">
        <span
          className="inline-flex h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: finalEra.theme.accent, color: finalEra.theme.bg }}
        >
          <Check className="h-6 w-6" />
        </span>
        <div className="mt-4 text-[11px] font-medium uppercase tracking-[0.3em] text-[color:var(--era-ink-soft)]">
          Trail decoded
        </div>
        <h3 className="mt-2 font-[family-name:var(--era-font)] text-2xl font-semibold">
          You&apos;ve followed “{motif.label}” to the end
        </h3>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-[color:var(--era-ink-soft)]">
          Every clue on this trail — all {nodes.length}, from {getEra(nodes[0].eraId).shortName} to{' '}
          {finalEra.shortName} — is now part of your decode.
        </p>
        <div className="mt-4 flex items-center justify-center gap-1.5">
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
        <button
          onClick={onBack}
          className="era-btn-ghost mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
        >
          Pick your next trail
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function NodeRow({
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

/* ── Constellation: the free-form explore map (opt-in) ───────────────── */
function ConstellationView({
  initialMotif,
  initialNodeId = null,
  onBack,
}: {
  initialMotif: MotifId | null;
  initialNodeId?: string | null;
  onBack: () => void;
}) {
  const [active, setActive] = useState<string | null>(initialNodeId);
  const [hovered, setHovered] = useState<string | null>(null);
  const [filter, setFilter] = useState<MotifId | null>(initialMotif);

  // Revealing a node's detail panel counts as reading it. Effect (not the
  // click handler) so a cross-link's initialNodeId is recorded too.
  const { markEggsSeen } = useProgressActions();
  useEffect(() => {
    if (active) markEggsSeen([active]);
  }, [active, markEggsSeen]);

  const nodeById = (id: string) => EGG_NODES.find((n) => n.id === id)!;
  const activeNode = active ? nodeById(active) : null;

  const focus = active ?? hovered;
  const neighbors = new Set<string>();
  if (focus) {
    neighbors.add(focus);
    for (const l of EGG_LINKS) {
      if (l.from === focus) neighbors.add(l.to);
      if (l.to === focus) neighbors.add(l.from);
    }
  }
  const linkedTo = activeNode
    ? EGG_LINKS.filter((l) => l.from === active || l.to === active).map((l) => ({
        node: nodeById(l.from === active ? l.to : l.from),
        label: l.label,
      }))
    : [];

  const inFilter = (id: string) => !filter || motifOf(id) === filter;
  // A node's label shows only for the focused neighborhood.
  const showLabel = (id: string) => (focus ? neighbors.has(id) : false);
  // Muted when a filter excludes it, or when another node's neighborhood is focused.
  const muted = (id: string) => !inFilter(id) || (Boolean(focus) && !neighbors.has(id));

  return (
    <div>
      <button
        onClick={onBack}
        className="era-btn-ghost inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium"
      >
        <ArrowLeft className="h-4 w-4" />
        All trails
      </button>

      {/* Motif filter */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        <FilterChip active={filter === null} onClick={() => setFilter(null)}>
          All clues
        </FilterChip>
        {MOTIFS.map((m) => (
          <FilterChip key={m.id} active={filter === m.id} onClick={() => setFilter(m.id)}>
            {m.label}
          </FilterChip>
        ))}
      </div>

      <div className="era-card mt-4 overflow-hidden rounded-2xl border">
        <div
          className="relative aspect-[4/3] w-full sm:aspect-[16/9]"
          onMouseLeave={() => setHovered(null)}
        >
          <svg
            viewBox="0 0 100 56.25"
            className="h-full w-full"
            role="img"
            aria-label="Clue web constellation"
          >
            {EGG_LINKS.map((link) => {
              const a = nodeById(link.from);
              const b = nodeById(link.to);
              const lit = focus === link.from || focus === link.to;
              const linkInFilter = inFilter(link.from) && inFilter(link.to);
              return (
                <line
                  key={`${link.from}-${link.to}`}
                  x1={a.x}
                  y1={a.y * 0.5625}
                  x2={b.x}
                  y2={b.y * 0.5625}
                  stroke="var(--era-accent)"
                  strokeWidth={lit ? 0.6 : 0.2}
                  strokeOpacity={lit ? 0.95 : focus ? 0.1 : linkInFilter ? 0.3 : 0.06}
                  strokeDasharray="1.5 1.5"
                />
              );
            })}
            {EGG_NODES.map((n) => {
              const era = getEra(n.eraId);
              const isActive = active === n.id;
              const isTheory = n.confirmed === false;
              return (
                <g
                  key={n.id}
                  transform={`translate(${n.x} ${n.y * 0.5625})`}
                  onClick={() => setActive(isActive ? null : n.id)}
                  onMouseEnter={() => setHovered(n.id)}
                  className="cursor-pointer"
                  style={{ opacity: muted(n.id) ? 0.28 : 1, transition: 'opacity 200ms' }}
                >
                  <circle
                    r={isActive ? 2.6 : n.kind === 'payoff' ? 2 : 1.5}
                    fill={n.kind === 'payoff' ? era.theme.accent : 'var(--era-bg)'}
                    stroke={era.theme.accent}
                    strokeWidth={0.4}
                    strokeDasharray={isTheory ? '0.8 0.6' : undefined}
                  />
                  {n.kind === 'clue' && !isTheory && <circle r={0.6} fill={era.theme.accent} />}
                </g>
              );
            })}
          </svg>

          {EGG_NODES.filter((n) => showLabel(n.id) || active === n.id).map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(active === n.id ? null : n.id)}
              onMouseEnter={() => setHovered(n.id)}
              className="pointer-events-auto absolute z-10 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm transition"
              style={{
                left: `${n.x}%`,
                // Unlike the SVG <circle>, this label is positioned via CSS
                // against the container's own box, which isn't in the SVG's
                // 100×56.25 viewBox space — use n.y directly, not *0.5625.
                top: `calc(${n.y}% + 2.5%)`,
                backgroundColor:
                  active === n.id
                    ? 'var(--era-accent)'
                    : 'color-mix(in srgb, var(--era-surface) 92%, transparent)',
                color: active === n.id ? 'var(--era-bg)' : 'var(--era-ink)',
                border: '1px solid var(--era-line)',
              }}
            >
              {n.label}
            </button>
          ))}

          {/* Legend */}
          <div className="pointer-events-none absolute bottom-2 left-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[color:var(--era-ink-soft)]">
            <LegendDot kind="clue" label="Clue" />
            <LegendDot kind="payoff" label="Payoff" />
            <LegendDot kind="theory" label="Fan theory" />
          </div>
        </div>

        <div className="border-t border-[color:var(--era-line)] p-5">
          {activeNode ? (
            <div className="clue-reveal">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                <span
                  className="rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${getEra(activeNode.eraId).theme.accent} 16%, transparent)`,
                    color: getEra(activeNode.eraId).theme.accent,
                  }}
                >
                  {getEra(activeNode.eraId).shortName} · {activeNode.year}
                </span>
                <span>{activeNode.kind === 'clue' ? 'Clue planted' : 'Payoff'}</span>
                <span
                  className="rounded-full border px-2 py-0.5"
                  style={{ borderColor: 'var(--era-line)' }}
                >
                  {activeNode.confirmed === false ? 'Fan theory' : 'Confirmed'}
                </span>
                {motifOf(activeNode.id) && (
                  <span
                    className="rounded-full px-2 py-0.5"
                    style={{ backgroundColor: 'var(--era-surface-2)', color: 'var(--era-accent)' }}
                  >
                    {MOTIF_BY_ID[motifOf(activeNode.id)!].label}
                  </span>
                )}
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--era-ink)]">
                {activeNode.detail}
              </p>

              {linkedTo.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-widest text-[color:var(--era-ink-soft)]">
                    Pull the thread
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {linkedTo.map(({ node, label }) => (
                      <button
                        key={node.id}
                        onClick={() => setActive(node.id)}
                        className="rounded-full border px-2.5 py-1 text-xs transition hover:bg-[color:var(--era-surface-2)]"
                        style={{ borderColor: 'var(--era-line)', color: 'var(--era-ink)' }}
                      >
                        {label} → {node.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeNode.sources && activeNode.sources.length > 0 && (
                <p className="mt-4 text-xs text-[color:var(--era-ink-soft)]">
                  Source:{' '}
                  {activeNode.sources.map((s, i) => (
                    <span key={s.url}>
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
            </div>
          ) : (
            <p className="text-sm text-[color:var(--era-ink-soft)]">
              Tap any node to reveal the clue it planted — or the payoff it became — then follow the
              threads it connects to. Use the filters above to isolate a single motif.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border px-3 py-1 text-xs font-medium transition"
      style={{
        borderColor: active ? 'var(--era-accent)' : 'var(--era-line)',
        backgroundColor: active ? 'var(--era-accent)' : 'transparent',
        color: active ? 'var(--era-bg)' : 'var(--era-ink-soft)',
      }}
    >
      {children}
    </button>
  );
}
