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

/**
 * How much weight a claim carries. Mirrors THEORY_CONFIDENCE in
 * packages/shared/src/vault-types.ts (the source of truth) — same 8 values,
 * kept in sync, not a new enum. Optional on ContentItem: a fact (the default
 * for sourced moments) renders no pill; only a claim *below* confirmed
 * ('official' / 'confirmed_interview') does.
 */
export type Confidence =
  | 'official'
  | 'confirmed_interview'
  | 'reputable_reporting'
  | 'strong_fan_consensus'
  | 'plausible'
  | 'clowning'
  | 'disproven'
  | 'joke_meme';

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

/**
 * One image attached to a moment. `kind` lets the UI label non-primary imagery
 * honestly: `reference` = a comparable/historical stand-in (the real photo
 * doesn't exist yet), `archival` = older context photo, `primary` = the actual
 * subject. Synced from the Tier-1 `moment.photos[]` seed/DB field.
 */
export interface ImageRef {
  url: string;
  credit?: string;
  caption?: string;
  kind: 'primary' | 'reference' | 'archival';
}

export interface ContentItem {
  id: string;
  /** Stable content slug from the seed (deep-linking / cross-refs). Optional. */
  slug?: string;
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
  /**
   * Full per-moment gallery (hero + additional photos), synced from the Tier-1
   * `moment.photos[]`. `image` above stays the single hero/card thumbnail for
   * back-compat; `images` is the detail-view gallery. Absent when the moment
   * has no real photos (the card then uses era-fallback art).
   */
  images?: ImageRef[];
  /**
   * Citations backing this moment. Reuses the EggSource shape. Rendered as a
   * "Sources" list in the detail view — only when non-empty (never a
   * placeholder).
   */
  sources?: EggSource[];
  /**
   * How well-supported the claim is. Absent = a confirmed fact (no pill).
   * Present + below confirmed-tier = a confidence pill in the detail view.
   */
  confidence?: Confidence;
  /** Optional hidden clue — renders the glint treatment when present. */
  hiddenClue?: HiddenClue;
  /** Optional official music video, embedded via YouTube in the detail view. */
  video?: MomentVideo;
}

/** An official music video embedded (never re-hosted) from YouTube. */
export interface MomentVideo {
  /** YouTube video ID — verified against YouTube's oEmbed endpoint. */
  youtubeId: string;
  /** Video title as it resolves on YouTube, used for the caption + a11y label. */
  title: string;
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
  /**
   * Official streaming media for the era, played via legal first-party embeds
   * (never self-hosted). Optional so an era can exist before media is attached.
   */
  media?: EraMedia;
}

/**
 * One song in an era's album track guide (tracks.generated.ts, surfaced by the
 * TrackGuide overlay). Mirrors the DB `track_note` row / `TrackNote` in
 * packages/shared/src/vault-types.ts, reduced to what the UI renders. The
 * `note` is a short SOURCED line — meaning / background / Easter egg — never
 * fabricated; a song with no real source simply has no row.
 */
export interface TrackNote {
  /** 1-based position on the album, or null when unknown (sorted last). */
  trackNumber: number | null;
  title: string;
  /** The sourced one-liner shown under the title. */
  note: string;
  /**
   * Citations backing the note. Reuses the EggSource shape; rendered as a
   * source link list only when non-empty (never an empty placeholder).
   */
  sources?: EggSource[];
}

/** Legal, embeddable streaming media attached to an era. */
export interface EraMedia {
  /** Spotify album ID for the official embed player (open.spotify.com/album/…). */
  spotifyAlbumId: string;
  /** Album title as it resolves on Spotify — verified, shown as the caption. */
  albumTitle: string;
  /** Optional YouTube video ID for a signature music video. */
  youtubeId?: string;
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

export interface EggSource {
  name: string;
  url: string;
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
  /** True when Taylor/her team confirmed intent; false for fan theory. */
  confirmed?: boolean;
  /** Citations backing the claim. */
  sources?: EggSource[];
}

export interface EggLink {
  from: string;
  to: string;
  label: string;
}

/**
 * A named family of related Easter eggs — a guided "trail" through the Clue Web.
 * Every EggNode belongs to exactly one motif (see MOTIF_MEMBERSHIP in lenses).
 */
export type MotifId =
  | 'number-13'
  | 'hidden-messages'
  | 'the-snake'
  | 'color-coding'
  | 'clocks-countdowns'
  | 'doors-rooms'
  | 'the-rerecordings';

export interface Motif {
  id: MotifId;
  label: string;
  /** One-line through-line for the motif. */
  blurb: string;
  /** lucide-react icon name, resolved to a component in the UI. */
  icon: string;
}

export type LensId =
  | 'love-story'
  | 'fashion'
  | 'taylors-version'
  | 'easter-eggs'
  | 'hidden-clues'
  | 'the-proposal';

/** One end (plant or payoff) of a hidden-clue pair. */
export interface CluePoint {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  /** Human display date, e.g. "March 2018". */
  dateLabel: string;
  eraId: EraId;
  /** What happened at this point. */
  what: string;
}

/**
 * A hidden clue Taylor planted at one point that paid off later. Rendered as an
 * interactive "decode" — revealing the payoff draws a thread across the gap.
 */
export interface CluePair {
  id: string;
  title: string;
  plant: CluePoint;
  payoff: CluePoint;
  /** One-sentence through-line connecting plant → payoff. */
  connection: string;
  /** True when Taylor/her team confirmed intent; false for fan theory. */
  confirmed: boolean;
  sources: EggSource[];
}

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
