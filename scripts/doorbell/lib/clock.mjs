// The clock's I/O half (Marjorie Overhaul M7, docs/specs/marjorie-overhaul/m7-clock.md).
// At 5 s past each minute it runs `clockTick` over the table, then saves which
// slots it has handled to the service's state directory, so a restart never
// starts a slot twice even before GitHub lists the run. Every 10 minutes it
// reads one commit of main, with no key: the table and the CLOCK_LIVE line are
// both fetched at that commit's sha, and applied only when the commit is not
// older than the one already applied and the table stays inside the pinned
// policy (`policyProblems`). A cron edit or the CLOCK_LIVE flip reaches the
// host by PR; the code, and what the key may be used for, stay the pinned tag.
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { CLOCK_LIVE } from '../../marjorie/lib/chat-inbox.mjs';
import {
  COMMIT_URL, LIVE_PATH, MINUTE_MS, REFRESH_MS, SCHEDULE_PATH,
  clockDispatch, clockTick, parseCommit, parseSchedule, rawUrl, readRemote, runsSinceRequest,
} from './clock-core.mjs';
import { printable } from './doorbell-core.mjs';
import { REQUEST_TIMEOUT_MS, githubRequest } from './github-rest.mjs';

const TICK_OFFSET_MS = 5_000;
const STATE_FILE = 'clock-handled.json';
const KEEP_MS = 60 * MINUTE_MS;

export function loadPinned() {
  return { rows: parseSchedule(readFileSync(new URL('../schedule.json', import.meta.url), 'utf8')), live: CLOCK_LIVE };
}

/** Milliseconds from `t` to the next tick at 5 s past a minute. */
export function untilTick(t) {
  return ((MINUTE_MS + TICK_OFFSET_MS - (t % MINUTE_MS)) % MINUTE_MS) || MINUTE_MS;
}

const sameTable = (a, b) => a.length === b.length && a.every((row, i) => row.key === b[i].key && JSON.stringify(row.inputs) === JSON.stringify(b[i].inputs));

export function loadHandled(stateDir, now) {
  const handled = new Map();
  if (!stateDir) return handled;
  try {
    const saved = JSON.parse(readFileSync(path.join(stateDir, STATE_FILE), 'utf8'));
    for (const [key, slot] of Object.entries(saved)) if (typeof slot === 'number' && now - slot < KEEP_MS) handled.set(key, slot);
  } catch {
    // first start, or an unreadable file: start empty; the run check still guards
  }
  return handled;
}

/** Returns '' or what went wrong. */
export function saveHandled(stateDir, handled, now) {
  if (!stateDir) return '';
  for (const [key, slot] of handled) if (now - slot >= KEEP_MS) handled.delete(key);
  const file = path.join(stateDir, STATE_FILE);
  try {
    writeFileSync(`${file}.tmp`, JSON.stringify(Object.fromEntries(handled)));
    renameSync(`${file}.tmp`, file);
    return '';
  } catch (err) {
    return err.message;
  }
}

export function createClock({ githubToken, fetchImpl = fetch, timers = globalThis, log = console.log, now = Date.now, pinned = loadPinned(), stateDir = '' }) {
  let { rows, live } = pinned;
  const handled = loadHandled(stateDir, now());
  let applied = { sha: '', date: -Infinity };
  let refreshing = null;
  let tickTimer = null;
  let refreshTimer = null;
  let stopped = false;
  const github = (request) => githubRequest(request, githubToken, { fetchImpl });
  const read = (url, headers = {}) => fetchImpl(url, { headers: { 'User-Agent': 'longlive-doorbell', ...headers }, signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const keeping = () => `keeping ${rows.length} rows, CLOCK_LIVE=${live}`;

  async function readMain() {
    const head = await read(COMMIT_URL, { Accept: 'application/vnd.github+json' });
    if (!head.ok) return `main's commit lookup failed (HTTP ${Number(head.status)})`;
    const commit = parseCommit(await head.json());
    if (!commit) return "main's commit lookup was unreadable";
    if (commit.sha === applied.sha) return '';
    if (commit.date < applied.date) return `main at ${commit.sha.slice(0, 7)} is older than the table already applied`;
    const [table, inbox] = await Promise.all([read(rawUrl(commit.sha, SCHEDULE_PATH)), read(rawUrl(commit.sha, LIVE_PATH))]);
    if (!table.ok || !inbox.ok) return `reading main failed (HTTP ${Number(table.status)}/${Number(inbox.status)})`;
    const next = readRemote(await table.text(), await inbox.text(), pinned.rows, now());
    if (!next.ok) return `main's table was not applied: ${printable(next.problem)}`;
    if (next.live !== live || !sameTable(next.rows, rows)) log(`clock: from main ${commit.sha.slice(0, 7)}, ${next.rows.length} rows, CLOCK_LIVE=${next.live}`);
    rows = next.rows;
    live = next.live;
    applied = commit;
    return '';
  }

  // One refresh at a time: a slow older read can never land after a newer one.
  function refresh() {
    refreshing ||= readMain()
      .then((problem) => {
        if (problem) log(`clock: ${problem}; ${keeping()}`);
      })
      .catch(() => log(`clock: reading main failed; ${keeping()}`))
      .finally(() => {
        refreshing = null;
      });
    return refreshing;
  }

  function scheduleTick() {
    if (stopped) return;
    tickTimer = timers.setTimeout(async () => {
      try {
        await clockTick({
          rows, handled, log, now: now(), currentTime: now, live: () => live,
          runsSince: (workflow, slot) => github(runsSinceRequest(workflow, slot)),
          dispatch: (row) => github(clockDispatch(row)),
        });
        const problem = saveHandled(stateDir, handled, now());
        if (problem) log(`clock: could not save its state (${printable(problem)})`);
      } catch (err) {
        log(`clock: tick failed (${printable(err.message)})`);
      }
      scheduleTick();
    }, untilTick(now()));
  }

  return {
    refresh,
    state: () => ({ rows, live, handled, applied }),
    start() {
      log(`clock: ${rows.length} rows, CLOCK_LIVE=${live} in this checkout, ${handled.size} handled slot(s) restored; re-reading main every ${REFRESH_MS / MINUTE_MS} min`);
      refresh();
      refreshTimer = timers.setInterval(refresh, REFRESH_MS);
      scheduleTick();
    },
    stop() {
      stopped = true;
      if (tickTimer) timers.clearTimeout(tickTimer);
      if (refreshTimer) timers.clearInterval(refreshTimer);
    },
  };
}
