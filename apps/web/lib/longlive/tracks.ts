import type { ContentItem, EraId, RelatedId, TrackConnection, TrackFacts, TrackNote } from '@swift2/experience';
import { TRACKS_RAW } from './tracks.generated';
import { getContentItem } from './content';
import { getEra } from '@swift2/experience';
import { formatFullDate } from './format';

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

/**
 * The composite key that identifies one song across the store, the guide, and
 * a shared URL. A TrackNote has no stable id, so the era + track number +
 * title stand in. Lives here (not in the TrackDetail component that used to
 * own it) so the store's deep-link resolver and the ShareSheet can build and
 * parse it without importing a React component. TrackDetail re-exports it, so
 * every existing `trackKey` call site is unchanged.
 */
export function trackKey(eraId: string, track: Pick<TrackNote, 'trackNumber' | 'title'>): string {
  return `${eraId}::${track.trackNumber ?? 'x'}::${track.title}`;
}

/**
 * Resolve a shared `?song=` key back to its era + track (#707). The key's
 * first `::` segment is the era, so we only scan that one album. Returns null
 * for a stale/mangled key — the store then simply stays on the landing page
 * rather than opening an empty dossier over the wrong era.
 */
export function resolveTrackKey(key: string): { eraId: EraId; track: TrackNote } | null {
  const rawEra = key.split('::')[0];
  const eraId = getEra(rawEra).id;
  // getEra falls back to the last era for an unknown id; reject that so a bad
  // era segment can't silently resolve against the wrong album.
  if (eraId !== rawEra) return null;
  const track = tracksForEra(eraId).find((t) => trackKey(eraId, t) === key);
  return track ? { eraId, track } : null;
}

/**
 * Value of the facts card's Released row (issue #458). The card already sits
 * inside the album's own guide, so the album name is redundant next to the
 * date: prefer the date alone, and show `facts.release` only when there is a
 * release name but no date to format. Undefined = no row.
 */
export function releasedFactValue(facts: TrackFacts): string | undefined {
  if (facts.releaseDate) return formatFullDate(facts.releaseDate);
  return facts.release || undefined;
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

/**
 * The next numbered song on the same album, or null on the last (or an
 * unnumbered) track. TRACKS_RAW is generator-sorted (track number ascending,
 * unnumbered last), so "next" is the first later entry with a greater number.
 */
export function nextTrackOnAlbum(eraId: EraId, track: TrackNote): TrackNote | null {
  if (track.trackNumber == null) return null;
  return (
    tracksForEra(eraId).find(
      (t) => t.trackNumber != null && t.trackNumber > track.trackNumber! && t.slug !== track.slug,
    ) ?? null
  );
}

/**
 * The adjacent track for the song page's Previous/Next navigation (#774
 * Option 2). Deliberately walks EVERY sourced track note in album order —
 * `tracksForEra`'s generator-sorted array, by position — not just numbered
 * tracks the way `nextTrackOnAlbum` does for "Keep exploring": Joey's
 * explicit scope call on #774 was that Previous/Next must not silently skip
 * a sourced note that lacks a full dossier. Null at either end (no wrap).
 */
export function adjacentTrackOnAlbum(
  eraId: EraId,
  track: TrackNote,
  direction: 'previous' | 'next',
): TrackNote | null {
  const tracks = tracksForEra(eraId);
  const key = trackKey(eraId, track);
  const idx = tracks.findIndex((t) => trackKey(eraId, t) === key);
  if (idx === -1) return null;
  const targetIdx = direction === 'next' ? idx + 1 : idx - 1;
  return tracks[targetIdx] ?? null;
}

/**
 * The "Keep exploring" list (issue #498 follow-ups / Joey 2026-07-15):
 * the FIRST entry is always the album's next song — the strongest "related"
 * item there is — followed by the dossier's curated connections (de-duped
 * against the next song so it never appears twice). Songs with no curated
 * connections still get the next-song entry, so the section is never empty
 * mid-album.
 */
export function keepExploring(eraId: EraId, track: TrackNote): ResolvedConnection[] {
  const curated = resolveConnections(track.dossier?.connections, track.slug);
  const next = nextTrackOnAlbum(eraId, track);
  if (!next) return curated;
  const nextEntry: ResolvedConnection = {
    kind: 'song',
    eraId,
    track: next,
    connection: {
      relatedId: `song:${next.slug}` as RelatedId,
      label: next.title,
      why: `Track ${next.trackNumber} — up next on ${getEra(eraId).album}.`,
    },
  };
  return [nextEntry, ...curated.filter((c) => !(c.kind === 'song' && c.track.slug === next.slug))];
}
