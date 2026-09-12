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
// reimplemented). Every action except `escalate` expires at the end of that
// LA calendar day, so a still-open, still-broken alert gets re-attempted the
// next day; `escalate` never expires, because it records a durable dispatch
// (a linked issue/PR) rather than a daily-repeatable action.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { todayLA } from './brief-sections.mjs';
import { FB_GROUPS_CHECKLIST } from '../../knowledge/fb-groups-checklist.mjs';
import { runMain } from '../../lib/cli.mjs';

/** Closed vocabulary for the marker's `action=` field. */
export const ACTIONS = ['redispatch', 'comment-only', 'human-action', 'build-desk-issue', 'escalate'];

/** Actions that never expire — see header. */
const PERMANENT_ACTIONS = new Set(['escalate']);

// One entry per row of the spec's handler table, in the same order. `match`
// takes the alert issue's exact title string.
const HANDLERS = [
  { key: 'no-founders-brief', match: (t) => t === "Watchdog: no Founders' Brief" },
  { key: 'prod-smoke-check-failing', match: (t) => t === 'Watchdog: prod smoke check failing' },
  { key: 'scheduled-workflows-not-succeeding', match: (t) => t === 'Watchdog: scheduled workflow(s) not succeeding' },
  { key: 'workflow-failed-last-2-runs', match: (t) => /^Watchdog: .+ failed its last 2 scheduled runs$/.test(t) },
  { key: 'prs-stuck', match: (t) => t === 'Watchdog: PR(s) stuck on a failing or missing check' },
  { key: 'karen-no-tickets', match: (t) => t === 'Watchdog: Karen scanned but filed no tickets' },
  { key: 'vault-run-cadence', match: (t) => t === 'Watchdog: routine-vault-run scheduled cadence' },
  { key: 'blocking-human-action-aging', match: (t) => t === 'Watchdog: an OPEN [BLOCKING] human action is aging silently' },
  { key: 'work-unowned', match: (t) => t === 'Watchdog: work is going unowned' },
  { key: 'karen-post-repair-removed', match: (t) => t === 'Watchdog: Karen post-repair still unconfirmed' },
  { key: 'news-worker-rotation-removed', match: (t) => t === 'Watchdog: news-worker rotated key looks broken' },
  { key: 'lane-quiet', match: (t) => /^Watchdog: .+ hasn't produced a PR in \d+h$/.test(t) },
  { key: 'fb-export-due', match: (t) => t === 'Watchdog: no FB group export closed in 9 days' },
  { key: 'knowledge-stale', match: (t) => t === 'Watchdog: knowledge engine current-tier data is stale' },
];

/** Title → handler key, or null if the title matches none of the 14 rows
 * (e.g. a non-watchdog issue that happens to carry the `watchdog-alert`
 * label — the routine takes no action on a null match). */
export function matchAlertTitle(title) {
  const hit = HANDLERS.find((h) => h.match(String(title || '')));
  return hit ? hit.key : null;
}

const MARKER_RE = /<!--\s*marjorie-ops-handled\s+date=(\d{4}-\d{2}-\d{2})\s+action=([a-z-]+)[^>]*-->/;

/** The exact marker line Marjorie's ledger comment must contain for
 * `deriveHandledState` to recognize it. `action` must be one of ACTIONS. */
export function renderHandledMarker({ action, date = todayLA() } = {}) {
  if (!ACTIONS.includes(action)) throw new Error(`unknown action: ${action}`);
  return `<!-- marjorie-ops-handled date=${date} action=${action} -->`;
}

/**
 * `unhandled` / `handled-awaiting-watchdog` / `escalated` from the alert
 * issue's existing comment bodies (oldest-to-newest order does not matter —
 * every comment is scanned). `today` is injectable for tests; the real
 * caller never overrides it, matching `todayLA()`'s own contract.
 */
export function deriveHandledState(commentBodies, { today = todayLA() } = {}) {
  let sawToday = false;
  for (const body of commentBodies || []) {
    const m = MARKER_RE.exec(String(body || ''));
    if (!m) continue;
    const [, date, action] = m;
    if (PERMANENT_ACTIONS.has(action)) return 'escalated';
    if (date === today) sawToday = true;
  }
  return sawToday ? 'handled-awaiting-watchdog' : 'unhandled';
}

/** The six `- Label → \`slug\`` lines (3-space indent, matching the spec's
 * literal text) for whichever groups are in the checklist at filing time. */
export function renderFbGroupLines(checklist = FB_GROUPS_CHECKLIST) {
  return checklist.map((g) => `   - ${g.label} → \`${g.slug}\``).join('\n');
}

/** The full HUMAN-ACTIONS.md v2 item for the FB-export human action,
 * byte-identical to w1-watchdog-handling.md's literal text with `#NN` and
 * the filed date substituted and the group list regenerated from
 * `checklist` (never hard-coded — a later roster change needs no spec
 * edit). */
export function renderFbHumanAction({ number, date = todayLA(), checklist = FB_GROUPS_CHECKLIST } = {}) {
  const groupLines = renderFbGroupLines(checklist);
  return `## #${number} 🟡 [DECIDE] Save this week's Facebook group pages and upload them (~30 min)
<!-- ha filed=${date} -->

**Why:** The fan-signal engine reads what Swifties are actually saying in six
Facebook groups. Facebook has no API for groups you don't run and forbids
automated collection, so this is the one step a person has to do. Nothing has
been exported yet — the watchdog has been flagging it since 2026-09-07
(issue #4009) and two weekly reminders are open (#3911, #3536). Until one
export lands, nobody knows whether the parser works.
**Steps:**
1. In a normal logged-in browser (never a bot), open each group below in turn.
   All six were found by desk research and **nobody has confirmed you are a
   member** — if you are not in one, skip it and say which in your reply:
${groupLines}
2. In the group, sort posts by **New activity** (not Top).
3. Scroll down until the posts you can see are older than 7 days. Click
   "See more" on any long post so its full text is on screen. Do not open
   comment threads one by one.
4. Press \`Ctrl+S\` (Windows) or \`Cmd+S\` (Mac). In the save dialog choose
   **"Webpage, Complete"**. Name the file exactly
   \`fb-<slug>-<YYYY-MM-DD>.html\` using the slug from step 1 and today's date —
   for example \`fb-taylor-swifts-vault-2026-09-14.html\`. Save to Downloads.
5. Repeat steps 2-4 for each group you are a member of.
6. Open a terminal in the project folder and run, exactly:
   \`npm run knowledge:fb-upload -- ~/Downloads/fb-*.html\`
   It prints one line per file. Each says either \`uploaded, local copy
   deleted\` or gives a reason and \`local copy KEPT\`. A kept file was not
   uploaded — re-run that one file by name.
7. Close the open reminder issues #3911 and #3536.
**Worked if:** step 6 ends with \`knowledge:fb-upload: N/N uploaded\` where N is
the number of groups you saved, and no line says \`local copy KEPT\`.`;
}

// CLI wrapper (only path the routine's Bash-only tool set can use — she has
// no way to `import` this module directly):
//   node scripts/marjorie/lib/alert-router.mjs match "<title>"
//   node scripts/marjorie/lib/alert-router.mjs state < comments.json   # JSON array of comment body strings
//   node scripts/marjorie/lib/alert-router.mjs render-fb-item <number> [date]
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
    const commentBodies = JSON.parse(Buffer.concat(chunks).toString('utf8') || '[]');
    console.log(deriveHandledState(commentBodies));
    return 0;
  }
  if (cmd === 'render-fb-item') {
    const [number, date] = rest;
    console.log(renderFbHumanAction({ number, date }));
    return 0;
  }
  if (cmd === 'marker') {
    const [action, date] = rest;
    console.log(renderHandledMarker({ action, date }));
    return 0;
  }
  if (cmd === 'today') {
    console.log(todayLA());
    return 0;
  }
  console.error('Usage: alert-router.mjs match "<title>" | state (stdin JSON) | render-fb-item <number> [date] | marker <action> [date] | today');
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'alert-router' });
}
