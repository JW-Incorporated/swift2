# Human actions — Swift2

<!-- ha-format: 2 -->

> **5 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #105 🟡 [DECIDE] Store data-safety form still says the app runs analytics (~5 min)
<!-- ha filed=2026-10-05 -->

**Why:** The app no longer runs website analytics, but apps/web/lib/longlive/data-inventory.ts (the source for the App Store / Play data-safety answers) still declares it. Over-declaring is safe; fixing it changes the store listings.
**Steps:**
1. Decide: `keep` — leave the store forms over-declaring for now; `fix` — AI updates the inventory and files the store-console edits for you.
**Worked if:** your reply is recorded on this card.

## #103 🟢 [UPGRADE] Set SUBMISSIONS_HASH_SALT in Vercel production (~3 min)
<!-- ha filed=2026-10-05 -->

**Why:** Since PR #5143, link submissions omit the anonymous client hash unless this salt is set (the old public fallback salt was removed). Without it, repeat-submitter detection in the sheet is off.
**Steps:**
1. Open https://vercel.com → the longlivets project → Settings → Environment Variables.
2. Add `SUBMISSIONS_HASH_SALT` = any long random string → Production → Save.
3. Redeploy production (Deployments → latest → Redeploy).
**Worked if:** the next link submission issue shows a "Client hash" line again.

## #101 🔴 [BLOCKING] S5: test the new app on your Android phone (~20 min)
<!-- ha filed=2026-10-04 -->

**Why:** All Wave 4 screens (nav, era picker, track guide, search, merch, community, ClownChat, settings, legal) shipped by OTA to Play build 18; S5 confirms them on Android before the next gate.
**Steps:**
1. Open Long Live, wait 10 s, force-stop, reopen (the update applies).
2. Follow docs/plans/one-ui/device-checklists.md → "S5 Android" (8 steps).
3. Never type numbers — tap Send report and run Speed test mode; reports reach issue #4791.
4. Reply `pass 1-6, fail 7: <what you saw>`.
**Worked if:** the reply is all-pass, or each failure names what was on screen.

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
