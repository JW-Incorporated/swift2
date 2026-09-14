// The poll watches the clock (Marjorie Overhaul M7,
// docs/specs/marjorie-overhaul/m7-clock.md, "Watching the clock"), only while
// CLOCK_LIVE. The clock dispatches bot-chat-poll.yml with `clock=true`, so its
// runs are named `bot-chat-poll · clock`; nothing else counts. From
// CLOCK_LIVE_SINCE plus 30 minutes' grace (the host re-reads main every 10
// minutes), a clock that has not started the poll for 20 minutes — or at all —
// is silent: raise bot-chat-alarm.yml `clock-silent`, unless its standing alert
// is already open. It never fails the poll.
import { ALARM_WORKFLOW, CLOCK_LIVE_SINCE, alarmArgs } from './chat-inbox.mjs';

export const CLOCK_SILENT_MS = 20 * 60 * 1000;
export const CLOCK_GRACE_MS = 30 * 60 * 1000;
export const CLOCK_LOOKBACK_MS = 24 * 60 * 60 * 1000;
export const CLOCK_ALERT_TITLE = 'Clock is not firing';
export const CLOCK_RUN_TITLE = 'bot-chat-poll · clock';
const POLL_WORKFLOW = 'bot-chat-poll.yml';

const sinceMs = (since) => {
  const ms = Date.parse(since);
  return Number.isFinite(ms) ? ms : null;
};

/** `gh api` path: the poll's dispatches since CLOCK_LIVE_SINCE, or the last 24 h if that is later. */
export function clockRunsPath(repo, now, since = '') {
  const from = Math.max(now - CLOCK_LOOKBACK_MS, sinceMs(since) ?? -Infinity);
  const created = new Date(from).toISOString().replace(/\.\d{3}Z$/, 'Z');
  return `repos/${repo}/actions/workflows/${POLL_WORKFLOW}/runs?event=workflow_dispatch&branch=main&per_page=50&created=${encodeURIComponent(`>=${created}`)}`;
}

export function newestClockRun(runs, since = '') {
  const start = sinceMs(since) ?? -Infinity;
  const clockRuns = (runs || []).filter((r) => r?.event === 'workflow_dispatch' && r.display_title === CLOCK_RUN_TITLE
    && r.head_branch === 'main' && Date.parse(r.created_at) >= start);
  return clockRuns.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] || null;
}

/** `starting` (inside the grace after CLOCK_LIVE_SINCE), `fresh`, or `silent` (none, or over 20 minutes old). */
export function clockState(newest, now, since = '') {
  const start = sinceMs(since);
  if (start !== null && now - start < CLOCK_GRACE_MS) return 'starting';
  if (!newest) return 'silent';
  return now - Date.parse(newest.created_at) > CLOCK_SILENT_MS ? 'silent' : 'fresh';
}

export function readClockRuns(execImpl, repo, now, since = CLOCK_LIVE_SINCE) {
  const out = execImpl('gh', ['api', clockRunsPath(repo, now, since)], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  return newestClockRun(JSON.parse(out).workflow_runs, since);
}

export function watchClock({ repo, execImpl, now, dryRun = false, since = CLOCK_LIVE_SINCE }) {
  try {
    if (sinceMs(since) === null) console.log('::warning::chat-poll: CLOCK_LIVE is on but CLOCK_LIVE_SINCE is not a date; watching with no grace');
    const newest = readClockRuns(execImpl, repo, now, since);
    const state = clockState(newest, now, since);
    if (state !== 'silent') {
      console.log(state === 'fresh' ? `clock: started ${POLL_WORKFLOW} ${Math.round((now - Date.parse(newest.created_at)) / 60_000)} min ago` : 'clock: inside its start grace');
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
