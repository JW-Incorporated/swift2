#!/usr/bin/env node
// Independent social judge (docs/decisions.md 2026-11-08 "Shared voice system").
// Scores each queue draft's caption with a separate claude-opus-5-5 call
// against the social rubric (lib/judge-rubric.mjs) and writes
// `critique.judge = { model, scores, at, bodyHash }` into the draft file. It
// writes nothing else, never `approval`, and never posts. check-drafts.mjs
// (inside social-tree-approve) deterministically requires every score >= 4.
//
// Needs CLAUDE_CODE_OAUTH_TOKEN (never read or printed here). That makes this a
// WORKFLOW-ONLY entrypoint: .github/workflows/social-draft-judge.yml is the only
// caller. A routine agent shell cannot run it — routine-template.yml passes the
// token to claude-code-action as an input and never into the agent's environment
// (issue #6933), so a drafting run that shells out to it only ever errors. Tree's
// pre-flight is a hand score against lib/judge-rubric.mjs's anchors (lessons L003).
//
// Usage:
//   node scripts/social/judge-drafts.mjs --dir <queue-dir> [--summary <out.md>] [--model <id>]
//   node scripts/social/judge-drafts.mjs <file.json> [file.json …]
//   node scripts/social/judge-drafts.mjs --sign <judged-files.json>
// `--reasons-out <file>` writes { "<basename>": { scores, reasons } } for the drafts judged
// this run. The reasons are deliberately NOT committed into the queue file (see
// buildJudgeRecord); this hands them to the same run's rewrite pass
// (scripts/social/rewrite-drafts.mjs, issue #6890) so a below-4 caption gets one rewrite that
// is given the judge's own words instead of a dark slot. `--pass <n>` labels the summary so a
// run that judges twice names both passes on the PR. `--already <judged-out.json>` keeps the
// second pass from re-scoring a caption the first pass already scored for the same body.
// The judge step runs with the Claude token and NO signing key and writes unsigned records
// (listing them via --judged-out); the sign step runs with ONLY SOCIAL_JUDGE_KEY and adds an
// HMAC `sig` to exactly those records. A record already in a draft is never trusted without a
// verifying sig, so a self-written critique.judge is overwritten, not skipped. The judge scores
// the caption `body` only (never altText or media); the draft's `why` travels with it as an
// untrusted <reference> block, with today's date, so a fact newer than the model's own knowledge
// is checkable instead of read as fabrication (#7080).
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
  signJudge,
  verifyJudgeSig,
} from './lib/judge-rubric.mjs';

const MODEL_PATTERN = /^[a-z0-9.-]+$/;

/** The judge is a workflow-only entrypoint (#6933): name its one caller so an agent shell that tries it gets routed, not just an opaque env error. */
export const MISSING_TOKEN =
  'CLAUDE_CODE_OAUTH_TOKEN is not set. judge-drafts.mjs only runs inside .github/workflows/social-draft-judge.yml, which judges every tree/draft PR and rewrites a caption under 4 on its own. A routine agent shell never has this token: routine-template.yml passes it to claude-code-action as an input, not into the environment. Do not call this from a drafting run - score by hand against the anchors in scripts/social/lib/judge-rubric.mjs instead (social/lessons.md L003).';

/**
 * One caption through the judge. `claude` is injectable for tests. The draft's
 * `why` travels with it as the untrusted <reference> block, and `now` dates the
 * message, so a real post-cutoff fact is not read as fabrication (#7080).
 * Returns `{ status: 'ok', scores, reasons } | { status, reason }`.
 */
export async function judgeCaption({ platform, body, why }, { claude = callClaude, model = JUDGE_MODEL, now = () => new Date() } = {}) {
  const response = await claude({
    caller: 'social-draft-judge',
    priority: 'P1',
    model,
    system: `${JUDGE_SYSTEM_PROMPT}\nReturn only JSON matching the required schema.`,
    user: buildJudgeUserMessage({ platform, body, why, now: now() }),
    schema: JUDGE_SCHEMA,
  });
  if (response.status !== 'ok') return { status: response.status, reason: response.reason ?? 'unknown' };
  const parsed = parseJudgeOutput(response.data);
  return parsed ? { status: 'ok', ...parsed } : { status: 'invalid', reason: 'invalid_scores' };
}

/** True only for a judge record whose signature verifies for this file, body and model; any other record (including one the drafter wrote) is ignored and re-judged. */
export function alreadyJudged(item, model = JUDGE_MODEL, { key = '', file = '' } = {}) {
  const judge = item?.critique?.judge;
  return Boolean(judge) && judge.model === model && judge.bodyHash === bodyHash(item.body) && verifyJudgeSig(judge, file, key);
}

