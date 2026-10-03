// Shim for apps/web/lib/longlive/videos.ts: same exports over a live VIDEOS_RAW
// that `fill()` populates in place.
import type { EraId, VideoNote } from '@swift2/experience';
import { ERAS } from '@swift2/experience';
import {
  APPEARANCE_KINDS,
  allVideoRecords,
  eraVideoFeed as eraVideoFeedRaw,
  isAppearance,
  isPlayable,
  isWatchable,
  musicVideosForEra as musicVideosForEraRaw,
  videosForEra as videosForEraRaw,
  VIDEO_KIND_LABEL,
  type PlayableVideoNote,
  type WatchableVideoNote,
} from '@swift2/content-enrichment';

export type { PlayableVideoNote, WatchableVideoNote };
export { isPlayable, VIDEO_KIND_LABEL, APPEARANCE_KINDS, isAppearance, isWatchable };

export const VIDEOS_RAW: Partial<Record<EraId, VideoNote[]>> = {};

export function videosForEra(eraId: EraId): WatchableVideoNote[] {
  return videosForEraRaw(VIDEOS_RAW[eraId] ?? []);
}

export function allVideoRecordsForEra(eraId: EraId): VideoNote[] {
  return allVideoRecords(VIDEOS_RAW[eraId] ?? []);
}

export function musicVideosForEra(eraId: EraId): (PlayableVideoNote & { releasedOn: string })[] {
  return musicVideosForEraRaw(VIDEOS_RAW[eraId] ?? []);
}

export function eraVideoFeed(
  eraId: EraId,
  embeddedYoutubeIds: ReadonlySet<string> = new Set(),
): WatchableVideoNote[] {
  return eraVideoFeedRaw(VIDEOS_RAW[eraId] ?? [], embeddedYoutubeIds);
}

export function findVideoEraId(slug: string): EraId | null {
  for (const era of ERAS) {
    if (allVideoRecordsForEra(era.id).some((v) => v.slug === slug)) return era.id;
  }
  return null;
}
