// Current-tier domain types (proposal docs/proposals/2026-08-23-knowledge-
// engine.md §3, PLAN.md Stage 2). Portable, zero I/O — mirrors
// `supabase/migrations/20260901000000_knowledge_engine.sql` by hand by
// design (same convention as `packages/shared/src/news/news-types.ts`).
//
// One store, two tiers: the Vault (`vault-types.ts`, curated, slow) is
// unaffected by this file. This is the Current tier — what is happening and
// what fans are saying about it, labeled with how well we know it — plus the
// precedent/methodology layer both tiers feed and the single retrieval index
// (`KnowledgeDoc`) both project into. Exposed via the root barrel (unlike
// `news-types.ts`, which stays worker-only): the Current tier is meant to be
// read by web, mobile, and Clownbot alike (Stage 5/9/10), not dormant.

/**
 * Same 4 values as `SOURCE_TIERS` in `./news/news-types.ts` — mirrored, not
 * imported (that module is dormant, exposed only via the `@swift2/shared/
 * news` subpath, never the root barrel this file IS part of; see its
 * header). Keep the two in sync by hand if either changes.
 */
export const SOURCE_TIERS = ['official', 'established', 'fan', 'unverified'] as const;
export type SourceTier = (typeof SOURCE_TIERS)[number];

/** Same taxonomy `current_item.category` is CHECK-constrained to. */
export const CURRENT_ITEM_CATEGORIES = [
  'release', 'music', 'fashion', 'tour', 'relationship', 'business',
  'award', 'sighting', 'statement', 'website', 'merch', 'lore',
] as const;
export type CurrentItemCategory = (typeof CURRENT_ITEM_CATEGORIES)[number];

/** `current_item.status` — extends Clownbot's 4-value `ItemStatus` with `faded`. */
export const CURRENT_ITEM_STATUSES = ['rumor', 'reported', 'confirmed', 'debunked', 'faded'] as const;
export type CurrentItemStatus = (typeof CURRENT_ITEM_STATUSES)[number];

/** `location_level` — the location-specificity ladder: broad mentions pass, precise ones don't. */
export const LOCATION_LEVELS = ['region', 'city', 'venue'] as const;
export type LocationLevel = (typeof LOCATION_LEVELS)[number];

/** `live_theory.origin`. */
export const LIVE_THEORY_ORIGINS = ['fan', 'bot', 'site'] as const;
export type LiveTheoryOrigin = (typeof LIVE_THEORY_ORIGINS)[number];

/** `technique.reliability`. */
export const TECHNIQUE_RELIABILITIES = ['signature', 'frequent', 'occasional', 'rare'] as const;
export type TechniqueReliability = (typeof TECHNIQUE_RELIABILITIES)[number];

/** `knowledge_doc.tier` — the two worlds, as a row-level label. */
export const KNOWLEDGE_DOC_TIERS = ['vault', 'current'] as const;
export type KnowledgeDocTier = (typeof KNOWLEDGE_DOC_TIERS)[number];

/** One reported source, as stored in `current_item.sources` / `knowledge_doc.sources`. */
export interface KnowledgeSource {
  name: string;
  url: string;
  tier: SourceTier;
}

/**
 * The generalized "sighting" — anything observable that happened. The row
 * the current era's feed renders AND the row Content Shift promotes.
 */
export interface CurrentItem {
  id: string;
  /** The news_story cluster it came from; undefined for social-only rows. */
  storyId?: string;
  /** ISO date (YYYY-MM-DD). */
  observedOn: string;
  /** The current/ongoing era per intake.md. */
  eraId: string;
  category: CurrentItemCategory;
  /** The 5 ContentTags; drives FilterBar. */
  tags: string[];
  /** <=140 chars. */
  headline: string;
  /** <=400 chars — matches the seed snippet cap. */
  summary: string;
  /** 1-3 sentences, our words, never past `status`. */
  detail: string;
  status: CurrentItemStatus;
  /** The existing `Confidence` union (apps/web/lib/longlive/types.ts), serialized. */
  confidence: string;
  sourceTier: SourceTier;
  /** >=1, publisher URLs only — never a news.google redirect. */
  sources: KnowledgeSource[];
  locationLevel?: LocationLevel;
  /** Hotlink from an allowlisted host, or undefined. Never rehosted. */
  imageUrl?: string;
  socialPost?: { platform: 'instagram'; shortcode: string; postedOn?: string };
  symbols: string[];
  entities: string[];
  /** Corroboration x recency x fan volume. */
  heat: number;
  /** Vault moment id once promoted; row is then hidden from the feed. */
  promotedTo?: string;
  /** ISO date (YYYY-MM-DD). */
  lastCheckedOn: string;
  /** ISO 8601 timestamp. */
  expiresAt: string;
  redlineOk: boolean;
}

