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
 * The confirmed tier of `Confidence`: at/above this a claim is established
 * fact and renders with no qualifier. Anything below renders LOUDLY as
 * reported/rumored (MomentDetail's banner) so a claim can never quietly read
 * as fact. The tuple below is the single definition — the runtime Set, the
 * `SubConfirmed` type, and the `isSubConfirmed` guard all derive from it, so
 * moving a value across the tier is one edit and the compiler flags every
 * lookup table that hasn't caught up. Mirrored (with a pointer comment, not
 * an import — plain-node script) by the content engine's hot-thin-topic
 * checker (scripts/content-engine/checkers/hot-thin-topic.mjs, which absorbed
 * the retired rumor-gap checker's role).
 */
const CONFIRMED_TIER_VALUES = ['official', 'confirmed_interview'] as const;
type ConfirmedTier = (typeof CONFIRMED_TIER_VALUES)[number];
export const CONFIRMED_TIER: ReadonlySet<Confidence> = new Set(CONFIRMED_TIER_VALUES);

/** The sub-confirmed slice of Confidence — the values that render loudly. */
export type SubConfirmed = Exclude<Confidence, ConfirmedTier>;

/** Type-narrowing form of `!CONFIRMED_TIER.has(c)` — lets lookup tables be
 * typed `Record<SubConfirmed, …>` with no cast at the use site. */
export function isSubConfirmed(c: Confidence): c is SubConfirmed {
  return !CONFIRMED_TIER.has(c);
}

/**
 * Where a reported rumor stands today. Unlike TheoryOutcome (fan-theory
 * lifecycle), this is the lifecycle of a PRESS claim: it starts
 * 'unconfirmed' and can resolve either way as facts land — the entry stays
 * in the record with an honest resolution badge instead of being deleted.
 */
/**
 * Where a reported claim stands.
 *
 * `faded` (added 2026-07-20) is the honest terminal state for a claim that was
 * reported, never confirmed, never denied, and has gone quiet. Without it every
 * unresolved rumor sits at `unconfirmed` forever, which reads as "still live" —
 * a lie of omission, and the way a rumor section rots into a conspiracy board.
 * See docs/content-ops/rumor-pipeline.md.
 */
export type RumorStatus =
  | 'unconfirmed'
  | 'partially_confirmed'
  | 'confirmed'
  | 'debunked'
  | 'faded';

/**
 * How much weight the reporting outlet carries. A Deuxmoi blind item and a
 * Reuters report are both "reported", and presenting them identically would
 * flatten the only distinction that matters to a reader deciding what to
 * believe.
 */
export type RumorSourceTier = 'official' | 'established' | 'tabloid' | 'social';

/**
 * How precisely a claim pins down a location, declared so the
 * provenance/specificity matrix in privacy-redlines.md is machine-checkable
 * rather than a vibe. Omit when the claim carries no location at all.
 * There is deliberately no `address` member — L3 is never publishable.
 */
export type LocationSpecificity = 'region' | 'city' | 'venue';

/** Provenance for a resolved claim — a promotion without a citation is an opinion. */
export interface RumorResolution {
  /** ISO date (YYYY-MM-DD) the claim resolved. */
  on: string;
  /** The report that settled it. Required for confirmed/debunked. */
  url: string;
  outlet: string;
  /** What settled it, in our words. */
  note?: string;
}

/**
 * One attributed, dated, reported-but-unconfirmed claim attached to a moment
 * (`ContentItem.rumors`) — the structural home for hot topics where solid
 * sourcing is thin (the MSG wedding is the canonical case). Renders in
 * MomentDetail's visually distinct "What's rumored" section, never woven
 * into the confirmed narrative. Every field that makes the rumor honest is
 * REQUIRED — the generator (scripts/sync-longlive-content.mjs) drops any
 * entry missing its claim, outlet, date, status, or link rather than
 * guessing, the same rule the theories generator applies.
 */
export interface RumorNote {
  /** The reported claim, in OUR words, framed as a report — never as fact. */
  claim: string;
  /** The outlet that reported it, e.g. "TMZ" — an unattributed rumor never ships. */
  reportedBy: string;
  /** ISO date (YYYY-MM-DD) the report was published. */
  reportedOn: string;
  /** Where the claim stands now — drives the badge. */
  status: RumorStatus;
  /** Link to the report. */
  url: string;
  /** Optional editorial context in our words (an estimate caveat, what debunked it). */
  note?: string;
  /**
   * ISO date a lifecycle pass last re-evaluated this claim. Without it we
   * cannot distinguish "checked yesterday, still unconfirmed" from "filed
   * three weeks ago and never looked at again" — and that distinction is the
   * whole basis for trusting a rumor section.
   */
  lastCheckedOn?: string;
  /** Required for `confirmed` / `debunked`; enforced by validate-content. */
  resolution?: RumorResolution;
  /** Weights how loudly we present the claim. */
  sourceTier?: RumorSourceTier;
  /**
   * Declared when the claim carries a location, so the matrix in
   * privacy-redlines.md can be enforced rather than assumed. Speculative
   * forward-looking claims are capped at 'region'.
   */
  locationSpecificity?: LocationSpecificity;
}

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
 *   - `song:<TrackNote.slug>`   — a track-guide song,     e.g. `song:the-fate-of-ophelia`
 *     (slugs are unique per era; keep them globally unique when authoring —
 *     resolution scans all eras and takes the first match, see
 *     lib/longlive/tracks.ts)
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
  /**
   * CSS object-position for the cover-crop, e.g. '50% 30%' — where the
   * subject/face actually sits in THIS photo, so a wide card crop keeps it in
   * frame instead of slicing it off. Set per-image by looking at the photo
   * (never a blanket bias); undefined falls back to the CSS default (center).
   */
  focalPoint?: string;
}

