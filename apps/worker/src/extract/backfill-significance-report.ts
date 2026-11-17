// Significance-mode artifacts: one row per judged item with its tier, reason and
// the retire decision. Public news text and model output only; no secrets.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { sanitizeReason } from './backfill-report';

export interface SignificanceReportRow {
  id: string;
  headline: string;
  outlet: string;
  by: 'rule' | 'judge' | 'deferred';
  tier: 1 | 2 | 3 | null;
  reason: string;
  /** retire = tier 3 (hidden on a live run); keep = tier 1/2 or a deferral. */
  decision: 'retire' | 'keep';
  outcome: string;
}

export interface SignificanceSummary {
  eligible: number;
  /** Rows given a verdict (rule or judge). */
  judged: number;
  ruleHeld: number;
  tier1: number;
  tier2: number;
  tier3: number;
  /** Rows the judge deferred: kept, no verdict written. */
  deferred: number;
  wouldRetire: number;
  /** Rows actually hidden (0 on a dry run). */
  retired: number;
  skippedWriteFailures: number;
  skippedUnservable: number;
  skippedUnservableReasons: Record<string, number>;
  /** The run stopped on an exhausted budget or missing token; the rest of the selection is untouched. */
  stoppedEarly: boolean;
  remaining: number;
  outcomes: Record<string, number>;
}

function renderMarkdown(rows: readonly SignificanceReportRow[], summary: SignificanceSummary, dryRun: boolean): string {
  const lines = [
    `# Significance backfill report (${dryRun ? 'DRY RUN, nothing written' : 'LIVE'})`,
    '',
    `Eligible: ${summary.eligible}. Judged: ${summary.judged} (rules ${summary.ruleHeld}). Tier 1: ${summary.tier1}. Tier 2: ${summary.tier2}. Tier 3: ${summary.tier3}. Deferred (kept): ${summary.deferred}. Would retire: ${summary.wouldRetire}. Retired: ${summary.retired}. Write failures: ${summary.skippedWriteFailures}. skipped_unservable: ${summary.skippedUnservable}. ${summary.stoppedEarly ? `Stopped early with ${summary.remaining} remaining (re-run continues).` : ''}`,
    '',
    '## Outcomes',
    ...Object.entries(summary.outcomes).map(([outcome, count]) => `- ${outcome}: ${count}`),
    '',
    '## Rows',
    '',
    '| Decision | Tier | By | Outlet | Headline | Reason |',
    '|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.decision} | ${r.tier ?? '-'} | ${r.by} | ${cell(r.outlet)} | ${cell(r.headline)} (${r.id}) | ${cell(r.reason)} |`),
  ];
  return `${lines.join('\n')}\n`;
}

const cell = (text: string): string => text.replace(/\|/g, '/').replace(/\s+/g, ' ');

export function writeSignificanceArtifacts(
  dir: string,
  rows: readonly SignificanceReportRow[],
  summary: SignificanceSummary,
  dryRun: boolean,
): void {
  mkdirSync(dir, { recursive: true });
  const safe = rows.map((r) => ({ ...r, reason: sanitizeReason(r.reason) }));
  writeFileSync(join(dir, 'significance-report.jsonl'), safe.map((r) => JSON.stringify(r)).join('\n') + (safe.length ? '\n' : ''));
  writeFileSync(join(dir, 'significance-report.md'), renderMarkdown(safe, summary, dryRun));
}
