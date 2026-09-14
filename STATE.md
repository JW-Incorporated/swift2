# STATE — session working memory

## 2026-09-14 (session: Fable — M5 review, fixes, first Tree Monday cycle)

**Call:** M5 stands (evidence re-read from real runs/PRs, comment on
#4180). Three Codex defects: two fixed (#4292), one filed (#4291).
#4279 fixed (#4289). Tree's Monday run succeeded for the first time ever
after #4293 raised its turn cap (run 34839086659: asks #4296/#4297 filed,
brief delivered, plan PR #4295). Local stash "stale m4-gate-waived
leftovers" holds an obsolete M4-gate edit; drop it if nothing is missing.

**The finding that matters:** GitHub cron drops most scheduled runs on
this repo (#4290): the 5-min chat poll fired 3× in 14 h, hourly watchdog
2× in 11 h, Tree's 10:00Z Monday cron never fired, Marjorie's brief ran
3 h late. Nothing queued → dropped, not delayed. Every "automated"
promise rests on this. Recommendation on #4290: a clock service on the
Hermes VM host beside M7's doorbell that `workflow_dispatch`es routines on
time. **Founder decision pending** (Joey, in chat). Until then: if a
routine's slot passes with no run, dispatch it by hand.

**Today's Marjorie brief (12:00Z):** watch it. If the cron drops it,
`gh workflow run routine-marjorie-brief.yml`. Its "From Tree" line must
carry #4296/#4297 — that completes the M4 Monday-cycle proof MR1 checks.

**Next waves (order):** M7 doorbell first (prompt `waves/m7-doorbell.md`;
HA #72–#74 done, install HA to be filed by the build), then M6 live asks
(`waves/m6-live-asks.md`, gated on today's cycle being recorded on
#4180 — Tree half is; Marjorie half is the 12:00Z brief). If Joey says yes
on #4290, fold the clock into M7's spec before starting it.

**Open follow-ups:** #4291 (duplicate reply on lost webhook response),
#4271 (chat authority hardening), #4260 (L1 strict idempotency), #4223
(waits for a real re-dispatch), #4169 (SOCIAL_FREEZE passthrough, before
Tree Wave 5); test files `chat-delivery.test.ts`/`chat-poll.test.ts` over
300 lines (split + MAP row). Founder-only: HA #70 (FB export), #67, #63,
#54, #49, #48, #43.

**Architect invocations:** none this session.

### Local checkout notes

Local vitest cannot use the repo config (Windows EPERM symlink in
`sync-web-react-globalSetup.ts`); `.scratch/vitest.plain.config.mts`
(`include: scripts/**/*.test.ts`) runs the scripts suites fine. CI is
the real gate. Branch-writing agents use worktrees under
`Temp\claude-worktrees\`, never this checkout.
