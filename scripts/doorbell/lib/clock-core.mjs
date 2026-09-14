// The routines' clock, pure half (Marjorie Overhaul M7,
// docs/specs/marjorie-overhaul/m7-clock.md). GitHub drops most of this repo's
// scheduled runs (#4290), so the doorbell also starts each routine on time with
// `workflow_dispatch`. Here: cron matching (UTC), which rows of
// `scripts/doorbell/schedule.json` are due, one minute's firing decisions —
// skip a slot any run already covers, retry a failed dispatch, give up 10
// minutes past the slot — the next fires for `--check`, and reading the table
// and `CLOCK_LIVE` from their committed text. Requests are injected;
// `lib/clock.mjs` owns the timers and the network. Tests: `clock-core.test.ts`.
import { GITHUB_API, REPO, workflowDispatch } from './doorbell-core.mjs';

export const MINUTE_MS = 60_000;
export const GIVE_UP_MS = 10 * MINUTE_MS;
// A run created up to a minute before its slot still covers it: clock skew,
// or a GitHub cron that fired a moment early by this host's clock. Anything
// wider would let the previous slot's run of a 5-minute routine cover the next.
export const SLOT_SKEW_MS = MINUTE_MS;
export const REFRESH_MS = 10 * MINUTE_MS;
export const RAW_MAIN = `https://raw.githubusercontent.com/${REPO}/main`;
export const SCHEDULE_PATH = 'scripts/doorbell/schedule.json';
export const LIVE_PATH = 'scripts/marjorie/lib/chat-inbox.mjs';
const LOOKAHEAD_MS = 8 * 24 * 60 * MINUTE_MS;
const WORKFLOW_FILE = /^[a-z0-9][a-z0-9._-]*\.ya?ml$/i;
const LIVE_LINE = /^export const CLOCK_LIVE = (true|false);\r?$/m;
const FIELDS = [['minute', 0, 59], ['hour', 0, 23], ['day of month', 1, 31], ['month', 1, 12], ['day of week', 0, 7]];

const floorMinute = (ms) => ms - (((ms % MINUTE_MS) + MINUTE_MS) % MINUTE_MS);
export const iso = (ms) => `${new Date(ms).toISOString().slice(0, 16)}Z`;

function parseField(text, [name, min, max]) {
  const values = new Set();
  for (const part of text.split(',')) {
    const m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!m) throw new Error(`bad ${name} field "${text}"`);
    const step = m[2] === undefined ? 1 : Number(m[2]);
    const [a, b] = m[1] === '*' ? [min, max] : m[1].split('-').map(Number);
    const lo = a;
    const hi = b ?? (m[2] === undefined ? a : max);
    if (step < 1 || lo < min || hi > max || lo > hi) throw new Error(`bad ${name} field "${text}"`);
    for (let v = lo; v <= hi; v += step) values.add(name === 'day of week' && v === 7 ? 0 : v);
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

export function clockLiveFrom(source) {
  const m = LIVE_LINE.exec(String(source ?? ''));
  return m ? m[1] === 'true' : null;
}

/** The table and CLOCK_LIVE from main's raw text; `ok: false` keeps whatever the clock already has. */
export function readRemote(scheduleText, liveText) {
  try {
    const rows = parseSchedule(scheduleText);
    const live = clockLiveFrom(liveText);
    if (live === null) return { ok: false, problem: `no CLOCK_LIVE line in ${LIVE_PATH}` };
    return { ok: true, rows, live };
  } catch (err) {
    return { ok: false, problem: err.message };
  }
}

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
 * One minute of the clock. `handled` (key → slot) lives in memory: a restart
 * forgets it, and the run check keeps a restart from firing a covered slot.
 * `runsSince(workflow, slot)` and `dispatch(row)` resolve `{ ok, status, data }`.
 */
export async function clockTick({ rows, handled, now, live, runsSince, dispatch, log = () => {} }) {
  const fired = [];
  for (const { row, slot } of dueRows(rows, handled, now)) {
    if (!live) {
      handled.set(row.key, slot);
      continue;
    }
    const listed = await runsSince(row.workflow, slot);
    if (listed.ok && Number(listed.data?.total_count) > 0) {
      handled.set(row.key, slot);
      log(`clock: ${row.workflow} already has a run for ${iso(slot)}; skipped`);
      continue;
    }
    const sent = listed.ok ? await dispatch(row) : { ok: false, status: `run list ${listed.status}` };
    if (sent.ok) {
      handled.set(row.key, slot);
      fired.push(row.key);
      log(`clock: dispatched ${row.workflow} for ${iso(slot)}`);
    } else if (now + MINUTE_MS - slot > GIVE_UP_MS) {
      handled.set(row.key, slot);
      log(`clock: gave up on ${row.workflow} for ${iso(slot)} after 10 minutes (last: ${sent.status})`);
    } else {
      log(`clock: ${row.workflow} for ${iso(slot)} failed (${sent.status}); retrying next minute`);
    }
  }
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
