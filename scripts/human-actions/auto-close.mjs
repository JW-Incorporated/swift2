// Auto-close human actions whose outcome a machine can check (founder decision
// 2026-10-06, docs/decisions.md). An open HUMAN-ACTIONS.md entry may carry one
// hidden line under its heading:
//
//   <!-- ha verify: <kind> <args> -->
//
// kinds (a fixed, safe set — never a shell command; every check is one
// read-only `gh` call):
//   secret-exists <NAME>             repo Actions secret NAME is present
//   variable-equals <NAME> <VALUE>   repo Actions variable NAME equals VALUE
//   pr-merged <N>                    PR #N is merged
//   issue-closed <N>                 issue #N is closed
//   workflow-green <file.yml>        the latest completed run of that workflow succeeded
//
// The workflow GITHUB_TOKEN cannot read secret or variable settings (the repo
// admin API); those two kinds need a token with that permission in VERIFY_TOKEN,
// and when the read fails the entry is SKIPPED (left open), never closed.
// A passing check closes the entry through the ONE rolling close PR
// (scripts/marjorie/lib/status-closes.mjs), so it auto-merges like an owner
// `done` reply and the ledger line reads "auto-closed: <check> passed <date>".
//
//   node scripts/human-actions/auto-close.mjs [--dry-run]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../lib/cli.mjs';
import { HUMAN_ACTIONS_DONE_PATH, HUMAN_ACTIONS_PATH } from '../marjorie/human-actions.mjs';
import { cleanRecord, syncCloses } from '../marjorie/lib/status-closes.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const HEADING = /^##\s+#(\d+)\s/;
const VERIFY_LINE = /^<!--\s*ha verify:\s*(.*?)\s*-->\s*$/;
const NAME = /^[A-Za-z0-9_]{1,100}$/;
const VALUE = /^[A-Za-z0-9_.:/@+=-]{1,200}$/;
const NUM = /^\d{1,9}$/;
const WORKFLOW = /^[A-Za-z0-9_.-]{1,100}\.ya?ml$/;
const SKIP_LEDGER = /^-\s+#(\d+)\s*·[^·]*·\s*skip\s*·/;

/** `kind args…` → { kind, args, label } or null when it is not one of the safe kinds. */
export function parseVerify(text) {
  const [kind, ...args] = String(text || '').trim().split(/\s+/);
  const ok = {
    'secret-exists': () => args.length === 1 && NAME.test(args[0]),
    'variable-equals': () => args.length === 2 && NAME.test(args[0]) && VALUE.test(args[1]),
    'pr-merged': () => args.length === 1 && NUM.test(args[0]),
    'issue-closed': () => args.length === 1 && NUM.test(args[0]),
    'workflow-green': () => args.length === 1 && WORKFLOW.test(args[0]),
  }[kind];
  if (!ok || !ok()) return null;
  return { kind, args, label: `${kind} ${args.join(' ')}` };
}

/** Every open entry: { number, title, verifyText (raw, first verify line or null), verify (parsed or null) }. */
export function entriesWithVerify(openMd) {
  const out = [];
  let cur = null;
  for (const line of String(openMd || '').split(/\r?\n/)) {
    const h = HEADING.exec(line);
    if (h) {
      cur = { number: Number(h[1]), title: line, verifyText: null, verify: null, block: [] };
      out.push(cur);
      continue;
    }
    if (!cur) continue;
    cur.block.push(line);
    const v = VERIFY_LINE.exec(line.trim());
    if (v && cur.verifyText === null) {
      cur.verifyText = v[1];
      cur.verify = parseVerify(v[1]);
    }
  }
  return out;
}

/** Numbers the owner skipped — SKIP is final, so these are never touched. */
export function skippedNumbers(doneMd) {
  const out = new Set();
  for (const line of String(doneMd || '').split(/\r?\n/)) {
    const m = SKIP_LEDGER.exec(line);
    if (m) out.add(Number(m[1]));
  }
  return out;
}

/**
 * Evaluates one parsed check. `gh(args, { tokens })` runs read-only `gh` and
 * returns stdout (throws on failure). Returns 'pass' | 'fail' | 'skip' (the
 * check could not be evaluated — leave the entry open).
 */
