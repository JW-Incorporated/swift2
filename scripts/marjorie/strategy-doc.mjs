// CLI for the living growth strategy (docs/strategy/growth-strategy.md; mechanics in
// lib/strategy-doc.mjs; charter: docs/agents/marjorie.md, "Visible strategy and owner steering").
//
//   node scripts/marjorie/strategy-doc.mjs check [--file <path>] [--previous <path>]
//       exit 1 listing every structural problem (default file: the checked-in strategy).
//   node scripts/marjorie/strategy-doc.mjs add-direction (--from-context <chat-context.json> | --text-file <path> | --text "<words>") [--date YYYY-MM-DD] [--file <path>]
//       chat only: append one dated owner steer + a changelog line, in place.
//   node scripts/marjorie/strategy-doc.mjs save-update --pr <N> [--focus "<≤300 chars>"] [--dir .scratch/out]
//       chat only: ask Fable to rewrite the affected sections after direction PR #N lands.
//   node scripts/marjorie/strategy-doc.mjs dispatch --dir <dir>          (plain `run:` step, workflow token)
//   node scripts/marjorie/strategy-doc.mjs wait-merged --pr <N> [--focus <text>] [--out <json>] [--minutes 20]
//       (plain `run:` step of routine-fable-strategy-update.yml: wait for the owner-direction PR to land;
//       writes skip=true|false, and on success the request {direction_pr, focus} the agent reads)
//   node scripts/marjorie/strategy-doc.mjs open-pr --file <proposal> --kind weekly|update [--run-url <url>]
//       (plain `run:` step, strategy-pr.yml: validate the agent's rewrite against main's file, then PR + auto-merge)
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { runMain } from '../lib/cli.mjs';
import { parseArgs } from './loop-asks.mjs';
import { addOwnerDirection, parseSections, STRATEGY_FILE, validateStrategy, CHANGELOG_HEADING } from './lib/strategy-doc.mjs';

export const UPDATE_WORKFLOW = 'routine-fable-strategy-update.yml';
export const DAILY_CAP = 4;
export const MAX_FOCUS = 300;
const USAGE =
  'usage: strategy-doc.mjs check [--file <path>] [--previous <path>]\n' +
  '       strategy-doc.mjs add-direction (--from-context <chat-context.json> | --text-file <path> | --text "<words>") [--date YYYY-MM-DD] [--file <path>]\n' +
  '       strategy-doc.mjs save-update --pr <N> [--focus "<text>"] [--dir <dir>]\n' +
  '       strategy-doc.mjs dispatch --dir <dir>\n' +
  '       strategy-doc.mjs wait-merged --pr <N> [--focus <text>] [--out <json>] [--minutes 20]\n' +
  '       strategy-doc.mjs open-pr --file <proposal> --kind weekly|update [--run-url <url>]';
const KINDS = {
  weekly: { trailer: 'Tier-2: Marjorie — weekly growth review', title: 'Weekly strategy rewrite', who: "Fable's weekly growth review" },
  update: { trailer: 'Tier-2: Fable — strategy update', title: 'Strategy update after owner direction', who: "Fable's same-day strategy update" },
};
const str = (v, fallback = '') => (typeof v === 'string' ? v : fallback);
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
const need = (flags, names) => {
  const missing = names.filter((n) => typeof flags[n] !== 'string');
  if (missing.length > 0) throw new Error(`missing --${missing.join(', --')}\n${USAGE}`);
};

/** Is this the owner-direction PR the update may build on? `wait` = still open, check again. */
export function judgeDirectionPr(view) {
  if (!view || typeof view !== 'object') return { ok: false, wait: false, reason: 'no such PR' };
  if (view.isCrossRepository) return { ok: false, wait: false, reason: 'PR is from a fork' };
  const files = (view.files ?? []).map((f) => f.path);
  if (files.length !== 1 || files[0] !== STRATEGY_FILE) return { ok: false, wait: false, reason: `PR must change only ${STRATEGY_FILE}` };
  if (view.state === 'MERGED') return { ok: true, wait: false, reason: 'merged' };
  if (view.state === 'OPEN') return { ok: false, wait: true, reason: 'still open' };
  return { ok: false, wait: false, reason: `PR is ${String(view.state).toLowerCase()}` };
}

