// Watchdog-alert routing for `routine-marjorie-ops.yml` (Marjorie Overhaul
// M2, docs/specs/marjorie-overhaul/w1-watchdog-handling.md). Pure and
// tested, not prompt judgment — two of the 14 `ALERT_TITLE` strings in
// watchdog.yml are dynamic, and an hourly LLM re-deriving "have I already
// acted on this?" from comment prose will eventually act twice (the exact
// gap this module exists to close, per the spec's third cross-cutting rule).
//
// Two of the 14 original conditions ("Karen post-repair still unconfirmed",
// "news-worker rotated key looks broken") had their watchdog.yml steps
// deleted in this same change (both expired 2026-08-22) — they can never be
// newly opened again, but a still-open issue from before the removal is one
// of Marjorie's two narrow exceptions to "never close an alert by hand" (see
// the prompt file), so their titles still match here.
//
// Handled-state marker format (designed here, matched nowhere else):
//   <!-- marjorie-ops-handled date=YYYY-MM-DD action=<ACTION> -->
// `date` is the America/Los_Angeles calendar date (todayLA(), imported, not
// reimplemented). `redispatch`/`comment-only` expire at the end of that LA
// calendar day, so a still-open, still-broken alert gets re-attempted the
// next day. `human-action`, `build-desk-issue`, and `escalate` never expire —
// each records a durable, one-time dispatch (a linked issue/PR/HUMAN-ACTIONS
// item) that stays the live answer until that linked thing closes, so
// re-filing it daily would create a duplicate every day the condition stays
// open (see PERMANENT_ACTIONS).
//
// Trust: `deriveHandledState` only honors a marker on a comment whose
// `viewerDidAuthor` is `true` — GitHub's own GraphQL field for "did the
// account running this query post this comment" (`gh issue view --json
// comments` exposes it directly, no extra call needed). This closes the
// forgery Codex found in PR #4216 review (any commenter could otherwise
// post the marker text themselves, even inside a code fence, and
// permanently suppress Marjorie) without comparing identity STRINGS at
// all — two earlier attempts did that and both broke on a real run: PR
// #4216 hardcoded `sffan15-sys` (wrong — the routine's own `gh`/git calls
// authenticate as a GitHub App installation, not the checkout PAT); PR
// #4224 queried the installation's login live instead, but a real run
// showed `gh api graphql viewer.login` returns `claude[bot]` while the
// SAME identity's comments are authored `claude` — two GraphQL surfaces
// spell one identity differently, so even a live-queried exact-string
// compare failed (Codex review of PR #4225 found the `[bot]`-suffix
// normalization patch that briefly replaced this still didn't fully close
// the forgery hole, since stripping a suffix can conflate two USER
// accounts that happen to share a base name). `viewerDidAuthor` sidesteps
// the entire problem: it's computed server-side, per query, against
// whatever credential is actually running it — never a string to get
// wrong. A marker whose `action` isn't in ACTIONS is also ignored
// outright, not treated as valid-and-dated-today.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { todayLA } from './brief-sections.mjs';
import { FB_GROUPS_CHECKLIST } from '../../knowledge/fb-groups-checklist.mjs';
import { runMain } from '../../lib/cli.mjs';
import { readNextHumanActionNumber } from '../human-actions.mjs';

/** Closed vocabulary for the marker's `action=` field. */
export const ACTIONS = [
  'redispatch',
  'comment-only',
  'human-action',
  'build-desk-issue',
  'escalate',
];

/** Actions that never expire — see header. `human-action` and
 * `build-desk-issue` moved here from a redispatch-only set (2026-09-12,
 * Codex review of #4216): both create a linked, durable dispatch (a PR or
 * issue), not a same-day retry, so treating them as daily-expiring caused
 * the routine to re-file a second HUMAN-ACTIONS.md item or a second
 * build-desk issue for the same still-open condition every day it stayed
 * open. Only `redispatch`/`comment-only` are genuinely "try again
 * tomorrow" actions. */
const PERMANENT_ACTIONS = new Set(['human-action', 'build-desk-issue', 'escalate']);

