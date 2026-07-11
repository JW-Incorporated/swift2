-- Adds song-credit + release-metadata columns to track_note: writers,
-- producers, release, release_date, single_release_date, themes. These were
-- already authored per-track in supabase/seed/tracks/*.mjs but the seed
-- runner never inserted them and the UI never surfaced them — pure plumbing
-- for issue #440 (Track Guide overhaul, Phase 0), no new content authoring.
-- Additive only; existing rows get empty defaults.

alter table public.track_note
  add column if not exists writers jsonb not null default '[]'::jsonb,
  add column if not exists producers jsonb not null default '[]'::jsonb,
  add column if not exists release text,
  add column if not exists release_date date,
  add column if not exists single_release_date date,
  add column if not exists themes jsonb not null default '[]'::jsonb;
