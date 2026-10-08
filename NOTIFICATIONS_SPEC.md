# NOTIFICATIONS_SPEC.md — Longlivets Notification System

**Repo:** JW-Incorporated/swift2 · **Deploy:** Vercel `swift2-web` (Next.js + Supabase) · **Clients:** iOS + Android native apps (launching), web later
**Status:** Draft v1 · **Owner:** Joey

---

## 1. Goals & Principles

Notifications are the engagement and retention backbone for the app launch. Three non-negotiable principles:

1. **Never spam.** Every outbound push passes through a governor (caps, coalescing, quiet hours). No exceptions, including "breaking" events.
2. **Radically settings-friendly.** From any notification, the user is ≤2 taps from the exact setting that controls it. From anywhere in the app, ≤1 tap (persistent bell icon).
3. **Anonymous-first.** No login required. Identity = anonymous device. Accounts are a later, optional layer for cross-device sync.

## 2. Identity Model (No Login Required)

- On first launch, the app generates a UUID `device_id` and persists it locally (Keychain / EncryptedSharedPreferences so it survives app updates).
- When the user grants push permission, the app registers `(device_id, platform, push_token, timezone, locale)` with the backend.
- All preferences are keyed to `device_id`. No email, no password, no PII.
- **Known tradeoffs (accepted for v1):** preferences don't sync across a user's devices; uninstall/reinstall resets preferences. 
- **Future-proofing:** the schema includes a nullable `user_id` on `devices`. If/when accounts ship, linking a device to a user migrates prefs with zero schema changes.

## 3. Channels & Provider

- **iOS + Android:** Firebase Cloud Messaging (FCM HTTP v1). FCM fronts APNs, so one send path covers both platforms. Free at any scale, no vendor lock beyond Google.
- **Web push:** Phase 6 (post-launch). Same event pipeline, Web Push API + service worker on longlivets.com.
- **Android notification channels** map 1:1 to our categories, so the OS-level settings screen mirrors the in-app one. iOS has no per-channel OS toggle; our in-app settings are the source of truth there.
- *Alternative considered:* OneSignal (buys digests/caps/quiet-hours out of the box, costs money at scale, vendor lock). Rejected because the governor + digest logic is the differentiating part of this system and fits the existing Supabase/automation stack.

## 4. Categories

Priority tiers drive governor behavior (§6). **T1 = rare + huge**, T2 = notable, T3 = nice-to-know, FUN = opt-in delight.

| ID | Name | Tier | Cadences | Default* | Example |
|---|---|---|---|---|---|
| `song_drop` | New song drop | T1 | Instant · Daily · Weekly · Off | Instant | "🚨 NEW SONG. 'Imgonnagetyouback (Live)' is out NOW →" |
| `album_news` | Album & re-recording announcements | T1 | Instant · Daily · Weekly · Off | Instant | "SHE ANNOUNCED IT. New album Oct 13 →" |
| `tour_news` | Tour dates & ticket sales | T1 | Instant · Daily · Weekly · Off | Instant | "Tour dates just dropped — 3 shows near you? →" |
| `official_youtube` | Official Taylor YouTube drop | T2 | Instant · Daily · Weekly · Off | Daily | "New on Taylor's channel: BTS of the video shoot →" |
| `official_merch` | Official merch drop | T2 | Instant · Daily · Weekly · Off | Daily | "New in the official store: 1989 crewneck restock →" |
| `relationship_news` | Relationship news | T2 | Instant · Daily · Weekly · Off | Daily | "Update: Taylor & Travis spotted at… →" |
| `public_appearance` | Public appearances & interviews | T2 | Instant · Daily · Weekly · Off | Daily | "Taylor confirmed for tonight's game →" |
| `award_news` | Awards & nominations *(added)* | T3 | Instant · Daily · Weekly · Off | Weekly | "6 Grammy nominations this morning →" |
| `fan_merch` | New fan merch | T3 | Instant · Daily · Weekly · Off | Weekly | "12 new fan-made pieces this week, top pick inside →" |
| `easter_egg` | Easter egg theories | T3 | Instant · Daily · Weekly · Off | Weekly | Weekly digest branded **"The Weekly Clown Report 🤡"** — top theories, Clownbot-curated |

*Defaults apply only after explicit opt-in during onboarding (§7). Nothing is on before permission + preset selection.

