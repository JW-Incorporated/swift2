#!/usr/bin/env node
// Routine failure triage (BOTS-LOOP, docs/decisions.md 2026-10-05). A routine
// run that dies — turn cap, timeout, setup error — used to leave a red run
// nobody read. Plain code, no LLM: the `routine-failure-triage.yml` workflow
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
const LOG_LINES = 30;
const LINE_CHARS = 300;
// Tree's draft receipts (scripts/social/draft-receipt.mjs) title themselves by run kind and day.
export const RECEIPT_TITLES = {
  'routine-tree-daily-draft': (day) => `tree: daily draft run failed ${day}`,
  'routine-tree-event-draft': (day) => `tree: event draft run failed ${day}`,
};
const SECRET_RE = /token|secret|key|password/i;
const MAX_TURNS_RE = /error_max_turns|max[ _-]?turns/i;

const warn = (message) => console.log(`::warning::routine-failure-triage: ${message}`);
const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);

/** Never lets a line that could carry a credential into a public issue. */
export function redact(lines) {
  return lines.map((l) => (SECRET_RE.test(l) ? '[line withheld: matched a secret-like word]' : l));
}

/**
 * `gh run view --log-failed` rows are `job<TAB>step<TAB>timestamp message`.
 * Returns the failing step's name and the last lines, prefixes stripped, secret-like lines withheld.
 */
export function parseFailedLog(text, max = LOG_LINES) {
  const rows = String(text ?? '').split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.trim());
  const first = rows[0]?.split('\t') ?? [];
  const failingStep = first.length >= 3 ? `${first[0]} / ${first[1]}`.trim() : null;
  const stripped = rows.map((l) => {
    const parts = l.split('\t');
    const msg = (parts.length >= 3 ? parts.slice(2).join('\t') : l).replace(/^\d{4}-\d\d-\d\dT[\d:.]+Z\s?/, '');
    return msg.slice(0, LINE_CHARS);
  });
  return { failingStep, tail: redact(stripped.slice(-max)) };
}

export const failureMarker = (workflow, day) => `<!-- routine-failure: ${workflow} ${day} -->`;
export const askMarker = (workflow, day) => renderMarker(`routine-failure-${workflow}-${day}`, null);

export function buildFailureIssue({ workflow, runUrl, conclusion, failingStep, tail, day }) {
  const body = [
    `**Routine failure:** \`${workflow}\` ended \`${conclusion}\` on ${day} (UTC). Run: ${runUrl}`,
    `**Failing step:** ${failingStep ? `\`${failingStep}\`` : 'not found in the log (setup, auth or timeout — open the run)'}`,
    tail.length > 0 ? `**Last ${tail.length} log lines** (secret-like lines withheld):\n\n\`\`\`\n${tail.join('\n').replace(/```/g, "'''")}\n\`\`\`` : '**Log:** empty — open the run.',
    '**Marjorie:** diagnose from this body, then REROUTE to the build desk with a concrete fix brief (or to `HUMAN-ACTIONS.md` only if the fix needs a founder: a login, payment, secret value or approval — built with `node scripts/marjorie/escalate.mjs`, so it names the session and carries a copy-paste prompt). One failure issue per workflow per day: later failures today arrive as comments here.',
    failureMarker(workflow, day),
    askMarker(workflow, day),
  ].join('\n\n');
  return { title: `routine failure: ${workflow} ${day}`, body, labels: FAILURE_LABELS };
}

/** The same markers on an existing issue, so Marjorie's queue and the dedupe both find it. */
export const adoptionFooter = (workflow, day) => `${failureMarker(workflow, day)}\n${askMarker(workflow, day)}`;

async function ensureLabel(gh, repo) {
  try {
    await gh(['label', 'create', 'routine-failure', '--repo', repo, '--color', 'B60205', '--description', 'A routine workflow run failed — auto-filed for Marjorie', '--force']);
  } catch (err) {
    warn(`could not ensure the routine-failure label: ${String(err?.message || err).split('\n')[0].slice(0, 160)}`);
  }
}

async function readFailedLog(gh, repo, runId) {
  try {
    return String((await gh(['run', 'view', String(runId), '--repo', repo, '--log-failed'])).stdout ?? '');
  } catch (err) {
    warn(`could not read the failed log: ${String(err?.message || err).split('\n')[0].slice(0, 160)}`);
    return '';
  }
}

