// 24-hour counts by label for the brief's **Since yesterday** section
// (Marjorie Overhaul C2, docs/specs/marjorie-overhaul/c2-brief.md;
// docs/specs/marjorie-overhaul/s1-triage.md names the label set). No existing
// helper computes this — confirmed.
//
// Only `intake` is registered in `bootstrap-labels.mjs` today; `user-feedback`,
// `feedback` and `link-submission` don't exist as real labels yet, and
// nothing files any of the four until M3's triage routine ships. A 0 count
// for every label is therefore the correct reading today, not a bug.
//
// Client-side date filtering, not `gh issue list --search` — the search API
// (`/search/issues`) 403s for repo-scoped cloud sessions (this is exactly the
// runtime `assemble-brief.mjs` executes in when Marjorie's own routine calls
// it — see `scripts/lib/gh.mjs`'s header, bug #4 / #1869). Every other
// date-windowed fetch in this file family (`content-shipped.mjs`'s
// `fetchContentShipped`, `assemble-brief.mjs`'s own merged24/opened24/closed24)
// fetches broadly with `--state all` and filters `createdAt` client-side
// against a `DAY_MS` cutoff instead — this module matches that proven shape.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gh as ghRun } from '../../lib/gh.mjs';
import { runMain } from '../../lib/cli.mjs';

const REPO = 'JW-Incorporated/swift2';
const DAY_MS = 86_400_000;

export const SUBMISSION_LABELS = ['user-feedback', 'feedback', 'intake', 'link-submission'];

// `--state all`, not `--state open`-only: an issue opened and closed inside
// the 24h window should still count as "came in" (c2-brief.md's Data table).
async function countLabelSince(repo, label, sinceMs) {
  const { stdout } = await ghRun([
    'issue', 'list', '--repo', repo, '--label', label, '--state', 'all',
    '--limit', '200', '--json', 'createdAt',
  ]);
  const rows = JSON.parse(stdout || '[]');
  return rows.filter((i) => new Date(i.createdAt).getTime() > sinceMs).length;
}

/**
 * `{ [label]: count }` for every label in SUBMISSION_LABELS. Each label is
 * fetched independently (`gh issue list --label` ANDs multiple `--label`
 * values rather than unioning them) so an issue carrying two of these labels
 * correctly counts once per label, not once total.
 */
export async function fetchSubmissionCounts(repo = REPO, { now = Date.now() } = {}) {
  const sinceMs = now - DAY_MS;
  const entries = await Promise.all(
    SUBMISSION_LABELS.map(async (label) => [label, await countLabelSince(repo, label, sinceMs)]),
  );
  return Object.fromEntries(entries);
}

/** The one Submissions line for **Since yesterday**. */
export function renderSubmissionsLine(counts) {
  if (!counts) return '- Submissions in: no data fetched.';
  const parts = SUBMISSION_LABELS.map((label) => `${counts[label] ?? 0} ${label}`);
  return `- Submissions in: ${parts.join(', ')}`;
}

// Triage selection (Marjorie Overhaul M3, docs/specs/marjorie-overhaul/
// s1-triage.md). Each of the three site routes stamps an unambiguous title
// prefix — selection is by that prefix, `startsWith` in code, never a label
// (the `intake` label has three unrelated producers, docs/plans/marjorie-
// overhaul/PLAN.md M0 finding #7) and never `gh issue search` (GitHub's
// search strips punctuation, so `"[Feedback]" in:title` would also match any
// title merely containing the word "feedback" — the same trap
// `scripts/watchdog/upsert-alert.sh:33-38` already documents).
export const TITLE_PREFIXES = [
  ['[Feedback] ', 'feedback'],
  ['[Intake] ', 'intake'],
  ['[Link submission] ', 'link-submission'],
];

/** The source tag for a submission title, or `null` if it matches none of
 * the three producer prefixes. `startsWith` only — never a regex, which
 * could match mid-string. */
export function sourceOf(title) {
  const t = String(title || '');
  for (const [prefix, source] of TITLE_PREFIXES) {
    if (t.startsWith(prefix)) return source;
  }
  return null;
}

/**
 * Untriaged submissions from a `gh issue list --json number,title,labels,
 * body,url,createdAt` result: issues whose title matches one of the three
 * producer prefixes and which do not already carry `marjorie-triaged`, each
 * annotated with `.source`. Pure — no network call.
 */
export function selectUntriagedSubmissions(issues) {
  const out = [];
  for (const issue of issues || []) {
    const source = sourceOf(issue.title);
    if (!source) continue;
    const labels = issue.labels || [];
    if (labels.some((l) => l.name === 'marjorie-triaged')) continue;
    out.push({ ...issue, source });
  }
  return out;
}

// Founder-handoff marker comments (mirrors alert-router.mjs's
// renderHandledMarker/deriveHandledState shape): `pending` is posted by the
// triage routine alongside the in-channel message text; `posted` is posted
// by routine-marjorie-triage.yml's `deliver` job once that text has actually
// reached Discord. Never hand-write either string — always generate it here
// so the format can never drift from what `pendingFounderIssues` parses.
const FOUNDER_MARKER_STATES = ['pending', 'posted'];

