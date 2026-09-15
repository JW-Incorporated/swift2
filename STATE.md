# STATE - session working memory

## Next

1. M7 still needs a successful on-time noon brief and later native-cron guard
   suppression. Read-only Windows task `Codex-M7-Noon-Proof-20260916` targets
   2026-09-16T12:00Z, deadline 13:00Z, with logon recovery. Evidence:
   Hermes/.codex-noon-proof-20260916. Manual recovery does not prove noon.
   Late restarts perform one historical read bounded to the deadline and
   retain matching-target prior evidence on transient API failure.
   GitHub delivery markers are checked; direct Discord duplicate/timestamp
   evidence remains a stated limitation. Keep #4290/M7 open until verified.
2. Clock drift fix #4377 is deployed as `doorbell-v3` (`7c89af5b`) on hermes
   since 2026-09-15T14:44:01Z: clean checkout, active/running, no restarts.
   It reuses a fresh coverage GET through a bounded physical-gap wait,
   preventing request latency from accumulating each five-minute interval.
   62 tests include 240 slots over 20 hours. The fresh v3 hour proof PASSED:
   twelve owner dispatches at 14:45-15:40Z, all 6-7 seconds late, no duplicate
   clock dispatches. One later native schedule overlapped 15:00 and is recorded
   separately. Independent GH snapshot and collector final at 15:43:32Z agree.
   Run IDs: https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5683283421
   Local metadata: Hermes/.codex-clock-proof-v3/FINAL.json.
3. Content intake recovery #4369 is merged: executable news prompt plus a
   mandatory current-attempt receipt on #502, so silent no-work runs fail.
   Actual run 34982116650 filed #4373/#4374, then exhausted its test budget
   before writing a receipt; the new gate correctly failed. Do not backfill
   a fake successful receipt. Recovered #4373 shipped in #4376; content-publish
   34984433082 passed. Public bundle 12c867b202787e8fd9a5ff6c04a07c3c2a07771efccfcece462021e7bf273ce8
   contains the Emmys item, verified in Chrome with loaded image and sources.
   Aggregate bundle schema/consumer fix #4375 passed required Linux CI and
   merged; 103 targeted tests and full workspace typecheck also passed.
   Vault prompt clarification #4381 merged at b1306477: unavailable database access
   must be reported without stranding independent GitHub intake. This is
   configuration hardening, not a proved cause of the old no-op runs.
   Automatic production is now verified: scheduled News Triage 35011979259
   passed both execution and receipt checks, recording 69 stories reviewed and
   five new intakes in #502 comment 5686673938. Scheduled Vault 35014985620
   authored #4389/#4390 in PR #4394, merged f45fb103 at 20:02:24Z. The run
   explicitly reported current-tier unavailable and continued intake without
   processing those rows. Content-publish 35017198082 succeeded; public bundle
   fc639dda682719203a2355705745ea24f2fe2b16e9a3ba3ae669f7adabde058c
   contains both new items. No additional manual paid run was dispatched.
4. GitHub OAuth is restored (probe 34978823809); HA #77 closed via #4363.
   No credentials were read or rotated. All paid Claude tests are STOPPED:
   reported total $2.6860135 against the owner's $3 cap. Ledger remains in
   m7-m8-weekly-limit/.scratch/claude-test-budget.json. Budget settings can
   overshoot after a request; preserve the remaining margin. Existing scheduled
   production has separate spend: Vault 35014985620 reported $8.928525; this
   was its regular schedule, not another recovery-test dispatch.
5. M8 implementation and repeated-sweep integration proof #4365 are merged.
   99 integration/focused tests include synthetic 49/97-hour nudge/HA/defer/
   held behavior, permitted by the spec. Real intake triage 34980285130
   passed, filing ready-shaped #4364 from #4358. Joey's real Discord approval
   was relayed exactly once by successful chat run 35021076114:
   https://github.com/JW-Incorporated/swift2/issues/4364#issuecomment-5687793264
   The approval comment was created at 2026-09-15T20:41:37Z. Kevin's next
   daily-desk/S3 triage is scheduled for September 16 at 15:13Z; the separate
   01:23/13:23 radar is not that triage. Ready/greenlit and any eligible
   Austin claim remain unverified. Do not manufacture those events.
   Read-only Windows task `Codex-M8-Proof-20260916` is Running/IgnoreNew,
   collecting the September 16 15:13-18:00Z window with logon recovery.
   Local evidence: Hermes/.codex-m8-proof-20260916. It verifies the unique
   canonical approval, a successful scheduled Kevin run and its newest
   bot-authored anchored ready/greenlit bucket; mere mentions do not count.
   Eleven mocked tests passed. It neither dispatches Claude nor writes to
   GitHub; inspect its proof before marking the milestone complete.
6. Deterministic brief recovery is #4372, with explicit recovery journal.
   Delivery-only workflow #4371 uses no Claude. Instrumented run 34984846152
   failed with HTTP 429, zero of two chunks delivered, no delivery marker.
   Bounded Retry-After fix #4379 merged at c09d3f78 (33 focused tests;
   full lint passes; 6,490 full-suite tests pass, two unrelated Windows
   command-launch failures). Delivery-only recovery 34986793019 PASSED: Discord delivered at
   15:12:02Z, first message 1549437645908869251, persisted marker on #4372
   comment 5682743990. Chrome verified both chunks and one recovered brief
   in the loaded window. No further delivery retry is needed. Both brief
   workflows omitted the existing email fallback variable/secret bindings;
   fix #4380 merged at b2b1b162 after required CI passed. Email itself is
   not live-tested.
   Diagnose/recover using numeric metadata only. No credential defect is established by a 429.
