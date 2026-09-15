# STATE - session working memory

## Next

1. Recover the failed 2026-09-15 noon brief. Run 34966350705 started on time
   at 12:00:07Z as sffan15-sys; guard succeeded, routine failed, delivery
   skipped. Controlled forced replacement 34969710921 also failed. Do not
   retry again without a diagnosis; inspect action/provider diagnostics.
   Do not close #4290 or tick M7: the noon delivery proof has not passed.
2. Resume M8 from feature/m8-ready-tickets and feature/m8-approval, preserving
   their saved work. Complete implementation and real live proofs; founder
   actions must come from the founder and cannot be synthesized.

## Reboot recovery - 2026-09-15

The owner authorized autonomous recovery, reversible decisions and pushes.
The linked Long Live Bots Runbook was accessible in Chrome. The workstation
reboot stopped the local noon monitor; its pending state is stale.

Root independently checked run/step metadata at head 2e3e2977: guard job
104371630886 succeeded; run job 104371733549 failed at the AI step; deliver
job 104371933763 was skipped. The prompt file exists in that exact main
tree. Checkout and prompt loading passed. An echoed shell-source error
branch was initially misread as an emitted error; it was not executed.
Claude initialized but returned is_error=true in 267 ms, with empty model
usage and zero cost. Provider error detail was absent. No code defect is
established. One force=true replacement was dispatched: 34969710921; it
also failed. No more replacement runs are authorized by this checkpoint.

Working branch: docs/m7-clock-noon-proof, isolated worktree of the same name.
Read-only recovery evidence: .scratch/noon-recovery-check.json.
M7 evidence investigation uses Luna; M8 recovery uses Sol. Spark is not an
available session model. Prior poll/deployment evidence below is retained.

## M7 clock v2 checkpoint - 2026-09-15 03:55 UTC

Implementation PR #4339 merged at f22adc6a; published doorbell-v2 pins
f22adc6a5653a631b0769bcb3391394043cdbf11. HA #76 update filed in #4341 and
closed with activation PR #4342, merged at bd206023. DOORBELL_LIVE=true;
CLOCK_LIVE=true; CLOCK_LIVE_SINCE=2026-09-15T02:21:13Z on main.

Host verified clean doorbell-v2 at 03:55:10Z, active/running, WatchdogUSec=3min,
NRestarts=0, no unexpected clock failure. StartLimitBurst=5 was verified at
installation. Host update evidence:
https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5673685756

Poll proof: 02:50:00Z-03:50:00Z, 12/12 slots. Every run is main,
workflow_dispatch by sffan15-sys, completed/success, created and started
6-9 seconds after its slot. No gaps, duplicate dispatches, other actors,
late/unmatched runs or cron overlaps. All twelve host POSTs accepted.
Run IDs in slot order:
34922682669, 34923002799, 34923302315, 34923632098, 34923949949, 34924268243,
34924579324, 34924899689, 34925219460, 34925551062, 34925863083, 34926180107.

Alarm dry-run 34926577044 succeeded: check job 104245809348 succeeded,
alert job 104245858485 skipped. Filtered body confirms Clock is not firing,
clock-silent, 10 checked slots, no misses and valid activation timestamp.
Check timestamp 2026-09-15T03:51:47.006Z. Independent evidence review passed.
Poll and alarm evidence with run URLs:
https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5674493098

Validation: 225 focused tests across 18 files passed; simulated PR-base flag
transition passed (3 tests); lint 0 errors, 5 existing unrelated warnings.
Full activation CI 34922095360 and CodeQL 34922095290 passed. Initial CI
34921284222 exposed a delivery-only fixture's implicit clock-off assumption;
fixed with explicit isolation and a deployed-default live-watch test. All
Marjorie test poll call sites audited. No production change for that fix.

Reviews: final full implementation ACCEPT at 4d035db4; activation ACCEPT at
037dac48; CI-fixture fix ACCEPT at 368c7ea2, all fresh read-only gpt-5.6-sol
xhigh. User replaced the original review cap with fix/re-review until clean.
DEBUG.md preserves prior findings, reproductions, fixes and Fable's ruling.

Authority: exactly bot-chat-poll.yml */5 and routine-marjorie-brief.yml at
12:00 UTC, empty inputs; native schedules preserved. Host/table pinned,
main supplies only the operational flag. Any qualifying main run serves a
poll slot. The brief first-job guard covers new starts and whole-run reruns
that execute it; operator partial-job reruns retain existing behavior.

## Evidence and pending monitor

Working evidence/collectors are gitignored under:
C:/Users/Fourtys/.codex/worktrees/m7-clock-activate/.scratch/
- poll-proof-latest.json: complete hour evidence.
- alarm-dry-run-metadata.json: verified safe filtered alarm evidence.
- host-clock-metadata-latest.json: includes tag, commit, dirty=false and health.
- noon-monitor.py: reviewed metadata-only monitor, no synthetic dispatch.
- noon-monitor-status.json: pending until actual noon run and delivery.

Monitor launch PID 7760, interpreter child 36832. It wakes at 12:00:10Z,
checks every 60 seconds until 13:00Z, requires completed runs/metadataPass,
then verifies Discord via GET on Hermes as the service user. Credentials
stay on the host; only metadata is emitted. Result captured_pending_review
requires independent evidence acceptance; it is not automatic completion.
Its orchestration and failure handling passed independent review and
synthetic tests. Do not launch a duplicate monitor.

Noon proof remains pending. #4290 remains open; PLAN.md M7 is not ticked.
Doorbell half remains complete; prior evidence:
https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5668808609
