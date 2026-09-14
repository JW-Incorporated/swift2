# DEBUG — M7 clock v2 rejected at final review

2026-09-14. Branch `feature/m7-clock-v2`; reviewed head `be763fcc` against
main `55d50700`. **No PR opened, no tag created, no host update, no live clock
proof.** CLOCK_LIVE remains false. The installed doorbell-v1 is unchanged.

## Stop condition

The user allows exactly two fresh read-only Codex reviews and requires a
round-2 rejection to stop with this file. Both used gpt-5.6-sol with xhigh
reasoning. The user subsequently instructed continuation. A fresh-context
debug implementation pass fixed both findings below; it was not a review.
The original prohibition on a third review still requires an explicit
exception before a new independent review or PR can proceed.

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

## Fresh-context resolution — 2026-09-14

Both round-2 hypotheses were confirmed and fixed without an architecture
change or a third review.

1. **Clock lifecycle — confirmed and resolved.** The healthy branch in
   `watchClock` returned before looking for the exact standing issue, so no
   recovery transition existed. The poll now compares the shared coverage
   verdict with the exact open `Clock is not firing` issue and dispatches the
   existing `clock-silent` alarm only when those states disagree. That alarm
   re-reads the same verdict under its existing per-stage concurrency and
   emits an `open` or `close` action; its existing `ops` job applies the
   transition through `upsert-alert.sh`. Close does not start an unnecessary
   ops routine. The lifecycle test proves failure → alert/open/notification →
   standing deduplication → healthy → exact-title close → later failure → a
   second open/notification. `CLOCK_LIVE` remains false, and any qualifying
   main poll run still serves its slot.
2. **Forced brief rerun — confirmed and resolved.** `briefDecision` evaluated
   the manual-force exception before `attempt`, allowing a preserved force
   input on attempt 2 to proceed. The attempt-1 gate now runs before force.
   Tests prove a forced attempt-2 guard exits as `rerun` without any API read,
   while a new main `workflow_dispatch` with boolean force on attempt 1 still
   proceeds without history reads.

Verification after the fixes:

- Focused lifecycle/guard/alarm/workflow tests: 55/55 passed across 4 files.
- Complete M7 test set: 185/185 passed across 16 files.
- ESLint: 0 errors, 5 pre-existing unrelated warnings.
- The broad scratch script run executed 3,021 tests: 3,009 passed, 1 skipped,
  and 11 unrelated tests failed; one additional suite could not load. The
  failures came from missing generated/shared dependencies, an unavailable
  child-process `npx`, and pre-existing CRLF-sensitive merch workflow
  assertions. Those are outside this two-defect handoff and were not changed.

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
  workflow concurrency. The rejected mechanisms were subsequently corrected
  by the fresh-context debug pass documented above.
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

## Approved extra review and architect ruling ? 2026-09-14

Joey explicitly approved one extra fresh read-only Codex review. It reviewed
59ec465c..e1941ff3 and rejected one HIGH: a job-specific rerun of agent or
delivery can use cached guard outputs and bypass the attempt check. It
accepted the clock incident recovery correction. No further review has run.

Fable was invoked read-only through the Claude CLI for this design fork.
Its ruling: narrow the amendment to the original first-job guard contract.
The original brief addresses new clock/cron run starts; it does not require
protection against operator-triggered partial job reruns. That existing
behavior is unchanged from main. Whole-run reruns that execute the guard
remain blocked, including forced runs. Do not add gates to the shared
routine template, duplicate it, or change delivery or L1 code.

The spec and ops text now state this boundary explicitly. Job-specific
rerun delivery idempotency is a possible separate follow-up, not a completed
capability or an addition to this wave. The PR description must disclose it.
The architect ruling resolves the contract mismatch; it does not convert
the Codex REJECT into a clean review. The approved extra review is exhausted.
A further explicit review exception is required before a new Codex pass.

Evidence: gitignored .scratch/clock-exception-review.txt and
.scratch/fable-clock-ruling.txt. Fable produced its complete ruling, although
the CLI exited 1 after warnings about pre-existing permission-rule syntax;
no settings were changed and no denied file operation was attempted.

## Second explicitly approved extra review ? 2026-09-14

Joey authorized another fresh read-only Codex review. gpt-5.6-sol at xhigh
reviewed the full merge-base diff at c0280d2f against origin/main f22afe7d.
Verdict: REJECT. No implementation changes or further review followed.

Reported findings (require fresh-context validation before implementation):

