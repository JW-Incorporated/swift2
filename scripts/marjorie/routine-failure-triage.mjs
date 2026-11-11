#!/usr/bin/env node
// Routine failure triage (BOTS-LOOP, docs/decisions.md 2026-10-05). A routine
// run that dies — turn cap, timeout, setup error — used to leave a red run
// nobody read. Plain code, no LLM: the `bot-failure-triage.yml` workflow
// (workflow_run on every routine-*) calls this, which files ONE issue per
// workflow per UTC day for Marjorie and starts her response routine, so the
// team handles it before a founder ever sees it.
//
//   node scripts/marjorie/routine-failure-triage.mjs --workflow <routine-x> --run-id <id> --run-url <url> --conclusion <failure|timed_out|cancelled>
//
// One mechanism: Tree's draft receipts (`desk:tree`, scripts/social/draft-receipt.mjs)
// are ADOPTED rather than duplicated — the receipt issue gets the markers and
// labels below instead of a second issue being filed. Marjorie's queue
// (lib/loop-queue.mjs) reads `routine-failure` + `desk:ops` issues that carry
// the loop-ask marker. A GitHub failure is a ::warning:: and exit 0.
import { runMain } from '../lib/cli.mjs';
import { gh as ghRun } from '../lib/gh.mjs';
import { REPO, renderMarker } from './lib/loop-asks.mjs';
import { dispatchResponse } from './lib/loop-dispatch.mjs';
import { apiFor, listIssuesByLabels } from './lib/issues-rest.mjs';
import { parseArgs } from './loop-asks.mjs';

export const FAILURE_LABELS = ['desk:ops', 'marjorie-filed', 'routine-failure'];
export const FAILED_CONCLUSIONS = new Set(['failure', 'timed_out']);
export const OPS_FIX_WORKFLOW = 'routine-ops-fix';
export const OPS_FIX_LABEL = 'ops-fix:stuck';
// The repo is public: the issue carries names and the run URL only, never log text. Marjorie reads the logs herself.
export const COMMENT_MARKER = '<!-- routine-failure-comment -->';
export const COMMENT_MIN_GAP_MS = 3_600_000;
export const COMMENT_MAX = 5;
export const FAILURE_DAILY_CAP = 6;
// Tree's draft receipts (scripts/social/draft-receipt.mjs) title themselves by run kind and day.
export const RECEIPT_TITLES = {
  'routine-tree-daily-draft': (day) => `tree: daily draft run failed ${day}`,
  'routine-tree-event-draft': (day) => `tree: event draft run failed ${day}`,
};
// GitHub reports a timeout-minutes stop as `cancelled`; a manual cancel looks the same. The job's check-run
// annotation tells them apart: only a timeout says this. (Max-turns stops surface as `failure`, not `cancelled`.)
const TIMEOUT_RE = /exceeded the maximum execution time/i;
const USAGE_LIMIT_GRACE_MS = 15 * 60_000;
// scripts/routines/session-outcome.mjs failureHint writes this into the failed job's annotation when the plan's usage limit is hit.
const USAGE_LIMIT_RE = /plan usage for this account is exhausted/i;
// The exact title prefix this script writes; its daily dispatch cap counts only issues carrying it.
export const TITLE_PREFIX = 'routine failure:';

const warn = (message) => console.log(`::warning::bot-failure-triage: ${message}`);
const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);

/** First failing job and step NAMES from `gh run view --json jobs`; never log text. */
export function failingJobStep(jobsJson) {
  const bad = new Set(['failure', 'timed_out', 'cancelled']);
  for (const job of jobsJson?.jobs ?? []) {
    if (!bad.has(job.conclusion)) continue;
    const step = (job.steps ?? []).find((s) => bad.has(s.conclusion));
    return { job: String(job.name ?? ''), step: step ? String(step.name ?? '') : null };
  }
  return { job: null, step: null };
}

export const failureMarker = (workflow, day) => `<!-- routine-failure: ${workflow} ${day} -->`;
export const askMarker = (workflow, day) => renderMarker(`routine-failure-${workflow}-${day}`, null);

export function buildFailureIssue({ workflow, runUrl, conclusion, job, step, day }) {
  const body = [
    `**Routine failure:** \`${workflow}\` ended \`${conclusion}\` on ${day} (UTC). Run: ${runUrl}`,
    `**Failing job / step:** ${job ? `\`${job}\`${step ? ` / \`${step}\`` : ''}` : 'not reported (setup, auth or timeout — open the run)'}`,
    `**Marjorie:** read the logs via the run URL — \`gh run view <id> --log-failed\`, filtered with \`tail\`/\`grep\` — and never paste raw log lines into an issue or comment (this repo is public). Diagnose, then REROUTE to the build desk with a concrete fix brief (or to \`HUMAN-ACTIONS.md\` only if the fix needs a founder: a login, payment, secret value or approval — built with \`node scripts/marjorie/escalate.mjs\`, so it names the session and carries a copy-paste prompt). One failure issue per workflow per day: later failures today arrive as comments here.`,
    failureMarker(workflow, day),
    askMarker(workflow, day),
  ].join('\n\n');
  return { title: `${TITLE_PREFIX} ${workflow} ${day}`, body, labels: FAILURE_LABELS };
}

