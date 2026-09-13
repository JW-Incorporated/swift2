# Human actions — Swift2

<!-- ha-format: 2 -->

> **10 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #69 🔴 [BLOCKING] Grant the Discord bot View Channel + Read Message History on #longlive-marjorie (~5 min)
<!-- ha filed=2026-09-12 -->

**Why:** Marjorie's reply poller (`reply-poll.mjs`) cannot see `#longlive-marjorie` yet, so no founder reply ever relays to the brief issue until the Discord bot gets channel access. The whole M2 reply-relay feature is non-functional without this — the poller silently no-ops on every run.
**Steps:**
1. Discord server settings -> #longlive-marjorie -> Permissions -> find the existing Marjorie/social bot role (the one used for DISCORD_BOT_TOKEN).
2. Grant it "View Channel" and "Read Message History" on #longlive-marjorie.
3. Save.
**Worked if:** A workflow_dispatch run of marjorie-reply-poll.yml, after a founder thread reply, posts it as a comment on the founders-brief issue, not a 403/warning.

## #68 🟢 [UPGRADE] Freeze, merge PR #4202 (social-poster alert reroute), unfreeze (~10 min)
<!-- ha filed=2026-09-12 -->

**Why:** PR #4202 (Marjorie Overhaul C3 follow-up) reroutes social-poster.yml's failure alert through upsert-alert.sh. CI's build-full blocks it while the social posting freeze is off (RULINGS-SOCIAL A6) — routine, matches the #60/#65 precedent, not urgent.
**Steps:**
1. Confirm PR #4202's body shows the Marjorie C3 PR already merged to main — if not yet, wait, this isn't ready.
2. github.com/JW-Incorporated/swift2/settings/variables/actions → SOCIAL_FREEZE → Update → value `true` → Save.
3. On PR #4202, click "Ready for review" (it's a draft), then re-run the failed build-full check.
4. Once green, merge PR #4202 (squash).
5. Unfreeze once the standard post-merge conditions are met (docs/social/RULINGS-SOCIAL-2.md B4) — set SOCIAL_FREEZE back to `false` the same way as step 2.
**Worked if:** PR #4202 is merged to main.

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

**Progress (2026-09-12):** Firebase project `longlive-9d2a9` created and
`google-services.json` wired into the Android build; the server now sends
through the Expo Push API, so no FCM/Apple secret goes on Vercel. Full
detail: `SETUP_NOTIFICATIONS.md` items 2–6.

**Steps:**
1. Upload the FCM V1 service-account JSON to EAS
   (`SETUP_NOTIFICATIONS.md` item 3).
2. Create an APNs key (Apple Developer → Keys, tick APNs) and upload the
   `.p8` + Key ID to EAS (`SETUP_NOTIFICATIONS.md` item 4).
3. Ship a store build of both platforms that includes the
   `google-services.json` change (`docs/mobile-release.md`).
4. On a real phone, accept notifications in onboarding, then run
   `node --env-file=apps/worker/.env scripts/send-test-push.ts <device_id>`.

**Worked if:** a real device receives the push and tapping it opens the
correct deep link in the shell (per OS-004's own "Done when").

## #70 🟡 [DECIDE] Save this week's Facebook group pages and upload them (~30 min)
<!-- ha filed=2026-09-12 -->

**Why:** The fan-signal engine reads what Swifties are actually saying in six
Facebook groups. Facebook has no API for groups you don't run and forbids
automated collection, so this is the one step a person has to do. Nothing has
been exported yet — the watchdog has been flagging it since 2026-09-07
(issue #4009) and two weekly reminders are open (#3911, #3536). Until one
export lands, nobody knows whether the parser works.
**Steps:**
1. In a normal logged-in browser (never a bot), open each group below in turn.
   All six were found by desk research and **nobody has confirmed you are a
   member** — if you are not in one, skip it and say which in your reply:
   - Taylor Swift's Vault → `taylor-swifts-vault`
   - Friendship Bracelet Making and Trading → `friendship-bracelet-making-trading`
   - Swiftie Super Worldwide Friendship Bracelet Trade → `swiftie-super-worldwide-bracelet-trade`
   - Kulto ni TAYLOR SWIFT → `kulto-ni-taylor-swift`
   - Taylor Swift Swifties → `taylor-swift-swifties`
   - Friendship Bracelets Buy/Sell/Trade → `friendship-bracelets-buy-sell-trade`
2. In the group, sort posts by **New activity** (not Top).
3. Scroll down until the posts you can see are older than 7 days. Click
   "See more" on any long post so its full text is on screen. Do not open
   comment threads one by one.
4. Press `Ctrl+S` (Windows) or `Cmd+S` (Mac). In the save dialog choose
   **"Webpage, Complete"**. Name the file exactly
   `fb-<slug>-<YYYY-MM-DD>.html` using the slug from step 1 and today's date —
   for example `fb-taylor-swifts-vault-2026-09-14.html`. Save to Downloads.
5. Repeat steps 2-4 for each group you are a member of.
6. Open a terminal in the project folder and run, exactly:
   `npm run knowledge:fb-upload -- ~/Downloads/fb-*.html`
   It prints one line per file. Each says either `uploaded, local copy
   deleted` or gives a reason and `local copy KEPT`. A kept file was not
   uploaded — re-run that one file by name.
7. Close the open reminder issues #3911 and #3536.
**Worked if:** step 6 ends with `knowledge:fb-upload: N/N uploaded` where N is
the number of groups you saved, and no line says `local copy KEPT`.
