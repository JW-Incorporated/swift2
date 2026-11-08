#!/usr/bin/env node
// Significance calibration gate (docs/decisions.md 2026-11-08). Runs the layer-1
// rules and then the Opus judge over scripts/news/fixtures/significance-labels.jsonl
// (live items labeled IMPORTANT / MARGINAL / NOISE), SIGNIFICANCE_RUNS times.
// A row is held when a rule trips or the judge says tier 3. Acceptance, every run:
// at least 90% of NOISE held, at least 95% of IMPORTANT kept, nothing deferred.
// Rows a rule already holds skip the judge. Exit code 0 only when every model passes.
//
// Needs CLAUDE_CODE_OAUTH_TOKEN (never read or printed here).
//
// Usage:
//   npx tsx scripts/news/calibrate-significance.mjs <out-dir> [--models claude-opus-5-5] [--concurrency 3]

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { callWorkerClaude, hasClaudeSubscriptionToken } from '../../apps/worker/src/claude-call.ts';
import { judgeSignificance } from '../../apps/worker/src/extract/significance-client.ts';
import { ExtractUsageStore } from '../../apps/worker/src/extract/usage-store.ts';
import {
  SIGNIFICANCE_RUNS,
  evaluateRuns,
  judgeInputFor,
  layerOneResults,
  renderTable,
  runOutcomes,
} from './calibrate-significance-score.mjs';

const FIXTURE = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures/significance-labels.jsonl');
const MODEL_PATTERN = /^[a-z0-9.-]+$/;

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
      out[i] = await fn(items[i], i);
    }
  }));
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const outDir = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  if (!outDir) throw new Error('usage: calibrate-significance.mjs <out-dir> [--models a,b] [--concurrency N]');
  if (!hasClaudeSubscriptionToken()) {
    throw new Error('CLAUDE_CODE_OAUTH_TOKEN is not set; export a subscription token (claude setup-token) in this shell, then rerun');
  }
  const models = (textFlag(args, '--models') ?? 'claude-opus-5-5').split(',').filter(Boolean);
  if (models.length === 0 || !models.every((m) => MODEL_PATTERN.test(m))) throw new Error('--models must be a comma list of ^[a-z0-9.-]+$');
  const concurrency = Math.max(1, Number(textFlag(args, '--concurrency') ?? 3));
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });

  const rows = readFileSync(FIXTURE, 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => JSON.parse(l));
  const rules = layerOneResults(rows);
  const db = { todaysCallCount: async () => 0, incrementToday: async () => undefined };
  const usage = await ExtractUsageStore.create(db, 10_000, 10_000);

  const byModel = {};
  for (const model of models) {
    const claude = (request) => callWorkerClaude({ ...request, model });
    const runs = [];
    const raw = [];
    for (let run = 0; run < SIGNIFICANCE_RUNS; run += 1) {
      const verdicts = await mapLimit(rows, concurrency, (row, i) => (rules[i] ? null : judgeSignificance(usage, judgeInputFor(row), claude)));
      raw.push(verdicts);
      runs.push(runOutcomes(rows, rules, verdicts));
    }
    byModel[model] = evaluateRuns(runs);
    const detail = rows.map((row, i) => ({ id: row.id, headline: row.headline, label: row.label, rule: rules[i], verdicts: raw.map((v) => v[i]) }));
    writeFileSync(join(out, `${model}.json`), JSON.stringify({ evaluation: byModel[model], detail }, null, 2));
    console.error(`${model}: accepted=${byModel[model].accepted}`);
  }
  writeFileSync(join(out, 'summary.json'), JSON.stringify({ codeSha: process.env.GITHUB_SHA ?? null, byModel }, null, 2));
  console.log(renderTable(byModel));
  return models.every((m) => byModel[m].accepted) ? 0 : 1;
}

if (process.argv[1]?.split('\\').join('/').endsWith('scripts/news/calibrate-significance.mjs')) {
  runMain(main, { name: 'calibrate-significance' });
}
