import type { AppearanceVideoKind, EraId, VideoNote, VideoNoteKind } from './types';
import { VIDEOS_RAW } from './videos.generated';

/**
 * Per-era official videos / visual media — static data synced at build time
 * from the Vault `video_work` seed/table by scripts/sync-longlive-videos.mjs
 * (same pattern as tracks.generated.ts; see docs/longlive-experience.md §9).
 * The generator already normalizes, de-dupes, extracts the verified YouTube
 * embed id, and sorts by release date, so reads here are plain lookups.
 */

/**
 * A video record is PLAYABLE when it carries a verified embed id.
 *
 * This is the whole of the playable-first rule (Joey, 2026-08-13: "I don't
 * want anything on the timeline that can't be played... anything that doesn't
 * have a video either deleted or hidden until the content is available").
 * Nothing is deleted — the researched record keeps its summary, symbolism,
 * eggs and citations in the seed — it simply isn't rendered.
 */
export type PlayableVideoNote = VideoNote & { youtubeId: string };

export function isPlayable(v: VideoNote): v is PlayableVideoNote {
  return typeof v.youtubeId === 'string' && v.youtubeId.length > 0;
}

/**
 * Every playable video record for an era.
 *
 * The filter lives HERE, at the single read point, rather than in each
 * component: the rail (EraVideos), the era feed and its Videos filter
 * (EraSection), the search index (search.ts) and the track pages
 * (videoForTrack) all funnel through this function, so one filter makes the
 * invariant true everywhere and no future surface can opt out of it by
 * forgetting to check. That is also why the previous fix didn't hold — #2050's
 * inert cards came from two components each deciding for themselves.
 *
 * Records without an embed are hidden, NOT deleted (Joey's "hidden until the
 * content is available"): re-add a verified official upload to the seed and the
 * card returns on the next sync with no code change. The eight records this
 * currently hides are the tour films, documentaries and the theatrical release
 * party, whose works exist only behind Netflix / Disney+ / Apple Music / DVD —
 * each is annotated in supabase/seed/videos/**.
 */
export function videosForEra(eraId: EraId): PlayableVideoNote[] {
  return (VIDEOS_RAW[eraId] ?? []).filter(isPlayable);
}

/** Every record for an era INCLUDING the unplayable ones. Not for rendering —
 * this exists so data-integrity tests and content tooling can still see what
 * the seed holds. Reader-facing code wants `videosForEra`. */
export function allVideoRecordsForEra(eraId: EraId): VideoNote[] {
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
export function musicVideosForEra(eraId: EraId): (PlayableVideoNote & { releasedOn: string })[] {
  return videosForEra(eraId).filter(
    (v): v is PlayableVideoNote & { releasedOn: string } =>
      v.kind === 'music_video' && v.releasedOn != null,
  );
}

/**
 * Reader-facing label per kind — the one place a kind becomes English, shared
 * by the EraVideos rail card and the Videos-filtered feed card so the same
 * record never gets two different names on two surfaces.
 */
export const VIDEO_KIND_LABEL: Record<VideoNoteKind, string> = {
  // Works she made or headlined.
  music_video: 'Music video',
  lyric_video: 'Lyric video',
  short_film: 'Short film',
  tour_film: 'Tour film',
  documentary: 'Documentary',
  performance: 'Performance',
  // Appearances — her, as herself, in someone else's programming.
  interview: 'Interview',
  award_speech: 'Award speech',
  speech: 'Speech',
  press_event: 'Press appearance',
};

/** The appearance half of the taxonomy (see VIDEO_KINDS in
 * packages/shared/src/vault-types.ts for why the split exists). */
export const APPEARANCE_KINDS: ReadonlySet<VideoNoteKind> = new Set<AppearanceVideoKind>([
  'interview',
  'award_speech',
  'speech',
  'press_event',
]);

/** True when this record is Taylor herself, on screen, inside someone else's
 * programming, rather than a work she released. Read "Taylor herself"
 * literally — that is Joey's rule for this surface (2026-08-12: "it should
 * only be Taylor"). An earlier pass had widened the wording to "an era moment"
 * so a broadcast announcement about her could sit here (Time's Person of the
 * Year, revealed on TODAY by Time's editor); that record was removed instead.
 * If she is not the person on screen, it is a timeline moment, not an
 * appearance. APPEARANCE_VIDEO_KINDS in packages/shared/src/vault-types.ts is
 * the canonical wording this mirrors. `kind: null` (an unrecognized seed value
 * the generator degraded) counts as neither. */
export function isAppearance(v: VideoNote): boolean {
  return v.kind !== null && APPEARANCE_KINDS.has(v.kind);
}

/**
 * Everything watchable in an era, newest-first, for the Videos filter in
 * EraSection — every video record of every kind, not just the music videos the
 * main feed duplicates in (issue #439).
 *
 * `embeddedYoutubeIds` are the ids already embedded on curated moments in the
 * same era: those records are dropped here so one video never appears twice in
 * one list. Same de-dup key and same direction as the existing music-video
 * merge — the moment wins, because it carries the narrative.
 *
 * Undated records sort last rather than being dropped (unlike
 * `musicVideosForEra`, which must be datable to sit in the chronological
 * feed): in a video-only view there is no chronology to break, and dropping a
 * video for having no premiere date would quietly hide it from the filter
 * that exists to find it.
 *
 * Unplayable records are already gone — `videosForEra` drops them.
 */
export function eraVideoFeed(
  eraId: EraId,
  embeddedYoutubeIds: ReadonlySet<string> = new Set(),
): PlayableVideoNote[] {
  // `filter` already returns a fresh array, so sorting in place here cannot
  // reach VIDEOS_RAW.
  return videosForEra(eraId)
    .filter((v) => !embeddedYoutubeIds.has(v.youtubeId))
    .sort((a, b) => {
      if (a.releasedOn !== null && b.releasedOn !== null && a.releasedOn !== b.releasedOn) {
        return a.releasedOn < b.releasedOn ? 1 : -1; // newest first
      }
      if ((a.releasedOn === null) !== (b.releasedOn === null)) {
        return a.releasedOn === null ? 1 : -1;
      }
      return a.title.localeCompare(b.title);
    });
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
export function videoForTrack(eraId: EraId, title: string): PlayableVideoNote | undefined {
  const t = normalizeTitle(title);
  if (!t) return undefined;
  // `videosForEra` already guarantees a verified embed id, which is what this
  // function's "requires a verified youtubeId" contract asked for by hand.
  const vids = videosForEra(eraId).filter((v) => normalizeTitle(v.title) === t);
  return vids.find((v) => v.kind === 'music_video') ?? vids.find((v) => v.kind === 'lyric_video');
}
