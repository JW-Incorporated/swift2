-- Adds the per-song deep-dive fields to track_note: real researched
-- discussion (meaning/inspiration/writing process) plus a few short quoted
-- lines, distinct from the existing short `note` and its `sources`. See
-- docs/decisions.md 2026-07-09 (supersedes the earlier "reproduce full
-- lyrics" decision) for why this is quoted-lines + analysis, not full text.
-- Additive only; existing rows get empty defaults.

alter table public.track_note
  add column if not exists discussion jsonb not null default '[]'::jsonb,
  add column if not exists quoted_lines jsonb not null default '[]'::jsonb,
  add column if not exists discussion_source_url text,
  add column if not exists discussion_sources jsonb not null default '[]'::jsonb,
  -- Already authored per-song fields (summary/inspiration/easter_eggs) that
  -- existed only in the local seed .mjs files and were never seeded to the
  -- DB or surfaced in the UI. The generator auto-derives `discussion` from
  -- these when no explicit discussion is given (see
  -- scripts/sync-longlive-tracks.mjs's discussionFrom).
  add column if not exists summary text not null default '',
  add column if not exists inspiration text not null default '',
  add column if not exists easter_eggs text not null default '';