// One entry per static-title row of the spec's handler table. Kept as a
// Map (exact string equality only) rather than a generic `{key, match}`
// dispatch table so the two genuinely dynamic rows below are the only place
// a regex's `.test()` is ever called — CodeQL's regex-injection query
// (`js/regex-injection`) loses precision across a polymorphic array of
// closures and had flagged the exact-match entries as if their titles
// flowed into a regex construction, which they never did. This shape has
// no such call site to misattribute.
const EXACT_TITLES = new Map([
  ["Watchdog: no Founders' Brief", 'no-founders-brief'],
  ['Watchdog: prod smoke check failing', 'prod-smoke-check-failing'],
  ['Watchdog: scheduled workflow(s) not succeeding', 'scheduled-workflows-not-succeeding'],
  ['Watchdog: PR(s) stuck on a failing or missing check', 'prs-stuck'],
  ['Watchdog: Karen scanned but filed no tickets', 'karen-no-tickets'],
  ['Watchdog: routine-vault-run scheduled cadence', 'vault-run-cadence'],
  ['Watchdog: an OPEN [BLOCKING] human action is aging silently', 'blocking-human-action-aging'],
  ['Watchdog: work is going unowned', 'work-unowned'],
  ['Watchdog: Karen post-repair still unconfirmed', 'karen-post-repair-removed'],
  ['Watchdog: news-worker rotated key looks broken', 'news-worker-rotation-removed'],
  ['Watchdog: no FB group export closed in 9 days', 'fb-export-due'],
  ['Watchdog: knowledge engine current-tier data is stale', 'knowledge-stale'],
]);

