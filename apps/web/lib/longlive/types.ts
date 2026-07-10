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

/**
 * Where a theory's claim landed. Mirrors THEORY_OUTCOMES in
 * packages/shared/src/vault-types.ts (the source of truth) — same 6 values,
 * kept in sync, not a new enum. Required alongside `confidence` on every
 * TheoryNote so speculation never renders as fact.
 */
export type TheoryOutcome =
  | 'confirmed'
  | 'partially_confirmed'
  | 'pending'
  | 'debunked'
  | 'abandoned'
  | 'unfalsifiable';

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

/**
 * A namespaced cross-content reference: `<type>:<id>`. This is how one piece
 * of content points at another *kind* of content (the audit's §F cross-linking
 * gap). Conventions the content lane should use when populating `relatedIds`:
 *
 *   - `motif:<MotifId>`         — a Clue Web motif trail, e.g. `motif:the-snake`
 *   - `egg:<EggNode.id>`        — one Clue Web node,      e.g. `egg:egg-snake-instagram`
 *   - `moment:<ContentItem.id>` — an era moment,          e.g. `moment:rep-album`
 *   - `rel:<Relationship.id>`   — a love-story entry,     e.g. `rel:rel-5`
 *
 * Resolution is best-effort by design: the UI ignores ids it cannot resolve
 * (see lib/longlive/related.ts) and never renders a dead link, so the content
 * lane can populate these incrementally without breaking anything.
 */
export type RelatedId = string;

export interface HiddenClue {
  /** The subtly-planted clue. */
  clue: string;
  /** The payoff it pointed to. */
  payoff: string;
}

/**
 * What an image in a moment's gallery actually IS. Anything below 'primary'
 * renders with an explicit label in the UI so a stand-in is never mistaken
 * for the real photo:
 *
 *   - 'primary'   — the real photo of THIS moment.
 *   - 'reference' — a related stand-in; the real photo hasn't surfaced yet.
 *   - 'archival'  — supporting archival material (covers, stills, documents).
 */
export type ImageKind = 'primary' | 'reference' | 'archival';

/** One image in a moment's gallery. Always hotlinked — never rehosted. */
export interface ImageRef {
  url: string;
  /** Credit line (attribution, not a license). */
  credit?: string;
  caption?: string;
  kind: ImageKind;
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
  /**
   * Image gallery — never empty after normalization (`build()` in
   * lib/longlive/content.ts). The hero is the first 'primary' entry (else
   * images[0]). A legacy single-image item normalizes to one 'primary' whose
   * url may be the era-art stand-in (`/eras/<eraId>.png`) when no real photo
   * exists — see isEraArtFallback / hasRealPrimaryImage below.
   */
  images: ImageRef[];
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
  /**
   * Cross-type links (see RelatedId for the id convention). A moment whose
   * relatedIds resolve to a Clue Web trail gets a "follow this thread"
   * affordance in the detail view.
   */
  relatedIds?: RelatedId[];
  /**
   * Threads (see LensId) this item belongs to. Two ways this gets set, both
   * in `build()` (lib/longlive/content.ts) so every item — hand-curated or
   * synced from `supabase/seed/content/**` — goes through the same logic:
   *   1. Default-by-tag (`defaultThreadIdsForTags`): 'Relationship' tags
   *      imply 'love-story', 'Fashion' tags imply 'fashion' — no authoring
   *      action needed, so existing and future content flows into those two
   *      threads automatically.
   *   2. Explicit opt-in: an item can set this directly (on the seed row, as
   *      `threadIds`) for threads with no tag-based default — 'taylors-version',
   *      'easter-eggs', 'hidden-clues', 'the-proposal' — or to add a thread
   *      beyond its tag default.
   * See docs/decisions.md 2026-07-10 for why this replaced hand-authored
   * per-thread arrays in lenses.ts. Query via `contentForThread()` in
   * lib/longlive/threads.ts, not by filtering CONTENT directly.
   */
  threadIds?: LensId[];
}

/**
 * The image a single-image surface (hero, share card, …) should show for a
 * moment: the first 'primary' entry, else the first image at all.
 */
export function primaryImageRef(item: ContentItem): ImageRef | undefined {
  return item.images.find((i) => i.kind === 'primary') ?? item.images[0];
}

/** Convenience url form of primaryImageRef, with the app-wide placeholder. */
export function primaryImage(item: ContentItem): string {
  return primaryImageRef(item)?.url ?? '/placeholder.svg';
}

/**
 * True when `url` is the era-art stand-in that `build()` (content.ts)
 * substitutes for a moment with no real photo (`/eras/<eraId>.png`). Era art
 * is the ONLY thing served from /eras/, so the prefix is the discriminator.
 */
export function isEraArtFallback(url: string): boolean {
  return url.startsWith('/eras/');
}

/**
 * True when the moment has a REAL primary photo — a 'primary' gallery entry
 * that is not the era-art fallback. This is the predicate depth/coverage
 * gates should use now that the single `image` field is gone: every item has
 * a non-empty `images`, so "has images" alone proves nothing.
 */
export function hasRealPrimaryImage(item: ContentItem): boolean {
  return item.images.some((i) => i.kind === 'primary' && !isEraArtFallback(i.url));
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
 * TrackGuide overlay + a per-song TrackDetail page). Mirrors the DB
 * `track_note` row / `TrackNote` in packages/shared/src/vault-types.ts,
 * reduced to what the UI renders. The `note` is a short SOURCED line —
 * meaning / background / Easter egg — never fabricated; a song with no real
 * source simply has no row.
 */
