# STATE — session working memory

## 2026-09-13 (session: Fable — M2/M3 review + repair, M4 readiness)

**Call:** M2 and M3 both stand. Every gate re-checked from real reads
(`gh` issue/run/PR views), not the closeout comments. Repairs below;
nothing structural was wrong.

**Re-verified (M2):** ops routine runs hourly on cron and succeeds
(scheduled runs 34742363728, 34756152901); it handled the new alerts
#4243 (comment-only, correct) and #4192 (diagnosed, no redispatch needed)
and left #4212 (mobile parity) alone — that alert is not one of the 14
handler rows, by design. Reply poller runs on cron and no-ops until HA #69.
**Re-verified (M3):** labels live, triage routine on daily cron 16:27 UTC
(first scheduled run is today), both proof runs succeeded.

**Repaired this session:**
- PR #4222 (HA #70, the FB-export human action the routine filed) was
  green, clean, and unmerged with no auto-merge — the M2 gate "exists on
  `main`" was not actually true. Merged. HA #70 is now on `main`.
- HA #68 closed on evidence (PR #4202 MERGED, `SOCIAL_FREEZE` = false).
- HA #64 and #57: the owner closed them by Discord reply on 09-12, but the
  Hermes poller's PRs #4195/#4196 conflicted and never landed. Folded both
  closes into this session's hygiene PR; those two PRs closed.
- Local `DEBUG.md` (M2's max-turns debug, resolved by #4221) and `PLAN.md`
  (Tree Wave 4, done 09-12) deleted — both stale; earlier STATE notes
  misattributed DEBUG.md to the Tree wave.
- `waves/m4-loop.md` gained a "Carried in from M2/M3" paragraph: the
  `tree-filed` label does not exist live, the cross-job identity trap
  (#4225/#4238), comment truncation (#4230), allowedTools (#4218), the
  App-token dispatch 403 (#4223), turn budgets (#4221).
- #4223 re-diagnosed as a CODE fix, not a founder action: claude-code-action
  mints its own App installation token (OIDC) whenever `github_token` is
  empty, so the caller's `actions: write` never reached the agent's `gh`.
  Fixed in PR #4244 (merged): template input `expose_dispatch_token`
  exposes the job's own token as `GH_DISPATCH_TOKEN`, used only for
  `gh workflow run`; the agent identity stays `claude[bot]` so marker
  recognition is untouched (Codex round 1 caught the identity-swap
  version). Proof run 34758238356 green, env confirmed; no live redispatch
  observed yet because every open alert was already handled today. #4223
  stays open until a real redispatch is seen.

**M4 readiness:** ready on its stated gate — Tree R2 reports 2026-09-21,
then M4 runs on Opus. No M2/M3 defect blocks it. The runbook artifact
(4a82c960) updated with all of the above.

**Open non-blocking follow-ups (unchanged):** #4218, #4219, #4226 (M2);
#4230, #4231, #4232, #4239 (M3); #4204 (doc line); #4131 (watchdog
WATCHED set). Founder-only: HA #69 (bot View Channel — the reply poller is
dead until then), HA #70 (FB export).

### Local checkout notes

Local vitest cannot run (Windows EPERM symlink in
`sync-web-react-globalSetup.ts`); CI is the real gate. Branch-writing
agents use worktrees under `Temp\claude-worktrees\`, never this checkout.
