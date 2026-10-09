// Targets and verdict for watchdog.yml's "failed its last 2 scheduled runs"
// alert. Chronic reds hid for days (link-sweep, merch-awin-sync: red every
// daily run 2026-10-02..06, nobody alerted) because the check only covered a
// hand-kept list. Now EVERY workflow file with a `schedule:` trigger is
// watched, minus the explicit EXCLUDE list below.
//
// Usage:
//   node scripts/watchdog/scheduled-failures.mjs list [workflows-dir]
//       one workflow file name per line
//   node scripts/watchdog/scheduled-failures.mjs verdict < runs.json
//       runs.json = `gh run list --json event,conclusion` (newest first);
//       prints `alert` or `ok`
//   node scripts/watchdog/scheduled-failures.mjs reason < runs.json
//       the alert body's sentence for an `alert` verdict (empty when `ok`)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractScheduleCrons } from './cron-maxage-hours.mjs';

// Each entry: file name -> why a failure there must NOT raise this alert.
export const EXCLUDE = {
  'mobile-parity.yml':
    'fails on purpose when iOS/Android diverge and raises its own "Mobile parity: ... diverged" issue',
};

export function hasSchedule(yamlText) {
  return extractScheduleCrons(yamlText).length > 0 || /^\s*schedule:\s*$/m.test(yamlText);
}

export function listScheduledWorkflows(dir = '.github/workflows', exclude = EXCLUDE) {
  return readdirSync(dir)
    .filter((f) => /\.ya?ml$/.test(f) && !(f in exclude))
    .filter((f) => hasSchedule(readFileSync(join(dir, f), 'utf8')))
    .sort();
}

// Only real clock-driven runs count: `schedule`, or the clock's
// `workflow_dispatch`. In-progress (no conclusion), cancelled and skipped runs
// say nothing about health, so they are ignored rather than ending a streak.
// `failure` counts as failing; `timed_out` (not counted by the original
// check, but a chronic red all the same) is added.
const COUNTED_EVENTS = new Set(['schedule', 'workflow_dispatch']);
const FAILING = new Set(['failure', 'timed_out']);
const SETTLED = new Set(['success', ...FAILING]);

// `gh workflow list --all --json path,state` -> file names of enabled workflows.
export function activeFiles(ghWorkflows) {
  return ghWorkflows
    .filter((w) => w.state === 'active')
    .map((w) => w.path.split('/').pop());
}

// How far back the intermittent rule looks. Two consecutive failures are not
// the only chronic-red shape: routine-vault-run.yml went fail 09-14 / success
// 09-15 / fail 09-16 and the consecutive rule saw nothing (issue #4475 item D),
// so a workflow failing every other run was never alerted on at all.
export const LOOKBACK = 5;

// Runs may arrive as several per-event lists concatenated; newest first is
// restored from createdAt when present.
function settledRuns(runs) {
  return runs
    .filter((r) => COUNTED_EVENTS.has(r.event) && SETTLED.has(r.conclusion))
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    .slice(0, LOOKBACK);
}

/**
 * Why this workflow is unhealthy, as the alert body's sentence — or null when
 * it is not. Two rules, both requiring the NEWEST settled run to be red:
 *   1. the last 2 settled runs both failed (the original rule), or
 *   2. >=2 of the last LOOKBACK settled runs failed (the intermittent shape).
 * The newest-run-red precondition is what keeps the alert self-closing: a
 * recovered workflow reads `ok` on its first green run (watchdog.yml closes the
 * alert within the hour) instead of staying red for LOOKBACK more runs.
 */
export function failureReason(runs) {
  const last = settledRuns(runs);
  if (!last.length || !FAILING.has(last[0].conclusion)) return null;
  if (last.length >= 2 && last.slice(0, 2).every((r) => FAILING.has(r.conclusion))) {
    return 'its last 2 scheduled runs both failed';
  }
  const failures = last.filter((r) => FAILING.has(r.conclusion)).length;
  if (failures >= 2) {
    return `${failures} of its last ${last.length} scheduled runs failed, including the newest — the failures are not consecutive, so the "last 2 runs" rule alone would have missed this`;
  }
  return null;
}

export function verdict(runs) {
  return failureReason(runs) ? 'alert' : 'ok';
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'scheduled-failures.mjs';
if (invokedDirectly) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'list') {
    process.stdout.write(listScheduledWorkflows(arg).join('\n') + '\n');
  } else if (cmd === 'verdict') {
    process.stdout.write(verdict(JSON.parse(readFileSync(0, 'utf8'))) + '\n');
  } else if (cmd === 'reason') {
    process.stdout.write((failureReason(JSON.parse(readFileSync(0, 'utf8'))) ?? '') + '\n');
  } else if (cmd === 'active') {
    process.stdout.write(activeFiles(JSON.parse(readFileSync(0, 'utf8'))).join('\n') + '\n');
  } else {
    console.error('Usage: scheduled-failures.mjs list [dir] | verdict|reason < runs.json | active < workflows.json');
    process.exit(2);
  }
}
