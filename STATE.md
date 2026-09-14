# STATE — session working memory

## Next

1. The explicitly approved extra Codex review rejected a partial-job-rerun
   promise added beyond the original brief. Fable ruled to narrow the spec
   to the first-job guard: operator job-specific reruns remain unchanged.
   Spec and ops corrected; implementation unchanged. Obtain an explicit
   further review exception before another independent review or PR.
   DEBUG.md records the finding and ruling. No clean final review yet.
2. After a reviewed implementation is on main, tag doorbell-v2 and file
   the v2 update HA by PR. Stop for Joey's done before activation or proof.
3. Then CLOCK_LIVE=true plus fresh CLOCK_LIVE_SINCE by PR; one-hour poll
   proof and dry-run clock-silent alarm. Noon brief proof is passive; if noon
   is >2h away, put its check first here and stop for the next session.

## M7 clock v2 — 2026-09-14

Branch/worktree: feature/m7-clock-v2 in
C:/Users/Fourtys/.codex/worktrees/m7-clock-v2, based on main 55d50700.
Preconditions verified: HA #75 closed on main, DOORBELL_LIVE=true.
Installed host remains doorbell-v1 and active; no clock deployment yet.

Scope is exactly bot-chat-poll.yml (*/5 * * * *) and
routine-marjorie-brief.yml (0 12 * * *). No schedule removed, no social or
L1 files touched. Main remains trusted executable authority for Actions;
the tag pins host code, dispatch filenames, crons and empty inputs.

Implementation:
- Pinned clock capability; main CLOCK_LIVE=false / CLOCK_LIVE_SINCE=''.
- Serialized flag refresh, off at boot, fail closed at three failures or
  thirty minutes stale. No remote table. Process-start slot gating.
- POST attempted once, GET retries bounded, complete main-run history,
  response Date >= slot, rolling 40/hour and five-minute per-row gap.
- Memory bounded by expiry; backward jumps pause; timing wakes at gap
  boundaries as well as minutes. Metadata-only dispatch logs.
- Shared gap verdict for poll and alarm: any main run serves one slot;
  two misses after grace raise clock-silent. Simultaneous host/cron death
  is detected only when a surviving cron runs.
- Brief workflow concurrency encloses guard through delivery; main-only
  guard, explicit manual force=false default, previous runs/issue-comment
  delivery markers prevent a second ordinary agent run that UTC day.
- WatchdogSec=180 and StartLimitBurst=5 in revised unit. Joey explicitly
  approved unit-copy and daemon-reload before the update HA's restart.

Reviews:
- Round 1: fresh read-only gpt-5.6-sol xhigh, output in gitignored
  .scratch/clock-round1.txt. Initial rejection: guard atomicity, force main
  boundary, trusted-main authority wording, server time, reactivation since,
  any-actor coverage, contradictory old decision wording, interval endpoints.
- Corrected design before code (b325f01b); implementation enforces the fixes.
- Actor-only coverage recommendation conflicts with the explicit brief's
  any-main-run contract. Retained that contract and documented its limitation;
  live proof separately checks the key owner. No scope expansion.
- Round 2: REJECT at be763fcc. Clock alerts lack a recovery path and stale
  issues suppress future notifications; a rerun of a forced brief bypasses
  the rerun guard. Both were subsequently fixed by the fresh-context debug
  implementation pass: serialized alarm closes recovered clock incidents;
  attempt-1 gate precedes force. Lifecycle and rerun regression tests pass.
- Round 2 confirmed the substantive design fixes and accepted any-main-run
  coverage per the user contract.
- One extra review explicitly approved by Joey: REJECT for job-specific
  reruns bypassing the first guard. Fable ruled this was an overbroad added
  spec promise; narrowed to the original contract. No further review run.

Verification:
- 185 focused tests / 16 files passed; includes recovery and a second incident,
  forced-rerun rejection, an hour with request jitter,
  poll-entrypoint watch, shared checkClock verdict, brief guard and workflow.
- Lint most recently 0 errors / 5 existing warnings.
- Local typecheck fails missing generated content and React Native/Expo/shared
  dependencies in this worktree. Full CI is the suite/merge gate.
- Debug agent also ran broad scratch tests: 3,009 passed, 1 skipped, 11 failed
  plus one unloadable suite due to local dependencies/CRLF/child npx. No fixes
  outside scope. Generated web stylesheet has identical normalized blob to
  HEAD and is excluded from the clock commits.
- No PR, live clock proof, tag or update HA. Allocator returned 76 but no
  number is reserved; allocate again after a valid build. #4290 remains open; M7 is
  not ticked complete. Doorbell evidence remains on #4180:
  https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5668808609

## Architect invocations

2026-09-14 ~07:35 PDT: prior clock debug ladder rung 3. Ruling retained in
DEBUG.md at 1c9e4e4e19d38cafa69bfc7b938167310ccc9033; operative requirements
copied into the v2 spec amendment. Rebuild uses process-start gating,
fail-closed flag refresh, pinned table, rate caps and watchdog.

2026-09-14: Fable via fresh read-only Claude CLI, escalation for first-job
rerun scope versus shared-template changes. Ruling: narrow our added rerun
promise to original run-start guard; preserve existing operator partial
reruns. No workflow/template/L1 changes. See DEBUG.md final section.
