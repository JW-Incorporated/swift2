// Force-mode backfill artifacts: the old-vs-new review report and the writer
// eval kit export. Public news text and model output only; no secrets.

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ForceOutcome, ForceSummary } from './backfill-types';
import type { ExtractedFact } from './types';
import type { WriterCitation } from './writer-client';

export interface ForceReportRow {
  id: string;
  headline: string;
  oldSummary: string;
  oldDetail: string;
  newLead: string | null;
  newBody: string | null;
  facts: ExtractedFact[];
  citations: WriterCitation[];
  gateReasons: string[];
  judgeScores: Record<string, number> | null;
  outcome: ForceOutcome;
  holdReason: string | null;
}

export interface WriterEvalKitRow {
  kitId: string;
  headline: string;
  category: string;
  sourceTier: string;
  statusHint: string;
  facts: { id: string; claim: string; attribution: string; confidence: string }[];
  contextText: string;
  userMessage: string;
  sonnetDraft: { lead: string; body: string; citations: WriterCitation[] } | null;
}

export function kitIdFor(rowId: string): string {
  return createHash('sha256').update(rowId).digest('hex').slice(0, 12);
}

export function defaultReportDir(env: NodeJS.ProcessEnv = process.env): string {
  if (env.BACKFILL_REPORT_DIR) return env.BACKFILL_REPORT_DIR;
  return join(env.RUNNER_TEMP ?? env.TMPDIR ?? env.TEMP ?? '.', 'backfill-report');
}

function renderMarkdown(rows: readonly ForceReportRow[], summary: ForceSummary, dryRun: boolean): string {
  const lines = [
    `# Backfill report (${dryRun ? 'DRY RUN, nothing written' : 'LIVE'})`,
    '',
    `Eligible: ${summary.eligible}. Processed: ${summary.processed}. Passed: ${summary.passed}. Held (copy untouched): ${summary.held}. Remaining after a deferral: ${summary.remaining}.`,
    '',
    '## Outcomes',
    ...Object.entries(summary.outcomes).map(([outcome, count]) => `- ${outcome}: ${count}`),
    '',
    '## First 30 old versus new',
  ];
  for (const row of rows.slice(0, 30)) {
    lines.push(
      '',
      `### ${row.headline} (${row.id}) — ${row.outcome}${row.holdReason ? ` (${row.holdReason})` : ''}`,
      '',
      `Old summary: ${row.oldSummary}`,
      '',
      `Old detail: ${row.oldDetail}`,
      '',
      `New lead: ${row.newLead ?? '(none)'}`,
      '',
      `New body: ${row.newBody ?? '(none)'}`,
    );
  }
  return `${lines.join('\n')}\n`;
}

const jsonl = (rows: readonly unknown[]): string => rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : '');

export function writeForceArtifacts(
  dir: string,
  rows: readonly ForceReportRow[],
  kit: readonly WriterEvalKitRow[],
  summary: ForceSummary,
  dryRun: boolean,
): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'backfill-report.jsonl'), jsonl(rows));
  writeFileSync(join(dir, 'backfill-report.md'), renderMarkdown(rows, summary, dryRun));
  writeFileSync(join(dir, 'writer-eval-kit.jsonl'), jsonl(kit));
}
