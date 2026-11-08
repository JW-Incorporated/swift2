#!/usr/bin/env node
// Social judge calibration (pattern: scripts/news/calibrate-judge.mjs). Fixtures in
// judge-calibration/social/: gold.jsonl (8 real captions that must clear every dimension >= 4,
// GOLD_RUNS repeated runs) and negatives.jsonl (6 defects that must fall below 4 ON the
// expected dimension). Exit 0 only when every requested model meets both bars.
//
//   node scripts/social/calibrate-judge.mjs --deterministic
//       No credentials: runs only the deterministic voice gates (lib/voice-gates.mjs) over the
//       fixtures. Gold must raise no finding; a negative marked detGate must raise one.
//   node scripts/social/calibrate-judge.mjs <out-dir> [--models claude-opus-5-5] [--concurrency 3]
//       Needs CLAUDE_CODE_OAUTH_TOKEN (never read or printed here); run by social-draft-judge.yml.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { JUDGE_DIMENSIONS, JUDGE_MIN_SCORE, JUDGE_MODEL } from './lib/judge-rubric.mjs';
import { checkVoiceStyle } from './lib/voice-gates.mjs';

export const GOLD_RUNS = 3;
const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), '../../judge-calibration/social');
const MODEL_PATTERN = /^[a-z0-9.-]+$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function readRows(name, dir = FIXTURES) {
  return readFileSync(join(dir, name), 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
}

/** Deterministic voice-gate findings for a fixture row, with its synthetic posted history. */
export function deterministicFindings(row, now = Date.parse('2026-11-08T12:00:00Z')) {
  const posted = (row.priorPosted ?? []).map((p, i) => ({
    platform: p.platform,
    body: p.body,
    campaign: `calibration:prior-${i}`,
    postedAt: new Date(now - p.daysAgo * DAY_MS).toISOString(),
  }));
  return checkVoiceStyle({ platform: row.platform, body: row.body, campaign: `calibration:${row.id}` }, posted, { now });
}

export function evaluateDeterministic(gold, negatives) {
  const goldFailures = gold.map((r) => ({ id: r.id, findings: deterministicFindings(r) })).filter((r) => r.findings.length);
  const negativeResults = negatives.map((r) => ({ id: r.id, expected: r.detGate, findings: deterministicFindings(r) }));
  const negativeMisses = negativeResults.filter((r) => r.expected && r.findings.length === 0);
  return { goldFailures, negativeResults, negativeMisses, accepted: goldFailures.length === 0 && negativeMisses.length === 0 };
}

export const goldPasses = (scores) => JUDGE_DIMENSIONS.every((d) => scores[d] >= JUDGE_MIN_SCORE);
export const negativeFailsOn = (scores, dim) => scores[dim] < JUDGE_MIN_SCORE;

/** Gold: every run of every row clears. Negatives: every row falls below the bar on its expected dimension. */
export function evaluateModel({ gold, negatives }) {
  const goldOk = gold.every((run) => run.every((r) => r.status === 'ok' && goldPasses(r.scores)));
  const negativesOk = negatives.every((r) => r.status === 'ok' && negativeFailsOn(r.scores, r.expectFailOn));
  const deferred = [...gold.flat(), ...negatives].filter((r) => r.status !== 'ok').length;
  return { goldOk, negativesOk, deferred, accepted: goldOk && negativesOk && deferred === 0 };
}

export function renderTable(byModel) {
  const rows = Object.entries(byModel).map(([m, e]) => `| ${m} | ${e.goldOk ? 'pass' : 'FAIL'} | ${e.negativesOk ? 'pass' : 'FAIL'} | ${e.deferred} | ${e.accepted ? 'ACCEPT' : 'REJECT'} |`);
  return ['| model | gold (3 runs) | negatives | deferred | verdict |', '|---|---|---|---|---|', ...rows].join('\n');
}

function flag(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const gold = readRows('gold.jsonl');
  const negatives = readRows('negatives.jsonl');
  if (args.includes('--deterministic')) {
    const result = evaluateDeterministic(gold, negatives);
    console.log(`gold: ${gold.length - result.goldFailures.length}/${gold.length} pass the deterministic gates`);
    for (const r of result.negativeResults) console.log(`${r.id}: ${r.findings.length ? `FAILS (${r.findings.length} finding${r.findings.length > 1 ? 's' : ''})` : 'passes (judge-only defect)'}`);
    for (const f of result.goldFailures) console.error(`gold ${f.id}: ${f.findings.join(' | ')}`);
    for (const m of result.negativeMisses) console.error(`negative ${m.id} should trip a deterministic gate and did not`);
    return result.accepted ? 0 : 1;
  }
  const outDir = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  if (!outDir) throw new Error('usage: calibrate-judge.mjs <out-dir> [--models a,b] [--concurrency N] | --deterministic');
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) throw new Error('CLAUDE_CODE_OAUTH_TOKEN is not set');
  const models = (flag(args, '--models') ?? JUDGE_MODEL).split(',').filter(Boolean);
  if (models.length === 0 || !models.every((m) => MODEL_PATTERN.test(m))) throw new Error('--models must be a comma list of ^[a-z0-9.-]+$');
  const concurrency = Math.max(1, Number(flag(args, '--concurrency') ?? 3));
  const { callClaude } = await import('../lib/claude-call.mjs');
  const { judgeCaption } = await import('./judge-drafts.mjs');
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });

  const byModel = {};
  for (const model of models) {
    const claude = (request) => callClaude({ ...request, model });
    const judgeRow = async (row) => {
      const r = await judgeCaption(row, { claude, model });
      return { id: row.id, ...(row.expect_fail_on ? { expectFailOn: row.expect_fail_on } : {}), ...r };
    };
    const goldRuns = [];
    for (let run = 0; run < GOLD_RUNS; run += 1) goldRuns.push(await mapLimit(gold, concurrency, judgeRow));
    const negativeResults = await mapLimit(negatives, concurrency, judgeRow);
    byModel[model] = evaluateModel({ gold: goldRuns, negatives: negativeResults });
    writeFileSync(join(out, `${model}.json`), JSON.stringify({ evaluation: byModel[model], gold: goldRuns, negatives: negativeResults }, null, 2));
    console.error(`${model}: accepted=${byModel[model].accepted}`);
  }
  writeFileSync(join(out, 'summary.json'), JSON.stringify({ codeSha: process.env.GITHUB_SHA ?? null, byModel }, null, 2));
  console.log(renderTable(byModel));
  return models.every((m) => byModel[m].accepted) ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runMain(main, { name: 'social-calibrate-judge' });
}
