-- Community Engine Phase 2 card P2-6 (docs/proposals/2026-09-06-community-
-- engine-plan.md §3.4 point 4, §9 P2-6): "Song pages — when a theory has
-- `track_slug`, weave a sourced one-liner ... That is a Content Shift lane
-- input, not automatic."
--
-- THE GAP THIS FIXES: `fan_theory_candidate.track_slug` has existed since
-- P0-1 (20260917000000_community_engine.sql) and the Theory Miner extract
-- (P2-2, write-theory-candidate.ts) has always populated it from the
-- model's `record_fan_theories` output. But the merge/promote pass (P2-3,
-- apps/worker/src/extract/theory-promote.ts) never carried it onto the
-- `live_theory` row it promotes into — `buildLiveTheoryUpsert`'s row shape
-- has no `track_slug` field, and `live_theory` itself has no such column.
-- So by the time a theory is `persistent=true` and promotion-eligible
-- (P2-3's own bar), the one fact P2-6 needs to find it — which song it's
-- about — was already dropped on the floor. This migration adds the
-- column; the P2-6 script (scripts/community/song-weaving-intake.mjs) and
-- a small addition to theory-promote.ts (same PR) are what actually start
-- populating and reading it.
alter table public.live_theory add column if not exists track_slug text;
create index if not exists live_theory_track_slug_idx
  on public.live_theory (track_slug) where track_slug is not null;
