// The extract stage's own domain types (proposal docs/proposals/2026-08-23-
// knowledge-engine.md §4.5, PLAN.md Stage 3) — the shape of the forced
// `record_knowledge` tool call, distinct from `@swift2/shared`'s
// `CurrentItem`/`FanSignal`/`LiveTheory` row types (those are what gets
// WRITTEN to the DB; these are what the MODEL reports, before write-
// knowledge.ts turns it into a row with real citations/ids/expiry).

import type { CurrentItemCategory, CurrentItemStatus, LocationLevel } from '@swift2/shared';

export const RECORD_KNOWLEDGE_KINDS = ['current_item', 'fan_signal', 'both', 'skip'] as const;
export type RecordKnowledgeKind = (typeof RECORD_KNOWLEDGE_KINDS)[number];

export const SKIP_REASONS = ['not_taylor', 'no_truth_value', 'redline', 'duplicate', 'stale'] as const;
export type SkipReason = (typeof SKIP_REASONS)[number];

/** The model's report of one observable event. Not yet a DB row — no id,
 * no real `sources` citations (those come from the cluster's own raw items,
 * never the model, per the "never invent a source" rule). */
export interface ExtractedCurrentItem {
  observedOn: string;
  category: CurrentItemCategory;
  tags: string[];
  headline: string;
  summary: string;
  detail: string;
  symbols: string[];
  entities: string[];
  locationLevel?: LocationLevel;
  statusHint: CurrentItemStatus;
}

export interface ExtractedTheory {
  name: string;
  claim: string;
}

export interface ExtractedFanSignal {
  topic: string;
  summary: string;
  stanceMix: Record<string, unknown>;
  symbols: string[];
  theories: ExtractedTheory[];
}

/** Transient Reddit context for one post in a cluster. Comment authors and
 * ids are deliberately omitted: the model only needs bodies to identify an
 * aggregate discussion pattern, never an individual commenter. */
export interface ExtractCommentThread {
  postTitle: string;
  comments: readonly string[];
}

/** The exact `record_knowledge` tool output shape (proposal §4.5). */
export interface RecordKnowledgeResult {
  kind: RecordKnowledgeKind;
  skipReason?: SkipReason;
  currentItem?: ExtractedCurrentItem;
  fanSignal?: ExtractedFanSignal;
  redlineFlags: string[];
}
