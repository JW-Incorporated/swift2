# Fleet schedule — the one file that sets when the bots run

**This file is the control panel for the scheduled bots.** Change a row here,
merge it, and the bot's schedule changes by itself. Nobody needs to log into
anyone's Anthropic account.

The bots run on Wyatt's account, so only Wyatt can open them and click things.
That is the problem this file solves: **you edit a table in GitHub, a small
routine reads it and applies the change.** You never touch the account.

---

## How to change a bot's schedule

1. **Open this file on GitHub** and click the pencil (✏️) to edit it.
2. **Find the bot's row** in the table below (the big one under "The schedule").
3. **Change one or both of two cells:**
   - **Cron (UTC)** — when it runs. See the cheat sheet below.
   - **Enabled** — `yes` (it runs) or `no` (it is switched off but not deleted).
   Also update the **Why this cadence** cell so the next person knows the reason.
4. **Propose the change** — GitHub calls this "Commit changes…" → "Create a new
   branch" → "Propose changes". That opens a **pull request** (a proposal).
5. **Wait for the green check.** A robot checks your edit for mistakes
   (bad times, a bot that is not allowed to be listed, too many runs per day).
   If it turns red, click the check to read the message — it says in plain
   English what is wrong.
6. **Merge it.** The change applies on the **next run of the Fleet Reconciler**,
   which is once a day. So: merged in the morning, live by tomorrow morning.

That is the whole loop. No account, no console, no asking Wyatt.

### A worked example

Say Karen (the content-safety scanner) is running once a week and you want her
back to every night. Her row currently reads:

| Karen — content-safety scan | `trig_014HWuRmT2MFveDkPGwVDiQX` | `0 9 * * 0` | yes | … |

`0 9 * * 0` means **09:00 UTC on Sundays only**. You want every day, so you
change that one cell to `0 9 * * *` — same time, every day:

| Karen — content-safety scan | `trig_014HWuRmT2MFveDkPGwVDiQX` | `0 9 * * *` | yes | Nightly — the launch scoreboard promises a nightly safety scan |

Then propose it, get the green check, merge. Tomorrow Karen runs nightly.

To switch a bot **off** instead, change its **Enabled** cell from `yes` to `no`.
Nothing is deleted — the bot stays there, dormant, and flipping it back to `yes`
turns it on again.

### Cron cheat sheet

A cron is five things separated by spaces: **minute, hour, day-of-month, month,
day-of-week**. `*` means "every". Times are **UTC** — that is 7 or 8 hours ahead
of California, so `0 9 * * *` is 1 AM or 2 AM Pacific.

| You want | Write | Runs |
|---|---|---|
| Every day at 09:00 UTC | `0 9 * * *` | 1×/day |
| Twice a day, 17:00 and 23:00 | `0 17,23 * * *` | 2×/day |
| Every 4 hours, on the half hour | `30 */4 * * *` | 6×/day |
| Sundays only, 09:00 | `0 9 * * 0` | 1×/week (0 = Sunday, 1 = Monday …) |
| Mondays only, 10:00 | `0 10 * * 1` | 1×/week |
| Every other day, 14:47 | `47 14 */2 * *` | ~15×/month |

Two rules the checker enforces, so you cannot get them wrong by accident:

- **The first number must be a plain number**, e.g. `0`, `17`, `47`. It can
  never be `*` or `*/5`. That makes "every minute" and "every five minutes"
  impossible to write. The bots cannot run more often than hourly anyway.
- **No bot may run more than 12 times a day**, and **all the bots listed here
  together may not exceed 24 runs a day.** Today they add up to about 6. These
  ceilings are in `scripts/check-fleet-schedule.mjs`; raising one is a code
  change a human has to review, which is the point.

### Two things worth knowing

- **Karen's row is special.** Her cadence backs a launch-readiness promise
  ("the content-safety scan actually runs every night"). If you change it, the
  checker will also ask for a matching one-line edit in
  [`../launch-readiness.md`](../launch-readiness.md), so the scoreboard cannot
  keep claiming something that stopped being true. Ask an agent to make that
  edit in the same pull request — it is deliberate friction, not a bug.
- **If a bot is not in the table, it cannot be changed here.** See below.

---

## What this file is, precisely

This is the **desired state**. A routine called the **Fleet Reconciler** reads
it once a day and makes the live fleet match it. Its prompt is
[`runner-prompts/fleet-reconcile.md`](runner-prompts/fleet-reconcile.md), and
that prompt binds it far more tightly than "please be careful":

- It may change **only** the cron and the enabled flag. Never a prompt, a model,
  a tool list, a connector, or the repo a routine is bound to.
- It may **never create** a routine and **never delete** one.
- It may never touch **itself** or the **Routine Auditor** — those two are the
  control plane, and the auditor is the only thing watching the fleet at all.

### The allowlist rule (the important one)

**A trigger that is not listed in the table below is a trigger the reconciler
may not touch — for any reason.** Not to enable, not to disable, not to retime.

This is what makes the blast radius equal to the table and nothing else. The
live account holds routines that have nothing to do with Swift2 (Foray's, for
one). They are invisible to this system by construction: the reconciler works
from this list, never from a listing of what exists.

Adding a routine to the table is therefore a real grant of authority. It needs:

- a **real trigger id** (`trig_…`), taken from the live routine, and
- that id to already appear in [`runners.md`](runners.md) — a routine you can
  retune must be a routine that is registered and has a prompt file. The checker
  enforces this, so an unregistered routine can never be listed here.

