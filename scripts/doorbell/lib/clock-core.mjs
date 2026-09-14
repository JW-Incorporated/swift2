// The routines' clock, pure half (Marjorie Overhaul M7,
// docs/specs/marjorie-overhaul/m7-clock.md). GitHub drops most of this repo's
// scheduled runs (#4290), so the doorbell also starts each routine on time with
// `workflow_dispatch`. Here: cron matching (UTC), which rows of
// `scripts/doorbell/schedule.json` are due, one minute's firing decisions —
// skip a slot any run already covers, retry a failed dispatch, give up 10
// minutes past the slot — the policy a table read from main must meet, the
// next fires for `--check`, and reading CLOCK_LIVE from its committed text.
// Requests are injected; `lib/clock.mjs` owns timers, network and state.
import { GITHUB_API, REPO, workflowDispatch } from './doorbell-core.mjs';

export const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
export const GIVE_UP_MS = 10 * MINUTE_MS;
// A run created up to a minute before its slot still covers it: clock skew,
// or a GitHub cron that fired a moment early by this host's clock. Anything
// wider would let the previous slot's run of a 5-minute routine cover the next.
export const SLOT_SKEW_MS = MINUTE_MS;
export const REFRESH_MS = 10 * MINUTE_MS;
// What a table from main may do without a new tag (Codex review of the clock).
export const MIN_INTERVAL_MS = 5 * MINUTE_MS;
export const MAX_FIRES_PER_HOUR = 40;
export const MAX_ROWS = 100;
const POLICY_WINDOW_MS = 2 * 24 * HOUR_MS;
export const RAW_ROOT = `https://raw.githubusercontent.com/${REPO}`;
export const COMMIT_URL = `${GITHUB_API}/repos/${REPO}/commits/main`;
export const SCHEDULE_PATH = 'scripts/doorbell/schedule.json';
export const LIVE_PATH = 'scripts/marjorie/lib/chat-inbox.mjs';
const LOOKAHEAD_MS = 8 * 24 * HOUR_MS;
const WORKFLOW_FILE = /^[a-z0-9][a-z0-9._-]*\.ya?ml$/i;
const LIVE_LINE = /^export const CLOCK_LIVE = (true|false);\r?$/m;
const FIELDS = [['minute', 0, 59], ['hour', 0, 23], ['day of month', 1, 31], ['month', 1, 12], ['day of week', 0, 7]];

const floorMinute = (ms) => ms - (((ms % MINUTE_MS) + MINUTE_MS) % MINUTE_MS);
const canonical = (inputs) => JSON.stringify(Object.keys(inputs).sort().map((k) => [k, inputs[k]]));
export const iso = (ms) => `${new Date(ms).toISOString().slice(0, 16)}Z`;

function parseField(text, [name, min, max]) {
  const values = new Set();
  for (const part of text.split(',')) {
    const m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!m) throw new Error(`bad ${name} field "${text}"`);
    const step = m[2] === undefined ? 1 : Number(m[2]);
    const [a, b] = m[1] === '*' ? [min, max] : m[1].split('-').map(Number);
    const hi = b ?? (m[2] === undefined ? a : max);
    if (step < 1 || a < min || hi > max || a > hi) throw new Error(`bad ${name} field "${text}"`);
    for (let v = a; v <= hi; v += step) values.add(name === 'day of week' && v === 7 ? 0 : v);
  }
  return { values, star: text.startsWith('*') };
}

export function parseCron(expr) {
  const parts = String(expr ?? '').trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`cron "${expr}" needs 5 fields`);
  const [minute, hour, day, month, weekday] = parts.map((part, i) => parseField(part, FIELDS[i]));
  return { minute, hour, day, month, weekday };
}

/** POSIX cron in UTC: when day-of-month and day-of-week are both restricted, either one matches. */
export function matches(cron, ms) {
  const d = new Date(ms);
  if (!cron.minute.values.has(d.getUTCMinutes()) || !cron.hour.values.has(d.getUTCHours()) || !cron.month.values.has(d.getUTCMonth() + 1)) return false;
  const dom = cron.day.values.has(d.getUTCDate());
  const dow = cron.weekday.values.has(d.getUTCDay());
  if (cron.day.star || cron.weekday.star) return dom && dow;
  return dom || dow;
}