/** The changelog lines `next` has that `before` lacks, for the PR body. */
export function newChangelogLines(before, next) {
  const lines = (t) => (parseSections(t).sections.find((s) => s.heading.startsWith(CHANGELOG_HEADING))?.body ?? '').split('\n').filter((l) => /^- /.test(l));
  const had = new Set(lines(before));
  return lines(next).filter((l) => !had.has(l));
}

function openPr({ file, kind, runUrl }) {
  const k = KINDS[kind];
  if (!k) throw new Error(`--kind must be weekly or update\n${USAGE}`);
  if (!existsSync(file)) {
    console.log(`::error::strategy-doc: no proposal at ${file} — the agent did not write the strategy rewrite its prompt requires`);
    return 1;
  }
  const proposal = read(file);
  const current = existsSync(STRATEGY_FILE) ? read(STRATEGY_FILE) : '';
  const problems = validateStrategy(proposal, current);
  if (problems.length > 0) {
    for (const p of problems) console.log(`::error::strategy-doc: ${p}`);
    return 1;
  }
  if (proposal.trim() === current.trim()) {
    console.log('strategy-doc: the rewrite equals main — no PR.');
    return 0;
  }
  const date = new Date().toISOString().slice(0, 10);
  const branch = `strategy/${kind}-${date}-${process.env.GITHUB_RUN_ID || Date.now()}`;
  mkdirSync(path.dirname(STRATEGY_FILE), { recursive: true });
  writeFileSync(STRATEGY_FILE, proposal.endsWith('\n') ? proposal : `${proposal}\n`);
  const ident = ['-c', 'user.name=github-actions[bot]', '-c', 'user.email=41898282+github-actions[bot]@users.noreply.github.com'];
  run('git', ['checkout', '-b', branch]);
  run('git', ['add', STRATEGY_FILE]);
  run('git', [...ident, 'commit', '-m', `${k.title} ${date}`, '-m', `Rewritten by ${k.who}.`, '-m', k.trailer]);
  run('git', ['push', '-u', 'origin', 'HEAD']);
  const added = newChangelogLines(current, proposal);
  const body = [
    `${k.title}: ${k.who} rewrote the living growth strategy (docs/strategy/growth-strategy.md). It lands on green CI with no founder merge; every Owner direction line is preserved (checked in code).`,
    '',
    '---',
    '',
    '**Changelog lines added**',
    ...(added.length > 0 ? added : ['- (none beyond edits to existing sections)']),
    ...(runUrl ? ['', `Run: ${runUrl}`] : []),
    '',
    k.trailer,
  ].join('\n');
  const url = run('gh', ['pr', 'create', '--title', `${k.title} ${date}`, '--body', body]);
  const number = /\/pull\/(\d+)/.exec(url)?.[1];
  console.log(`strategy-doc: opened ${url}`);
  if (number) {
    try {
      run('gh', ['pr', 'merge', number, '--squash', '--auto']);
    } catch {
      console.log(`::warning::strategy-doc: could not enable auto-merge on #${number}; it waits for a merge.`);
    }
  }
  return 0;
}

function dispatchUpdate({ dir }) {
  const file = path.join(dir, 'strategy-update-1.json');
  if (!existsSync(file)) {
    console.log('strategy-doc: no strategy update requested this run.');
    return 0;
  }
  let entry;
  try {
    entry = JSON.parse(readFileSync(file, 'utf8'));
  } catch {
    console.log('::warning::strategy-doc: the saved request is not valid JSON; not dispatched.');
    return 0;
  }
  const pr = Number(entry?.pr);
  if (!Number.isInteger(pr) || pr <= 0) {
    console.log('::warning::strategy-doc: the saved request has no valid PR number; not dispatched.');
    return 0;
  }
  const focus = str(entry?.focus).replace(/\p{Cc}+/gu, ' ').trim().slice(0, MAX_FOCUS);
  const repo = process.env.GITHUB_REPOSITORY;
  try {
    const since = new Date().toISOString().slice(0, 10);
    const used = Number(run('gh', ['api', `repos/${repo}/actions/workflows/${UPDATE_WORKFLOW}/runs?created=>=${since}&per_page=1`, '--jq', '.total_count']));
    if (used >= DAILY_CAP) {
      console.log(`::warning::strategy-doc: daily cap ${used}/${DAILY_CAP} reached; the weekly review picks the direction up.`);
      return 0;
    }
    run('gh', ['workflow', 'run', UPDATE_WORKFLOW, '--repo', repo, '--ref', 'main', '-f', `direction_pr=${pr}`, '-f', `focus=${focus}`]);
    console.log(`strategy-doc: started ${UPDATE_WORKFLOW} for direction PR #${pr} (${used + 1}/${DAILY_CAP} today).`);
  } catch (err) {
    console.log(`::warning::strategy-doc: dispatch failed: ${String(err.message).split('\n')[0].slice(0, 200)}`);
  }
  return 0;
}

