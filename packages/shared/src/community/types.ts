import type { CommunityPlatform } from '../community';

export const COMMUNITY_OUTCOME_HORIZONS = ['1h', '24h', '7d'] as const;
export type CommunityOutcomeHorizon = (typeof COMMUNITY_OUTCOME_HORIZONS)[number];

/** Nullable engagement fields added to an `engagement_lead` row. */
export interface EngagementLeadMetrics {
  score: number | null;
  num_comments: number | null;
  reactions: number | null;
  thread_created_at: string | null;
  velocity: number | null;
  rank_score: number | null;
  last_scored_at: string | null;
}

/** Outcome-tracking field added to a `community_post_ledger` row. */
export interface CommunityPostLedgerOutcomeFields {
  comment_url: string | null;
}

/** One measured horizon for a comment posted by the owner. */
export interface CommunityOutcomeRow {
  post_ledger_id: string;
  platform: CommunityPlatform;
  comment_url: string | null;
  comment_id: string | null;
  score: number | null;
  replies: number | null;
  horizon: CommunityOutcomeHorizon;
  checked_at: string;
}
