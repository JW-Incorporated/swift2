// Is the status page still re-rendering? Evaluated for watchdog.yml.
//
// The page's own `_Updated … UTC_` header is the only honest signal, because
// `status-note.mjs` keeps rewriting the note and `fan-recap` regions daily
// while preserving the rest: a page whose render job is dead still LOOKS
// maintained, and its deterministic body can be weeks stale without anything
// going red (issue #6151 — 15 days). The header line is written only by a full
// render, so its age is the render's heartbeat.
//
// An unreadable page or header is `unknown`, never `ok`: it must not close a
// standing alert (same rule as db-migrate-run-check.mjs).
import { readFileSync } from 'node:fs';

// Two missed hourly renders of grace. The brief's daily `deliver` render is a
// second writer, so anything past this is a real stall, not a slipped cron.
export const STALE_HOURS = 3;
const HOUR_MS = 3_600_000;
// No `\b` after UTC: the live header continues ` · <PT> PT_`, but a page whose
// line ends `UTC_` is the same timestamp and must still parse.
const UPDATED_LINE = /^_Updated (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) UTC/m;

/** The header timestamp in ms, or null when the body has none. Pure. */
export function parseUpdatedAt(body) {
  const match = UPDATED_LINE.exec(String(body ?? '').replace(/\r\n/g, '\n'));
  if (!match) return null;
  const ms = Date.parse(`${match[1]}T${match[2]}:00Z`);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * @param {Array<{number?: number, body?: string, url?: string}>} issues
 *   open `status-page` issues; the canonical page is the oldest, as in
 *   lib/status-issue.mjs's findStatusIssue.
 */
export function evaluateStatusFreshness(issues, { now = Date.now() } = {}) {
  const base = { state: 'unknown', reason: '', number: null, url: '', updatedAt: null, ageHours: null };
  const page = (Array.isArray(issues) ? issues : [])
    .filter((issue) => issue && Number.isInteger(issue.number))
    .sort((a, b) => a.number - b.number)[0];
  if (!page) return { ...base, reason: 'no open status-page issue' };
  const found = { number: page.number, url: typeof page.url === 'string' ? page.url : '' };
  const updatedAt = parseUpdatedAt(page.body);
  if (updatedAt === null) return { ...base, ...found, reason: 'the page has no `_Updated … UTC_` header' };
  const ageHours = Math.round(((now - updatedAt) / HOUR_MS) * 10) / 10;
  return {
    ...base,
    ...found,
    state: ageHours > STALE_HOURS ? 'alert' : 'ok',
    updatedAt: new Date(updatedAt).toISOString(),
    ageHours,
  };
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split(/[\\/]/).pop() === 'status-page-freshness-check.mjs';
if (invokedDirectly) {
  if (process.argv[2] !== 'evaluate') {
    console.error('Usage: status-page-freshness-check.mjs evaluate < issues.json');
    process.exit(2);
  }
  process.stdout.write(
    `${JSON.stringify(evaluateStatusFreshness(JSON.parse(readFileSync(0, 'utf8'))))}\n`,
  );
}
