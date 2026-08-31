-- Notifications Phase 4 (NOTIFICATIONS_PLAN.md, NOTIFICATIONS_SPEC.md §4/§9):
-- Fun content tables — `lyrics`, `lyric_history`, `on_this_day`. Powers the
-- `lyric_of_day` and `on_this_day` fun categories (Daily/Weekly/Monthly
-- cadence, opt-in only, off by default).
--
-- AUTH POSTURE: same as every other notifications table — service_role
-- only. RLS enabled, no anon/authenticated policies. The fun-content
-- dispatch job (packages/core/src/notification-fun.ts, called from the
-- same `/api/notifications/dispatch` route Phase 2/3 already wired) is the
-- sole reader/writer.

create table if not exists public.lyrics (
  id         bigint generated always as identity primary key,
  slug       text not null unique,          -- TrackNote slug (deep-link target)
  song       text not null,
  album      text not null,
  lyric      text not null,
  -- Set true only after a human has verified the line against the actual
  -- released lyric (see supabase/seed/lyrics/starter-pool.mjs's DRAFT
  -- caveat). The fun dispatch job never sends an unverified row in
  -- production — see notification-fun.ts's ALLOW_UNVERIFIED_LYRICS guard.
  verified   boolean not null default false,
  times_used int not null default 0,
  created_at timestamptz not null default now()
);

-- One row per (device, lyric) — powers the 12-month per-device no-repeat
-- rule (spec §4: "no repeats within 12 months per device"). A device that
-- has exhausted every verified lyric within the lookback window simply
-- gets no lyric_of_day send that cycle (never a repeat, never a crash).
create table if not exists public.lyric_history (
  device_id uuid not null references public.devices(id) on delete cascade,
  lyric_id  bigint not null references public.lyrics(id) on delete cascade,
  sent_at   timestamptz not null default now(),
  primary key (device_id, lyric_id)
);

-- The no-repeat lookup's hot path: "which lyrics has this device seen in
-- the last 12 months" — covering index on (device_id, sent_at).
create index if not exists lyric_history_device_sent_at_idx
  on public.lyric_history (device_id, sent_at);

-- month/day (no year — recurring annually) + an optional specific year for
-- display ("On this day in 2014..."). A date with no row is silently
-- skipped (spec: "skips dates with no good entry rather than sending
-- filler") — there is deliberately no placeholder/filler row concept here.
create table if not exists public.on_this_day (
  id         bigint generated always as identity primary key,
  month      smallint not null check (month between 1 and 12),
  day        smallint not null check (day between 1 and 31),
  year       smallint,                      -- the year the historical event happened, for display
  text       text not null,
  deep_link  text,
  created_at timestamptz not null default now()
);

-- The daily dispatch lookup's hot path: "what happened on month/day"
-- (today's date, every device, every tick) — covering index.
create index if not exists on_this_day_month_day_idx
  on public.on_this_day (month, day);

-- Countdown scheduling (spec §4 `countdowns`) needs the announced date the
-- countdown counts down TO — `events` (Phase 2) has no such column since
-- ordinary T1/T2/T3 events fire once, not on a schedule. Nullable so every
-- existing/non-countdown-eligible event is unaffected; only a producer
-- that KNOWS a firm announced date (an "Oct 13" album date, a specific
-- on-sale/release timestamp) sets it. Countdown-eligible categories only
-- (see notification-fun.ts's COUNTDOWN_ELIGIBLE_CATEGORIES) — a `drop_at`
-- on any other category is simply ignored by the scheduler.
alter table public.events add column if not exists drop_at timestamptz;

-- Phase 4's countdown scheduler (spec §4 `countdowns`, proposed extra):
-- "on announced-drop events, auto-create T-7d/T-1d/release-hour sends for
-- opted-in devices." One row per (device, source event, milestone) so the
-- dispatch job can find "which countdown sends are due" without
-- recomputing offsets every tick, and so a device that opts in AFTER the
-- countdown window has already partially elapsed only gets the milestones
-- still in the future (see notification-fun.ts's scheduleCountdowns()).
create table if not exists public.countdown_sends (
  device_id     uuid not null references public.devices(id) on delete cascade,
  event_id      uuid not null references public.events(id) on delete cascade,
  milestone     text not null check (milestone in ('t_minus_7d', 't_minus_1d', 'release_hour')),
  scheduled_for timestamptz not null,
  sent_at       timestamptz,
  created_at    timestamptz not null default now(),
  primary key (device_id, event_id, milestone)
);

-- The dispatch job's core query: "every due, not-yet-sent countdown row".
create index if not exists countdown_sends_due_idx
  on public.countdown_sends (scheduled_for)
  where sent_at is null;

alter table public.lyrics enable row level security;
alter table public.lyric_history enable row level security;
alter table public.on_this_day enable row level security;
alter table public.countdown_sends enable row level security;
-- Deliberately no policies on any of the four: service_role only, same
-- posture as every other notifications table in this migration set.
