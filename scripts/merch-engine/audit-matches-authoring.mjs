#!/usr/bin/env node
// E3 Match Auditor — unscheduled authoring lane. This is the only E3 script
// permitted to call the vision model; the scheduled detector remains zero-LLM.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAuthoring } from './audit-matches-authoring-run.mjs';
import { judgePairWithClaude } from './audit-matches-authoring-vision.mjs';
import {
  capIssueContent,
  reSourceIssueContent,
  upsertCapIssue,
} from './audit-matches-authoring-issues.mjs';

export {
  CAP_STOP_REASON,
  HYDRATION_BUDGET_MS,
  MAX_RUN_COST_USD,
  MODEL,
  RESERVATION_PER_PAIR_USD,
  RESERVATION_PER_REQUEST_USD,
  RETAILER_FETCH_TIMEOUT_MS,
  TRANSIENT_RETRY_ATTEMPTS,
} from './audit-matches-authoring-config.mjs';
export { IMAGE_FETCH_TIMEOUT_MS, MAX_IMAGE_BYTES } from './merch-claude.mjs';
export { capIssueContent, reSourceIssueContent, upsertCapIssue };
export { requiresApiKey, runAuthoring } from './audit-matches-authoring-run.mjs';
export { judgePairWithClaude, retailerOgImage } from './audit-matches-authoring-vision.mjs';

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function argValue(args, name) {
  const at = args.indexOf(name);
  if (at === -1) return null;
  const value = args[at + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a path`);
  return value;
}

async function main() {
  const args = process.argv.slice(2);
  const receiptPath = argValue(args, '--receipt');
  const queuePath = argValue(args, '--queue');
  const writePath = argValue(args, '--write');
  if (!receiptPath || !queuePath || !writePath) {
    throw new Error(
      'usage: audit-matches-authoring.mjs --receipt receipt.json --queue queue.json --write judged.json',
    );
  }
  const receipt = await readJson(resolve(receiptPath));
  const queue = await readJson(resolve(queuePath));
  const artifact = await runAuthoring({
    receipt,
    queue,
    judge: (pair) => judgePairWithClaude(pair),
  });
  const issue = capIssueContent(artifact);
  let issueError = null;
  if (issue) {
    try {
      artifact.run.followUpIssue = await upsertCapIssue(issue);
    } catch (error) {
      artifact.run.followUpIssue = null;
      issueError = error instanceof Error ? error.message : String(error);
    }
  }
  const reSourceIssue = reSourceIssueContent(artifact);
  let reSourceIssueError = null;
  if (reSourceIssue) {
    try {
      artifact.reSourceIssue = await upsertCapIssue(reSourceIssue);
    } catch (error) {
      artifact.reSourceIssue = null;
      reSourceIssueError = error instanceof Error ? error.message : String(error);
    }
  }
  const target = resolve(writePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  if (issueError) {
    console.error(`merch-audit-authoring: failed to file cap follow-up issue: ${issueError}`);
    process.exitCode = 1;
  }
  if (reSourceIssueError) {
    console.error(`merch-audit-authoring: failed to file re-source issue: ${reSourceIssueError}`);
    process.exitCode = 1;
  }
  console.log(
    JSON.stringify({
      status: artifact.status,
      reservedCostUsd: artifact.run.reservedCostUsd,
      completedJudgments: artifact.run.completedJudgments,
      stopReason: artifact.run.stopReason,
      demoted: artifact.demotions?.length ?? 0,
    }),
  );
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`merch-audit-authoring: ${error.message}`);
    process.exitCode = 1;
  });
}
