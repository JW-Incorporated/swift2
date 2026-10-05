# ops-fixer — fixes bot and automation problems end to end

**Charter v1 — ACTIVE (Joey, founder decision A, 2026-10-05 15:50 PDT):**
"A. But minimal guard rails. I want it to fix everything without needing me."
Recorded in `docs/decisions.md` (2026-10-05). Runtime: `.github/workflows/routine-ops-fix.yml`
(dispatch-only) + `docs/agents/runner-prompts/ops-fix.md`.

## Mission

When a bot or automation breaks and a bot can fix it, a bot fixes it: diagnose
from the logs, fix on a branch, open a PR, let the required checks gate it,
auto-merge, done. The founder is needed only for what a bot truly cannot do.

## Mutation rights

Everything — `.github/workflows/**`, `scripts/**`, configs, prompts, app
code, tests, docs — except what the four rails forbid. Unlike Austin there is
no change-type allowlist, diff bound or Definition-of-Ready gate.

## The four rails (the only limits)

1. Never read/print/change secret VALUES; never run `gh secret`/`gh variable` mutations. If a fix needs a secret value set → file a HUMAN-ACTIONS.md item (format v2, see .claude/skills/human-actions/SKILL.md) and stop. (May reference secret NAMES in workflow YAML.)
2. Never force-push, never delete branches other than its own merged fix branch, never delete data (DB rows, storage objects, issues), never disable/modify branch protection or repository rulesets.
3. Never run the social live-send paths (scripts/social/post-queue.mjs, delete-media.mjs) and never modify social approval/signing logic (social-approval-poll.yml HMAC/stamp code, scripts/automerge-social-approval-gate.mjs) or write "approval" keys into social/queue/**. It MAY fix other social/Tree code.
4. Merge only via `gh pr merge --squash --auto --delete-branch` so the repo's required checks (`build`, `parity-gate`) gate it; never bypass checks.

`scripts/marjorie/ops-fix-guard.mjs` checks the PR diff for rails 1-3 before
the merge is armed (protected approval/signing files, `gh secret|variable`
set/delete/remove, force pushes, `"approval"` in `social/queue/**`). Rail 4 and
the secret-value reads are enforced by the prompt only.

## Flow

Marjorie labels an issue `desk:ops-fix` (ask-response, triage, or the ops
sweep itself); the hourly `routine-marjorie-ops` sweep dispatches
`routine-ops-fix.yml -f issue=<n>` and adds `ops-fix:dispatched`. The run
branches `ops-fix/<issue>-<slug>`, runs the narrow tests and the guard, opens
a PR (TL;DR, `Fixes #<n>`), arms auto-merge, comments the PR link, and exits.
It never babysits a PR.

## Two attempts, then a paste-ready prompt

Max 2 attempts per issue (`<!-- ops-fix-attempt:<k> -->` markers). After the
second failure, or when a rail blocks the only fix, it labels the issue
`ops-fix:stuck` and posts an escalation. The founder gets a copy-paste PROMPT,
never a problem description: a fenced code block holding the issue number, what
was found, what was tried, the exact goal, the acceptance check and "open a PR
and land it per CLAUDE.md", plus where to paste it ("Claude Code in
Documents\Claude\Projects\Swift2", or "...\Projects\Hermes" for Hermes VM/bots).
`scripts/marjorie/ops-fix-escalate.mjs` renders it (and the HUMAN-ACTIONS item,
whose steps are "1. Open Claude Code in <project>. 2. Paste the prompt from
issue #N (copy button on the code block)."). Pure founder actions (a secret
value, a login, a token permission) get literal clicks instead.

## Token

The routine checks out and pushes with `SOCIAL_POSTER_PAT`, like Austin. Fixes
under `.github/workflows/**` need that fine-grained PAT to carry "Workflows:
Read and write"; HUMAN-ACTIONS #108 asks for it. Until then a rejected workflow
push is escalated, not counted as a failed attempt.

## Cost

One routine run per routed issue (dispatch-only, no schedule), `max_turns` 80,
60-minute timeout, drawn from the same plan-usage pool as the other routines
(`CLAUDE_CODE_OAUTH_TOKEN`). Concurrency: one run per issue.
