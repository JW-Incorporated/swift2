#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createJevClient } from '../lib/jev.mjs';
import { FAN_MADE } from '../../supabase/seed/merch/fanmade.mjs';
import { curateFanmadeIssues } from './fanmade-curation.mjs';
import { listOpenCandidateIssues, parseCandidateIssue } from './fanmade-curation-issues.mjs';
import { appendFanmadeSeeds } from './fanmade-curation-seed.mjs';

const DEFAULT_REPORT = '.artifacts/merch-fanmade-curation.json';
const CONFIG = JSON.parse(await readFile(new URL('../../config/tidewatch.json', import.meta.url)));
export const FANMADE_RUN_CONFIG = CONFIG.classes.merch_fan;

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

function runMode(config) {
  if (config.enabled !== true) return 'disabled';
  if (config.shadow === true) return 'shadow';
  return 'live';
}

export function buildCurationReport(result, now, { config = FANMADE_RUN_CONFIG, issues = [] } = {}) {
  const mode = runMode(config);
  const writeEnabled = mode === 'live';
  const titles = new Map(issues.map((issue) => [issue.issueNumber ?? issue.number, safeReason(issue.item || issue.title || 'untitled')]));
  const acceptedIssues = result.accepted.map(({ issueNumber }) => ({
    issueNumber, title: titles.get(issueNumber) || 'untitled',
    reason: 'passed Jev, D3, E1, and E2',
  }));
  const rejectedIssues = result.rejected.map(({ issueNumber, reason }) => ({
    issueNumber, title: titles.get(issueNumber) || 'untitled', reason: safeReason(reason),
  }));
  const unresolved = result.unresolved.map(({ issueNumber, reason }) => ({
    issueNumber, title: titles.get(issueNumber) || 'untitled', reason: safeReason(reason),
  }));
  const closures = writeEnabled
    ? result.rejected.map(({ issueNumber, reason }) => ({
      issueNumber,
      reason: `Rejected by fan-made curation: ${safeReason(reason)}.`,
    })).filter(({ issueNumber }) => Number.isInteger(issueNumber))
    : [];
  return {
    generatedAt: now,
    mode,
    writeEnabled,
    status: result.status,
    acceptedCount: result.accepted.length,
    rejectedCount: result.rejected.length,
    unresolvedCount: unresolved.length,
    acceptedIssues,
    rejectedIssues,
    closures,
    unresolved,
  };
}

async function writeReport(path, report) {
  const target = resolve(path);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, `accepted_count=${report.acceptedCount}\n`, 'utf8');
    await appendFile(process.env.GITHUB_OUTPUT, `report_path=${path}\n`, 'utf8');
    await appendFile(process.env.GITHUB_OUTPUT, `write_enabled=${report.writeEnabled}\n`, 'utf8');
    const closes = report.acceptedIssues.map(({ issueNumber }) => `Closes #${issueNumber}`).join('\n');
    await appendFile(process.env.GITHUB_OUTPUT, `accepted_closes<<FANMADE_CLOSES\n${closes}\nFANMADE_CLOSES\n`, 'utf8');
  }
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, renderSummary(report), 'utf8');
}

export function renderSummary(report) {
  if (report.mode === 'disabled') {
    return '## Fan-made curation (disabled)\n\ndisabled: no calls made\n';
  }
  const would = report.writeEnabled ? '' : 'Would ';
  const lines = [
    `## Fan-made curation (${report.mode})`,
    '',
    `${would}accept: ${report.acceptedCount} · ${would.toLowerCase()}reject: ${report.rejectedCount} · unresolved: ${report.unresolvedCount}`,
  ];
  for (const [label, items] of [['accept', report.acceptedIssues], ['reject', report.rejectedIssues], ['unresolved', report.unresolved]]) {
    for (const item of items) lines.push(`- #${item.issueNumber} ${label} — ${item.title}: ${item.reason}`);
  }
  return `${lines.join('\n')}\n`;
}

export async function runFanmadeCuration({
  rawIssues = [],
  existingCatalog = FAN_MADE,
  now = new Date().toISOString(),
  jevClient,
  pipeline = curateFanmadeIssues,
  appendSeeds = appendFanmadeSeeds,
  config = FANMADE_RUN_CONFIG,
  log = console.log,
} = {}) {
  if (runMode(config) === 'disabled') {
    return buildCurationReport({
      status: 'disabled', accepted: [], rejected: [], unresolved: [],
    }, now, { config });
  }
  const parsed = rawIssues.map((issue) => parseCandidateIssue(issue) ?? { number: issue?.number });
  const result = await pipeline({ issues: parsed, existingCatalog, now, jevClient, log });
  if (runMode(config) === 'live' && result.status === 'ok' && result.accepted.length > 0) {
    await appendSeeds({ seeds: result.accepted.map(({ seed }) => seed) });
  }
  return buildCurationReport(result, now, { config, issues: parsed });
}

export async function main({
  args = process.argv.slice(2),
  config = FANMADE_RUN_CONFIG,
  env = process.env,
  listIssues = listOpenCandidateIssues,
  createClient = createJevClient,
  writeReportImpl = writeReport,
} = {}) {
  const reportPath = option(args, '--report', DEFAULT_REPORT);
  const now = new Date().toISOString();
  if (runMode(config) === 'disabled') {
    const report = await runFanmadeCuration({ config, now });
    await writeReportImpl(reportPath, report);
    console.log('fanmade-curation: disabled: no calls made');
    return report;
  }
  const rawIssues = await listIssues();
  if (!env.TYPESAFE_API_KEY || !env.CLAUDE_CODE_OAUTH_TOKEN) {
    const reason = !env.TYPESAFE_API_KEY ? 'Jev unavailable' : 'vision wrapper unavailable';
    console.warn(`fanmade-curation: ${reason}; all candidate issues left open`);
    const report = buildCurationReport({
      status: 'unavailable', accepted: [], rejected: [],
      unresolved: rawIssues.map(({ number }) => ({ issueNumber: number, reason })),
    }, now, { config, issues: rawIssues.map((issue) => parseCandidateIssue(issue) ?? issue) });
    await writeReportImpl(reportPath, report);
    return report;
  }
  const jevClient = createClient({ apiKey: env.TYPESAFE_API_KEY });
  const report = await runFanmadeCuration({ rawIssues, jevClient, now, config });
  await writeReportImpl(reportPath, report);
  console.log(`fanmade-curation: accepted ${report.acceptedCount}, rejected ${report.rejectedCount}, unresolved ${report.unresolvedCount}`);
}

const self = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === self) {
  main().catch((error) => {
    console.error(`fanmade-curation: ${error?.message || error}`);
    process.exitCode = 1;
  });
}
