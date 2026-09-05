/**
 * relatedIds resolution — pure helpers, no data of their own.
 *
 * `relatedIds` (see RelatedId in types.ts) are namespaced `<type>:<id>`
 * references authored by the content lane. This module turns them into
 * concrete navigation targets, resolving strictly against the existing
 * datasets (MOTIFS / MOTIF_MEMBERSHIP via motifOf) — an id that doesn't
 * resolve is silently skipped, so the UI can never render a dead link.
 */

import { getContentItem } from './content';
import { MOTIF_BY_ID, motifOf } from '@swift2/experience';
import type { ContentItem, EraId, Motif, MotifId, RelatedId } from '@swift2/experience';

/** A resolved Clue Web trail target. */
export interface MotifTarget {
  motifId: MotifId;
  motif: Motif;
}

/**
 * Resolve ONE related id to the Clue Web trail it lives on, if any.
 *
 *   - `motif:<MotifId>`  → that trail directly
 *   - `egg:<EggNode.id>` → the trail the node belongs to (via MOTIF_MEMBERSHIP)
 *
 * Every other namespace (moment:, rel:, …), malformed ids, and ids that don't
 * exist in the data resolve to null.
 */
export function motifTargetOf(relatedId: RelatedId): MotifTarget | null {
  const sep = relatedId.indexOf(':');
  if (sep <= 0 || sep === relatedId.length - 1) return null;
  const kind = relatedId.slice(0, sep);
  const id = relatedId.slice(sep + 1);

  if (kind === 'motif') {
    const motif = (MOTIF_BY_ID as Partial<Record<string, Motif>>)[id];
    return motif ? { motifId: motif.id, motif } : null;
  }
  if (kind === 'egg') {
    const motifId = motifOf(id);
    return motifId ? { motifId, motif: MOTIF_BY_ID[motifId] } : null;
  }
  return null;
}

/**
 * The first related id that lands on a Clue Web trail, or null when none do
 * (including when relatedIds is absent — the common case until the content
 * lane populates it).
 */
export function resolveMotifTrail(relatedIds: readonly RelatedId[] | undefined): MotifTarget | null {
  for (const rid of relatedIds ?? []) {
    const target = motifTargetOf(rid);
    if (target) return target;
  }
  return null;
}

/** A resolved moment-to-moment cross-link. */
export interface RelatedMoment {
  item: ContentItem;
  /** The target's era, for the chip on its card. */
  eraId: EraId;
}

/**
 * Resolve `moment:` related ids to the content items they point at.
 *
 * Why this exists alongside motifTargetOf: `resolveMotifTrail` deliberately
 * handles only the `motif:`/`egg:` namespaces, and it was the ONLY resolver
 * MomentDetail called. Every `moment:` id therefore resolved to null and
 * rendered nowhere — all 82 authored moment-to-moment links across the seeds
 * were inert, which is what "the cross linking between articles is very weak"
 * looked like from the outside (2026-07-19).
 *
 * Best-effort, like the rest of this module: unknown namespaces, dangling ids,
 * and a moment pointing at itself are skipped, so a dead link can never
 * render. Order is preserved — authoring order is editorial intent.
 */
export function resolveRelatedMoments(
  relatedIds: readonly RelatedId[] | undefined,
  selfId?: string,
): RelatedMoment[] {
  const out: RelatedMoment[] = [];
  const seen = new Set<string>();
  for (const rid of relatedIds ?? []) {
    if (!rid.startsWith('moment:')) continue;
    const id = rid.slice('moment:'.length);
    if (!id || id === selfId || seen.has(id)) continue;
    const item = getContentItem(id);
    if (!item) continue;
    seen.add(id);
    out.push({ item, eraId: item.eraId });
  }
  return out;
}
