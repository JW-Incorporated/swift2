#!/usr/bin/env node
// LOCAL prompt-tuning harness for the two-pass news writer. Runs the real
// composePost (writer -> deterministic gate -> judge, one rewrite) over a
// writer-eval-kit.jsonl through the worker's claude -p wrapper. No database.
//
// Needs CLAUDE_CODE_OAUTH_TOKEN in the environment: the wrapper only accepts
// the subscription token (`claude setup-token` mints one). It is never read or
// printed here.
//
// Usage:
//   npx tsx scripts/news/tune-writer.mjs <writer-eval-kit.jsonl> <out-dir> [--n 10] [--concurrency 2]

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runMain } from '../lib/cli.mjs';
import { composePost } from '../../apps/worker/src/extract/compose-post.ts';
import { ExtractUsageStore } from '../../apps/worker/src/extract/usage-store.ts';
import { hasClaudeSubscriptionToken } from '../../apps/worker/src/claude-call.ts';
import { contextFromText, renderSummary, sampleRows, summarizeRuns } from './tune-writer-summary.mjs';

function flag(args, name, fallback) {
  const i = args.indexOf(name);
  return i === -1 ? fallback : Number(args[i + 1]);
}

async function runOne(stores, row) {
  const composed = await composePost(stores, {
    headline: row.headline,
    statusHint: row.statusHint,
    facts: row.facts,
    context: contextFromText(row.contextText),
    sources: [],
  });
  return {
    kitId: row.kitId,
    headline: row.headline,
    statusHint: row.statusHint,
    status: composed.status,
    reason: composed.status === 'hold' ? composed.reason : undefined,
    writingScore: composed.status === 'ok' ? composed.writingScore : undefined,
    lead: composed.trace.lead,
    body: composed.trace.body,
    gateReasons: composed.trace.gateReasons,
    judgeScores: composed.trace.judgeScores,
    rewrites: composed.trace.rewrites,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const [kitPath, outDir] = args.filter((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  if (!kitPath || !outDir) throw new Error('usage: tune-writer.mjs <writer-eval-kit.jsonl> <out-dir> [--n N] [--concurrency N]');
  if (!hasClaudeSubscriptionToken()) {
    throw new Error('CLAUDE_CODE_OAUTH_TOKEN is not set; export a subscription token (claude setup-token) in this shell, then rerun');
  }
  const rows = sampleRows(readFileSync(resolve(kitPath), 'utf8'), flag(args, '--n', 0));
  const concurrency = Math.max(1, flag(args, '--concurrency', 2));
  const out = resolve(outDir);
  mkdirSync(out, { recursive: true });

  const db = { todaysCallCount: async () => 0, incrementToday: async () => undefined };
  const stores = {
    writer: await ExtractUsageStore.create(db, 10_000, 10_000),
    judge: await ExtractUsageStore.create(db, 10_000, 10_000),
  };
  const results = new Array(rows.length);
  let next = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (next < rows.length) {
      const i = next++;
      results[i] = await runOne(stores, rows[i]);
      writeFileSync(join(out, `${rows[i].kitId}.json`), JSON.stringify(results[i], null, 2));
      console.error(`[${i + 1}/${rows.length}] ${rows[i].kitId} ${results[i].status}${results[i].reason ? ` ${results[i].reason}` : ''}`);
    }
  }));

  const summary = summarizeRuns(results);
  writeFileSync(join(out, 'summary.json'), JSON.stringify({ summary, results }, null, 2));
  console.log(renderSummary(summary));
  return 0;
}

if (process.argv[1]?.split('\\').join('/').endsWith('scripts/news/tune-writer.mjs')) {
  runMain(main, { name: 'tune-writer' });
}
