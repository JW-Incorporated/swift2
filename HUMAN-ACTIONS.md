# Human actions — Swift2

<!-- ha-format: 2 -->

> **3 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #98 🟡 [DECIDE] Expo build minutes are used up until Nov 1 (~5 min)
<!-- ha filed=2026-10-03 -->

**Why:** The app release pipeline stopped: Expo's free plan (account jw-labs) used its 60 CI/CD minutes for October, so no iOS or Android store build can start until Nov 1 — the new iOS profile can't be tested and no app update ships.
**Steps:**
1. Decide: `pay` — upgrade jw-labs at https://expo.dev/accounts/jw-labs/settings/billing; `reroute` — Claude moves the release steps onto GitHub Actions so they don't use Expo CI minutes (no cost, ~1 PR); `wait` — pause app builds until Nov 1.
2. If `pay`: open the link, pick a paid plan, enter payment, then tell Claude "expo paid".
**Worked if:** a re-run of "Mobile release train" on main gets past the fingerprint job.

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
