// Who a watchdog alert is FOR — the single decision point behind the Discord
// leg of `scripts/watchdog/upsert-alert.sh` (issue #4804).
//
// Before this module every alert `open` posted a line (and sometimes an
// @-mention) into the founders channel, including the ~10 of 14 watchdog
// conditions that `routine-marjorie-ops.yml` re-dispatches or comments on by
// itself within the hour. The issue is still opened and Marjorie still handles
// it; what changes is that the founders only hear about an alert that actually
// needs one of them.
//
// Two gates, both pure and tested here:
//
//   1. `isFounderFacing(title)` — the founder-facing set is the four paging
//      conditions from docs/agents/marjorie.md "Paging (T3)" (site down, legal
//      or safety exposure, security incident, runaway cost) plus any alert
//      whose handler class is `human-action` or `escalate`. Everything else is
//      self-handled and holds its Discord line.
//   2. `backstopState(comments)` — the honesty valve. A held line is recorded
//      as a marker comment on the alert issue; if that alert is STILL open 24h
//      later, watchdog posts one line anyway, once. A dark or broken Marjorie
//      therefore delays a real failure by at most a day, it can never hide it.
//
// Fail-open by construction: a title this module does not recognise is
// founder-facing (`handlerClass` → null → true), so adding a watchdog
// condition without touching this file keeps the loud behaviour, and a bug
// here is over-notification, never silence. The same default covers the
// non-watchdog callers of `upsert-alert.sh` (mobile-parity, production-backup,
// social-poster, chat-alarm), whose titles are not watchdog conditions at all.
//
// Marker trust follows `alert-router.mjs`'s `viewerDidAuthor === true` rule
// for exactly the same reason documented at length there: a marker anyone
// could post is a marker anyone could use to suppress the backstop forever,
// and comparing GitHub login STRINGS to prevent that has already failed twice
// on real runs. `viewerDidAuthor` is computed server-side per query against
// whichever credential is running it. Both markers here are written and read
// by watchdog.yml steps under the same `github.token`, so the field is true
// for the ones that count.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMain } from '../../lib/cli.mjs';
import { matchAlertTitle } from './alert-router.mjs';

/** What Marjorie's ops routine does about each alert, one entry per row of
 * the handler table in docs/specs/marjorie-overhaul/w1-watchdog-handling.md,
 * keyed by `alert-router.mjs`'s handler key. `human-action` and `escalate`
 * are the classes that end at a founder; the rest she closes out herself. */
export const HANDLER_CLASS = new Map([
  ['no-founders-brief', 'redispatch'],
  ['prod-smoke-check-failing', 'human-action'],
  ['scheduled-workflows-not-succeeding', 'redispatch'],
  ['workflow-failed-last-2-runs', 'redispatch'],
  ['prs-stuck', 'comment-only'],
  ['karen-no-tickets', 'redispatch'],
  ['vault-run-cadence', 'redispatch'],
  // "Posts: **nothing**" in the handler table, explicitly: the brief's
  // "Waiting on you" already lists every blocking human action with its age
  // every morning, so an in-channel duplicate is pure noise. This is the one
  // row whose subject is a human action but whose class is not.
  ['blocking-human-action-aging', 'comment-only'],
  ['work-unowned', 'comment-only'],
  ['karen-post-repair-removed', 'build-desk-issue'],
  ['news-worker-rotation-removed', 'human-action'],
  ['fb-export-due', 'human-action'],
  ['knowledge-stale', 'redispatch'],
  ['lane-quiet', 'redispatch'],
]);

/** Handler classes that end at a founder either way. */
const FOUNDER_FACING_CLASSES = new Set(['human-action', 'escalate']);

// The four paging conditions from docs/agents/marjorie.md "Paging (T3)",
// matched on the title as keywords rather than as a second list of exact
// titles: a condition added later that IS one of these should page without an
// edit here. Each pattern is a fixed literal — a title is only ever the
// subject of `.test()`, never used to build a pattern.
const PAGING_PATTERNS = [
  /\bsite (is )?down\b/i,
  /\b(prod|production)\b.*\b(smoke check failing|deploy failed|outage)\b/i,
  /\b(legal|safety|privacy) (exposure|risk|breach|incident)\b/i,
  /\bsecurity (incident|breach)\b|\bcredential leak\b/i,
  /\brunaway (cost|spend)\b|\bcost (spike|overrun)\b|\b(over|exceeded) budget\b|\bbudget exceeded\b/i,
];

/** `'redispatch' | 'comment-only' | 'human-action' | 'build-desk-issue' |
 * 'escalate'`, or `null` for a title that is not one of the watchdog
 * conditions in the handler table. */
export function handlerClass(title) {
  const key = matchAlertTitle(title);
  if (!key) return null;
  return HANDLER_CLASS.get(key) ?? null;
}

/** True when this alert's Discord line (and its founder @-mention) should be
 * sent. See the header for the two halves of the founder-facing set and why
 * an unrecognised title is founder-facing. */
export function isFounderFacing(title) {
  const t = String(title || '');
  if (PAGING_PATTERNS.some((re) => re.test(t))) return true;
  const cls = handlerClass(t);
  if (cls === null) return true;
  return FOUNDER_FACING_CLASSES.has(cls);
}

export const BACKSTOP_AFTER_MS = 24 * 60 * 60 * 1000;

