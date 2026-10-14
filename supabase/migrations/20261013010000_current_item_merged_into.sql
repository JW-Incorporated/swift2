-- Content fix 7 — LLM same-event dedupe gate (owner report 2026-10-13: three
-- posts about the same Trump-video event, two about the Nashville
-- Songwriters Hall of Fame, all live at once). `merged_into` is the
-- read-time collapse anchor: once the write-time gate
-- (apps/worker/src/extract/dedupe-gate.ts) confirms a current_item is the
-- same real-world event as one already live, the duplicate's OWN row (if one
-- ever exists — the normal path never inserts one at all) is hidden by
-- pointing it at the original instead of a hard delete (spec §C: "HIDES the
-- duplicates... never hard-delete"), and the read-time safety net
-- (packages/experience/src/current-feed.ts) collapses anything sharing a
-- `merged_into` pointer so a duplicate can never render twice even if one
-- slips through.

alter table public.current_item add column if not exists merged_into uuid references public.current_item (id);

create index if not exists current_item_merged_into_idx
  on public.current_item (merged_into) where merged_into is not null;

-- Live-read queries additionally exclude a merged-away row, same pattern as
-- the existing `promoted_to is null` filter.
create index if not exists current_item_era_observed_unmerged_idx
  on public.current_item (era_id, observed_on desc)
  where redline_ok and promoted_to is null and merged_into is null;
