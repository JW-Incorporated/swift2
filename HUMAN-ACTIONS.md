# Human actions — Swift2

<!-- ha-format: 2 -->

> **10 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #58 🟡 [DECIDE] Confirm routine-vault-run holds up under real daily scheduling (~2 min)
<!-- ha filed=2026-09-11 kind=default -->

**Why:** `routine-vault-run` failed 4 consecutive daily runs
(2026-09-06 → 09-10) by exhausting its 80-turn budget ~18 minutes into a
90-minute window. PR #4085 raised the budget to 200 turns and made PR
delivery incremental (opens after Lane 1, so a future turn-exhaustion loses
only later lanes, not everyth

**Steps:**
1. Open the Actions tab for `routine-vault-run` in `JW-Incorporated/swift2`.
2. Confirm it fired on its own schedule (not manually triggered) and

**Worked if:** one un-triggered daily run completes green with real content.
If it fails again, it's a different problem than the one #4085 fixed —
don't assume the same root cause a second time.


---

## #57 🟡 [DECIDE] Stale git worktrees — 259 registered, 73 hidden inside the Projects tree (~30 min)
<!-- ha filed=2026-09-11 kind=default -->

**Why:** a research pass found `git worktree list` returns 259 registered worktrees repo-wide, and `git worktree prune --dry-run` reports 0 prunable — meaning all 259 directories still physically exist on disk. 73 of them live under `.claude/worktrees/` INSIDE `Documents\Claude\Projects\Swift2` itself, hidde

**Steps:**
1. Run `git worktree list` to review what's there.
2. For anything safe to remove, `git worktree remove <path>` per entry (this command refuses if a checkout is dirty, so it fails safe rather than silently discarding work).
3. Once entries are removed, `git worktree prune` to clean the registry.

**Worked if:** `git worktree list` count drops substantially and disk space is reclaimed, with no lost work.


---

## #56 🔴 [BLOCKING] Freeze social posting while the approval gate lands (~2 min)
<!-- ha filed=2026-09-11 -->

**Why:** there is a window between when the approval-gate notifier PR merges and when the full approval-gate enforcement lands where already-merged unapproved drafts could still post on the 30-minute cron. Setting `SOCIAL_FREEZE=true` now (before the social-approval-gate PR merges) prevents any posts from go

**Steps:**
1. In `JW-Incorporated/swift2`, open **Settings → Secrets and variables → Actions → Variables** and verify the `SOCIAL_FREEZE` variable already exists (it should, per item #22 of the audit).
2. Set its value to `true`.
3. Leave it at `true` until Joey has verified the new approval-gate works end-to-end.
4. Once verified, set it back to `false` to resume normal posting.

**Worked if:** the next 30-minute social-poster run logs "SOCIAL_FREEZE is set" and skips posting (confirmed in `social-poster.yml` lines 139–149), and no posts go out while the variable is set.


---

## #55 🔴 [BLOCKING] Confirm #longlive-social is the Discord channel (closes prereq for the social-approval-gate track) (~2 min)
<!-- ha filed=2026-09-11 -->

**Why:** Joey said "Slack #longlive-social", but the only existing webhook in this repo is `DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL`, and `community-mailer.yml` already routes Reddit community prompts through it (confirmed at line 85 of `community-mailer.yml` and used by `scripts/community/discord-delivery.mjs` l

**Steps:**
1. Confirm with Joey: is the social-approval-gate notifier meant to post to the Discord channel that already handles Reddit community prompts (via the existing `DISCORD_SOCIAL_CHANNEL_WEBHOOK_URL` secret
2. If Discord (the existing channel): nothing to do, use the existing secret and we proceed.
3. If Slack: tell Joey that a new `SLACK_SOCIAL_WEBHOOK_URL` secret would need to be added via **Settings → Secrets and variables → Actions → Secrets → New repository secret** (a founder-only action, `gh

**Worked if:** Joey confirms one of the two options, and the build proceeds with the correct webhook target.


---

## #54 🔴 [BLOCKING] Turn on Code Scanning and set CODE_SCANNING_ENABLED (closes P5) (~5 min)
<!-- ha filed=2026-09-11 -->

**Why:** Paul Blart's CodeQL scanning (`codeql.yml`, lines 1–33) is ready to detect security and quality issues, but it only runs when the `CODE_SCANNING_ENABLED` repository variable is set to `true`. Until that flag is set, the workflow skips silently (see line 18 of `codeql.yml`), so no findings are ever c

**Steps:**
1. In `JW-Incorporated/swift2` repo on GitHub, open **Settings → Code security and analysis → Code scanning → Set up → Default** to enable GitHub Advanced Security's Code Scanning for this repo (founder-
2. In the same Settings area, open **Secrets and variables → Actions → Variables → New repository variable**: name it `CODE_SCANNING_ENABLED`, set its value to `true`, and save. (This step requires repo 
3. No code changes needed — `codeql.yml` already checks this variable correctly (line 18: `if: vars.CODE_SCANNING_ENABLED == 'true'`).

**Worked if:** a manually dispatched `codeql.yml` run from the Actions tab shows the **Analyze** job running (not skipped) and Security → Code scanning alerts begin to populate with real findings.


---

## #52 🟢 [UPGRADE] Share flow viewport check on public preview (~2 min)
<!-- ha filed=2026-09-11 -->

**Why:** first-tap sharing depends on the browser/operating-system
share sheet, which automated checks cannot open. The task sandbox retried its
browser harness after the recovery window and has no graphical browser, so it
cannot provide the required mobile and desktop rendered evidence. The deployed
Open Gr

**Steps:**
1. TODO — steps needed

**Worked if:** one screenshot from each viewport shows the rendered page, and
the result is recorded on Kanban task `t_b025b476` as pass/fail.


---

## #51 🔴 [BLOCKING] URGENT — restore the Claude OAuth token secret: every migrated GitHub Actions routine has been inert since the 09-06 migration (~10 min)
<!-- ha filed=2026-09-11 -->

**Why:** despite item #43 being marked DONE ("secret stored &
confirmed"), the `CLAUDE_CODE_OAUTH_TOKEN` repository secret is absent/empty
at run time, so the guard in `.github/workflows/routine-template.yml`
(`if [ -z "secrets.CLAUDE_CODE_OAUTH_TOKEN" ]`) skips **every** migrated
routine with `::warning::CL

**Steps:**
1. Regenerate the token locally with `claude setup-token` on your Claude
2. Store it as the repo secret **`CLAUDE_CODE_OAUTH_TOKEN`** for
3. Confirm it took: the same **Repository secrets** list should show
4. Trigger one routine to verify end-to-end: **Actions → routine-news-triage
5. Have an authorized News Triage run (or a claude.ai session) file the

**Worked if:** a manually-dispatched **routine-news-triage** run reaches the
Claude step and posts a run-log comment (or files an `intake` issue) instead
of skipping with the missing-secret warning.

## #49 🔴 [BLOCKING] Add the shared Community Tasks acknowledgement secret (~5 min)
<!-- ha filed=2026-09-11 -->

**Why:** the daily Community Tasks workflow is otherwise fully
configured and its scheduled runs are healthy, but it safely refuses to send
an email until it can create secure one-click `Posted` and `Skip` links. The
same value must be available to both the GitHub mailer and the Vercel website:
the mailer si

**Steps:**
1. On your own machine, open a terminal and run `openssl rand -hex 32`. Copy
2. In `JW-Incorporated/swift2`, open **Settings → Secrets and variables →
3. In the Vercel project that serves `longlivets.com`, open **Settings →
4. In GitHub, open **Actions → community-mailer → Run workflow**, select

**Worked if:** a manual `daily` run no longer logs
`COMMUNITY_ACK_SECRET unset`, the normal Community Tasks email arrives when
there is at least one drafted lead, and its `Posted`/`Skip` links record the
chosen outc

## #48 🟢 [UPGRADE] Put the website-shell build on the Play internal track now (Android testers still get the Aug 30 native app) (~5 min)
<!-- ha filed=2026-09-11 -->

**Why:** the release train ran for real on 2026-09-08 (EAS run
`01a08457`): iOS build 10 and Android build 7 were both built on EAS from
`main` 0b8ca769 (the native overhaul), iOS was submitted to TestFlight,
and `submit_android` failed because there is no Play service-account key
on EAS (#46). So Android's 

**Steps:**
1. Download the bundle (EAS artifact for build 7, commit 0b8ca769):
2. Play Console → LongLive → **Test and release → Internal testing →
3. **Next → Save and publish** (internal track; no Google review).

**Worked if:** Internal testing shows `1.0.0 (7)` as the latest release
and a tester on the "Jess and Joey" or "Joey" list (both are ticked and
saved — verified 2026-09-07) sees the website inside the app after
upda

## #43 🔴 [BLOCKING] OS-004 — Push credentials on EAS (One Source, Three Surfaces plan) (~15 min)
<!-- ha filed=2026-09-11 -->

**Why:** `docs/specs/2026-09-05-one-source-three-surfaces.md` §6,
card OS-004 (Phase 0). iOS and Android push don't actually deliver yet.
This needs interactive credential upload only you can do — Apple/Google
account access, not code.

**Steps:**
1. Run `eas credentials -p ios` interactively (from a machine with EAS CLI
2. Do the equivalent for Android: upload/generate the FCM v1 service
3. Send one test push via `scripts/send-test-push.ts` to a real TestFlight

**Worked if:** a real device receives the push and tapping it opens the
correct deep link in the shell (per OS-004's own "Done when").
