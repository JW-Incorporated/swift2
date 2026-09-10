-- Additive-only. Backs the batched news_story_source write in
-- apps/worker/src/pipeline/run-cycle.ts (Fable 5.1 architecture review, R15):
-- a single `insert ... on conflict (story_id, outlet_name) do nothing`
-- replaces the prior per-row "select existing, then insert" round trip.
-- Corroboration counts distinct outlets per story, which is exactly what
-- this constraint enforces at the database level.
create unique index if not exists news_story_source_story_outlet_unique
  on public.news_story_source (story_id, outlet_name);
