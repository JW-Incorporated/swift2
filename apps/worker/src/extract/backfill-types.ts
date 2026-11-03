import type { BackfillItemReport } from './backfill';
import type { extractWithLLM } from './haiku-client';
import type { fetchTopArticleTexts } from '../sources/fetch-article-text';
import type { composeV2Item } from './v2-stage';
import type { ExtractUsageStore } from './usage-store';

export type BackfillMode = 'floors' | 'force';

export type ForceOutcome =
  | 'pass'
  | 'below_tier_floor'
  | 'writing_hold'
  | 'no_facts'
  | 'snapshot_failed'
  | 'write_failed'
  | 'skipped_changed'
  | 'deferred';

export interface ForceSummary {
  eligible: number;
  processed: number;
  passed: number;
  held: number;
  skippedWriteFailures: number;
  deferred: boolean;
  remaining: number;
  outcomes: Record<string, number>;
}

export interface BackfillRunResult {
  considered: number;
  rewritten: number;
  imagesResolved: number;
  nowPassing: number;
  stillHeld: number;
  deferred: number;
  wroteBack: number;
  reports: BackfillItemReport[];
  errors: string[];
  force?: ForceSummary;
}

/** Test seams for force mode; production leaves every field unset. */
export interface ForceDeps {
  extract?: typeof extractWithLLM;
  compose?: typeof composeV2Item;
  fetchArticles?: typeof fetchTopArticleTexts;
  usage?: ExtractUsageStore;
  stores?: { writer: ExtractUsageStore; judge: ExtractUsageStore };
}

export interface RunBackfillOptions {
  dryRun: boolean;
  limit?: number;
  fetchImpl?: typeof fetch;
  /** 'floors' (default) is the original thin-copy backfill; 'force' rewrites every eligible recent row through the v2 writer. */
  mode?: BackfillMode;
  /** Force mode writes backfill-report.jsonl/.md and writer-eval-kit.jsonl here. */
  reportDir?: string;
  force?: ForceDeps;
}
