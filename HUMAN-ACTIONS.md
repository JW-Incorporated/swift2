# Human actions — Swift2

<!-- ha-format: 2 -->

> **10 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #87 🟡 [DECIDE] Ownership backlog stuck 7+ days — accept it or get it routed (~5 min)
<!-- ha filed=2026-09-30 -->

**Why:** Issue #4546 has flagged the same "abandoned"/"ambiguous" backlog (9 abandoned + 1 ambiguous issue, budget 0) every day since 2026-09-23 with no automated fix — only a policy call can stop the daily alert.
**Steps:**
1. Open github.com/JW-Incorporated/swift2/issues/4546 and read the latest breach list.
2. Decide: raise the budget in `.github/work-ownership-budget.json` to accept the backlog, or ask for the listed issues to be routed/worked.
3. Comment your decision on issue #4546.
**Worked if:** a founder comment on #4546 records either an accepted new budget or a routing decision.

## #86 🔴 [BLOCKING] SOCIAL_POSTER_PAT can't trigger GitHub Actions — Marjorie's routine re-runs 403 (~10 min)
<!-- ha filed=2026-09-29 -->

**Why:** Marjorie re-runs quiet/failing routines using the SOCIAL_POSTER_PAT secret (as GH_DISPATCH_TOKEN). Every gh workflow run 403s: Resource not accessible by personal access token - it lacks Actions write access, so she cannot restart any stuck routine (hit on issue #4575).

**Steps:**
1. Find the GitHub account that owns the SOCIAL_POSTER_PAT token (check Settings -> Developer settings -> Personal access tokens on the account that created it).
2. Open that token. Classic: check the workflow scope box. Fine-grained: set repo access to JW-Incorporated/swift2 with Actions: Read and write. Regenerate.
3. Copy the new token value.
4. Go to github.com/JW-Incorporated/swift2 -> Settings -> Secrets and variables -> Actions -> Secrets -> SOCIAL_POSTER_PAT -> Update, paste, Save.

**Worked if:** the next Marjorie ops sweep that tries to re-dispatch a quiet routine reports success instead of a 403 error.

## #85 🟡 [DECIDE] #4559 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-09-28 -->
<!-- marjorie-chase: 96h issue=4559 -->

**Why:** Marjorie dispatched it on 2026-09-24 (plan-recheck-marjorie.yml: max_turns=40 too low, fails last 2 scheduled runs despite succ…). Nothing has moved since 2026-09-24. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4559 under stalled.

## #82 🔴 [BLOCKING] GH_DISPATCH_TOKEN can't dispatch workflows (~10 min)
<!-- ha filed=2026-09-22 -->

**Why:** Marjorie's hourly watchdog-ops sweep uses the `GH_DISPATCH_TOKEN` secret to re-dispatch quiet or failing scheduled workflows (7 of the 14 alert types rely on it). Re-dispatching `plan-recheck.yml` today failed with HTTP 403 "Resource not accessible by personal access token" — the token can't trigger a workflow run at all, so every re-dispatch action in that sweep is currently a no-op.

**Steps:**
1. Open the repo's Settings → Secrets and variables → Actions and find the token behind the `GH_DISPATCH_TOKEN` secret.
2. If it's a fine-grained token, give it "Actions: Read and write" permission for this repo; if it's a classic token, give it the `workflow` scope.
3. Save the updated token as the `GH_DISPATCH_TOKEN` secret value.

**Worked if:** the next hourly Marjorie ops sweep can run `gh workflow run` without a 403 (visible in that run's log).

## #80 🟡 [DECIDE] #4364 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-09-19 -->
<!-- marjorie-chase: 96h issue=4364 -->

**Why:** Marjorie dispatched it on 2026-09-15 (Windows full-suite validation fails on checkout line endings and command resolution). Nothing has moved since 2026-09-15. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4364 under stalled.

## #79 🟡 [DECIDE] #4324 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-09-18 -->
<!-- marjorie-chase: 96h issue=4324 -->

**Why:** Marjorie dispatched it on 2026-09-14 (Definition of Done #5 — one full-site link sweep, then widen the nightly to shop/product …). Nothing has moved since 2026-09-14. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4324 under stalled.

## #78 🔴 [BLOCKING] Add Actions read/write to SOCIAL_POSTER_PAT (~5 min)
<!-- ha filed=2026-09-16 -->

**Why:** SOCIAL_POSTER_PAT (fine-grained, repo-scoped, currently Contents+PRs read/write) 403s on `gh workflow run`/the dispatches API — confirmed twice (#4223, #4388). Every watchdog handler whose fix is "re-dispatch" (plan-recheck, tree-weekly-plan, vault-run, karen-nightly, output-sampling) is a silent no-op; several have been failing unattended for days (#4411, #4336, #4192, #4129).

**Steps:**
1. As sffan15-sys, go to github.com/settings/personal-access-tokens.
2. Open the fine-grained token used for SOCIAL_POSTER_PAT (repo: JW-Incorporated/swift2).
3. Edit permissions → set repository permission "Actions" to Read and write → save.
4. If GitHub issues a new token value instead of an in-place edit, update the secret: repo Settings → Secrets and variables → Actions → SOCIAL_POSTER_PAT → paste the new value.

**Worked if:** a re-run of `routine-marjorie-ops.yml` (or a manual `gh workflow run` under this PAT) dispatches a workflow without a 403.

## #63 🟢 [UPGRADE] Add instagram_manage_insights scope so reach/saved/shares can be built next (~15 min)
<!-- ha filed=2026-09-12 -->

**Why:** T3 v1 ships Instagram like_count/comments_count only. reach/saved/shares need the instagram_manage_insights scope, which the current IG_ACCESS_TOKEN (instagram_basic, instagram_content_publish, pages_read_engagement, business_management, pages_show_list, pages_manage_posts) doesn't carry.

**Steps:**
1. Meta App Dashboard → App Review → Permissions and Features → add instagram_manage_insights.
2. Regenerate the long-lived Graph API token for the same app/IG account with the new scope included.
3. `gh secret set IG_ACCESS_TOKEN --repo JW-Incorporated/swift2` with the regenerated token.

**Worked if:** a real `GET /{ig-media-id}?fields=reach,saved,shares` call returns values instead of a `(#10)` permission error.

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

## #43 🔴 [BLOCKING] OS-004 — Push credentials on EAS (One Source, Three Surfaces plan) (~15 min)
<!-- ha filed=2026-09-11 -->

**Why:** `docs/specs/2026-09-05-one-source-three-surfaces.md` §6,
card OS-004 (Phase 0). iOS and Android push don't actually deliver yet.
This needs interactive credential upload only you can do — Apple/Google
account access, not code.

**Progress (2026-09-16): steps 1-3 are done — only step 4 is left.**
Firebase project `longlive-9d2a9` created and `google-services.json` wired
into the Android build; the server sends through the Expo Push API, so no
FCM/Apple secret goes on Vercel (`SETUP_NOTIFICATIONS.md` items 2–6).
Steps 1 and 2 are verified against EAS itself rather than a checkbox: the
FCM V1 key (`firebase-adminsdk-fbsvc@longlive-9d2a9`) and the APNs key
`QKTVXX9XY2` are both on the `ai.jwlabs.longlive` credentials, uploaded
2026-09-12. Step 3 shipped too — Android `1.0.0 (13)` carries
`google-services.json` and is live on the Play internal track, and iOS build
10 already contained `expo-notifications` (which is why 09-12 gave iOS an
OTA update instead of a rebuild). Production Vercel has
`SUPABASE_SERVICE_ROLE_KEY` — `/api/devices/<id>/prefs` answers 404, not the
503 it returned on 09-05 — so a real device can persist its push token.

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