// `kind=<ISO instant>`, seconds precision, no trailing content before `-->`
// — the same closed shape as alert-router.mjs's marker, for the same reason
// (a permissive tail let a malformed value truncation-match a valid one).
const MARKER_RE =
  /<!--\s*watchdog-notify\s+(suppressed|backstop)=(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z)\s*-->/g;

/** An ISO instant at seconds precision, the only form MARKER_RE accepts. */
export function notifyStamp(at = new Date()) {
  return new Date(at).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** The comment watchdog leaves on an alert whose Discord line it held. Body
 * text first so the comment reads as something in the GitHub UI, not as an
 * empty box. */
export function renderSuppressedComment({ title, at = new Date() } = {}) {
  const cls = handlerClass(title) ?? 'unknown';
  return [
    `🔇 Discord line held — this condition is Marjorie's to handle (\`${cls}\`), so it is not announced in the founders channel.`,
    'If this alert is still open 24 hours from now, watchdog posts one line there anyway.',
    `<!-- watchdog-notify suppressed=${notifyStamp(at)} -->`,
  ].join('\n');
}

/** The comment watchdog leaves when the 24h backstop fires, which is also
 * what stops it firing a second time. */
export function renderBackstopComment({ at = new Date() } = {}) {
  return [
    '🔔 Still open 24 hours after its Discord line was held — posted to the founders channel now.',
    `<!-- watchdog-notify backstop=${notifyStamp(at)} -->`,
  ].join('\n');
}

/**
 * `none` / `waiting` / `pending` / `done` for the 24h backstop, from the
 * alert issue's own comments — no new store, same state-machine-on-the-issue
 * design as `alert-router.mjs`.
 *
 * - `none`    — no line was ever held for this alert; nothing to back up.
 * - `waiting` — a line was held less than 24h ago.
 * - `pending` — held 24h or more ago and not yet backed up: post one line.
 * - `done`    — the backstop already fired; never fire again.
 *
 * `comments` is an array of `{ viewerDidAuthor, body }`; only markers on
 * comments the querying credential itself authored are honoured. The EARLIEST
 * `suppressed` marker wins, so a condition that flaps (held, recovered, held
 * again on one evolving issue) is measured from the first time it went quiet
 * rather than being able to reset its own clock indefinitely.
 */
export function backstopState(comments, { now = new Date() } = {}) {
  let earliest = null;
  let backedUp = false;
  for (const { viewerDidAuthor, body } of comments || []) {
    if (viewerDidAuthor !== true) continue;
    // `matchAll` clones the regex, so the shared global MARKER_RE's own
    // lastIndex is never advanced between comments.
    for (const [, kind, stamp] of String(body || '').matchAll(MARKER_RE)) {
      if (kind === 'backstop') {
        backedUp = true;
        continue;
      }
      const at = Date.parse(stamp);
      if (Number.isNaN(at)) continue;
      if (earliest === null || at < earliest) earliest = at;
    }
  }
  if (backedUp) return 'done';
  if (earliest === null) return 'none';
  return new Date(now).getTime() - earliest >= BACKSTOP_AFTER_MS ? 'pending' : 'waiting';
}

// CLI (the only form `upsert-alert.sh` and watchdog.yml's bash steps can
// use). Every verb prints one word/block on stdout and exits 0 — the shell
// compares the string rather than branching on an exit code, so a crash is
// unambiguously a crash and the callers can fail open to notifying.
//
//   node alert-notify.mjs founder-facing "<title>"   # founder-facing|self-handled
//   node alert-notify.mjs class "<title>"            # handler class, or `unknown`
//   node alert-notify.mjs suppressed-comment "<title>"
//   node alert-notify.mjs backstop-comment
//   node alert-notify.mjs backstop-state < comments.json   # JSON [{viewerDidAuthor, body}]
async function main(argv = process.argv.slice(2)) {
  const [cmd, ...rest] = argv;
  if (cmd === 'founder-facing') {
    console.log(isFounderFacing(rest.join(' ')) ? 'founder-facing' : 'self-handled');
    return 0;
  }
  if (cmd === 'class') {
    console.log(handlerClass(rest.join(' ')) ?? 'unknown');
    return 0;
  }
  if (cmd === 'suppressed-comment') {
    console.log(renderSuppressedComment({ title: rest.join(' ') }));
    return 0;
  }
  if (cmd === 'backstop-comment') {
    console.log(renderBackstopComment());
    return 0;
  }
  if (cmd === 'backstop-state') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    // Empty stdin means the upstream `gh issue view` failed (a real
    // zero-comment issue still emits `[]`). Never read that as "no marker" —
    // that would re-post the backstop line every hour. Exit 3 = lookup
    // failed, caller skips this alert and tries again next run.
    const raw = Buffer.concat(chunks).toString('utf8');
    let comments = null;
    try {
      if (raw.trim()) comments = JSON.parse(raw);
    } catch {
      comments = null;
    }
    if (!Array.isArray(comments)) {
      console.error(
        'alert-notify: backstop-state lookup failed (empty or non-array stdin); skipping this alert',
      );
      return 3;
    }
    console.log(backstopState(comments));
    return 0;
  }
  console.error(
    'Usage: alert-notify.mjs founder-facing "<title>" | class "<title>" | suppressed-comment "<title>" | backstop-comment | backstop-state (stdin JSON)',
  );
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'alert-notify' });
}
