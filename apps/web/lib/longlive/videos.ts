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
