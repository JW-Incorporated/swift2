# STATE — session working memory

## 2026-09-14 (session: Opus — M7 doorbell build; clock escalated)

**Call:** The doorbell half of M7 is built and merged. The clock is not, and
is being rebuilt from the architect's ruling in a fresh session.

**Merged:**
- #4306: the doorbell program.
- #4308: CodeQL hardening for it.
- #4309: `context` claims with the bot's own 👀; the poll's doorbell watch
  behind `DOORBELL_LIVE = false`.
- #4311: `bot-chat-alarm.yml`, `chat-alarm.mjs`, and `finish` logs `replied in <n>s`.
- #4312: `docs/ops/doorbell.md`, MR2 doorbell check, MR3 key renewal (due 2027-08-13).

**Released and filed:**
- Tag `doorbell-v1` = main at #4312: the doorbell and the stuck timer, no clock.
- Install HA #75, PR #4313 with auto-merge.

**Reviews:**
- #4309 and #4311 each used both Codex rounds.
- The last finding on each was verified by a fresh-context reviewer, not a
  third Codex round.
- #4310 filed: `send-mail.py` SMTP has no timeout.

**Alarm dry runs on main (evidence on #4180):**
- replied message → no alert: run 34855024990;
- unreplied → stuck body: run 34855028314.

**Clock (#4290):**
- Branch `feature/m7-clock` is unmerged. Codex round 2 rejected it (3 High,
  5 Medium).
- Ladder: `DEBUG.md` on that branch → fresh-context redesign → architect
  ruling, all recorded there.
- Rebuild brief: `docs/plans/marjorie-overhaul/waves/m7-clock-v2.md`
  (fresh session).
- **Founder decision pending on #4290:** which routines the clock starts
  first. A = poll, ops, watchdog (recommended); B = plus other
  harmless-if-doubled routines; C = all 55 (rejected).

**Next:**
1. Joey completes HA #75.
2. M7 live proof, doorbell half (`waves/m7-doorbell.md` task 5, minus the
   clock):
   - one message per channel; record 👀 time, run actor, reply time;
   - flip `DOORBELL_LIVE` by PR;
   - fallback proof: service stopped → poll answers and "Doorbell is not
     answering" posts → restart.
3. After Joey answers A/B/C, run `waves/m7-clock-v2.md` in a fresh session.
4. Still open from before: #4291, #4271, #4260, #4223, #4169; HA #70, #67,
   #63, #54, #49, #48, #43.

**Architect invocations:**
- 2026-09-14 ~07:35 PDT, mandatory: debug ladder rung 3 for the M7 clock,
  after two Codex rounds and a fresh-context redesign.
- Ruling: sound with amendments (fail closed, process-start gating instead of
  a ledger file, `WatchdogSec`, scope A), and rebuild in a fresh session with
  a Codex design review before code.

### Local checkout notes

Local vitest cannot use the repo config (Windows EPERM symlink in
`sync-web-react-globalSetup.ts`). In a worktree, junction `node_modules` to
the main checkout's, then run `vitest --config .scratch/vitest.plain.config.mts`
(a copy of `Temp\claude-worktrees\scratch-vitest.config.ts`).

Branch-writing work uses a new worktree per branch under
`Temp\claude-worktrees\`: the guard's session lock blocks branch switches
in shared paths. The guard also text-matches forbidden commands inside
heredoc bodies, so write such prose with the Edit tool.
