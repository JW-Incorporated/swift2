# Routine invariants — what must always be true of the scheduled fleet

A point-in-time cleanup rots. `docs/agents/runners.md` was accurate when written
and had drifted into describing ~15 runners when 97 existed. So this file does
**not** list the expected routines — a hand-maintained list is the thing that
goes stale. It lists **invariants**, which don't.

The auditor routine checks these weekly and opens a `routine-audit` issue when
any is violated. It is the only detection layer that exists, because **the repo
cannot see this class of failure**: the 2026-07-25 runaway loops were explicitly
instructed not to comment or message when nothing changed, so they left no trace
in git, issues, or CI while burning ~144 sessions/day.

## The invariants

| # | Invariant | Why |
|---|---|---|
| 1 | **No trigger is named `send_later*`** | That name means an agent armed a self-check-in. There is no legitimate use. |
| 2 | **No trigger carries the `Claude_Code_Remote` connector** — except the auditor | That connector is the ability to *create triggers*. Removing it is what makes rogue spawning impossible rather than merely forbidden. New routines get it by DEFAULT, which is why this needs checking forever, not once. |
| 3 | **No trigger sets `persist_session: true`** | A persistent session re-reads a growing history every wake, so cost climbs each cycle. Scheduled work should boot clean. |
| 4 | **Total enabled trigger count ≤ 35** | A ceiling, not a target. Crossing it means something is multiplying. |
| 5 | **No trigger has `Task` in `allowed_tools`** unless its charter says why | `Task` is subagent fan-out: one scheduled run silently becomes ten. |

## Adding a new routine — the checklist

1. **Remove the `Claude_Code_Remote` connector** (Edit → Connectors → `×` → Save).
   It is added by default. This is invariant 2 and the single easiest thing to forget.
2. Set `persist_session: false`.
3. Give it the narrowest `allowed_tools` that works — no `Task`, no `Monitor`
   unless justified in its charter.
4. Pick the model deliberately (see `runners.md` § model tiering). Opus is not
   the default answer; a script-and-summarize job is Sonnet, a deterministic
   poll is Haiku.
5. Add a **Run discipline** block: do the work, open the PR, exit. No self-check-ins.
6. Register it in `runners.md` **with a prompt file**. Nine runners drifted
   precisely because their prompts lived only inside the trigger, where the
   "repo file is the source of truth" rule silently did not apply.

## Known gap

There is no account- or org-level policy that prevents any of this. Enforcement
is per-routine, so invariant 2 in particular can only be *maintained*, never
*guaranteed*. That is exactly why the auditor exists.
