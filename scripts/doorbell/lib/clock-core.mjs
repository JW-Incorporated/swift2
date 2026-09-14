import { GITHUB_API, REPO, workflowDispatch } from './doorbell-core.mjs';

export const MINUTE_MS = 60_000;
export const GIVE_UP_MS = 10 * MINUTE_MS;
export const MAX_ATTEMPTS = 40;
export const MIN_GAP_MS = 5 * MINUTE_MS;
const FIELDS = [['minute', 0, 59], ['hour', 0, 23], ['day', 1, 31], ['month', 1, 12], ['weekday', 0, 7]];
const WORKFLOW = /^[a-z0-9][a-z0-9._-]*\.ya?ml$/i;

const floorMinute = (ms) => ms - (((ms % MINUTE_MS) + MINUTE_MS) % MINUTE_MS);
export const iso = (ms) => `${new Date(ms).toISOString().slice(0, 16)}Z`;

function parseField(text, [name, min, max]) {
  const values = new Set();
  for (const part of text.split(',')) {
    const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!match) throw new Error(`bad ${name} field "${text}"`);
    const step = match[2] === undefined ? 1 : Number(match[2]);
    const [lo, end] = match[1] === '*' ? [min, max] : match[1].split('-').map(Number);
    const hi = end ?? (match[2] === undefined ? lo : max);
    if (step < 1 || lo < min || hi > max || lo > hi) throw new Error(`bad ${name} field "${text}"`);
    for (let value = lo; value <= hi; value += step) values.add(name === 'weekday' && value === 7 ? 0 : value);
  }
  return { values, star: text.startsWith('*') };
}

export function parseCron(expression) {
  const parts = String(expression ?? '').trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`cron "${expression}" needs 5 fields`);
  const [minute, hour, day, month, weekday] = parts.map((part, index) => parseField(part, FIELDS[index]));
  return { minute, hour, day, month, weekday };
}

export function matches(cron, ms) {
  const date = new Date(ms);
  if (!cron.minute.values.has(date.getUTCMinutes()) || !cron.hour.values.has(date.getUTCHours()) || !cron.month.values.has(date.getUTCMonth() + 1)) return false;
  const dom = cron.day.values.has(date.getUTCDate());
  const dow = cron.weekday.values.has(date.getUTCDay());
  return cron.day.star || cron.weekday.star ? dom && dow : dom || dow;
}

export function parseSchedule(source) {
  const data = typeof source === 'string' ? JSON.parse(source) : source;
  if (!Array.isArray(data?.rows) || !data.rows.length) throw new Error('schedule needs rows');
  const keys = new Set();
  return data.rows.map((row, index) => {
    if (!WORKFLOW.test(row?.workflow ?? '')) throw new Error(`row ${index}: bad workflow`);
    if (!row.inputs || typeof row.inputs !== 'object' || Array.isArray(row.inputs) || Object.keys(row.inputs).length) throw new Error(`row ${index}: inputs must be empty`);
    const key = `${row.workflow} ${row.cron}`;
    if (keys.has(key)) throw new Error(`row ${index}: duplicate ${key}`);
    keys.add(key);
    return { ...row, key, parsed: parseCron(row.cron) };
  });
}

export function latestSlot(cron, now) {
  for (let slot = floorMinute(now); now - slot <= GIVE_UP_MS; slot -= MINUTE_MS) if (matches(cron, slot)) return slot;
  return null;
}

export function dueRows(rows, handled, processStartMs, now) {
  return rows.flatMap((row) => {
    const slot = latestSlot(row.parsed, now);
    return slot !== null && slot >= processStartMs && !handled.has(`${row.key}@${slot}`) ? [{ row, slot }] : [];
  });
}

export function scheduleProblems(rows) {
  const problems = [];
  let total = 0;
  for (const row of rows) {
    const minutes = [...row.parsed.minute.values].sort((a, b) => a - b);
    total += minutes.length;
    for (let i = 0; i < minutes.length; i++) {
      const gap = (minutes[(i + 1) % minutes.length] - minutes[i] + 60) % 60 || 60;
      if (gap < 5) problems.push(`${row.key} has a ${gap}-minute circular gap`);
    }
  }
  if (total > MAX_ATTEMPTS) problems.push(`${total} possible fires in a rolling hour`);
  return problems;
}

export function canReserve(row, attempts, now) {
  const recent = attempts.filter((attempt) => attempt.at > now - 60 * MINUTE_MS);
  if (recent.length >= MAX_ATTEMPTS) return false;
  return !recent.some((attempt) => attempt.key === row.key && now - attempt.at < MIN_GAP_MS);
}

export function runsRequest(workflow, slot, repo = REPO) {
  const created = encodeURIComponent(`>=${new Date(slot).toISOString().replace(/\.\d{3}Z$/, 'Z')}`);
  return { method: 'GET', url: `${GITHUB_API}/repos/${repo}/actions/workflows/${encodeURIComponent(workflow)}/runs?branch=main&created=${created}&per_page=100` };
}

export function covered(response, slot, windowMs) {
  const server = Date.parse(response.date ?? '');
  const runs = response.data?.workflow_runs;
  if (!response.ok || !Number.isFinite(server) || server < slot || server - slot > 90_000 || !Array.isArray(runs)) return null;
  if (response.data.total_count !== runs.length || runs.length === 100) return null;
  return runs.some((run) => run.head_branch === 'main' && ['schedule', 'workflow_dispatch'].includes(run.event)
    && Date.parse(run.created_at) >= slot && Date.parse(run.created_at) < slot + windowMs);
}

export const clockDispatch = (row) => workflowDispatch(row.workflow, row.inputs);

export function nextFires(rows, start, count = 10) {
  const fires = [];
  for (let time = floorMinute(start) + MINUTE_MS; fires.length < count; time += MINUTE_MS) {
    for (const row of rows) if (matches(row.parsed, time)) fires.push({ time, workflow: row.workflow });
  }
  return fires.slice(0, count);
}
