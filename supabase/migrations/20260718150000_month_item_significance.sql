-- How major a month_item's real-world event was (docs/decisions.md,
-- 2026-07-18). An explicit authoring judgment, not inferred — mirrors
-- ContentItem.significance in apps/web/lib/longlive/types.ts. Absent (the
-- default, most rows) means routine; the app's existing content-derived
-- heuristic applies unchanged.
--
-- Not yet wired into scripts/sync-longlive-content.mjs's Supabase read path
-- (a deliberate, documented follow-up — the live site reads seed files
-- first per the 2026-07-17 decision, so this column exists for schema
-- parity and any future DB-path consumer, not because anything reads it
-- today).

alter table public.month_item
  add column if not exists significance text
    check (significance is null or significance in ('defining', 'notable'));
