# Human actions — Swift2

<!-- ha-format: 2 -->

> **4 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #95 🟢 [UPGRADE] Save the refreshed Instagram token so DMs and FB comments reach Discord (~5 min)
<!-- ha filed=2026-10-01 -->

**Why:** #92 was closed but IG_ACCESS_TOKEN still dates from 09-30, so the reply notifier logs
"DMs disabled: missing scope" and FB comments need pages_read_user_content (added to the app 10-01).
**Steps:**
1. Open https://developers.facebook.com/tools/explorer/ and pick app `Long Live Poster`.
2. Keep every current permission; add `instagram_manage_messages` and `pages_read_user_content`.
3. Generate Access Token, approve the Long Live Page and Instagram account.
4. ⓘ next to the token → Open in Access Token Tool → Extend Access Token; copy it.
5. https://github.com/JW-Incorporated/swift2/settings/secrets/actions → IG_ACCESS_TOKEN → ✏️ → paste → Update secret.
**Worked if:** the next social-reply-notifier run log has no `missing scope` and no `pages_read_user_content` error.

## #93 🟢 [UPGRADE] Check the app's API address isn't overridden in Expo (~2 min)
<!-- ha filed=2026-10-01 -->

**Why:** The app now calls https://www.longlivets.com by default. If Expo's production env still sets EXPO_PUBLIC_API_BASE_URL to the old swift2-web-nine.vercel.app address, the next build keeps using the old one.
**Steps:**
1. Open https://expo.dev → project Long Live → Environment variables → filter `production`.
2. Look for `EXPO_PUBLIC_API_BASE_URL`. If absent, you're done.
3. If present with any value other than `https://www.longlivets.com`, delete it (or set it to `https://www.longlivets.com`).
**Worked if:** Production lists no `EXPO_PUBLIC_API_BASE_URL`, or it equals `https://www.longlivets.com`.

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