/** The newest slot at or before `now` and no more than GIVE_UP_MS old, else null. */
export function latestSlot(cron, now) {
  for (let t = floorMinute(now); now - t <= GIVE_UP_MS; t -= MINUTE_MS) if (matches(cron, t)) return t;
  return null;
}

/** Validated rows, each with its parsed cron and a `key` (`<workflow> <cron>`). Throws on anything malformed. */
export function parseSchedule(source) {
  const data = typeof source === 'string' ? JSON.parse(source) : source;
  if (!Array.isArray(data?.rows) || !data.rows.length) throw new Error('schedule needs a non-empty "rows" array');
  const keys = new Set();
  return data.rows.map((row, i) => {
    const workflow = String(row?.workflow ?? '');
    if (!WORKFLOW_FILE.test(workflow)) throw new Error(`row ${i}: bad workflow "${workflow}"`);
    const inputs = row.inputs ?? {};
    if (typeof inputs !== 'object' || Array.isArray(inputs) || Object.keys(inputs).length > 10) throw new Error(`row ${i}: inputs must be an object of at most 10`);
    for (const [k, v] of Object.entries(inputs)) {
      if (!/^[\w-]+$/.test(k) || !['string', 'boolean', 'number'].includes(typeof v)) throw new Error(`row ${i}: bad input "${k}"`);
    }
    const key = `${workflow} ${row.cron}`;
    if (keys.has(key)) throw new Error(`row ${i}: duplicate ${key}`);
    keys.add(key);
    return { workflow, cron: row.cron, inputs, key, parsed: parseCron(row.cron) };
  });
}

/**
 * Why a table read from main must not replace the pinned one. Only a workflow
 * the pinned table already dispatches, with inputs identical to one of its
 * pinned rows; no row more often than every 5 minutes; at most 40 dispatches
 * in any hour and 100 rows. Widening any of that takes a new tag, so a broken
 * or hostile main cannot widen what the key is used for.
 */
export function policyProblems(rows, pinned, now) {
  const problems = [];
  if (rows.length > MAX_ROWS) problems.push(`${rows.length} rows (at most ${MAX_ROWS})`);
  const allowed = new Map();
  for (const p of pinned) allowed.set(p.workflow, (allowed.get(p.workflow) || new Set()).add(canonical(p.inputs)));
  const perHour = new Map();
  const start = floorMinute(now) + MINUTE_MS;
  for (const row of rows) {
    if (!allowed.has(row.workflow)) {
      problems.push(`${row.workflow} is not in the pinned table`);
      continue;
    }
    if (!allowed.get(row.workflow).has(canonical(row.inputs))) problems.push(`${row.key}: inputs differ from the pinned table`);
    let last = null;
    for (let t = start; t < start + POLICY_WINDOW_MS; t += MINUTE_MS) {
      if (!matches(row.parsed, t)) continue;
      if (last !== null && t - last < MIN_INTERVAL_MS) {
        problems.push(`${row.key} fires more often than every 5 minutes`);
        break;
      }
      last = t;
      perHour.set(Math.floor(t / HOUR_MS), (perHour.get(Math.floor(t / HOUR_MS)) || 0) + 1);
    }
  }
  const busiest = Math.max(0, ...perHour.values());
  if (busiest > MAX_FIRES_PER_HOUR) problems.push(`${busiest} dispatches in one hour (at most ${MAX_FIRES_PER_HOUR})`);
  return problems;
}

export function clockLiveFrom(source) {
  const m = LIVE_LINE.exec(String(source ?? ''));
  return m ? m[1] === 'true' : null;
}