export function renderFounderMarker(state) {
  if (!FOUNDER_MARKER_STATES.includes(state)) {
    throw new Error(`unknown founder marker state: ${state}`);
  }
  return `<!-- marjorie-triage-founder:${state} -->`;
}

// Trusted login(s) for the `run` job's own agent comments, checked by
// `pendingFounderIssues` below. NOT `viewerDidAuthor`: that field is relative
// to whichever credential is running the CURRENT query, and the `deliver`
// job (a plain job authenticated as `secrets.GITHUB_TOKEN`) reads comments
// the `run` job's Claude-Code-Action credential posted — a different
// identity, in a different job, in the same workflow run. `viewerDidAuthor`
// is therefore always `false` there, even for the routine's own comments
// (confirmed live, M3 proof run on #4234: both of the routine's own
// comments came back `viewerDidAuthor: false` under a third credential).
// `alert-router.mjs`'s header warns against hardcoding identity strings —
// that lesson is about comparing strings ACROSS API surfaces that spell the
// same identity differently (GraphQL's `viewer.login` vs REST's comment
// `author.login`). Here there is exactly one surface (`gh issue view --json
// comments`, `.author.login`) used consistently by both the `pending-
// founder` CLI call and the `deliver` job's own extraction step, so an
// allowlist of the login(s) actually observed on that one surface carries
// none of that inconsistency risk.
const TRUSTED_TRIAGE_LOGINS = ['claude', 'claude[bot]'];

function isTrustedAuthor(comment) {
  return TRUSTED_TRIAGE_LOGINS.includes(comment?.author?.login);
}

/**
 * Issue numbers from a `gh issue view --json number,comments`-shaped result
 * (`[{number, comments: [{body, author: {login}}]}]`) whose comments contain
 * a `pending` founder-handoff marker with no `posted` marker after it. Pure
 * — no network call. Mirrors alert-router.mjs's `deriveHandledState` in
 * spirit (derive state from marker text in comments, never track it
 * elsewhere) but not in mechanism — see `isTrustedAuthor` above for why.
 * This repo is PUBLIC: a marker is honored only on a comment from a trusted
 * login — a forged `pending` comment from someone else must never get its
 * body relayed to the founders' Discord as if Marjorie wrote it, and a
 * forged `posted` comment must never suppress a real handoff (Codex review,
 * PR #4229, finding 1).
 */
export function pendingFounderIssues(issuesWithComments) {
  const pendingMarker = renderFounderMarker('pending');
  const postedMarker = renderFounderMarker('posted');
  const out = [];
  for (const issue of issuesWithComments || []) {
    const comments = issue.comments || [];
    let pendingIdx = -1;
    for (let i = 0; i < comments.length; i += 1) {
      const c = comments[i];
      if (isTrustedAuthor(c) && String(c?.body || '').includes(pendingMarker)) pendingIdx = i;
    }
    if (pendingIdx === -1) continue;
    const postedAfter = comments
      .slice(pendingIdx + 1)
      .some((c) => isTrustedAuthor(c) && String(c?.body || '').includes(postedMarker));
    if (!postedAfter) out.push(issue.number);
  }
  return out;
}

// CLI wrapper (only path the routine's Bash-only tool set can use — she has
// no way to `import` this module directly):
//   gh issue list ... --json number,title,labels,body,url,createdAt --limit 200 \
//     | node scripts/marjorie/lib/submissions.mjs select
//   node scripts/marjorie/lib/submissions.mjs marker <pending|posted>
//   gh issue view <n> --json comments --jq '[{number: <n>, comments: .comments}]' \
//     | node scripts/marjorie/lib/submissions.mjs pending-founder
// `--json comments` must keep the default `author` sub-fields (it does,
// unless a caller narrows with `--jq` before this point) — `pending-founder`
// reads `comments[].author.login`, not `viewerDidAuthor`.
// `pending-founder` takes `gh issue view`'s per-issue shape (full comment
// objects, including `viewerDidAuthor`), never `gh issue list`'s bulk
// `--json comments` — the GraphQL query backing `gh issue list` truncates
// comments per issue, so a marker past that cut could never be seen
// (Codex review, PR #4229, finding 7); `gh issue view` is also the shape
// `alert-router.mjs`'s own state derivation already relies on.
async function readStdinJson() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '[]');
}

async function main(argv = process.argv.slice(2)) {
  const [cmd, ...rest] = argv;
  if (cmd === 'select') {
    const issues = await readStdinJson();
    console.log(JSON.stringify(selectUntriagedSubmissions(issues)));
    return 0;
  }
  if (cmd === 'marker') {
    console.log(renderFounderMarker(rest[0]));
    return 0;
  }
  if (cmd === 'pending-founder') {
    const issues = await readStdinJson();
    console.log(JSON.stringify(pendingFounderIssues(issues)));
    return 0;
  }
  console.error(
    'Usage: submissions.mjs select (stdin JSON) | marker <pending|posted> | pending-founder (stdin JSON)',
  );
  return 2;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runMain(main, { name: 'submissions' });
}