/** The same markers on an existing issue, so Marjorie's queue and the dedupe both find it. */
export const adoptionFooter = (workflow, day) => `${failureMarker(workflow, day)}\n${askMarker(workflow, day)}`;

async function ensureLabels(gh, repo, names) {
  const defs = { 'routine-failure': ['B60205', 'A routine workflow run failed — auto-filed for Marjorie'], [OPS_FIX_LABEL]: ['D93F0B', 'The ops-fix routine itself failed — Marjorie/escalation only'] };
  for (const name of names) {
    try {
      await gh(['label', 'create', name, '--repo', repo, '--color', defs[name][0], '--description', defs[name][1], '--force']);
    } catch (err) {
      warn(`could not ensure the ${name} label: ${String(err?.message || err).split('\n')[0].slice(0, 160)}`);
    }
  }
}

async function readRun(gh, repo, runId, args) {
  try {
    return String((await gh(['run', 'view', String(runId), '--repo', repo, ...args])).stdout ?? '');
  } catch (err) {
    warn(`could not read the run: ${String(err?.message || err).split('\n')[0].slice(0, 160)}`);
    return '';
  }
}

const issueNumber = (stdout) => Number(String(stdout ?? '').trim().split(/\s+/).pop()?.match(/\/issues\/(\d+)$/)?.[1]);

/** True iff a cancelled job's check-run annotations say it exceeded the maximum execution time. Errors and empty annotations skip, with a warning. */
async function cancelledByTimeout(gh, repo, jobs, runUrl) {
  const cancelled = (jobs?.jobs ?? []).filter((j) => j.conclusion === 'cancelled');
  if (cancelled.length === 0) warn(`no cancelled job found, skipping: ${runUrl}`);
  for (const job of cancelled) {
    const id = job.databaseId ?? job.id;
    try {
      const rows = JSON.parse(String((await gh(['api', `repos/${repo}/check-runs/${id}/annotations`])).stdout || '[]'));
      if (!Array.isArray(rows) || rows.length === 0) warn(`no annotations for job ${id}, skipping: ${runUrl}`);
      else if (rows.some((a) => TIMEOUT_RE.test(String(a?.message ?? '')))) return true;
    } catch (err) {
      warn(`could not read annotations for job ${id} (${String(err?.message || err).split('\n')[0].slice(0, 120)}), skipping: ${runUrl}`);
    }
  }
  return false;
}

/** { resets } iff EVERY failed job carries the usage-limit annotation and the latest parsed reset is still ahead (15 min grace); else null. Fail-open: any other job, read error or missing reset means null (file the issue). */
async function blockedByUsageLimit(gh, repo, jobs, runUrl, now) {
  const bad = (jobs?.jobs ?? []).filter((j) => j.conclusion === 'failure' || j.conclusion === 'timed_out');
  if (bad.length === 0) return null;
  const messages = await Promise.all(bad.map(async (job) => {
    const id = job.databaseId ?? job.id;
    try {
      const rows = JSON.parse(String((await gh(['api', `repos/${repo}/check-runs/${id}/annotations`])).stdout || '[]'));
      const hit = Array.isArray(rows) ? rows.find((a) => USAGE_LIMIT_RE.test(String(a?.message ?? ''))) : null;
      return hit ? String(hit.message) : null;
    } catch (err) {
      warn(`could not read annotations for job ${id} (${String(err?.message || err).split('\n')[0].slice(0, 120)}), triaging anyway: ${runUrl}`);
      return null;
    }
  }));
  if (messages.some((m) => m === null)) return null;
  const times = messages.map((m) => Date.parse(m.match(/resets (\d{4}-\d{2}-\d{2}T[\d:.]+Z)/)?.[1] ?? '')).filter((t) => Number.isFinite(t));
  if (times.length === 0) return null;
  const reset = Math.max(...times);
  return now <= reset + USAGE_LIMIT_GRACE_MS ? { resets: new Date(reset).toISOString() } : null;
}

/** Whole-URL match (run 111 is not run 1111) without a substring test on a URL. */
export function mentionsUrl(text, url) {
  const escaped = String(url).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(escaped + '(?![0-9A-Za-z/_-])').test(String(text ?? ''));
}