`public_appearance` intentionally absorbs TV/interview appearances — splitting them doubles settings rows for the same mental category.

### Fun categories (all OFF by default, opt-in only)

| ID | Name | Cadences | Notes |
|---|---|---|---|
| `lyric_of_day` | Song lyric of the day | Daily · Weekly · Monthly · Off | Curated lyric pool; no repeats within 12 months per device; deep-links to song page |
| `on_this_day` | On this day | Daily · Weekly · Monthly · Off | "On this day in 2014, 1989 was released 🕰️"; skips dates with no good entry rather than sending filler |
| `swiftie_trivia` | Swiftie trivia *(proposed)* | Daily · Weekly · Monthly · Off | Question in the push, tap to reveal answer in-app — strong open-rate mechanic |
| `countdowns` | Drop countdowns *(proposed)* | On · Off | Event-driven, not scheduled: T-7d, T-1d, and release-hour reminders for *announced* drops only. Self-limiting, high value |
| `surprise_songs` | Surprise song log *(proposed)* | On · Off | Tour nights only: "Tonight's surprise songs: 'The Lucky One' + 'Haunted' 🎹". Dormant between tours — zero spam risk |

## 5. Cadence Model (the frequency toggle)

One consistent control everywhere: a **segmented pill row** under each category — `Instant · Daily · Weekly · Off` (fun categories: `Daily · Weekly · Monthly · Off`). One mental model, no nested menus.

- **Instant** — sent as it happens, subject to the governor.
- **Daily** — events accumulate in a digest sent at the user's digest time (default 9:00 AM local, adjustable). One push summarizes everything: "Today in Taylor: new video, merch restock, 2 theories →".
- **Weekly** — same, sent Friday at digest time.
- **Off** — nothing, and the category's events silently appear in an in-app inbox (§8) so nothing is ever *lost*, just quiet.

Digests **merge across categories**: a user with 4 categories on Daily gets **one** combined daily push, never four.

## 6. Anti-Spam Governor

Every push passes these gates, in order:

1. **Master switch & snooze** — respects global off and "Pause all (24h / 1 week)".
2. **Quiet hours** — default 10 PM–8 AM device-local, user adjustable. T1 events queue and deliver at quiet-hours end ("While you were sleeping: 🚨 new song"). Nothing bypasses quiet hours.
3. **Coalescing** — multiple events, same category, within 30 min → one push ("3 new songs just dropped →"). Uses `dedupe_key` to also kill duplicate detections from the scraper pipeline.
4. **Daily cap** — default **max 3 instant pushes/day** per device (user adjustable 1–5 in settings as "Daily limit"). Overflow rolls into the next digest. Scheduled digests and fun notifications the user explicitly chose count separately (they asked for exactly those), but combined instant+scheduled can never exceed 6/day, hard ceiling.
5. **Send-time sanity** — digests and fun notifications only fire between 8 AM–9 PM local.

**Auto-cooldown (proposed):** if a device hasn't opened any notification in 30 days, downgrade its Instant categories to Daily and send one final "We've quieted things down — tap to adjust" push. Prevents the silent-annoyance → uninstall path.

## 7. Permission & Onboarding Flow

Never fire the OS permission dialog cold on first launch — a denial there is nearly unrecoverable on iOS.

1. Let the user browse first. Trigger the ask at a **value moment** (finished onboarding, viewed 3+ pages, or tapped anything labeled "notify me").
2. Show a **pre-permission screen** with three presets:
   - **Just the big stuff** — T1 instant, everything else off
   - **Daily Swiftie** — T1 instant, T2 daily digest, weekly Clown Report
   - **Full Clown 🤡** — everything on at defaults + lyric of the day
   - plus "Customize" → full settings screen
3. Only after a preset/custom choice, fire the real OS dialog.
4. If denied: no nagging. Settings screen shows a "Notifications are off in system settings" banner with a deep link to OS settings.

## 8. Settings UX Requirements