/** What fans are saying — aggregate only, never an individual. */
export interface FanSignal {
  id: string;
  /** ISO 8601 timestamps. */
  windowStart: string;
  windowEnd: string;
  platform: string;
  community: string;
  /** <=120 chars. */
  topic: string;
  /** Aggregate voice: "a popular thread", "dozens of posts". */
  summary: string;
  volume: number;
  heat: number;
  stanceMix: Record<string, unknown>;
  symbols: string[];
  theoryIds: string[];
  /** What the chatter is *about*. */
  currentItemIds: string[];
  /** <=3 public-thread permalinks. */
  sampleUrls: string[];
  /** ISO 8601 timestamp. */
  expiresAt: string;
  redlineOk: boolean;
}

/** A theory in play (fan / bot / site). The Threads-mode "eggs" board reads this. */
export interface LiveTheory {
  id: string;
  name: string;
  claim: string;
  /** ISO dates (YYYY-MM-DD). */
  firstSeenOn: string;
  lastSeenOn: string;
  origin: LiveTheoryOrigin;
  status: string;
  /** The `TheoryOutcome` union from `vault-types.ts`. */
  outcome: string;
  /** knowledge_doc ids. */
  evidenceIds: string[];
  symbols: string[];
  heat: number;
  /** `RumorResolution` shape (apps/web/lib/longlive/types.ts); required when outcome != 'pending'. */
  resolution?: { on: string; url: string; outlet: string; note?: string };
  /** Theories seed slug once promoted. */
  promotedTo?: string;
  /** ISO 8601 timestamp. */
  expiresAt: string;
}

/** A confirmed egg/theory precedent — built from the Vault by the canonical sync. */
export interface EggLedgerEntry {
  id: string;
  hintDocId?: string;
  revealDocId?: string;
  /** ISO dates (YYYY-MM-DD). */
  hintDate: string;
  revealDate?: string;
  /** Generated column: revealDate - hintDate, in days. */
  lagDays?: number;
  mechanism: string;
  symbols: string[];
  eraId?: string;
  confirmed: boolean;
  outcome: string;
  summary: string;
  sources: KnowledgeSource[];
}

/** A symbol/motif entry — built from the Vault by the canonical sync. */
export interface SymbolLexiconEntry {
  key: string;
  label: string;
  aliases: string[];
  category: string;
  linkedEras: string[];
  note: string;
}

/**
 * THE METHODOLOGY LAYER (2026-08-16 brief, Task 1) — patterns, not
 * instances. Schema-only per `docs/decisions.md` 2026-08-23: no rows are
 * authored by an autonomous run.
 */
export interface Technique {
  key: string;
  label: string;
  /** Our words: what the technique is and how she uses it. */
  description: string;
  reliability: TechniqueReliability;
  /** What would count as evidence of it recurring — the bot quotes this. */
  recurrenceTest: string;
  /** >=2 knowledge_doc ids from the EXISTING corpus; never invented. */
  exampleIds: string[];
  linkedSymbols: string[];
  sources: KnowledgeSource[];
}

/** The one retrieval index. Both tiers project into it. */
export interface KnowledgeDoc {
  /** moment:* theory:* egg:* track:* current:* signal:* ltheory:* */
  id: string;
  kind: string;
  tier: KnowledgeDocTier;
  title: string;
  text: string;
  /** ISO dates (YYYY-MM-DD), when applicable. */
  date?: string;
  recencyDate?: string;
  open: boolean;
  status: string;
  sourceTier: string;
  sources: KnowledgeSource[];
  eraId?: string;
  symbols: string[];
  entities: string[];
  // No `embedding` field: `create extension vector` is unverified against
  // this Supabase project (`HUMAN-ACTIONS.md` #14) and no embedding vendor
  // is chosen (`HUMAN-ACTIONS.md` #12 item 2), so the migration ships
  // without the column; retrieval is FTS-only via the DB's generated `tsv`
  // column, which has no client-side shape to type here.
  /** ISO 8601 timestamp, when applicable. */
  expiresAt?: string;
  redlineOk: boolean;
}
