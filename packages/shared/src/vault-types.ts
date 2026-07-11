// Vault (time-machine) domain types. Portable, zero I/O — shared by web now and
// Expo later. Shapes are adapted from the sibling Orbit project's era/outfit/
// album model so its authored content ports over cleanly.

/**
 * Per-era visual identity. Stepping into an era re-skins the whole surface to
 * this palette. Ported from Orbit's `EraTheme`.
 */
export interface EraTheme {
  /** Page background. */
  bg: string;
  /** Card / panel surface. */
  surface: string;
  ink: string;
  inkSoft: string;
  line: string;
  /** Accent for highlights, hovers, markers. */
  accent: string;
  /** Hero band gradient — pure mood, never copyrighted art. */
  heroGradient: string;
  /** Small uppercase label over the hero title. */
  eyebrow: string;
}

/** An era of Taylor's public life, ordered along the timeline. */
export interface Era {
  slug: string;
  /** Era display name, e.g. "The Midnights era". */
  title: string;
  /** Album title the era centers on. */
  album: string;
  /** ISO date (YYYY-MM-DD) — era window start. */
  startDate: string;
  /** ISO date (YYYY-MM-DD) — era window end. */
  endDate: string;
  /** Timeline order, ascending. */
  order: number;
  theme: EraTheme;
  /** Hotlinked cover image URL, or null. Never rehosted. */
  coverImageUrl: string | null;
}

export const MILESTONE_TYPES = ['album_release', 'tour'] as const;
export type MilestoneType = (typeof MILESTONE_TYPES)[number];

/** A wavetop event rendered as a marker in the expanded timeline (not a snap target in v1). */
export interface Milestone {
  id: string;
  eraSlug: string;
  type: MilestoneType;
  title: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
}

/**
 * Categories a month's dated items fall into (v1 spec + the `video` value
 * added by the 2026-07-08 content audit §4a for music videos / lyric videos /
 * short films as first-class items).
 */
export const VAULT_CATEGORIES = [
  'sighting',
  'fashion',
  'relationship',
  'tour',
  'business',
  'music',
  'release',
  'video',
] as const;
export type VaultCategory = (typeof VAULT_CATEGORIES)[number];

export function isVaultCategory(value: string): value is VaultCategory {
  return (VAULT_CATEGORIES as readonly string[]).includes(value);
}

/**
 * One line in the always-resident month index (Tier 0): enough to render a
 * timeline marker + preview card. Titles/snippets/links/metadata only — no
 * article bodies, images are hotlinked URLs.
 */
export interface MonthItem {
  id: string;
  eraSlug: string;
  /** Full year, e.g. 2022. */
  year: number;
  /** 1–12. */
  month: number;
  category: VaultCategory;
  title: string;
  /** Short preview snippet — not an article body. */
  snippet: string;
  /** Hotlink to the source, or null. */
  sourceUrl: string | null;
  /** Hotlinked thumbnail URL, or null. Never rehosted. */
  thumbnailUrl: string | null;
  // -- additive optional fields (audit §4a) — absent on pre-audit records --
  /** Stable kebab id, unique per era; enables deep links + cross-refs. */
  slug?: string;
  /** Full provenance objects — supersede the bare `{outlet,url}` pair. */
  sources?: SourceRef[];
  /** Rights-aware media — supersedes bare thumbnailUrl/photos. */
  media?: MediaRef[];
  /** Free-form retrieval hooks, e.g. ['grammys', 'red-carpet']. */
  tags?: string[];
}

export interface MomentSource {
  outlet: string;
  url: string;
}

// ---------------------------------------------------------------------------
// Provenance + media rights (2026-07-08 content audit §5 — all ADDITIVE).
// Existing bare `{outlet,url}` sources and hotlinked photo/thumbnail strings
// stay valid; readers treat the missing new fields as unknown.
// ---------------------------------------------------------------------------

