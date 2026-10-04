# Human actions — Swift2

<!-- ha-format: 2 -->

> **4 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #99 🟢 [UPGRADE] Send two app IDs so longlivets.com links open the app (~5 min)
<!-- ha filed=2026-10-04 -->

**Why:** One UI H6 (universal links) needs the Apple Team ID and the Play app-signing SHA-256 in the link files. Not needed until Wave 3; nothing is blocked yet.
**Steps:**
1. Open https://developer.apple.com/account → Membership details → copy the 10-character Team ID.
2. Open https://play.google.com/console → Long Live → Test and release → App integrity → Play app signing → Settings.
3. Under "App signing key certificate", copy the SHA-256 certificate fingerprint.
4. Paste both into the Claude chat (copy-paste, no typing). They are public identifiers, not secrets.
**Worked if:** both values appear in docs/one-ui/drafts/well-known/ in place of the placeholders.

## #98 🟡 [DECIDE] Scrub ~70 unhashed FB names leaked into engagement_lead now, or wait? (~5 min)
<!-- ha filed=2026-10-03 -->

**Why:** #4885 found two bugs in `facebook-groups-parser.ts` that stored real Facebook group members' names unhashed in ~70 `engagement_lead` rows, breaking the documented "hashed authors" guarantee (`docs/decisions.md` 2026-08-25).

**Steps:**
1. Decide: `scrub` — delete/rehash the ~70 contaminated rows now; `wait` — leave them until the ingestion fix ships.
2. Reply with your choice in chat, or comment it on issue #4885.

**Worked if:** issue #4885 has a founder comment recording `scrub` or `wait`.

## #88 🔴 [BLOCKING] Finish the weekly Facebook export setup (~5 min)
<!-- ha filed=2026-09-30 -->

**Why:** The first real run failed at ingest: apps/worker's env file lacks the Supabase keys, so nothing uploads. The task needs re-registering (Sundays 23:00-04:00) and the extension reloaded; the PC must stay on and signed in overnight (wake timers on).
**Steps:**
1. Supabase → Project Settings → API: copy Project URL and service_role key into apps/worker's env file as `SUPABASE_URL=<url>` and `SUPABASE_SERVICE_ROLE_KEY=<key>`. Never paste values in chat.
2. In the Swift2 folder run `npm run knowledge:fb-schedule`.
3. Long Live Chrome profile: chrome://extensions → remove Long Live → Load unpacked → `C:\Users\Fourtys\Documents\Claude\Projects\Swift2\scripts\knowledge\fb-extension`; then tray → Exit.
4. Optional: delete `%LOCALAPPDATA%\longlive-fb\fb-cred.xml`.
**Worked if:** `npm run knowledge:fb-export` finishes with N/N uploaded and no KEPT line.

## #70 🟡 [DECIDE] Confirm the first automated Facebook export (~5 min)
<!-- ha filed=2026-09-12 -->

**Why:** The fan-signal engine reads six Facebook groups. Joey approved automated collection from his account and accepted the risk (docs/decisions.md, 2026-09-30). This stays open only until the first successful run proves the parser on a real export.
**Steps:**
1. Complete #88 (worker Supabase keys, Sunday task, reload the extension).
2. Let `npm run knowledge:fb-export` finish once, or run it yourself after a
   successful dry run. Do not solve a checkpoint, 2FA prompt, or CAPTCHA with
   automation; complete it in the browser and rerun. Runs are Sundays 23:00-04:00 unattended.
3. Confirm the weekly `FB group export due — week of ...` issue closed with a
   comment listing uploaded/not-member counts.
**Worked if:** the weekly issue is closed, every joined group says `uploaded`,
no group says `failed`, and this #70 action can then be closed.
