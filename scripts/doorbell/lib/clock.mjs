import { readFileSync } from 'node:fs';
import {
  GIVE_UP_MS, MINUTE_MS, canReserve, clockDispatch, covered, dueRows, nextFires,
  parseSchedule, runsRequest, scheduleProblems,
} from './clock-core.mjs';
import { githubRequest, REQUEST_TIMEOUT_MS } from './github-rest.mjs';

export const PINNED_CLOCK_LIVE = true;
export const REFRESH_MS = 10 * MINUTE_MS;
export const STALE_MS = 30 * MINUTE_MS;
const LIVE_URL = 'https://raw.githubusercontent.com/JW-Incorporated/swift2/main/scripts/marjorie/lib/chat-inbox.mjs';
const LIVE_LINE = /^export const CLOCK_LIVE = (true|false);\r?$/gm;
const TICK_OFFSET_MS = 5_000;

export function parseMainLive(source) {
  const found = [...String(source ?? '').matchAll(LIVE_LINE)];
  return found.length === 1 ? found[0][1] === 'true' : null;
}

export const untilTick = (time) => ((MINUTE_MS + TICK_OFFSET_MS - (time % MINUTE_MS)) % MINUTE_MS) || MINUTE_MS;

export function loadPinned() {
  const rows = parseSchedule(readFileSync(new URL('../schedule.json', import.meta.url), 'utf8'));
  const problems = scheduleProblems(rows);
  if (problems.length) throw new Error(problems[0]);
  return rows;
}

export function createClock({ githubToken, fetchImpl = fetch, timers = globalThis, now = Date.now,
  rows = loadPinned(), processStartMs = now(), progress = () => {} }) {
  const handled = new Set();
  const attempts = [];
  let mainLive = false;
  let lastGood = -Infinity;
  let failures = 0;
  let lastObserved = processStartMs;
  let refreshPromise = null;
  let tickPromise = null;
  let tickTimer = null;
  let refreshTimer = null;
  let stopped = false;
  const github = (request) => githubRequest(request, githubToken, { fetchImpl });
  const isLive = (time) => PINNED_CLOCK_LIVE && mainLive && failures < 3 && time - lastGood <= STALE_MS;

  async function readMain() {
    try {
      const response = await fetchImpl(LIVE_URL, { signal: globalThis.AbortSignal.timeout(REQUEST_TIMEOUT_MS), headers: { 'User-Agent': 'longlive-doorbell' } });
      if (!response.ok) throw new Error('status');
      const live = parseMainLive(await response.text());
      if (live === null) throw new Error('flag');
      mainLive = live;
      lastGood = now();
      failures = 0;
      return true;
    } catch {
      failures += 1;
      if (failures >= 3) mainLive = false;
      return false;
    }
  }

  function refresh() {
    refreshPromise ||= readMain().finally(() => { refreshPromise = null; });
    return refreshPromise;
  }

  async function runTick() {
    const time = now();
    try {
      if (time < lastObserved || !isLive(time)) return;
      lastObserved = time;
      for (const { row, slot } of dueRows(rows, handled, processStartMs, time)) {
        const response = await github(runsRequest(row.workflow, slot));
        const exists = covered(response, slot, row.workflow === 'bot-chat-poll.yml' ? 5 * MINUTE_MS : GIVE_UP_MS, time);
        if (exists === null || exists || !isLive(now()) || now() - slot > GIVE_UP_MS) continue;
        const sentAt = now();
        if (!canReserve(row, attempts, sentAt)) continue;
        handled.add(`${row.key}@${slot}`);
        attempts.push({ key: row.key, at: sentAt });
        await github(clockDispatch(row));
      }
    } finally {
      lastObserved = Math.max(lastObserved, time);
      progress();
    }
  }

  function tick() {
    tickPromise ||= runTick().catch(() => {}).finally(() => { tickPromise = null; });
    return tickPromise;
  }

  function scheduleTick() {
    if (stopped) return;
    tickTimer = timers.setTimeout(async () => { await tick(); scheduleTick(); }, untilTick(now()));
  }

  return {
    refresh, tick, state: () => ({ mainLive, lastGood, failures, handled, attempts, live: isLive(now()) }),
    start() { refresh(); refreshTimer = timers.setInterval(refresh, REFRESH_MS); scheduleTick(); },
    stop() { stopped = true; if (tickTimer) timers.clearTimeout(tickTimer); if (refreshTimer) timers.clearInterval(refreshTimer); },
  };
}

export function checkLines(now = Date.now(), rows = loadPinned()) {
  return nextFires(rows, now).map((fire) => `${new Date(fire.time).toISOString()} ${fire.workflow}`);
}
