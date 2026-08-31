# NOTIFICATIONS_PROMPTS.md — Claude Code Execution Prompts

One prompt per phase of `NOTIFICATIONS_PLAN.md`. Before running: commit both `NOTIFICATIONS_SPEC.md` and `NOTIFICATIONS_PLAN.md` to the repo root. Run prompts sequentially, one per fresh session (or `/clear` between). Each prompt scopes Claude Code to exactly one phase and requires acceptance criteria to pass before finishing.

---

## Phase 0 — Foundations

```
Read NOTIFICATIONS_SPEC.md and NOTIFICATIONS_PLAN.md, plus CLAUDE.md, STATE.md, and MAP.md for repo conventions. Implement Phase 0 of the plan ONLY — do not start Phase 1.

Scope: FCM setup, anonymous device_id generation and persistence in both native apps, the `devices` table migration (spec §9), POST /api/devices/register, Android notification channels mapped 1:1 to spec §4 categories, and scripts/send-test-push.ts.

First, inspect the repo to determine what framework the native apps use (spec §12 Q1) and adapt the client SDK work accordingly. State what you found before writing code.

Some steps need me, not you: creating the Firebase project, uploading the APNs auth key, and setting the FCM service-account secret. For each, write exact step-by-step instructions into a new SETUP_NOTIFICATIONS.md and stub the env vars — never put the FCM service account anywhere reachable by the Next.js client bundle.

Done means the Phase 0 acceptance criteria in the plan are verifiable: fresh install registers a devices row, the test script sends to a real token, token refresh re-upserts. Write automated tests where possible; list any criteria that need a physical device so I can verify manually. Update STATE.md and MAP.md when finished.
```

## Phase 1 — Preferences & Settings UI

```
Read NOTIFICATIONS_SPEC.md and NOTIFICATIONS_PLAN.md, plus CLAUDE.md, STATE.md, and MAP.md. Phase 0 is complete. Implement Phase 1 ONLY.

Scope: `notification_prefs` migration plus device-level settings columns, GET/PUT prefs API with batch read/write, the full settings screen in both native apps per spec §8 (master switch, snooze 24h/1wk, daily limit, quiet hours, digest time, grouped category rows with cadence pills and preview text), the persistent bell icon in the app header, the /settings/notifications web page, and the OS-permission-denied banner with deep link.

Hard UX requirements from the spec: changes apply instantly with no save button; the cadence control is a single segmented pill row (Instant · Daily · Weekly · Off; fun categories swap Instant for Monthly); category rows are grouped News / Merch / Community / Fun. Use the preview text examples from the spec §4 table.

Done means Phase 1 acceptance criteria pass: every control round-trips to Supabase and survives app restart. Write tests for the API layer; flag anything needing on-device verification. Update STATE.md and MAP.md.
```

## Phase 2 — Instant pipeline + onboarding

```
Read NOTIFICATIONS_SPEC.md and NOTIFICATIONS_PLAN.md, plus CLAUDE.md, STATE.md, and MAP.md. Phases 0–1 are complete. Implement Phase 2 ONLY.

Scope: `events` and `deliveries` migrations, an insertEvent() producer helper with dedupe_key, wiring the existing scraper/automation pipelines to produce events for song_drop, album_news, tour_news, official_merch, official_youtube, the router Edge Function (instant fan-out by prefs), Governor v1 exactly per spec §6 gates 1–4 (master/snooze, quiet-hours hold, 30-min coalescing, daily cap) with delivery logging, batched FCM sender with retry and invalid-token pruning, deep links plus the "Mute this type" and "Settings" notification actions, the pre-permission onboarding screen with the three presets from spec §7, and the 5-minute T1 send delay with a kill/alert hook.

Before wiring producers, map where the existing scraper pipelines emit detections and show me the seam you plan to use — keep coupling to one helper call.

The governor is the most safety-critical code in this system: unit-test every gate, including the cap-overflow and quiet-hours-hold paths. Done means Phase 2 acceptance criteria in the plan pass, with dedupe verified by inserting the same event twice. Update STATE.md and MAP.md.
```

