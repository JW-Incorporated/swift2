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
//        [--writer-model claude-sonnet-5-5|claude-opus-5-5] [--judge-only <drafts.jsonl>]
//
// --judge-only skips the writer: each drafts.jsonl line is {kitId, lead, paragraphs:[{sentences:[{text, refs}]}]},
// matched to the kit item by kitId, then run through the same validation, writing gate and judge.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { runMain } from '../lib/cli.mjs';
import { validateDraft } from '../../apps/worker/src/extract/writer-client.ts';
import { composePost } from '../../apps/worker/src/extract/compose-post.ts';
import { ExtractUsageStore } from '../../apps/worker/src/extract/usage-store.ts';
import { hasClaudeSubscriptionToken } from '../../apps/worker/src/claude-call.ts';
import { contextFromText, renderSummary, sampleRows, summarizeRuns } from './tune-writer-summary.mjs';

/** The judge reads "today"/"this week" against OBSERVED_ON, so a kit row without one must fail loudly, never default to now. */
function requireObservedOn(row) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.observedOn ?? ''))) {
    throw new Error(`kit row ${row.kitId ?? '?'} has no observedOn; re-cut the kit from a backfill run that records it`);
  }
  return row.observedOn;
}

function flag(args, name, fallback) {
  const i = args.indexOf(name);
  return i === -1 ? fallback : Number(args[i + 1]);
}

function textFlag(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

const WRITER_MODELS = ['claude-sonnet-5-5', 'claude-opus-5-5'];

/** A writer stand-in that replays a supplied draft through the production validation. */
export function replayWriter(draft, row) {
  const allowed = new Set([...row.facts.map((f) => f.id), ...contextFromText(row.contextText).items.map((i) => i.id)]);
  return async () => {
    const { draft: valid, attempt, reasons } = validateDraft({ lead: draft.lead, paragraphs: draft.paragraphs }, allowed);
    return valid ? { status: 'ok', draft: valid } : { status: 'invalid', reasons, ...(attempt ? { attempt } : {}) };
  };
}

async function runOne(stores, row, options = {}) {
  const deps = options.draft ? { ...stores, write: replayWriter(options.draft, row), noRewrite: true } : stores;
  const composed = await composePost(deps, {
    headline: row.headline,
    observedOn: requireObservedOn(row),
    statusHint: row.statusHint,
    facts: row.facts,
    context: contextFromText(row.contextText),
    sources: [],
    ...(options.writerModel ? { writerModel: options.writerModel } : {}),
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
    judgeScores: composed.trace.judgeScores,
    judgeReasons: composed.trace.judgeReasons ?? null,
    gateReasons: composed.trace.gateReasons ?? null,
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
  const writerModel = textFlag(args, '--writer-model');
  if (writerModel && !WRITER_MODELS.includes(writerModel)) throw new Error(`--writer-model must be one of ${WRITER_MODELS.join(', ')}`);
  const judgeOnly = textFlag(args, '--judge-only');
  let rows = sampleRows(readFileSync(resolve(kitPath), 'utf8'), judgeOnly ? 0 : flag(args, '--n', 0));
  const drafts = new Map();
  if (judgeOnly) {
    for (const line of readFileSync(resolve(judgeOnly), 'utf8').split(/\r?\n/).filter((l) => l.trim())) {
      const draft = JSON.parse(line);
      if (!rows.some((r) => r.kitId === draft.kitId)) throw new Error(`draft kitId ${draft.kitId} is not in the kit`);
      drafts.set(draft.kitId, draft);
    }
    rows = rows.filter((r) => drafts.has(r.kitId));
  }
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
      results[i] = await runOne(stores, rows[i], { writerModel, draft: drafts.get(rows[i].kitId) });
      writeFileSync(join(out, `${rows[i].kitId}.json`), JSON.stringify(results[i], null, 2));
      console.error(`[${i + 1}/${rows.length}] ${rows[i].kitId} ${results[i].status}${results[i].reason ? ` ${results[i].reason}` : ''}`);
    }
  }));

  const summary = summarizeRuns(results);
  writeFileSync(join(out, 'summary.json'), JSON.stringify({ codeSha: process.env.GITHUB_SHA ?? null, writerModel: writerModel ?? 'default', judgeOnly: Boolean(judgeOnly), summary, results }, null, 2));
  console.log(renderSummary(summary));
  return 0;
}

if (process.argv[1]?.split('\\').join('/').endsWith('scripts/news/tune-writer.mjs')) {
  runMain(main, { name: 'tune-writer' });
}