1. HIGH: brief-guard.mjs:65 filters issue history since current UTC midnight.
   At 01:00Z a prior-UTC-day delivered issue can share the current Los Angeles
   date but be excluded by that API filter. Suggested fix: cover the LA day
   in the query and retain local UTC-day/exact-LA-title filtering; test the
   midnight boundary. Confirm this against the original UTC-day contract.
2. MEDIUM: queued clock-silent runs recheck coverage but not exact open-issue
   state under concurrency. Search-backed upsert can miss the preceding
   issue before indexing and post a duplicate. Suggested fix: recheck the
   paginated exact-title REST issue state inside the serialized alarm before
   emitting open/close; test queued duplicates.
3. MEDIUM: clock.mjs tick finally always reports progress, and loop suppresses
   unexpected rejections. Persistent programming errors can keep feeding
   the watchdog while preventing clock work. Suggested fix: distinguish
   handled request failures from unexpected exceptions; do not acknowledge
   the latter. Test injected unexpected failure without progress heartbeat.
4. LOW: chat-poll.mjs now has 301 lines, exceeding the repository's under-300
   rule. Suggested fix: extract a cohesive wrapper/invocation if warranted.

The reviewer accepted Fable's narrowed rerun contract as matching the
original brief. It confirmed the two rows, unchanged schedule triggers,
any-main-run slot semantics, and no textual integration conflicts with
fresh main. Read-only syntax checks, schedule JSON parsing and diff checks
passed. It did not run write-requiring tests or lint. Existing 185 passing
focused tests do not cover the three newly reported failure paths.

Full local result: .scratch/clock-final-extra-review.txt. This exception is
exhausted. No PR, tag, HA, activation, or live clock proof has been made.
Stop checkpoint; do not claim a clean review or start another review without
an explicit new exception.

## Fresh-context fixes after second extra review ? 2026-09-14

After Joey requested completion, three bounded fresh gpt-5.6-sol debug
implementation passes verified the reported mechanisms. These were fixes,
not additional independent reviews. All four findings are addressed:

- Brief marker: a regression reproduced the 01:00Z exclusion. Query from
  UTC midnight of the current LA date, deliberately before LA midnight;
  retain the existing UTC-creation-day/exact-LA-title local filter. Boundary,
  unrelated older issue and pagination-cap cases pass. No new daily policy.
- Queued alarm: a regression first observed the second open action. Both
  poll and alarm now share paginated exact-title REST issue lookup. Under
  existing workflow concurrency, the alarm emits a transition only when
  coverage and issue state differ. Unreadable state fails closed; the check
  job explicitly gains issues:read. Tests cover second queued alarm, issue
  pagination, recovery/later incident, disabled flag and dry-run preview.
- Watchdog: a regression reproduced unexpected errors reporting progress.
  Unexpected tick errors now latch the clock off and suppress subsequent
  ticks/heartbeats until restart, with fixed sanitized log text. Handled
  network failures and ordinary disabled ticks still report progress.
- chat-poll is 299 lines after removing two empty comment separator lines;
  no behavior change and no unnecessary module extraction.

Root verification: 191/191 focused tests across 16 files passed. Repository
lint: 0 errors, 5 existing unrelated warnings. Diff whitespace check passes.
Spec and ops now describe these corrected mechanisms. Full CI remains the
merge gate; these results do not replace an independent review verdict.

No further review has run. The prior explicit review exceptions are used.
A new exception or revised review policy is needed to review this corrected
implementation before a PR. No PR/tag/HA/activation/live proof yet.

## Clean independent review - 2026-09-14

Joey explicitly replaced the exhausted cap with permission to fix and
independently re-review until clean for this branch. A fresh read-only
Codex gpt-5.6-sol xhigh pass reviewed 55d50700...4d035db4, including the
latest fixes, against origin/main f22afe7d. Verdict: ACCEPT, no findings.

Confirmed the LA marker boundary, serialized exact REST issue-state check,
fatal watchdog latch, 299-line poll, two pinned empty-input rows, any-main-run
coverage, Fable rerun boundary, authority constraints and preserved schedules.
Read-only runtime syntax, schedule validation, whitespace and merge-tree
checks passed. The reviewer inspected tests but did not run write-requiring
Vitest/lint; root's 191 passing tests and zero-error lint remain the execution
evidence. Result: .scratch/clock-review-until-clean-1.txt (gitignored).

Implementation is ready for PR/CI with CLOCK_LIVE=false. This acceptance is
not deployment or live-proof evidence. Host update HA, activation and both
proof halves remain required before M7 is complete.
