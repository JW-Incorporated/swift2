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
// Trust: `deriveHandledState` only honors a marker posted by
// `trustedAuthor` (default DEFAULT_TRUSTED_AUTHOR, see below) — a marker
// from any other commenter on the alert issue is ignored, closing the
// forgery Codex found in PR #4216 review (any commenter could otherwise
// post the marker text themselves, even inside a code fence, and
// permanently suppress Marjorie). A marker whose `action` isn't in ACTIONS
// is also ignored outright, not treated as valid-and-dated-today.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { todayLA } from './brief-sections.mjs';
import { FB_GROUPS_CHECKLIST } from '../../knowledge/fb-groups-checklist.mjs';
import { runMain } from '../../lib/cli.mjs';
import { readNextHumanActionNumber } from '../human-actions.mjs';

/** Closed vocabulary for the marker's `action=` field. */
export const ACTIONS = ['redispatch', 'comment-only', 'human-action', 'build-desk-issue', 'escalate'];

/** Actions that never expire — see header. `human-action` and
 * `build-desk-issue` moved here from a redispatch-only set (2026-09-12,
 * Codex review of #4216): both create a linked, durable dispatch (a PR or
 * issue), not a same-day retry, so treating them as daily-expiring caused
 * the routine to re-file a second HUMAN-ACTIONS.md item or a second
 * build-desk issue for the same still-open condition every day it stayed
 * open. Only `redispatch`/`comment-only` are genuinely "try again
 * tomorrow" actions. */
const PERMANENT_ACTIONS = new Set(['human-action', 'build-desk-issue', 'escalate']);

/** Fallback trusted-author identity, used only if the CLI's `state`
 * subcommand gets neither a `[trustedAuthor]` argument nor a
 * `MARJORIE_OPS_AUTHOR` env var. This value has already been WRONG once in
 * production: `routine-marjorie-ops.yml`'s `checkout_token_secret:
 * SOCIAL_POSTER_PAT` (`sffan15-sys`, the owner's own PAT per
 * docs/decisions.md's 2026-09-11 B1 entry) governs the initial checkout,
 * but 2026-09-13's first successful real run posted every comment as
 * `claude` instead — `claude-code-action` authenticates its OWN `gh`/git
 * calls under the GitHub App installation, not the checkout PAT (confirmed
 * via `gh auth status` in that run, see build-desk issue #4223). Do not
 * trust this constant for anything that matters; `marjorie-ops.md` now
 * queries `gh api graphql -f query='{ viewer { login } }'` at the start of
 * every run — GraphQL, not the REST `/user` endpoint, because `/user`
 * doesn't support a GitHub App installation token at all (Codex review of
 * PR #4224 caught this: a first attempt at this fix used `gh api user`,
 * which would likely have failed outright under the identity this routine
 * actually runs as) — and passes the real answer as `state`'s CLI arg, so
 * this fallback is only ever reached by a caller that skips that step
 * (e.g. a test with no better value to supply). Kept as `'sffan15-sys'`
 * rather than updated to `'claude'` because BOTH are guesses about a
 * runtime detail that has already changed once — changing which wrong
 * guess is the default fixes nothing; only the live query is reliable. */
export const DEFAULT_TRUSTED_AUTHOR = 'sffan15-sys';

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
const MARKER_RE = /<!--\s*marjorie-ops-handled\s+date=(\d{4}-\d{2}-\d{2})\s+action=([a-z-]+)\s*-->/;

/** The exact marker line Marjorie's ledger comment must contain for
 * `deriveHandledState` to recognize it. `action` must be one of ACTIONS. */
export function renderHandledMarker({ action, date = todayLA() } = {}) {
  if (!ACTIONS.includes(action)) throw new Error(`unknown action: ${action}`);
  return `<!-- marjorie-ops-handled date=${date} action=${action} -->`;
}