/** What kind of publisher a citation comes from (audit §5). */
export const SOURCE_TYPES = [
  'official',
  'interview',
  'reputable_press',
  'chart_database',
  'awards_database',
  'fashion_database',
  'fan_forum',
  'wiki',
  'social',
  'video',
  'image_source',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export function isSourceType(value: string): value is SourceType {
  return (SOURCE_TYPES as readonly string[]).includes(value);
}

/**
 * Full provenance for one citation — supersedes the bare `{outlet,url}`
 * `MomentSource` (which remains valid on existing records). `excerpt` is the
 * ONLY place verbatim source text may appear and is hard-capped at 300 chars
 * by the content validator (never lyrics, never article bodies).
 *
 * `reliability_score` rubric (audit §5): 5 official/primary · 4 reputable
 * press · 3 trade databases / verified interviews · 2 wikis + moderated fan
 * forums · 1 unverified social. `fan_forum|wiki|social` alone never satisfy
 * sourcing for a factual claim (fine as a theory's *subject* or a supplement).
 */
export interface SourceRef {
  source_url: string;
  source_title?: string | null;
  /** Supersedes `outlet`, same meaning. */
  publisher?: string | null;
  source_type?: SourceType | null;
  /** ISO date (YYYY-MM-DD) the source was last checked. */
  accessed_at?: string | null;
  /** 1–5, rubric in the doc comment above. */
  reliability_score?: 1 | 2 | 3 | 4 | 5 | null;
  /** OPTIONAL verbatim quote — HARD CAP 300 chars (validator-enforced). */
  excerpt?: string | null;
  notes?: string | null;
}

/** How a media reference reaches the page (2026-07-08 media policy). */
export const MEDIA_KINDS = ['oembed', 'owned', 'hotlink_legacy'] as const;
export type MediaKind = (typeof MEDIA_KINDS)[number];

/** Machine-readable rights status carried by every media reference. */
export const MEDIA_RIGHTS = ['platform_tos', 'licensed', 'hotlink_legacy'] as const;
export type MediaRights = (typeof MEDIA_RIGHTS)[number];

/**
 * Rights-aware media object — supersedes bare `thumbnailUrl` strings and
 * `photos[{url,credit}]` (both stay readable as `rights: 'hotlink_legacy'`).
 * Policy (decisions 2026-07-08): embed social via official oEmbed (`oembed`,
 * treated as ephemeral) · licensed editorial imagery is the only stored media
 * (`owned` + `license_ref`) · rehosting arbitrary found photos stays banned
 * (there is deliberately no shape for it).
 */
export interface MediaRef {
  kind: MediaKind;
  rights: MediaRights;
  /** oEmbed: provider name (instagram | x | youtube | tiktok | …). */
  provider?: string | null;
  /** oEmbed: canonical post/video URL — render via the provider embed. */
  post_url?: string | null;
  /** oEmbed: ISO date the embed metadata was last fetched. */
  oembed_fetched_at?: string | null;
  /** owned: path of the licensed asset we host (the ONLY rehosting allowed). */
  asset_path?: string | null;
  /** owned: license identifier, e.g. 'getty-editorial'. */
  license?: string | null;
  /** owned: license reference/receipt id. */
  license_ref?: string | null;
  /** hotlink_legacy: the pre-policy hotlinked URL, grandfathered. */
  url?: string | null;
  /** Page the media was sourced from (credit trail, not a license). */
  source_url?: string | null;
  /** Credit line. Attribution != license; always kept. */
  attribution?: string | null;
}

export interface MomentPhoto {
  /** Hotlinked photo URL — never rehosted. */
  url: string;
  credit: string | null;
}

/**
 * The on-demand detail (Tier 1) behind a single month item: extended context
 * plus linked sources and hotlinked photos.
 */
export interface Moment {
  monthItemId: string;
  /** Extended editorial context — still metadata, never a rehosted article body. */
  context: string;
  sources: MomentSource[];
  photos: MomentPhoto[];
}

/**
 * One song's note in an album track guide. Non-month-scoped: reached from the
 * album/era and loaded on demand, so full song-catalog coverage stays off the
 * Tier 0 timeline payload (and the wavetop-month item count). Same sourced,
 * hook-length discipline as `MonthItem.snippet` — a line, not an essay.
 */
export interface TrackNote {
  id: string;
  eraSlug: string;
  trackTitle: string;
  /** Optional track number, for display order. */
  trackNumber: number | null;
  note: string;
  sourceUrl: string | null;
  sources: MomentSource[];
  // -- additive optional fields (audit §4a) --
  /** Stable kebab id, unique per era. */
  slug?: string;
  /** Public-record writing credits. */
  writers?: string[];
  /** True for "From the Vault" tracks on a Taylor's Version. */
  isFromTheVault?: boolean;
  /** ISO date the track was released as a single, or null if never. */
  singleReleaseDate?: string | null;
  // -- additive optional fields (issue #440 Track Guide overhaul, Phase 0) --
  /** Public-record production credits. */
  producers?: string[];
  /** Album/single title the track was released on, e.g. "Midnights". */
  release?: string;
  /** ISO date the track's parent release came out, or null if unknown. */
  releaseDate?: string | null;
  /** Documented lyrical/thematic tags, e.g. "self-loathing", "adult heartbreak". */
  themes?: string[];
}

export interface YearMonth {
  year: number;
  month: number;
}

// ---------------------------------------------------------------------------
// Non-month-scoped shapes (2026-07-08 content audit §4b). Same discipline as
// `TrackNote`: reached from the era/album, loaded on demand, OFF the Tier 0
// timeline payload. Short sourced notes, links only, no fabrication.
// ---------------------------------------------------------------------------

/** What kind of release a `Release` row records. */
export const RELEASE_KINDS = ['album', 'rerecording', 'ep', 'deluxe', 'single', 'live'] as const;
export type ReleaseKind = (typeof RELEASE_KINDS)[number];

/** One album/EP/notable release — the canonical discography record. */
export interface Release {
  id: string;
  slug: string;
  eraSlug: string;
  kind: ReleaseKind;
  title: string;
  /** ISO date (YYYY-MM-DD). */
  releaseDate: string;
  label: string | null;
  trackCount: number | null;
  /**
   * Slug of the release this one is a version of (deluxe → standard,
   * Taylor's Version → original), or null for a root release.
   */
  parentReleaseSlug: string | null;
  /** Track titles in order — facts, never lyrics. Optional for singles. */
  tracklist?: string[];
  /** Hook-voiced context, <=400 chars — same cap discipline as snippets. */
  note: string;
  sources: SourceRef[];
}

/** One leg of a tour. */
export interface TourLeg {
  name: string;
  /** ISO date (YYYY-MM-DD) — leg start. */
  from: string;
  /** ISO date (YYYY-MM-DD) — leg end. */
  to: string;
  showCount?: number | null;
}

/**
 * A single documented show worth first-class treatment (Eras Tour depth):
 * surprise songs, mashups, guests, notable outfit/setlist changes. Every
 * show-level claim carries its own confidence + sources so per-show fan
 * documentation never renders as unqualified fact.
 */
export interface TourShow {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  city: string;
  venue: string;
  /** Acoustic-set surprise songs played, in order. */
  surpriseSongs?: string[];
  /** Surprise-song mashups, e.g. 'Death by a Thousand Cuts x The Great War'. */
  mashups?: string[];
  /** On-stage guests, public record only. */
  guests?: string[];
  /** Notable outfit variant/debut, <=400 chars. */
  outfitNote?: string | null;
  /** Notable setlist change, <=400 chars. */
  setlistChange?: string | null;
  /** How well documented this show's details are. */
  confidence?: TheoryConfidence;
  sources?: SourceRef[];
}

/**
 * One row of a tour's full per-city date ledger — deliberately DISTINCT from
 * `TourShow`. `TourShow` is the curated "notable moment" model (hand-picked
 * highlights with per-claim confidence + sources); `TourDate` is the plain
 * factual ledger transcribed from the tour's Wikipedia "Tour dates" table:
 * every night, minimal fields, no editorializing.
 */
export interface TourDate {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  city: string;
  venue: string;
  country?: string;
  /** Rare factual qualifier only (e.g. 'cancelled') — never commentary. */
  note?: string;
}

/** One headline tour. Per-show depth (`shows`) only where documented. */
export interface Tour {
  id: string;
  slug: string;
  /** Era active when the tour opened. */
  eraSlug: string;
  title: string;
  /** ISO date (YYYY-MM-DD). */
  openedOn: string;
  /** ISO date (YYYY-MM-DD), or null while ongoing. */
  closedOn: string | null;
  legs: TourLeg[];
  showCount: number | null;
  /** How the acoustic surprise-song slot worked on this tour, or null. */
  surpriseSongsNote?: string | null;
  /** Notable documented shows — Eras-Tour-depth data lives here. */
  shows?: TourShow[];
  /**
   * Full per-city date ledger (every night), transcribed from the tour's
   * Wikipedia "Tour dates" table. Separate from `shows` on purpose: `shows`
   * is curated highlights, `dates` is the high-volume factual record.
   */
  dates?: TourDate[];
  /** Hook-voiced context, <=400 chars. */
  note: string;
  sources: SourceRef[];
}

/** Easter egg (planted + decoded) vs. fan theory (speculative reading). */
export const THEORY_KINDS = ['easter_egg', 'theory'] as const;
export type TheoryKind = (typeof THEORY_KINDS)[number];

/**
 * How much weight a claim carries — REQUIRED on every theory so speculation
 * never renders as fact (audit §5). Ordered strongest → weakest-ish:
 * `official` (Taylor/label said so) · `confirmed_interview` ·
 * `reputable_reporting` · `strong_fan_consensus` · `plausible` ·
 * `clowning` (fans joking-but-hoping) · `disproven` · `joke_meme`.
 */
export const THEORY_CONFIDENCE = [
  'official',
  'confirmed_interview',
  'reputable_reporting',
  'strong_fan_consensus',
  'plausible',
  'clowning',
  'disproven',
  'joke_meme',
] as const;
export type TheoryConfidence = (typeof THEORY_CONFIDENCE)[number];

/** Where the claim landed — REQUIRED alongside `confidence`. */
export const THEORY_OUTCOMES = [
  'confirmed',
  'partially_confirmed',
  'pending',
  'debunked',
  'abandoned',
  'unfalsifiable',
] as const;
export type TheoryOutcome = (typeof THEORY_OUTCOMES)[number];

/**
 * One easter egg or fan theory, clearly labeled. The 2026-07-04 rule carries
 * over verbatim: NO sexuality/family/identity/private-life speculation, ever.
 * `confidence` + `outcome` are required and render as badges.
 */
export interface Theory {
  id: string;
  slug: string;
  eraSlug: string;
  kind: TheoryKind;
  title: string;
  /** What fans believe, in OUR words, <=400 chars. */
  claim: string;
  /** The documented evidence trail, in our words, <=2000 chars. */
  evidence?: string | null;
  confidence: TheoryConfidence;
  outcome: TheoryOutcome;
  /** Cross-refs via stable slugs, e.g. 'midnights:karma'. */
  relatedSlugs: string[];
  /** fan_forum/social sources are allowed HERE (they're the subject). */
  sources: SourceRef[];
}

/** What kind of visual-media work a `VideoWork` row records. */
export const VIDEO_KINDS = [
  'music_video',
  'lyric_video',
  'short_film',
  'tour_film',
  'documentary',
  'performance',
] as const;
export type VideoKind = (typeof VIDEO_KINDS)[number];

/**
 * One official video/visual-media work (music video, short film, tour film,
 * documentary). Media references are rights-safe (`MediaRef`) — typically a
 * YouTube oEmbed of the official upload; nothing is rehosted.
 */
export interface VideoWork {
  id: string;
  slug: string;
  eraSlug: string;
  kind: VideoKind;
  title: string;
  director: string | null;
  /** ISO date (YYYY-MM-DD) the video premiered, or null if unknown. */
  releasedOn: string | null;
  /** Song titles this video belongs to (display names, not slugs). */
  relatedSongs: string[];
  /** One-line scene summary, <=400 chars — a hook, not a shot list. */
  summary: string;
  /** Documented symbolism, in our words, <=2000 chars. */
  symbolism?: string | null;
  /** Documented Easter eggs, one short line each. */
  easterEggs?: string[];
  /** Canonical official URL (e.g. the official YouTube upload), or null. */
  officialUrl: string | null;
  media?: MediaRef[];
  sources: SourceRef[];
}
