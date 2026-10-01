# Human actions — Swift2

<!-- ha-format: 2 -->

> **4 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #92 🟢 [UPGRADE] Refresh the Instagram token so DMs reach Discord (~10 min)
<!-- ha filed=2026-10-01 -->

**Why:** You asked to be notified of every Instagram DM. The Long Live Poster app now has
instagram_manage_messages (added 10-01), but the stored IG_ACCESS_TOKEN predates it, so the
reply notifier can see comments and mentions but not DMs. Only you can grant and store tokens.
**Steps:**
1. Open https://developers.facebook.com/tools/explorer/ and pick app `Long Live Poster`.
2. Under Permissions, keep every current one and add `instagram_manage_messages` and `pages_messaging`.
3. Click Generate Access Token and approve the Long Live Page and Instagram account.
4. Click the ⓘ next to the token → Open in Access Token Tool → Extend Access Token; copy the long-lived token.
5. In the Swift2 folder run `gh secret set IG_ACCESS_TOKEN --repo JW-Incorporated/swift2` and paste it.
**Worked if:** the next `social-reply-notifier` run's log no longer says `DMs disabled: missing scope`.

## #89 🟢 [UPGRADE] Turn on Marjorie's bot1 bridge: Discord webhook, GitHub secret, Hermes allowlist (~10 min)
<!-- ha filed=2026-09-30 -->

**Why:** Marjorie can only file GitHub issues. Hermes-side blockers need bot1, and bot1 ignores webhook messages until it is told to accept this one. Nothing halts while off; the bridge ships disabled.
**Steps:**
1. In Discord open #longlive, then Edit Channel, Integrations, Webhooks, New Webhook. Name it `Marjorie` and click Copy Webhook URL.
2. Open github.com/JW-Incorporated/swift2/settings/environments, choose `ops`, Add environment secret: name `DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL`, value the copied URL.
3. In a Hermes session (not this project) apply the allowlist change tracked at https://github.com/JW-Incorporated/Hermes/issues/1.
4. Reply `done` here. An agent then sets `bot1Bridge.enabled` to `true` in `scripts/marjorie/marjorie-config.json` by PR.
**Worked if:** after that PR merges, Marjorie's first bot1 prompt appears as a card on Hermes' board and is logged on the `bot1-bridge` issue.

## #88 🔴 [BLOCKING] Finish the weekly Facebook export setup (~5 min)
<!-- ha filed=2026-09-30 -->

**Why:** The first real run failed at ingest: apps/worker's env file lacks the Supabase keys, so nothing uploads. The task also needs re-registering (Sundays 23:00-04:00, 5 h limit) and the extension reloaded. The PC must stay on and signed in overnight (locking is fine; allow wake timers). The stored DPAPI Facebook password is no longer used.
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