// The two dynamic rows (`${WF}`/`${LANE}` interpolated by watchdog.yml).
// Both patterns are fixed literals, never built from the title itself —
// `title` is only ever the subject `.test()`s against, not the pattern.
const DYNAMIC_PATTERNS = [
  { key: 'workflow-failed-last-2-runs', re: /^Watchdog: .+ failed its last 2 scheduled runs$/ },
  { key: 'lane-quiet', re: /^Watchdog: .+ hasn't produced a PR in \d+h$/ },
];

/** Title → handler key, or null if the title matches none of the 14 rows
 * (e.g. a non-watchdog issue that happens to carry the `watchdog-alert`
 * label — the routine takes no action on a null match). */
export function matchAlertTitle(title) {
  const t = String(title || '');
  if (EXACT_TITLES.has(t)) return EXACT_TITLES.get(t);
  const hit = DYNAMIC_PATTERNS.find(({ re }) => re.test(t));
  return hit ? hit.key : null;
}

// No `[^>]*` before the closing `-->` (2026-09-12 Codex round-2 review of
// PR #4216): the marker `renderHandledMarker` produces never has trailing
// content after `action=<word>`, so that gap let a malformed value like
// `action=escalate123` truncation-match as the valid action `escalate` —
// `[a-z-]+` captured only the letters and the permissive `[^>]*` swallowed
// the rest before `-->`. Requiring `\s*-->` immediately after the action
// word means anything but an exact, closed-vocabulary value now fails to
// match at all (caught by the `if (!m) continue` below, same as no marker).
//
// Optional `targets=a,b` (#4219) names which members of an aggregate alert
// (workflow names, PR numbers) the marker covers; see deriveHandledState.
const MARKER_RE =
  /<!--\s*marjorie-ops-handled\s+date=(\d{4}-\d{2}-\d{2})\s+action=([a-z-]+)(?:\s+targets=([\w.#/:,-]+))?\s*-->/;

const TARGET_RE = /^[\w.#/:-]+$/;

/** Normalize a target list (array or comma string) to a sorted, deduped array. */
export function parseTargets(input) {
  const raw = Array.isArray(input) ? input : String(input ?? '').split(',');
  const list = raw.map((t) => String(t).trim()).filter(Boolean);
  for (const t of list) if (!TARGET_RE.test(t)) throw new Error(`invalid target: ${t}`);
  return [...new Set(list)].sort();
}

/** The exact marker line Marjorie's ledger comment must contain for
 * `deriveHandledState` to recognize it. `action` must be one of ACTIONS. */
export function renderHandledMarker({ action, date = todayLA(), targets } = {}) {
  if (!ACTIONS.includes(action)) throw new Error(`unknown action: ${action}`);
  const list = targets === undefined ? [] : parseTargets(targets);
  const suffix = list.length ? ` targets=${list.join(',')}` : '';
  return `<!-- marjorie-ops-handled date=${date} action=${action}${suffix} -->`;
}

/**
 * `unhandled` / `handled-awaiting-watchdog` / `escalated` from the alert
 * issue's existing comments (oldest-to-newest order does not matter — every
 * comment is scanned). `comments` is an array of `{ viewerDidAuthor, body }`
 * — only a marker on a comment where `viewerDidAuthor === true` is honored,
 * and only when its `action` is a recognized member of ACTIONS; everything
 * else (a marker on a comment the current credential didn't post, or an
 * unrecognized action value) is silently ignored, never treated as
 * valid-and-dated-today. `targets` (#4219) is the aggregate alert's current
 * member list: a marker only covers the targets it names, so a newly added
 * target is `unhandled` even under a permanent marker. A legacy marker with
 * no `targets=` is grandfathered: it covers EVERY wanted target (permanent
 * ones forever, same-day ones until the day rolls over), same as the original
 * issue-wide behavior, so deploying this does not re-handle open alerts. `today` is injectable for
 * tests; the real caller never overrides it, matching `todayLA()`'s own
 * contract.
 */
export function deriveHandledState(comments, { today = todayLA(), targets } = {}) {
  const want = targets === undefined ? null : parseTargets(targets);
  const permanent = new Set();
  const todays = new Set();
  let sawPermanent = false;
  let sawToday = false;
  let legacyPermanent = false;
  let legacyToday = false;
  for (const { viewerDidAuthor, body } of comments || []) {
    if (viewerDidAuthor !== true) continue;
    const m = MARKER_RE.exec(String(body || ''));
    if (!m) continue;
    const [, date, action] = m;
    if (!ACTIONS.includes(action)) continue;
    const covered = m[3] ? m[3].split(',') : [];
    if (PERMANENT_ACTIONS.has(action)) {
      sawPermanent = true;
      if (!covered.length) legacyPermanent = true;
      for (const t of covered) permanent.add(t);
    } else if (date === today) {
      sawToday = true;
      if (!covered.length) legacyToday = true;
      for (const t of covered) todays.add(t);
    }
  }
  if (!want || !want.length) {
    if (sawPermanent) return 'escalated';
    return sawToday ? 'handled-awaiting-watchdog' : 'unhandled';
  }
  if (want.every((t) => permanent.has(t) || legacyPermanent)) return 'escalated';
  if (want.every((t) => permanent.has(t) || todays.has(t) || legacyPermanent || legacyToday))
    return 'handled-awaiting-watchdog';
  return 'unhandled';
}

/** The six `- Label → \`slug\`` lines (3-space indent, matching the spec's
 * literal text) for whichever groups are in the checklist at filing time. */
export function renderFbGroupLines(checklist = FB_GROUPS_CHECKLIST) {
  return checklist.map((g) => `   - ${g.label} → \`${g.slug}\``).join('\n');
}

/** The full HUMAN-ACTIONS.md v2 item for a stalled local FB export. The
 * checklist parameter remains for CLI compatibility with the original manual
 * renderer; membership rows are now handled by the collector itself. */
export function renderFbHumanAction({
  number,
  date = todayLA(),
  checklist = FB_GROUPS_CHECKLIST,
} = {}) {
  void checklist;
  return `## #${number} 🔴 [BLOCKING] Run or repair this week's automated Facebook export (~10 min)
<!-- ha filed=${date} -->

**Why:** The deterministic local Facebook collector did not close this week's
reminder issue within nine days. It runs from Joey's personal account under the
2026-09-30 owner decision, so only Joey's logged-in Windows session can inspect
a stopped task, checkpoint, 2FA prompt, CAPTCHA, or expired DPAPI credential.
**Steps:**
1. In the project folder, run \`npm run knowledge:fb-export\`.
2. If the visible browser stops at a checkpoint, 2FA prompt, or CAPTCHA,
   complete it yourself and rerun the command. If the credential is missing or
   expired, recreate it with HUMAN-ACTIONS #88's exact DPAPI commands.
3. If it prints a selector-repair prompt or another failure, paste that status
   into the project chat; never attach or paste the credential file.
**Worked if:** the current \`FB group export due — week of ...\` issue closes
with uploaded/not-member counts and no group says \`failed\`.`;
}

// CLI wrapper (only path the routine's Bash-only tool set can use — she has
// no way to `import` this module directly):
//   node scripts/marjorie/lib/alert-router.mjs match "<title>"
//   node scripts/marjorie/lib/alert-router.mjs state < comments.json   # JSON array of {viewerDidAuthor, body}
//   node scripts/marjorie/lib/alert-router.mjs render-fb-item <number> [date]
//   node scripts/marjorie/lib/alert-router.mjs next-ha-number
//
// `state` takes no identity argument at all (removed 2026-09-13, third
// iteration on this exact problem): two earlier attempts tried to identify
// "is this comment mine" by comparing GitHub login STRINGS — a hardcoded
// guess (`sffan15-sys`, PR #4216, wrong: the routine's own `gh`/git calls
// authenticate as a GitHub App installation, not the checkout PAT), then a
// live-queried guess (`gh api graphql viewer.login`, PR #4224, still wrong:
// that field returned `claude[bot]` while the SAME identity's comments are
// authored `claude` — two GraphQL surfaces disagree on one identity's
// spelling). `comments[].viewerDidAuthor` sidesteps identity strings
// entirely: it's a boolean GitHub computes server-side, per query, against
// whichever credential is actually running it — `gh issue view --json
// comments` already exposes it directly, no extra call needed.
function targetsUsage() {
  console.error(
    'alert-router: --targets requires a non-empty comma-separated list (e.g. --targets a.yml,b.yml)',
  );
  return 2;
}

async function main(argv = process.argv.slice(2)) {
  const [cmd, ...rest] = argv;
  if (cmd === 'match') {
    const key = matchAlertTitle(rest.join(' '));
    console.log(key ?? 'unmatched');
    return key ? 0 : 1;
  }
  if (cmd === 'state') {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    // #4226: empty stdin means the upstream `gh issue view` failed (a real
    // zero-comment issue still emits `[]`); never read it as "no ledger".
    // Exit 3 = lookup failed: keep prior state, take no action on this alert.
    const raw = Buffer.concat(chunks).toString('utf8');
    let comments = null;
    try {
      if (raw.trim()) comments = JSON.parse(raw);
    } catch {
      comments = null;
    }
    if (!Array.isArray(comments)) {
      console.error(
        'alert-router: state lookup failed (empty or non-array stdin); keeping prior state, taking no action on this alert',
      );
      return 3;
    }
    const ti = rest.indexOf('--targets');
    if (ti >= 0 && !parseTargets(rest[ti + 1]).length) return targetsUsage();
    const targets = ti >= 0 ? parseTargets(rest[ti + 1]) : undefined;
    console.log(deriveHandledState(comments, { targets }));
    return 0;
  }
  if (cmd === 'render-fb-item') {
    const [number, date] = rest;
    console.log(renderFbHumanAction({ number, date }));
    return 0;
  }
  if (cmd === 'marker') {
    const ti = rest.indexOf('--targets');
    if (ti >= 0 && !parseTargets(rest[ti + 1]).length) return targetsUsage();
    const targets = ti >= 0 ? rest[ti + 1] : undefined;
    const [action, date] = rest.filter((_, i) => ti < 0 || (i !== ti && i !== ti + 1));
    console.log(renderHandledMarker({ action, date, targets }));
    return 0;
  }
  if (cmd === 'today') {
    console.log(todayLA());
    return 0;
  }
  if (cmd === 'next-ha-number') {
    console.log(readNextHumanActionNumber());
    return 0;
  }
  console.error(
    'Usage: alert-router.mjs match "<title>" | state [--targets a,b] (stdin JSON) | render-fb-item <number> [date] | marker <action> [date] [--targets a,b] | today | next-ha-number',
  );
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'alert-router' });
}
