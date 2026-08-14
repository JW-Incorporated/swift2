import type { VideoNote } from './types';

/**
 * Pairs a track guide song to the official video that plays it, so
 * `TrackGuide` can offer inline playback without `TrackNote` ever pointing at
 * a `VideoNote` directly (issue: 2026-08-13 PLAN.md P2 step 10). P3 reuses
 * this same lookup to anchor an undated egg "near some content about that
 * song" (Joey's words) — see `PLAN.md` § Plan amendments (2).
 *
 * Matching is CONSERVATIVE on purpose: a wrong pairing puts the wrong song's
 * video on a track, which is worse than showing no video at all. It matches
 * on `VideoNote.relatedSongs` (the seed's own curated song-title pointer —
 * every music/lyric video in the corpus carries it) and, as a fallback for a
 * video with no `relatedSongs` entry, on the video's own `title`. Both sides
 * are normalized and then compared with an EXACT string equality — no fuzzy
 * matching, no edit distance, no substring/`includes` matching.
 *
 * Normalization deliberately does NOT strip an edition qualifier like
 * "(Taylor's Version)" or "(From The Vault)": those change which recording is
 * being named, not how it's formatted, and the corpus proves the distinction
 * is live — the Fearless era carries both a "The Best Day" video and a
 * "The Best Day (Taylor's Version)" video, and collapsing that pair would
 * pair a track with the wrong recording's video. Only the format-only
 * decorations that never occur on a song's actual title are stripped:
 * "(Official Music Video)", "(Official Video)", "(Music Video)",
 * "(Official Lyric Video)", "(Lyric Video)".
 */
const DECORATION_PATTERNS: RegExp[] = [
  /\(official music video\)/gi,
  /\(official lyric video\)/gi,
  /\(official video\)/gi,
  /\(music video\)/gi,
  /\(lyric video\)/gi,
];

/** Lowercase, strip pure video-format decorations and punctuation, collapse
 * whitespace. Exported for tests only — callers use `trackVideoFor`. */
export function normalizeTrackVideoTitle(title: string): string {
  let s = title.toLowerCase();
  for (const pattern of DECORATION_PATTERNS) s = s.replace(pattern, ' ');
  return s.replace(/[^a-z0-9]+/g, ' ').trim();
}

/**
 * The official video for a track's song, or null when there isn't one (no
 * match, or the track title normalizes to nothing).
 *
 * On more than one match — e.g. separate music-video and lyric-video
 * records for the same song — prefers `music_video`, then `lyric_video`,
 * then the first match in the input's own order, mirroring the existing
 * preference in `videoForTrack` (videos.ts).
 */
export function trackVideoFor(trackTitle: string, videos: readonly VideoNote[]): VideoNote | null {
  const target = normalizeTrackVideoTitle(trackTitle);
  if (!target) return null;
  const matches = videos.filter(
    (v) =>
      v.relatedSongs.some((song) => normalizeTrackVideoTitle(song) === target) ||
      normalizeTrackVideoTitle(v.title) === target,
  );
  if (matches.length === 0) return null;
  return (
    matches.find((v) => v.kind === 'music_video') ??
    matches.find((v) => v.kind === 'lyric_video') ??
    matches[0]
  );
}
