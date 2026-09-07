// Community Engine domain types (proposal
// docs/proposals/2026-09-06-community-engine-plan.md §5, Phase 0 card P0-1).
// Portable, zero I/O — mirrors
// `supabase/migrations/20260917000000_community_engine.sql` by hand by
// design (same convention as `current-types.ts` mirroring the knowledge-
// engine migration, and `news/news-types.ts` mirroring `news_init.sql`).
//
// Deliberately NOT re-exported from the package's root barrel (`./index`).
// These rows are service-role only (RLS: no anon/authenticated policy —
// see the migration's RLS section) — leads and drafts never reach the
// browser except through the HMAC-signed ack route (Phase 1 P1-5). Exposed
// via the `@swift2/shared/community` subpath instead, consumed by the
// Node scripts under `scripts/community/*.mjs` and the Answerer desk
// runner, not by web/mobile (same boundary reasoning as
// `news/news-types.ts`).

/** `community_watchlist.platform` / `engagement_lead.platform`. */
export const COMMUNITY_PLATFORMS = ['reddit', 'facebook'] as const;
export type CommunityPlatform = (typeof COMMUNITY_PLATFORMS)[number];

/** `engagement_lead.kind`. */
export const ENGAGEMENT_LEAD_KINDS = ['alert', 'digest', 'hot_thread', 'reply_to_us'] as const;
export type EngagementLeadKind = (typeof ENGAGEMENT_LEAD_KINDS)[number];

/** `engagement_lead.status`. `skipped_by_founder` is P1-5's ack-route outcome
 * (a human saw the finished draft and chose not to post it) — distinct from
 * the Answerer desk's pre-draft `skipped_redline`/`skipped_low_relevance`
 * (supabase/migrations/20260918000000_community_ack.sql). */
export const ENGAGEMENT_LEAD_STATUSES = [
  'new',
  'drafted',
  'emailed',
  'posted',
  'skipped_redline',
  'skipped_low_relevance',
  'skipped_by_founder',
] as const;
export type EngagementLeadStatus = (typeof ENGAGEMENT_LEAD_STATUSES)[number];

/** `fan_theory_candidate.predicts`. */
export const FAN_THEORY_PREDICTS = [
  'release',
  're-record',
  'setlist',
  'feature',
  'title',
  'date',
  'other',
] as const;
export type FanTheoryPredicts = (typeof FAN_THEORY_PREDICTS)[number];

/** `fan_theory_candidate.stance` — fan-side confidence, not ours. */
export const FAN_THEORY_STANCES = ['believed', 'contested', 'debunked_by_fans'] as const;
export type FanTheoryStance = (typeof FAN_THEORY_STANCES)[number];

/** `fan_theory_candidate.status` — the pipeline state (§3.3). */
export const FAN_THEORY_CANDIDATE_STATUSES = [
  'candidate',
  'accepted',
  'merged',
  'rejected',
] as const;
export type FanTheoryCandidateStatus = (typeof FAN_THEORY_CANDIDATE_STATUSES)[number];

/** A subreddit or Facebook group the engagement/crawl engines watch (§5). */
export interface CommunityWatchlistEntry {
  /** 'reddit:<sub>' | 'facebook:<group-slug>'. */
  id: string;
  platform: CommunityPlatform;
  name: string;
  /** Daily hot-thread scan (E2/E4). */
  scan: boolean;
  /** Yearly corpus crawl (C1). */
  crawl: boolean;
  /** Per-sub self-promo rule, human-set (§6.5 etiquette gate). Undefined until P0-2 verifies it. */
  allowsLinks?: boolean;
  notes?: string;
}

/**
 * A candidate reply the Answerer desk drafted for a human to paste
 * (§2.5). Never auto-posted — the "human always posts" rule (plan header).
 */
export interface EngagementLead {
  id: string;
  platform: CommunityPlatform;
  community: string;
  kind: EngagementLeadKind;
  /** Reddit t3_ id; undefined for Facebook. */
  threadId?: string;
  /** Public permalink; undefined for Facebook. */
  url?: string;
  /** Facebook: group + first 80 chars of post text — how Joey finds it again. */
  locator?: string;
  title?: string;
  /** Our-words summary; NEVER a raw comment/post body (§6.3). */
  context?: string;
  /** 0-1, best-matching knowledge_doc's rank x specificity (§2.5). */
  relevance?: number;
  matchedDocIds: string[];
  targetUrl?: string;
  draft?: string;
  draftAlt?: string;
  linkIncluded?: boolean;
  status: EngagementLeadStatus;
  redlineOk: boolean;
  /** ISO 8601 timestamps. */
  createdAt?: string;
  emailedAt?: string;
  postedAt?: string;
}

/** The "did we already comment" truth (§2.6) — E2 dedupes against this. */
export interface CommunityPostLedgerEntry {
  id: string;
  leadId?: string;
  platform: CommunityPlatform;
  community: string;
  threadId?: string;
  commentTarget?: string;
  linkIncluded: boolean;
  /** ISO 8601 timestamp. */
  postedAt: string;
  postedBy?: string;
}

/** A theory extracted from the year-deep crawl, pre-promotion (§3.3). */
export interface FanTheoryCandidate {
  id: string;
  /** <=200 chars, our words, never a quote. */
  claim: string;
  /** Slug — dedupes across threads, e.g. "1989-tv-vault-track-count". */
  theoryKey: string;
  /** Same vocabulary as `egg_ledger.mechanism`. */
  mechanism?: string;
  symbols: string[];
  eraId?: string;
  trackSlug?: string;
  predicts?: FanTheoryPredicts;
  /** ISO date (YYYY-MM-DD). */
  predictedDate?: string;
  /** 1-2 sentences, aggregate fan voice. */
  evidenceSummary?: string;
  /** ISO dates (YYYY-MM-DD). */
  firstSeenOn: string;
  lastSeenOn: string;
  mentionCount: number;
  peakScore: number;
  communities: string[];
  /** Fan-side confidence, not ours. */
  stance: FanTheoryStance;
  status: FanTheoryCandidateStatus;
  /** screenTopic() result; never true into the store on a redline hit. */
  redlineOk: boolean;
  /** <=3 public permalinks; empty for Facebook. */
  sampleUrls: string[];
  /** ISO 8601 timestamps. */
  createdAt?: string;
  updatedAt?: string;
}
