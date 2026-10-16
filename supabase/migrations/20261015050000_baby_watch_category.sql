-- Tidewatch D5 / P2-05: `baby_watch` notification category ("Baby Watch: official announcements only").
-- Categories are plain text in notification_prefs / events (no enum), so no schema widening is needed.
-- Opt-in only: a device with no baby_watch row is opted OUT; opting in stores cadence 'instant'
-- (the router fans out instant rows only). Additive and re-apply-safe: pins the allowed cadences
-- for this one category so a digest cadence can never be stored for it.
alter table public.notification_prefs
  drop constraint if exists notification_prefs_baby_watch_cadence_check;

alter table public.notification_prefs
  add constraint notification_prefs_baby_watch_cadence_check
  check (category <> 'baby_watch' or cadence in ('instant', 'off'));
