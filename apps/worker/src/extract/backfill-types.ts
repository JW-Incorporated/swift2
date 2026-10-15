import type { BackfillItemReport } from './backfill';

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
}

export interface RunBackfillOptions {
  dryRun: boolean;
  limit?: number;
  fetchImpl?: typeof fetch;
}