/** The object-position for an image's cover-crop; center when unset. */
export function focalPointOf(img: Pick<ImageRef, 'focalPoint'> | undefined): string {
  return img?.focalPoint ?? '50% 50%';
}

/**
 * One shoppable product worn in a (typically fashion-category) moment — the
 * exact garment/accessory, pointing at the retailer's own product detail page
 * (never a search page, never a fabricated URL; authoring rule: verify the
 * page resolves before adding it). Rendered as the "Shop the look" block in
 * MomentDetail. IMPORTANT: the UI must never link `url` directly — always via
 * buildShopUrl() (lib/longlive/shop.ts), the single seam where affiliate
 * wrapping will later be injected without touching any content.
 */
export interface Product {
  /** Who makes it, e.g. "Polo Ralph Lauren". */
  brand: string;
  /** The specific garment, as the retailer names it, e.g. "Striped Silk-Blend Day Dress". */
  item: string;
  /**
   * Retailer hostname, lowercase, no protocol — e.g. 'ralphlauren.com',
   * 'louisvuitton.com'. This is the affiliate-routing key: buildShopUrl()
   * will branch on it (LTK/RewardStyle vs Amazon Associates vs Skimlinks)
   * when affiliate goes live, so keep it a stable hostname, not a display name.
   */
  retailer: string;
  /** Direct product-detail-page URL (https). The raw destination — see buildShopUrl(). */
  url: string;
  /** Display price at time of authoring, e.g. "$319.99". Optional: omit when unknown. */
  price?: string;
  /**
   * false = verified sold out / unavailable (renders dimmed with a label).
   * Omitted or true = purchasable when authored.
   */
  inStock?: boolean;
  /**
   * true = this is NOT the exact piece worn — it's the closest verified
   * buyable match (same brand + silhouette where possible), offered because
   * the real piece is custom/couture/discontinued/otherwise unshoppable.
   * Renders a visible "Similar style" label — never presented as the literal
   * garment (2026-07-20, docs/decisions.md). Omitted/false = confirmed exact
   * item.
   */
  isAlternative?: boolean;
  /**
   * Required when isAlternative is true: a short (<=200 char) note on why
   * (e.g. "The exact custom Etro gown was a one-off runway piece — this is
   * Etro's closest current silhouette") and what's different. Never used to
   * soften a plain unverified guess.
   */
  altNote?: string;
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
   * How well-supported the claim is. Absent = a confirmed fact (no label).
   * Present + below CONFIRMED_TIER = an unmissable "Rumor — unconfirmed" /
   * "Reported — not confirmed" banner in the detail view, plus an
   * "Unconfirmed" chip on the era-feed card, plus a qualifier in share copy
   * — a sub-confirmed moment must never look like established fact on any
   * surface. The banner names the FIRST `sources` entry as the reporting
   * outlet — on a sub-confirmed item, keep the outlet that actually reported
   * the claim first (never an image-credit or license-provenance source).
   * Authored on the seed row and piped through
   * scripts/sync-longlive-content.mjs.
   */
  confidence?: Confidence;
  /**
   * Attributed, dated rumors/reports about this moment (see RumorNote).
   * Renders as MomentDetail's visually distinct "What's rumored" section
   * after the confirmed narrative — the structural answer to hot topics
   * with thin confirmed sourcing. Authored as `moment.rumors` on the seed
   * row and piped through scripts/sync-longlive-content.mjs.
   */
  rumors?: RumorNote[];
  /** Optional hidden clue — renders the glint treatment when present. */
  hiddenClue?: HiddenClue;
  /** Optional official music video, embedded via YouTube in the detail view. */
  video?: MomentVideo;
  /** A post this moment is about, embedded via facade (issue #1074). */
  socialPost?: SocialPost;
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
  /**
   * How major this event was in Taylor's life — an explicit authoring
   * judgment call, not inferred from incidental signals (photo count, body
   * length). Added 2026-07-18 (Joey + Wyatt) after the feed-tier system
   * (`lib/longlive/feed-tiers.ts`) was found to size cards by proxy signals
   * that don't reliably track actual importance — a routine sighting with
   * several photos could out-rank a defining event with fewer.
   *   - `'defining'` — rare, life-defining (a wedding, an album release, a
   *     major breakup). Always renders as the full-bleed `hero` card tier,
   *     regardless of the pacing throttle that otherwise spaces heroes out —
   *     see `assignFeedTiers`. Also the trigger for the depth exception in
   *     `docs/content-ops/depth-rubric.md` (defining items get materially
   *     more sourced content than a routine item, mirroring the existing
   *     `music`-category depth exception).
   *   - `'notable'` — meaningfully important but not era-defining (a major
   *     performance, a high-profile interview). Guaranteed at least `media`
   *     tier — never demoted to a `chip`/`text` pacing breather.
   *   - Absent (the default, most items) — routine; `assignFeedTiers`' existing
   *     content-derived heuristic applies unchanged.
   * See `docs/content-ops/depth-rubric.md` for how to judge this and
   * `docs/decisions.md` 2026-07-18 for the full decision record.
   */
  significance?: 'defining' | 'notable';
  /**
   * Era-timeline milestone marker (consolidation stage 2b, 2026-07-19):
   * items carrying this appear on the TimelineScrubber — MILESTONES in
   * content.ts is DERIVED from these markers, so a milestone can never
   * again drift out of sync with its moment. `id` keeps the legacy
   * milestone id for stability.
   */
  milestone?: { id: string; label: string; kind: MilestoneKind };
  /**
   * Optional pull-quote (a caption, lyric, or public statement) rendered on
   * thread beat cards (stage 3, 2026-07-19 — replaces StoryBeat.quote when
   * threads derive from tagged moments instead of hand-authored beat lists).
   */
  pullQuote?: string;
  /**
   * Shoppable products worn in this moment (fashion moments, mostly) — the
   * exact garments with direct retailer product pages. Rendered as the
   * "Shop the look" block in MomentDetail, always linked through
   * buildShopUrl() (lib/longlive/shop.ts) so affiliate wrapping can be
   * turned on later without re-authoring any content. Optional: most
   * moments have none.
   */
  products?: Product[];
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
/**
 * A social post a moment is ABOUT, embedded rather than re-hosted (issue #1074).
 *
 * Some moments ARE a post: the Kamala Harris endorsement is a photo and a
 * caption signed "Childless Cat Lady". Before this, that page carried only
 * substitutes — a Getty file photo of Swift plus portraits of the other people
 * named — because Instagram is not on the image-host allowlist and its CDN URLs
 * are signed and expiring, so there is nothing stable to hotlink.
 *
 * Checking how the press handles it settled the design: CBS, NPR and TODAY all
 * EMBED the post rather than re-hosting a screenshot. So no allowlisted host
 * has a copy, and no amount of Photo Enrichment searching would ever find one —
 * embedding is not a workaround here, it is the only correct answer.
 *
 * `shortcode` is the post id from its permalink (instagram.com/p/<shortcode>/).
 * `label` describes the post for the pre-consent facade, which is all a reader
 * sees until they choose to load it.
 */
export interface SocialPost {
  /** Only Instagram today; the field exists so adding a platform is not a rename. */
  platform: 'instagram';
  shortcode: string;
  /** Shown on the facade before the reader opts into loading the embed. */
  label: string;
  /** ISO date the post went up, if known. */
  postedOn?: string;
}

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
 * The essential-facts card for a song (issue #440 §3) — public-record data
 * grouped into one object per Joey's "grouped fields" sign-off on #440, so
 * the generated file stays diffable and the fact card renders from a single
 * optional prop. All fields optional: facts render only when known, never as
 * placeholder rows.
 */
export interface TrackFacts {
  /** Release the track appears on, e.g. "The Life of a Showgirl". */
  release?: string;
  /** ISO release date of that release (YYYY-MM-DD). */
  releaseDate?: string;
  writers?: string[];
  producers?: string[];
  isSingle?: boolean;
  /** ISO date the track was released as a single, when it was one. */
  singleReleaseDate?: string;
  /** Editorial theme tags, e.g. "rescue", "literary allusion". */
  themes?: string[];
}

/**
 * The tiered meaning split (issue #440 §5): what the song is about, with
 * confirmation status structurally separated so a fan reading can never be
 * mistaken for something Taylor said. Each tier is paragraphs of ORIGINAL
 * prose (never lyrics); the tier labels reuse the site's existing
 * confidence-pill visual language (TheoryGuide/MomentDetail), not a new one.
 */
export interface TrackMeaning {
  /** Taylor / a collaborator / an authoritative source directly explained it. */
  confirmed?: string[];
  /** Well-supported by the song + public context, but not directly confirmed. */
  supported?: string[];
  /** Popular, explicitly-unconfirmed fan readings. */
  fanTheories?: string[];
}

/** One live-performance highlight (issue #440 §13) — real, sourced, dated. */
export interface TrackLiveMoment {
  /** ISO date (YYYY-MM-DD) or YYYY-MM when only the month is documented. */
  date?: string;
  /** Where it happened, e.g. "Saturday Night Live" or "Eras Tour — São Paulo N3". */
  event: string;
  /** What made it notable, in our own words. */
  note: string;
}

/**
 * What Taylor or a collaborator has said about the song (issue #440 §18/§19)
 * — paraphrased in the site's editorial voice with at most a short
 * illustrative excerpt, per the verbatim-quote policy in docs/decisions.md.
 */
export interface TrackVoice {
  /** Who said it, e.g. "Taylor Swift" or "Max Martin". */
  who: string;
  /** Where/when it was said, e.g. "New Heights podcast, August 2025". */
  context?: string;
  /** The substance, reframed — never a pasted quote block. */
  note: string;
}

/**
 * One explained catalog connection (issue #440 §10): every connection says
 * WHY the two pieces relate, never just name-drops. `relatedId` uses the
 * standard RelatedId namespaces (`song:` / `moment:` / `motif:` / `egg:`);
 * unresolvable ids are skipped at render time, never dead links.
 */
export interface TrackConnection {
  relatedId: RelatedId;
  /** Display label, e.g. the other song's title. */
  label: string;
  /** The explained relationship — the actual point of the section. */
  why: string;
}

/**
 * The per-song dossier (issue #440 Phase 1): everything beyond the one-line
 * note and the narrative discussion, grouped per Joey's sign-off. The
 * generator drops a dossier whose `sources` list is empty — dossier claims
 * (live history, collaborator words, why-it-matters framing) never ship
 * unsourced, same rule as `discussion`.
 */
export interface TrackDossier {
  /** "Why this song matters" — the editorial case for caring (issue #440 §2). */
  whyItMatters?: string[];
  meaning?: TrackMeaning;
  connections?: TrackConnection[];
  live?: TrackLiveMoment[];
  voices?: TrackVoice[];
  /** Citations backing the dossier's claims. Never empty when a dossier ships. */
  sources: EggSource[];
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
  /**
   * Stable kebab id from the seed, unique per era (keep globally unique —
   * it's the `song:<slug>` RelatedId target). Optional: legacy rows without
   * one simply can't be linked to.
   */
  slug?: string;
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
  /**
   * Essential facts (writers/producers/release/single status/themes). Most of
   * this was already authored in the seed files and just never reached the UI
   * — see issue #440's Phase 0.
   */
  facts?: TrackFacts;
  /** The Phase-1 dossier: why-it-matters, tiered meaning, connections, live history, voices. */
  dossier?: TrackDossier;
  /**
   * The song's playable audio: an 11-char YouTube id from an OFFICIAL Taylor
   * Swift channel ('Taylor Swift', 'Taylor Swift - Topic', or 'TaylorSwiftVEVO'),
   * oEmbed-verified at authoring time — see the audio-curator flow. Optional:
   * a song with no official upload that verifies simply has no id and the UI
   * omits the embed rather than guessing. Distinct from the VIDEOS system
   * (music videos / tour films): this is the studio audio for the song itself,
   * and a track may share an id the videos rail also carries.
   */
  youtubeId?: string;
}

/**
 * The eight mood axes the Mood Chat feature scores every song on (0..1 each).
 * See docs/proposals/2026-07-19-mood-chat.md. The whole point of the feature
 * is that the model NEVER searches the catalogue: a reader's words become a
 * mood vector and matching is pure TypeScript over these precomputed numbers,
 * so it is deterministic, unit-testable, free at runtime, and cannot invent a
 * song that doesn't exist. This tuple is the single source of truth — the
 * generator (scripts/sync-song-moods.mjs), the validator, and the Stage 3
 * matcher all derive their axis list from MOOD_AXES, so adding an axis is one
 * edit and the compiler flags every table that hasn't caught up.
 */
export const MOOD_AXES = [
  'heartbreak',
  'anger',
  'nostalgia',
  'joy',
  'calm',
  'defiance',
  'longing',
  'catharsis',
] as const;

/** One of the eight mood axes. */
export type MoodAxis = (typeof MOOD_AXES)[number];

/** A song's score on every mood axis, each 0..1. */
export type MoodAxes = Record<MoodAxis, number>;

/**
 * One song in the Mood Chat catalogue (song-moods.generated.ts), produced by
 * scripts/sync-song-moods.mjs from supabase/seed/tracks/** (the authoritative
 * song list) merged with supabase/seed/song-moods/** (the mood scores). Every
 * entry resolves to a real track — `slug`, `title`, `eraId`, and `youtubeId`
 * all come from that track, never fabricated; `youtubeId` is the track's own
 * oEmbed-verified id and is absent when the track has none (the UI omits the
 * embed rather than guessing).
 *
 * `moods`/`energy`/`valence`/`useCase`/`oneLiner` are absent until Stage 2
 * scores the song from its existing researched note. An UNSCORED entry is a
 * placeholder the matcher skips; a SCORED entry is match-eligible. No lyrics,
 * ever — `oneLiner` and `useCase` are ORIGINAL prose, never quoted verse.
 */
export interface SongMood {
  /** The track's stable slug — its `song:<slug>` id and the catalogue key. */
  slug: string;
  title: string;
  eraId: EraId;
  /** The track's own oEmbed-verified YouTube id, when it has one. */
  youtubeId?: string;
  /** Per-axis scores (0..1). Absent until Stage 2 scores the song. */
  moods?: MoodAxes;
  /** Sonic energy, 0 (still, spare) .. 1 (loud, driving). */
  energy?: number;
  /** Emotional valence, 0 (sad) .. 1 (happy). */
  valence?: number;
  /** A few original "when you'd reach for this" phrases (never lyrics). */
  useCase?: string[];
  /** One original sentence about the song (never a quoted lyric). */
  oneLiner?: string;
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

/**
 * A portrait of the other person on the Love Story thread.
 *
 * Wikimedia rather than press CDNs on purpose: `upload.wikimedia.org` is on the
 * image-host allowlist, the URLs are stable (press CDNs sign and expire theirs,
 * which is why the Instagram embed exists at all), and every subject here has a
 * freely-licensed portrait. `credit` is not decoration — most of these are
 * CC BY-SA, where attribution is a licence condition.
 */
export interface RelationshipImage {
  url: string;
  /** Photographer + licence, e.g. "Gage Skidmore · CC BY-SA 3.0". */
  credit: string;
  alt: string;
}

export interface Relationship {
  id: string;
  name: string;
  /** Portrait shown when the entry is opened. Optional: absent when the
   *  subject is not a public figure in his own right (privacy-redlines #5). */
  image?: RelationshipImage;
  start: string;
  /** null = ongoing / open-ended. */
  end: string | null;
  eraIds: EraId[];
  songs: string[];
  note: string;
  /** Cross-type links (see RelatedId for the id convention). */
  relatedIds?: RelatedId[];
}

/**
 * A solo/single stretch on the Love Story thread — the gaps between
 * relationships, treated as first-class timeline entries (not derived gaps)
 * because they matter to the story: who she was with, and who she wasn't.
 */
export interface SinglePeriod {
  id: string;
  start: string;
  /** null = the most recent solo stretch before her next relationship began
   * has no meaningful "end" distinct from that relationship's start. */
  end: string | null;
  eraIds: EraId[];
  note: string;
  /** Songs associated with what she was writing/releasing during this stretch. */
  songs?: string[];
}

export interface RunwayLook {
  id: string;
  eraId: EraId;
  name: string;
  description: string;
  /** Real, credited photos for this era's style story — always at least one. */
  images: ImageRef[];
  shopTags: string[];
}

export interface ReRecord {
  id: string;
  album: string;
  originalYear: number;
  reclaimedYear: number | null;
  /** Human display date of the TV release, e.g. "Apr 9, 2021". null = not re-recorded yet. */
  reclaimedDate: string | null;
  vaultTracks: number;
  /** Per-album accent used on the ownership-timeline chart row and card rail. */
  color: string;
  note: string;
  /** Deeper editorial: the masters-dispute context specific to this album. */
  context: string;
  /** Why this album was re-recorded at this point in the campaign (or, for a
   * still-pending album, why it hasn't been yet). */
  whyNow: string;
  /** The single most culturally significant vault track, or null (e.g. a
   * pending album with no vault tracks released yet). */
  vaultHighlight: string | null;
  fanReaction: string;
  /** Verified Spotify album IDs — null on either side is a real, checked
   * absence (no TV yet, or the original master isn't the canonical release
   * Taylor points fans to), never an unverified guess. */
  spotify: { original: string | null; taylorsVersion: string | null };
}

export interface EggSource {
  name: string;
  url: string;
  /**
   * The editor's provenance judgment, carried through from the seed's
   * `reliability_score` (2026-07-08 audit §5 rubric): 5 official/primary ·
   * 4 reputable press · 3 trade databases / verified interviews · 2 wikis and
   * moderated fan forums · 1 unverified social.
   *
   * OPTIONAL and genuinely absent on citations authored before the rubric —
   * `undefined` means "never scored", which is NOT the same as "scored low".
   * Any consumer that renders this must treat the two differently.
   *
   * Nothing displays this yet, by decision (docs/decisions.md 2026-08-11): it
   * is plumbed so the data stops being thrown away at build time and so a
   * future citation treatment has something real to read. See that entry
   * before wiring it to a badge.
   */
  reliability?: 1 | 2 | 3 | 4 | 5;
  /** The §5 `source_type` (official | reputable_press | wiki | …), when set. */
  type?: string;
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
  /**
   * The receipt: her actual words at this point (lyric, spoken quote, liner
   * note) — short and iconic. Optional; the UI degrades gracefully without
   * it. Same discipline as media IDs: never trust memory for a quote, verify
   * against a primary source before hardcoding, and it's a *snippet* only
   * (docs/decisions.md 2026-07-09) — never a complete lyric.
   */
  line?: string;
  /** Citation for `line`, e.g. a song title or interview name. */
  lineCite?: string;
}

/** A coarse category for what kind of clue a CluePair is — distinct from the
 * Clue Web's MotifId (a different feature, `easter-eggs` thread). Optional:
 * the UI hides the motif badge rather than guessing when absent. */
export type DecodeMotifId = 'number' | 'object' | 'lyric' | 'name' | 'structural' | 'theme' | 'political';

export const DECODE_MOTIF_META: Record<DecodeMotifId, { label: string }> = {
  number: { label: 'Number' },
  object: { label: 'Object' },
  lyric: { label: 'Lyric' },
  name: { label: 'Name' },
  structural: { label: 'Structure' },
  theme: { label: 'Theme' },
  political: { label: 'Movement' },
};

/**
 * A hidden clue Taylor planted at one point that paid off later. Rendered as an
 * interactive "decode" — revealing the payoff draws a thread across the gap.
 */
export interface CluePair {
  id: string;
  title: string;
  /** Dramatic one-line teaser shown as the card's headline. Optional —
   * falls back to `title` when absent, rather than requiring every one of
   * the 100+ existing pairs to be rewritten before this field is useful. */
  hook?: string;
  /** Punchy fan-voice takeaway shown once the payoff is revealed. Optional —
   * falls back to `connection` when absent, same reasoning as `hook`. */
  verdict?: string;
  motif?: DecodeMotifId;
  plant: CluePoint;
  payoff: CluePoint;
  /** One-sentence through-line connecting plant → payoff. */
  connection: string;
  /** True when Taylor/her team confirmed intent; false for fan theory. */
  confirmed: boolean;
  sources: EggSource[];
}

// StoryBeat removed (consolidation stage 3, 2026-07-19): thread beats derive
// from ContentItems tagged with the thread (threadIds + pullQuote) — no
// parallel beat type.

