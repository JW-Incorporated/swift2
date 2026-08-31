# SETUP_NOTIFICATIONS.md — Founder setup checklist

Everything the notification system's code (schema, API routes, client SDK
wiring) needs from Joey/Wyatt before real push notifications can go out.
Nothing in `NOTIFICATIONS_PLAN.md` Phase 0 depends on these being done —
Phase 0 code is complete and correct with these left unset; it degrades
cleanly (503 from the register route, a documented failure from
`send-test-push.ts`) until they're filled in. **Update (2026-08-31,
founder):** Apple Developer access already exists and app-store approval is
already in progress for both platforms — this is expected to happen soon,
not an open-ended maybe. When it's done, this doc is the one and only
remaining step; no code changes are needed.

## What's already built, waiting on these values

- `supabase/migrations/20260909000000_notifications_devices.sql` — the
  `devices` table (spec §9), RLS-locked to `service_role` only.
- `POST /api/devices/register` (`apps/web/app/api/devices/register/route.ts`)
  — upserts a device row; needs `SUPABASE_SERVICE_ROLE_KEY` (item 1 below,
  which already exists for this project — see `apps/worker/.env.example`).
- Native app: `apps/mobile/lib/device-id.ts` (anonymous device_id via
  SecureStore), `apps/mobile/lib/notification-channels.ts` (Android channels
  1:1 with spec §4), `apps/mobile/lib/push-registration.ts` (permission
  request + FCM/Expo push token + registration call) — all typecheck-clean
  and ready; they just need a real Firebase project behind them.
- `scripts/send-test-push.ts` — manual one-off send to a specific
  `device_id`. Will run the moment items 3–4 below are set; until then it
  fails with a clear "which env var is missing" message, on purpose.

## 1. Supabase service-role key — already exists, no new step

`SUPABASE_SERVICE_ROLE_KEY` (+ `SUPABASE_URL`) is the SAME pair
`apps/worker/.env.example` already documents for the news/current worker.
Copy the same values into wherever `POST /api/devices/register` runs
(Vercel project env for `apps/web`, both **not** prefixed
`NEXT_PUBLIC_*` — that would ship it to the browser). If you don't have this
pair handy: Supabase dashboard → this project → Project Settings → API →
"service_role" secret key.

## 2. Create the Firebase project

1. Go to https://console.firebase.google.com → **Add project**.
2. Name it (e.g. "LongLive" / "Longlivets"). Google Analytics for the
   project is optional — skip it, this app doesn't need it.
3. Once created, note the **Project ID** (not the display name) — this is
   `FCM_PROJECT_ID` below.
