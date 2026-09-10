/**
 * `packages/content` — the typed, versioned contract for everything the
 * Long Live experience renders (OS-010, `docs/specs/2026-09-05-one-source-
 * three-surfaces.md` §2, Layer 1).
 *
 * These zod schemas are derived from the hand-authored TypeScript types
 * already shipping in `apps/web/lib/longlive/{types,content,tracks,
 * theories,videos,era-secrets,merch,song-moods,clownbot-lore}.ts` — this
 * file does not invent a new content model, it gives the EXISTING model a
 * runtime-checkable, versioned boundary so `scripts/build-content-bundle.mjs`
 * (OS-011) can validate what it emits and `packages/content`'s loader
 * (OS-013) can validate what it reads, on every platform (web + native),
 * without trusting either side to have stayed in sync by convention alone.
 *
 * Keep this file in lockstep with the source types above. When a
 * `lib/longlive/types.ts` shape changes, update the matching schema here in
 * the SAME change (see `docs/decisions.md` "Content bundle schema — an
 * artifact, not a DB" for why this is a hard rule, not a suggestion).
 */
import { z } from 'zod';

// ── Primitive/enum types (mirrors apps/web/lib/longlive/types.ts) ──────────

export const eraIdSchema = z.enum([
  'debut',
  'fearless',
  'speak-now',
  'red',
  '1989',
  'reputation',
  'lover',
  'folklore',
  'evermore',
  'midnights',
  'ttpd',
  'tloas',
]);
export type EraId = z.infer<typeof eraIdSchema>;

export const contentTagSchema = z.enum(['Music', 'Fashion', 'Tour', 'Relationship', 'Lore']);
export type ContentTag = z.infer<typeof contentTagSchema>;

export const confidenceSchema = z.enum([
  'official',
  'confirmed_interview',
  'reputable_reporting',
  'strong_fan_consensus',
  'plausible',
  'clowning',
  'disproven',
  'joke_meme',
]);
export type Confidence = z.infer<typeof confidenceSchema>;

export const rumorStatusSchema = z.enum([
  'unconfirmed',
  'partially_confirmed',
  'confirmed',
  'debunked',
  'faded',
]);
export type RumorStatus = z.infer<typeof rumorStatusSchema>;

export const rumorSourceTierSchema = z.enum(['official', 'established', 'tabloid', 'social']);
export type RumorSourceTier = z.infer<typeof rumorSourceTierSchema>;

export const locationSpecificitySchema = z.enum(['region', 'city', 'venue']);
export type LocationSpecificity = z.infer<typeof locationSpecificitySchema>;

export const rumorResolutionSchema = z.object({
  on: z.string(),
  url: z.string(),
  outlet: z.string(),
  note: z.string().optional(),
});
export type RumorResolution = z.infer<typeof rumorResolutionSchema>;

export const rumorNoteSchema = z.object({
  claim: z.string(),
  reportedBy: z.string(),
  reportedOn: z.string(),
  status: rumorStatusSchema,
  url: z.string(),
  note: z.string().optional(),
  lastCheckedOn: z.string().optional(),
  resolution: rumorResolutionSchema.optional(),
  sourceTier: rumorSourceTierSchema.optional(),
  locationSpecificity: locationSpecificitySchema.optional(),
});
export type RumorNote = z.infer<typeof rumorNoteSchema>;

export const theoryOutcomeSchema = z.enum([
  'confirmed',
  'partially_confirmed',
  'pending',
  'debunked',
  'abandoned',
  'unfalsifiable',
]);
export type TheoryOutcome = z.infer<typeof theoryOutcomeSchema>;

export const milestoneKindSchema = z.enum(['album', 'tour', 'life', 'business', 'award', 'fandom']);
export type MilestoneKind = z.infer<typeof milestoneKindSchema>;

export const eraFontSchema = z.enum(['serif', 'sans', 'mono', 'script']);
export type EraFont = z.infer<typeof eraFontSchema>;

export const eraThemeSchema = z.object({
  bg: z.string(),
  surface: z.string(),
  surface2: z.string(),
  ink: z.string(),
  inkSoft: z.string(),
  line: z.string(),
  accent: z.string(),
  accent2: z.string(),
  glow: z.string(),
  font: eraFontSchema,
  accentText: z.string().optional(),
  accentFg: z.string().optional(),
});
export type EraTheme = z.infer<typeof eraThemeSchema>;