/** One comment per repeat failure, but never within an hour of the last triage comment or past five. */
export function shouldComment(comments, now) {
  const mine = (comments || []).filter((c) => String(c.body ?? '').includes(COMMENT_MARKER));
  if (mine.length >= COMMENT_MAX) return false;
  const latest = Math.max(0, ...mine.map((c) => Date.parse(c.created_at ?? c.createdAt) || 0));
  return !(latest && now - latest < COMMENT_MIN_GAP_MS);
}

/**
 * Files, comments on or adopts the failure issue, then starts Marjorie.
 * Returns `{ action: 'skipped' | 'commented' | 'adopted' | 'filed', number? }`; never throws.
 */
export async function triage({ workflow, runId, runUrl, conclusion, day: dayOverride }, { repo = REPO, gh = ghRun, now = Date.now(), log = console.log } = {}) {
  try {
    if (!workflow || !runId) return { action: 'skipped', reason: 'missing workflow or run id' };
    if (workflow === 'bot-failure-triage') return { action: 'skipped', reason: 'never triages itself' };
    const failed = FAILED_CONCLUSIONS.has(conclusion);
    if (!failed && conclusion !== 'cancelled') return { action: 'skipped', reason: `conclusion ${conclusion}` };
    let jobs = null;
    try { jobs = JSON.parse(await readRun(gh, repo, runId, ['--json', 'jobs'])); } catch { /* names are best-effort */ }
    const { job, step } = failingJobStep(jobs);
    // A cancelled run is a manual stop or a concurrency swap unless a cancelled job's annotation says it hit the time limit.
    if (!failed && !(await cancelledByTimeout(gh, repo, jobs, runUrl))) return { action: 'skipped', reason: 'cancelled, not a timeout' };
    // A run that only died because the Claude plan's usage limit was exhausted is transient: the next scheduled run recovers.
    const limited = failed ? await blockedByUsageLimit(gh, repo, jobs, runUrl, now) : null;
    if (limited) {
      log(`bot-failure-triage: ${workflow} hit the plan usage limit, no issue filed.`);
      warn(`${workflow} failed on the plan usage limit (resets ${limited.resets}), no issue filed: ${runUrl}`);
      return { action: 'skipped', reason: 'usage-limit' };
    }
    const day = dayOverride ?? utcDay(now);
    const marker = failureMarker(workflow, day);
    const api = apiFor(gh);

    // state:all — a closed issue for today is commented on, never duplicated and never reopened.
    const existing = (await listIssuesByLabels(api, { repo, labels: ['routine-failure'], state: 'all' })).find((i) => String(i.body).includes(marker));
    if (existing) {
      const comments = (await api(`/repos/${repo}/issues/${existing.number}/comments?per_page=100`)) || [];
      const seen = [existing.body, ...comments.map((c) => c.body)].some((text) => mentionsUrl(text, runUrl));
      if (!seen && shouldComment(comments, now)) {
        await gh(['issue', 'comment', String(existing.number), '--repo', repo, '--body', `Another failure today: \`${conclusion}\` — ${runUrl}\n\n${COMMENT_MARKER}`]);
      }
      log(`bot-failure-triage: #${existing.number} already filed for ${workflow} ${day}.`);
      return { action: 'commented', number: existing.number };
    }

    const isOpsFix = workflow === OPS_FIX_WORKFLOW;
    await ensureLabels(gh, repo, isOpsFix ? ['routine-failure', OPS_FIX_LABEL] : ['routine-failure']);
    const receiptTitle = RECEIPT_TITLES[workflow]?.(day);
    const receipt = receiptTitle ? (await listIssuesByLabels(api, { repo, labels: ['desk:tree'], state: 'open' })).find((i) => i.title === receiptTitle) : null;
    const labels = isOpsFix ? [...FAILURE_LABELS, OPS_FIX_LABEL] : FAILURE_LABELS;
    let number;
    let action;
    if (receipt) {
      const args = ['issue', 'edit', String(receipt.number), '--repo', repo, '--body', `${receipt.body}\n\n${adoptionFooter(workflow, day)}`];
      for (const label of labels) args.push('--add-label', label);
      // Exactly one desk:* label is "routed" (scripts/check-work-ownership.mjs); Marjorie owns it now.
      args.push('--remove-label', 'desk:tree');
      await gh(args);
      number = receipt.number;
      action = 'adopted';
    } else {
      const issue = buildFailureIssue({ workflow, runUrl, conclusion, job, step, day });
      const args = ['issue', 'create', '--repo', repo, '--title', issue.title, '--body', issue.body];
      for (const label of labels) args.push('--label', label);
      number = issueNumber((await gh(args)).stdout);
      if (!number) throw new Error('gh issue create printed no issue URL');
      action = 'filed';
    }
    log(`bot-failure-triage: ${action} #${number} for ${workflow} ${day}.`);
    // The ops-fix routine's own failures go to Marjorie/escalation only — never back into a dispatch loop.
    if (!isOpsFix) {
      // Failure dispatches have their own daily cap, counted from today's failure issues (this one included), not Tree's shared run count.
      const countToday = async () => (await listIssuesByLabels(api, { repo, labels: ['routine-failure'], state: 'all' })).filter((i) => String(i.title).startsWith(TITLE_PREFIX) && utcDay(Date.parse(i.createdAt)) === day).length - 1;
      await dispatchResponse('to-marjorie', number, { repo, gh, now, log, cap: FAILURE_DAILY_CAP, countToday });
    }
    return { action, number };
  } catch (err) {
    warn(`${workflow}: ${String(err?.message || err).split('\n')[0].slice(0, 200)}`);
    return { action: 'skipped', reason: 'error' };
  }
}

