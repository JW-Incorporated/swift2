import type { EraId, VideoNote } from '@swift2/experience';
import { ERAS } from '@swift2/experience';
import {
  APPEARANCE_KINDS,
  allVideoRecords,
  eraVideoFeed as eraVideoFeedRaw,
  isAppearance,
  isPlayable,
  musicVideosForEra as musicVideosForEraRaw,
  videosForEra as videosForEraRaw,
  VIDEO_KIND_LABEL,
  type PlayableVideoNote,
} from '@swift2/content-enrichment';
import { VIDEOS_RAW } from './videos.generated';

/**
 * Per-era official videos / visual media — static data synced at build time
 * from the Vault `video_work` seed/table by scripts/sync-longlive-videos.mjs
 * (same pattern as tracks.generated.ts; see docs/longlive-experience.md §9).
 * The generator already normalizes, de-dupes, extracts the verified YouTube
 * embed id, and sorts by release date, so reads here are plain lookups.
 *
 * OS-014b-1: the pure filter/derive logic moved to
 * `@swift2/content-enrichment` so `scripts/build-content-bundle.mjs` can
 * call it with zero `apps/web` dependency. Re-exported/wrapped here
 * unchanged so every existing caller/test of this module keeps working.
 */

export type { PlayableVideoNote };
export { isPlayable, VIDEO_KIND_LABEL, APPEARANCE_KINDS, isAppearance };

export function videosForEra(eraId: EraId): PlayableVideoNote[] {
  return videosForEraRaw(VIDEOS_RAW[eraId] ?? []);
}

/**
 * Every record for an era INCLUDING the unplayable ones. Not for rendering
 * cards — this exists for the search index (a search hit is not a card; see
 * search.ts), data-integrity tests, and content tooling. Reader-facing card
 * surfaces want `videosForEra`.
 */
export function allVideoRecordsForEra(eraId: EraId): VideoNote[] {
  return allVideoRecords(VIDEOS_RAW[eraId] ?? []);
}

/**
 * Music videos for an era that carry a real release date — i.e. the subset
 * that's eligible to also render as its own dated entry in the main
 * chronological timeline (EraSection). Scoped to `kind === 'music_video'`
 * only, per the issue #439 request.
 */
export function musicVideosForEra(eraId: EraId): (PlayableVideoNote & { releasedOn: string })[] {
  return musicVideosForEraRaw(VIDEOS_RAW[eraId] ?? []);
}

/**
 * Everything watchable in an era, newest-first, for the Videos filter in
 * EraSection.
 */
export function eraVideoFeed(
  eraId: EraId,
  embeddedYoutubeIds: ReadonlySet<string> = new Set(),
): PlayableVideoNote[] {
  return eraVideoFeedRaw(VIDEOS_RAW[eraId] ?? [], embeddedYoutubeIds);
}

/**
 * Which era owns the video record with this slug, or null if none does
 * (#3312 — a `?item=` deep link may name a video's slug rather than a
 * moment's id, since videos have no separate share param of their own; see
 * `store.tsx`'s deep-link effect).
 */
export function findVideoEraId(slug: string): EraId | null {
  for (const era of ERAS) {
    if (allVideoRecordsForEra(era.id).some((v) => v.slug === slug)) return era.id;
  }
  return null;
}

// The legacy per-song matcher (`videoForTrack`, exact-title after stripping
// EVERY parenthetical including "(Taylor's Version)") lived here until
// finding #2 (adversarial review, 2026-08-13): its normalization couldn't
// tell two different recordings of the same song apart, so it disagreed with
// track-video.ts's conservative `trackVideoFor` on which video to play (e.g.
// Fearless's "The Best Day" dossier played the Taylor's Version video while
// TrackGuide correctly played the original). Removed rather than fixed —
// there is only one matcher now; see `trackVideoFor` in `track-video.ts`.
