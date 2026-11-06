// Rewrite-mode backfill (BACKFILL_MODE=rewrite): re-runs the CURRENT fan-voice
// writer (pass B + writing gate + judge, via composeV2Item) over live rows that
// already carry facts. No pass A and no Haiku call: row.facts is reused as is.
// Never retires and never touches facts; a gate or judge failure leaves the old
// copy untouched. The old copy, facts and score are snapshotted before any write
// (reason backfill_rewrite) and the write is optimistic on the facts hash read at load.

import type { SupabaseClient } from '@supabase/supabase-js';
import { evaluateCurrentItemQuality } from '@swift2/shared';
import { screenTopic } from '@swift2/shared/redline';
import { composeV2Item, DEFERRED_HOLDS, type V2Item } from './v2-stage';
import { createBackfillJudgeStore, createBackfillWriterStore } from './backfill-budget';
import { factsHash, loadRewriteSelection, type RewriteCandidateRow } from './backfill-rewrite-load';
import { guardedRewrite, type RewriteWrite } from './backfill-rewrite-write';
import { markAttempted } from './backfill-force-load';
import { defaultReportDir, writeForceArtifacts, type ForceReportRow } from './backfill-report';
import type { BackfillRunResult, ForceDeps, ForceOutcome, ForceSummary, RunBackfillOptions } from './backfill-types';
import type { ClusterSource } from './write-knowledge';

const WITHHELD = '[withheld: redline]';
const WRITE_FAILURES: readonly ForceOutcome[] = ['snapshot_failed', 'write_failed', 'skipped_changed', 'concurrent_change'];

const screensClean = (strings: readonly string[]): boolean => strings.every((s) => !s || !screenTopic(s));

interface RowResult { report: ForceReportRow; write?: RewriteWrite; deferred?: true }

async function rewriteRow(
  row: RewriteCandidateRow,
  db: SupabaseClient,
  compose: NonNullable<ForceDeps['compose']>,
  stores: NonNullable<ForceDeps['stores']>,
): Promise<RowResult> {
  const base: ForceReportRow = {
    id: row.id, headline: row.headline, oldSummary: row.summary, oldDetail: row.detail,
    newLead: null, newBody: null, facts: row.facts, citations: [], paragraphs: [], gateReasons: [], judgeScores: null,
    outcome: 'rewrite_failed:unknown', holdReason: null,
  };
  const fail = (reason: string, extra: Partial<ForceReportRow> = {}): RowResult => ({
    report: { ...base, ...extra, outcome: `rewrite_failed:${reason}`, holdReason: reason },
  });
  const sources: ClusterSource[] = (row.sources ?? []).map((s) => ({ outletName: s.name, url: s.url, tier: s.tier }));
  const item: V2Item = {
    observedOn: row.observed_on,
    category: row.category as V2Item['category'],
    tags: row.tags ?? [],
    headline: row.headline,
    summary: row.summary,
    detail: row.detail,
    symbols: row.symbols ?? [],
    entities: row.entities ?? [],
    statusHint: row.status as V2Item['statusHint'],
    facts: row.facts,
  };
  const { item: composed, v2, trace } = await compose(db, stores, item, sources, row.era_id, {
    id: row.id, mergedInto: null, url: sources[0]?.url ?? null, observedOn: row.observed_on,
  });
  const withheld = !screensClean([trace.lead ?? '', trace.body ?? '']);
  const traced: Partial<ForceReportRow> = {
    citations: trace.citations ?? [],
    paragraphs: withheld ? [] : trace.paragraphs ?? [],
    gateReasons: trace.gateReasons ?? [],
    judgeScores: trace.judgeScores ?? null,
    newLead: withheld ? WITHHELD : trace.lead ?? null,
    newBody: withheld ? WITHHELD : trace.body ?? null,
  };
  if (v2.holdReason) {
    if (DEFERRED_HOLDS.includes(v2.holdReason)) return { report: { ...base, ...traced, outcome: 'deferred', holdReason: v2.holdReason }, deferred: true };
    return fail(v2.holdReason, traced);
  }
  const { summary: lead, detail: body } = composed;
  const quality = evaluateCurrentItemQuality({
    headline: row.headline, summary: lead, detail: body,
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    redlineOk: screensClean([row.headline, lead, body]),
    facts: row.facts,
    sources: row.sources,
  });
  if (!quality.ok) return fail(`quality:${quality.reason}`, traced);
  return {
    report: { ...base, ...traced, newLead: lead, newBody: body, outcome: 'pass' },
    write: { summary: lead, detail: body, writingScore: v2.writingScore as number },
  };
}

