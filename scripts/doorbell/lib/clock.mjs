// The clock's I/O half (Marjorie Overhaul M7, docs/specs/marjorie-overhaul/m7-clock.md).
// At 5 s past each minute it runs `clockTick` over the table. Every 10
// minutes it re-reads the table and CLOCK_LIVE from main's public raw files,
// with no key, so a cron edit or the CLOCK_LIVE flip reaches the host by PR
// while the code itself stays the pinned tag. A failed or malformed read
// keeps what the clock already has; it starts from this checkout's own copy.
import { readFileSync } from 'node:fs';
import { CLOCK_LIVE } from '../../marjorie/lib/chat-inbox.mjs';
import {
  LIVE_PATH, MINUTE_MS, RAW_MAIN, REFRESH_MS, SCHEDULE_PATH, clockDispatch, clockTick, parseSchedule, readRemote, runsSinceRequest,
} from './clock-core.mjs';
import { githubRequest } from './github-rest.mjs';

const TICK_OFFSET_MS = 5_000;

export function loadPinned() {
  return { rows: parseSchedule(readFileSync(new URL('../schedule.json', import.meta.url), 'utf8')), live: CLOCK_LIVE };
}

/** Milliseconds from `t` to the next tick at 5 s past a minute. */
export function untilTick(t) {
  return ((MINUTE_MS + TICK_OFFSET_MS - (t % MINUTE_MS)) % MINUTE_MS) || MINUTE_MS;
}

const sameTable = (a, b) => a.length === b.length && a.every((row, i) => row.key === b[i].key && JSON.stringify(row.inputs) === JSON.stringify(b[i].inputs));

export function createClock({ githubToken, fetchImpl = fetch, timers = globalThis, log = console.log, now = Date.now, pinned = loadPinned() }) {
  let { rows, live } = pinned;
  const handled = new Map();
  let tickTimer = null;
  let refreshTimer = null;
  let stopped = false;
  const github = (request) => githubRequest(request, githubToken, { fetchImpl });

  async function refresh() {
    try {
      const [table, inbox] = await Promise.all([fetchImpl(`${RAW_MAIN}/${SCHEDULE_PATH}`), fetchImpl(`${RAW_MAIN}/${LIVE_PATH}`)]);
      if (!table.ok || !inbox.ok) {
        log(`clock: reading main failed (HTTP ${Number(table.status)}/${Number(inbox.status)}); keeping ${rows.length} rows, CLOCK_LIVE=${live}`);
        return;
      }
      const next = readRemote(await table.text(), await inbox.text());
      if (!next.ok) {
        log(`clock: main's table or CLOCK_LIVE did not parse; keeping ${rows.length} rows, CLOCK_LIVE=${live}`);
        return;
      }
      if (next.live !== live || !sameTable(next.rows, rows)) log(`clock: from main, ${next.rows.length} rows, CLOCK_LIVE=${next.live}`);
      rows = next.rows;
      live = next.live;
    } catch {
      log(`clock: reading main failed; keeping ${rows.length} rows, CLOCK_LIVE=${live}`);
    }
  }

  function scheduleTick() {
    if (stopped) return;
    tickTimer = timers.setTimeout(async () => {
      try {
        await clockTick({
          rows, handled, live, log, now: now(),
          runsSince: (workflow, slot) => github(runsSinceRequest(workflow, slot)),
          dispatch: (row) => github(clockDispatch(row)),
        });
      } catch (err) {
        log(`clock: tick failed (${err.message})`);
      }
      scheduleTick();
    }, untilTick(now()));
  }

  return {
    refresh,
    state: () => ({ rows, live, handled }),
    start() {
      log(`clock: ${rows.length} rows, CLOCK_LIVE=${live} in this checkout; re-reading main every ${REFRESH_MS / MINUTE_MS} min`);
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
