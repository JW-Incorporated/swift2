# Human actions — Swift2

<!-- ha-format: 2 -->

> **8 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #116 🔴 [BLOCKING] Free disk: delete old agent worktree folders (~5 min)
<!-- ha filed=2026-10-08 -->

**Why:** C: has ~11 GB free. About 75 finished agent worktree folders (each 1–2 GB of node_modules) failed to delete on Windows, and the guard blocks agents from deleting folders recursively. The fleet has stopped starting new work.
**Steps:**
1. Open PowerShell and run: `cd $env:LOCALAPPDATA\Temp\claude\C--Users-Fourtys-Documents-Claude-Projects-Swift2\2fad436e-5ed7-4251-b386-facb1db6e7a6\scratchpad`
2. Run: `Get-ChildItem -Directory -Filter wt-* | Remove-Item -Recurse -Force`
3. Run: `git -C $env:USERPROFILE\Documents\Claude\Projects\Swift2 worktree prune`
**Worked if:** `Get-PSDrive C` shows more than 60 GB free.

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
