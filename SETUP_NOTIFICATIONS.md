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

## 6. Where these env vars actually live (Supabase Edge Function env)

Phase 0 doesn't yet call FCM from an Edge Function (that starts Phase 2's
router) — but `send-test-push.ts` and future phases both expect
`FCM_PROJECT_ID`/`FCM_SERVICE_ACCOUNT_JSON` to live in Supabase's Edge
Function secret store, not committed anywhere:

```
supabase secrets set FCM_PROJECT_ID=<project-id>
supabase secrets set FCM_SERVICE_ACCOUNT_JSON='<paste full JSON>'
```

(via the Supabase CLI, logged in and linked to this project) or the
Supabase dashboard → **Edge Functions → Manage secrets**. This keeps the
service-account credential out of the Next.js client bundle entirely — it
is never read by any `apps/web` code path that ships to a browser.

## 7. Verifying it worked

Once items 1–6 are done:

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

## What's still open after this (out of Phase 0 scope)

- Play Store service-account access — needed for store submission, not for
  push delivery; tracked separately from this notifications work.
- Preference/settings UI (Phase 1), the real send pipeline + governor
  (Phase 2), digests (Phase 3) — all read `NOTIFICATIONS_PLAN.md` for scope
  and pick up automatically once their own phase starts; none of them need
  anything beyond what's already documented here.