async function waitMerged({ pr, minutes, focus, out }) {
  const deadline = Date.now() + minutes * 60_000;
  let verdict = { ok: false, wait: true, reason: 'not checked' };
  while (verdict.wait) {
    try {
      verdict = judgeDirectionPr(JSON.parse(run('gh', ['pr', 'view', String(pr), '--json', 'state,isCrossRepository,files'])));
    } catch (err) {
      verdict = { ok: false, wait: true, reason: String(err.message).split('\n')[0].slice(0, 120) };
    }
    if (!verdict.wait || Date.now() >= deadline) break;
    await new Promise((r) => setTimeout(r, 30_000));
  }
  if (verdict.wait) verdict = { ok: false, wait: false, reason: `not merged within ${minutes} minutes` };
  console.log(verdict.ok ? `strategy-doc: direction PR #${pr} is merged.` : `strategy-doc: skipping the update (${verdict.reason}); the weekly review honours the direction anyway.`);
  if (verdict.ok && out) {
    mkdirSync(path.dirname(out), { recursive: true });
    writeFileSync(out, `${JSON.stringify({ direction_pr: pr, focus: focus.replace(/\p{Cc}+/gu, ' ').trim().slice(0, MAX_FOCUS) })}\n`);
  }
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `skip=${!verdict.ok}\n`);
  return 0;
}

async function main() {
  const { command, flags } = parseArgs(process.argv.slice(2));
  if (command === 'check') {
    const file = str(flags.file, STRATEGY_FILE);
    const problems = validateStrategy(read(file), typeof flags.previous === 'string' ? read(flags.previous) : '');
    for (const p of problems) console.log(`strategy-doc: ${p}`);
    console.log(problems.length === 0 ? `strategy-doc: ${file} is well-formed.` : `strategy-doc: ${problems.length} problem(s).`);
    return problems.length === 0 ? 0 : 1;
  }
  if (command === 'add-direction') {
    const direction = typeof flags['from-context'] === 'string' ? JSON.parse(read(flags['from-context'])).text : typeof flags['text-file'] === 'string' ? read(flags['text-file']) : flags.text;
    if (typeof direction !== 'string') throw new Error(`need --from-context, --text-file or --text\n${USAGE}`);
    const file = str(flags.file, STRATEGY_FILE);
    const r = addOwnerDirection(read(file), { direction, ...(typeof flags.date === 'string' ? { date: flags.date } : {}) });
    if (r.added) writeFileSync(file, r.text);
    console.log(r.added ? `strategy-doc: appended the direction to ${file}.` : 'strategy-doc: that direction is already recorded.');
    return 0;
  }
  if (command === 'save-update') {
    need(flags, ['pr']);
    const dir = str(flags.dir, '.scratch/out');
    if (!/^\d+$/.test(flags.pr)) throw new Error('--pr must be a PR number');
    mkdirSync(dir, { recursive: true });
    const file = path.join(dir, 'strategy-update-1.json');
    if (existsSync(file)) {
      console.log('strategy-doc: one strategy update already saved this run.');
      return 0;
    }
    writeFileSync(file, `${JSON.stringify({ pr: Number(flags.pr), focus: str(flags.focus).slice(0, MAX_FOCUS) })}\n`);
    console.log(`strategy-doc: saved ${file} — a plain job starts Fable's rewrite after this run.`);
    return 0;
  }
  if (command === 'dispatch') {
    need(flags, ['dir']);
    return dispatchUpdate({ dir: flags.dir });
  }
  if (command === 'wait-merged') {
    need(flags, ['pr']);
    if (!/^d+$/.test(flags.pr)) throw new Error('--pr must be a PR number');
    return waitMerged({ pr: Number(flags.pr), minutes: Math.min(Number(flags.minutes) || 20, 25), focus: str(flags.focus), out: str(flags.out) });
  }
  if (command === 'open-pr') {
    need(flags, ['file', 'kind']);
    return openPr({ file: flags.file, kind: flags.kind, runUrl: str(flags['run-url']) });
  }
  throw new Error(USAGE);
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/marjorie/strategy-doc.mjs')) {
  runMain(main, { name: 'strategy-doc' });
}
