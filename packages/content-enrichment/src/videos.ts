import type { AppearanceVideoKind, EraId, VideoNote, VideoNoteKind } from '@swift2/experience';

/**
 * Per-era official videos / visual media enrichment — moved out of
 * `apps/web/lib/longlive/videos.ts` in OS-014b-1
 * (docs/proposals/2026-09-vault-read-path.md) so `scripts/build-content-
 * bundle.mjs` can call this logic with zero `apps/web` dependency.
 * `apps/web/lib/longlive/videos.ts` re-exports this unchanged for its
 * existing callers/tests. Raw per-era data (`VIDEOS_RAW`) is NOT owned here
 * — every function below takes it as a plain argument.
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
 * A video record is WATCHABLE when it either plays in-app (`isPlayable`) or
 * carries a verified official watch link elsewhere (`watchUrl` + `platform`)
 * — #3476. This widens playable-first rather than replacing it: Joey's rule
 * ("nothing on the timeline that can't be played... nothing a user can't
 * view") was never actually violated by these 8 tour films/documentaries —
 * they ARE viewable, just not embeddable. The rule that broke was reading
 * "played" as "played inline on this site" when Joey's own words are about
 * the READER being able to watch the thing, full stop. A record with
 * neither signal (no embed, no watch link) stays exactly as hidden as
 * before this change.
 */
export type WatchableVideoNote =
  | PlayableVideoNote
  | (VideoNote & { youtubeId: null; watchUrl: string; platform: string });

export function isWatchable(v: VideoNote): v is WatchableVideoNote {
  return isPlayable(v) || hasValidWatchLink(v);
}

/**
 * True when `v.watchUrl`/`v.platform` are a genuinely renderable pair: both
 * present, `platform` a non-blank label, and `watchUrl` an absolute
 * `http(s)://` URL. Guards the exact spot `VideoMomentCard.tsx` renders
 * `<a href={video.watchUrl}>` — a bare `typeof === 'string'` check would let
 * an unsafe scheme (`javascript:`, `data:`) or an all-whitespace platform
 * label reach that anchor. `sync-longlive-videos.mjs`'s `normalizeVideo`
 * already degrades a malformed pair to null/null before it reaches the
 * generated corpus, so this is a defense-in-depth check at the read side,
 * not the only line of defense.
 */
function hasValidWatchLink(v: VideoNote): v is VideoNote & { watchUrl: string; platform: string } {
  if (typeof v.watchUrl !== 'string' || typeof v.platform !== 'string') return false;
  if (v.platform.trim().length === 0) return false;
  return /^https?:\/\//i.test(v.watchUrl);
}

/**
 * Every watchable video record for an era, given that era's raw video list —
 * playable in-app OR link-out watchable (#3476; see `isWatchable`). Renamed
 * from "playable" to "watchable" in spirit, not in the exported type name:
 * `PlayableVideoNote` stays the narrower type most callers (track pairing,
 * in-app embeds) still need, and only card-rendering surfaces
 * (`VideoMomentCard`, the Videos filter) actually need the wider
 * `WatchableVideoNote`.
 *
 * The filter lives HERE, at the single read point, rather than in each
 * component: the era feed and its Videos filter (EraSection), the search
 * index (search.ts) and the track pages (track-video.ts's `trackVideoFor`,
 * called with this function's output) all funnel through this function, so
 * one filter makes the invariant true everywhere and no future surface can
 * opt out of it by forgetting to check.
 *
 * Records with neither an embed nor a watch link are hidden, NOT deleted
 * (Joey's "hidden until the content is available"): add a verified official
 * upload OR a verified official watch link to the seed and the card returns
 * on the next sync with no code change.
 */
export function videosForEra(videosRaw: VideoNote[]): WatchableVideoNote[] {
  return videosRaw.filter(isWatchable);
}

/**
 * Every record for an era INCLUDING the unplayable ones, as a COPY — not for
 * rendering cards, but for the search index, data-integrity tests, and
 * content tooling (e.g. `scripts/lib/dump-longlive-sources.ts`, which needs
 * every record, playable or not, to assemble the content bundle).
 */
export function allVideoRecords(videosRaw: VideoNote[]): VideoNote[] {
  return [...videosRaw];
}

/**
 * Music videos for an era that carry a real release date — i.e. the subset
 * that's eligible to also render as its own dated entry in the main
 * chronological timeline (EraSection). Scoped to `kind === 'music_video'`
 * only, per the issue #439 request. A video with no `releasedOn` has nowhere
 * to sit on a dated timeline, so it's excluded here.
 */
export function musicVideosForEra(
  videosRaw: VideoNote[],
): (PlayableVideoNote & { releasedOn: string })[] {
  return videosForEra(videosRaw).filter(
    (v): v is PlayableVideoNote & { releasedOn: string } =>
      isPlayable(v) && v.kind === 'music_video' && v.releasedOn != null,
  );
}

/**
 * Reader-facing label per kind — the one place a kind becomes English, so the
 * same record never gets two different names on two surfaces.
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
 * only be Taylor"). `kind: null` (an unrecognized seed value the generator
 * degraded) counts as neither. */
export function isAppearance(v: VideoNote): boolean {
  return v.kind !== null && APPEARANCE_KINDS.has(v.kind);
}

/**
 * Everything watchable in an era, newest-first, for the Videos filter in
 * EraSection — every video record of every kind, not just the music videos the
 * main feed duplicates in (issue #439).
 *
 * A link-out record (no `youtubeId`) has nothing to de-dup against a
 * moment's embed, so it always passes this filter untouched — same de-dup
 * key and same direction as the existing music-video merge otherwise — the
 * moment wins, because it carries the narrative.
 *
 * Undated records sort last rather than being dropped (unlike
 * `musicVideosForEra`, which must be datable to sit in the chronological
 * feed): in a video-only view there is no chronology to break, and dropping a
 * video for having no premiere date would quietly hide it from the filter
 * that exists to find it.
 *
 * Unwatchable records are already gone — `videosForEra` drops them.
 */
export function eraVideoFeed(
  videosRaw: VideoNote[],
  embeddedYoutubeIds: ReadonlySet<string> = new Set(),
): WatchableVideoNote[] {
  // `filter` already returns a fresh array, so sorting in place here cannot
  // reach the caller's original array.
  return videosForEra(videosRaw)
    .filter((v) => v.youtubeId === null || !embeddedYoutubeIds.has(v.youtubeId))
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

/**
 * Which era owns the video record with this slug, or null if none does
 * (#3312 — a `?item=` deep link may name a video's slug rather than a
 * moment's id, since videos have no separate share param of their own).
 * Scans every era's full record list (not just the playable ones) so a
 * stale/unplayable slug still resolves to the right era rather than
 * silently failing.
 */
export function findVideoEraId(
  eraIds: readonly EraId[],
  videosRawByEra: Partial<Record<EraId, VideoNote[]>>,
  slug: string,
): EraId | null {
  for (const eraId of eraIds) {
    if ((videosRawByEra[eraId] ?? []).some((v) => v.slug === slug)) return eraId;
  }
  return null;
}
