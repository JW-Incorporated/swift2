import type { MomentVideo, VideoNote } from './types';

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
 * Recording-identifying qualifiers still present on a video's OWN title
 * after stripping the pure-format decorations above — e.g. "(feat. Ice
 * Spice)", "(Taylor's Version)", "(10 Minute Version)". Anything left in
 * parentheses at this point names a DIFFERENT RECORDING, not a format.
 */
function recordingQualifiers(title: string): string[] {
  let s = title.toLowerCase();
  for (const pattern of DECORATION_PATTERNS) s = s.replace(pattern, ' ');
  const parens = s.match(/\(([^)]*)\)/g) ?? [];
  const qualifiers = parens.map((p) => p.slice(1, -1).trim()).filter(Boolean);
  // A featured-artist credit that isn't parenthesized still names a
  // different recording, e.g. a video titled "Karma feat. Ice Spice" with no
  // parens at all — the parenthesized-only check above missed this entirely
  // (re-review finding C, 2026-08-13).
  const withoutParens = s.replace(/\([^)]*\)/g, ' ');
  const featMatch = withoutParens.match(/\b(?:feat\.?|ft\.?|featuring)\b.*/);
  if (featMatch) qualifiers.push(featMatch[0].trim());
  return qualifiers;
}

/**
 * The official video for a track's song, or null when there isn't one (no
 * match, or the track title normalizes to nothing).
 *
 * `trackYoutubeId`, when given, is checked FIRST and wins outright: authored
 * data beats inference (re-review finding C, 2026-08-13). "Fortnight (feat.
 * Post Malone)" IS the original album recording — the track record itself
 * names the video's own YouTube id — but the title/relatedSongs heuristics
 * below reject it as a recording-qualifier mismatch, since the track's plain
 * title doesn't echo "(feat. Post Malone)". A direct id match sidesteps that
 * heuristic entirely. If no video carries the id, falls through to the
 * heuristics below (a track can have a verified audio id with no matching
 * video record at all).
 *
 * `relatedSongs` (the seed's curated song pointer) is trusted to bridge a
 * video whose own title reads differently from the track (e.g. "All Too
 * Well: The Short Film" → "All Too Well (10 Minute Version)") — but ONLY
 * when it doesn't silently drop a recording qualifier the video's own title
 * carries. Midnights' "Karma (feat. Ice Spice)" pointed `relatedSongs` at
 * plain "Karma": true in the "this video relates to that song" sense the
 * seed intended, but a featured-artist recording is a DIFFERENT recording
 * from the album track, exactly like "(Taylor's Version)" is — and this
 * function's own invariant is recording separation (see
 * `normalizeTrackVideoTitle`'s doc comment above). The echo check runs
 * per-entry, never against a joined blob of every `relatedSongs` string
 * (re-review finding C, 2026-08-13): a joined blob let an UNRELATED entry's
 * "(feat. ...)" qualifier authorize a different, plain song's bridge — e.g.
 * `relatedSongs: ['Karma', 'Other Song (feat. Ice Spice)']` wrongly
 * authorized the Karma bridge via the second entry. Only the SAME entry that
 * matches this track's title may supply the echo. A video whose title's own
 * qualifier isn't echoed by that entry is refused via the pointer; it can
 * still match by an exact title equality, same as every other video. **A
 * wrong pairing is worse than no video at all**, so this fails closed to no
 * match rather than guessing (finding #4, review 2026-08-13).
 *
 * On more than one match — e.g. separate music-video and lyric-video
 * records for the same song — prefers `music_video`, then `lyric_video`,
 * then the first match in the input's own order. This is the ONLY
 * song-to-video matcher in the app (finding #2, adversarial review
 * 2026-08-13, removed the disagreeing legacy `videoForTrack` from
 * videos.ts) — every caller, TrackGuide and TrackDetail alike, uses this.
 */
export function trackVideoFor(
  trackTitle: string,
  videos: readonly VideoNote[],
  trackYoutubeId?: string | null,
): VideoNote | null {
  if (trackYoutubeId) {
    const authored = videos.find((v) => v.youtubeId === trackYoutubeId);
    if (authored) return authored;
  }
  const target = normalizeTrackVideoTitle(trackTitle);
  if (!target) return null;
  const matches = videos.filter((v) => {
    if (normalizeTrackVideoTitle(v.title) === target) return true;
    const qualifiers = recordingQualifiers(v.title);
    if (qualifiers.length === 0) {
      return v.relatedSongs.some((song) => normalizeTrackVideoTitle(song) === target);
    }
    return v.relatedSongs.some((song) => {
      if (normalizeTrackVideoTitle(song) !== target) return false;
      const lowered = song.toLowerCase();
      return qualifiers.every((q) => lowered.includes(q));
    });
  });
  if (matches.length === 0) return null;
  return (
    matches.find((v) => v.kind === 'music_video') ??
    matches.find((v) => v.kind === 'lyric_video') ??
    matches[0]
  );
}

/**
 * The video a track's own page actually plays (issue #771): the official
 * music/lyric video when `trackVideoFor` finds one, else the track's own
 * verified audio/lyric `youtubeId` — never nothing, when either exists.
 *
 * Without the fallback, a track page could only ever play the ~49 songs with
 * a matched music video, while the remaining tracks each carry their own
 * verified, playable id that reached the generated vault and rendered
 * nowhere (found 2026-07-20 while browser-verifying playback). Extracted out
 * of `TrackDetail` so this resolution — the actual behavior issue #771
 * complains a track page is missing — is unit-testable, matching the same
 * boundary `video-affordance.ts` draws for `MomentDetail` (vitest runs
 * component-free, so a rule left inside a component is untestable by
 * construction).
 */
export function resolvedTrackVideo(
  track: { title: string; youtubeId?: string | null },
  videos: readonly VideoNote[],
): MomentVideo | null {
  const matched = trackVideoFor(track.title, videos, track.youtubeId);
  if (matched?.youtubeId) return { youtubeId: matched.youtubeId, title: matched.title };
  if (track.youtubeId) return { youtubeId: track.youtubeId, title: track.title };
  return null;
}