## Phase 3 — Digest engine

```
Read NOTIFICATIONS_SPEC.md and NOTIFICATIONS_PLAN.md, plus CLAUDE.md, STATE.md, and MAP.md. Phases 0–2 are complete. Implement Phase 3 ONLY.

Scope: `digest_queue` migration, router update so daily/weekly prefs enqueue instead of send, the pg_cron → Edge Function digest job (every 15 min: build due digests per device, merge ALL categories into one push, respect digest_hour and device timezone), the digest copy generator with "Manage notifications" footer, "The Weekly Clown Report 🤡" branding for the weekly easter_egg digest using a Clownbot top-theories query, cap-overflow rollover into the next digest, and the in-app inbox showing all events regardless of push prefs.

Non-negotiable behavior: a device with multiple categories on Daily gets exactly ONE merged push per day, never one per category.

Timezone correctness is the biggest risk here — write tests covering at least three timezones including a DST transition day, verifying no double-send and no zero-send. Done means Phase 3 acceptance criteria pass. Update STATE.md and MAP.md.
```

## Phase 4 — Fun notifications

```
Read NOTIFICATIONS_SPEC.md and NOTIFICATIONS_PLAN.md, plus CLAUDE.md, STATE.md, and MAP.md. Phases 0–3 are complete. Implement Phase 4 ONLY.

Scope: `lyrics`, `lyric_history`, and `on_this_day` migrations; seed content (a curated lyric pool of a few hundred entries — generate a starter list for my review rather than finalizing it yourself, and seed on_this_day from the repo's existing timeline/era data); the cron additions sending fun notifications at each device's digest_hour per its cadence; the 12-month per-device lyric no-repeat rule; on_this_day silently skipping dates with no entry; the countdown scheduler creating T-7d / T-1d / release-hour sends from announced-drop events for opted-in devices; and the Fun section settings rows with Daily/Weekly/Monthly pills.

Done means Phase 4 acceptance criteria pass — build the 30-day simulation test from the plan (correct counts per cadence, zero lyric repeats, empty on_this_day dates send nothing). Update STATE.md and MAP.md.
```

## Phase 5 — Remaining categories + governor polish

```
Read NOTIFICATIONS_SPEC.md and NOTIFICATIONS_PLAN.md, plus CLAUDE.md, STATE.md, and MAP.md. Phases 0–4 are complete. Implement Phase 5 ONLY.

Scope: wire event producers for relationship_news, public_appearance, award_news, fan_merch, and instant-tier easter_egg using the same insertEvent() seam from Phase 2; the auto-cooldown job (devices with no notification opens in 30 days get Instant categories downgraded to Daily plus one notice push, per spec §6); and enforcement of the 6/day hard ceiling with tests.

Done means all spec §4 categories deliver end-to-end and the cooldown job is verified against a seeded stale device per the plan's acceptance criteria. Update STATE.md and MAP.md.
```

## Phase 6 — Web push + analytics

```
Read NOTIFICATIONS_SPEC.md and NOTIFICATIONS_PLAN.md, plus CLAUDE.md, STATE.md, and MAP.md. Phases 0–5 are complete. Implement Phase 6 ONLY.

Scope: Web Push with VAPID keys and a service worker on longlivets.com, registering platform='web' devices through the existing pipeline unchanged; notification-open tracking writing deliveries.opened_at; an internal metrics dashboard (opt-in rate, open rate by category, mute-within-1h rate, master-off rate); and a flag/report for any category exceeding the 2% mute-after-push threshold from spec §11.

VAPID key generation needs me — add instructions to SETUP_NOTIFICATIONS.md and stub the env vars.

Done means Phase 6 acceptance criteria pass: a web device receives a digest through the same pipeline, and the dashboard renders real delivery data. Update STATE.md and MAP.md, and mark the plan complete in STATE.md.
```
