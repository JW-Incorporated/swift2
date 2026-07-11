// News-pipeline domain types. Portable, zero I/O.
//
// STATUS: dormant groundwork for the post-v1 News/Current world (see
// docs/proposals/2026-07-07-news-pipeline-architecture.md). Nothing on the
// Vault's runtime path imports this module — News and Vault are separate data
// worlds (docs/decisions.md, 2026-07-02). Exposed only via the
// `@swift2/shared/news` subpath, never the root barrel.
//
// Deliberately EXCLUDED here (product decisions, not yet made): news category
// enums, importance rubrics, source types, credibility tiers. Only the
// pipeline-mechanic shapes that any aggregator needs live here.

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
}

/**
 * Similarity provider contract for dedup clustering. The default (and so far
 * only) implementation is lexical (free, deterministic); an embedding-based
 * provider could slot in behind the same interface if evidence ever demands it.
 */
export interface SimilarityProvider {
  readonly name: string;
  /**
   * Compute a canonical similarity signature for a title. `subjectTerms`
   * (e.g. "Taylor Swift") are stripped — every story mentions the subject, so
   * those tokens carry no clustering signal.
   */
  computeKey(title: string, subjectTerms?: string[]): string;
  /** Similarity of two signatures in [0, 1]. */
  similarity(keyA: string, keyB: string): number;
}
