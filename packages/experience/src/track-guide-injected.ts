import type { EraId, RelatedId, TrackConnection, TrackNote } from './types';
import { injectedCorpus } from './corpus-injected';
import {
  adjacentTrackOnAlbumIn,
  keepExploringIn,
  nextTrackOnAlbumIn,
  resolveConnectionsIn,
  resolveTrackKeyIn,
  songTargetOfIn,
  tracksForEraIn,
  type ResolvedConnection,
  type SongTarget,
} from './track-guide';

export function tracksForEra(eraId: EraId): TrackNote[] {
  return tracksForEraIn(injectedCorpus(), eraId);
}

export function resolveTrackKey(key: string): { eraId: EraId; track: TrackNote } | null {
  return resolveTrackKeyIn(injectedCorpus(), key);
}

export function songTargetOf(relatedId: RelatedId): SongTarget | null {
  return songTargetOfIn(injectedCorpus(), relatedId);
}

export function resolveConnections(
  connections: readonly TrackConnection[] | undefined,
  selfSlug?: string,
): ResolvedConnection[] {
  return resolveConnectionsIn(injectedCorpus(), connections, selfSlug);
}

export function nextTrackOnAlbum(eraId: EraId, track: TrackNote): TrackNote | null {
  return nextTrackOnAlbumIn(injectedCorpus(), eraId, track);
}

export function adjacentTrackOnAlbum(
  eraId: EraId,
  track: TrackNote,
  direction: 'previous' | 'next',
): TrackNote | null {
  return adjacentTrackOnAlbumIn(injectedCorpus(), eraId, track, direction);
}

export function keepExploring(eraId: EraId, track: TrackNote): ResolvedConnection[] {
  return keepExploringIn(injectedCorpus(), eraId, track);
}
