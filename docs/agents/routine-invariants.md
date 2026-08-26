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
| 2 | **No trigger sets `persist_session: true`** | A persistent session re-reads a growing history every wake, so cost climbs each cycle. Scheduled work should boot clean. |
| 3 | **Total enabled trigger count ≤ 35** | A ceiling, not a target. Crossing it means something is multiplying. |
| 4 | **No trigger has `Task` in `allowed_tools`** unless its charter says why | `Task` is subagent fan-out: one scheduled run silently becomes ten. |

**2026-08-23 — removed:** an invariant restricting the `Claude_Code_Remote`
connector (the ability to *create new triggers* via the API) to the Auditor
alone. Founder decision (Joey, direct instruction, accepted the risk) — see
`docs/decisions.md` for the full rationale and the incident this invariant
originally closed off. Every routine on this account may now hold that
connector; nothing in this fleet enforces the old one-exception rule anymore.

## Adding a new routine — the checklist

1. Set `persist_session: false`.
2. Give it the narrowest `allowed_tools` that works — no `Task`, no `Monitor`
   unless justified in its charter.
3. Pick the model deliberately (see `runners.md` § model tiering). Opus is not
   the default answer; a script-and-summarize job is Sonnet, a deterministic
   poll is Haiku.
4. Add a **Run discipline** block: do the work, open the PR, exit. No self-check-ins.
5. Register it in `runners.md` **with a prompt file**. Nine runners drifted
   precisely because their prompts lived only inside the trigger, where the
   "repo file is the source of truth" rule silently did not apply.

## The auditor itself

`Routine Auditor — fleet invariants`, `trig_018V66TnhXVAt8BLt5AZZuUa`, Haiku,
Sundays 16:11 UTC. It carries `Claude_Code_Remote` because listing triggers
requires it — as of 2026-08-23 that connector is no longer exclusive to this
routine (see above), but the Auditor's own operating limits are unchanged and
still matter regardless: its prompt forbids `create`/`update`/`run` outright
(list and get only), its `allowed_tools` is `Bash, Read, Glob, Grep` (no
Write, no Edit, no Task), and it is the cheapest model in the fleet.

It reports to a single evolving `Routine Audit` issue (label `routine-audit`) —
one comment per run, never a new issue per run, because four consecutive
disconnected watchdog alerts (#947, #1177, #1203, #1224) sat unread for days
precisely because each run minted a fresh issue.

It is instructed to report loudly on its own failure rather than default to
all-clear. **A false all-clear here is worse than no audit**, because this is
the only check that exists for this failure class.

## Known gap

There is no account- or org-level policy that prevents any of this. Enforcement
is per-routine, so each remaining invariant here can only be *maintained*,
never *guaranteed*, by the Auditor's weekly pass. That is exactly why the
auditor exists. As of 2026-08-23, `Claude_Code_Remote` is no longer one of the
things the Auditor checks for — every routine on this account can create new
triggers via the API. A routine whose prompt drifts, gets corrupted, or is
compromised could now spawn arbitrary new scheduled agents undetected until
the fleet-size invariant (#3, ≤35 enabled) trips, or a founder notices.
