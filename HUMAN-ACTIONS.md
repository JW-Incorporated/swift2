# Human actions — Swift2

<!-- ha-format: 2 -->

> **17 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #131 🟢 [UPGRADE] Reload the Facebook extension and install its new schedule (~3 min)
<!-- ha filed=2026-10-15 -->

**Why:** The Facebook export now saves each post's link and reaction/comment counts, plus replies to your own comments (PR #5930). Your browser still runs the old extension and the old weekly task, so none of that is collected yet.
**Steps:**
1. In Chrome open chrome://extensions, find the Long Live Facebook harvester, click its Reload arrow.
2. In PowerShell, from your Swift2 project folder, run `powershell -ExecutionPolicy Bypass -File scripts\knowledge\fb-export-task.ps1`
3. Tell the PM chat "fb done"; the PM checks the next export.
**Worked if:** The next export's Facebook leads carry post links (the PM checks for at least 80%).

## #130 🟡 [DECIDE] May the Reddit reader use Reddit's public .json pages? (~1 min)
<!-- ha filed=2026-10-15 -->

**Why:** Reddit blocks the home reader's browser (HTTP 403), so Reddit cards can't get score, comment counts or threads. Reddit's public .json pages need no key, login or account, but they touch the spirit of your no-Reddit-API-key rule, so it's your call.
**Steps:**
1. Decide: `yes` — RSS to find threads, plus anonymous .json for at most 20 top threads per run, slow and with an honest name; `no` — park the reader and keep the GitHub RSS scan (cards stay without counts).
**Worked if:** docs/decisions.md records your answer and the P1-15 tracker row moves out of blocked.

## #129 🔴 [BLOCKING] Turn push notifications back on in production, after the design review (~10 min)
<!-- ha filed=2026-10-15 -->

**Why:** Push is off in production because CRON_SECRET is missing. PUSH READY (2026-10-15): the review's must-fixes merged (#5891, #5916), the stale backlog is cleared (56 killed, 0 left), and a watchdog alerts if dispatch stops.
**Steps:**
1. Vercel → swift2-web → Settings → Environment Variables → add CRON_SECRET (Production) set to a long random string. Never paste it in chat.
2. Vercel → swift2-web → Deployments → newest Production deployment → Redeploy.
3. Tell the PM chat "push on"; the PM checks the first ticks and the watchdog.
**Worked if:** /api/notifications/dispatch logs stop saying "CRON_SECRET not set" and the watchdog's push heartbeat check reads OK.

## #127 🟢 [UPGRADE] Make the backup Claude token a GitHub secret (~2 min)
<!-- ha filed=2026-10-14 -->
<!-- ha verify: secret-exists CLAUDE_CODE_OAUTH_TOKEN_BACKUP -->

**Why:** You chose your co-founder's plan as the backup (2026-10-15). A Hermes session put its token in Swift2's local env file, but routines run in GitHub Actions, so it must also be a GitHub secret. The same command covers #124.
**Steps:**
1. In PowerShell, from your Swift2 project folder, run `gh secret set -f .env --repo JW-Incorporated/swift2` (sets every key in that file; prints names, never values).
**Worked if:** `gh secret list --repo JW-Incorporated/swift2` shows CLAUDE_CODE_OAUTH_TOKEN_BACKUP.

## #126 🟢 [UPGRADE] Affiliate accounts: Awin joins and the Amazon store ID (~20 min)
<!-- ha filed=2026-10-14 -->

**Why:** Merch cards can't carry affiliate links until the Awin publisher ID and the Amazon store ID are set in Vercel. Nothing else waits on this.
**Steps:**
1. Go to https://ui.awin.com and note your Publisher ID.
2. Join these advertisers: agolde.com, alamourthelabel.com, clubllondon.us, jenniferbehr.com, meshki.us.
3. Also join: patmcgrath.com, popflexactive.com, unique-vintage.com, Etsy (6220).
4. Go to https://affiliate-program.amazon.com and note your Store ID (ends in -20) and its approval status.
5. Paste both IDs in the Swift2 pipeline PM chat.
**Worked if:** The PM confirms NEXT_PUBLIC_AWIN_ID and NEXT_PUBLIC_AMAZON_ASSOCIATES_TAG are set in Vercel.

## #125 🔴 [BLOCKING] Confirm the Hermes Tree and Marjorie loops so #5484 can merge (~5 min)
<!-- ha filed=2026-10-14 -->

**Why:** #5484 retires six Swift2 routines that Hermes replaces, freeing about 1,950 units a week of your Claude limit. You approved merging it (D9) once a Hermes session confirms both loops are live.
**Steps:**
1. Open a Claude Code session in Projects\Hermes.
2. Paste: "Did the Hermes Tree and Hermes Marjorie daily loops both run successfully in the last 3 days, and which model or token pool do they use? Answer yes or no per loop."
3. Tell the Swift2 pipeline PM the answer in chat.
**Worked if:** #5484 is merged, or the pipeline tracker records why it waits.

## #124 🔴 [BLOCKING] Make the Jev key a GitHub secret: TYPESAFE_API_KEY (~2 min)
<!-- ha filed=2026-10-14 -->
<!-- ha verify: secret-exists TYPESAFE_API_KEY -->

