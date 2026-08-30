// automerge-branch-author-gate — the WHO/WHERE-FROM backstop for
// auto-merge-content.yml (#1969, follow-up to the P0 #1972 fix).
//
// THE HOLE THIS EXISTS FOR. Every other gate in this workflow (the path
// allowlist, the content ownership lock, the guard-code content scan) judges
// WHAT a PR touches. None of them judge WHO opened it or FROM WHERE. The
// workflow's own header used to say plainly: "A bot can name its branch
// anything; it cannot make app code look like a seed file" — true of the
// file gate, but it left no boundary at all on WHICH branches/authors are
// even eligible to be judged by that file gate in the first place. A
// content-authoring routine (or an injected/compromised agent riding its
// identity) could push app-code edits from a branch named anything and, if
// the changed files happened to fall inside the path allowlist, sail
// straight through — the path allowlist was the ONLY gate.
//
// This module is the hard structural boundary #1969 asks for: a PR only even
// gets evaluated for auto-merge when BOTH hold —
//   1. its head branch matches one of this repo's own content-lane routines'
//      DOCUMENTED naming conventions (sourced from docs/agents/*.md, grepped
//      2026-08-24 — not guessed; see CONTENT_LANE_BRANCH_PREFIXES /
//      CONTENT_LANE_EXACT_BRANCHES below, each commented with its source);
//   2. its author is one of the known identities those routines actually run
//      under — the two founders' own logins (mirrors FOUNDER_LOGINS in
//      scripts/marjorie/founder-gate.mjs; this repo's cloud routines
//      authenticate as a founder's own account, not a dedicated service
//      account — confirmed against real PR history 2026-08-24) plus the
//      Claude Code GitHub App identity some routines (e.g. the Vault Run)
//      open PRs under instead.
//
// Anything else — including a PR that happens to touch only allowlisted
// content paths — fails this gate and waits for a human. That is the
// fail-safe direction; this module is purely additive, same as
// automerge-content-guard.mjs.
//
// Mirrored, NOT imported, into the `enable` job of
// .github/workflows/auto-merge-content.yml (a GitHub Actions bash step can't
// `import` an ESM module) — keep the two lists in step, the same "mirrors X;
// keep them in step" contract check-automerge-allowlist.mjs already documents
// for its own deny-prefix logic (see that file's barredPrefixes()). Pure
// functions exported for scripts/automerge-branch-author-gate.test.ts, which
// also asserts the workflow file still contains every entry below.

/**
 * Branch-name patterns each content-lane routine's own charter documents
 * (docs/agents/*.md). Prefixes end in `/` (dated branches, e.g.
 * `vault/<date>`); CONTENT_LANE_EXACT_BRANCHES below holds the two fixed
 * (non-dated) branch names separately.
 */
export const CONTENT_LANE_BRANCH_PREFIXES = [
  'content-shift/', // docs/agents/runner-prompts/content-shift-run.md ("branch content-shift/<date>")
  'vault/', // docs/agents/runner-prompts/vault-run.md ("branch `vault/<date>`")
  'growth/', // docs/agents/runner-prompts/growth-draft.md ("branch `growth/<date>`")
  'tree/', // docs/agents/runner-prompts/tree-plan.md + docs/agents/tree.md ("branch `tree/<date>`")
  'depth/answerer-', // docs/agents/runner-prompts/answerer.md ("branch depth/answerer-<date>")
  'content/rumor-desk-', // docs/agents/runner-prompts/rumor-desk.md ("branch content/rumor-desk-<date>")
  'content/stylist-', // docs/agents/runner-prompts/stylist.md ("branch content/stylist-<date>")
  'social-poster/state-', // docs/agents/growth.md + docs/decisions.md 2026-08-12 (#2031 ledger PRs)
  'appearance-discovery/', // .github/workflows/appearance-discovery.yml + docs/decisions.md 2026-08-25 (fast-lane social drafts)
  'merch-revenue/', // .github/workflows/merch-revenue.yml (weekly generated report PRs)
];

/**
 * Fixed (non-dated) content-lane branch names — matched exactly, never as a
 * prefix, because their own prefix (`fix/`, `kevin/`) is shared with ordinary
 * human engineering branches (e.g. `fix/a11y-p2-batch`) and would be a wildly
 * over-broad match if treated as one.
 */
export const CONTENT_LANE_EXACT_BRANCHES = [
  'fix/karen-tickets', // docs/agents/runner-prompts/kevin-stream1-karen.md
  'kevin/user-fixes', // docs/agents/runner-prompts/kevin-stream2-digest.md
];

/**
 * Identities the content-lane routines actually run under. `sffan15-sys` /
 * `wjduvall-cmd` are the two founders' own GitHub logins. `claude[bot]` is
 * the literal string `github.event.pull_request.user.login` returns for a
 * Claude Code GitHub App PR — confirmed via `gh api .../pulls/<n> --jq
 * .user.login` against a real Vault Run PR; NOT the `gh` CLI's own GraphQL
 * rendering of that same actor ("app/claude"), which the workflow's
 * `PR_AUTHOR` env var would never actually see.
 */
export const KNOWN_CONTENT_AUTHORS = ['sffan15-sys', 'wjduvall-cmd', 'claude[bot]'];

/** Does this head branch match a documented content-lane naming convention? */
export function isContentLaneBranch(branch) {
  const b = String(branch || '');
  if (CONTENT_LANE_EXACT_BRANCHES.includes(b)) return true;
  return CONTENT_LANE_BRANCH_PREFIXES.some((p) => b.startsWith(p));
}

/** Is this author one of the known identities those routines run under? */
export function isKnownContentAuthor(login) {
  return KNOWN_CONTENT_AUTHORS.includes(String(login || ''));
}

/**
 * The gate the `enable` job actually runs: both branch AND author must check
 * out, or the PR is declined before any path/ownership/content check even
 * runs. Returns `{ ok, reasons }` — `reasons` names which half(ves) failed.
 */
export function evaluateBranchAuthorGate({ branch, author }) {
  const reasons = [];
  if (!isContentLaneBranch(branch)) {
    reasons.push(`head branch \`${branch}\` does not match a known content-lane naming pattern`);
  }
  if (!isKnownContentAuthor(author)) {
    reasons.push(`author \`${author}\` is not a known content-lane identity`);
  }
  return { ok: reasons.length === 0, reasons };
}
