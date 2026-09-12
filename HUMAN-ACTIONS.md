# Human actions — Swift2

<!-- ha-format: 2 -->

> **8 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #67 🟢 [UPGRADE] Add DISCORD_MARJORIE_WEBHOOK_URL to the `social` environment too (~5 min)
<!-- ha filed=2026-09-12 -->

**Why:** Marjorie Overhaul C3: social-posters permanent-post-failure alert now routes through upsert-alert.sh, but its post job runs under environment: social, not ops -- the #longlive-marjorie webhook already deposited in ops (HA #66) is invisible there, so this alert falls back to email instead of Discord.

**Steps:**
1. In JW-Incorporated/swift2, open Settings -> Environments -> social -> Environment secrets -> Add secret.
2. Name it DISCORD_MARJORIE_WEBHOOK_URL, value = the same webhook URL already stored on the ops environment (HA #66).
3. Save.

**Worked if:** a forced social-poster.yml permanent-failure run posts to #longlive-marjorie directly, with no [discord failed] email.

## #64 🟡 [DECIDE] X per-post metrics need a paid API tier (~5 min)
<!-- ha filed=2026-09-12 -->

**Why:** Tree Overhaul T3 (per-post engagement): X retired free per-post metric reads; every call is now metered (~$0.005/post-read). Backfilling the current posted X items would run ~$0.45 once, plus pennies/day ongoing. Spend decisions are yours, not built without one.

**Steps:**
1. Check the X Developer Portal → Products → Billing for the current pay-per-use per-post read price (confirm ~$0.005/read still holds).
2. Decide: approve ongoing per-post X metric reads (~$0.45 backfill + pennies/day), or decline and stay Instagram-only (v1 ships either way).

**Worked if:** you reply approved or declined for X per-post metric spend.

## #63 🟢 [UPGRADE] Add instagram_manage_insights scope so reach/saved/shares can be built next (~15 min)
<!-- ha filed=2026-09-12 -->

**Why:** T3 v1 ships Instagram like_count/comments_count only. reach/saved/shares need the instagram_manage_insights scope, which the current IG_ACCESS_TOKEN (instagram_basic, instagram_content_publish, pages_read_engagement, business_management, pages_show_list, pages_manage_posts) doesn't carry.

**Steps:**
1. Meta App Dashboard → App Review → Permissions and Features → add instagram_manage_insights.
2. Regenerate the long-lived Graph API token for the same app/IG account with the new scope included.
3. `gh secret set IG_ACCESS_TOKEN --repo JW-Incorporated/swift2` with the regenerated token.

**Worked if:** a real `GET /{ig-media-id}?fields=reach,saved,shares` call returns values instead of a `(#10)` permission error.

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