**Why:** Every Jev saving (routing off your Claude limit, the Tidewatch classifier) waits on this secret. The key is in Swift2's local env file and passed a live test on 2026-10-15; scheduled jobs need it as a GitHub secret.
**Steps:**
1. In PowerShell, from your Swift2 project folder, run `gh secret set -f .env --repo JW-Incorporated/swift2` (also covers #127; prints names, never values).
2. Optional: tell the Swift2 pipeline PM the prepaid balance if the TypeSafe console shows it.
**Worked if:** `gh secret list --repo JW-Incorporated/swift2` shows TYPESAFE_API_KEY.

## #123 🟡 [DECIDE] #5508 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-15 -->
<!-- marjorie-chase: 96h issue=5508 -->

**Why:** Marjorie dispatched it on 2026-10-11 (Official "Patient Zero" video is missing from the Showgirl videos rail — intake closed as…). Nothing has moved since 2026-10-11. Holder: unclaimed.

**Steps:**
1. Reply in #marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #5508 under stalled.

## #117 🟢 [UPGRADE] Reload the Facebook export extension (~2 min)
<!-- ha filed=2026-10-08 -->

**Why:** PR #5385 fixes Facebook comment collection, which only gets 40–60% today. The extension runs in your Chrome, so the fix only takes effect after you reload it. Nothing is blocked; the export keeps working as before until then.
**Steps:**
1. In PowerShell, run: `git -C $env:USERPROFILE\Documents\Claude\Projects\Swift2 pull --ff-only` (with the checkout on main).
2. In Chrome, go to `chrome://extensions`, find the Long Live FB export extension, and click its reload ↻ icon.
**Worked if:** the next weekly export summary shows a per-group comment success % line.

## #115 🟡 [DECIDE] #4673 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-07 -->
<!-- marjorie-chase: 96h issue=4673 -->

**Why:** Marjorie dispatched it on 2026-10-01 (content: three fan moments aged out of intake uncovered — cover or decline with a reason …). Nothing has moved since 2026-10-03. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4673 under stalled.

## #114 🟡 [DECIDE] #4804 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-06 -->
<!-- marjorie-chase: 96h issue=4804 -->

**Why:** Marjorie dispatched it on 2026-10-02 (Watchdog alerts Marjorie can handle should not reach the founders channel). Nothing has moved since 2026-10-02. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4804 under stalled.

## #113 🟡 [DECIDE] #4778 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-06 -->
<!-- marjorie-chase: 96h issue=4778 -->

**Why:** Marjorie dispatched it on 2026-10-02 (Enforce the owner's three post criteria in code: a mediaEarnsItsPlace floor, tunable rubr…). Nothing has moved since 2026-10-02. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4778 under stalled.

## #111 🟡 [DECIDE] #4767 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-06 -->
<!-- marjorie-chase: 96h issue=4767 -->

**Why:** Marjorie dispatched it on 2026-10-01 (Awareness replies: make the share card optional so a reply can ship as plain text). Nothing has moved since 2026-10-01. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4767 under stalled.

## #110 🟡 [DECIDE] #4720 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-06 -->
<!-- marjorie-chase: 96h issue=4720 -->

**Why:** Marjorie dispatched it on 2026-10-01 (build-ticket helper rejects the weekly review's truthful sourceContext (prompt and code d…). Nothing has moved since 2026-10-01. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4720 under stalled.

## #109 🟡 [DECIDE] #4324 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-06 -->
<!-- marjorie-chase: 96h issue=4324 -->

**Why:** Marjorie dispatched it on 2026-09-14 (Definition of Done #5 — one full-site link sweep, then widen the nightly to shop/product …). Nothing has moved since 2026-09-30. Holder: unclaimed.

**Steps:**
1. Reply in #longlive-marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #4324 under stalled.

## #100 🔴 [BLOCKING] iOS-1: test the new app on iPhone + iPad (~40 min)
<!-- ha filed=2026-10-04 -->

**Why:** One UI's iOS-1 gate. All new screens (Waves 1–4) shipped by OTA on TestFlight build 38; nothing more is built on iOS until iPhone and iPad are checked.

**Steps:**
1. iPhone (coordinate with the iPhone tester) and your iPad: open TestFlight → Long Live → Install/Update.
2. Follow docs/plans/one-ui/device-checklists.md → "iOS-1": iPhone 7 steps, iPad 8 steps.
3. Never type numbers — tap Send report and run Speed test mode; reports reach issue #4791.
4. Reply one line per device, e.g. `iPhone: pass 1-6, fail 7: <what you saw>`.

**Worked if:** both devices reply all-pass, or each failure names what was on screen.

## #99 🟢 [UPGRADE] Send two app IDs so longlivets.com links open the app (~5 min)
<!-- ha filed=2026-10-04 -->

**Why:** One UI H6 (universal links) needs the Apple Team ID and the Play app-signing SHA-256 in the link files. Not needed until Wave 3; nothing is blocked yet.

**Steps:**
1. Open https://developer.apple.com/account → Membership details → copy the 10-character Team ID.
2. Open https://play.google.com/console → Long Live → Test and release → App integrity → Play app signing → Settings.
3. Under "App signing key certificate", copy the SHA-256 certificate fingerprint.
4. Paste both into the Claude chat (copy-paste, no typing). They are public identifiers, not secrets.

**Worked if:** both values appear in docs/one-ui/drafts/well-known/ in place of the placeholders.
