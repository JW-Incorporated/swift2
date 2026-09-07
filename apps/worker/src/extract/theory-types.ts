// Theory Miner extract stage's own domain types (Community Engine plan,
// docs/proposals/2026-09-06-community-engine-plan.md §3.3, Phase 2 card
// P2-2). Sibling of ./types.ts — same "model's report, not a DB row yet"
// distinction: `write-knowledge.ts`'s ExtractedTheory/ExtractedCurrentItem
// pattern already establishes that split, this module extends it for the
// crawl corpus rather than reusing ExtractedTheory verbatim, because the
// Theory Miner's forced tool asks for materially more columns
// (`fan_theory_candidate` per §3.3's table: mechanism, predicts,
// predicted_date, evidence_summary, stance) than the live news extract
// stage's lightweight `{ name, claim }` theory shape needs.

import type { FanTheoryPredicts, FanTheoryStance } from '@swift2/shared/community';

export const THEORY_MINER_SKIP_REASONS = ['no_theory', 'redline', 'not_taylor', 'stale'] as const;
export type TheoryMinerSkipReason = (typeof THEORY_MINER_SKIP_REASONS)[number];

/** One post+comment-thread bundle from the C1 crawl artifact (crawl.mjs's
 * `normalizeComments`/`crawlSubreddit` output shape) — comment `author` is
 * already the hashed handle by the time it reaches this stage; never the
 * raw one (crawl.mjs's own header: "Author hashing happens here, not
 * deferred to the Theory Miner (P2-2)"). */
export interface TheoryMinerComment {
  author: string | null;
  body: string | null;
}

export interface TheoryMinerInput {
  subreddit: string;
  postTitle: string;
  postId: string;
  permalink: string;
  comments: readonly TheoryMinerComment[];
  /** symbol_lexicon keys, so the model matches rather than invents one. */
  symbolLexiconKeys: readonly string[];
  /** ISO date (YYYY-MM-DD). */
  today: string;
}

/** The model's report of one theory it found in this post bundle. Not yet a
 * `fan_theory_candidate` row — no id, no real `sample_urls`/`communities`/
 * `mention_count` bookkeeping (those are this stage's own job, computed
 * from the bundle the model never sees in full, per the "never invent a
 * source" rule already established in write-knowledge.ts). */
export interface ExtractedFanTheory {
  /** Short human label, our words. */
  name: string;
  /** <=200 chars, our words, never a quote (fan_theory_candidate.claim). */
  claim: string;
  /** Slug, e.g. "1989-tv-vault-track-count" — dedupes across threads. */
  theoryKey: string;
  /** Same vocabulary as egg_ledger.mechanism (number, color, wardrobe, caption, lyric_callback, ...). */
  mechanism?: string;
  symbols: string[];
  trackSlug?: string;
  predicts?: FanTheoryPredicts;
  /** ISO date (YYYY-MM-DD). */
  predictedDate?: string;
  /** 1-2 sentences, aggregate fan voice — what fans point to, never a quote. */
  evidenceSummary?: string;
  stance: FanTheoryStance;
}

/** The exact `record_fan_theories` tool output shape (proposal §3.3). An
 * empty `theories` array is correct and expected most of the time — most
 * post bundles surface no theory at all. */
export interface RecordFanTheoriesResult {
  theories: ExtractedFanTheory[];
  skipReason?: TheoryMinerSkipReason;
  redlineFlags: string[];
}
