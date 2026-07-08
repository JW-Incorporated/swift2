/**
 * Long Live — content model.
 *
 * Everything the experience renders comes from these shapes. They are
 * intentionally API-shaped (plain serializable objects, stable string ids) so a
 * real backend can drop in later without touching UI code.
 */

export type EraId =
  | 'debut'
  | 'fearless'
  | 'speak-now'
  | 'red'
  | '1989'
  | 'reputation'
  | 'lover'
  | 'folklore'
  | 'evermore'
  | 'midnights'
  | 'ttpd'
  | 'tloas';

export type ContentTag = 'Music' | 'Fashion' | 'Tour' | 'Relationship' | 'Lore';

export type MilestoneKind = 'album' | 'tour' | 'life' | 'business' | 'award';

/** Font personality applied to era headings. */
export type EraFont = 'serif' | 'sans' | 'mono' | 'script';

export interface EraTheme {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  inkSoft: string;
  line: string;
  accent: string;
  accent2: string;
  glow: string;
  font: EraFont;
}

export interface HiddenClue {
  /** The subtly-planted clue. */
  clue: string;
  /** The payoff it pointed to. */
  payoff: string;
}

export interface ContentItem {
  id: string;
  eraId: EraId;
  /** ISO date (YYYY-MM-DD) — drives chronological ordering + timeline position. */
  date: string;
  /** Human display date, e.g. "August 2024". */
  dateLabel: string;
  title: string;
  summary: string;
  /** Longer editorial body shown in the immersive detail view. */
  body: string[];
  tags: ContentTag[];
  image: string;
  /** Optional hidden clue — renders the glint treatment when present. */
  hiddenClue?: HiddenClue;
}

export interface Milestone {
  id: string;
  eraId: EraId;
  date: string;
  label: string;
  kind: MilestoneKind;
}

export interface Era {
  id: EraId;
  /** Display name, e.g. "The Tortured Poets Department". */
  name: string;
  /** Short name for chips, e.g. "TTPD". */
  shortName: string;
  album: string;
  /** Inclusive era span, ISO dates. */
  start: string;
  end: string;
  yearLabel: string;
  /** One-line mood descriptor. */
  tagline: string;
  /** A couple sentences of era framing. */
  intro: string;
  /**
   * A signature lyric from the era's standout song, shown under the era name in
   * the hero. Optional — falls back to `intro` when absent.
   */
  lyric?: { line: string; song: string };
  image: string;
  theme: EraTheme;
  isCurrent?: boolean;
}

// ── Lens Mode datasets ──────────────────────────────────────────────────────

export interface Relationship {
  id: string;
  name: string;
  start: string;
  /** null = ongoing / open-ended. */
  end: string | null;
  eraIds: EraId[];
  songs: string[];
  note: string;
}

export interface RunwayLook {
  id: string;
  eraId: EraId;
  name: string;
  description: string;
  image: string;
  shopTags: string[];
}

export interface ReRecord {
  id: string;
  album: string;
  originalYear: number;
  reclaimedYear: number | null;
  vaultTracks: number;
  note: string;
}

export interface EggNode {
  id: string;
  label: string;
  eraId: EraId;
  year: number;
  kind: 'clue' | 'payoff';
  detail: string;
  /** x/y in a 0–100 normalized layout space for the constellation. */
  x: number;
  y: number;
}

export interface EggLink {
  from: string;
  to: string;
  label: string;
}

export type LensId =
  | 'love-story'
  | 'fashion'
  | 'taylors-version'
  | 'easter-eggs'
  | 'the-proposal';

/**
 * A single dated, sourced moment on a narrative story thread (e.g. the
 * engagement timeline). Unlike the other lens datasets, story beats carry a
 * real-world citation so fans can trust the facts.
 */
export interface StoryBeat {
  id: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Human display date, e.g. "August 26, 2025". */
  dateLabel: string;
  eraId: EraId;
  title: string;
  body: string;
  /** Publication the fact is attributed to, e.g. "AP News". */
  source?: string;
  /** Optional pull-quote (a caption, lyric, or public statement). */
  quote?: string;
}
