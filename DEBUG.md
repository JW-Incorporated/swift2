# Social-approval-gate: approvedBy/approvedAt provenance (RESOLVED — GitHub API)

## Trigger

`codex:rescue` adversarial review of the `feat/social-approval-gate` branch
(`scripts/social/lib/git-provenance.mjs`), two rounds, both real findings on
the SAME mechanism — per CLAUDE.md rule 3, no third review attempt proceeds
without the debug ladder.

## Reproduction

```
git log -5 --format='%cn <%ce> | %an <%ae>' --all -- 'social/queue/*'
```
against this repo's real history returns, for every GitHub-web-merged PR:
`GitHub <noreply@github.com> | <actual PR author> <...>` — i.e. the author
is the drafter (Joey or `claude[bot]`, whoever opened the PR), and the
committer is GitHub's own bot identity, never the human who clicked "Merge."

## Root cause

Local `git log` metadata on a commit produced by GitHub's web-UI squash
merge does not contain "who clicked Merge" under any field:
- `%an`/`%ae` (author) = the PR's original author (the DRAFTER) — round 1's
  finding: this misattributes every approved post's `approvedBy` to
  whoever drafted it, not whoever approved it, defeating the entire point
  of the 2026-09-10 approval-gate decision's audit trail.
- `%cn`/`%ce` (committer) = `GitHub <noreply@github.com>` — round 2's
  finding, confirmed against this repo's actual history above: not a human
  identity at all.

"Who approved this merge" is GitHub-API-only data (`GET /pulls/{n}` →
`merged_by.login`, `merged_at`), not present in the git object model at
all. Two consecutive review rounds tried two different LOCAL-git-only
mechanisms and both are wrong for the same underlying reason — this is the
"fix approach is wrong" trigger, not a fixable typo.

## Scope-preserving repair direction (as decided and implemented)

`getQueueFileProvenance` resolves the queue file's latest touching commit
to its merging PR and reads `merged_by`/`merged_at` from the GitHub API
instead of local git metadata (see "Resolution" above). The network/auth
question was decided in-session (not an architecture fork): the lookup is
best-effort and provenance-only, so `post-queue.mjs` gaining a `gh api`
read (via `GITHUB_REPOSITORY`, already set in the workflow's environment)
is acceptable — it never blocks a post on failure. Test strategy: `runGhApi`
is injected exactly like `execFileImpl`, so no test spawns the real `gh`
CLI or `git`.

## Review history

- Round 1: `getQueueFileProvenance` used `--diff-filter=A` + `%an`/`%aI`
  (author of the file's original ADD commit) — misattributes to the
  drafter on a squash merge, and misses later approved edits entirely
  (`--diff-filter=A` only ever sees the first commit). Fixed the
  "only sees the add" half by dropping `--diff-filter=A`; fixed author→
  committer, believing GitHub's web-UI merge sets the committer to the
  merging human — WRONG, see round 2.
- Round 2: `%cn`/%cI` (committer) returns `GitHub <noreply@github.com>` on
  every real GitHub-web-merged commit in this repo's actual history, not
  the approving founder. Per CLAUDE.md rule 3, stopped here — this needed
  the GitHub API (`merged_by`), a genuinely different mechanism, decided
  before a third attempt, not guessed. Interim state: `getQueueFileProvenance`
  reverted to an honest no-op (always `null`) rather than ship a
  known-wrong value, and this was escalated for a decision.
- **Resolution (Joey, same session):** not an architecture fork — a scoped
  fix. `getQueueFileProvenance` now keeps the local `git log` step ONLY to
  find the SHA of the latest commit touching the file (that part was never
  wrong), then calls `gh api repos/{owner}/{repo}/commits/{sha}/pulls --jq
  '.[0].merged_by.login,.[0].merged_at'` (GitHub's "list pull requests
  associated with a commit" endpoint) for the actual approving human and
  timestamp. The API call is injected as `runGhApi` so unit tests never
  spawn the real `gh` CLI, matching the `execFileImpl` discipline already
  used for the git-log half. Any failure (unknown repo, no git history,
  `gh` unauthenticated, network hiccup, or a commit with no
  associated/merged PR) still falls back to `{ approvedBy: null,
  approvedAt: null }` — provenance stays best-effort, never a gate. See
  `scripts/social/lib/git-provenance.mjs` and its test file for the
  implementation and the fallback-path coverage.

---

# Awin shortlist review-round 2

## Trigger

Independent review of PR #3538 identified that `sourceField` claims every possible Awin source field for each candidate rather than the specific field that supplied the matching signal.

## Reproduction

`npx vitest run scripts/merch-engine/awin-directory-shortlist.test.ts`

The focused suite passes (7/7), but it only verifies the generic provenance string. It does not construct programme records with competing display URL, primary domain, valid-domain, and name signals, so it cannot prove the emitted field is factual.

## Root cause

`scripts/merch-engine/awin-directory-shortlist.mjs` collapses candidate domain values to bare hostnames in `sourceHostnames()`. Once a hostname is returned, the later exact/suffix/manual-review code retains no metadata about whether it originated in `displayUrl`, `primaryDomain`, `validDomains`, `domains`, or an advertiser name. `candidateRow()` therefore emits a static union of possible fields, including `name`, for every programme.

## Scope-preserving repair direction

Represent each supported candidate signal as `{ value, sourceField, kind }`; retain that record through exact and suffix matching; for manual review emit the concrete name or domain field that triggered the normalized-key/suffix candidate. Add fixtures with conflicting supported fields and assert precise output provenance. Preserve manual-review-only classification, US-sector eligibility, feed status, and the Awin-origin/pagination protections.

## Review history

- Round 1: pagination dropped `countryCode=US` and `relationship` after an Awin next-page URL. Fixed and covered by page-two query assertions.
- Round 2: provenance source field is ambiguous. Per `CLAUDE.md`, no third review attempt proceeds without the debug ladder/Fable ruling.
