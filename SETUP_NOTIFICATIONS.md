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
remaining step; no code changes are needed. **Update (2026-09-12, OS-004):**
native sends moved from FCM HTTP v1 to the Expo Push API — see items 2–6.

## What's already built, waiting on these values

- `supabase/migrations/20260909000000_notifications_devices.sql` — the
  `devices` table (spec §9), RLS-locked to `service_role` only.
- `POST /api/devices/register` (`apps/web/app/api/devices/register/route.ts`)
  — upserts a device row; needs `SUPABASE_SERVICE_ROLE_KEY` (item 1 below,
  which already exists for this project — see `apps/worker/.env.example`).
- Native app: `apps/mobile/lib/device-id.ts` (anonymous device_id via
  SecureStore), `apps/mobile/lib/notification-channels.ts` (Android channels
  1:1 with spec §4), `apps/mobile/lib/push-registration.ts` (permission
  request + Expo push token + registration call).
- `packages/core/src/notification-sender.ts` — sends ios/android through the
  **Expo Push API** (OS-004, 2026-09-12). The app registers Expo push tokens
  (`ExponentPushToken[...]`); Expo relays them to FCM (Android) and APNs
  (iOS) using credentials stored on EAS. The server holds no Google or Apple
  secret.
- `scripts/send-test-push.ts` — manual one-off send to a specific
  `device_id`, through the same Expo wire.

## 1. Supabase service-role key — already exists, no new step

`SUPABASE_SERVICE_ROLE_KEY` (+ `SUPABASE_URL`) is the SAME pair
`apps/worker/.env.example` already documents for the news/current worker.
Copy the same values into wherever `POST /api/devices/register` runs
(Vercel project env for `apps/web`, both **not** prefixed
`NEXT_PUBLIC_*` — that would ship it to the browser). If you don't have this
pair handy: Supabase dashboard → this project → Project Settings → API →
"service_role" secret key.

## 2. Firebase project — done 2026-09-12

Android push needs a Firebase project even though Expo does the sending:
the app gets its token from FCM.

- Project ID `longlive-9d2a9`, Android app `ai.jwlabs.longlive` registered.
- `apps/mobile/google-services.json` is committed and wired via
  `app.json` → `android.googleServicesFile`. It is **not** a secret (it's an
  app identifier compiled into every APK). Changing it changes the native
  fingerprint, so it ships with a store build, not an OTA update.
- No iOS app / `GoogleService-Info.plist` is needed — iOS tokens come from
  APNs via Expo, not Firebase.

## 3. FCM v1 service account → EAS (Android delivery)

1. Firebase console → **Project settings → Service accounts → Generate new
   private key**. Treat the JSON like a password; **never commit it**. The
   current one lives at `Desktop/4a-signing/longlive-9d2a9-firebase-adminsdk-*.json`
   on Wyatt's machine.
2. Upload it to EAS: `cd apps/mobile && eas credentials -p android` →
   production → **Google Service Account → Manage your Google Service
   Account Key for Push Notifications (FCM V1)** → upload the JSON. (Or
   expo.dev → project → Credentials → Android → `ai.jwlabs.longlive` → FCM
   V1 service account key.)

## 4. APNs key → EAS (iOS delivery)

1. Apple Developer portal → **Certificates, Identifiers & Profiles → Keys →
   +**, tick **Apple Push Notifications service (APNs)**, register, and
   download the `.p8` immediately (one download only). Note the **Key ID**.
   Team ID is `D9N628AFHS`. The App Store Connect API key
   (`AuthKey_QU7P2WC49Z.p8`) is a different key and is rejected by APNs.
2. Upload it to EAS: `eas credentials -p ios` → production → **Push
   Notifications: Manage your Apple Push Notifications Key** → use an
   existing key (.p8 + Key ID). (Or expo.dev → Credentials → iOS.)

## 5. Where the server-side env vars live

Phase 2's router (`GET /api/notifications/dispatch`,
`packages/core/src/notification-sender.ts`) runs as a **Vercel** API route.
Set these as **Vercel project env vars**, never prefixed `NEXT_PUBLIC_*`:

