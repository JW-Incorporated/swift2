-- Community Engine Phase 2 card P2-3 (docs/proposals/2026-09-06-community-
-- engine-plan.md §3.3): merge/promote pass (candidates -> live_theory) +
-- the resolution matcher (predicts/predicted_date -> Vault moments ->
-- egg_ledger precedent candidates). Additive to
-- 20260917000000_community_engine.sql, same pattern as
-- 20260918000000_community_ack.sql adding the ack route's own columns
-- after P0-1 shipped.
--
-- §3.3's own text: "Resolution: a nightly job matches `predicts +
-- predicted_date` against Vault moments; a hit sets `outcome` and creates
-- an `egg_ledger` precedent candidate (human-reviewed PR like any Vault
-- change)." `outcome` there is fan_theory_candidate's own resolution
-- state, tracked separately from `status` (the merge/promote pipeline
-- state: candidate -> accepted/rejected/merged) because a candidate can be
-- `accepted` (promoted to live_theory) for a long time before its
-- prediction resolves one way or the other, or never resolve at all
-- (`predicts` is optional). `resolved_at` makes the nightly matcher
-- idempotent — a candidate already resolved is never re-scanned.
alter table public.fan_theory_candidate
  add column if not exists resolved_outcome text check (resolved_outcome in ('confirmed')),
  add column if not exists resolved_at timestamptz,
  add column if not exists resolved_moment_id text; -- knowledge_doc id of the matching Vault moment, for the precedent-candidate report