/** `<type>:<id>` cross-content reference (see types.ts's RelatedId doc for the namespace list). */
export const relatedIdSchema = z.string();
export type RelatedId = z.infer<typeof relatedIdSchema>;

export const hiddenClueSchema = z.object({
  clue: z.string(),
  payoff: z.string(),
});
export type HiddenClue = z.infer<typeof hiddenClueSchema>;

export const imageKindSchema = z.enum(['primary', 'reference', 'archival']);
export type ImageKind = z.infer<typeof imageKindSchema>;

export const imageRefSchema = z.object({
  url: z.string(),
  credit: z.string().optional(),
  caption: z.string().optional(),
  kind: imageKindSchema,
  focalPoint: z.string().optional(),
});
export type ImageRef = z.infer<typeof imageRefSchema>;

export const eggSourceSchema = z.object({
  name: z.string(),
  url: z.string(),
  reliability: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).optional(),
  type: z.string().optional(),
});
export type EggSource = z.infer<typeof eggSourceSchema>;

export const productKindSchema = z.enum([
  'dress',
  'top',
  'bottom',
  'outerwear',
  'knitwear',
  'shoes',
  'jewelry',
  'bag',
  'hat',
  'eyewear',
  'beauty',
  'accessory',
  'music',
  'collectible',
  'home',
  'other',
]);

export const productSchema = z.object({
  brand: z.string(),
  item: z.string(),
  retailer: z.string(),
  url: z.string(),
  price: z.string().optional(),
  inStock: z.boolean().optional(),
  isAlternative: z.boolean().optional(),
  altNote: z.string().optional(),
  imageUrl: z.string().optional(),
  matchTier: z.enum(['exact', 'close', 'similar', 'inspired', 'unscored']).optional(),
  matchScore: z.number().min(0).max(100).optional(),
  verifiedAt: z.string().optional(),
  kind: productKindSchema.optional(),
  altListing: z.object({ retailer: z.string(), url: z.string() }).optional(),
});
export type Product = z.infer<typeof productSchema>;

export const momentVideoSchema = z.object({
  youtubeId: z.string(),
  title: z.string(),
});
export type MomentVideo = z.infer<typeof momentVideoSchema>;

export const socialPostSchema = z.object({
  platform: z.literal('instagram'),
  shortcode: z.string(),
  label: z.string(),
  postedOn: z.string().optional(),
});
export type SocialPost = z.infer<typeof socialPostSchema>;

export const lensIdSchema = z.enum([
  'love-story',
  'fashion',
  'taylors-version',
  'easter-eggs',
  'hidden-clues',
  'the-proposal',
]);
export type LensId = z.infer<typeof lensIdSchema>;

// ── Content items + milestones (apps/web/lib/longlive/content.ts) ──────────

export const contentItemSchema = z.object({
  id: z.string(),
  slug: z.string().optional(),
  eraId: eraIdSchema,
  date: z.string(),
  dateLabel: z.string(),
  title: z.string(),
  summary: z.string(),
  body: z.array(z.string()),
  tags: z.array(contentTagSchema),
  images: z.array(imageRefSchema).min(1),
  sources: z.array(eggSourceSchema).optional(),
  confidence: confidenceSchema.optional(),
  rumors: z.array(rumorNoteSchema).optional(),
  hiddenClue: hiddenClueSchema.optional(),
  video: momentVideoSchema.optional(),
  socialPost: socialPostSchema.optional(),
  relatedIds: z.array(relatedIdSchema).optional(),
  threadIds: z.array(lensIdSchema).optional(),
  significance: z.enum(['defining', 'notable']).optional(),
  milestone: z
    .object({ id: z.string(), label: z.string(), kind: milestoneKindSchema })
    .optional(),
  pullQuote: z.string().optional(),
  products: z.array(productSchema).optional(),
});
export type ContentItem = z.infer<typeof contentItemSchema>;

export const milestoneSchema = z.object({
  id: z.string(),
  eraId: eraIdSchema,
  date: z.string(),
  label: z.string(),
  kind: milestoneKindSchema,
});
export type Milestone = z.infer<typeof milestoneSchema>;

