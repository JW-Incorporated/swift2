#!/usr/bin/env node
// Judge calibration gate (docs/decisions.md 2026-11-03). Runs ONLY the judge,
// through the worker's claude -p wrapper with an in-memory usage store, over
// three fixture sets in apps/worker/src/extract/__fixtures__/judge-calibration/:
//   gold.jsonl       5 hand-written drafts (two carry a fan-voice line) that must pass, 3 repeated runs
//   negatives.jsonl  7 gold copies with one defect each; must fail ON the expected dimension
//   legacy.jsonl     the old pre-engine copy (no refs); at least 26/31 (scaled to the row count)
//                    must fail. Judged without the deterministic gate and without a citations
//                    block; this is for calibration only.
// Exit code 0 only when every requested model meets all three bars.
//
// Needs CLAUDE_CODE_OAUTH_TOKEN (never read or printed here).
//
// Usage:
//   npx tsx scripts/news/calibrate-judge.mjs <out-dir> [--models claude-haiku-5-5,claude-sonnet-5-5,claude-opus-5-5] [--concurrency 3]

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { callWorkerClaude, hasClaudeSubscriptionToken } from '../../apps/worker/src/claude-call.ts';
import { judgeWriting } from '../../apps/worker/src/extract/judge-client.ts';
import { ExtractUsageStore } from '../../apps/worker/src/extract/usage-store.ts';
import { GOLD_RUNS, evaluateModel, judgeInputFor, renderTable } from './calibrate-judge-score.mjs';

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), '../../apps/worker/src/extract/__fixtures__/judge-calibration');
const MODEL_PATTERN = /^[a-z0-9.-]+$/;

function readRows(name) {
  return readFileSync(join(FIXTURES, name), 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
}

function textFlag(args, name) {
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

async function judgeRow(usage, claude, row, legacy) {
  const verdict = await judgeWriting(usage, judgeInputFor(row, { legacy }), claude);
  const base = { kitId: row.kitId, ...(row.expect_fail_on ? { expectFailOn: row.expect_fail_on } : {}) };
  return verdict.status === 'ok'
    ? { ...base, status: 'ok', pass: verdict.pass, writingScore: verdict.writingScore, scores: verdict.scores, reasons: verdict.reasons }
    : { ...base, status: 'deferred', reason: verdict.reason };
}

async function main() {
  const args = process.argv.slice(2);
  const outDir = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  if (!outDir) throw new Error('usage: calibrate-judge.mjs <out-dir> [--models a,b] [--concurrency N]');
  if (!hasClaudeSubscriptionToken()) {
    throw new Error('CLAUDE_CODE_OAUTH_TOKEN is not set; export a subscription token (claude setup-token) in this shell, then rerun');
  }
  const models = (textFlag(args, '--models') ?? 'claude-opus-5-5').split(',').filter(Boolean);
  if (models.length === 0 || !models.every((m) => MODEL_PATTERN.test(m))) throw new Error('--models must be a comma list of ^[a-z0-9.-]+$');
  const concurrency = Math.max(1, Number(textFlag(args, '--concurrency') ?? 3));
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });

  const gold = readRows('gold.jsonl');
  const negatives = readRows('negatives.jsonl');
  const legacy = readRows('legacy.jsonl');
  const db = { todaysCallCount: async () => 0, incrementToday: async () => undefined };
  const usage = await ExtractUsageStore.create(db, 10_000, 10_000);

  const byModel = {};
  for (const model of models) {
    const claude = (request) => callWorkerClaude({ ...request, model });
    const goldRuns = [];
    for (let run = 0; run < GOLD_RUNS; run += 1) {
      goldRuns.push(await mapLimit(gold, concurrency, (row) => judgeRow(usage, claude, row, false)));
    }
    const negativeResults = await mapLimit(negatives, concurrency, (row) => judgeRow(usage, claude, row, false));
    const legacyResults = await mapLimit(legacy, concurrency, (row) => judgeRow(usage, claude, row, true));
    const raw = { gold: goldRuns, negatives: negativeResults, legacy: legacyResults };
    byModel[model] = evaluateModel(raw);
    writeFileSync(join(out, `${model}.json`), JSON.stringify({ evaluation: byModel[model], ...raw }, null, 2));
    console.error(`${model}: accepted=${byModel[model].accepted}`);
  }
  writeFileSync(join(out, 'summary.json'), JSON.stringify({ codeSha: process.env.GITHUB_SHA ?? null, byModel }, null, 2));
  console.log(renderTable(byModel));
  return models.every((m) => byModel[m].accepted) ? 0 : 1;
}

if (process.argv[1]?.split('\\').join('/').endsWith('scripts/news/calibrate-judge.mjs')) {
  runMain(main, { name: 'calibrate-judge' });
}