/** Strips a trailing `[bot]` suffix so two GraphQL surfaces that represent
 * the SAME GitHub App identity differently can still compare equal.
 * Confirmed live (2026-09-13, run 34730507147): `gh api graphql -f
 * query='{ viewer { login } }'` returned `claude[bot]` for the exact
 * session that had earlier posted issue comments authored `claude` (no
 * suffix) — both are the same underlying identity, just spelled
 * differently by two different GraphQL fields. Without this, the
 * trusted-author check would never match its own past marker, and the
 * routine would re-post a fresh comment every single hour forever (never
 * a duplicate PR/dispatch — the 2026-09-13 run's own good judgment
 * avoided that — but still a violation of "one comment per alert per
 * 24h"). */
function stripBotSuffix(login) {
  return String(login || '').replace(/\[bot\]$/, '');
}

/**
 * `unhandled` / `handled-awaiting-watchdog` / `escalated` from the alert
 * issue's existing comments (oldest-to-newest order does not matter — every
 * comment is scanned). `comments` is an array of `{ author, body }` — only a
 * marker whose `author` matches `trustedAuthor` (compared with any `[bot]`
 * suffix stripped from both sides) is honored, and only when its `action`
 * is a recognized member of ACTIONS; everything else (a forged marker from
 * another commenter, or an unrecognized action value) is silently ignored,
 * never treated as valid-and-dated-today. `today` is injectable for tests;
 * the real caller never overrides it, matching `todayLA()`'s own contract.
 */
export function deriveHandledState(comments, { today = todayLA(), trustedAuthor = DEFAULT_TRUSTED_AUTHOR } = {}) {
  let sawToday = false;
  const trustedAuthorNormalized = stripBotSuffix(trustedAuthor);
  for (const { author, body } of comments || []) {
    if (stripBotSuffix(author) !== trustedAuthorNormalized) continue;
    const m = MARKER_RE.exec(String(body || ''));
    if (!m) continue;
    const [, date, action] = m;
    if (!ACTIONS.includes(action)) continue;
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
//   node scripts/marjorie/lib/alert-router.mjs state [trustedAuthor] < comments.json   # JSON array of {author, body}
//   node scripts/marjorie/lib/alert-router.mjs render-fb-item <number> [date]
//   node scripts/marjorie/lib/alert-router.mjs next-ha-number
//
// `state`'s trusted-author precedence: the `[trustedAuthor]` CLI arg, then
// `MARJORIE_OPS_AUTHOR`, then `DEFAULT_TRUSTED_AUTHOR`. The CLI arg exists
// because DEFAULT_TRUSTED_AUTHOR is a GUESS, and a wrong one is silent and
// severe: 2026-09-13's real first successful run posted every comment as
// `claude` (the GitHub App installation identity `claude-code-action` runs
// its own `gh`/git calls under — confirmed via `gh auth status` in that
// run's own build-desk issue #4223), not `sffan15-sys` (the
// `checkout_token_secret` PAT, which turned out to only govern the initial
// checkout, not the agent's own tool calls) — the value this constant
// shipped with. A wrong trusted-author means `deriveHandledState` NEVER
// recognizes the routine's own marker, so every future sweep reads
// `unhandled` forever and re-files a duplicate PR/comment every single
// hour. Rather than hardcode a second guess, `marjorie-ops.md` now has the
// routine query `gh api graphql -f query='{ viewer { login } }'` for its
// own real identity at the start of each run (GraphQL, not the REST
// `/user` endpoint — `/user` doesn't support a GitHub App installation
// token, which is exactly what this routine runs as) and pass that
// literal answer as this CLI arg — the check is then correct by
// construction, not by prediction, regardless of how `claude-code-action`'s
// own auth evolves in the future.
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
    const comments = JSON.parse(Buffer.concat(chunks).toString('utf8') || '[]');
    const trustedAuthor = rest[0] || process.env.MARJORIE_OPS_AUTHOR || DEFAULT_TRUSTED_AUTHOR;
    console.log(deriveHandledState(comments, { trustedAuthor }));
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
  if (cmd === 'next-ha-number') {
    console.log(readNextHumanActionNumber());
    return 0;
  }
  console.error(
    'Usage: alert-router.mjs match "<title>" | state (stdin JSON) | render-fb-item <number> [date] | marker <action> [date] | today | next-ha-number',
  );
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'alert-router' });
}
