// News-pipeline domain types. Portable, zero I/O.
//
// STATUS: groundwork for the post-v1 News/Current world (see
// docs/proposals/2026-07-07-news-pipeline-architecture.md). Nothing on the
// Vault's runtime path imports this module — News and Vault are separate data
// worlds (docs/decisions.md, 2026-07-02). Exposed only via the
// `@swift2/shared/news` subpath, never the root barrel.
//
// Category/tier/verification enums below were product-decided 2026-07-18
// (Joey, on #468) — reuse the Vault's 7 categories, mirror the proposal's §5
// tier/verification design. Keep these in sync with the CHECK constraints in
// supabase/migrations/20260718120000_news_init.sql by hand; there's no
// generated-types step for this yet.

/** Same 7 categories as the Vault's month_item.category (Joey, 2026-07-18: one taxonomy site-wide). */
export const NEWS_CATEGORIES = [
  'sighting',
  'fashion',
  'relationship',
  'tour',
  'business',
  'music',
  'release',
] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

/** Source credibility tier — the base signal for verification_status (proposal §5.1). */
export const SOURCE_TIERS = ['official', 'established', 'fan', 'unverified'] as const;
export type SourceTier = (typeof SOURCE_TIERS)[number];

/** Pure function of a story's tier-weighted corroboration (proposal §5.2). */
export const VERIFICATION_STATUSES = [
  'official',
  'corroborated',
  'single_source',
  'rumor',
  'disputed',
  'debunked',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/**
 * Ingestion adapter types this worker can be configured with. Keep in sync
 * by hand with news_source's source_type CHECK constraint — `reddit_rss`,
 * `tumblr`, `gnews` added by the 20260901010000 migration (PLAN.md Stage 6).
 */
export const SOURCE_TYPES = [
  'rss',
  'reddit',
  'x',
  'youtube',
  'bluesky',
  'google_news',
  'reddit_rss',
  'tumblr',
  'gnews',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/**
 * A normalized item produced by a source adapter, before persistence.
 * Titles/snippets/links/metadata ONLY — never article bodies, images are
 * hotlinked URLs (standing rule, docs/architecture.md). Shape proven in
 * production by the sibling Orbit project.
 */
export interface NormalizedNewsItem {
  /** Stable id within its source; (source, externalId) dedupes on ingest. */
  externalId: string;
  /** Canonical link out to the original — we never reproduce bodies. */
  url: string;
  title: string;
  /** Short teaser only — never a full article body. */
  snippet?: string;
  author?: string;
  /** ISO 8601 timestamp, if the source provides one. */
  publishedAt?: string;
  /** Candidate hotlinked image for the eventual story's top image. */
  imageUrl?: string;
  /**
   * The outlet that actually published this, when the feed reports it
   * separately from the feed itself — Google News RSS carries
   * `<source url="…">Forbes</source>` on every item.
   *
   * Load-bearing for corroboration, not just attribution: story sources are
   * deduped by outlet name, so attributing everything to the feed capped every
   * story at one source row and made `corroborated` unreachable. Undefined for
   * feeds published by the outlet itself, where the source name is already the
   * publisher.
   */
  publisher?: string;
  /** Publisher's own domain as reported by the feed, e.g. https://www.forbes.com. */
  publisherUrl?: string;
}

/**
 * Everything a similarity provider needs about an item to compute a
 * signature — title-only providers (lexical) ignore the extra fields;
 * cross-outlet providers need url/snippet/publishedAt too (canonical URL
 * match, cheap-embedding cosine within a time window, entity+date overlap).
 */
export interface SimilarityInput {
  title: string;
  snippet?: string;
  url?: string;
  publishedAt?: string;
}

/**
 * Similarity provider contract for dedup clustering. Two implementations:
 * `LexicalSimilarityProvider` (title-only shingle Jaccard, still used for
 * same-outlet near-duplicate titles) and `CrossOutletSimilarityProvider`
 * (canonical URL / cheap-embedding cosine / entity+date — proposal §4.1).
 */
export interface SimilarityProvider {
  readonly name: string;
  /**
   * Compute a canonical similarity signature for an item. `subjectTerms`
   * (e.g. "Taylor Swift") are stripped — every story mentions the subject, so
   * those tokens carry no clustering signal.
   */
  computeKey(item: SimilarityInput, subjectTerms?: string[]): string;
  /** Similarity of two signatures in [0, 1]. */
  similarity(keyA: string, keyB: string): number;
}