export const eraMediaSchema = z.object({
  spotifyAlbumId: z.string(),
  albumTitle: z.string(),
  youtubeId: z.string().optional(),
});

export const eraSchema = z.object({
  id: eraIdSchema,
  name: z.string(),
  shortName: z.string(),
  album: z.string(),
  start: z.string(),
  end: z.string(),
  yearLabel: z.string(),
  tagline: z.string(),
  intro: z.string(),
  lyric: z.object({ line: z.string(), song: z.string() }).optional(),
  image: z.string(),
  theme: eraThemeSchema,
  isCurrent: z.boolean().optional(),
  media: eraMediaSchema.optional(),
});
export type Era = z.infer<typeof eraSchema>;

/** One era's worth of content: the moments plus the milestones derived from them. */
export const contentBundleFileSchema = z.object({
  eraId: eraIdSchema,
  items: z.array(contentItemSchema),
});
export type ContentBundleFile = z.infer<typeof contentBundleFileSchema>;

// ── Track guide (apps/web/lib/longlive/tracks.ts) ───────────────────────────

export const trackFactsSchema = z.object({
  release: z.string().optional(),
  releaseDate: z.string().optional(),
  writers: z.array(z.string()).optional(),
  producers: z.array(z.string()).optional(),
  isSingle: z.boolean().optional(),
  singleReleaseDate: z.string().optional(),
  themes: z.array(z.string()).optional(),
});
export type TrackFacts = z.infer<typeof trackFactsSchema>;

export const trackMeaningSchema = z.object({
  confirmed: z.array(z.string()).optional(),
  supported: z.array(z.string()).optional(),
  fanTheories: z.array(z.string()).optional(),
});
export type TrackMeaning = z.infer<typeof trackMeaningSchema>;

export const trackLiveMomentSchema = z.object({
  date: z.string().optional(),
  event: z.string(),
  note: z.string(),
});
export type TrackLiveMoment = z.infer<typeof trackLiveMomentSchema>;

export const trackVoiceSchema = z.object({
  who: z.string(),
  context: z.string().optional(),
  note: z.string(),
});
export type TrackVoice = z.infer<typeof trackVoiceSchema>;

export const trackConnectionSchema = z.object({
  relatedId: relatedIdSchema,
  label: z.string(),
  why: z.string(),
});
export type TrackConnection = z.infer<typeof trackConnectionSchema>;

export const trackDossierSchema = z.object({
  whyItMatters: z.array(z.string()).optional(),
  meaning: trackMeaningSchema.optional(),
  connections: z.array(trackConnectionSchema).optional(),
  live: z.array(trackLiveMomentSchema).optional(),
  voices: z.array(trackVoiceSchema).optional(),
  sources: z.array(eggSourceSchema),
});
export type TrackDossier = z.infer<typeof trackDossierSchema>;

export const trackNoteSchema = z.object({
  slug: z.string().optional(),
  trackNumber: z.number().int().nullable(),
  title: z.string(),
  note: z.string(),
  sources: z.array(eggSourceSchema).optional(),
  discussion: z.array(z.string()).optional(),
  quotedLines: z.array(z.string()).optional(),
  discussionSources: z.array(eggSourceSchema).optional(),
  facts: trackFactsSchema.optional(),
  dossier: trackDossierSchema.optional(),
  youtubeId: z.string().optional(),
});
export type TrackNote = z.infer<typeof trackNoteSchema>;

export const tracksBundleFileSchema = z.object({
  eraId: eraIdSchema,
  tracks: z.array(trackNoteSchema),
});
export type TracksBundleFile = z.infer<typeof tracksBundleFileSchema>;

// ── Theories (apps/web/lib/longlive/theories.ts) ────────────────────────────

export const theoryNoteSchema = z.object({
  slug: z.string(),
  kind: z.enum(['easter_egg', 'theory']),
  title: z.string(),
  claim: z.string(),
  evidence: z.string().nullable(),
  confidence: confidenceSchema,
  outcome: theoryOutcomeSchema,
  sources: z.array(eggSourceSchema),
  relatedSlugs: z.array(z.string()).optional(),
});
export type TheoryNote = z.infer<typeof theoryNoteSchema>;

