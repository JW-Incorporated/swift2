# STATE — t_edb92b70 (Notifications Phase 6: Web push + analytics, final phase)

## Current task

Notifications Phase 6 implementation complete, scoped strictly to
NOTIFICATIONS_PLAN.md's Phase 6 line item: Web Push (VAPID) + service
worker on longlivets.com registering `platform='web'` devices through the
existing pipeline unchanged; notification-open tracking writing
`deliveries.opened_at`; an internal metrics dashboard (opt-in rate, open
rate by category, mute-within-1h rate, master-off rate); and a flag/report
for any category exceeding the 2% mute-after-push threshold (spec §11).
Phases 0-5 were already merged to `origin/main`; this task also merged the
open Phase 5 PR (#3581, reviewed/approved) since it was the last gate
blocking this final phase.

**This is the final phase of the plan — the full notification system is
now code-complete across all 7 phases (0-6).**

## Web Push implementation (spec §3/§10)

- **No new device-identity schema.** `devices.platform` already accepted
  `'web'` (Phase 0's original check constraint) and `devices.push_token`
  already accepted an arbitrary string — a web device's "token" is its
  serialized `PushSubscription` JSON (`{endpoint, keys:{p256dh,auth}}`).
  `POST /api/devices/register` needed ZERO code changes — this is the
  literal meaning of the scope line "registering platform='web' devices
  through the existing pipeline unchanged."
- `packages/core/src/notification-web-push.ts` — the VAPID sender
  (`sendWebPushBatch`), same contract as the FCM sender: one result per
  input, degrades to a clear per-item failure (never throws) when
  `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` are unset, marks
  404/410 responses as invalid/prunable tokens (mirrors FCM's
  UNREGISTERED/NOT_FOUND bucket).
- `packages/core/src/notification-sender.ts`'s `sendPushBatch` now
  partitions inputs by `platform` — `web` routes to the VAPID sender,
  everything else (the default, every pre-Phase-6 call site) keeps using
  FCM unchanged. Every router/digest/fun/cooldown call site now passes
  `platform: device.platform` through; verified with a new router
  acceptance test proving a `platform='web'` device is routed through
  `sendPushBatch` with `platform: 'web'` and its delivery gets logged with
  the resulting `delivery_token` — same pipeline, same governor, same
  dedupe, same cap logic as iOS/Android.
- `apps/web/public/sw.js` — the service worker: renders the push
  notification from the JSON payload (`{title, body, deepLink,
  deliveryToken}`), and on tap reports the open via `fetch(...,
  {keepalive:true})` to `POST /api/notifications/open` before
  focusing/opening the right page.
- `apps/web/lib/web-push-client.ts` — `subscribeToWebPush()` /
  `unsubscribeFromWebPush()`: persistent localStorage device_id (web's
  equivalent of SecureStore — same accepted-tradeoff posture as
  `apps/mobile/lib/device-id.ts`), permission request, Push subscribe,
  registration through the existing `/api/devices/register` route.
- `apps/web/components/longlive/WebNotificationSettings.tsx` +
  `/settings/notifications` — was a static "get the app" page through
  Phase 1-5 (spec §3: "no anonymous device identity on web yet"); now
  renders the real subscribe flow and, once subscribed, the full settings
  screen against the SAME `/api/devices/:id/prefs` route + `@swift2/shared`
  types the mobile apps already use.

## Open tracking (spec: "notification-open tracking writing deliveries.opened_at")

- New migration `supabase/migrations/20260914000000_notifications_web_push.sql`
  adds `deliveries.delivery_token` (opaque UUID, unique, backfilled on
  every existing row) — a pre-generated per-send correlation id embedded in
  the push payload at send time (both FCM's `data.deliveryToken` and web
  push's JSON body) and stored on the `deliveries` row at insert time. Every
  delivery-insert call site across router/digest/fun/cooldown now writes
  this column.
- `packages/core/src/notification-metrics.ts`'s `markDeliveryOpened()` —
  idempotent lookup-by-token write to `opened_at`; a second call for an
  already-opened delivery reports `alreadyOpened: true` without
  overwriting the first timestamp (both the mobile deep-link handler and
  the web service worker's `notificationclick` can fire this on the same
  tap without double-processing).
- `POST /api/notifications/open` (`apps/web/app/api/notifications/open/route.ts`)
  — the HTTP entry point the service worker calls. Deliberately
  unauthenticated beyond the token itself (a random UUID scoped to exactly
  one delivery); degrades to a soft 200 (`tracked:false`) on any failure
  mode (unconfigured env, unknown token, db error) since this call has no
  UI to show an error in and must never block the user reaching the
  notification's destination.

## Metrics dashboard (spec §11)

- `packages/core/src/notification-metrics.ts` — pure compute functions
  (`computeOpenRateByCategory`, `computeMuteRateByCategory`,
  `computeMetrics`) over already-loaded rows, unit-tested directly with
  hand-built fixtures (adversarial cases: mute AFTER the 1h window doesn't
  count, mute BEFORE the send doesn't count, a mute for a different device
  never counts against this one); `loadMetrics()` is the thin 30-day-window
  DB orchestration layer.
- `MUTE_RATE_FLAG_THRESHOLD = 0.02` (spec §11: "Any push type whose mute
  rate exceeds ~2% gets reviewed") — `computeMetrics().flaggedCategories`
  is the flag/report this phase's scope line asks for.
- `GET /api/notifications/metrics` + `/internal/notifications` (server-
  rendered page) — both gated by a single shared `NOTIFICATIONS_DASHBOARD_SECRET`
  query param rather than a login system (an openable link, not a public
  page or a curl target) — see SETUP_NOTIFICATIONS.md for the tradeoff
  reasoning and setup.
- `optInRate` is honestly labeled a PROXY (devices-with-a-push-token ÷ all
  devices) for spec §11's true metric (opt-in ÷ pre-permission-screen
  viewers) — this app has no event for "viewed the screen but declined,"
  so the dashboard reports what it CAN measure rather than fabricating the
  denominator. Documented in the module, the route, and the page itself.

## Non-negotiable acceptance criteria (per this task's own instructions)

- "A web device receives a digest through the same pipeline" —
  `notification-router.test.ts`'s new ACCEPTANCE test proves a
  `platform='web'` device opted into `song_drop` instant gets routed
  through `sendPushBatch` with `platform: 'web'`, and its delivery is
  logged with the returned `delivery_token` — same governor, same dedupe,
  same everything as iOS/Android, just a different wire at the very last
  step.
- "The dashboard renders real delivery data (use test/seeded data since
  there's no real traffic yet — clearly label it as such)" — the
  dashboard's `hasData: false` state (zero devices) renders an explicit
  "No devices registered yet... every number below is seeded/test data"
  banner rather than misleading zeros; `computeMetrics`'s test suite
  proves the real math against hand-seeded fixtures matching the shape
  real traffic will eventually produce.

## Founder-only remaining (see SETUP_NOTIFICATIONS.md Phase 6 addendum)

1. **VAPID production keypair** — `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
   / `VAPID_SUBJECT` + `NEXT_PUBLIC_VAPID_PUBLIC_KEY` as Vercel env vars. A
   **dev/local keypair was generated tonight** (`node
   scripts/generate-vapid-keys.mjs`, safe within agent authority — this is
   just asymmetric key material, no account/billing, same posture as the
   task's own explicit authorization) purely to prove the send path
   end-to-end in this sandbox; it is NOT committed anywhere and NOT wired
   into any deployed environment, so nothing sends in staging/production
   until this step is done.
2. **NOTIFICATIONS_DASHBOARD_SECRET** — a random 32+ char string as a
   Vercel env var, gating `/internal/notifications`.
3. Everything else from Phases 0-5's founder-only items (Firebase/APNs
   real credentials, Play Store/App Store access) remains as previously
   documented — no new founder-only items beyond 1-2 above.

## Also carried from prior phases (unchanged, restated for completeness)

- **Phase 4 lyric content pool is a DRAFT** (`supabase/seed/lyrics/starter-pool.mjs`,
  224 entries, `verified: false` until founder review) awaiting founder
  review before going live — `lyric_of_day` sends nothing until any row is
  flipped `verified: true`.
- No phase in this initiative has had human eyes on the actual on-device
  UX. **Recommend a full manual walkthrough of the onboarding flow and
  settings screen (both mobile and the new web flow) on a real
  device/browser before this goes to production** — every acceptance
  criterion in this plan has been proven with automated tests and source
  inspection, never a human tapping through the actual experience.

## Verification

- `npm run typecheck` — clean across all 5 workspaces.
- `npm run lint` — 0 errors (2 pre-existing unrelated warnings in
  `scripts/merch-engine/*.test.ts`, untouched by this PR).
- `npx vitest run` (full suite) — 4413 passed, 2 skipped, 2 pre-existing
  failures in `scripts/lib/gh.test.ts` (`Promise.withResolvers`, the same
  Node-version/sandbox issue every prior phase (0-5) documented as
  unrelated to notifications work).
- `npm run build --workspace=@swift2/web` — production build succeeds;
  `/api/notifications/open`, `/api/notifications/metrics`, and
  `/internal/notifications` all present in the route manifest.

## Architect invocations

None this task.
