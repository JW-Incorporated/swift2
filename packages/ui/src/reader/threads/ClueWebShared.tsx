'use client';

import {
  Hash,
  Type,
  Spline,
  Palette,
  Clock,
  DoorOpen,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { EGG_NODES, EGG_LINKS } from '@swift2/experience';
import type { EggNode, Motif } from '@swift2/experience';

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

export function motifIcon(motif: Motif) {
  return MOTIF_ICONS[motif.icon] ?? Sparkles;
}

/** Linked eggs for a node (either direction), with the connection's label. */
export function linksFor(nodeId: string): { other: EggNode; label: string }[] {
  const out: { other: EggNode; label: string }[] = [];
  for (const l of EGG_LINKS) {
    if (l.from !== nodeId && l.to !== nodeId) continue;
    const otherId = l.from === nodeId ? l.to : l.from;
    const other = EGG_NODES.find((n) => n.id === otherId);
    if (other) out.push({ other, label: l.label });
  }
  return out;
}

export function LegendDot({ kind, label }: { kind: 'clue' | 'payoff' | 'theory'; label: string }) {
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