- **Persistent bell icon** in the app header on every screen → Notification Settings. Same screen at `/settings/notifications` on web.
- Screen layout, top to bottom: master switch → snooze buttons → daily limit → quiet hours + digest time → category list (grouped: News / Merch / Community / Fun), each row = name, one-line description, example preview text, cadence pills.
- **Changes apply instantly** — no save button.
- **Every notification deep-links to relevant content**, and every notification carries an action (long-press on iOS / expanded on Android): **"Mute this type"** (one tap → sets category Off, shows undo toast) and **"Settings"**.
- Every digest ends with a "Manage notifications" line.
- **In-app inbox**: a chronological feed of everything notification-worthy regardless of push settings. Makes "Off" feel safe — you can always catch up.

## 9. Data Model (Supabase)

```sql
create table devices (
  id uuid primary key,                    -- client-generated device_id
  user_id uuid null,                      -- future accounts; null for anonymous
  platform text not null check (platform in ('ios','android','web')),
  push_token text,
  tz text not null default 'America/Los_Angeles',
  locale text,
  app_version text,
  master_enabled boolean not null default true,
  snooze_until timestamptz,
  daily_cap smallint not null default 3,
  quiet_start smallint not null default 22,   -- local hour
  quiet_end smallint not null default 8,
  digest_hour smallint not null default 9,
  created_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create table notification_prefs (
  device_id uuid references devices(id) on delete cascade,
  category text not null,
  cadence text not null check (cadence in ('instant','daily','weekly','monthly','on','off')),
  updated_at timestamptz default now(),
  primary key (device_id, category)
);

create table events (                     -- written by scrapers/automation
  id uuid primary key default gen_random_uuid(),
  category text not null,
  tier smallint not null,
  title text not null,
  body text not null,
  deep_link text not null,
  dedupe_key text unique,                 -- kills duplicate detections
  created_at timestamptz default now(),
  expires_at timestamptz                  -- stale events never send
);

create table digest_queue (
  device_id uuid references devices(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  scheduled_for timestamptz not null,
  primary key (device_id, event_id)
);

create table deliveries (                 -- powers caps + analytics
  id bigint generated always as identity primary key,
  device_id uuid references devices(id) on delete cascade,
  event_id uuid,
  kind text not null,                     -- instant | digest | fun
  category text,
  sent_at timestamptz default now(),
  opened_at timestamptz
);

-- Fun content
create table lyrics (id bigint primary key, song text, album text, lyric text, times_used int default 0);
create table lyric_history (device_id uuid, lyric_id bigint, sent_at timestamptz, primary key (device_id, lyric_id));
create table on_this_day (month smallint, day smallint, year smallint, text text, deep_link text);
```

## 10. Send Pipeline

```
Scrapers / Clownbot / merch engines
        │  insert (dedupe_key)
        ▼
     events ──► Router (per-device fan-out by prefs)
                  ├── instant ──► GOVERNOR ──► FCM sender ──► deliveries
                  └── daily/weekly ──► digest_queue
Cron (every 15 min, pg_cron + Supabase Edge Function):
  1. Build & send due digests (group by device, merge categories)
  2. Send due fun notifications (lyric/on-this-day/trivia) at digest_hour
  3. Flush quiet-hours-held T1 events
  4. Prune expired events, stale tokens (FCM UNREGISTERED → clear token)
```

- Runs as **Supabase Edge Functions + pg_cron** (keeps compute next to the data; Vercel cron is the fallback).
- The existing automation pipelines (Clownbot ingestion, merch discovery, moment→product matching) become event *producers* — they just insert rows into `events`. Clean seam, no coupling.
- Batched FCM sends (500 tokens/request); retries with backoff; invalid tokens pruned on response.

## 11. Metrics

**Success:** permission opt-in rate (target >60% of pre-permission screen viewers), notification open rate by category, D7/D30 retention of notification-enabled vs. disabled devices.
**Guardrails (watch like a hawk):** category mute rate within 1h of a push, master-switch-off rate, OS-level disable rate, uninstalls within 24h of a push. Any push type whose mute rate exceeds ~2% gets reviewed.

## 12. Open Questions

1. What framework are the native apps built with (Swift/Kotlin vs. React Native/Expo vs. Capacitor)? Changes the client SDK work in Phase 0, nothing else.
2. Who/what approves T1 events before send — fully automated, or a 1-tap human confirm for the highest-blast notifications? (Recommend: automated with a 5-min delay + Slack/phone alert for song/album/tour, so a false positive can be killed.)
3. Lyric licensing comfort level: single-line lyric excerpts in pushes are common practice but technically reproduce copyrighted text — worth a quick position before launch.