export function evaluate(verify, { gh, repo }) {
  const [a, b] = verify.args;
  try {
    switch (verify.kind) {
      case 'secret-exists': {
        const names = JSON.parse(gh(['secret', 'list', '--repo', repo, '--json', 'name', '--limit', '500'], { admin: true }) || '[]');
        return names.some((s) => s.name === a) ? 'pass' : 'fail';
      }
      case 'variable-equals': {
        const got = gh(['variable', 'get', a, '--repo', repo], { admin: true });
        return String(got).trim() === b ? 'pass' : 'fail';
      }
      case 'pr-merged': {
        const pr = JSON.parse(gh(['pr', 'view', a, '--repo', repo, '--json', 'state']));
        return pr.state === 'MERGED' ? 'pass' : 'fail';
      }
      case 'issue-closed': {
        const issue = JSON.parse(gh(['issue', 'view', a, '--repo', repo, '--json', 'state']));
        return issue.state === 'CLOSED' ? 'pass' : 'fail';
      }
      case 'workflow-green': {
        const runs = JSON.parse(gh(['run', 'list', '--workflow', a, '--repo', repo, '--status', 'completed', '--limit', '1', '--json', 'conclusion']) || '[]');
        return runs[0]?.conclusion === 'success' ? 'pass' : 'fail';
      }
      default:
        return 'skip';
    }
  } catch {
    return 'skip';
  }
}

/** Pure: which open entries have a passing check. Returns { passed, failed, skipped, ignored }. */
export function evaluateAll(openMd, doneMd, { gh, repo }) {
  const skipped = skippedNumbers(doneMd);
  const res = { passed: [], failed: [], skipped: [], ignored: [] };
  for (const e of entriesWithVerify(openMd)) {
    if (skipped.has(e.number) || e.verifyText === null) { res.ignored.push(e.number); continue; }
    if (!e.verify) { res.skipped.push({ number: e.number, why: 'unrecognized verify line' }); continue; }
    const r = evaluate(e.verify, { gh, repo });
    if (r === 'pass') res.passed.push({ number: e.number, label: e.verify.label });
    else if (r === 'fail') res.failed.push(e.number);
    else res.skipped.push({ number: e.number, why: `${e.verify.label} could not be read` });
  }
  return res;
}

export const utcDate = (now = new Date()) => now.toISOString().slice(0, 10);

export function closeRecord({ number, label }, date) {
  return cleanRecord({ n: number, o: 'done', d: date, note: `auto-closed: ${label} passed ${date}`, by: 'auto-close', s: `auto-closed: ${label}` });
}

export async function main({ env = process.env, root = ROOT, exec = execFileSync, log = console.log, now = new Date(), argv = process.argv.slice(2) } = {}) {
  const repo = env.GITHUB_REPOSITORY || 'JW-Incorporated/swift2';
  const run = (cmd, args, opts = {}) => exec(cmd, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...env, ...opts.env } });
  const gh = (args, { admin = false } = {}) => {
    const tokens = admin ? [env.VERIFY_TOKEN, env.GH_TOKEN].filter(Boolean) : [env.GH_TOKEN];
    let last;
    for (const t of tokens.length ? tokens : [undefined]) {
      try { return run('gh', args, t ? { env: { GH_TOKEN: t } } : {}); } catch (err) { last = err; }
    }
    throw last;
  };
  const openMd = readFileSync(path.join(root, HUMAN_ACTIONS_PATH), 'utf8');
  const doneMd = readFileSync(path.join(root, HUMAN_ACTIONS_DONE_PATH), 'utf8');
  const res = evaluateAll(openMd, doneMd, { gh, repo });
  for (const s of res.skipped) log(`auto-close: #${s.number} left open — ${s.why}`);
  if (!res.passed.length) { log(`auto-close: nothing to close (${res.failed.length} check(s) not yet passing)`); return 0; }
  if (argv.includes('--dry-run')) {
    for (const p of res.passed) log(`auto-close: would close #${p.number} — ${p.label}`);
    return 0;
  }
  const date = utcDate(now);
  try {
    for (const p of res.passed) {
      const add = closeRecord(p, date);
      const out = await syncCloses({ root, run, repo, prToken: env.PR_TOKEN || '', add, log });
      log(`auto-close: #${p.number} ${out.ok ? (out.duplicate ? 'already queued' : 'queued') : `refused — ${out.reason}`} ${out.url || ''}`.trim());
    }
    return 0;
  } catch (err) {
    log(`auto-close: failed: ${String(err?.message || err).split('\n')[0].slice(0, 200)}`);
    return 1;
  } finally {
    try { run('git', ['checkout', '--force', '--quiet', 'main']); } catch { /* the job ends here anyway */ }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(() => main(), { name: 'ha-auto-close' });
}
