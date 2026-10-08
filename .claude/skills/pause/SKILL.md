---
name: pause
description: Session-limit pause/resume protocol — invoke when a usage limit hits or the owner says pause
---

# Pause protocol

Usage limits are a fact of this system, not an emergency. Execute this
COMPLETELY — a partial pause loses work, which is the one unforgivable outcome.

1. **Freeze intake.** Dispatch nothing new. Let sub-second work finish; stop
   long-running agents cleanly and capture, per agent, exactly what it was
   doing, what it completed, and what remains — from its own last report, not
   your guess.

2. **Land the work.** Commit and push everything committable (WIP commits on a
   branch are fine and better than uncommitted trees). Anything that cannot be
   committed gets written down instead.

3. **Write `PAUSE.md`** (repo root, replaces any previous one): per-workstream
   exact position, in-flight-but-unverified steps, agent positions from step 1,
   background processes that may still be running and what to check about them
   on resume, the next 1-3 actions per workstream, and anything time-sensitive
   (data that accrues, expiring state). Assume the resumer has THIS FILE ONLY —
   no memory of the session.

4. **Get the reset time, then schedule the resume.**
   - **Reset time first, from data.** The statusline payload carries
     `rate_limits.five_hour.resets_at` (and `seven_day`), and `statusline.sh`
     renders it as `lim N% ->HH:MM`. Read it from there. Ask me for the reset
     time only if that field is absent or null — asking is legitimate, but
     asking for something already on screen is not.
   - **Then schedule**, a few minutes after the reset, using the session's own
     scheduling facility if one exists. In Claude Code that is a session-local
     one-shot job (e.g. the `/loop` or `schedule` skill). Session-local means it
     dies with the app. Do not reach for an OS-level scheduler.
   - The scheduled prompt is: read `PAUSE.md`, verify what actually survived
     (agents may have died mid-task; trust the repo over the notes), resume each
     workstream, then delete `PAUSE.md`.
   - If no scheduling facility is available, skip straight to step 5 — the
     fallback is the durable path anyway, and never skipping it is the point.

5. **State the fallback** every time, in one line: "Resume scheduled for HH:MM —
   that job is session-local and dies if the app closes. `PAUSE.md` is in the
   repo either way: say 'resume' in any new session and I'll pick up from it."
   The durable mechanism is always PAUSE.md plus the owner typing "resume"; the
   scheduled job is a convenience layered on top, never the thing relied upon.

## On resume

Verify before trusting. An agent stopped mid-write may have left partial work; a
"running" background job may have finished or died. Check the repo state first,
reconcile `PAUSE.md` against reality, then continue — and delete `PAUSE.md` once
each workstream is genuinely picked up.