4. Add both apps to the Firebase project:
   - **Android**: package name `ai.jwlabs.longlive` (from
     `apps/mobile/app.json`'s `android.package`). Download
     `google-services.json` when offered — see item 5.
   - **iOS**: bundle id `ai.jwlabs.longlive` (from `app.json`'s
     `ios.bundleIdentifier`). Download `GoogleService-Info.plist` — see
     item 5.

## 3. Enable FCM HTTP v1

1. In the Firebase console, go to **Project settings → Cloud Messaging**.
2. FCM HTTP v1 is enabled by default on new projects — confirm the "Cloud
   Messaging API (V1)" status shows **Enabled**. If not, enable it from the
   linked Google Cloud console page.
3. No key to copy here — HTTP v1 auth comes from the service account (item
   4), not a legacy server key.

## 4. Service-account key for server-side sends

This is what `scripts/send-test-push.ts` and, later, the Phase 2/3 sender
Edge Functions use to send messages — never the mobile app itself.

1. Firebase console → **Project settings → Service accounts**.
2. Click **Generate new private key** → downloads a JSON file. Treat this
   file like a password — it can send push to every registered device.
3. **Do not commit this file anywhere in the repo.**
4. Set it as two env vars (Supabase Edge Function env — see item 6 for
   exactly where, NOT a Vercel/Next.js env, and NEVER
   `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*`):
   - `FCM_PROJECT_ID` — the Project ID from item 2.3.
   - `FCM_SERVICE_ACCOUNT_JSON` — the full JSON file contents, as a single
     env var value.
5. For running `send-test-push.ts` locally/manually, put the same two vars
   in `apps/worker/.env` (gitignored) alongside the existing Supabase
   creds — see the top of that script for the exact names.

## 5. Upload the APNs auth key (needed for iOS delivery)

FCM fronts APNs, but APNs still needs its own key uploaded to Firebase.
**Requires Apple Developer account access** (per the founder update above,
this now exists — Wyatt has it).

1. Apple Developer portal (https://developer.apple.com/account) → **Certificates,
   Identifiers & Profiles → Keys** → **+** to create a new key.
2. Name it (e.g. "LongLive APNs"), check **Apple Push Notifications service
   (APNs)**, then **Continue → Register**.
3. Download the `.p8` key file **immediately** — Apple only lets you
   download it once. Note the **Key ID** shown on this page.
4. Also note your **Team ID** (top-right of the Apple Developer portal, or
   Membership page).
5. Firebase console → **Project settings → Cloud Messaging → Apple app
   configuration → APNs Authentication Key → Upload**. Provide the `.p8`
   file, Key ID, and Team ID.

## 6. Where these env vars actually live

Phase 2's router (`POST-turned-GET /api/notifications/dispatch`,
`packages/core/src/notification-sender.ts`) runs as a **Vercel** API route,
not a Supabase Edge Function — same stack every other route in `apps/web`
already uses (Phase 0/1's routes), so no separate Supabase Edge Function
deploy is needed. Set these as **Vercel project env vars** (Project
Settings → Environment Variables), never prefixed `NEXT_PUBLIC_*`:

```
FCM_PROJECT_ID=<project-id>
FCM_SERVICE_ACCOUNT_JSON=<paste full JSON, one line>
CRON_SECRET=<a random 32+ char string you generate — e.g. `openssl rand -hex 32`>
```

`send-test-push.ts` (run locally, not on Vercel) reads the same two FCM
vars from `apps/worker/.env` (gitignored) — see item 4 above for exactly
where to add them there too. `CRON_SECRET` is Vercel-only: setting a
project env var with that EXACT name makes Vercel Cron automatically send
`Authorization: Bearer $CRON_SECRET` on every scheduled call to
`/api/notifications/dispatch` (configured every 15 min in
`apps/web/vercel.json`'s `crons` array) — the route checks that header and
returns 401/503 without it, so nothing sends until this is set.

## 7. Notifications event-producer secrets (GitHub Actions)

Three workflows call `insertEvent()` (the producer seam,
`packages/core/src/notification-events.ts`) and need the SAME
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` pair `news-worker.yml`
already uses, added as repo secrets if not already present (Settings →
Secrets and variables → Actions):

- `news-worker.yml` — already has these secrets (song_drop/album_news/tour_news).
- `merch-official-sync.yml` — needs them added (official_merch).
- `appearance-discovery.yml` — needs them added (official_youtube).

Each degrades to a silent skip (never a workflow failure) when unset — see
each script's own log line for confirmation once added.

## 8. Verifying it worked

Once items 1–7 are done:

```
# register a real device from the app first (grants push permission),
# then find its device_id (logged by requestPushRegistration(), or query
# `devices` directly), then:
node --env-file=apps/worker/.env scripts/send-test-push.ts <device_id>
```

A successful run prints `send-test-push: sent OK` and the device should
receive "LongLive test push" within seconds. If it fails, the error message
names exactly which env var or step is missing — work back up this
checklist from there.

For the real end-to-end pipeline (not the manual test script): opt the
device into `song_drop` at `instant`, wait for a real T1 event to land (or
manually insert one via Supabase's SQL editor with a 5-min-past
`available_at` to skip the T1 delay), then either wait up to 15 minutes for
Vercel Cron or manually `curl -H "Authorization: Bearer $CRON_SECRET"
https://<your-vercel-domain>/api/notifications/dispatch`.

## 9. T1 kill switch (founder safety net)

If a `song_drop`/`album_news`/`tour_news` event looks like a false
positive, you have up to 5 minutes to stop it:

```
node --env-file=apps/worker/.env scripts/notifications-kill-t1.mjs --list
node --env-file=apps/worker/.env scripts/notifications-kill-t1.mjs --kill <event-id>
```

`--list` shows every pending T1 event and a countdown to when it sends;
`--kill` withdraws one permanently (the router will never send it, even if
the 5-minute window has nearly elapsed).

## What's still open after this (out of Phase 2 scope)

- Play Store service-account access — needed for store submission, not for
  push delivery; tracked separately from this notifications work.
- Digests (Phase 3) shipped — see the section below for what it added.
- Fun notifications (Phase 4), the remaining categories + governor polish
  (Phase 5), web push + analytics (Phase 6) — all read
  `NOTIFICATIONS_PLAN.md` for scope and pick up automatically once their
  own phase starts; none of them need anything beyond what's already
  documented here.

## Phase 3 addendum (digest engine)

Everything below rides on the same env vars items 1-7 already describe —
nothing new to configure. Two things worth knowing:

- The Weekly Clown Report's theory curation
  (`packages/core/src/notification-clownbot-source.ts`) is a clearly-
  flagged STUB, not the real Clownbot-curated ranking the plan describes —
  no such pipeline exists in this repo yet. It queries real
  `live_theory` rows (heat-ordered), so a weekly report never shows
  fabricated content, but the ranking itself is a placeholder rule pending
  a real Clownbot scoring pass. Swap `getTopTheories()`'s body when that
  pipeline exists.
- `digest_queue` rows are cleared only on a successful send — a failed
  FCM send (e.g. before real credentials are set) leaves the queue intact
  so nothing is silently lost; the next dispatch tick retries the same
  merged group.

