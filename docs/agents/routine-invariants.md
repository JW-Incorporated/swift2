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
| 2 | **No trigger carries the `Claude_Code_Remote` connector** — except the auditor and the Fleet Reconciler | That connector is the ability to *create triggers*. Removing it is what makes rogue spawning impossible rather than merely forbidden. New routines get it by DEFAULT, which is why this needs checking forever, not once. **Exactly two exceptions, both named below.** A third means something is wrong. |
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

## The auditor itself

`Routine Auditor — fleet invariants`, `trig_018V66TnhXVAt8BLt5AZZuUa`, Haiku,
Sundays 16:11 UTC. It is **deliberately the only routine that still carries
`Claude_Code_Remote`**, because listing triggers requires it — which makes the
auditor the one remaining path to spawning a routine. That risk is accepted and
bounded three ways: its prompt forbids `create`/`update`/`run` outright (list and
get only), its `allowed_tools` is `Bash, Read, Glob, Grep` (no Write, no Edit,
no Task), and it is the cheapest model in the fleet.

It reports to a single evolving `Routine Audit` issue (label `routine-audit`) —
one comment per run, never a new issue per run, because four consecutive
disconnected watchdog alerts (#947, #1177, #1203, #1224) sat unread for days
precisely because each run minted a fresh issue.

It is instructed to report loudly on its own failure rather than default to
all-clear. **A false all-clear here is worse than no audit**, because this is
the only check that exists for this failure class.

## The Fleet Reconciler — the second exception to invariant 2

`Fleet Reconciler — cadence`, prompt in
[`runner-prompts/fleet-reconcile.md`](runner-prompts/fleet-reconcile.md), Sonnet,
daily. It reconciles the live fleet's **cadence and enabled flag** to the table
in [`fleet-schedule.md`](fleet-schedule.md), so the project's non-founder owner
can retune a bot by merging a pull request instead of borrowing the account the
routines bill to.

**The connector is unavoidable.** Updating a trigger goes through
`Claude_Code_Remote`; there is no narrower credential, no read-only variant, and
no scope that grants `update` without also granting `create` and `delete`. So
this routine holds the same connector every other runner had removed on
2026-07-26 — and unlike the auditor, which is forbidden `create`/`update`/`run`
outright, **this one is allowed to write.**

**Say the cost out loud: this widens the attack surface, and not trivially.**
Until now the fleet had exactly one path to spawning a routine — an auditor
whose prompt forbids every mutating verb. There are now two, and the second one
mutates triggers as its actual job. Anything that can make this routine act
outside its prompt — a compromised prompt file, a bad merge, a prompt-injection
payload reaching it through a file it reads — is acting with trigger-write
authority on the account the whole fleet bills to. Prompt text is a soft
control; the only *hard* control on a connector is not attaching it, and here we
attached it. That is a real, permanent increase in blast radius, accepted
deliberately, and it should be re-argued rather than assumed if this routine
ever grows a second responsibility.

The risk is bounded seven ways, none of which is "it promises to be careful":

1. **Two fields.** Only `cron_expression` and `enabled`. Never prompts, models,
   `allowed_tools`, connectors, `sources`, or `environment_id`.
2. **No create, no delete.** Update only — including for a listed trigger that
   has gone missing, which is a report, never a repair.
3. **An allowlist, not a listing.** It works from `fleet-schedule.md` and looks
   ids up. A trigger not in that file may not be touched for any reason. The
   account's non-Swift2 routines are invisible to it by construction.
4. **The file is under CI.** `scripts/check-fleet-schedule.mjs` (blocking in
   `build`) rejects a malformed cron, unknown columns, duplicate ids, an entry
   for the control plane, more enabled entries than invariant 4 allows, and a
   run-frequency budget blowout — per routine and fleet-wide, because invariant
   4 counts *routines*, not *runs*, and the mistake this makes newly possible is
   an unchanged count at a much more expensive cadence. A bad edit fails at the
   pull request, not inside a runner holding a live config.
5. **It cannot touch the control plane** — not itself, and not the auditor
   (`trig_018V66TnhXVAt8BLt5AZZuUa`). Barred in the checker by id *and* by name,
   and restated in its prompt. Disabling the auditor would blind the only
   detection layer that exists, which is the single change that would make every
   other control here unobservable.
6. **Every change is reported**, to one standing `fleet-reconcile` issue, one
   comment per run — including no-op runs, because silence is what let the
   2026-07-25 loops run invisibly. Fleet mutation with no log is the actual
   nightmare; this is the log.
7. **It ships in `report-only`.** The mode lives in the schedule file, defaults
   to reporting differences and changing nothing, and doubles as the kill
   switch: set it back and merge.

Its own writes are still checked by the auditor, which is why the auditor is
untouchable rather than merely "not in the file". The order matters: the
detection layer must not be reachable from the thing being detected.

**Considered and rejected: giving this to Marjorie.** Her charter makes her *"a
curator, not a commander"* who may not edit any charter, **including to expand
her own authority** — bolting fleet mutation onto her is precisely that
expansion, and it would attach trigger-write power to the one agent that already
holds issues, PRs, merge authority and email. A separate routine with two
mutable fields and no other job is a smaller thing to reason about.

## Known gap

There is no account- or org-level policy that prevents any of this. Enforcement
is per-routine, so invariant 2 in particular can only be *maintained*, never
*guaranteed*. That is exactly why the auditor exists.

Two gaps specific to the reconciler, stated rather than hidden:

- **Nothing in the repo can verify what it actually did.** Its report is the
  only record, and it writes its own report. A cross-check would have to come
  from the auditor comparing the live fleet against `fleet-schedule.md`
  independently — worth adding, not built here.
- **The checker cannot see the live fleet.** It validates the file's *shape* and
  its *internal* consistency. A row can be perfectly valid and still point at a
  trigger that was deleted, renamed, or repurposed. That is why the prompt's
  rule is refuse-and-report on any mismatch rather than best-effort matching.
