-- Issue #440 Phase 0: the essential-facts fields the seed .mjs files already
-- author (writers/producers/release/single status/themes/slug) but the seed
-- runner's INSERT list silently dropped, plus one jsonb `dossier` column for
-- the Phase-1 per-song dossier (why-it-matters / tiered meaning / catalog
-- connections / live-performance history / collaborator voices — shape
-- validated by scripts/sync-longlive-tracks.mjs, authoritative TS type in
-- apps/web/lib/longlive/types.ts). Additive only; existing rows get empty
-- defaults.

alter table public.track_note
  add column if not exists slug text,
  add column if not exists release text,
  add column if not exists release_date text,
  add column if not exists writers jsonb not null default '[]'::jsonb,
  add column if not exists producers jsonb not null default '[]'::jsonb,
  add column if not exists is_single boolean not null default false,
  add column if not exists single_release_date text,
  add column if not exists themes jsonb not null default '[]'::jsonb,
  add column if not exists dossier jsonb not null default '{}'::jsonb;