export async function runRewriteBackfill(db: SupabaseClient, options: RunBackfillOptions): Promise<BackfillRunResult> {
  if (options.retireBelowFloor || options.retireUnwritable) {
    throw new Error('rewrite mode never retires: retire_below_floor and retire_unwritable are not allowed with BACKFILL_MODE=rewrite');
  }
  const { dryRun, limit, days, ids } = options;
  const errors: string[] = [];
  const result: BackfillRunResult = {
    considered: 0, rewritten: 0, imagesResolved: 0, nowPassing: 0, stillHeld: 0, deferred: 0, wroteBack: 0, reports: [], errors,
  };
  const compose = options.force?.compose ?? composeV2Item;
  const stores = options.force?.stores ?? { writer: await createBackfillWriterStore(db), judge: await createBackfillJudgeStore(db) };
  const { candidates, unservable } = await loadRewriteSelection(db, limit, new Date(), days, ids);
  const outcomes: Record<string, number> = {};
  const summary: ForceSummary = {
    eligible: candidates.length, processed: 0, passed: 0, held: 0, skippedWriteFailures: 0, skippedUnservable: unservable.length, skippedUnservableReasons: {}, retired: 0,
    duplicateGroups: [], dedupeChecks: 0, dedupeFailed: 0, dedupeIncomplete: false, duplicatesFound: 0, retiredDuplicates: 0, unwritableFound: 0, retiredUnwritable: 0,
    deferred: false, remaining: 0, outcomes,
  };
  for (const { reason } of unservable) summary.skippedUnservableReasons[reason] = (summary.skippedUnservableReasons[reason] ?? 0) + 1;
  if (unservable.length > 0) outcomes['skipped_unservable'] = unservable.length;
  const rows: ForceReportRow[] = [];

  for (const [index, row] of candidates.entries()) {
    result.considered++;
    const loadedHash = factsHash(row.facts);
    let res: RowResult;
    try {
      res = await rewriteRow(row, db, compose, stores);
    } catch (err) {
      errors.push(`rewrite backfill failed for ${row.id}: ${(err as Error).message}`);
      if (!dryRun) await markAttempted(db, row.id);
      continue;
    }
    if (res.deferred) {
      summary.deferred = true;
      summary.remaining = candidates.length - index;
      result.deferred++;
      break;
    }
    if (res.write && !dryRun) {
      const written = await guardedRewrite(db, row.id, loadedHash, res.write);
      if (written.outcome === 'pass') result.wroteBack++;
      else {
        if (written.error) errors.push(`${written.outcome} for ${row.id}: ${written.error}`);
        res.report = { ...res.report, outcome: written.outcome, holdReason: written.error ?? written.outcome };
      }
    }
    if (!dryRun) {
      const failure = await markAttempted(db, row.id);
      if (failure) errors.push(`backfill_attempted_at not set for ${row.id}: ${failure}`);
    }
    summary.processed++;
    outcomes[res.report.outcome] = (outcomes[res.report.outcome] ?? 0) + 1;
    if (res.report.outcome === 'pass') { summary.passed++; result.nowPassing++; result.rewritten++; }
    else if (WRITE_FAILURES.includes(res.report.outcome)) summary.skippedWriteFailures++;
    else { summary.held++; result.stillHeld++; }
    rows.push(res.report);
  }

  result.force = summary;
  writeForceArtifacts(options.reportDir ?? defaultReportDir(), rows, [], summary, dryRun);
  return result;
}
