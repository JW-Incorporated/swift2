# MR1 — Comms hold under real schedules (+7d after M1)

- **Date run:** 2026-10-01 (due 2026-09-19; this is the 13th verification pass,
  the first twelve could not commit — see Judgment)
- **Verdict:** ADJUST
- **Epic:** #4180
- **Window:** M1 merge (2026-09-12) → 2026-10-01

## Checks

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Every scheduled `routine-marjorie-brief.yml` run since M1 succeeded and each posted one message to `#longlive-marjorie` | **FAIL** | `gh run list --workflow routine-marjorie-brief.yml --limit 25` → 3 non-success runs: `36240546249` (09-26), `35724597868` (09-22), `35218681096` (09-17). Brief issues #4571/#4509/#4419 each carry **0** `discord-message-id` comments (`gh issue view <n> --json comments`); #4620 and #4630 carry exactly 1. 3 of 14 days delivered nothing. |
| 2 | No workflow other than `production-backup.yml` invoked `send-mail.py`; fallback fired only on non-2xx | **PASS** | `grep -rn ALERT_ALSO_MAIL` → the only setter is `production-backup.yml:104`. Only executing call sites of the mailer are `scripts/watchdog/upsert-alert.sh:78` (guarded by `if [ "${ALERT_ALSO_MAIL:-}" = "1" ]` at :75) and `scripts/marjorie/post-or-mail.mjs` (webhook-failure fallback). Every `send-mail.py` hit in `tree-mail.yml`, `watchdog.yml`, `social-poster.yml` is a comment line. `tree-mail.yml` ran 3× in the window (09-14, 09-21, 09-28) and its digest job has **no send step at all** (`.github/workflows/tree-mail.yml:120-157`) — it builds a payload and labels issues; it does not mail. |
| 3 | `watchdog.yml` opened or closed ≥1 alert in the window and the same alert appeared in `#longlive-marjorie` | **PASS** | `gh issue list --label watchdog-alert --state all` → #4616 opened *and* closed 2026-09-29; 8 more opened+closed in the window (#4566, #4557, #4546, #4518, #4498, #4497, #4473 …). In-channel appearance was cited with message ids in the 09-29/09-30 passes on #4180. |
| 4 | `marjorie-inbox.yml` no longer exists on `main` | **PASS** | `ls .github/workflows/marjorie-inbox.yml` → No such file. Deleted in `9b3f6515` ("retire bot email — Discord by default, backup exception preserved", #4201). |
| 5 | The brief's waiting-on-you section lists exactly the open `HUMAN-ACTIONS.md` numbers on the day it ran | **PASS (as of 09-30; instrument now retired)** | Verified 09-30 pass: brief #4630 "Waiting on you (16)" matched `HUMAN-ACTIONS.md` at its own SHA `162d2970` — 16 headings, 16 claimed. **No longer checkable this way**: as of the Bots v2 W4 change there is no brief issue to read (see Judgment). |
| 6 | M4 loop, first real cycle (2026-09-14): Tree's brief lists open `marjorie-filed` under "From Marjorie"; both briefs carry the Tree/Marjorie lines; every ask became an issue with no duplicate | **FAIL** | `gh pr view 4603 --json body` → `[match("From Marjorie";"g")] \| length` = **0**. Same for #4492 and #4295 (verified in prior passes). The section is described at `docs/agents/runner-prompts/tree-weekly-plan.md:133`; no renderer emits it. The ask→issue half *is* healthy: `marjorie-filed` and `tree-filed` both carry real traffic (#4296/#4297 from 09-14 through #4724 today) with no duplicate pair sharing one loop-ask key. |
| 7 | M2 and M3 status per #4180 | **PASS** | PLAN.md gates record M2 done 09-12 (#4216/#4217/#4221/#4224/#4225) and M3 done 09-13 (#4228/#4229/#4237/#4238), each with its caveat stated, not silently closed. Nothing on #4180 since reopens either. |

## Judgment

**The plan is on track; the measurement loop around it is not.** What MR1
actually exists to measure — comms hold — holds. Zero bot email reached a
founder in 19 days, the alert leg works in both directions, `marjorie-inbox.yml`
is gone, and the M2/M3 gates stand. Two items fail, and one of them has now
been reported thirteen times without anyone acting on it.

**Root cause of the thirteen reports: this routine physically cannot commit.**
`plan-recheck-marjorie.yml` declares `contents: write` (line 24), but it calls
reusable `routine-template.yml`, which declares `contents: read` at line **175**.
Reusable-workflow permissions are the *intersection* of caller and callee, so
the callee caps every caller to read-only. Re-confirmed live this run, both
credentials: `git push --dry-run` → `Permission to JW-Incorporated/swift2.git
denied to github-actions[bot]` (403), and the same 403 with `GH_TOKEN`
(claude[bot]) substituted. A checkpoint can only close via a commit, so MR1 has
been verified 13× and flipped `reported` 0×. Tracked on #4462; the watchdog
already noticed (#4557, "plan-recheck-marjorie.yml failed its last 2"). PR
#4637 (merged 09-30) raised this routine's `max_turns` but did not touch the
permission cap. **Smallest fix:** `contents: write` + `pull-requests: write` on
`routine-template.yml`'s workflow-level block. Each caller's own `permissions:`
still caps it, so read-only routines stay read-only.

**FAIL 1 — the brief lost a day on every turn-cap overshoot, and the mechanism
moved.** Runs `35218681096`, `35724597868`, `36240546249` each filed the brief
and *then* blew the turn cap, so `deliver` was skipped by
`routine-marjorie-brief.yml:106` (`needs.run.result == 'success'`) even though
the brief already existed. **New this pass:** as of today the brief issue is
gone entirely — run `36858901268` logs `# Bots v2 W4: no daily brief issue any
more`, and the brief now posts straight to Discord (msg
`1555189754499436657`) with a journal comment on the `status-page` issue
(#4665). Today's 17:44 scheduled run correctly no-opped (`brief guard:
earlier-run`). So the three lost days are real and historical, but the fix must
target the new no-issue path, and **the previous pass's recommended MR2 check
wording — "every `founders-brief` issue in the window carries exactly one
`discord-message-id` comment" — would now fail every single day against an
architecture that deliberately files no brief issue.** Do not adopt it as
written. Corrected wording is in the plan edits below.

**FAIL 2 — the Marjorie→Tree half of the L1 loop still has no renderer.** Fourth
consecutive week with zero "From Marjorie" sections. Tree's 09-28 plan mentions
Marjorie three times in *prose* ("I've asked Marjorie to get it picked up") but
never as a numbered section, so no `marjorie-filed` issue is accountable in the
plan PR. The loop's other half works, which is why this has gone unnoticed.

**On MR1 itself:** a fourteenth identical verification has no information left to
yield. Flip it to `reported` and carry its two failures into MR2 (due
2026-10-03), re-worded for the post-brief-issue architecture.

## Plan edits (exact)

1. `checkpoints.json` → MR1 `"status": "pending"` → `"reported"`.
2. `checkpoints.json` → append to MR2's `checks`:
   - `"Carried from MR1 (re-worded for Bots v2 W4, which retired the brief issue): every scheduled routine-marjorie-brief.yml run in the window reached a Discord post — read each run's deliver log for 'discord-message-id:' (absent is a FAIL, two ids for one day is a FAIL). Do not count comments on founders-brief issues; they no longer exist."`
   - `"Carried from MR1: Tree's weekly plan PR renders a 'From Marjorie' section naming each open marjorie-filed + desk:tree issue by number (prose mentioning Marjorie does not count; #4603, #4492, #4295 all scored 0)"`
   - `"This routine can actually land a PR: routine-template.yml grants contents: write, and the previous checkpoint's rechecks/<id>.md is on main with its status 'reported'"`
   - `"The brief's waiting-on-you list matches open HUMAN-ACTIONS.md numbers as read from the Discord message or the status-issue journal comment, not from a brief issue"`

## Follow-up session prompt

```
Model: Sonnet (three mechanical fixes; the diagnosis is done, no judgment calls)
Branch: fix/marjorie-recheck-perms-and-brief-delivery

Three independent fixes from the MR1 recheck (full report: docs/plans/marjorie-overhaul/rechecks/MR1.md,
comment on #4180). One PR or three; do not interleave with a Marjorie wave.

FIX 1 — the plan-recheck routine cannot commit (blocks the whole checkpoint loop;
13 verified reports, 0 landed).
  File: .github/workflows/routine-template.yml, line 175.
  `permissions: contents: read` caps every caller by intersection, so
  plan-recheck-marjorie.yml's own `contents: write` (line 24) is demoted and its
  `git push` 403s. Change the template's workflow-level block to
  `contents: write` and add `pull-requests: write`. Read-only callers are
  unaffected — each caller's own `permissions:` block still caps it, so any
  routine declaring `contents: read` stays read-only. Fix the stale comment at
  line 180 while you are there; it explains the cap for `id-token` only.
  Verify: `gh workflow run plan-recheck-marjorie.yml -f force=true`, then confirm
  the run opens a PR instead of logging a 403.

FIX 2 — the brief skips delivery on a turn-cap overshoot (3 of 14 days lost:
runs 35218681096, 35724597868, 36240546249).
  File: .github/workflows/routine-marjorie-brief.yml.
  NOTE FIRST: Bots v2 W4 retired the daily brief issue — run 36858901268 logs
  "# Bots v2 W4: no daily brief issue any more" and delivery now goes straight to
  Discord. Read the current deliver job before changing the gate; the old
  "gate on the brief issue existing" advice is obsolete.
  (a) Give the `run` job an explicit `max_turns: 70` (it passes none today and
      inherits the template's 40; the three failed runs finished their work in
      42-44 turns and were still marked failure).
  (b) Line 106: `needs.run.result == 'success'` skips `deliver` whenever (a)
      trips. Gate instead on the agent having produced a deliverable brief body,
      so an overshoot after the work is done still delivers.
  Verify: `gh workflow run routine-marjorie-brief.yml`, then confirm the deliver
  log emits exactly one `discord-message-id:` line.

FIX 3 — Tree's weekly plan PR renders no "From Marjorie" section (4 weeks:
#4295, #4492, #4603 all score 0 matches).
  The prompt describes the section at
  docs/agents/runner-prompts/tree-weekly-plan.md:133 but no renderer emits it.
  Mirror the working "From Tree" path: list
  `gh issue list --label marjorie-filed --label desk:tree --state open` and
  render one line per issue including its number.
  Verify: dispatch the weekly-plan routine and grep the resulting PR body for
  "From Marjorie" plus at least one issue number.

ALSO (if FIX 1 lands first, this is a two-line follow-on): apply the four MR2
check additions and the MR1 status flip listed under "Plan edits (exact)" in
docs/plans/marjorie-overhaul/rechecks/MR1.md. MR2 is due 2026-10-03.

OBSERVATION, not a fix — file it as an issue, do not fix it here:
tree-mail.yml's digest job labels founder-task issues `founder-mailed` and has no
send step, so those issues are marked mailed and skipped by the next sweep while
no mail is ever sent. Per CLAUDE.md #3146 that belongs in a GitHub issue.

HARD RULES (standing, non-negotiable):
- Never discard uncommitted work: no `git restore`, no `git checkout --`, no
  `git reset --hard`, no `git clean`. Use `git stash` if you must set work aside.
- Never run scripts/social/post-queue.mjs or scripts/social/delete-media.mjs.
- Never merge a social-draft PR; never hand-write an `approval` object.
- FIX 1 and FIX 2 touch a shared workflow template and a delivery gate: get a
  Codex review (`codex:rescue --background`, read the result via
  `codex-companion.mjs result <job-id>`) before merging.
- `gh secret` / `gh variable` are founder-only — do not attempt a variable flip
  and do not close a human action that needs one.
- Confirm real CI green before merging; "auto-merge armed" is not "merged".
```

Tier-2: Plan recheck — Tree Overhaul
