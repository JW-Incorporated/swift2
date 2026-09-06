// automerge-keepup — the STRUCTURAL fix for the recurring stranded-PR problem
// (t_21a0cd6f, follow-up to t_dcb1f2c0's root-cause writeup).
//
// THE ROOT CAUSE THIS EXISTS FOR. t_dcb1f2c0 found that 6 of 7 stranded PRs on
// 2026-09-06 failed `build` for the SAME reason: they were opened against an
// older `main`, then main moved (OS-014, or any of the ~2-5-minute bot merges
// that land constantly), and the PR's own CI kept checking stale assumptions.
// `git merge main` into each fixed all 6 with ZERO conflicts — proving this
// was pure staleness, not a real content collision. `watchdog.yml`'s "PRs
// stuck" step only ever detects this 24h+ later and does not fix anything —
// by the time a founder or agent notices, the PR may need re-merging several
// times more as main keeps moving (documented in t_dcb1f2c0's writeup: #3794
// needed re-syncing THREE times chasing a 2-5-minute merge cadence).
//
// THE FIX: a scheduled job that keeps every eligible content-lane PR's branch
// fresh against `main`, continuously, before it ever goes stale enough to
// strand. This is pure maintenance (`git merge origin/main`, no content
// change) — never a content decision — so it is safe to run unattended at
// high frequency and it eliminates the failure class instead of alerting on
// it faster.
//
// SAFETY MODEL — deliberately as narrow as auto-merge-content.yml itself:
//   - Reuses the EXACT SAME branch/author gate (automerge-branch-author-gate.mjs)
//     that decides whether a PR is even eligible for unattended auto-merge.
//     A PR this job is willing to silently keep green is, definitionally,
//     already a PR GitHub's native auto-merge is willing to land unattended —
//     this job does not expand who/what may merge, it only keeps eligible
//     branches from going stale before they get the chance to.
//   - Skips PARKED_LABELS (hold, cie:escalate, founder-decision) — same three
//     labels watchdog.yml and auto-merge-content.yml already treat as "a
//     human deliberately wants eyes on this", mirrored here for the same
//     reason check-automerge-allowlist.mjs's "mirrors X; keep in step"
//     contract already documents for its own deny-prefix logic.
//   - Only ever merges `main` INTO a branch (fast-forwarding the branch to
//     include upstream changes) — never the reverse, never squashes, never
//     rewrites history. A conflict is left entirely alone: this job does
//     merge conflict resolution to no one; it reports and moves on.
//   - Bounded per run (`maxCount`) so a large stale backlog cannot turn one
//     scheduled tick into an unbounded number of pushes/CI runs — same
//     Actions-minutes discipline watchdog.yml's stuck-PR re-run budget
//     documents for itself.
//
// Usage (from the workflow, which owns the actual `git`/`gh` calls):
//   node scripts/automerge-keepup.mjs --prs-json /tmp/prs.json [--max 8]
// prs-json is the JSON array from:
//   gh pr list --state open --json number,headRefName,baseRefName,isDraft,\
//     mergeStateStatus,labels,createdAt,author --limit 100
// Prints one JSON array of { number, headRefName } candidates to refresh,
// oldest-open first, to stdout. Exit 0 always (an empty array is a normal,
// good outcome, not a failure) unless the input itself is unreadable/invalid
// (exit 2 — the check itself is broken, not "nothing to do").

import { readFileSync } from 'node:fs';
import { evaluateBranchAuthorGate } from './automerge-branch-author-gate.mjs';
import { runMain } from './lib/cli.mjs';

// Mirrors watchdog.yml's PARKED_LABELS and auto-merge-content.yml's own
// `hold`/`cie:escalate` handling — a PR deliberately held for a founder is
// not stale-and-forgotten, it is parked, and this job must not touch it.
export const PARKED_LABELS = ['hold', 'cie:escalate', 'founder-decision'];

/**
 * Is this PR (already fetched as a gh --json record) eligible for an
 * unattended `git merge origin/main` refresh?
 *
 * Pure so it is unit-testable without gh or a network. `pr` is one element
 * of `gh pr list --json number,headRefName,baseRefName,isDraft,
 * mergeStateStatus,labels,author`.
 */
export function isRefreshCandidate(pr) {
  if (pr.isDraft) return false;
  if (pr.baseRefName !== 'main') return false;
  if (pr.mergeStateStatus !== 'BEHIND') return false;
  const labelNames = (pr.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
  if (labelNames.some((l) => PARKED_LABELS.includes(l))) return false;
  const { ok } = evaluateBranchAuthorGate({ branch: pr.headRefName, author: pr.author?.login });
  return ok;
}

/**
 * Select which open PRs to refresh this run, oldest-open first (a PR that
 * has been stale longest is the most likely to have drifted furthest and the
 * most likely to be the one a human eventually has to chase by hand — same
 * "oldest first" priority watchdog.yml's stuck-PR step already uses),
 * bounded to `maxCount`.
 */
export function selectRefreshCandidates(prs, { maxCount = 8 } = {}) {
  return (prs || [])
    .filter(isRefreshCandidate)
    .slice()
    .sort((a, b) => Date.parse(a.createdAt || 0) - Date.parse(b.createdAt || 0))
    .slice(0, maxCount)
    .map((pr) => ({ number: pr.number, headRefName: pr.headRefName }));
}

function parseArg(argv, name) {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
}

function cliMain() {
  const argv = process.argv.slice(2);
  const prsPath = parseArg(argv, '--prs-json');
  const maxCount = Number(parseArg(argv, '--max')) || 8;
  if (!prsPath) {
    console.error('usage: automerge-keepup.mjs --prs-json <path> [--max N]');
    return 2;
  }
  let prs;
  try {
    prs = JSON.parse(readFileSync(prsPath, 'utf8'));
    if (!Array.isArray(prs)) throw new Error('not an array');
  } catch (err) {
    console.error(`automerge-keepup: could not read/parse ${prsPath}: ${err.message ?? err}`);
    return 2;
  }
  const candidates = selectRefreshCandidates(prs, { maxCount });
  console.log(JSON.stringify(candidates));
  console.error(
    `automerge-keepup: ${prs.length} open PR(s) seen, ${candidates.length} selected for refresh (cap ${maxCount}).`,
  );
  return 0;
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/automerge-keepup.mjs');
if (invokedDirectly) {
  runMain(cliMain, { name: 'automerge-keepup' });
}
