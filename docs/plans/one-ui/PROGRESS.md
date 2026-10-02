# One UI programme: progress (the PM's memory)

The single source of live state for the PM. Rewrite the **Next actions**
block at every checkpoint; append to the **Log**; never let this file pass
~200 lines (fold old log lines into one summary line per finished phase).

## Next actions (for a fresh PM session)

0. Create the PM worktree (OPERATING-MODE §3) if it's missing.
1. Start WP0.0, WP0.1 and WP0.3 in parallel. All three are independent;
   that's the 3-agent cap.
2. As one of them frees up: WP0.3b, then the WP0.4 researcher audit (the
   native-needs matrix).
3. When WP0.1 merges and its OTA has published: file HA session S1 with
   the `human-actions` skill, pinning the build and update id, and tell
   Joey. The merge freeze starts.

## Status

| WP | State | PR | Notes |
|---|---|---|---|
| 0.0 | queued | | |
| 0.1 | queued | | |
| 0.2 | blocked on S1 | | |
| 0.3 | queued | | |
| 0.3b | queued | | CORS on /content only |
| 0.4 | queued | | native batch; PM signs needs matrix |
| 0.4b | blocked on 0.4 | | minimal watchdog |
| 0.5 | blocked on 0.2/0.3/0.3b/0.4/0.4b | | |
| 0.6 | blocked on 0.5 | | Fable |
| 1.1 | blocked on 0.6 | | |
| 1.2 | blocked on 1.1 | | |
| 2.1–2.14 | blocked on G1 | | |
| G3–G5 | blocked | | |

States: queued · in progress · in review · merged · blocked on <x> · dropped (reason).

## Human-action sessions

| Session | State | HA # | Result |
|---|---|---|---|
| S1 | not filed | | |

## Fable log

| Date | Question | Advice | PM decision |
|---|---|---|---|
| 2026-10-02 | Plan review (pre-kickoff) | Blocker: no CORS on `/content`; watchdog too late; missing native-needs audit; `next/font` breaks parity; PROGRESS landing, kickoff prompt, OTA freeze undefined | All five required edits and the minor notes adopted (WP0.3b, WP0.4b, needs matrix, fonts in WP2.1, OPERATING-MODE §3/§6/§8 kickoff, `[diag]` → one issue, perceptual diff, OTA size budget) |

| 2026-10-02 | Confirmation pass | READY after 3 text edits: stale `[diag]` wording, §8/§9 order, PROGRESS/HUMAN-ACTIONS landing without `--delete-branch` | All applied |

## Decisions log (PM, reversible, one line each)

- 2026-10-02 — Plan calls C1–C6 (`PLAN.md`).

## Log

- 2026-10-02 — Programme planned; awaiting kickoff.
