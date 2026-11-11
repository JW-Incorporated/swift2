#!/usr/bin/env node
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const NO_MATCH_COOLDOWN_DAYS = 14;
export const WEEKLY_RUN_LIMIT = 2;
export const DEFAULT_LOOK_CAP = 3;
export const DEFAULT_PAID_SEARCH_CAP = 5;
export const REQUIRED_CONFIRMATION = 'RUN_MATCHER_AUTHORING';

export function emptyMatcherState() {
  return { runs: [], noMatches: {} };
}

export function normalizeMatcherState(value) {
  const state = emptyMatcherState();
  if (!value || typeof value !== 'object') return state;
  state.runs = Array.isArray(value.runs)
    ? value.runs.filter((stamp) => Number.isFinite(Date.parse(stamp)))
    : [];
  if (value.noMatches && typeof value.noMatches === 'object' && !Array.isArray(value.noMatches)) {
    for (const [id, stamp] of Object.entries(value.noMatches)) {
      if (id && Number.isFinite(Date.parse(stamp))) state.noMatches[id] = stamp;
    }
  }
  return state;
}

export async function readMatcherState(file) {
  if (!file) return emptyMatcherState();
  try {
    return normalizeMatcherState(JSON.parse(await readFile(file, 'utf8')));
  } catch (error) {
    if (error?.code === 'ENOENT') return emptyMatcherState();
    throw error;
  }
}

export async function writeMatcherState(file, state, now = new Date()) {
  if (!file) return;
  const normalized = pruneMatcherState(state, now);
  await mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await writeFile(file, `${JSON.stringify(normalized, null, 2)}\n`);
}

export function inNoMatchCooldown(momentId, state, now = new Date()) {
  const stamp = Date.parse(state?.noMatches?.[momentId] ?? '');
  return Number.isFinite(stamp)
    && stamp > now.getTime() - NO_MATCH_COOLDOWN_DAYS * 86_400_000;
}

export function recordNoMatch(state, momentId, now = new Date()) {
  const normalized = normalizeMatcherState(state);
  normalized.noMatches[momentId] = now.toISOString();
  return normalized;
}

export function isoWeekKey(value) {
  const date = new Date(value);
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86_400_000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function runsThisIsoWeek(state, now = new Date()) {
  const week = isoWeekKey(now);
  return normalizeMatcherState(state).runs.filter((stamp) => isoWeekKey(stamp) === week).length;
}

export function authorizeMatcherRun({
  state,
  eventName,
  confirmation,
  lookCap,
  paidSearchCap,
  now = new Date(),
}) {
  if (!Number.isInteger(lookCap) || lookCap < 1) throw new Error('look_cap must be a positive integer');
  if (!Number.isInteger(paidSearchCap) || paidSearchCap < 0) throw new Error('paid_search_cap must be a non-negative integer');
  const normalized = normalizeMatcherState(state);
  const weeklyCeilingReached = runsThisIsoWeek(normalized, now) >= WEEKLY_RUN_LIMIT;
  const abovePerRunCap = lookCap > DEFAULT_LOOK_CAP || paidSearchCap > DEFAULT_PAID_SEARCH_CAP;
  const manual = eventName === 'workflow_dispatch';
  if (weeklyCeilingReached && !manual) {
    return { proceed: false, reason: 'weekly-run-limit', state: normalized };
  }
  if ((weeklyCeilingReached || abovePerRunCap) && confirmation !== REQUIRED_CONFIRMATION) {
    throw new Error(`Manual runs beyond the weekly or per-run cap require ${REQUIRED_CONFIRMATION}`);
  }
  normalized.runs.push(now.toISOString());
  return { proceed: true, reason: '', state: normalized };
}

export function pruneMatcherState(state, now = new Date()) {
  const normalized = normalizeMatcherState(state);
  const runCutoff = now.getTime() - 35 * 86_400_000;
  normalized.runs = normalized.runs.filter((stamp) => Date.parse(stamp) > runCutoff);
  for (const [id, stamp] of Object.entries(normalized.noMatches)) {
    if (Date.parse(stamp) <= now.getTime() - NO_MATCH_COOLDOWN_DAYS * 86_400_000) delete normalized.noMatches[id];
  }
  return normalized;
}

function value(args, name, fallback = null) {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
}

export async function main(args = process.argv.slice(2), env = process.env) {
  const statePath = value(args, '--state');
  if (!statePath) throw new Error('usage: matcher-state.mjs --state <state.json> --event <event> --look-cap <n> --paid-search-cap <n>');
  const now = env.MATCHER_NOW ? new Date(env.MATCHER_NOW) : new Date();
  const result = authorizeMatcherRun({
    state: await readMatcherState(statePath),
    eventName: value(args, '--event', ''),
    confirmation: value(args, '--confirmation', ''),
    lookCap: Number(value(args, '--look-cap')),
    paidSearchCap: Number(value(args, '--paid-search-cap')),
    now,
  });
  await writeMatcherState(statePath, result.state, now);
  if (env.GITHUB_OUTPUT) {
    await appendFile(env.GITHUB_OUTPUT, `proceed=${result.proceed}\nreason=${result.reason}\n`);
  }
  console.log(JSON.stringify({ proceed: result.proceed, reason: result.reason, runsThisWeek: runsThisIsoWeek(result.state, now) }));
  return result;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  main().catch((error) => { console.error(`matcher-state: ${error.message}`); process.exitCode = 1; });
}
