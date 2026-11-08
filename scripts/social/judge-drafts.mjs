#!/usr/bin/env node
// Independent social judge (docs/decisions.md 2026-11-08 "Shared voice system").
// Scores each queue draft's caption with a separate claude-opus-5-5 call
// against the social rubric (lib/judge-rubric.mjs) and writes
// `critique.judge = { model, scores, at, bodyHash }` into the draft file. It
// writes nothing else, never `approval`, and never posts. check-drafts.mjs
// (inside social-tree-approve) deterministically requires every score >= 4.
//
// Needs CLAUDE_CODE_OAUTH_TOKEN (never read or printed here).
//
// Usage:
//   node scripts/social/judge-drafts.mjs --dir <queue-dir> [--summary <out.md>] [--model <id>]
//   node scripts/social/judge-drafts.mjs <file.json> [file.json …]
//
// Exit 0 when every draft ended up with a valid judge record (a low score is
// recorded, not an error: the approval gate decides). Exit 1 when any call
// was unavailable/invalid, so a workflow never commits a partial result.

import { appendFileSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { callClaude } from '../lib/claude-call.mjs';
import {
  JUDGE_DIMENSIONS,
  JUDGE_MODEL,
  JUDGE_SCHEMA,
  JUDGE_SYSTEM_PROMPT,
  bodyHash,
  buildJudgeRecord,
  checkJudge,
  buildJudgeUserMessage,
  parseJudgeOutput,
} from './lib/judge-rubric.mjs';

const MODEL_PATTERN = /^[a-z0-9.-]+$/;

/** One caption through the judge. `claude` is injectable for tests. Returns `{ status: 'ok', scores, reasons } | { status, reason }`. */
export async function judgeCaption({ platform, body }, { claude = callClaude, model = JUDGE_MODEL } = {}) {
  const response = await claude({
    caller: 'social-draft-judge',
    priority: 'P1',
    model,
    system: `${JUDGE_SYSTEM_PROMPT}\nReturn only JSON matching the required schema.`,
    user: buildJudgeUserMessage({ platform, body }),
    schema: JUDGE_SCHEMA,
  });
  if (response.status !== 'ok') return { status: response.status, reason: response.reason ?? 'unknown' };
  const parsed = parseJudgeOutput(response.data);
  return parsed ? { status: 'ok', ...parsed } : { status: 'invalid', reason: 'invalid_scores' };
}

/** True when the draft already carries a judge record for this exact body by this model. */
export function alreadyJudged(item, model = JUDGE_MODEL) {
  const judge = item?.critique?.judge;
  return Boolean(judge) && judge.model === model && judge.bodyHash === bodyHash(item.body);
}

/** Judges one parsed draft; returns `{ item, outcome }` where item has `critique.judge` set on success. */
export async function judgeItem(item, { claude, model = JUDGE_MODEL, now = () => new Date() } = {}) {
  if (item?.critique === null || typeof item?.critique !== 'object' || typeof item.body !== 'string') {
    return { item, outcome: { status: 'invalid', reason: 'draft has no critique object or body' } };
  }
  if (alreadyJudged(item, model)) return { item, outcome: { status: 'skipped', reason: 'already judged' } };
  const result = await judgeCaption(item, { claude, model });
  if (result.status !== 'ok') return { item, outcome: result };
  const judge = buildJudgeRecord({ model, scores: result.scores, body: item.body, at: now().toISOString() });
  return { item: { ...item, critique: { ...item.critique, judge } }, outcome: result };
}

function summaryLine(file, outcome) {
  if (outcome.status === 'skipped') return `- \`${file}\`: already judged`;
  if (outcome.status !== 'ok') return `- \`${file}\`: NOT judged (${outcome.reason})`;
  const scores = JUDGE_DIMENSIONS.map((d) => `${d} ${outcome.scores[d]}`).join(', ');
  const low = JUDGE_DIMENSIONS.filter((d) => outcome.scores[d] < 4).map((d) => `${d}: ${outcome.reasons[d]}`);
  return `- \`${file}\`: ${scores}${low.length ? `\n  - below 4 — ${low.join(' | ')}` : ''}`;
}

function targetsFrom(args) {
  const dirIdx = args.indexOf('--dir');
  if (dirIdx !== -1) {
    const dir = args[dirIdx + 1];
    if (!dir) throw new Error('--dir requires a path');
    return readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => path.join(dir, f));
  }
  const skip = new Set(['--summary', '--model']);
  return args.filter((a, i) => !a.startsWith('--') && !skip.has(args[i - 1]));
}

function flag(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

async function main() {
  const args = process.argv.slice(2);
  const model = flag(args, '--model') ?? JUDGE_MODEL;
  if (!MODEL_PATTERN.test(model)) throw new Error('--model must match ^[a-z0-9.-]+$');
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) throw new Error('CLAUDE_CODE_OAUTH_TOKEN is not set');
  const files = targetsFrom(args);
  if (files.length === 0) {
    console.log('judge-drafts: no draft files to judge.');
    return 0;
  }
  const lines = [];
  let failed = false;
  let allPass = true;
  for (const file of files) {
    const item = JSON.parse(readFileSync(file, 'utf8'));
    const { item: judged, outcome } = await judgeItem(item, { model });
    if (outcome.status === 'ok') writeFileSync(file, `${JSON.stringify(judged, null, 2)}\n`);
    else if (outcome.status !== 'skipped') failed = true;
    if (checkJudge(judged, { required: true }).length > 0) allPass = false;
    lines.push(summaryLine(path.basename(file), outcome));
  }
  const summary = `## Independent social judge (${model})\n\n${lines.join('\n')}\n`;
  const out = flag(args, '--summary');
  if (out) writeFileSync(out, summary);
  console.log(summary);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `all_pass=${!failed && allPass}
`);
  return failed ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  runMain(main, { name: 'judge-drafts' });
}
