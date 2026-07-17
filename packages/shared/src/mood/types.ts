// Mood→Song bot domain types. Portable, zero I/O, deliberately OFF every
// runtime path today: exposed only via the `@swift2/shared/mood` subpath (not
// the root barrel), and nothing imports it yet. Groundwork for the post-v1
// Mood→Song bot (see docs/proposals/2026-07-07-chatbots-architecture.md) —
// the bot's core is a deterministic mood↔song matcher, not an LLM.

/**
 * One mood in the authored taxonomy. The taxonomy itself is CONTENT-track
 * editorial data (Joey's) — this type is just the contract the ENGINE-side
 * matcher consumes.
 */
export interface Mood {
  /** Stable identifier, kebab-case, e.g. "heartbreak-2am". */
  slug: string;
  /** Display label, e.g. "Crying at 2am". */
  label: string;
  /**
   * The starter-prompt phrasing shown as a tappable chip, first person,
   * e.g. "I'm crying at 2am and want to feel understood".
   */
  prompt: string;
  /**
   * Free-text lexicon: lowercase words/phrases that map a user's typed
   * feeling to this mood. Must already be in normalized form
   * (see {@link normalizeMoodText} in match.ts) — validated, not re-normalized
   * at match time.
   */
  keywords: readonly string[];
}

export interface MoodTaxonomy {
  /** Bumped whenever the authored taxonomy changes shape or meaning. */
  version: number;
  moods: readonly Mood[];
}

/**
 * One editorial link between a song (identified the same way `TrackNote` is:
 * era slug + track title) and a mood. Authored as CONTENT-track data alongside
 * the track guide; consumed here as plain rows.
 */
export interface SongMoodTag {
  eraSlug: string;
  trackTitle: string;
  moodSlug: string;
  /** 1 = fits, 2 = strong fit, 3 = a defining song for this mood. */
  weight: 1 | 2 | 3;
}

/** A mood the matcher believes the user's input expresses, with evidence. */
export interface MoodMatch {
  moodSlug: string;
  /** Relative strength — comparable within one match result set only. */
  score: number;
  /** Which lexicon entries fired, for "because you said …" explainability. */
  matchedKeywords: readonly string[];
}

/** One ranked song result, with the moods that drove it (for "why this"). */
export interface RankedSong {
  eraSlug: string;
  trackTitle: string;
  score: number;
  /** Moods that contributed, strongest first. */
  moodSlugs: readonly string[];
}
