// Shim for apps/web/lib/longlive/tracks.ts: same exports; TRACKS_RAW is live
// and `fill()` installs it as the tracks provider.
import type { EraId, TrackNote } from '@swift2/experience';

export {
  adjacentTrackOnAlbum,
  keepExploring,
  nextTrackOnAlbum,
  releasedFactValue,
  resolveConnections,
  songTargetOf,
  tracksForEra,
} from '@swift2/experience';

export const TRACKS_RAW: Partial<Record<EraId, TrackNote[]>> = {};