export const theoriesBundleFileSchema = z.object({
  eraId: eraIdSchema,
  theories: z.array(theoryNoteSchema),
});
export type TheoriesBundleFile = z.infer<typeof theoriesBundleFileSchema>;

// ── Videos (apps/web/lib/longlive/videos.ts) ────────────────────────────────

export const videoNoteKindSchema = z.enum([
  'music_video',
  'lyric_video',
  'short_film',
  'tour_film',
  'documentary',
  'performance',
  'interview',
  'award_speech',
  'speech',
  'press_event',
]);
export type VideoNoteKind = z.infer<typeof videoNoteKindSchema>;

export const appearanceVideoKindSchema = z.enum(['interview', 'award_speech', 'speech', 'press_event']);
export type AppearanceVideoKind = z.infer<typeof appearanceVideoKindSchema>;

export const videoNoteSchema = z.object({
  slug: z.string(),
  kind: videoNoteKindSchema.nullable(),
  title: z.string(),
  director: z.string().nullable(),
  releasedOn: z.string().nullable(),
  relatedSongs: z.array(z.string()),
  summary: z.string().nullable(),
  easterEggs: z.array(z.string()),
  symbolism: z.string().nullable(),
  youtubeId: z.string().nullable(),
  sources: z.array(eggSourceSchema),
  tags: z.array(contentTagSchema).optional(),
});
export type VideoNote = z.infer<typeof videoNoteSchema>;

export const videosBundleFileSchema = z.object({
  eraId: eraIdSchema,
  videos: z.array(videoNoteSchema),
});
export type VideosBundleFile = z.infer<typeof videosBundleFileSchema>;

// ── Era secrets (apps/web/lib/longlive/era-secrets.ts) ──────────────────────

export const eraSecretSchema = z.object({
  slug: z.string(),
  title: z.string(),
  secret: z.string(),
  deeperLink: z.string().optional(),
  sources: z.array(eggSourceSchema).min(1),
});
export type EraSecret = z.infer<typeof eraSecretSchema>;

export const eraSecretsBundleFileSchema = z.object({
  eraId: eraIdSchema,
  secrets: z.array(eraSecretSchema),
});
export type EraSecretsBundleFile = z.infer<typeof eraSecretsBundleFileSchema>;

// ── Merch (apps/web/lib/longlive/merch.ts) ──────────────────────────────────

export const merchCategorySchema = z.enum(['shop-the-look', 'official-store', 'fan-made']);
export type MerchCategory = z.infer<typeof merchCategorySchema>;

export const merchSourceSchema = z.object({
  eraId: eraIdSchema,
  momentId: z.string(),
  momentSlug: z.string().optional(),
  momentTitle: z.string(),
});
export type MerchSource = z.infer<typeof merchSourceSchema>;

export const merchItemSchema = productSchema.extend({
  category: merchCategorySchema,
  source: merchSourceSchema.optional(),
  discoveredAt: z.string().optional(),
  demoteSharedMomentPhoto: z.boolean().optional(),
});
export type MerchItem = z.infer<typeof merchItemSchema>;

export const merchCatalogueSchema = z.object({
  shopTheLook: z.array(merchItemSchema),
  officialStore: z.array(merchItemSchema),
  fanMade: z.array(merchItemSchema),
});
export type MerchCatalogue = z.infer<typeof merchCatalogueSchema>;

// ── Song moods (apps/web/lib/longlive/song-moods.generated.ts) ─────────────

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
export const moodAxisSchema = z.enum(MOOD_AXES);
export type MoodAxis = z.infer<typeof moodAxisSchema>;

export const moodAxesSchema = z.object({
  heartbreak: z.number().min(0).max(1),
  anger: z.number().min(0).max(1),
  nostalgia: z.number().min(0).max(1),
  joy: z.number().min(0).max(1),
  calm: z.number().min(0).max(1),
  defiance: z.number().min(0).max(1),
  longing: z.number().min(0).max(1),
  catharsis: z.number().min(0).max(1),
});
export type MoodAxes = z.infer<typeof moodAxesSchema>;

