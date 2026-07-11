/**
 * relatedIds resolution — pure helpers, no data of their own.
 *
 * `relatedIds` (see RelatedId in types.ts) are namespaced `<type>:<id>`
 * references authored by the content lane. This module turns them into
 * concrete navigation targets, resolving strictly against the existing
 * datasets (MOTIFS / MOTIF_MEMBERSHIP via motifOf) — an id that doesn't
 * resolve is silently skipped, so the UI can never render a dead link.
 */

import { MOTIF_BY_ID, motifOf } from './lenses';
import { trackKey, tracksForEra } from './tracks';
import type { EraId, Motif, MotifId, RelatedId, TrackNote } from './types';

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

/** A resolved album-track target. */
export interface SongTarget {
  eraId: EraId;
  track: TrackNote;
}

/**
 * Build a `song:<eraId>:<trackKey>` related id for a track — the inverse of
 * `songTargetOf`. Built once here (issue #440 Track Guide overhaul, Phase 0)
 * so #434's Love Story cross-links can reuse the exact same id format instead
 * of inventing a second one; no song-to-song content is authored by this
 * change, just the mechanism.
 */
export function songRelatedId(eraId: EraId, track: TrackNote): RelatedId {
  return `song:${eraId}:${trackKey(eraId, track)}`;
}

/**
 * Resolve ONE related id to the track it names, if any.
 *
 *   - `song:<eraId>:<trackKey>` → that track, found via `tracksForEra(eraId)`
 *     + the same composite `trackKey()` TrackDetail/TrackGuide use to
 *     identify a track (TrackNote has no stable id of its own).
 *
 * Every other namespace, malformed ids, an unknown era, or a track that no
 * longer exists in that era's list resolve to null — same best-effort,
 * never-a-dead-link discipline as `motifTargetOf`.
 */
export function songTargetOf(relatedId: RelatedId): SongTarget | null {
  const sep = relatedId.indexOf(':');
  if (sep <= 0 || sep === relatedId.length - 1) return null;
  const kind = relatedId.slice(0, sep);
  if (kind !== 'song') return null;

  const rest = relatedId.slice(sep + 1);
  const eraSep = rest.indexOf(':');
  if (eraSep <= 0 || eraSep === rest.length - 1) return null;
  const eraId = rest.slice(0, eraSep) as EraId;
  const key = rest.slice(eraSep + 1);

  const track = tracksForEra(eraId).find((t) => trackKey(eraId, t) === key);
  return track ? { eraId, track } : null;
}