7. The owner delegated all technically reversible decisions and pushes while
   away. Preserve generated local outputs. Windows full suite on the loader
   fix: 6,452 passed, nine unrelated portability failures tracked #4358/#4364;
   required Linux CI passed. Live homepage, Threads, Mood and Clownbot checks
   passed with no console errors. Prefer Spark for suitable bounded work when
   available. This session's agent selector omits it; a ChatGPT-authenticated
   CLI attempt with gpt-5.3-codex-spark was rejected as unsupported before any
   review ran. Astra/Sol/Luna remain the usable delegation routes here.

## Media recovery - 2026-09-15

The media rule is now a publication invariant, not only a prompt instruction.
PR #4398 (34c3550c) merged after independent review and required CI;
content-publish 35023269788 succeeded on that exact commit. The shared raw
moment guard runs in both content validation and writeBundle before output
or current-pointer writes. Missing, empty, placeholder, and malformed media
are rejected. Source links alone do not count. The routine charter's text-only
exception was removed and the post-publication checker uses the same predicate.
Source relevance still requires editorial and visual review.

PR #4396 repaired the latest CMA and insect posts with the actual Instagram
Story and UC Riverside insect photograph. Both sources, image contents and
credits were checked. PR #4397 repaired slug-based deep links; desktop and
mobile fresh loads opened the correct article. The ten Showgirl historical
gaps were repaired in #4399 (641a62e4), removing their exact legacy exemptions.
Twenty more historical gaps were repaired in #4400 (bcf8c86c). Its exact-commit
content-publish run 35026076081 succeeded, including the Storage mirror.
The final eighteen TTPD repairs merged in #4402 (0ce572f6), after all images
were independently reviewed and incorrect captions, credits, an event date,
and a broken URL corrected. The raw publication gate passes with zero
historical exemptions. The original inventory's 761 rows included one
non-published example; all 760 publishable moments are covered.
The real builder, 164 focused tests, TypeScript, lint, and required CI passed.
Amsterdam's old generated ID resolves to its corrected July 5 record.
Production content-publish 35028588168 succeeded at 22:00:06Z; Vercel
deployment 6JcFFhPvc9g12nViJgFTs7vmHBRm succeeded at 22:00:18Z.
The public bundle is 4fa01086d459000acc5d24e4d73089f6e6b19dd3f1d661bd75e645e61fe8419f.
A fresh audit verified all twelve era-file hashes and found zero missing-media
moments among all 760 published moments. Live browser checks confirmed the
old Amsterdam link and its corrected photo; Torrisi's actual 2048x1152 photo
loaded on a 390px mobile viewport without horizontal overflow.
Migration history: docs/content/historical-media-migration-2026-09-15.md.
Do not add exemptions to bypass the media requirement.

The September 14 Emmys thumbnail is a separate layout defect: its valid
1280px photo was reduced to a 40px icon by the compact card tier. PR #4401
keeps the photo full-width at 16:10 above the short title row, preserving
ranking and image suppression. Astra accepted the diff; 142 focused tests,
TypeScript and targeted lint passed. Root checked the final implementation
in desktop/mobile browsers and opened the correct detail. The fix merged as
07cfd0d6 at 21:31:52Z; Vercel production deployment
HfQUVVp8kgcY1bC1khT6k7hh6Ca6 succeeded at 21:33:12Z. Independent fresh live
checks measured the Emmys photo at 410.4x256.5px on desktop and
341.6x213.5px at a 390x844 viewport, filling the button width at 16:10.
The actual photo loaded, the article opened correctly, and mobile had no
horizontal overflow. Content-publish 35026143357 also succeeded.

## Reboot recovery - 2026-09-15

Diagnostic PR #4351 is merged. It retains only allowlisted error categories
in routine-usage artifacts, never raw execution or provider text. The one
instrumented run 34972013723 confirmed oauth_org_not_allowed (290 ms,
zero tokens/cost). GitHub credential exchange and prompt loading passed.
The owner confirmed exhausted weekly usage, then restored Claude access
and authorized up to $3 in basic testing. No credential defect is established.

M8 ready-shaped filing #4352 is merged and labels are provisioned. A complete
live intake selection found no untriaged submission. The live chase snapshot
contains only #4324 (created 2026-09-14T17:10:48Z), under 48 hours old, with
no linked open PR. Do not manufacture submissions, stale ages or founder
approvals to make live acceptance pass. Approval relay #4354 is merged, including the narrow verified Kevin
receiver amendment under the owner's delegated technical authority.
Chase/brief passed 570 Marjorie tests, lint with zero errors (five existing
warnings), routine invariants, and scoped independent verification of the
final two review findings at d3cbfa44. They share a complete paginated collector, pending HA reservations,
once-per-sweep execution and delivery-aware held notices. Synthetic timing
is covered in tests only; the live milestone remains open.

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
also failed. That historical stop was superseded by the owner's restored-access confirmation and $3 testing authorization above.

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