export const songMoodSchema = z.object({
  slug: z.string(),
  title: z.string(),
  eraId: eraIdSchema,
  youtubeId: z.string().optional(),
  moods: moodAxesSchema.optional(),
  energy: z.number().min(0).max(1).optional(),
  valence: z.number().min(0).max(1).optional(),
  useCase: z.array(z.string()).optional(),
  oneLiner: z.string().optional(),
});
export type SongMood = z.infer<typeof songMoodSchema>;

export const songMoodsBundleFileSchema = z.object({
  songs: z.array(songMoodSchema),
});
export type SongMoodsBundleFile = z.infer<typeof songMoodsBundleFileSchema>;

// ── Clownbot lore (apps/web/lib/longlive/clownbot-lore.ts) ─────────────────

export const loreStatusSchema = z.enum(['rumor', 'reported', 'confirmed', 'debunked']);
export type LoreStatus = z.infer<typeof loreStatusSchema>;

export const loreSourceSchema = z.object({
  name: z.string(),
  url: z.string(),
});
export type LoreSource = z.infer<typeof loreSourceSchema>;

export const loreLedgerSchema = z.object({
  theory: z.string(),
  verdict: z.enum(['clowned', 'confirmed']),
  on: z.string(),
});
export type LoreLedger = z.infer<typeof loreLedgerSchema>;

export const loreItemSchema = z.object({
  id: z.string(),
  status: loreStatusSchema,
  date: z.string(),
  lastCheckedOn: z.string(),
  headline: z.string(),
  detail: z.string(),
  sources: z.array(loreSourceSchema).min(1),
  prompts: z.array(z.string()).optional(),
  ledger: loreLedgerSchema.optional(),
  evergreen: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});
export type LoreItem = z.infer<typeof loreItemSchema>;

export const clownbotLoreBundleFileSchema = z.object({
  lore: z.array(loreItemSchema),
});
export type ClownbotLoreBundleFile = z.infer<typeof clownbotLoreBundleFileSchema>;

// ── Manifest (OS-010 body: the bundle's own table of contents) ─────────────

/**
 * `manifest.json` — the bundle's own table of contents, published alongside
 * the content files by `scripts/build-content-bundle.mjs` (OS-011).
 *
 * `schemaVersion` gates loader compatibility (see OS-041's N-1 policy: a
 * loader built against schemaVersion N must still read N-1). `bundleVersion`
 * is a content hash (not a timestamp or counter) so two builds from
 * byte-identical seed content produce the same bundleVersion — the
 * determinism OS-011 requires for its "run it twice, get identical hashes"
 * done-when.
 */
export const manifestFileEntrySchema = z.object({
  path: z.string(),
  sha256: z.string().regex(/^[0-9a-f]{64}$/, 'sha256 must be a 64-char lowercase hex digest'),
  bytes: z.number().int().nonnegative(),
});
export type ManifestFileEntry = z.infer<typeof manifestFileEntrySchema>;

export const manifestSchema = z.object({
  /** Bumped only on a breaking change to the schemas in this file. */
  schemaVersion: z.number().int().positive(),
  /** Content hash of the bundle's files — the loader's cache/ETag key. */
  bundleVersion: z.string().min(1),
  /** ISO 8601 timestamp of the build that produced this manifest. */
  generatedAt: z.string().datetime({ offset: true }),
  /** name -> where to find it, and how to verify it landed intact. */
  files: z.record(z.string(), manifestFileEntrySchema),
});
export type Manifest = z.infer<typeof manifestSchema>;

/**
 * The full bundle shape a loader (OS-013) resolves `manifest.json`'s
 * `files` map into: one parsed+validated payload per named file. Kept
 * separate from `Manifest` itself because the manifest is fetched first
 * (it is the routing table), then each file is fetched/validated against
 * its own schema below — the loader never needs to hold every domain's
 * schema in memory before it knows which era it wants.
 */
export const contentBundleSchemas = {
  manifest: manifestSchema,
  content: contentBundleFileSchema,
  tracks: tracksBundleFileSchema,
  theories: theoriesBundleFileSchema,
  videos: videosBundleFileSchema,
  eraSecrets: eraSecretsBundleFileSchema,
  merch: merchCatalogueSchema,
  songMoods: songMoodsBundleFileSchema,
  clownbotLore: clownbotLoreBundleFileSchema,
  eras: z.array(eraSchema),
  milestones: z.array(milestoneSchema),
} as const;
