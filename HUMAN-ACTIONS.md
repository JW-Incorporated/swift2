# Human actions — Swift2

<!-- ha-format: 2 -->

> **5 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

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

## #108 🟢 [UPGRADE] Give the ops-fixer its own token for workflow-file fixes (~5 min)
<!-- ha filed=2026-10-05 -->

**Why:** Only fixes under .github/workflows/ are blocked without it: GitHub rejects that push unless the token has Workflows write. A dedicated token keeps the social poster's token narrow; other fixes work now.

**Steps:**
1. Open https://github.com/settings/personal-access-tokens/new
2. Name it `swift2-ops-fixer`, set Expiration to 1 year, Resource owner `JW-Incorporated`, choose "Only select repositories" and pick `JW-Incorporated/swift2`.
3. Under "Repository permissions" set Contents, Pull requests, Issues, Workflows and Actions each to "Read and write". Leave the rest alone.
4. Click "Generate token" and copy the value.
5. Open https://github.com/JW-Incorporated/swift2/settings/secrets/actions/new, enter Name `OPS_FIXER_PAT`, paste the value, click "Add secret".

**Worked if:** the ops-fixer's next fix that edits a file under .github/workflows/ pushes and opens its PR.

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
