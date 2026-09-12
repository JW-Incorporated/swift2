// Vault Run scheduled-cadence watchdog — deterministic, zero-AI.
//
// WHY THIS EXISTS. The founder asked (human-action swift2#58) that "confirm
// vault-run holds up under daily scheduling" stop being a recurring human
// check-in and instead be watched and reported by automation.
//
// BACKGROUND (2026-09-12). routine-vault-run.yml's SCHEDULED runs failed four
// days straight (2026-09-06 through 2026-09-09). A turn-budget fix landed
// 2026-09-10 (workflow_dispatch on branch fix/vault-run-turn-budget, then
// merged to main) and the very next scheduled run, 2026-09-11, succeeded.
// That is one clean day of scheduled data — not enough to call it durably
// fixed — so rather than a one-off human recheck, this script watches every
// future scheduled run and reports itself, the same shape as
// news-worker-rotation-check.mjs / karen-post-repair-check.mjs.
//
// WHAT IT WATCHES, using `gh run list --workflow routine-vault-run.yml`:
//   1. Any of the last N *scheduled* (event=schedule) runs failed.
//   2. No scheduled run has started in the last ~26h (missed schedule) —
//      the cron fires daily at 16:07 UTC (routine-vault-run.yml), so 26h
//      gives a comfortable grace window past the next expected fire without
//      paging on ordinary scheduling jitter.
//
// Deliberately excludes workflow_dispatch runs from both checks — a manual
// fix-verification run succeeding (or failing) says nothing about whether
// the CRON ITSELF is healthy, which is the one question this check exists
// to answer.
//
// Feeds the founder-task digest/mailer path (build-founder-digest.mjs +
// scripts/watchdog/send-mail.py) via a GitHub issue labelled `founder-task`,
// rather than a new bespoke alert channel — batch, don't spam. Uses the same
// persistent-issue upsert pattern as every other watchdog.yml alert
// (scripts/watchdog/upsert-alert.sh) so a multi-day outage is one evolving
// issue, not a new one every day.
//
// Usage: node --use-env-proxy scripts/watchdog/routine-vault-run-check.mjs \
//          --repo owner/name --alert-body /tmp/alert-body.md
// Exit: 0 = nothing to alarm on (recent scheduled runs all succeeded, or
//           still within the grace window since the last one) — caller closes.
//       1 = a scheduled run failed, or the schedule appears to have been
//           missed — caller opens.
//       2 = the check itself broke — caller must not report this as "clear".
import { writeFileSync } from 'node:fs';
import { gh } from '../lib/gh.mjs';
import { runMain } from '../lib/cli.mjs';

export const WORKFLOW = 'routine-vault-run.yml';
// How many of the most recent SCHEDULED runs to look back across for a
// failure. Small on purpose: this answers "is the cron healthy right now",
// not "audit the whole history" — that's what docs/agents/vault-run-plan.md
// is for.
export const LOOKBACK = 5;
// The cron fires daily at 16:07 UTC. 26h is a full day plus a couple hours'
// grace for ordinary GitHub Actions scheduling jitter (documented to slip
// during high load — see watchdog.yml's own header) before calling a missed
// day an alarm rather than noise.
export const MISSED_SCHEDULE_HOURS = 26;

/** Only the runs GitHub Actions started on its own cron, newest first. */
export function scheduledRuns(runs) {
  return (runs || [])
    .filter((r) => r.event === 'schedule')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/**
 * Evaluate cadence health. Pure — takes already-fetched runs, so it is
 * unit-testable without gh.
 *
 * @param {{runs: Array<{conclusion?: string, createdAt: string, event: string,
 *   headBranch?: string, url?: string}>, now?: Date|string}} args
 */
export function evaluate({ runs, now = new Date() }) {
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  const scheduled = scheduledRuns(runs);

  if (scheduled.length === 0) {
    return {
      status: 'no-data',
      reason: `No scheduled run of \`${WORKFLOW}\` has ever been recorded. Either the workflow was just added, or its cron trigger has never fired.`,
    };
  }

  const newest = scheduled[0];
  const ageH = (nowMs - Date.parse(newest.createdAt)) / 3_600_000;
  if (ageH > MISSED_SCHEDULE_HOURS) {
    return {
      status: 'missed-schedule',
      reason: `The newest scheduled run started ${Math.round(ageH)}h ago (run ${newest.url || newest.databaseId || ''}, ${newest.createdAt}) — expected at least one within ${MISSED_SCHEDULE_HOURS}h. The daily 16:07 UTC cron appears to have been skipped.`,
    };
  }

  const recent = scheduled.slice(0, LOOKBACK);
  const failures = recent.filter((r) => r.conclusion && r.conclusion !== 'success');
  const pending = recent.filter((r) => !r.conclusion);

  if (failures.length > 0) {
    const lines = failures
      .map((r) => `- ${r.createdAt}: \`${r.conclusion}\` — ${r.url || ''}`)
      .join('\n');
    return {
      status: 'failing',
      reason: `${failures.length} of the last ${recent.length} scheduled run(s) of \`${WORKFLOW}\` did not succeed:\n${lines}`,
      failures,
    };
  }

  if (pending.length === recent.length) {
    return {
      status: 'pending',
      reason: `The most recent scheduled run(s) of \`${WORKFLOW}\` are still in progress — no verdict yet.`,
    };
  }

  return {
    status: 'healthy',
    reason: `The last ${recent.length} scheduled run(s) of \`${WORKFLOW}\` all succeeded (newest: ${newest.createdAt}). No missed schedule (newest run ${Math.round(ageH)}h ago, within the ${MISSED_SCHEDULE_HOURS}h grace window).`,
  };
}

function renderBody(result) {
  const heading = {
    healthy: 'The Vault Run is scheduling and succeeding normally.',
    failing: 'A scheduled Vault Run failed.',
    'missed-schedule': 'The Vault Run\u2019s daily schedule appears to have been missed.',
    'no-data': 'No scheduled Vault Run has ever been recorded.',
    pending: 'No verdict yet — the most recent scheduled run(s) are still in progress.',
  }[result.status];
  return (
    `@sffan15-sys — ${heading}\n\n${result.reason}\n\n` +
    `(This is the standing routine-vault-run cadence watchdog, ` +
    `scripts/watchdog/routine-vault-run-check.mjs — replaces the one-off ` +
    `founder recheck filed as swift2#58. See docs/agents/vault-run-plan.md ` +
    `for the orchestrator's own history.)\n`
  );
}

async function main() {
  const argv = process.argv.slice(2);
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? undefined : argv[i + 1];
  };
  const repo = arg('--repo') ?? process.env.REPO ?? process.env.GITHUB_REPOSITORY;
  const repoArgs = repo ? ['--repo', repo] : [];

  const { stdout } = await gh([
    'run', 'list', ...repoArgs, '--workflow', WORKFLOW,
    '--json', 'conclusion,createdAt,event,headBranch,url', '--limit', '14',
  ]);
  const runs = JSON.parse(stdout || '[]');

  const result = evaluate({ runs });
  console.log(`routine-vault-run-check: ${result.status} — ${result.reason}`);

  const alertFile = arg('--alert-body');
  if (alertFile) writeFileSync(alertFile, renderBody(result));

  return result.status === 'failing' || result.status === 'missed-schedule' ? 1 : 0;
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'routine-vault-run-check.mjs';
if (invokedDirectly) {
  runMain(async () => {
    try {
      return await main();
    } catch (e) {
      console.error(`\u2717 routine-vault-run check could not run: ${e.message}`);
      return 2;
    }
  }, { name: 'routine-vault-run-check' });
}
