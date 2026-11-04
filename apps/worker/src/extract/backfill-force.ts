// Force-mode backfill (docs/decisions.md 2026-11-03 §5): every row the live
// feed shows (same visibility filter and window as getCurrentItems) without facts goes through the SAME v2 pipeline the live
// extract stage uses (pass A facts, worth-a-post floor, Sonnet writer, writing
// gate, judge, one rewrite). The old copy is snapshotted before any write.
// A dry run writes no current_item or snapshot rows; LLM budget rows in usage_daily are still incremented.
// Rows are processed first, then grouped by same event (backfill-dedupe.ts), then written or retired.

import type { SupabaseClient } from '@supabase/supabase-js';
import { evaluateCurrentItemQuality } from '@swift2/shared';
import { screenTopic } from '@swift2/shared/redline';
import { fetchTopArticleTexts } from '../sources/fetch-article-text';
import { extractWithLLM } from './haiku-client';
import {
  composeV2Item, DEFERRED_HOLDS, hasFacts, tierFloorHold, type V2Item,
} from './v2-stage';
import { ExtractUsageStore, supabaseExtractUsageDb } from './usage-store';
import { buildUserMessage } from './writer-client';
import { RETIRE_BELOW_FLOOR, RETIRE_DUPLICATE, RETIRE_UNWRITABLE, retireRow, type RetireKind } from './backfill-retire';
import { createDedupeUsage, dedupeEntry, planDuplicates } from './backfill-dedupe';
import { createBackfillJudgeStore, createBackfillWriterStore } from './backfill-budget';
import { guardedWrite, SKIPPED_OUTCOMES, type RowResult } from './backfill-force-write';
import { loadForceCandidates, loadForceSelection, markAttempted, type ForceCandidateRow } from './backfill-force-load';
import { defaultReportDir, kitIdFor, writeForceArtifacts, type ForceReportRow, type WriterEvalKitRow } from './backfill-report';
import type { BackfillRunResult, ForceDeps, ForceOutcome, ForceSummary, RunBackfillOptions } from './backfill-types';
import type { ClusterSource } from './write-knowledge';

const WITHHELD = '[withheld: redline]';

export { loadForceCandidates, type ForceCandidateRow };
function screensClean(strings: readonly string[]): boolean {
  return strings.every((s) => !s || !screenTopic(s));
}

async function processRow(
  row: ForceCandidateRow,
  db: SupabaseClient,
  deps: Required<Pick<ForceDeps, 'extract' | 'compose' | 'fetchArticles' | 'usage' | 'stores'>>,
  fetchImpl: typeof fetch,
  today: string,
): Promise<RowResult> {
  const base: ForceReportRow = {
    id: row.id, headline: row.headline, oldSummary: row.summary, oldDetail: row.detail,
    newLead: null, newBody: null, facts: [], citations: [], paragraphs: [], gateReasons: [], judgeScores: null,
    outcome: 'writing_hold', holdReason: null,
  };
  const hold = (outcome: ForceOutcome, holdReason: string, extra: Partial<ForceReportRow> = {}): RowResult => ({
    report: { ...base, ...extra, outcome, holdReason },
  });
  const sources: ClusterSource[] = (row.sources ?? []).map((s) => ({ outletName: s.name, url: s.url, tier: s.tier }));

  const articleTexts = await deps.fetchArticles(
    sources.map((s) => ({ url: s.url, tier: s.tier, outletName: s.outletName })),
    fetchImpl,
  );
  const extracted = await deps.extract(deps.usage, {
    items: [{ title: row.headline, snippet: `${row.summary}\n\n${row.detail}` }],
    ...(articleTexts.length > 0 ? { articleTexts } : {}),
    symbolLexiconKeys: [],
    eraId: row.era_id,
    today,
  });
  if (extracted === null) return { ...hold('deferred', 'extract_deferred'), deferred: true };
  const current = extracted.currentItem;
  if (!current || !hasFacts(current)) return hold('no_facts', 'pass_a_no_facts');

  const item: V2Item = { ...current, headline: row.headline, facts: current.facts };
  const floor = tierFloorHold(item, sources);
  if (floor) return { ...hold('below_tier_floor', floor.holdReason ?? 'below_tier_floor', { facts: item.facts }), retire: true };

  const composed = await deps.compose(db, deps.stores, item, sources, row.era_id, {
    id: row.id,
    mergedInto: null,
    url: sources[0]?.url ?? null,
    observedOn: row.observed_on,
  });
  const { trace, v2 } = composed;
  const withheld = !screensClean([trace.lead ?? '', trace.body ?? '']);
  const shownLead = withheld ? WITHHELD : trace.lead;
  const shownBody = withheld ? WITHHELD : trace.body;
  const shownParagraphs = withheld ? [] : trace.paragraphs ?? [];
  const draft = shownLead && shownBody ? { lead: shownLead, body: shownBody, citations: trace.citations ?? [], paragraphs: shownParagraphs } : null;
  const kit: WriterEvalKitRow = {
    kitId: kitIdFor(row.id),
    headline: row.headline,
    category: row.category,
    sourceTier: row.source_tier ?? 'unknown',
    observedOn: item.observedOn,
    statusHint: item.statusHint,
    facts: item.facts.map(({ id, claim, attribution, confidence }) => ({ id, claim, attribution, confidence })),
    contextText: composed.context.text,
    userMessage: buildUserMessage({ headline: row.headline, statusHint: item.statusHint, facts: item.facts, context: composed.context }),
    sonnetDraft: draft,
  };
  const traced: Partial<ForceReportRow> = {
    facts: item.facts,
    citations: trace.citations ?? [],
    paragraphs: shownParagraphs,
    gateReasons: trace.gateReasons ?? [],
    judgeScores: trace.judgeScores ?? null,
    newLead: shownLead ?? null,
    newBody: shownBody ?? null,
  };
  if (v2.holdReason) {
    if (DEFERRED_HOLDS.includes(v2.holdReason)) return { ...hold('deferred', v2.holdReason, traced), kit, deferred: true };
    return { ...hold('writing_hold', v2.holdReason, traced), kit };
  }
  const { summary: lead, detail: body } = composed.item;
  const quality = evaluateCurrentItemQuality({
    headline: row.headline, summary: lead, detail: body,
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    redlineOk: screensClean([row.headline, lead, body]),
    facts: item.facts,
    sources: row.sources,
  });
  if (!quality.ok) return { ...hold('writing_hold', `quality:${quality.reason}`, traced), kit };
  return {
    report: { ...base, ...traced, newLead: lead, newBody: body, outcome: 'pass' },
    kit,
    write: { summary: lead, detail: body, facts: item.facts, writingScore: v2.writingScore as number },
  };
}