export const SWEEP_WINDOW_MS = 2 * 3_600_000;
export const SWEEP_LIST_MS = 6 * 3_600_000;
const SWEEP_PAGE = 100;
const SWEEP_MAX_PAGES = 10;

/** The dedupe day is the run's completion day on every path, so workflow_run and the sweep agree across midnight. */
export const dayOf = (updatedAt, now) => utcDay(Date.parse(updatedAt) || now);
const ROUTINE_PATH_RE = /^\.github\/workflows\/(routine-(?!template\b)[a-z0-9-]+)\.yml(?:@|$)/;

/**
 * Catches failures that never produced a workflow_run event (runs started with GITHUB_TOKEN emit none).
 * Every failed/timed-out/cancelled main run of a routine-* workflow in the window goes through triage();
 * its per-workflow-per-day marker and run-URL check make overlap with the workflow_run path, or with the
 * previous sweep, a no-op (no second issue, no second dispatch). The day is the run's completion day so a
 * sweep just after midnight joins the issue the workflow_run path filed for that run.
 */
export async function sweep({ repo = REPO, gh = ghRun, now = Date.now(), log = console.log } = {}) {
  const since = new Date(now - SWEEP_LIST_MS).toISOString().replace(/\.\d+Z$/, 'Z');
  const runs = new Map();
  for (const status of ['failure', 'timed_out', 'cancelled']) {
    try {
      for (let page = 1; page <= SWEEP_MAX_PAGES; page++) {
        const out = JSON.parse(String((await gh(['api', `repos/${repo}/actions/runs?status=${status}&branch=main&created=%3E%3D${since}&per_page=${SWEEP_PAGE}&page=${page}`])).stdout || '{}'));
        const rows = out.workflow_runs ?? [];
        for (const run of rows) runs.set(run.id, run);
        if (rows.length < SWEEP_PAGE) break;
      }
    } catch (err) {
      warn(`could not list ${status} runs: ${String(err?.message || err).split('\n')[0].slice(0, 160)}`);
    }
  }
  const results = [];
  for (const run of [...runs.values()].sort((a, b) => a.id - b.id)) {
    const workflow = ROUTINE_PATH_RE.exec(String(run.path ?? ''))?.[1];
    if (!workflow || run.head_branch !== 'main' || !['failure', 'timed_out', 'cancelled'].includes(run.conclusion)) continue;
    if (Date.parse(run.updated_at) < now - SWEEP_WINDOW_MS) continue;
    const day = dayOf(run.updated_at, now);
    results.push(await triage({ workflow, runId: String(run.id), runUrl: run.html_url, conclusion: run.conclusion, day }, { repo, gh, now, log }));
  }
  log(`bot-failure-triage: swept ${results.length} failed routine run(s).`);
  return results;
}

async function main() {
  if (process.argv.includes('--sweep')) {
    await sweep();
    return 0;
  }
  const { flags } = parseArgs(['triage', ...process.argv.slice(2)]);
  const missing = ['workflow', 'run-id', 'run-url', 'conclusion'].filter((n) => typeof flags[n] !== 'string');
  if (missing.length > 0) throw new Error(`missing --${missing.join(', --')}`);
  await triage({ workflow: flags.workflow, runId: flags['run-id'], runUrl: flags['run-url'], conclusion: flags.conclusion, day: typeof flags['updated-at'] === 'string' ? dayOf(flags['updated-at'], Date.now()) : undefined });
  return 0;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/marjorie/routine-failure-triage.mjs')) {
  runMain(main, { name: 'bot-failure-triage' });
}
