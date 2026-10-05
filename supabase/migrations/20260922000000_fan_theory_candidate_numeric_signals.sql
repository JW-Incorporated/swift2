-- Adds numeric_signals to fan_theory_candidate (Community Engine
-- symbol-scoring follow-up). Sibling migration to
-- 20260920000000_live_theory_stance.sql/20260920000000_live_theory_track_slug.sql
-- (same "one small additive nullable-defaulted column" shape).
--
-- Numbers the fan discussion itself points to (a repeated punctuation
-- count, an album/track ordinal, a date part) — extracted by the Theory
-- Miner alongside `symbols` (theory-prompt.ts's `numeric_signals` tool
-- field) and checked against apps/worker/src/extract/catalog-facts.ts's
-- hand-maintained catalog facts by symbol-match.ts's deterministic
-- symbolMatchScore(), which feeds theory-promote.ts's `heat` computation.
-- Defaults to an empty array, same "never null, never invented" posture
-- as the table's other array columns (symbols, communities, sample_urls
-- default to '{}'/'[]').
alter table public.fan_theory_candidate
  add column if not exists numeric_signals int[] not null default '{}';
