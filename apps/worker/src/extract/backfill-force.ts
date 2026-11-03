// Force-mode backfill (docs/decisions.md 2026-11-03 §5): every visible,
// recent current_item without facts goes through the SAME v2 pipeline the live
// extract stage uses (pass A facts, worth-a-post floor, Sonnet writer, writing
// gate, judge, one rewrite). The old copy is snapshotted before any write.
// OUT OF SCOPE: same-event dedupe of backfill rows against each other.

import type { SupabaseClient } from '@supabase/supabase-js';
import { evaluateCurrentItemQuality, passesCurrentItemQualityGate } from '@swift2/shared';
import { screenTopic } from '@swift2/shared/redline';
import type { SourceTier } from '@swift2/shared/news';
import { fetchTopArticleTexts } from '../sources/fetch-article-text';
import { extractWithLLM } from './haiku-client';
import {
  composeV2Item, createJudgeStore, createWriterStore, DEFERRED_HOLDS, hasFacts, tierFloorHold, type V2Item,
} from './v2-stage';
import { ExtractUsageStore, supabaseExtractUsageDb } from './usage-store';
import { buildUserMessage } from './writer-client';
import { defaultReportDir, kitIdFor, writeForceArtifacts, type ForceReportRow, type WriterEvalKitRow } from './backfill-report';
import type { BackfillRunResult, ForceDeps, ForceOutcome, ForceSummary, RunBackfillOptions } from './backfill-types';
import type { ClusterSource } from './write-knowledge';
import type { ExtractedFact } from './types';

export const FORCE_WINDOW_DAYS = 10;
const FORCE_MAX_ROWS = 1000;
const FORCE_COLS =
  'id,headline,summary,detail,image_url,sources,era_id,observed_on,category,tags,status,source_tier,symbols,entities,redline_ok';

export interface ForceCandidateRow {
  id: string;
  headline: string;
  summary: string;
  detail: string;
  image_url: string | null;
  sources: { name: string; url: string; tier: SourceTier }[];
  era_id: string;
  observed_on: string;
  category: string;
  tags: string[] | null;
  status: string;
  source_tier: string | null;
  symbols: string[] | null;
  entities: string[] | null;
  redline_ok: boolean;
}

/** Visible rows (today's read-time gate; not merged, retracted or promoted) observed in the last 10 days with no facts yet. A limit of 0 means all. */
export async function loadForceCandidates(db: SupabaseClient, limit = 0, now = new Date()): Promise<ForceCandidateRow[]> {
  const cutoff = new Date(now.getTime() - FORCE_WINDOW_DAYS * 86_400_000).toISOString().slice(0, 10);
  const { data, error } = await db
    .from('current_item')
    .select(FORCE_COLS)
    .is('promoted_to', null)
    .is('merged_into', null)
    .is('retracted_at', null)
    .is('facts', null)
    .eq('redline_ok', true)
    .gt('expires_at', now.toISOString())
    .gte('observed_on', cutoff)
    .order('observed_on', { ascending: false })
    .limit(FORCE_MAX_ROWS);
  if (error) throw new Error(`force backfill candidate load failed: ${error.message}`);
  const visible = ((data ?? []) as ForceCandidateRow[]).filter((row) => passesCurrentItemQualityGate({
    headline: row.headline,
    summary: row.summary,
    detail: row.detail,
    ...(row.image_url ? { imageUrl: row.image_url } : {}),
    redlineOk: row.redline_ok,
    facts: null,
    sources: row.sources,
  }));
  return limit > 0 ? visible.slice(0, limit) : visible;
}

function screensClean(strings: readonly string[]): boolean {
  return strings.every((s) => !s || !screenTopic(s));
}

interface RowResult {
  report: ForceReportRow;
  kit?: WriterEvalKitRow;
  deferred?: true;
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
    newLead: null, newBody: null, facts: [], citations: [], gateReasons: [], judgeScores: null,
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
  if (floor) return hold('below_tier_floor', floor.holdReason ?? 'below_tier_floor', { facts: item.facts });

  const composed = await deps.compose(db, deps.stores, item, sources, row.era_id);
  const { trace, v2 } = composed;
  const draft = trace.lead && trace.body ? { lead: trace.lead, body: trace.body, citations: trace.citations ?? [] } : null;
  const kit: WriterEvalKitRow = {
    kitId: kitIdFor(row.id),
    headline: row.headline,
    category: row.category,
    sourceTier: row.source_tier ?? 'unknown',
    statusHint: item.statusHint,
    facts: item.facts.map(({ id, claim, attribution, confidence }) => ({ id, claim, attribution, confidence })),
    contextText: composed.context.text,
    userMessage: buildUserMessage({ headline: row.headline, statusHint: item.statusHint, facts: item.facts, context: composed.context }),
    sonnetDraft: draft,
  };
  const traced: Partial<ForceReportRow> = {
    facts: item.facts,
    citations: trace.citations ?? [],
    gateReasons: trace.gateReasons ?? [],
    judgeScores: trace.judgeScores ?? null,
    newLead: trace.lead ?? null,
    newBody: trace.body ?? null,
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
  const { dryRun, limit, fetchImpl = fetch } = options;
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
  const candidates = await loadForceCandidates(db, limit);
  const today = new Date().toISOString().slice(0, 10);
  const rows: ForceReportRow[] = [];
  const kit: WriterEvalKitRow[] = [];
  const outcomes: Record<string, number> = {};
  const summary: ForceSummary = {
    eligible: candidates.length, processed: 0, passed: 0, held: 0, skippedWriteFailures: 0, deferred: false, remaining: 0, outcomes,
  };
  const tally = (outcome: string): void => { outcomes[outcome] = (outcomes[outcome] ?? 0) + 1; };

  for (const [index, row] of candidates.entries()) {
    result.considered++;
    let res: RowResult;
    try {
      res = await processRow(row, db, deps, fetchImpl, today);
    } catch (err) {
      errors.push(`force backfill failed for ${row.id}: ${(err as Error).message}`);
      continue;
    }
    if (res.kit) kit.push(res.kit);
    if (res.deferred) {
      summary.deferred = true;
      summary.remaining = candidates.length - index;
      result.deferred++;
      break;
    }
    if (res.write && !dryRun) {
      const { error: snapshotError } = await db.from('current_item_copy_snapshot').insert({
        current_item_id: row.id, headline: row.headline, summary: row.summary, detail: row.detail, facts: null, reason: 'backfill_v2',
      });
      if (snapshotError) {
        errors.push(`snapshot failed for ${row.id}: ${snapshotError.message}`);
        res.report = { ...res.report, outcome: 'snapshot_failed', holdReason: snapshotError.message };
      } else {
        const { error: updateError } = await db.from('current_item')
          .update({ summary: res.write.summary, detail: res.write.detail, facts: res.write.facts, writing_score: res.write.writingScore })
          .eq('id', row.id);
        if (updateError) {
          errors.push(`write-back failed for ${row.id}: ${updateError.message}`);
          res.report = { ...res.report, outcome: 'write_failed', holdReason: updateError.message };
        } else result.wroteBack++;
      }
    }
    summary.processed++;
    tally(res.report.outcome);
    if (res.report.outcome === 'pass') { summary.passed++; result.nowPassing++; result.rewritten++; }
    else if (res.report.outcome === 'snapshot_failed' || res.report.outcome === 'write_failed') summary.skippedWriteFailures++;
    else { summary.held++; result.stillHeld++; }
    rows.push(res.report);
  }

  result.force = summary;
  writeForceArtifacts(options.reportDir ?? defaultReportDir(), rows, kit, summary, dryRun);
  return result;
}