### Mode

<!-- fleet:mode:start -->

`mode: report-only`

<!-- fleet:mode:end -->

- **`report-only`** — the reconciler compares the file to the live fleet and
  reports every difference to its standing issue, but **changes nothing**.
- **`apply`** — it makes the changes.

It ships as `report-only` on purpose. The crons in the table below were
transcribed from [`runners.md`](runners.md), and that file says of itself:
*treat the LIVE list as truth, not this file.* So the first runs must prove the
table matches reality before anything is allowed to write to reality. A founder
flips this to `apply` once one report comes back clean.

It is also the **kill switch**: set it back to `report-only` and merge, and the
reconciler stops changing anything at all while still reporting.

---

## The schedule

Columns, exactly: **Routine · Trigger id · Cron (UTC) · Enabled · Why this
cadence**. Do not add, rename or reorder columns — the checker rejects that,
because a column it does not recognise is a field nothing enforces.

<!-- fleet:schedule:start -->

| Routine | Trigger id | Cron (UTC) | Enabled | Why this cadence |
|---|---|---|---|---|
| Marjorie — morning brief | `trig_01KJLFZpKaFV6jDVshMrHG3E` | `0 12 * * *` | yes | Must post by ~12:40 UTC so the 12:45 mailer puts the brief in founder inboxes by 6:00 AM PT (Joey's requirement) |
| Marjorie — 8 PM delta | `trig_01G4GsUsphyz9LycqKjDEdi4` | `0 3 * * *` | no | Cut 2026-07-25 for sustainment; the morning brief stands alone. Kept as a warm spare — its prompt exists nowhere else |
| The Vault Run — content orchestrator | `trig_01EuLgUdMgbuqL51o3iWQfTL` | `7 16 * * *` | yes | Daily; carries all six content lanes in one session. A missed day is a whole-day content outage, which the 36h watchdog window is tuned to |
| Content Shift ×2 | `trig_01REc9iWzjGmKnoocxCACUV1` | `0 17,23 * * *` | yes | The core content engine and the heaviest runner; twice daily is its floor while the Vault Run's Phase 4 is unfinished |
| Answerer | `trig_01TCMZrg6SXe9Gt1CURY9yyU` | `50 13 * * *` | yes | Once daily, down from every 2h in the 2026-07-25 sustainment pass — the curiosity ledger fills slowly |
| Karen — content-safety scan | `trig_014HWuRmT2MFveDkPGwVDiQX` | `0 9 * * 0` | yes | Weekly since 2026-07-25 (cost). Below what launch gate SCAN claims — see the ⚠️ in launch-readiness.md; restoring `0 9 * * *` is the fix |
| Kevin — S1 Karen solver (cloud) | `trig_01RurBLTvDN3K3oCjpH3SEFd` | `17 11 * * 0` | yes | Weekly, and deliberately after Karen — there are no new tickets to solve until her scan files them |
| Nils — daily walk | `trig_013xb8Stm7m2sB6dqGePKRtr` | `0 14 * * 0` | yes | Throttled to weekly 2026-07-25. A full-site critique run is expensive and its findings outlive a day |
| Stylist | `trig_016RycwuFMr5BAxadu5ft2GG` | `33 16 * * 0` | yes | Weekly; mechanical field-filling with a slow-moving backlog |
| Rumor Desk | `trig_01QqbHr7dyttr7qijGKmCn7n` | `47 14 */2 * *` | yes | Every other day. ⚠️ Read runners.md first: the Vault Run's lane 4 covers the even days, so this lane is effectively DAILY today — the highest privacy-liability lane in the system. Do not raise it |

<!-- fleet:schedule:end -->

### Routines deliberately NOT listed

- **The Routine Auditor** (`trig_018V66TnhXVAt8BLt5AZZuUa`) and the **Fleet
  Reconciler** itself. They are the control plane. Disabling the auditor would
  blind the only detection layer the fleet has, and a reconciler that can retime
  or disable itself is not bounded by anything. The checker refuses both by id
  and by name.
- **Everything on the account that is not Swift2's** (Foray's routines, one-off
  jobs). Not listed means not touchable; that is the whole design.
- **Routines whose live trigger id is not recorded in this repo** — Austin,
  Growth, Tree, Laura, Paul Blart, Kevin S2/S3, and the rest of the registry.
  Their ids were never written down, and inventing one would point the
  reconciler at some other routine entirely. To bring one under this file, a
  founder reads its real id off the live routine and adds the row.

## Why not just let Marjorie do it?

Marjorie is chartered as *"a curator, not a commander"* and may not edit any
charter, **including to expand her own authority** — putting fleet mutation on
her would be exactly that expansion, and it would attach trigger-writing power
to the single agent that already touches issues, PRs, merges and email. This
routine is the opposite shape: one input file, two mutable fields, no create, no
delete, and a report of every change it made.

## Related

- [`runner-prompts/fleet-reconcile.md`](runner-prompts/fleet-reconcile.md) — what the reconciler is allowed to do
- [`routine-invariants.md`](routine-invariants.md) — the five fleet invariants and why the reconciler is an exception to invariant 2
- [`runners.md`](runners.md) — the full registry: who runs where, on whose tokens
- `scripts/check-fleet-schedule.mjs` — the checker that reads this file in CI
