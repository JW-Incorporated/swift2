# DEBUG — M7 clock v2 rejected at final review

2026-09-14. Branch `feature/m7-clock-v2`; reviewed head `be763fcc` against
main `55d50700`. **No PR opened, no tag created, no host update, no live clock
proof.** CLOCK_LIVE remains false. The installed doorbell-v1 is unchanged.

## Stop condition

The user allows exactly two fresh read-only Codex reviews and requires a
round-2 rejection to stop with this file. Both used gpt-5.6-sol with xhigh
reasoning. No third review is allowed on this build; no fixes were made
after round 2. The next session must use the debug ladder and this evidence.

## Round 2 — REJECT, two High findings

1. **Clock alert lifecycle never recovers.**
   `scripts/marjorie/lib/clock-watch.mjs` returns immediately for healthy
   coverage without closing the standing `Clock is not firing` issue. It
   also returns immediately during a later fault when that issue exists.
   `scripts/marjorie/chat-alarm.mjs` opens alerts but supplies no recovery
   path. An initial transient incident can therefore suppress every later
   notification. Existing ops handling does not establish a clock recovery
   path. The emitted promise that the issue remains open until coverage
   recovers is not implemented.
   Needed design: an explicit owner and mechanism for healthy recovery,
   consistent with shared gap verdict, standing-alert concurrency and the
   existing ops authority. Prove failure -> alert -> healthy -> recovery ->
   second failure -> fresh notification. Do not merely remove deduplication.

2. **A forced run's rerun can post another brief.**
   `scripts/marjorie/lib/brief-guard.mjs` accepts manual force before testing
   run attempt. GitHub reruns preserve dispatch inputs, so a rerun of a
   successful forced run can bypass run-history and delivery-marker checks
   and start another agent/delivery. `brief-guard.test.ts` currently asserts
   that behavior. The spec separately requires reruns to end at the guard.
   Needed design: distinguish a new explicit forced dispatch from rerunning
   an existing forced run; prove the rerun cannot start the agent/delivery.

Round 2 otherwise confirmed the substantive round-1 findings were addressed.
It explicitly accepted retaining any-main-run slot coverage over round 1's
actor-only recommendation, because the user's brief requires it. Do not
reopen the two-row scope or change that contract.

## What is built and verified locally

- Exactly bot-chat-poll.yml every five minutes and routine-marjorie-brief.yml
  at 12:00 UTC, pinned with empty inputs. GitHub schedules remain.
- Host code/table pinned; main is trusted executable authority in Actions
  and supplies only the operational flag to the host. Local capability true,
  operational CLOCK_LIVE false / CLOCK_LIVE_SINCE empty.
- Process-start gating, once-only POST, bounded GET, complete main-run lists,
  server-time check, rolling limits, stale-config fail-closed behavior,
  bounded memory and watchdog progress. A jitter test covers twelve slots.
- Shared poll/alarm gap verdict and a main-only brief first-job guard inside
  workflow concurrency. The two rejected mechanisms above remain unfixed.
- 159 focused tests across 15 files passed before final review. Those tests
  did not expose the lifecycle omission and encoded the wrong force-rerun
  expectation. Passing tests are not evidence these defects are resolved.
- Lint: zero errors / five existing warnings. Local typecheck fails missing
  generated content and shared dependencies; no CI run or merge is claimed.

## Deployment and remaining work

Preconditions were verified on main: HA #75 closed, DOORBELL_LIVE=true.
Joey approved adding the unit-copy and daemon-reload commands to the update
HA before restart. Allocator returned 76, but **no HA was filed**; allocate
again when ready. No doorbell-v2 tag exists from this build.

After a valid fresh build/review outcome, tasks still include implementation
PR/CI, tag, update HA and stop for done, activation PR, one-hour poll proof,
clock-silent dry-run, next-noon brief proof, #4180 evidence and #4290 closure.
If noon is >2 hours away after poll proof, put its check first in STATE Next
and stop. Never tick M7 before both live halves pass.

Local complete review outputs: gitignored `.scratch/clock-round1.txt` and
`.scratch/clock-round2.txt`. Round 1 initial design rejected; corrected in
`b325f01b` before code. Final review examined `be763fcc`. This document is the
durable handoff; those scratch files are supplemental evidence only.
