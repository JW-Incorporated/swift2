// The poll watches the clock (Marjorie Overhaul M7,
// docs/specs/marjorie-overhaul/m7-clock.md, "Watching the clock"), only while
// CLOCK_LIVE. The clock starts bot-chat-poll.yml on the doorbell's key, so its
// runs are `workflow_dispatch` by a person; the alarm's own poll restarts are
// by the github-actions bot and never count. When the newest person-started
// run is 20 minutes to 24 hours old, the clock has gone quiet: raise
// bot-chat-alarm.yml `clock-silent`, unless its standing alert is already open.
// With none in 24 hours the clock is taken as not live yet (or long gone, its
// alert already raised), and nothing is raised. It never fails the poll.
import { ALARM_WORKFLOW, alarmArgs } from './chat-inbox.mjs';

export const CLOCK_SILENT_MS = 20 * 60 * 1000;
export const CLOCK_LOOKBACK_MS = 24 * 60 * 60 * 1000;
export const CLOCK_ALERT_TITLE = 'Clock is not firing';
const POLL_WORKFLOW = 'bot-chat-poll.yml';

/** `gh api` path: this repo's person- and bot-started dispatches of the poll in the last 24 h. */
export function clockRunsPath(repo, now) {
  const since = new Date(now - CLOCK_LOOKBACK_MS).toISOString().replace(/\.\d{3}Z$/, 'Z');
  return `repos/${repo}/actions/workflows/${POLL_WORKFLOW}/runs?event=workflow_dispatch&per_page=50&created=${encodeURIComponent(`>=${since}`)}`;
}

export function newestClockRun(runs) {
  const byPeople = (runs || []).filter((r) => r?.event === 'workflow_dispatch' && r.triggering_actor && r.triggering_actor.type !== 'Bot');
  return byPeople.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] || null;
}

/** `never` (none in 24 h), `fresh`, or `silent` (over 20 minutes old). */
export function clockState(newest, now) {
  if (!newest) return 'never';
  return now - Date.parse(newest.created_at) > CLOCK_SILENT_MS ? 'silent' : 'fresh';
}

export function readClockRuns(execImpl, repo, now) {
  const out = execImpl('gh', ['api', clockRunsPath(repo, now)], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  return newestClockRun(JSON.parse(out).workflow_runs);
}

export function watchClock({ repo, execImpl, now, dryRun = false }) {
  try {
    const newest = readClockRuns(execImpl, repo, now);
    const state = clockState(newest, now);
    if (state !== 'silent') {
      console.log(state === 'fresh' ? `clock: started ${POLL_WORKFLOW} ${Math.round((now - Date.parse(newest.created_at)) / 60_000)} min ago` : `clock: no clock-started ${POLL_WORKFLOW} run in 24 h`);
      return 0;
    }
    const open = JSON.parse(execImpl('gh', ['issue', 'list', '--repo', repo, '--label', 'watchdog-alert', '--state', 'open',
      '--search', `"${CLOCK_ALERT_TITLE}" in:title`, '--json', 'title'], { encoding: 'utf8' }));
    if (open.some((issue) => issue.title === CLOCK_ALERT_TITLE)) {
      console.log(`clock: silent, and "${CLOCK_ALERT_TITLE}" is already open`);
      return 0;
    }
    if (dryRun) {
      console.log('dry-run: would raise clock-silent');
      return 0;
    }
    execImpl('gh', alarmArgs(repo, 'clock-silent'), { encoding: 'utf8' });
    console.log(`::warning::chat-poll: the clock has not started ${POLL_WORKFLOW} for over 20 min → dispatched ${ALARM_WORKFLOW} (clock-silent)`);
  } catch (err) {
    console.log(`::warning::chat-poll: clock watch failed: ${err.message}`);
  }
  return 0;
}
