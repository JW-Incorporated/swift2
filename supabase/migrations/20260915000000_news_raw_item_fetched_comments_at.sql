-- Marks when a Reddit raw item's comment thread was last fetched (Fable 5.1
-- architecture review, R16). Before this, run-extract-stage.ts's
-- `loadCommentThreads` re-fetched `fetchPostComments` for the SAME post URL
-- on every extract cycle that touched its story (a story can stay pending
-- across several cycles before it clears the classify/extract pipeline),
-- and even within a single cycle any two raw items sharing a URL fetched
-- twice. Neither is caught server-side — Reddit just serves the request
-- again and burns another request against the same rate-limited endpoint
-- this adapter already backs off aggressively for (reddit-rss.ts's 429
-- posture).
--
-- Additive and nullable, same pattern as this table's other per-item
-- columns (publisher/publisher_url, resolved_tier): null means "never
-- fetched," so `loadCommentThreads` treats an unset row as before. Once a
-- post's comments are fetched (successfully attempted, not necessarily
-- non-empty — a 429/empty result still counts as "tried this cycle" so a
-- perpetually-quiet or backed-off post doesn't get hammered every cycle)
-- the row is stamped and never re-fetched by story-based re-runs again.
alter table public.news_raw_item
  add column if not exists fetched_comments_at timestamptz;

comment on column public.news_raw_item.fetched_comments_at is
  'When this Reddit post''s comment thread was last fetched via fetchPostComments (run-extract-stage.ts). Null means never attempted. Prevents redundant comment fetches across extract cycles for a story that stays pending across multiple runs.';
