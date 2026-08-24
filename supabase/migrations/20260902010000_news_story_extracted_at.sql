-- Adds news_story.extracted_at — the marker the extract stage (PLAN.md
-- Stage 3) needs to identify "new clusters" (one Haiku call per new cluster,
-- proposal §4.5) without re-processing a story every run. Same follow-up-
-- migration-to-an-existing-table shape as Stage 1's
-- 20260823020000_news_raw_item_resolved_tier.sql. Nullable, no default: null
-- means "not yet extracted"; the extract stage sets it once it either writes
-- a current_item/fan_signal for the story or the model says `skip`.

alter table public.news_story add column if not exists extracted_at timestamptz;

create index if not exists news_story_extract_pending_idx
  on public.news_story (id) where classified_at is not null and extracted_at is null;
