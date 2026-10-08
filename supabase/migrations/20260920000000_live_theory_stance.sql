-- Community Engine P2-4 (docs/proposals/2026-09-06-community-engine-plan.md
-- §3.4, Phase 2 card P2-4: "LiveTheoryCard fields (mention_count,
-- communities, stance)"). `mention_count`/`communities` already landed on
-- `live_theory` in 20260917000000_community_engine.sql (P0-1); `stance` was
-- deliberately left off that migration because at P0-1 time no promotion
-- path existed yet to populate it. P2-3 (theory-promote.ts) now sets the
-- promoted row's fan-side confidence — this migration adds the column it
-- writes to, using the exact same 3-value check as
-- `fan_theory_candidate.stance` so a promoted row's stance is always one of
-- the values the corpus itself can produce.
--
-- Nullable, no default: only fan-origin, corpus-promoted rows ever carry a
-- stance (bot/site rows, and any live_theory predating this column, have
-- none — `LiveTheoryCard` renders the stance chip only when it's present,
-- never fabricating a value for rows that never went through the corpus).
alter table public.live_theory add column if not exists stance
  text check (stance in ('believed', 'contested', 'debunked_by_fans'));
