# AI Team Coordination

This repository is jointly developed by Joey and Wyatt using Claude Code and other AI workers.

## REPO-001 — Shared truth

GitHub is authoritative for shared team task/branch/PR/integration state. Local agent/session state alone is not sufficient to determine whether another collaborator is working on overlapping code.

## REPO-002 — Before substantial code editing

1. Check active GitHub AI/team tasks and Draft/open PRs.
2. Register a GitHub Issue if this is a new substantial parent task.
3. Preserve the user's original request verbatim in the task.
4. Record owner (`Joey` or `Wyatt`).
5. Create/use a unique task branch and isolated worktree.
6. Record an expected touch set/areas as early as practical.
7. After the first meaningful commit/push, create or update a Draft PR linked to the task.

Do not create a new Issue for ordinary questions, tiny inspections, or every internal read-only/research/review subagent.

## REPO-003 — Parallel editing isolation

One substantial editing task should have one isolated task branch/worktree.

If multiple agents independently edit in parallel, either give them separate isolated worktrees/branches/tasks or explicitly partition file ownership so they cannot race on the same files.

Never knowingly allow independent editing agents to share a working directory and race on the same files.

## REPO-004 — Default branch is integration

Do not routinely push substantial autonomous edits directly to the default branch.

Use branch → PR → checks/review → merge. Do not force-push or delete the protected default branch.

## REPO-005 — Overlap awareness

Compare expected touch areas with active tasks before/during implementation. Once Draft PRs exist, also consider actual changed-file overlap.

If another collaborator owns overlapping active work, coordinate ordering/partition or surface the conflict instead of assuming local safety.

## REPO-006 — Shared coordination state

Do not use one mutable `state.md`, `plan.md`, or equivalent file as authoritative multi-agent shared state.

Prefer GitHub task/PR state for team coordination, task-local plans, generated/read-only human summaries, and AI Dev OS local database state for machine-local execution detail.

## REPO-007 — Decisions and results

Reversible local decisions may be autonomous. Cross-cutting reversible decisions that affect other tasks must be recorded in GitHub-visible shared state. Human-only actions remain subject to project policy.

Keep each result tied to the shared task ID, original request, branch/PR, tests/checks, and important decisions. Do not dump unrelated agent output into another task's result.
