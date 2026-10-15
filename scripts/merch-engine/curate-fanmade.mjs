#!/usr/bin/env node
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createJevClient } from '../lib/jev.mjs';
import { FAN_MADE } from '../../supabase/seed/merch/fanmade.mjs';
import { curateFanmadeIssues } from './fanmade-curation.mjs';
import { listOpenCandidateIssues, parseCandidateIssue } from './fanmade-curation-issues.mjs';
import { appendFanmadeSeeds } from './fanmade-curation-seed.mjs';

const DEFAULT_REPORT = '.artifacts/merch-fanmade-curation.json';

function option(args, name, fallback) {
  const index = args.indexOf(name);
  if (index < 0) return fallback;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${name} requires a value`);
  return value;
}

function safeReason(value) {
  return String(value).replace(/[\r\n]+/g, ' ').slice(0, 240);
}

export function buildCurationReport(result, now) {
  const closures = [
    ...result.accepted.map(({ issueNumber }) => ({
      issueNumber,
      reason: 'Accepted into the fan-made merch catalog after Jev, D3, E1, and E2 passed.',
    })),
    ...result.rejected.map(({ issueNumber, reason }) => ({
      issueNumber,
      reason: `Rejected by fan-made curation: ${safeReason(reason)}.`,
    })),
  ].filter(({ issueNumber }) => Number.isInteger(issueNumber));
  return {
    generatedAt: now,
    status: result.status,
    acceptedCount: result.accepted.length,
    rejectedCount: result.rejected.length,
    unresolvedCount: result.unresolved.length,
    closures,
    unresolved: result.unresolved,
  };
}

async function writeReport(path, report) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `accepted_count=${report.acceptedCount}\n`, 'utf8');
    await appendFile(process.env.GITHUB_OUTPUT, `report_path=${path}\n`, 'utf8');
  }
}

export async function runFanmadeCuration({
  rawIssues,
  existingCatalog = FAN_MADE,
  now = new Date().toISOString(),
  jevClient,
  pipeline = curateFanmadeIssues,
  appendSeeds = appendFanmadeSeeds,
  log = console.log,
} = {}) {
  const parsed = rawIssues.map((issue) => parseCandidateIssue(issue) ?? { number: issue?.number });
  const result = await pipeline({ issues: parsed, existingCatalog, now, jevClient, log });
  if (result.status === 'ok' && result.accepted.length > 0) {
    await appendSeeds({ seeds: result.accepted.map(({ seed }) => seed) });
  }
  return buildCurationReport(result, now);
}

async function main() {
  const reportPath = option(process.argv.slice(2), '--report', DEFAULT_REPORT);
  const now = new Date().toISOString();
  const rawIssues = await listOpenCandidateIssues();
  if (!process.env.TYPESAFE_API_KEY || !process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    const reason = !process.env.TYPESAFE_API_KEY ? 'Jev unavailable' : 'vision wrapper unavailable';
    console.warn(`fanmade-curation: ${reason}; all candidate issues left open`);
    await writeReport(reportPath, buildCurationReport({
      status: 'unavailable', accepted: [], rejected: [],
      unresolved: rawIssues.map(({ number }) => ({ issueNumber: number, reason })),
    }, now));
    return;
  }
  const jevClient = createJevClient({ apiKey: process.env.TYPESAFE_API_KEY });
  const report = await runFanmadeCuration({ rawIssues, jevClient, now });
  await writeReport(reportPath, report);
  console.log(`fanmade-curation: accepted ${report.acceptedCount}, rejected ${report.rejectedCount}, unresolved ${report.unresolvedCount}`);
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`fanmade-curation: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