export interface TrackNote {
  /** 1-based position on the album, or null when unknown (sorted last). */
  trackNumber: number | null;
  title: string;
  /** The sourced one-liner shown under the title in the Track Guide list. */
  note: string;
  /**
   * Citations backing the note. Reuses the EggSource shape; rendered as a
   * source link list only when non-empty (never an empty placeholder).
   */
  sources?: EggSource[];
  /**
   * The per-song deep-dive: real, researched paragraphs (why she wrote it,
   * what it's about, its place in the album/era) — the actual "article"
   * shown on the song's TrackDetail page. Optional: most songs start with
   * just `note` until a research pass writes the full piece. Never
   * fabricated — same standard as `body` on ContentItem.
   */
  discussion?: string[];
  /**
   * A FEW short illustrative lines quoted from the song (not full lyrics —
   * see docs/decisions.md 2026-07-09, which supersedes an earlier "reproduce
   * full lyrics" decision after further discussion). Used to ground the
   * `discussion` in the actual words, the way music journalism quotes a
   * couplet — never the complete song.
   */
  quotedLines?: string[];
  /**
   * Citations for `discussion`/`quotedLines` specifically (independent of
   * `sources`, which backs the shorter `note`) — interviews, official
   * statements, or reputable music journalism the analysis is grounded in.
   */
  discussionSources?: EggSource[];
}

/**
 * One easter egg or fan theory in an era's theory guide
 * (theories.generated.ts, surfaced by the TheoryGuide overlay). Mirrors the DB
 * `theory` row / `Theory` in packages/shared/src/vault-types.ts, reduced to
 * what the UI renders. `confidence` + `outcome` are REQUIRED — they render as
 * badges so speculation never reads as fact; the generator drops any record
 * missing either (or missing a real source).
 */
export interface TheoryNote {
  /** Stable kebab slug from the seed, unique per era. */
  slug: string;
  /** Planted-and-decoded easter egg vs. speculative fan theory. */
  kind: 'easter_egg' | 'theory';
  title: string;
  /** What fans believe, in OUR words — a hook, not an essay. */
  claim: string;
  /** The documented evidence trail, in our words, or null. */
  evidence: string | null;
  confidence: Confidence;
  outcome: TheoryOutcome;
  /** Citations backing the record. Reuses the EggSource shape; never empty. */
  sources: EggSource[];
  /**
   * Cross-links to other theories, pre-resolved at generation time to
   * `${EraId}:${slug}` pairs (unlike ContentItem.relatedIds' typed
   * namespace convention, these always point to another theory). The UI
   * additionally re-resolves each against the live per-era theory lists and
   * drops anything unresolvable, so a stale link can never render.
   */
  relatedSlugs?: string[];
}

/** What kind of visual-media work a VideoNote records. Mirrors VIDEO_KINDS in
 * packages/shared/src/vault-types.ts. */
export type VideoNoteKind =
  | 'music_video'
  | 'lyric_video'
  | 'short_film'
  | 'tour_film'
  | 'documentary'
  | 'performance';

/**
 * One official video/visual-media work in an era's videos rail
 * (videos.generated.ts, surfaced by EraVideos). Mirrors the DB `video_work`
 * row / `VideoWork` in packages/shared/src/vault-types.ts, reduced to what the
 * UI renders. When `youtubeId` is present the work embeds via the MomentVideo
 * click-to-play facade (official uploads only — never re-hosted); when null it
 * renders as a metadata card (e.g. a theatrical tour film).
 */
export interface VideoNote {
  /** Stable kebab slug from the seed, unique per era. */
  slug: string;
  kind: VideoNoteKind | null;
  title: string;
  director: string | null;
  /** ISO date (YYYY-MM-DD) the work premiered, or null if unknown. */
  releasedOn: string | null;
  /** Song titles this video belongs to (display names, not slugs). */
  relatedSongs: string[];
  /** One-line sourced summary — a hook, not a shot list. Or null. */
  summary: string | null;
  /** Documented Easter eggs, one short line each. */
  easterEggs: string[];
  /** Documented visual/narrative symbolism — a sourced sentence, or null. */
  symbolism: string | null;
  /** YouTube ID of the official upload (extracted from the seed's verified
   * officialUrl/oEmbed media), or null when there is no official embed. */
  youtubeId: string | null;
  /** Citations backing the record. Reuses the EggSource shape; never empty. */
  sources: EggSource[];
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
  /** Cross-type links (see RelatedId for the id convention). */
  relatedIds?: RelatedId[];
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
  /**
   * Cross-type links (see RelatedId for the id convention). Note egg-to-egg
   * connections stay in EggLink; relatedIds is for links *out* of the Clue
   * Web (moments, relationships, …).
   */
  relatedIds?: RelatedId[];
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
 * One entry in the app's glossary — the experience's own vocabulary ("thread",
 * "crossing", "motif trail", "vault track", …), defined in plain language so
 * nothing in the UI is assumed knowledge. Authored by hand in
 * lib/longlive/glossary.ts (UI/navigation vocabulary, not sourced lore).
 */
export interface GlossaryEntry {
  /** Stable kebab id — used for see-also links, search targets, anchors. */
  id: string;
  /** The word as it appears in the UI, e.g. "Crossing". */
  term: string;
  /** One short plain-language definition. */
  definition: string;
  /** Optional concrete example usage. */
  example?: string;
  /** Ids of other glossary entries worth reading next. */
  seeAlso?: string[];
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