```
CRON_SECRET=<a random 32+ char string you generate — e.g. `openssl rand -hex 32`>
EXPO_ACCESS_TOKEN=<optional — see item 6>
```

`CRON_SECRET` makes Vercel Cron send `Authorization: Bearer $CRON_SECRET`
on every scheduled call to `/api/notifications/dispatch` (every 15 min in
`apps/web/vercel.json`'s `crons` array) — the route returns 401/503 without
it, so nothing sends until this is set.

The old `FCM_PROJECT_ID` / `FCM_SERVICE_ACCOUNT_JSON` vars are no longer
read by anything; delete them wherever they were set.

## 6. Optional: enhanced push security

By default anyone holding a device's Expo push token can send to it. To
require a secret: expo.dev → Account settings → Access tokens → create a
robot token, set it as `EXPO_ACCESS_TOKEN` (Vercel + `apps/worker/.env`),
**then** turn on "Enhanced Security for Push Notifications" in the EAS
project settings. Turning it on before the env var is set stops every send.

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

Once items 1–7 are done (item 6 optional):

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

## Phase 4 addendum (fun notifications)

Rides on the same env vars items 1-7 already describe — nothing new to
configure. One thing that DOES need founder action:

- **The lyric pool is a DRAFT.** `supabase/seed/lyrics/starter-pool.mjs`
  has 224 single-line lyric excerpts, one per released track, written from
  general knowledge — NOT verified against a licensed lyrics source
  line-by-line. Every row's `verified` column defaults to `false`; the
  dispatch job (`notification-fun.ts`'s `selectLyricForDevice`) never
  sends an unverified row. **Before running `npm run db:seed:lyrics`
  against production, review the pool and flip `verified: true` on rows
  you've confirmed** (or wait for a future pass that does this in bulk
  against a real lyrics API/license). Until any row is verified,
  `lyric_of_day` sends nothing — it degrades cleanly, same pattern as
  every other unconfigured-dependency path in this system.
- `on_this_day` content (`supabase/seed/on-this-day/starter-pool.mjs`) is
  NOT a review item — it's derived directly from the site's own shipped
  `MILESTONES` timeline, so no new fact-checking is needed before seeding
  it with `npm run db:seed:on-this-day`.
- The countdown scheduler needs a producer to actually set `events.
  drop_at` before it does anything — no producer sets it yet in this
  repo (that's a future/Phase 5+ concern), so `countdown_sends` will stay
  empty and `countdowns`-opted-in devices will simply never receive a
  countdown until one does. This is expected, not a bug.

## Phase 6 addendum (web push + analytics)

Web Push, open tracking, and the internal metrics dashboard. Three new
things need founder action; everything else (the service worker, the
subscribe flow, the pipeline reuse) is already built and needs no further
code changes once these are set.

### 1. VAPID keypair — required for real web push to send

VAPID (Voluntary Application Server Identification) is Web Push's
equivalent of the FCM service-account key: it proves to the browser's push
service (Chrome uses FCM under the hood for web too; Firefox uses Mozilla's
autopush) that pushes are coming from this app, with no separate account
or billing to set up — it's just a keypair.

1. Generate one: `node scripts/generate-vapid-keys.mjs` (wraps the
   `web-push` package's own generator — the SAME package
   `packages/core/src/notification-web-push.ts` uses to send, so the keys
   it prints are guaranteed compatible). **A dev/local keypair was already
   generated for staging use tonight** — see item 4 below; this step is
   for founder to generate the PRODUCTION pair (or explicitly decide to
   keep the dev one — see that note).
2. Set as **Vercel project env vars** (Project Settings → Environment
   Variables), same posture as every other secret in this doc:
   ```
   VAPID_PUBLIC_KEY=<public half>
   VAPID_PRIVATE_KEY=<private half — never NEXT_PUBLIC_*>
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=<same public half — this ONE IS meant to be public>
   VAPID_SUBJECT=mailto:ops@longlivets.com
   ```
   `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is genuinely safe to expose — it's the
   public half of an asymmetric keypair, the same way a TLS certificate's
   public key ships to every visitor. Only `VAPID_PRIVATE_KEY` is secret.
3. That's it — no Firebase/Apple/Google account needed for web push
   specifically (Chrome/Firefox handle their own push infrastructure
   transparently once VAPID identifies the sender).

### 2. Metrics dashboard secret

The internal dashboard (`/internal/notifications?secret=...`, backed by
`GET /api/notifications/metrics`) is gated by a single shared secret
rather than a login system — it's meant to be an openable link, not a
public page.

```
NOTIFICATIONS_DASHBOARD_SECRET=<a random 32+ char string — e.g. `openssl rand -hex 32`>
```

Set as a Vercel project env var. Once set, the dashboard is reachable at
`https://<your-vercel-domain>/internal/notifications?secret=<that value>`
— bookmark that full URL, don't share the bare `/internal/notifications`
path.

### 3. Nothing else — the pipeline is unchanged

`platform: 'web'` devices register through the SAME
`POST /api/devices/register` route Phase 0 built (no schema change — a web
device's "push token" is its serialized `PushSubscription` JSON stored in
the exact same `devices.push_token` column an FCM token uses), get the
same prefs API, and get sent through the same
`packages/core/src/notification-sender.ts` `sendPushBatch()` every other
phase already calls — it just now branches on `platform` to route `web`
devices to `notification-web-push.ts`'s VAPID sender instead of FCM. No
env vars beyond items 1-2 above are needed for the send path itself.

### 4. What's already built, waiting on VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY

- `apps/web/public/sw.js` — the service worker: renders the push
  notification, and on tap reports the open to
  `POST /api/notifications/open` then focuses/opens the right page.
- `apps/web/lib/web-push-client.ts` — `subscribeToWebPush()` /
  `unsubscribeFromWebPush()`: registers the service worker, asks
  permission, subscribes to Push, registers the device.
- `apps/web/components/longlive/WebNotificationSettings.tsx` +
  `/settings/notifications` — the real settings screen once subscribed
  (was a static "get the app" page through Phase 1-5).
- `packages/core/src/notification-web-push.ts` — the VAPID sender,
  degrades to a clear per-item failure (not a throw) exactly like the FCM
  sender does when its env vars are unset — **a dev/local VAPID keypair
  was generated tonight** (not committed anywhere in this repo or its
  history) purely to prove the send path end-to-end in this sandbox; it is
  NOT wired into any deployed environment's Vercel env, so nothing sends
  in staging/production until a founder completes item 1 above with either
  that same pair (fine for continued dev/staging use) or a fresh one.
- `packages/core/src/notification-metrics.ts` — the dashboard's query +
  compute layer (open rate, mute-within-1h rate, master-off rate,
  opt-in-rate proxy, and the >2% mute-rate flag from spec §11).
- `supabase/migrations/20260914000000_notifications_web_push.sql` — adds
  `deliveries.delivery_token` (the opaque per-send id the service worker
  reports back on open) and a covering index for the dashboard's queries.
  No new device-identity table — see notification-web-push.ts's header
  comment for why.

### 5. Verifying it worked

Once VAPID + the dashboard secret are set:

```
# 1. Visit https://<domain>/settings/notifications, click "Enable
#    notifications", accept the browser's permission prompt.
# 2. Confirm a devices row landed with platform='web' and a push_token
#    (Supabase SQL editor, or check the network tab's
#    /api/devices/register response).
# 3. Send it a real event through the normal pipeline (opt into song_drop
#    at instant, insert/await a real event) OR run scripts/send-test-push.ts
#    against that device_id — the router already treats platform='web'
#    devices identically, no separate test script needed.
# 4. Click the resulting browser notification — deliveries.opened_at
#    should be set within a few seconds (Supabase SQL editor).
# 5. Visit /internal/notifications?secret=<your secret> — should render
#    real numbers once there's delivery history (seeded/test data is
#    clearly labeled "no data yet" before that).
```


