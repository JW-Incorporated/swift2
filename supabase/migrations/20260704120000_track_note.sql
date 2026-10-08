-- Vault track guide: per-album song notes, NON-month-scoped.
-- Reached from the album/era (not by scrubbing to a month), loaded on demand —
-- so full song-catalog coverage stays OFF the Tier-0 timeline payload and off
-- the wavetop-month item ceiling, and can't blow the payload budget gate.
-- Same discipline as the rest of the Vault: a short sourced note, links only,
-- no fabrication, RLS public-read.
-- Ref: docs/proposals/2026-07-04-song-track-guide-content-shape.md

create table if not exists public.track_note (
  id           uuid primary key default gen_random_uuid(),
  era_slug     text not null references public.era (slug) on delete cascade,
  track_title  text not null,
  track_number integer,                                 -- optional, display order
  note         text not null default '',
  source_url   text,
  sources      jsonb not null default '[]'::jsonb,      -- [{outlet,url}]
  created_at   timestamptz not null default now(),
  -- same length discipline as month_item.snippet: a sourced line, not an essay.
  constraint track_note_note_len check (char_length(note) <= 400)
);
create index if not exists track_note_era_idx on public.track_note (era_slug);

-- RLS: public read-only, like the rest of the Vault (service_role bypasses for seeding).
alter table public.track_note enable row level security;
drop policy if exists "track_note public read" on public.track_note;
create policy "track_note public read" on public.track_note for select using (true);
