import type { BackfillItemReport } from './backfill';
import type { checkSameEvent } from './dedupe-gate-llm';
import type { extractWithLLM } from './haiku-client';
import type { fetchTopArticleTexts } from '../sources/fetch-article-text';
import type { composeV2Item } from './v2-stage';
import type { ExtractUsageStore } from './usage-store';

export type BackfillMode = 'floors' | 'force' | 'rewrite';

export type ForceOutcome =
  | 'pass'
  | 'below_tier_floor'
  | 'retired_below_floor'
  | 'retired_duplicate'
  | 'retired_unwritable'
  | 'writing_hold'
  | 'no_facts'
  | 'snapshot_failed'
  | 'write_failed'
  | 'skipped_changed'
  | 'concurrent_change'
  | `rewrite_failed:${string}`
  | 'deferred';

export interface ForceSummary {
  eligible: number;
  processed: number;
  passed: number;
  held: number;
  skippedWriteFailures: number;
  /** Visible-by-query rows the read gate hides for a non-copy reason (image, redline): never sent to the writer or judge. */
  skippedUnservable: number;
  skippedUnservableReasons: Record<string, number>;
  /** Below-floor rows hidden by --retire-below-floor (0 on a dry run). */
  retired: number;
  /** Same-event groups found across rows (reported on a dry run too): keep is the surviving row id, null when no member passes. */
  duplicateGroups: { keep: string | null; members: string[]; spanDays: number }[];
  dedupeChecks: number;
  dedupeFailed: number;
  /** More than 10% of dedupe checks were deferred or failed: a live run retires no duplicates. */
  dedupeIncomplete: boolean;
  /** Rows that lost their group (found on any run, retired only on a live run). */
  duplicatesFound: number;
  retiredDuplicates: number;
  /** no_facts / writing_hold rows (found on any run, retired only on a live run with --retire-unwritable). */
  unwritableFound: number;
  retiredUnwritable: number;
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
  sameEvent?: typeof checkSameEvent;
  /** Separate per-run budget for the dedupe checks; production builds an in-memory one (2 x eligible, max 200). */
  dedupeUsage?: ExtractUsageStore;
}

export interface RunBackfillOptions {
  dryRun: boolean;
  limit?: number;
  /** Force mode only: observed_on window in days; unset = the live feed's own window (no cutoff, only unexpired rows). */
  days?: number;
  /** Force mode only: hide rows that fail the worth-a-post floor (quality_hold_reason retired_below_floor). Ignored on a dry run. */
  retireBelowFloor?: boolean;
  /** Force mode only: hide rows ending no_facts or writing_hold after the one rewrite (quality_hold_reason retired_unwritable). Ignored on a dry run. */
  retireUnwritable?: boolean;
  fetchImpl?: typeof fetch;
  /** Rewrite mode only: operator-picked current_item ids (UUIDs); unset = every live row that has facts. */
  ids?: string[];
  /** 'floors' (default) is the original thin-copy backfill; 'force' rewrites every eligible recent row through the v2 writer; 'rewrite' re-runs the writer on live rows that already have facts (never retires). */
  mode?: BackfillMode;
  /** Force mode writes backfill-report.jsonl/.md and writer-eval-kit.jsonl here. */
  reportDir?: string;
  force?: ForceDeps;
}
