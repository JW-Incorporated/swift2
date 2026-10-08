'use client';

import { useEffect } from 'react';
import { ArrowLeft, ArrowRight, Network, Check } from 'lucide-react';
import { getEra } from '@swift2/experience';
import { MOTIF_BY_ID, motifNodes, motifEraIds } from '@swift2/experience';
import { trailProgress } from '@swift2/experience';
import { useProgress, useProgressActions } from '../store';
import type { EggNode, Motif, MotifId } from '@swift2/experience';
import { motifIcon } from './ClueWebShared';
import { NodeRow } from './ClueWebNodeRow';

/* ── Trail: one motif, read as a story ───────────────────────────────── */
export function TrailView({
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
  const finalEra = getEra(nodes[nodes.length - 1]!.eraId);
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
          Every clue on this trail — all {nodes.length}, from {getEra(nodes[0]!.eraId).shortName} to{' '}
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
