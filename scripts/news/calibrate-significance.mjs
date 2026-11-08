#!/usr/bin/env node
// Significance calibration gate (docs/decisions.md 2026-11-08). Runs the layer-1
// rules and then the Opus judge over scripts/news/fixtures/significance-labels.jsonl
// (live items labeled IMPORTANT / MARGINAL / NOISE), SIGNIFICANCE_RUNS times,
// plus the held-out set significance-holdout.jsonl, reported separately. A row is held
// when a rule trips or the judge says tier 3 (a deferred judge counts as held, so a
// deferred NOISE row counts as held, but any deferral still fails the run). Acceptance,
// every run on BOTH sets: at least 90% of NOISE held, at least 95% of IMPORTANT kept.
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
  evaluateSets,
  judgeInputFor,
  layerOneResults,
  normalizeRow,
  renderTable,
  runOutcomes,
} from './calibrate-significance-score.mjs';

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const SETS = { fixture: 'significance-labels.jsonl', holdout: 'significance-holdout.jsonl' };
const MODEL_PATTERN = /^[a-z0-9.-]+$/;

function readSet(file) {
  return readFileSync(join(FIXTURES, file), 'utf8').split(/\r?\n/).filter((l) => l.trim()).map((l) => normalizeRow(JSON.parse(l)));
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

  const sets = Object.fromEntries(Object.entries(SETS).map(([name, file]) => [name, readSet(file)]));
  const rules = Object.fromEntries(Object.entries(sets).map(([name, rows]) => [name, layerOneResults(rows)]));
  const db = { todaysCallCount: async () => 0, incrementToday: async () => undefined };
  const usage = await ExtractUsageStore.create(db, 10_000, 10_000);

  const byModel = {};
  for (const model of models) {
    const claude = (request) => callWorkerClaude({ ...request, model });
    const runsBySet = {};
    const detail = {};
    for (const [name, rows] of Object.entries(sets)) {
      runsBySet[name] = [];
      const raw = [];
      for (let run = 0; run < SIGNIFICANCE_RUNS; run += 1) {
        const verdicts = await mapLimit(rows, concurrency, (row, i) => (rules[name][i] ? null : judgeSignificance(usage, judgeInputFor(row), claude)));
        raw.push(verdicts);
        runsBySet[name].push(runOutcomes(rows, rules[name], verdicts));
      }
      detail[name] = rows.map((row, i) => ({ id: row.id, headline: row.headline, label: row.label, rule: rules[name][i], verdicts: raw.map((v) => v[i]) }));
    }
    byModel[model] = evaluateSets(runsBySet);
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
