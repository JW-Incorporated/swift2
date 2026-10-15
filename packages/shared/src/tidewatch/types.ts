/** JSON values returned by PostgREST for Tidewatch decision answers. */
export type TidewatchJson =
  null | boolean | number | string | TidewatchJson[] | { [key: string]: TidewatchJson };

export interface WatchItemRow {
  id: string;
  item_key: string;
  source: string;
  source_ref: string | null;
  url_norm_hash: string | null;
  /** PostgreSQL bit(64), serialized as a 64-character bit string. */
  title_simhash: string | null;
  story_id: string | null;
  first_seen_at: string;
  last_seen_at: string;
  seen_count: number;
  excerpt: string | null;
  status: string;
}

export interface WatchDecisionRow {
  id: string;
  /** Null only after the retained decision's expired watch item is deleted. */
  item_id: string | null;
  class: string;
  confidence: number;
  decider: string;
  model_id: string | null;
  answers: TidewatchJson;
  action: string;
  action_ref: string | null;
  shadow: boolean;
  decided_at: string;
}

export interface WatchCursorRow {
  source: string;
  cursor: string;
}

export interface StoryTimelineRow {
  story_id: string;
  first_public_at: string | null;
  detected_at: string | null;
  classified_at: string | null;
  verified_at: string | null;
  on_site_at: string | null;
  social_at: string | null;
  push_at: string | null;
}

export type LlmUsageProvider = 'jev' | 'claude';
export type LlmUsageToken = 'primary' | 'backup' | null;

export interface LlmUsageRow {
  id: string;
  caller: string;
  provider: LlmUsageProvider;
  model: string;
  token: LlmUsageToken;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  calls: number;
  est_cost_usd: number | null;
  created_at: string;
}
