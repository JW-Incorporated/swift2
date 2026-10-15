# Human actions — Swift2

<!-- ha-format: 2 -->

> **18 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #128 🟡 [DECIDE] Approve the Tidewatch rules PR (breaking news and confirmed personal-life news) (~5 min)
<!-- ha filed=2026-10-14 -->

**Why:** The guardrails are founder-owned, so agents never merge them. Breaking news can't go live on site, push or social until this lands, and confirmed personal-life news (Baby Watch) also waits on it. It writes down what you decided as D4 to D6 tonight.
**Steps:**
1. Open https://github.com/JW-Incorporated/swift2/pull/5817 and read the TL;DR at the top.
2. Decide: `approve` — merge it (or say "approved" in the Swift2 pipeline PM chat); `change` — say what to change.
**Worked if:** PR #5817 shows Merged.

## #127 🟢 [UPGRADE] Add a backup Claude token so routines keep running past your weekly limit (~5 min)
<!-- ha filed=2026-10-14 -->

**Why:** Under the revised D1 every model call runs on your Claude subscription. When your weekly limit hits, routines pause until the reset. A second subscription token lets them switch over automatically. Whose plan backs you up is your call.
**Steps:**
1. Pick the backup plan (your co-founder's subscription or a Team seat).
2. On a machine logged into that plan, run `claude setup-token` in a terminal and copy the token it prints.
3. In your own terminal run `gh secret set CLAUDE_CODE_OAUTH_TOKEN_BACKUP --repo JW-Incorporated/swift2` and paste the token at the prompt.
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

## #124 🔴 [BLOCKING] Put the Jev key into Swift2 as TYPESAFE_API_KEY (~5 min)
<!-- ha filed=2026-10-14 -->

**Why:** Every Jev saving (routing off your Claude limit, the Tidewatch classifier) waits on this secret. Agent guards can't write secrets, so this one is yours.
**Steps:**
1. Open a Claude Code session in Projects\Hermes.
2. Paste: "Set the Jev key as GitHub Actions secret TYPESAFE_API_KEY on JW-Incorporated/swift2 without printing or reading the value. If your guard blocks it, give me the one-line command to run."
3. If it hands you a command, run it in your own terminal.
4. Tell the Swift2 pipeline PM the prepaid balance if the TypeSafe console shows it.
**Worked if:** `gh secret list --repo JW-Incorporated/swift2` shows TYPESAFE_API_KEY.

## #123 🟡 [DECIDE] #5508 has had no activity for 4 days (~2 min)
<!-- ha filed=2026-10-15 -->
<!-- marjorie-chase: 96h issue=5508 -->

**Why:** Marjorie dispatched it on 2026-10-11 (Official "Patient Zero" video is missing from the Showgirl videos rail — intake closed as…). Nothing has moved since 2026-10-11. Holder: unclaimed.

**Steps:**
1. Reply in #marjorie with one word: `assign` (a session takes it this week), `defer` (she stops chasing; it stays open), or `close`.

**Worked if:** the next brief no longer lists #5508 under stalled.

## #121 🔴 [BLOCKING] Fix routine-tree-weekly-plan's turn-ceiling failure (~10 min)
<!-- ha filed=2026-10-11 -->
<!-- ha verify: issue-closed 5470 -->

**Why:** The weekly social plan routine keeps dying on its turn ceiling (error_max_turns) — no plan has shipped since the defect recurred (watchdog alert #5523, tracking issue #5470). The ops-fixer's attempt was rejected by its own guard rails (PR #5479 touched social-approval/signing files outside them), so this needs a human-directed session instead.
**Steps:**
1. Open Claude Code in `Documents\Claude\Projects\Swift2`.
2. Paste the prompt from issue #5470 (copy button on the code block).
**Worked if:** issue #5470 is closed by a merged PR.

## #120 🔴 [BLOCKING] social poster exit path: items A, B and C (ops-fixer is rail-blocked on all three files) (~5 min)
<!-- ha filed=2026-10-09 -->
<!-- ha verify: issue-closed 4475 -->

**Why:** Founder-approved social posts are still being killed or stranded on the exit path. The ops-fixer fixed the watchdog blind spot (item D) but rail 3 forbids it from touching the three social files where A, B and C live. A human session has the reach; the diagnosis is already done.
**Steps:**
1. Open Claude Code in `Projects\Swift2`.
2. Paste the prompt from issue #4475 (copy button on the code block).
**Worked if:** issue #4475 is closed by a merged PR.

## #119 🟢 [UPGRADE] Update the doorbell to doorbell-v4 (~5 min)
<!-- ha filed=2026-10-09 -->

**Why:** The doorbell still runs v3. It looks for the old channel name, so it can't ring for #marjorie (the 5-min poll still covers it, only slower), and it can sit dead for hours like it did on 10-04. v4 fixes both (#5421, #5426).
**Steps:**
1. Open Claude Code in `Projects\Hermes` (a Hermes session; Swift2 sessions can't reach the VM).
2. Paste: `Update the Swift2 doorbell on the Hermes VM to tag doorbell-v4 per docs/ops/doorbell.md "Update to a new tag" in JW-Incorporated/swift2: fetch+checkout the tag in /opt/longlive-doorbell, copy scripts/doorbell/longlive-doorbell.service to /etc/systemd/system/, daemon-reload, restart longlive-doorbell, then show the last 20 journal lines.`
**Worked if:** the journal shows `gateway: connected` and a 👀 lands on your next message in #marjorie within seconds.
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
