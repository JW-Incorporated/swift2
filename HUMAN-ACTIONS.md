# Human actions — Swift2

<!-- ha-format: 2 -->

> **9 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #60 🔴 [BLOCKING] Set SOCIAL_FREEZE=true — Wave 3 PRs blocked by the RULINGS-SOCIAL A6 CI gate (~2 min)
<!-- ha filed=2026-09-11 -->

**Why:** A6 fails CI's `build-full` on any PR touching the live posting path while `SOCIAL_FREEZE` is off. Nearly every Tree Overhaul Wave 3 PR (#4117) touches `social-approval-poll.mjs`/`queue-schema.mjs`, so #4139 is already red on this and more will follow.

**Steps:**
1. `gh variable set SOCIAL_FREEZE --repo JW-Incorporated/swift2 --body true` — freezes live posting; the 4 already-approved 09-12/09-13 scheduled posts will not go out while frozen.
2. Re-run the failed `build-full` job on #4139 (and any later wave-3 PR red on this same check) from its Actions run page.
3. Once every Wave 3 posting-path PR has merged, set it back to `false` deliberately — I'll flag this again when the wave closes.

**Worked if:** #4139's `build-full` check goes green on re-run.

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
1. Open https://www.longlivets.com/ on a real phone (or Chrome DevTools mobile emulation) at a mobile viewport (e.g. 390x844).
2. Tap the Share icon (top-right, next to Search) in the top bar and confirm the OS native share sheet opens with a Long Live title/link.
3. Screenshot the open share sheet on mobile and save it.
4. Open https://www.longlivets.com/ in a desktop browser window (e.g. 1440x900).
5. Click the same Share icon; since desktop browsers usually lack navigator.share, confirm it falls back to copying the link (check clipboard or any on-screen confirmation).
6. Screenshot the desktop result and save it.
7. Post both screenshots as pass/fail evidence on Kanban task t_b025b476.

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
