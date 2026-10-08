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
// WHAT IT WATCHES, using `gh run list --workflow routine-vault-run.yml
// --event schedule` (server-side filtered, so a burst of manual
// workflow_dispatch runs can never displace scheduled history out of the
// fetched window):
//   1. Any of the last N *scheduled* runs failed.
//   2. No scheduled run has started in the last ~26h (missed schedule) —
//      the cron fires daily at 16:07 UTC (routine-vault-run.yml), so 26h
//      gives a comfortable grace window past the next expected fire without
//      paging on ordinary scheduling jitter.
//
// Feeds the SAME real-email alert lane every other watchdog.yml check
// already uses (a persistent `watchdog-alert`-labelled GitHub issue via
// scripts/watchdog/upsert-alert.sh, which itself calls send-mail.py) rather
// than inventing a new channel — batch, don't spam, and one evolving issue
// per condition instead of a new one every day.
//
// Usage: node --use-env-proxy scripts/watchdog/routine-vault-run-check.mjs \
//          --repo owner/name --alert-body /tmp/alert-body.md
// Exit: 0 = nothing to alarm on (recent scheduled runs all succeeded or are
//           still pending, within the grace window since the last one) —
//           caller closes.
//       1 = a scheduled run failed, the schedule appears to have been
//           missed, or there is no scheduled-run history at all to confirm
//           the cron works — caller opens.
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

/**
 * Evaluate cadence health. Pure — takes already-fetched, ALREADY
 * schedule-filtered runs (newest first is not assumed; this sorts), so it
 * is unit-testable without gh.
 *
 * @param {{runs: Array<{conclusion?: string, createdAt: string, event?: string,
 *   headBranch?: string, url?: string}>, now?: Date|string}} args
 */
export function evaluate({ runs, now = new Date() }) {
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  // Defense in depth even though the caller fetches with --event schedule:
  // a test or a future caller passing unfiltered runs must not silently
  // count a workflow_dispatch run as cadence evidence.
  const scheduled = (runs || [])
    .filter((r) => (r.event ?? 'schedule') === 'schedule')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  if (scheduled.length === 0) {
    return {
      status: 'no-data',
      // Alarms (not a silent close): "never scheduled" is exactly what this
      // check exists to catch, not a reason to assume health.
      reason: `No scheduled run of \`${WORKFLOW}\` has ever been recorded. Either the workflow was just added, or its cron trigger has never fired — there is no evidence the schedule works.`,
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

  if (pending.length > 0) {
    return {
      status: 'pending',
      reason: `${pending.length} of the last ${recent.length} scheduled run(s) of \`${WORKFLOW}\` are still in progress (no verdict yet); the rest that have concluded all succeeded. Not alarming while a run is still live.`,
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
    pending: 'A recent scheduled run is still in progress — no verdict yet, nothing alarming so far.',
  }[result.status];
  return (
    `@sffan15-sys — ${heading}\n\n${result.reason}\n\n` +
    `(This is the standing routine-vault-run cadence watchdog, ` +
    `scripts/watchdog/routine-vault-run-check.mjs — replaces the one-off ` +
    `founder recheck filed as swift2#58. See docs/agents/vault-run-plan.md ` +
    `for the orchestrator's own history.)\n`
  );
}

/** Alert body used when the check itself breaks (exit 2) — never claims "clear". */
function renderErrorBody(message) {
  return (
    `@sffan15-sys — the routine-vault-run cadence watchdog itself failed to run: ${message}\n\n` +
    `This is NOT a "the schedule is healthy" signal — it means the check could not evaluate ` +
    `\`${WORKFLOW}\`'s recent runs at all. Investigate scripts/watchdog/routine-vault-run-check.mjs ` +
    `and the \`gh run list\` call it makes before assuming anything about the Vault Run's own health.\n`
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
    'run', 'list', ...repoArgs, '--workflow', WORKFLOW, '--event', 'schedule',
    '--json', 'conclusion,createdAt,event,headBranch,url', '--limit', String(LOOKBACK * 2),
  ]);
  const runs = JSON.parse(stdout || '[]');

  const result = evaluate({ runs });
  console.log(`routine-vault-run-check: ${result.status} — ${result.reason}`);

  const alertFile = arg('--alert-body');
  if (alertFile) writeFileSync(alertFile, renderBody(result));

  return result.status === 'failing' || result.status === 'missed-schedule' || result.status === 'no-data' ? 1 : 0;
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'routine-vault-run-check.mjs';
if (invokedDirectly) {
  runMain(async () => {
    try {
      return await main();
    } catch (e) {
      console.error(`\u2717 routine-vault-run check could not run: ${e.message}`);
      const argv = process.argv.slice(2);
      const i = argv.indexOf('--alert-body');
      const alertFile = i === -1 ? undefined : argv[i + 1];
      if (alertFile) writeFileSync(alertFile, renderErrorBody(e.message));
      return 2;
    }
  }, { name: 'routine-vault-run-check' });
}

