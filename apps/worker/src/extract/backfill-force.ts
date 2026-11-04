// Force-mode backfill (docs/decisions.md 2026-11-03 §5): every row the live
// feed shows (same visibility filter and window as getCurrentItems) without facts goes through the SAME v2 pipeline the live
// extract stage uses (pass A facts, worth-a-post floor, Sonnet writer, writing
// gate, judge, one rewrite). The old copy is snapshotted before any write.
// A dry run writes no current_item or snapshot rows; LLM budget rows in usage_daily are still incremented.
// OUT OF SCOPE: same-event dedupe of backfill rows against each other.

import type { SupabaseClient } from '@supabase/supabase-js';
import { evaluateCurrentItemQuality } from '@swift2/shared';
import { screenTopic } from '@swift2/shared/redline';
import { fetchTopArticleTexts } from '../sources/fetch-article-text';
import { extractWithLLM } from './haiku-client';
import {
  composeV2Item, createJudgeStore, createWriterStore, DEFERRED_HOLDS, hasFacts, tierFloorHold, type V2Item,
} from './v2-stage';
import { ExtractUsageStore, supabaseExtractUsageDb } from './usage-store';
import { buildUserMessage } from './writer-client';
import { retireBelowFloor } from './backfill-retire';
import { loadForceCandidates, markAttempted, type ForceCandidateRow } from './backfill-force-load';
import { defaultReportDir, kitIdFor, writeForceArtifacts, type ForceReportRow, type WriterEvalKitRow } from './backfill-report';
import type { BackfillRunResult, ForceDeps, ForceOutcome, ForceSummary, RunBackfillOptions } from './backfill-types';
import type { ClusterSource } from './write-knowledge';
import type { ExtractedFact } from './types';

const WITHHELD = '[withheld: redline]';

export { loadForceCandidates, type ForceCandidateRow };
function screensClean(strings: readonly string[]): boolean {
  return strings.every((s) => !s || !screenTopic(s));
}

interface RowResult {
  report: ForceReportRow;
  kit?: WriterEvalKitRow;
  deferred?: true;
  retire?: true;
  write?: { summary: string; detail: string; facts: ExtractedFact[]; writingScore: number };
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

const SKIPPED_OUTCOMES: readonly ForceOutcome[] = ['snapshot_failed', 'write_failed', 'skipped_changed'];

/** Re-reads the row, snapshots the re-read copy, then updates only while the row is still unchanged. */
async function guardedWrite(
  db: SupabaseClient,
  id: string,
  write: NonNullable<RowResult['write']>,
): Promise<{ outcome: ForceOutcome; error?: string }> {
  const { data: fresh, error: readError } = await db.from('current_item')
    .select('id,headline,summary,detail,facts,merged_into,retracted_at,promoted_to')
    .eq('id', id)
    .maybeSingle();
  if (readError) return { outcome: 'write_failed', error: readError.message };
  if (!fresh || fresh.facts != null || fresh.merged_into || fresh.retracted_at || fresh.promoted_to) return { outcome: 'skipped_changed' };
  const { error: snapshotError } = await db.from('current_item_copy_snapshot').insert({
    current_item_id: id, headline: fresh.headline, summary: fresh.summary, detail: fresh.detail, facts: null, reason: 'backfill_v2',
  });
  if (snapshotError) return { outcome: 'snapshot_failed', error: snapshotError.message };
  const { data: updated, error: updateError } = await db.from('current_item')
    .update({ summary: write.summary, detail: write.detail, facts: write.facts, writing_score: write.writingScore })
    .eq('id', id)
    .is('facts', null)
    .is('merged_into', null)
    .is('retracted_at', null)
    .is('promoted_to', null)
    .select('id');
  if (updateError) return { outcome: 'write_failed', error: updateError.message };
  if (!updated || updated.length === 0) return { outcome: 'skipped_changed' };
  return { outcome: 'pass' };
}

export async function runForceBackfill(db: SupabaseClient, options: RunBackfillOptions): Promise<BackfillRunResult> {
  const { dryRun, limit, days, retireBelowFloor: retireFloor = false, fetchImpl = fetch } = options;
  const errors: string[] = [];
  const result: BackfillRunResult = {
    considered: 0, rewritten: 0, imagesResolved: 0, nowPassing: 0, stillHeld: 0, deferred: 0, wroteBack: 0, reports: [], errors,
  };
  const deps = {
    extract: options.force?.extract ?? extractWithLLM,
    compose: options.force?.compose ?? composeV2Item,
    fetchArticles: options.force?.fetchArticles ?? fetchTopArticleTexts,
    usage: options.force?.usage ?? await ExtractUsageStore.create(supabaseExtractUsageDb(db)),
    stores: options.force?.stores ?? { writer: await createWriterStore(db), judge: await createJudgeStore(db) },
  };
  const candidates = await loadForceCandidates(db, limit, new Date(), days);
  const today = new Date().toISOString().slice(0, 10);
  const rows: ForceReportRow[] = [];
  const kit: WriterEvalKitRow[] = [];
  const outcomes: Record<string, number> = {};
  const summary: ForceSummary = {
    eligible: candidates.length, processed: 0, passed: 0, held: 0, skippedWriteFailures: 0, retired: 0, deferred: false, remaining: 0, outcomes,
  };
  const tally = (outcome: string): void => { outcomes[outcome] = (outcomes[outcome] ?? 0) + 1; };

  /** Every attempted row is stamped whatever its outcome (not on a dry run, not on a budget deferral, which learned nothing). */
  const mark = async (id: string): Promise<void> => {
    if (dryRun) return;
    const failure = await markAttempted(db, id);
    if (failure) errors.push(`backfill_attempted_at not set for ${id}: ${failure}`);
  };

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
    if (res.retire && retireFloor && !dryRun) {
      const retired = await retireBelowFloor(db, row.id);
      if (retired.outcome === 'retired_below_floor') {
        summary.retired++;
        res.report = { ...res.report, outcome: 'retired_below_floor' };
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
