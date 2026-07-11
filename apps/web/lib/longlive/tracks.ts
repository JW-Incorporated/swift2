import type { ContentItem, EraId, RelatedId, TrackConnection, TrackNote } from './types';
import { TRACKS_RAW } from './tracks.generated';
import { getContentItem } from './content';

/**
 * Per-album song track guide — static data synced at build time from the
 * Vault `track_note` seed/table by scripts/sync-longlive-tracks.mjs (same
 * pattern as content-vault.generated.ts; see docs/longlive-experience.md §9).
 * The generator already normalizes, de-dupes, and sorts (track number
 * ascending, unnumbered last), so reads here are plain lookups.
 */

export function tracksForEra(eraId: EraId): TrackNote[] {
  return TRACKS_RAW[eraId] ?? [];
}

/** A `song:<slug>` RelatedId resolved to its era + track. */
export interface SongTarget {
  eraId: EraId;
  track: TrackNote;
}

/**
 * Resolve a `song:<TrackNote.slug>` RelatedId to the track it names, or null
 * for any other namespace / unknown slug (same silent-skip contract as
 * lib/longlive/related.ts — the UI never renders a dead link). Slugs are
 * unique per era and should be authored globally unique; if one ever
 * collides across eras, the first era (object key order of the generated
 * map) wins.
 */
export function songTargetOf(relatedId: RelatedId): SongTarget | null {
  if (!relatedId.startsWith('song:')) return null;
  const slug = relatedId.slice('song:'.length);
  if (!slug) return null;
  for (const [eraId, tracks] of Object.entries(TRACKS_RAW) as [EraId, TrackNote[]][]) {
    const track = tracks.find((t) => t.slug === slug);
    if (track) return { eraId, track };
  }
  return null;
}

/** A dossier connection resolved to a concrete navigation target. */
export type ResolvedConnection =
  | { kind: 'song'; connection: TrackConnection; eraId: EraId; track: TrackNote }
  | { kind: 'moment'; connection: TrackConnection; item: ContentItem };

/**
 * Resolve a dossier's connections (issue #440 §10) to navigable targets.
 * `song:` ids resolve against the track guide, `moment:` ids against the
 * era content; everything else — other namespaces, unknown ids, and a song
 * pointing at itself (`selfSlug`) — is skipped silently.
 */
export function resolveConnections(
  connections: readonly TrackConnection[] | undefined,
  selfSlug?: string,
): ResolvedConnection[] {
  const out: ResolvedConnection[] = [];
  for (const connection of connections ?? []) {
    const song = songTargetOf(connection.relatedId);
    if (song) {
      if (selfSlug && song.track.slug === selfSlug) continue;
      out.push({ kind: 'song', connection, eraId: song.eraId, track: song.track });
      continue;
    }
    if (connection.relatedId.startsWith('moment:')) {
      const item = getContentItem(connection.relatedId.slice('moment:'.length));
      if (item) out.push({ kind: 'moment', connection, item });
    }
  }
  return out;
}