const issueNumber = (stdout) => Number(String(stdout ?? '').trim().split(/\s+/).pop()?.match(/\/issues\/(\d+)$/)?.[1]);

/**
 * Files, comments on or adopts the failure issue, then starts Marjorie.
 * Returns `{ action: 'skipped' | 'commented' | 'adopted' | 'filed', number? }`; never throws.
 */
export async function triage({ workflow, runId, runUrl, conclusion }, { repo = REPO, gh = ghRun, now = Date.now(), log = console.log } = {}) {
  try {
    if (!workflow || !runId) return { action: 'skipped', reason: 'missing workflow or run id' };
    if (workflow === 'routine-failure-triage') return { action: 'skipped', reason: 'never triages itself' };
    const failed = FAILED_CONCLUSIONS.has(conclusion);
    if (!failed && conclusion !== 'cancelled') return { action: 'skipped', reason: `conclusion ${conclusion}` };
    const raw = await readFailedLog(gh, repo, runId);
    // A cancelled run is a manual stop or a concurrency swap unless it died on the turn cap.
    if (!failed && !MAX_TURNS_RE.test(raw)) return { action: 'skipped', reason: 'cancelled, not a max-turns stop' };
    const day = utcDay(now);
    const { failingStep, tail } = parseFailedLog(raw);
    const marker = failureMarker(workflow, day);
    const api = apiFor(gh);

    const existing = (await listIssuesByLabels(api, { repo, labels: ['routine-failure'], state: 'open' })).find((i) => String(i.body).includes(marker));
    if (existing) {
      const comments = (await api(`/repos/${repo}/issues/${existing.number}/comments?per_page=100`)) || [];
      if (!String(existing.body).includes(runUrl) && !comments.some((c) => String(c.body ?? '').includes(runUrl))) {
        await gh(['issue', 'comment', String(existing.number), '--repo', repo, '--body', `Another failure today: \`${conclusion}\` — ${runUrl}`]);
      }
      log(`routine-failure-triage: #${existing.number} already open for ${workflow} ${day}.`);
      return { action: 'commented', number: existing.number };
    }

    await ensureLabel(gh, repo);
    const receiptTitle = RECEIPT_TITLES[workflow]?.(day);
    const receipt = receiptTitle ? (await listIssuesByLabels(api, { repo, labels: ['desk:tree'], state: 'open' })).find((i) => i.title === receiptTitle) : null;
    let number;
    let action;
    if (receipt) {
      const args = ['issue', 'edit', String(receipt.number), '--repo', repo, '--body', `${receipt.body}\n\n${adoptionFooter(workflow, day)}`];
      for (const label of FAILURE_LABELS) args.push('--add-label', label);
      // Exactly one desk:* label is "routed" (scripts/check-work-ownership.mjs); Marjorie owns it now.
      args.push('--remove-label', 'desk:tree');
      await gh(args);
      number = receipt.number;
      action = 'adopted';
    } else {
      const { title, body, labels } = buildFailureIssue({ workflow, runUrl, conclusion, failingStep, tail, day });
      const args = ['issue', 'create', '--repo', repo, '--title', title, '--body', body];
      for (const label of labels) args.push('--label', label);
      number = issueNumber((await gh(args)).stdout);
      if (!number) throw new Error('gh issue create printed no issue URL');
      action = 'filed';
    }
    log(`routine-failure-triage: ${action} #${number} for ${workflow} ${day}.`);
    await dispatchResponse('to-marjorie', number, { repo, gh, now, log });
    return { action, number };
  } catch (err) {
    warn(`${workflow}: ${String(err?.message || err).split('\n')[0].slice(0, 200)}`);
    return { action: 'skipped', reason: 'error' };
  }
}

async function main() {
  const { flags } = parseArgs(['triage', ...process.argv.slice(2)]);
  const missing = ['workflow', 'run-id', 'run-url', 'conclusion'].filter((n) => typeof flags[n] !== 'string');
  if (missing.length > 0) throw new Error(`missing --${missing.join(', --')}`);
  await triage({ workflow: flags.workflow, runId: flags['run-id'], runUrl: flags['run-url'], conclusion: flags.conclusion });
  return 0;
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/marjorie/routine-failure-triage.mjs')) {
  runMain(main, { name: 'routine-failure-triage' });
}
