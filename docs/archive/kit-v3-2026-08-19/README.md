# Archived kit-v3 framework — retired 2026-08-19

The orchestration framework that ran this repo before AI Dev OS v3.2. Kept
verbatim so the migration is reversible and nothing is lost. **Nothing here is
active.** See `docs/migrations/2026-08-19-ai-dev-os-v3.2-inventory.md`.

## Two snapshots of `STATE.md`, and why

The migration was prepared on a branch off `ops/checkpoint-merch-review` while
`main` moved on independently. The two lines had genuinely different `STATE.md`
content, so both are kept:

| File | What it is |
|---|---|
| `STATE.md` | **The authoritative final state** — `origin/main`'s version at retirement, 525 lines. Contains the mood-bot over-refusal work, the production self-harm detection hole found by test case 10, and the classifier-architecture ruling |
| `STATE.ops-branch-pruned.md` | The `ops/checkpoint-merch-review` version, 149 lines. Had been pruned back to the old 150-line cap, which dropped the mood-bot material |

Same story for the plan file:

| File | What it is |
|---|---|
| `PLAN.md` | `origin/main`'s final plan — the mood-bot over-refusal fix (`fix/mood-over-refusal`, landed via #2184) |
| `PLAN.merch-2026-08-16.md` | The merch page redesign plan, shipped 2026-08-16 |

**The durable half of `STATE.md`'s content was migrated, not just archived** —
into `docs/engineering-lessons.md` (traps, including the crisis-lexicon
progressive-form rule), `docs/decisions.md` (standing rulings), and
`docs/handoff/2026-08-19-paused-work.md` (live position at the pause).

## Everything else here

| Path | What it was |
|---|---|
| `OPERATINGMANUAL.md` | kit-v3's long-form orchestration manual |
| `PLANtemplate.md` | The plan template, copied to `PLAN.md` per task |
| `hooks/triage.sh` | `UserPromptSubmit` — re-stated the six-category routing rule every prompt |
| `hooks/checkpoint-gate.sh` | `Stop` — blocked ending a turn on a stale `STATE.md` |
| `agents/architect.md` | Fable escalation tier (two-part rule, logged in `STATE.md`) |
| `agents/executor.md` | Executed `PLAN.md` steps verbatim with per-step verification |
| `agents/reviewer.md` | Reviewed a diff against `PLAN.md` before acceptance |
| `skills/pause/SKILL.md` | Usage-limit pause/resume protocol (`PAUSE.md`) |

## Restoring any of it

```
git checkout pre-ai-dev-os-migration-2026-08-19 -- <path>
```

Or copy from the off-repo backup at
`~/.claude/backups/swift2-kit-v3-2026-08-19/`.

**Before restoring anything, read the inventory's conflict list.** Most of these
were retired because they duplicate or contradict AI Dev OS authority —
`hooks/triage.sh` in particular fought the global task hook on every prompt, and
`STATE.md`-as-shared-state violates `REPO-006`.
