// Evaluates the latest settled db-migrate.yml run on main for watchdog.yml.
// A failure opens the dedicated alert; the next success closes it. Cancelled
// or missing history is unknown and must not erase an existing alert.
import { readFileSync } from 'node:fs';

const EVENTS = new Set(['push', 'workflow_dispatch']);
const FAILING = new Set(['failure', 'timed_out', 'startup_failure']);

export function evaluateDbMigrateRuns(runs) {
  const latest = runs
    .filter(
      (run) =>
        run.headBranch === 'main' && EVENTS.has(run.event) && typeof run.conclusion === 'string',
    )
    .sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))[0];

  if (!latest) return { state: 'unknown', run: null };
  if (latest.conclusion === 'success') return { state: 'ok', run: latest };
  if (FAILING.has(latest.conclusion)) return { state: 'alert', run: latest };
  return { state: 'unknown', run: latest };
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'db-migrate-run-check.mjs';
if (invokedDirectly) {
  const command = process.argv[2];
  if (command !== 'evaluate') {
    console.error('Usage: db-migrate-run-check.mjs evaluate < runs.json');
    process.exit(2);
  }
  process.stdout.write(
    `${JSON.stringify(evaluateDbMigrateRuns(JSON.parse(readFileSync(0, 'utf8'))))}\n`,
  );
}