/** The table and CLOCK_LIVE from one commit of main; `ok: false` keeps whatever the clock already has. */
export function readRemote(scheduleText, liveText, pinned, now) {
  try {
    const rows = parseSchedule(scheduleText);
    const live = clockLiveFrom(liveText);
    if (live === null) return { ok: false, problem: `no CLOCK_LIVE line in ${LIVE_PATH}` };
    const problems = policyProblems(rows, pinned, now);
    if (problems.length) return { ok: false, problem: `outside the pinned policy (${problems[0]})` };
    return { ok: true, rows, live };
  } catch (err) {
    return { ok: false, problem: err.message };
  }
}

/** `GET …/commits/main` → `{ sha, date }`, or null for anything unexpected. */
export function parseCommit(data) {
  const sha = String(data?.sha ?? '');
  const date = Date.parse(data?.commit?.committer?.date ?? '');
  return /^[0-9a-f]{40}$/.test(sha) && Number.isFinite(date) ? { sha, date } : null;
}

export const rawUrl = (sha, file) => `${RAW_ROOT}/${sha}/${file}`;

export function dueRows(rows, handled, now) {
  const due = [];
  for (const row of rows) {
    const slot = latestSlot(row.parsed, now);
    if (slot !== null && (handled.get(row.key) ?? -Infinity) < slot) due.push({ row, slot });
  }
  return due;
}

/** `GET …/runs?created=>=<slot − skew>` — any trigger counts, so a GitHub cron that did fire is not doubled. */
export function runsSinceRequest(workflow, slot, repo = REPO) {
  const since = new Date(slot - SLOT_SKEW_MS).toISOString().replace(/\.\d{3}Z$/, 'Z');
  return { method: 'GET', url: `${GITHUB_API}/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/runs?created=${encodeURIComponent(`>=${since}`)}&per_page=1` };
}

export function clockDispatch(row) {
  return workflowDispatch(row.workflow, row.inputs);
}

/**
 * One minute of the clock. Due rows run side by side, so a slow one blocks no
 * other; right before each dispatch the time and CLOCK_LIVE are read again, so
 * a slow run list never dispatches a slot more than 10 minutes late or after
 * the clock was switched off. `handled` (key → slot) is persisted by
 * `lib/clock.mjs`. `runsSince` and `dispatch` resolve `{ ok, status, data }`.
 */
export async function clockTick({ rows, handled, now, live, runsSince, dispatch, log = () => {}, currentTime = () => now }) {
  const isLive = typeof live === 'function' ? live : () => live;
  const fired = [];
  const failed = (row, slot, status) => {
    if (currentTime() + MINUTE_MS - slot > GIVE_UP_MS) {
      handled.set(row.key, slot);
      log(`clock: gave up on ${row.workflow} for ${iso(slot)} after 10 minutes (last: ${status})`);
    } else {
      log(`clock: ${row.workflow} for ${iso(slot)} failed (${status}); retrying next minute`);
    }
  };
  await Promise.all(dueRows(rows, handled, now).map(async ({ row, slot }) => {
    if (!isLive()) {
      handled.set(row.key, slot);
      return;
    }
    const listed = await runsSince(row.workflow, slot);
    if (listed.ok && Number(listed.data?.total_count) > 0) {
      handled.set(row.key, slot);
      log(`clock: ${row.workflow} already has a run for ${iso(slot)}; skipped`);
      return;
    }
    if (!isLive()) {
      handled.set(row.key, slot);
      return;
    }
    if (!listed.ok) return failed(row, slot, `run list ${listed.status}`);
    if (currentTime() - slot > GIVE_UP_MS) return failed(row, slot, 'more than 10 minutes past the slot');
    const sent = await dispatch(row);
    if (!sent.ok) return failed(row, slot, sent.status);
    handled.set(row.key, slot);
    fired.push(row.key);
    log(`clock: dispatched ${row.workflow} for ${iso(slot)}`);
  }));
  return fired;
}

/** The next `count` fires after `now`, soonest first, for `--check`. */
export function nextFires(rows, now, count = 10) {
  const out = [];
  for (let t = floorMinute(now) + MINUTE_MS; out.length < count && t - now <= LOOKAHEAD_MS; t += MINUTE_MS) {
    for (const row of rows) if (matches(row.parsed, t)) out.push({ at: t, workflow: row.workflow, cron: row.cron });
  }
  return out.slice(0, count);
}
