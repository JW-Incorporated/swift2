# NOTIFICATIONS_PLAN.md — Implementation Plan

Companion to `NOTIFICATIONS_SPEC.md`. Written for agentic execution (Claude Code) in JW-Incorporated/swift2. Phases are sequential; tasks within a phase can be parallelized across subagents. Update STATE.md at each phase boundary.

**Launch-critical path: Phases 0–3.** Ship the app with those; 4–6 follow post-launch.

---

## Phase 0 — Foundations (infra & device registry)

**Goal:** a device can register and receive a manual test push on iOS + Android.

- [ ] Create Firebase project; enable FCM HTTP v1; upload APNs auth key (requires Apple Developer account access)
- [ ] Add push capability + FCM SDK to both native apps; implement anonymous `device_id` generation (Keychain / EncryptedSharedPreferences)
- [ ] Supabase migration: `devices` table (spec §9)
- [ ] API route `POST /api/devices/register` — upsert device with token, tz, locale, platform
- [ ] Service-account secret for FCM in Supabase Edge Function env (never in the Next.js client bundle)
- [ ] Android: define notification channels 1:1 with categories
- [ ] Script `scripts/send-test-push.ts` for manual sends

**Acceptance:** fresh install on both platforms registers a row in `devices`; test script delivers a push to each; token refresh re-upserts correctly.

## Phase 1 — Preferences & Settings UI

**Goal:** full settings screen working end-to-end, even before anything sends.

- [ ] Migration: `notification_prefs` + device-level settings columns
- [ ] API: `GET/PUT /api/devices/:id/prefs` (batch read/write, instant apply)
- [ ] Settings screen (both apps): master switch, snooze (24h/1wk), daily limit, quiet hours, digest time, grouped category rows with cadence pills + preview text (spec §8)
- [ ] Persistent bell icon in app header → settings
- [ ] Web: `/settings/notifications` page (same API; manages web push later, for now shows "get the app")
- [ ] "Notifications disabled in system settings" banner + OS-settings deep link

**Acceptance:** every control round-trips to Supabase and survives app restart; changing a pill takes effect with no save button; a denied-permission device sees the banner.

## Phase 2 — Instant pipeline + onboarding (launch categories)

**Goal:** real notifications for `song_drop`, `album_news`, `tour_news`, `official_merch`, `official_youtube`.

- [ ] Migrations: `events`, `deliveries`
- [ ] Event producer seam: `insertEvent()` helper with `dedupe_key`; wire the existing scraper/automation pipelines (Clownbot ingestion, merch discovery) to call it for launch categories
- [ ] Router Edge Function: fan out new events to devices by prefs (instant only for now)
- [ ] Governor v1: master/snooze check, quiet-hours hold, 30-min coalescing, daily cap, delivery logging
- [ ] Batched FCM sender with retry + invalid-token pruning
- [ ] Deep links: every category → its in-app destination; notification actions "Mute this type" + "Settings"
- [ ] Onboarding: pre-permission screen with three presets (spec §7), permission ask at value moment
- [ ] T1 safety: 5-min send delay + alert hook so a false-positive song/album event can be killed

**Acceptance:** inserting a `song_drop` event delivers to opted-in devices only, once (dedupe verified); a device at its daily cap receives nothing more; quiet-hours event arrives at 8 AM local; "Mute this type" sets the category Off with undo.

## Phase 3 — Digest engine

**Goal:** Daily/Weekly cadences actually work; this is the spam-proofing payoff.

- [ ] Migration: `digest_queue`
- [ ] Router update: daily/weekly prefs enqueue instead of send
- [ ] Cron (pg_cron every 15 min → Edge Function): build due digests per device, merge all categories into one push, respect digest_hour + tz
- [ ] Digest copy generator: "Today in Taylor: …" summarizing queued events, "Manage notifications" footer
- [ ] Weekly `easter_egg` digest branded as "The Weekly Clown Report 🤡" (curation via Clownbot top-theories query)
- [ ] Cap-overflow instant events roll into next digest
- [ ] In-app inbox: chronological feed of all events regardless of push prefs

**Acceptance:** a device with 4 categories on Daily gets exactly one merged push at its digest hour; timezone math verified for ≥3 tz including DST edge; Off-category events still appear in the inbox.

## Phase 4 — Fun notifications

**Goal:** `lyric_of_day` and `on_this_day` live; at least one proposed extra (`countdowns` recommended first — event-driven and self-limiting).

- [ ] Migrations + content: `lyrics` (curated pool, few hundred to start), `on_this_day` (seed from existing timeline/era data), `lyric_history`
- [ ] Cron: send fun notifications at digest_hour per cadence; lyric no-repeat-in-12-months per device; on_this_day skips empty dates silently
- [ ] Countdown scheduler: on announced-drop events, auto-create T-7d / T-1d / release-hour sends for opted-in devices
- [ ] Settings: Fun section rows with Daily/Weekly/Monthly pills

**Acceptance:** 30-day simulated run for one device produces correct counts per cadence with zero lyric repeats; a date with no on-this-day entry sends nothing.

## Phase 5 — Remaining categories + governor polish

- [ ] Wire producers for `relationship_news`, `public_appearance`, `award_news`, `fan_merch`, `easter_egg` instant tier
- [ ] Auto-cooldown job: 30-day non-openers downgraded Instant→Daily with one notice push (spec §6)
- [ ] Hard ceiling (6/day combined) enforcement + tests

**Acceptance:** all spec §4 categories deliverable end-to-end; cooldown job verified against a seeded stale device.

## Phase 6 — Web push + analytics

- [ ] Web Push (VAPID) + service worker on longlivets.com; `platform='web'` devices reuse the entire pipeline
- [ ] Open tracking: notification-open callback → `deliveries.opened_at`
- [ ] Metrics dashboard (simple internal page or Supabase queries): opt-in rate, open rate by category, mute-within-1h rate, master-off rate
- [ ] Review loop: flag any category with >2% mute-after-push rate

**Acceptance:** web device receives a digest; dashboard shows real numbers from launch traffic.

---

## Risks & watch items

- **False-positive T1 events** (scraper misfires "new album" to every device) — mitigated by dedupe keys, the 5-min T1 delay, and expiry timestamps. Highest-severity risk; test deliberately.
- **iOS permission denial is sticky** — the pre-permission screen is not optional polish, it's the whole ballgame for opt-in rate.
- **Timezone/DST bugs** silently double- or zero-send digests — acceptance tests must cover DST transitions.
- **Token hygiene** — prune on FCM UNREGISTERED or deliveries will inflate and batches will slow.
- **Unknown:** native app framework (spec §12 Q1) — resolve before Phase 0 estimates firm up.
