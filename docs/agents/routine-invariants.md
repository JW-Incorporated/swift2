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

## Additional checks (T-9, 2026-08-31 — `docs/TIER2-OPTIMIZATION.md` § B5)

Two cheap drift/retirement checks, run in the same weekly Haiku session
alongside the invariants above — same tools (`Bash, Read, Glob, Grep`),
same list/get-only limits, no new capability:

| # | Check | Why |
|---|---|---|
| 5 | **Every enabled live trigger appears as a row in `runners.md`'s live-trigger table, and its registered name appears somewhere in `AUTOMATION.md`.** Flag any enabled trigger missing from either file. | This is the exact drift class that left nine runners unregistered (Answerer, Lex, Rumor Desk, Stylist, Cross-Link builder, Audio Curator, Mood Chat builder, Photo Enrichment worker, News Triage — see `runners.md` § "Nine runners are unregistered here") — prompts living only inline in the trigger, where "the repo file is the source of truth" silently stopped applying. |
| 6 | **Flag any routine past a recorded retirement condition.** The live example: `swift2 Getty purge — GitHub GC watch` is a self-retiring one-shot (`runners.md`); once its retirement condition (recorded in the trigger's own charter / `runners.md`'s note) is met, it should be disabled or deleted, not left running past its purpose. | A retirement condition that nobody re-checks is exactly the "undocumented live routine" gap this auditor exists to close, just pointed at the other end of a routine's life instead of its start. |

Check 5 is a straight diff: list enabled triggers via the Auditor's existing
`Claude_Code_Remote` list call, then `Grep` for each trigger's name/ID across
`docs/agents/runners.md` and `docs/AUTOMATION.md`. Check 6 is a `Grep` for
routines whose `runners.md` note names a retirement condition, followed by a
read of whatever state that condition depends on (e.g. the Getty purge issue
history). Both report through the same single evolving `Routine Audit` issue
comment as the four invariants above — never a new issue per run.

## Auditor arithmetic (T-17, 2026-08-31 — `docs/TIER2-OPTIMIZATION.md` § T-17)

The Auditor's weekly issue comment now also states two numbers it already has
the data for (it lists every trigger to check the invariants above — this is
arithmetic on that same list, not a new capability or API call):

- **Enabled trigger count** (out of the fleet total), so invariant #3's
  ≤35 ceiling has a number attached in the comment itself, not just a
  pass/fail.
- **Per-routine cadence sum** — for each enabled trigger, its scheduled runs
  per week from its cron expression, summed across the fleet. This is what
  turns the next Tier-2 optimization pass into a diff against a comment
  history instead of a fresh hand-count (the exact problem `docs/audits/`'s
  monthly fleet-telemetry snapshot — T-17's other half, see
  [`fleet-telemetry-snapshot.mjs`](../../scripts/fleet-telemetry-snapshot.mjs)
  — solves at the Actions-workflow layer; this is the equivalent for the
  Claude Code routine fleet, which that snapshot cannot see).

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
