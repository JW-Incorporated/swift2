// Cron-derived cadence window for the watchdog's dynamic WATCHED list
// (.github/workflows/watchdog.yml, "Scheduled workflows healthy" step).
//
// WHY THIS EXISTS. The step used to hand-maintain a WATCHED list of
// `workflow.yml:maxage-hours` pairs, tuned by a human reading each
// workflow's cron. That list only ever covered three workflows and rotted
// silently as new routine-*.yml files were added (tree-overhaul epic
// #4117, task A1) — nothing forced it to stay in sync. This script derives
// the same maxage-hours figure straight from a workflow file's own
// `on.schedule` cron entries, so a new routine picks up cadence monitoring
// automatically instead of needing a second hand-edit.
//
// Rule: maxage = max(6h, ceil(2.5 * shortest inter-run interval)) — the
// same "~2x the schedule, so a single missed slot doesn't page anyone"
// principle the workflow's own comments document for the old hand-tuned
// entries, with a bit more slack (2.5x) and a 6h floor since a dynamically
// derived window has no human sanity-check per entry.
//
// Usage: node scripts/watchdog/cron-maxage-hours.mjs <workflow-file>
// Prints the integer maxage-hours to stdout and exits 0, or prints nothing
// and exits 1 if the file has no `schedule:` cron trigger to derive from.
import { readFileSync } from 'node:fs';

function parseIntList(field) {
  return field.split(',').map((tok) => parseInt(tok, 10)).filter((n) => !Number.isNaN(n));
}

function minCircularGap(values, modulus) {
  const sorted = [...new Set(values)].sort((a, b) => a - b);
  if (sorted.length < 2) return modulus;
  let gap = modulus - sorted[sorted.length - 1] + sorted[0];
  for (let i = 1; i < sorted.length; i += 1) {
    gap = Math.min(gap, sorted[i] - sorted[i - 1]);
  }
  return gap;
}

// Returns the shortest interval in hours between consecutive fires of a
// single 5-field cron expression. Deliberately handles only the patterns
// this repo's routine-*.yml files actually use (fixed minute/hour values,
// optional comma lists on hour or day-of-week, `*` wildcards, `*/N` steps
// on minute/hour) — not a general cron parser.
export function cronIntervalHours(cronExpr) {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length < 5) return null;
  const [minute, hour, dom, , dow] = parts;

  if (dom !== '*' && dow === '*') {
    // Day-of-month pinned (e.g. monthly on the 1st) — approximate as 30 days.
    return 24 * 30;
  }

  if (dow !== '*') {
    const days = parseIntList(dow);
    if (days.length === 0) return 24;
    return minCircularGap(days, 7) * 24;
  }

  if (hour === '*') {
    const stepMatch = minute.match(/^\*\/(\d+)$/);
    if (stepMatch) return parseInt(stepMatch[1], 10) / 60;
    return 1;
  }

  const hourStep = hour.match(/^\*\/(\d+)$/);
  if (hourStep) return parseInt(hourStep[1], 10);

  const hours = parseIntList(hour);
  if (hours.length > 1) return minCircularGap(hours, 24);

  return 24;
}

export function maxAgeHoursFromCron(cronExprs) {
  const intervals = cronExprs.map(cronIntervalHours).filter((h) => h !== null && h > 0);
  if (intervals.length === 0) return null;
  const shortest = Math.min(...intervals);
  return Math.max(6, Math.ceil(2.5 * shortest));
}

export function extractScheduleCrons(yamlText) {
  const lines = yamlText.split('\n');
  const crons = [];
  let inSchedule = false;
  for (const line of lines) {
    if (/^\s*schedule:\s*$/.test(line)) {
      inSchedule = true;
      continue;
    }
    if (inSchedule) {
      const m = line.match(/^\s*-\s*cron:\s*["']([^"']+)["']/);
      if (m) {
        crons.push(m[1]);
        continue;
      }
      // A non-cron, non-blank line at or below the list-item indent ends
      // the schedule block.
      if (/^\s*[A-Za-z_]+:\s*$/.test(line) || /^\S/.test(line)) {
        inSchedule = false;
      }
    }
  }
  return crons;
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'cron-maxage-hours.mjs';
if (invokedDirectly) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/watchdog/cron-maxage-hours.mjs <workflow-file>');
    process.exit(2);
  }
  const text = readFileSync(file, 'utf8');
  const crons = extractScheduleCrons(text);
  const maxAge = maxAgeHoursFromCron(crons);
  if (maxAge === null) {
    process.exit(1);
  }
  process.stdout.write(String(maxAge));
}
