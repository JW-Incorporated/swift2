# Human actions — Swift2

<!-- ha-format: 2 -->

> **16 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #141 🔴 [BLOCKING] routine-template: retry claude-code-action once when the Agent SDK install fails (no execution file) (~5 min)
<!-- ha filed=2026-10-21 -->
<!-- ha verify: issue-closed 6170 -->

**Why:** The ops-fixer could not fix #6170 and needs a session with more reach.

**Steps:**
1. Open Claude Code in Documents\Claude\Projects\Swift2.
2. Paste the prompt from issue #6170 (copy button on the code block).

**Worked if:** issue #6170 is closed by a merged PR.

## #140 🟡 [DECIDE] #5900 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-20 -->
<!-- marjorie-chase: 96h issue=5900 -->

**Why:** Marjorie dispatched it on 2026-10-15 (routine failure: routine-marjorie-ask-response 2026-10-15). Nothing has moved since 2026-10-16. Holder: PR #5995 awaiting review.

**Steps:**
1. Reply in #marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #5900 under stalled.

## #139 🟡 [DECIDE] #5980 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-20 -->
<!-- marjorie-chase: 96h issue=5980 -->

**Why:** Marjorie dispatched it on 2026-10-16 (link-sweep: dead citation URL in tortured-poets.mjs (The Bolter)). Nothing has moved since 2026-10-16. Holder: unclaimed.

**Steps:**
1. Reply in #marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #5980 under stalled.

## #138 🟢 [UPGRADE] Let Instagram posts also post to the Facebook Page (~10 min)
<!-- ha filed=2026-10-19 -->

**Why:** IG and X posts work again (10-19 posted 23:52Z), but every Facebook Page cross-post fails: `(#200) The permission(s)…`. The Instagram token lacks `pages_manage_posts`, so the Page gets nothing.

**Steps:**
1. Open https://developers.facebook.com/tools/explorer and pick the Long Live app.
2. Under Permissions keep the existing ones and add `pages_manage_posts`, then click Generate Access Token and approve.
3. Make it long-lived the same way you did for the original token (docs/social/pipeline.md, Facebook Page cross-posting).
4. In PowerShell in the swift2 folder run `gh secret set IG_ACCESS_TOKEN --env social --repo JW-Incorporated/swift2` and paste the token when asked.
5. Reply `done` here.

**Worked if:** the next Instagram post's poster run logs no "Facebook Page cross-post failed" warning.

## #134 🟡 [DECIDE] #5538 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-16 -->
<!-- marjorie-chase: 96h issue=5538 -->

**Why:** Marjorie dispatched it on 2026-10-11 (weekly scorecard: map legacy campaign prefixes to pillars — 9 of 13 measured posts read a…). Nothing has moved since 2026-10-11. Holder: unclaimed.

**Steps:**
1. Reply in #marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #5538 under stalled.

## #133 🟡 [DECIDE] #5537 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-16 -->
<!-- marjorie-chase: 96h issue=5537 -->

**Why:** Marjorie dispatched it on 2026-10-11 (social gate: enforce the mediaEarnsItsPlace ≥4 floor in queue-schema (Tree's #5168 criter…). Nothing has moved since 2026-10-11. Holder: unclaimed.

**Steps:**
1. Reply in #marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #5537 under stalled.

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


## #123 🟡 [DECIDE] #5508 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-15 -->
<!-- marjorie-chase: 96h issue=5508 -->

**Why:** Marjorie dispatched it on 2026-10-11 (Official "Patient Zero" video is missing from the Showgirl videos rail — intake closed as…). Nothing has moved since 2026-10-11. Holder: unclaimed.

**Steps:**
1. Reply in #marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #5508 under stalled.

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