export async function runForceBackfill(db: SupabaseClient, options: RunBackfillOptions): Promise<BackfillRunResult> {
  const { dryRun, limit, days, retireBelowFloor: retireFloor = false, retireUnwritable = false, fetchImpl = fetch } = options;
  const errors: string[] = [];
  const result: BackfillRunResult = {
    considered: 0, rewritten: 0, imagesResolved: 0, nowPassing: 0, stillHeld: 0, deferred: 0, wroteBack: 0, reports: [], errors,
  };
  const deps = {
    extract: options.force?.extract ?? extractWithLLM,
    compose: options.force?.compose ?? composeV2Item,
    fetchArticles: options.force?.fetchArticles ?? fetchTopArticleTexts,
    usage: options.force?.usage ?? await ExtractUsageStore.create(supabaseExtractUsageDb(db)),
    stores: options.force?.stores ?? { writer: await createBackfillWriterStore(db), judge: await createBackfillJudgeStore(db) },
  };
  const { candidates, unservable } = await loadForceSelection(db, limit, new Date(), days);
  const today = new Date().toISOString().slice(0, 10);
  const rows: ForceReportRow[] = [];
  const kit: WriterEvalKitRow[] = [];
  const outcomes: Record<string, number> = {};
  const summary: ForceSummary = {
    eligible: candidates.length, processed: 0, passed: 0, held: 0, skippedWriteFailures: 0, skippedUnservable: 0, skippedUnservableReasons: {}, retired: 0,
    duplicateGroups: [], dedupeChecks: 0, dedupeFailed: 0, dedupeIncomplete: false, duplicatesFound: 0, retiredDuplicates: 0, unwritableFound: 0, retiredUnwritable: 0,
    deferred: false, remaining: 0, outcomes,
  };
  const tally = (outcome: string): void => { outcomes[outcome] = (outcomes[outcome] ?? 0) + 1; };
  for (const { reason } of unservable) {
    summary.skippedUnservable++;
    summary.skippedUnservableReasons[reason] = (summary.skippedUnservableReasons[reason] ?? 0) + 1;
  }
  if (summary.skippedUnservable > 0) outcomes['skipped_unservable'] = summary.skippedUnservable;

  /** Every attempted row is stamped whatever its outcome (not on a dry run, not on a budget deferral, which learned nothing). */
  const mark = async (id: string): Promise<void> => {
    if (dryRun) return;
    const failure = await markAttempted(db, id);
    if (failure) errors.push(`backfill_attempted_at not set for ${id}: ${failure}`);
  };

  const done: { row: ForceCandidateRow; res: RowResult }[] = [];
  for (const [index, row] of candidates.entries()) {
    result.considered++;
    let res: RowResult;
    try {
      res = await processRow(row, db, deps, fetchImpl, today);
    } catch (err) {
      errors.push(`force backfill failed for ${row.id}: ${(err as Error).message}`);
      await mark(row.id);
      continue;
    }
    if (res.kit) kit.push(res.kit);
    if (res.deferred) {
      summary.deferred = true;
      summary.remaining = candidates.length - index;
      result.deferred++;
      break;
    }
    done.push({ row, res });
  }

  const plan = await planDuplicates(
    db,
    options.force?.dedupeUsage ?? await createDedupeUsage(candidates.length),
    candidates,
    done.filter(({ res }) => !res.retire).map(({ row, res }) => dedupeEntry(row, res)),
    errors,
    options.force?.sameEvent,
  );
  const losers = plan.losers;
  summary.duplicateGroups = plan.groups;
  summary.dedupeChecks = plan.checks;
  summary.dedupeFailed = plan.failed;
  summary.dedupeIncomplete = plan.incomplete;
  if (plan.incomplete) {
    console.log(`::warning::backfill dedupe incomplete (${plan.failed}/${plan.checks} checks deferred or failed); no duplicates are retired this run`);
  }
  summary.duplicatesFound = losers.size;

  const applyOwnPath = async ({ row, res }: { row: ForceCandidateRow; res: RowResult }): Promise<void> => {
    const unwritable = res.report.outcome === 'no_facts' || res.report.outcome === 'writing_hold';
    let kind: RetireKind | null = null;
    if (unwritable) {
      summary.unwritableFound++;
      if (retireUnwritable) kind = RETIRE_UNWRITABLE;
    } else if (res.retire && retireFloor) kind = RETIRE_BELOW_FLOOR;
    if (kind && !dryRun) {
      const retired = await retireRow(db, row.id, kind);
      if (retired.outcome === kind.outcome) {
        if (kind === RETIRE_BELOW_FLOOR) summary.retired++;
        else summary.retiredUnwritable++;
        res.report = { ...res.report, outcome: kind.outcome };
      } else {
        if (retired.error) errors.push(`${retired.outcome} for ${row.id}: ${retired.error}`);
        res.report = { ...res.report, outcome: retired.outcome, holdReason: retired.error ?? retired.outcome };
      }
    }
    if (res.write && !dryRun) {
      const written = await guardedWrite(db, row.id, res.write);
      if (written.outcome === 'pass') result.wroteBack++;
      else {
        if (written.error) errors.push(`${written.outcome} for ${row.id}: ${written.error}`);
        res.report = { ...res.report, outcome: written.outcome, holdReason: written.error ?? written.outcome };
      }
    }
  };

  // Survivors and every non-duplicate row first; a group's losers are retired only once the survivor's write is a pass.
  for (const entry of done) if (!losers.has(entry.row.id)) await applyOwnPath(entry);
  const finalOutcome = new Map<string, string>(done.map(({ row, res }) => [row.id, res.report.outcome]));
  for (const keep of losers.values()) if (!finalOutcome.has(keep)) finalOutcome.set(keep, 'pass');
  for (const { row, res } of done) {
    const keep = losers.get(row.id);
    if (!keep) continue;
    delete res.write;
    if (finalOutcome.get(keep) !== 'pass') {
      errors.push(`duplicate ${row.id} left untouched: survivor ${keep} ended ${finalOutcome.get(keep)}`);
      res.report = { ...res.report, outcome: 'skipped_changed', holdReason: `survivor_not_written:${keep}` };
      continue;
    }
    res.report = { ...res.report, holdReason: `duplicate_of:${keep}` };
    if (dryRun) { res.report.outcome = 'retired_duplicate'; continue; }
    const retired = await retireRow(db, row.id, RETIRE_DUPLICATE, keep);
    if (retired.outcome === RETIRE_DUPLICATE.outcome) {
      summary.retiredDuplicates++;
      res.report = { ...res.report, outcome: retired.outcome };
    } else {
      if (retired.error) errors.push(`${retired.outcome} for ${row.id}: ${retired.error}`);
      res.report = { ...res.report, outcome: retired.outcome, holdReason: retired.error ?? retired.outcome };
    }
  }
  for (const { row, res } of done) {
    await mark(row.id);
    summary.processed++;
    tally(res.report.outcome);
    if (res.report.outcome === 'pass') { summary.passed++; result.nowPassing++; result.rewritten++; }
    else if (SKIPPED_OUTCOMES.includes(res.report.outcome)) summary.skippedWriteFailures++;
    else { summary.held++; result.stillHeld++; }
    rows.push(res.report);
  }

  result.force = summary;
  writeForceArtifacts(options.reportDir ?? defaultReportDir(), rows, kit, summary, dryRun);
  return result;
}
