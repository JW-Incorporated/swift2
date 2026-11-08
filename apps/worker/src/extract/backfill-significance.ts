// Significance-mode backfill (BACKFILL_MODE=significance, docs/decisions.md 2026-11-08):
// runs the live significance stage (layer-1 rules, then the Opus judge) over rows
// already live. Every judged row gets a significance_verdict; a tier-3 row is retired
// (hidden, never deleted; undo with restore-copy-snapshot.mjs --clear-retired). A
// deferred judge keeps the row (fail safe). A dry run writes nothing.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CurrentItemCategory, CurrentItemStatus } from '@swift2/shared';
import { createBackfillSignificanceStore } from './backfill-budget';
import { RETIRE_NOT_NOTABLE, retireRow } from './backfill-retire';
import { defaultReportDir } from './backfill-report';
import { loadSignificanceSelection, type SignificanceCandidateRow } from './backfill-significance-load';
import { writeSignificanceArtifacts, type SignificanceReportRow, type SignificanceSummary } from './backfill-significance-report';
import type { BackfillRunResult, RunBackfillOptions } from './backfill-types';
import { judgeSignificance } from './significance-client';
import type { SignificanceInput, SignificanceTier, SignificanceVerdictRecord } from './significance-prompt';
import { significanceHoldReason, significanceRuleHold } from './significance-rules';

const STOP_REASONS: readonly string[] = ['budget_exhausted', 'no_token'];

const hostOf = (url: string): string => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url;
  }
};

function judgeInput(row: SignificanceCandidateRow): SignificanceInput {
  const facts = row.facts && row.facts.length > 0 ? row.facts.map((f) => `${f.claim} (${f.attribution})`) : [row.headline];
  return {
    headline: row.headline,
    category: row.category,
    status: row.status,
    heat: new Set(row.sources.map((s) => hostOf(s.url))).size,
    facts,
    sources: [...new Set(row.sources.map((s) => s.name || hostOf(s.url)))],
  };
}

interface Decision { by: 'rule' | 'judge'; tier: SignificanceTier; reason: string; model: string }

export async function runSignificanceBackfill(db: SupabaseClient, options: RunBackfillOptions): Promise<BackfillRunResult> {
  if (options.retireBelowFloor || options.retireUnwritable) {
    throw new Error('significance mode retires only not_notable: retire_below_floor and retire_unwritable are not allowed with BACKFILL_MODE=significance');
  }
  const { dryRun, limit, days, ids } = options;
  const errors: string[] = [];
  const result: BackfillRunResult = {
    considered: 0, rewritten: 0, imagesResolved: 0, nowPassing: 0, stillHeld: 0, deferred: 0, wroteBack: 0, reports: [], errors,
  };
  const judge = options.significance?.judge ?? judgeSignificance;
  const store = options.significance?.store ?? await createBackfillSignificanceStore(db);
  const { candidates, unservable } = await loadSignificanceSelection(db, limit, new Date(), days, ids);
  const outcomes: Record<string, number> = {};
  const summary: SignificanceSummary = {
    eligible: candidates.length, judged: 0, ruleHeld: 0, tier1: 0, tier2: 0, tier3: 0, deferred: 0, wouldRetire: 0, retired: 0,
    skippedWriteFailures: 0, skippedUnservable: unservable.length, skippedUnservableReasons: {}, stoppedEarly: false, remaining: 0, outcomes,
  };
  for (const { reason } of unservable) summary.skippedUnservableReasons[reason] = (summary.skippedUnservableReasons[reason] ?? 0) + 1;
  if (unservable.length > 0) outcomes['skipped_unservable'] = unservable.length;
  const rows: SignificanceReportRow[] = [];
  const bump = (outcome: string): void => { outcomes[outcome] = (outcomes[outcome] ?? 0) + 1; };

  for (const [index, row] of candidates.entries()) {
    result.considered++;
    const outlet = row.sources[0]?.name ?? '';
    const base = { id: row.id, headline: row.headline, outlet };
    const rule = significanceRuleHold({
      headline: row.headline,
      category: row.category as CurrentItemCategory,
      status: row.status as CurrentItemStatus,
      facts: row.facts ?? [],
      sources: row.sources,
    });
    let decision: Decision;
    if (rule) {
      decision = { by: 'rule', tier: 3, reason: significanceHoldReason(rule), model: 'rules' };
    } else {
      const verdict = await judge(store, judgeInput(row));
      if (verdict.status !== 'ok') {
        summary.deferred++;
        result.deferred++;
        bump('deferred');
        rows.push({ ...base, by: 'deferred', tier: null, reason: verdict.reason, decision: 'keep', outcome: 'deferred' });
        if (STOP_REASONS.includes(verdict.reason)) {
          summary.stoppedEarly = true;
          summary.remaining = candidates.length - index - 1;
          break;
        }
        continue;
      }
      decision = { by: 'judge', tier: verdict.tier, reason: verdict.reason, model: verdict.model };
    }

    summary.judged++;
    if (decision.by === 'rule') summary.ruleHeld++;
    if (decision.tier === 1) summary.tier1++;
    else if (decision.tier === 2) summary.tier2++;
    else summary.tier3++;
    const retire = decision.tier === 3;
    if (retire) summary.wouldRetire++;
    let outcome = retire ? 'would_retire' : 'keep';
    if (!dryRun) {
      const record: SignificanceVerdictRecord = {
        tier: decision.tier, reason: decision.reason, model: decision.model, at: new Date().toISOString(),
      };
      const { error } = await db.from('current_item').update({ significance_verdict: record }).eq('id', row.id).is('retracted_at', null);
      if (error) {
        errors.push(`verdict not written for ${row.id}: ${error.message}`);
        summary.skippedWriteFailures++;
        outcome = 'write_failed';
      } else {
        result.wroteBack++;
        if (retire) {
          const retired = await retireRow(db, row.id, RETIRE_NOT_NOTABLE);
          outcome = retired.outcome;
          if (retired.outcome === 'retired_not_notable') summary.retired++;
          else {
            summary.skippedWriteFailures++;
            if (retired.error) errors.push(`${retired.outcome} for ${row.id}: ${retired.error}`);
          }
        }
      }
    }
    bump(outcome);
    if (retire) result.stillHeld++;
    else result.nowPassing++;
    rows.push({ ...base, by: decision.by, tier: decision.tier, reason: decision.reason, decision: retire ? 'retire' : 'keep', outcome });
  }

  result.significance = summary;
  writeSignificanceArtifacts(options.reportDir ?? defaultReportDir(), rows, summary, dryRun);
  return result;
}
