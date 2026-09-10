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
  'merch-official-sync/', // .github/workflows/merch-official-sync.yml's `author` job (E4 catalog + store-drop social draft PRs)
  'merch-audit-authoring/', // .github/workflows/merch-audit-authoring.yml's demotion-apply step (E3 mismatch removal, issue #3447 P2)
  'claude/pensive-galileo-', // Photo Enrichment worker (docs/agents/runner-prompts/photo-enrichment-worker.md) opens PRs on claude.ai/code, which names its branch `claude/<adjective-name>-<id>`; every real PR from this routine (#3343, #3384, #3405, #3420, #3466, #3579, confirmed via `gh pr list --search "head:claude/pensive-galileo"` 2026-09-05) used the exact `claude/pensive-galileo-<id>` shape. Using the narrower `claude/pensive-galileo-` prefix instead of the bare `claude/` prefix the task also allowed, because `claude/` alone would match ANY claude.ai/code branch name (including this very gate-fix's own worktree branch naming family) and is unverifiably broad; this prefix is exactly what real history proves.
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

// ── CLI (added for auto-merge-keepup.yml, t_21a0cd6f) ──────────────────────
// The `enable` job's own copy of this gate is mirrored bash (a workflow step
// can't `import` an ESM module), which is exactly why the sibling test file
// asserts the two stay in sync. A SECOND workflow (auto-merge-keepup.yml)
// that pro-actively refreshes stale content-lane branches needs the same
// WHO/WHERE-FROM judgement, and shelling out to `node` here beats maintaining
// a THIRD hand-copied bash mirror of this list. Usage:
//   node scripts/automerge-branch-author-gate.mjs --branch <ref> --author <login>
// Exit 0 = passes the gate; exit 1 = does not (reasons on stderr); exit 2 =
// missing/invalid arguments (the check itself couldn't run).
function parseArg(argv, name) {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
}

function cliMain() {
  const argv = process.argv.slice(2);
  const branch = parseArg(argv, '--branch');
  const author = parseArg(argv, '--author');
  if (branch === undefined || author === undefined) {
    console.error('usage: automerge-branch-author-gate.mjs --branch <ref> --author <login>');
    return 2;
  }
  const { ok, reasons } = evaluateBranchAuthorGate({ branch, author });
  if (!ok) {
    for (const r of reasons) console.error(`  • ${r}`);
    return 1;
  }
  console.log(`ok: branch \`${branch}\` / author \`${author}\` pass the content-lane gate`);
  return 0;
}

const invokedDirectly =
  process.argv[1] && process.argv[1].split('\\').join('/').endsWith('scripts/automerge-branch-author-gate.mjs');
if (invokedDirectly) {
  import('./lib/cli.mjs').then(({ runMain }) => runMain(cliMain, { name: 'automerge-branch-author-gate' }));
}
