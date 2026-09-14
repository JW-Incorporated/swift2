# STATE — session working memory

## Next

1. STOP: Codex round 2 rejected the build with two High findings. Read
   DEBUG.md and take the fresh-context debug ladder. No third review, PR,
   tag, HA filing, activation or host change from this build.
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
  the rerun guard. Both are recorded in DEBUG.md and remain unfixed.
- Round 2 confirmed the substantive design fixes and accepted any-main-run
  coverage per the user contract. No extra review rounds have run.

Verification:
- 159 focused tests / 15 files passed; includes an hour with request jitter,
  poll-entrypoint watch, shared checkClock verdict, brief guard and workflow.
- Lint most recently 0 errors / 5 existing warnings.
- Local typecheck fails missing generated content and React Native/Expo/shared
  dependencies in this worktree. Full CI is the suite/merge gate.
- No PR, live clock proof, tag or update HA. Allocator returned 76 but no
  number is reserved; allocate again after a valid build. #4290 remains open; M7 is
  not ticked complete. Doorbell evidence remains on #4180:
  https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5668808609

## Architect invocations

2026-09-14 ~07:35 PDT: prior clock debug ladder rung 3. Ruling retained in
DEBUG.md at 1c9e4e4e19d38cafa69bfc7b938167310ccc9033; operative requirements
copied into the v2 spec amendment. Rebuild uses process-start gating,
fail-closed flag refresh, pinned table, rate caps and watchdog.
