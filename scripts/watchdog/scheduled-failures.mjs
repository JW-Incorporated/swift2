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

export function verdict(runs) {
  const last = runs
    .filter((r) => COUNTED_EVENTS.has(r.event) && SETTLED.has(r.conclusion))
    .slice(0, 2);
  return last.length >= 2 && last.every((r) => FAILING.has(r.conclusion)) ? 'alert' : 'ok';
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'scheduled-failures.mjs';
if (invokedDirectly) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'list') {
    process.stdout.write(listScheduledWorkflows(arg).join('\n') + '\n');
  } else if (cmd === 'verdict') {
    process.stdout.write(verdict(JSON.parse(readFileSync(0, 'utf8'))) + '\n');
  } else {
    console.error('Usage: scheduled-failures.mjs list [dir] | verdict < runs.json');
    process.exit(2);
  }
}
