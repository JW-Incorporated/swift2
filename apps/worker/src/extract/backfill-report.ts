// Force-mode backfill artifacts: the old-vs-new review report and the writer
// eval kit export. Public news text and model output only; no secrets.

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ForceOutcome, ForceSummary } from './backfill-types';
import type { ExtractedFact } from './types';
import type { WriterCitation, WriterParagraph } from './writer-client';

export interface ForceReportRow {
  id: string;
  headline: string;
  oldSummary: string;
  oldDetail: string;
  newLead: string | null;
  newBody: string | null;
  facts: ExtractedFact[];
  citations: WriterCitation[];
  paragraphs: WriterParagraph[];
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
  observedOn: string;
  statusHint: string;
  facts: { id: string; claim: string; attribution: string; confidence: string }[];
  contextText: string;
  userMessage: string;
  sonnetDraft: { lead: string; body: string; citations: WriterCitation[]; paragraphs: WriterParagraph[] } | null;
}

/** Public-artifact hygiene: drops query-string URLs, JWTs, sk- keys and long hex, then caps at 200 chars. */
export function sanitizeReason(text: string): string {
  return text
    .replace(/https?:\/\/[^\s"')]*\?[^\s"')]*/g, '[url]')
    .replace(/eyJ[A-Za-z0-9_-]{5,}(?:\.[A-Za-z0-9_-]+){0,2}/g, '[token]')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}/g, '[token]')
    .replace(/\b[0-9a-fA-F]{32,}\b/g, '[token]')
    .slice(0, 200);
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
    `# Backfill report (${dryRun ? 'DRY RUN, no current_item or snapshot rows written' : 'LIVE'})`,
    '',
    `Eligible: ${summary.eligible}. Processed: ${summary.processed}. Passed: ${summary.passed}. Held (copy untouched): ${summary.held}. Remaining after a deferral: ${summary.remaining}. Retired below floor: ${summary.retired}. Duplicates found: ${summary.duplicatesFound} (retired ${summary.retiredDuplicates}). Unwritable found: ${summary.unwritableFound} (retired ${summary.retiredUnwritable}).`,
    '',
    '## Duplicate groups',
    ...summary.duplicateGroups.map((g) => `- keep ${g.keep ?? '(none passing)'}: ${g.members.join(', ')}`),
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
    if (row.gateReasons.length > 0) lines.push('', `Gate reasons: ${row.gateReasons.join('; ')}`);
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
  const safe = rows.map((r) => ({
    ...r,
    holdReason: r.holdReason === null ? null : sanitizeReason(r.holdReason),
    gateReasons: r.gateReasons.map(sanitizeReason),
  }));
  writeFileSync(join(dir, 'backfill-report.jsonl'), jsonl(safe));
  writeFileSync(join(dir, 'backfill-report.md'), renderMarkdown(safe, summary, dryRun));
  writeFileSync(join(dir, 'writer-eval-kit.jsonl'), jsonl(kit));
}
