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
import { gh as ghRun } from '../../lib/gh.mjs';

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
