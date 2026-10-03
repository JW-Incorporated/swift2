# Human actions — Swift2

<!-- ha-format: 2 -->

> **3 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #89 🔴 [BLOCKING] Add Associated Domains to the iOS signing profile (~10 min)
<!-- ha filed=2026-10-02 -->

**Why:** Since #4799 the iOS store build fails: profile "LongLive App Store 2026-09-05" lacks Associated Domains. No new store builds or app updates reach either phone until this is fixed.
**Steps:**
1. Open https://developer.apple.com/account/resources/identifiers/list and click the identifier `ai.jwlabs.longlive`.
2. Tick **Associated Domains**, click **Save**, confirm.
3. In a terminal: `cd C:\Users\Fourtys\Documents\Claude\Projects\Swift2\apps\mobile`
4. Run `npx eas-cli credentials -p ios`, pick profile `production`, then **Provisioning Profile** → remove it, then let EAS generate a new one (log in to Apple when asked).
5. Tell Claude in chat "profile done" — it re-runs the release train.
**Worked if:** the next "Mobile release train" run on main shows `Build iOS (store)` succeeded (no "does not support the Associated Domains capability").

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
