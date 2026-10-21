// Names the runs that are starving the status page's render job, for
// `marjorie-status.yml`'s `watch` job to cancel.
//
// `marjorie-status.yml`'s `render` and `routine-marjorie-brief.yml`'s `deliver`
// share the `marjorie-status-render` concurrency group with
// `cancel-in-progress: false`, which keeps the group's HOLDER and cancels the
// newly queued run instead. A holder that can never start therefore starves
// every later render indefinitely — and because the starved runs conclude
// `cancelled`, not `failure`, neither `bot-failure-triage.yml` (which matches
// `routine-*` only) nor the watchdog's cadence checks ever fire. The page froze
// for 15 days exactly this way (issue #6151): a 2026-10-06 run sat in `waiting`
// on the `ops` environment gate with `reviewers: []`, so nothing could approve
// it and nothing timed it out.
//
// Only UNSTARTED runs count. An `in_progress` render is doing real work and
// GitHub's own `timeout-minutes` ends it; cancelling those would be the bug,
// not the fix. The age floor keeps a render that is legitimately queued behind
// a running one alive — at an hourly cadence nothing healthy waits this long.
import { readFileSync } from 'node:fs';

export const STUCK_MINUTES = 45;
const UNSTARTED = new Set(['waiting', 'queued', 'pending']);
const MINUTE_MS = 60_000;

/**
 * @param {Array<{databaseId?: number, status?: string, createdAt?: string, url?: string}>} runs
 *   `gh run list --status <waiting|queued|pending>` rows, any number of workflows merged.
 * @param {{now?: number, selfRunId?: string|number}} [opts] `selfRunId` is never cancelled.
 * @returns {Array<{id: number, status: string, ageMinutes: number, url: string}>} oldest first.
 */
export function stuckRuns(runs, { now = Date.now(), selfRunId } = {}) {
  const self = selfRunId === undefined || selfRunId === null ? '' : String(selfRunId);
  return (Array.isArray(runs) ? runs : [])
    .filter((run) => run && Number.isInteger(run.databaseId) && UNSTARTED.has(run.status))
    .filter((run) => String(run.databaseId) !== self)
    .map((run) => ({ run, ageMinutes: Math.floor((now - Date.parse(run.createdAt)) / MINUTE_MS) }))
    .filter(({ ageMinutes }) => Number.isFinite(ageMinutes) && ageMinutes >= STUCK_MINUTES)
    .sort((a, b) => b.ageMinutes - a.ageMinutes)
    .map(({ run, ageMinutes }) => ({
      id: run.databaseId,
      status: run.status,
      ageMinutes,
      url: typeof run.url === 'string' ? run.url : '',
    }));
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'status-unstick.mjs';
if (invokedDirectly) {
  if (process.argv[2] !== 'evaluate') {
    console.error('Usage: status-unstick.mjs evaluate < runs.json  (env: SELF_RUN_ID)');
    process.exit(2);
  }
  const stuck = stuckRuns(JSON.parse(readFileSync(0, 'utf8')), { selfRunId: process.env.SELF_RUN_ID });
  process.stdout.write(`${JSON.stringify(stuck)}\n`);
}
