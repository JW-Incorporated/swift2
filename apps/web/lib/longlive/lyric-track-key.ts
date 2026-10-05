import { trackKey } from '@swift2/experience';
import type { EraId, TrackNote } from '@swift2/experience';
import { TRACKS_RAW } from './tracks.generated';

/** Maps a `lyrics.slug` (TrackNote.slug) to the site's composite trackKey (`${era}::n::title`), or null if unknown. */
export function trackKeyForLyricSlug(slug: string): string | null {
  for (const [eraId, tracks] of Object.entries(TRACKS_RAW) as [EraId, TrackNote[]][]) {
    const track = tracks.find((t) => t.slug === slug);
    if (track) return trackKey(eraId, track);
  }
  return null;
}
