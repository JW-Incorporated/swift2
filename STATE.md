# STATE — session working memory

## 2026-09-14 (M7 doorbell live proof complete; clock separate)

**Call:** M7's doorbell is live and passed its production proof. The clock is
not implemented; its fresh build brief is
`docs/plans/marjorie-overhaul/waves/m7-clock-v2.md`, with scope tracked on
#4290.

**Landed doorbell work:**
- #4322 preserved the verbatim founder prompt; #4325 added the word guard;
  #4326 set `DOORBELL_LIVE = true`; #4328 corrected the alarm title.
- The independent review of #4320's channel-level, concise replies was clean.
- Reviews: #4325 R2 clean, #4326 R2 clean, #4328 R1 clean. No third round.
- The host service is active, all verifier processes are stopped, and the
  installed checkout remains pinned to `doorbell-v1`.

**Live proof:**
- Full evidence: https://github.com/JW-Incorporated/swift2/issues/4180#issuecomment-5668808609
- Tree: 67 words; reply-bot ✅ check 86.608 s; 👀 pickup ≤2.343744 s; run
  34876298473.
- Marjorie: 74 words; reply-bot ✅ check 127.576 s; 👀 pickup ≤1.954189 s;
  run 34876301348.
- No threads, duplicates, or replies from the old Hermes Tree identity.
- Stopped-service message 1549123731408945283 at 18:24:38.895Z. After age
  reached 60 s and cron had not run, manual fallback run 34880770758 dispatched
  `bot-chat-poll.yml`. This proves the fallback path, not cron reliability.
- Alarm run 34880797025 opened #4329; Discord alarm
  1549124270041464832 appeared at 18:26:47.315Z with canonical issue title
  `Doorbell is not answering` verified literally.
  Chat run 34880799699 succeeded: 64 words, reply-bot ✅ check 206.064 s.
- Final restart 18:29:34Z; message 1549125883468587179 at 18:33:11.986Z;
  👀 ≤0.618 s; run 34881495722 succeeded; reply 1549126305558302806 at
  18:34:52.620Z, 59 words, no new thread; reply-bot ✅ check 18:35:14.626Z,
  bound 122.640 s.
- Reaction timings are upper bounds, not exact event times. The host-only
  verifier loads protected credentials internally as the service user, prints
  metadata only, and retries transient network 503s. No token values recorded.

**Verification:**
- 145 focused tests with the flag on; final 21 assertion tests; later 39 alarm
  and workflow tests. Full CI was the gate.
- Lint: 0 errors, 5 existing warnings.
- Local typecheck cannot resolve shared React Native/Expo dependencies.

**Closeout state:**
- HA #75 remains open on `main`; its closure PR #4330 has auto-merge enabled.
  Do not call it merged until its state says so.
- #4319 is closed. Test alerts #4327 and #4329 are closed and recovered.

**Next:**
1. Leave merge-pending HA #75 closure PR #4330 and the final-docs PR on
   auto-merge, then hand off to the architect.
2. Keep clock work in a separate session using `waves/m7-clock-v2.md` and the
   current ruling on #4290.

**Architect invocations:**
- 2026-09-14 ~07:35 PDT, mandatory M7 clock debug-ladder rung 3 after two
  Codex rounds and a fresh-context redesign. Ruling: fail closed, use
  process-start gating, add `WatchdogSec`, scope A, and rebuild fresh with a
  Codex design review before code.

### Local checkout notes

Branch worktrees live under `C:/Users/Fourtys/.codex/worktrees/`. Local vitest
uses junctioned `node_modules` plus a plain config copied from
`Temp/claude-worktrees/scratch-vitest.config.ts` because the repo config hits a
Windows symlink EPERM.