/**
 * True for a record THIS run already wrote for this exact body: same model, bodyHash still
 * matching. Only ever consulted for a file named by `--already` (the `--judged-out` list of an
 * earlier pass in the same run), where the record's provenance is this process, not the draft —
 * so no signature is needed to trust it. It is what lets judge pass 2 score only the captions
 * the rewrite pass actually changed: re-scoring a caption that already cleared pass 1 would let
 * ordinary judge variance refuse a draft whose rewrite worked (#6890).
 */
export function judgedThisRun(item, model = JUDGE_MODEL) {
  const judge = item?.critique?.judge;
  return Boolean(judge) && judge.model === model && judge.bodyHash === bodyHash(item.body);
}

/** Adds `sig` to an existing judge record; null when there is nothing to sign or no key. */
export function signItem(item, file, key) {
  if (!key || !item?.critique?.judge) return null;
  return { ...item, critique: { ...item.critique, judge: { ...item.critique.judge, sig: signJudge(item.critique.judge, file, key) } } };
}

/** Judges one parsed draft; returns `{ item, outcome }` where item has `critique.judge` set on success. */
export async function judgeItem(item, { claude, model = JUDGE_MODEL, now = () => new Date(), key = '', file = '' } = {}) {
  if (item?.critique === null || typeof item?.critique !== 'object' || typeof item.body !== 'string') {
    return { item, outcome: { status: 'invalid', reason: 'draft has no critique object or body' } };
  }
  if (alreadyJudged(item, model, { key, file })) return { item, outcome: { status: 'skipped', reason: 'already judged' } };
  const result = await judgeCaption(item, { claude, model, now });
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
  const skip = new Set(['--summary', '--model', '--judged-out', '--reasons-out', '--pass', '--already']);
  return args.filter((a, i) => !a.startsWith('--') && !skip.has(args[i - 1]));
}

function flag(args, name) {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
}

/** `--sign <list.json>`: signs the judge records of the files the judge step wrote this run. Runs with only SOCIAL_JUDGE_KEY in env; without it the records stay unsigned (rollout). */
function signMode(args) {
  const key = process.env.SOCIAL_JUDGE_KEY ?? '';
  if (!key) {
    console.warn('::warning::judge records left unsigned: SOCIAL_JUDGE_KEY missing');
    return 0;
  }
  for (const file of JSON.parse(readFileSync(flag(args, '--sign'), 'utf8'))) {
    const signed = signItem(JSON.parse(readFileSync(file, 'utf8')), path.basename(file), key);
    if (signed) writeFileSync(file, `${JSON.stringify(signed, null, 2)}\n`);
  }
  return 0;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--sign')) return signMode(args);
  const model = flag(args, '--model') ?? JUDGE_MODEL;
  if (!MODEL_PATTERN.test(model)) throw new Error('--model must match ^[a-z0-9.-]+$');
  if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) throw new Error(MISSING_TOKEN);
  const files = targetsFrom(args);
  if (files.length === 0) {
    console.log('judge-drafts: no draft files to judge.');
    return 0;
  }
  const alreadyFlag = flag(args, '--already');
  const already = new Set(
    alreadyFlag ? JSON.parse(readFileSync(alreadyFlag, 'utf8')).map((f) => path.resolve(f)) : [],
  );
  const lines = [];
  const judgedFiles = [];
  const reasons = {};
  let failed = false;
  let allPass = true;
  for (const file of files) {
    const item = JSON.parse(readFileSync(file, 'utf8'));
    const { item: judged, outcome } = already.has(path.resolve(file)) && judgedThisRun(item, model)
      ? { item, outcome: { status: 'skipped', reason: 'already judged in this run' } }
      : await judgeItem(item, { model });
    if (outcome.status === 'ok') {
      writeFileSync(file, `${JSON.stringify(judged, null, 2)}\n`);
      judgedFiles.push(file);
      reasons[path.basename(file)] = { scores: outcome.scores, reasons: outcome.reasons };
    } else if (outcome.status !== 'skipped') failed = true;
    if (checkJudge(judged, { required: true }).length > 0) allPass = false;
    lines.push(summaryLine(path.basename(file), outcome));
  }
  const pass = flag(args, '--pass');
  const label = pass ? ` — judge pass ${pass}` : '';
  const summary = `## Independent social judge (${model})${label}\n\n${lines.join('\n')}\n`;
  const judgedOut = flag(args, '--judged-out');
  if (judgedOut) writeFileSync(judgedOut, JSON.stringify(judgedFiles));
  const reasonsOut = flag(args, '--reasons-out');
  if (reasonsOut) writeFileSync(reasonsOut, JSON.stringify(reasons, null, 2));
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
