# STATE — session working memory

## Next

1. Host update completed and verified: doorbell-v2 f22adc6a, service active,
   watchdog 3min, burst 5 at 2026-09-15T02:20:25Z. HA #76 closed in this PR.
   Activation constants are set in this branch; main activation awaits merge.
2. After activation is observed on main/host, prove twelve five-minute poll
   slots (one hour), then dry-run clock-silent alarm. Record metadata on #4180.
3. User explicitly authorized waiting through both live proofs: next brief
   slot is 2026-09-15 12:00 UTC. Verify one delivery and same-day cron guard;
   no premature closure of #4290 or M7 completion before both halves hold.

## M7 clock v2 — 2026-09-14

Branch/worktree: feature/m7-clock-v2 in
C:/Users/Fourtys/.codex/worktrees/m7-clock-v2, based on main 55d50700.
Preconditions verified: HA #75 closed on main, DOORBELL_LIVE=true.
Implementation PR #4339 merged at f22adc6a. doorbell-v2 is pinned to that
merge commit. Host update HA #76 is verified installed and closed in the activation PR.
Current branch: fix/clock-live from origin/main a903e5c1.

Scope is exactly bot-chat-poll.yml (*/5 * * * *) and
routine-marjorie-brief.yml (0 12 * * *). No schedule removed, no social or
L1 files touched. Main remains trusted executable authority for Actions;
the tag pins host code, dispatch filenames, crons and empty inputs.

Implementation:
- Activation branch CLOCK_LIVE=true / CLOCK_LIVE_SINCE=2026-09-15T02:21:13Z.
  Main was still false at the host verification checkpoint.
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
  spec promise; narrowed to the original contract.
- Second explicitly approved extra review: REJECT at c0280d2f against main
  f22afe7d for four new findings listed in DEBUG.md. Rerun narrowing accepted.
  All four findings subsequently fixed by fresh-context debug passes; no
  independent review of those fixes subsequently ACCEPTED with no findings
  at 4d035db4 (full diff against origin/main f22afe7d).

Verification:
- 191 focused tests / 16 files passed; includes UTC-midnight markers, queued
  alarm deduplication, unexpected-error watchdog latch, recovery and a second incident,
  forced-rerun rejection, an hour with request jitter,
  poll-entrypoint watch, shared checkClock verdict, brief guard and workflow.
- Lint most recently 0 errors / 5 existing warnings.
- Local typecheck fails missing generated content and React Native/Expo/shared
  dependencies in this worktree. Full CI is the suite/merge gate.
- Debug agent also ran broad scratch tests: 3,009 passed, 1 skipped, 11 failed
  plus one unloadable suite due to local dependencies/CRLF/child npx. No fixes
  outside scope. Generated web stylesheet has identical normalized blob to
  HEAD and is excluded from the clock commits.
- PRs #4339 and #4341 merged; tag and host update complete. HA #76 closure
  and activation in this branch. Live proof pending; #4290 open, M7 not ticked.
  Doorbell evidence remains on #4180:
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

Proof preparation: gitignored .scratch/clock-proof.mjs collects run metadata
with paginated GET-only GitHub calls; .scratch/clock-proof.smoke.mjs passed.
No live proof run. Next noon is 2026-09-15 12:00 UTC. If over two hours away
after the poll proof, defer its passive check per the user contract.

Activation validation: 200/200 focused tests across 17 files; simulated PR
base transition check 3/3; lint 0 errors, 5 existing warnings. Fresh read-only
Codex gpt-5.6-sol xhigh reviewed 037dac48 against main: ACCEPT, no findings.
Default live-watch test passes; unrelated poll tests explicitly isolate it.
Host evidence: https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5673685756

Activation CI run 34921284222 exposed one more clock-off test fixture in
chat-delivery.test.ts. Its pollWith helper now explicitly isolates the clock;
all Marjorie test poll calls were audited. Expanded local suite: 225/225
across 18 files. No production change in this CI fix; re-review pending.
