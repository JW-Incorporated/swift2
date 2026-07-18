import type { EraId, VideoNote } from './types';
import { VIDEOS_RAW } from './videos.generated';

/**
 * Per-era official videos / visual media — static data synced at build time
 * from the Vault `video_work` seed/table by scripts/sync-longlive-videos.mjs
 * (same pattern as tracks.generated.ts; see docs/longlive-experience.md §9).
 * The generator already normalizes, de-dupes, extracts the verified YouTube
 * embed id, and sorts by release date, so reads here are plain lookups.
 */

export function videosForEra(eraId: EraId): VideoNote[] {
  return VIDEOS_RAW[eraId] ?? [];
}

/**
 * Music videos for an era that carry a real release date — i.e. the subset
 * that's eligible to also render as its own dated entry in the main
 * chronological timeline (EraSection), duplicating (not replacing) its card
 * in the EraVideos rail above. Scoped to `kind === 'music_video'` only, per
 * the issue #439 request; lyric videos / short films / tour films etc. stay
 * rail-only for now. A video with no `releasedOn` has nowhere to sit on a
 * dated timeline, so it's excluded here (it still appears in the rail).
 */
export function musicVideosForEra(eraId: EraId): (VideoNote & { releasedOn: string })[] {
  return videosForEra(eraId).filter(
    (v): v is VideoNote & { releasedOn: string } => v.kind === 'music_video' && v.releasedOn != null,
  );
}

const normalizeTitle = (s: string): string =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ') // drop "(Taylor's Version)", "(Music Video)", etc.
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * The official video for a specific song, matched by title within its era, so a
 * track page can embed it (issue #439/#440). Prefers a true music video, then a
 * lyric video; requires a verified `youtubeId`. Title match is exact after
 * normalizing punctuation and parenthetical suffixes — strict on purpose, so a
 * page never embeds the wrong song's video.
 */
export function videoForTrack(eraId: EraId, title: string): VideoNote | undefined {
  const t = normalizeTitle(title);
  if (!t) return undefined;
  const vids = videosForEra(eraId).filter((v) => v.youtubeId && normalizeTitle(v.title) === t);
  return vids.find((v) => v.kind === 'music_video') ?? vids.find((v) => v.kind === 'lyric_video');
}
