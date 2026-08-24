#!/usr/bin/env node
// Appends one line per run to a persistent "knowledge-engine" GitHub issue —
// find-or-create by title, one comment per run (proposal §4.8, PLAN.md
// Stage 3). Same find-or-create-then-comment shape as
// scripts/watchdog/upsert-alert.sh, ported to Node + scripts/lib/gh.mjs's
// gh() helper instead of bash + the gh CLI directly.
//
// NOT YET WIRED into .github/workflows/news-worker.yml — the Stage 3 brief
// explicitly leaves that file untouched this round. A future stage (the one
// that renames it to knowledge-engine.yml, per PLAN.md's own Stage 3
// checklist item this build deliberately skipped) adds `GH_TOKEN` to that
// workflow's env block and a step calling this script. Runnable standalone
// today: `node scripts/knowledge-engine/run-summary.mjs <result.json>`.

import { readFileSync } from 'node:fs';
import { gh } from '../lib/gh.mjs';

export const ISSUE_TITLE = 'knowledge-engine run log';
export const ISSUE_LABEL = 'knowledge-engine';

/** One line per run — items in, clusters, extracted, screened out, deferred (cap), per-adapter status. */
export function buildSummaryLine(cycleResult, timestamp = new Date().toISOString()) {
  const e = cycleResult.extract ?? {};
  const adapterStatus = `sourcesPolled: ${cycleResult.sourcesPolled ?? 0}`;
  return (
    `- ${timestamp} — items in: ${cycleResult.itemsIngested ?? 0}, ` +
    `clusters: ${e.clustersConsidered ?? 0}, extracted: ${e.extracted ?? 0}, ` +
    `screened out: ${e.screenedOut ?? 0}, skipped: ${e.skipped ?? 0}, ` +
    `deferred (cap): ${e.deferred ?? 0}, ${adapterStatus}, ` +
    `errors: ${(cycleResult.errors ?? []).length}`
  );
}

/** Finds the persistent run-log issue, or creates it. Injectable `runGh` for tests. */
export async function findOrCreateIssue(runGh = gh) {
  const { stdout } = await runGh([
    'issue', 'list',
    '--label', ISSUE_LABEL,
    '--search', `"${ISSUE_TITLE}" in:title`,
    '--state', 'open',
    '--json', 'number,title',
  ]);
  const issues = JSON.parse(stdout || '[]');
  const existing = issues.find((i) => i.title === ISSUE_TITLE);
  if (existing) return existing.number;

  const { stdout: createOut } = await runGh([
    'issue', 'create',
    '--title', ISSUE_TITLE,
    '--label', ISSUE_LABEL,
    '--body',
    'Automated run log for the knowledge engine ingestion pipeline ' +
      '(docs/proposals/2026-08-23-knowledge-engine.md §4.8). One comment per run.',
  ]);
  const match = String(createOut).match(/\/issues\/(\d+)/);
  if (!match) throw new Error(`could not parse issue number from: ${createOut}`);
  return Number(match[1]);
}

/** Posts one run's summary line as a comment on the (found-or-created) run-log issue. */
export async function postRunSummary(cycleResult, runGh = gh) {
  const number = await findOrCreateIssue(runGh);
  const line = buildSummaryLine(cycleResult);
  await runGh(['issue', 'comment', String(number), '--body', line]);
  return { number, line };
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error('usage: run-summary.mjs <cycle-result.json>');
    process.exitCode = 2;
    return;
  }
  const cycleResult = JSON.parse(readFileSync(path, 'utf8'));
  const { number, line } = await postRunSummary(cycleResult);
  console.log(`posted to knowledge-engine run log #${number}: ${line}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('run-summary failed:', err.message);
    process.exitCode = 1;
  });
}
