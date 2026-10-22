-- ---------------------------------------------------------------------------
-- video_work.kind — widen to include 'visualizer' (2026-10-22, #6082)
--
-- An official visualizer (looping lyric/visual accompaniment posted on the
-- verified channel) is a work Taylor released, not an appearance.  The first
-- such row is 'Opalite (BUNT. Remix) (Visualizer)', 2026-10-15.
--
-- WHY: the live DB CHECK constraint `video_work_kind_allowed` (introduced in
-- 20260812120000) lists the ten existing kinds and would reject the new
-- `visualizer` value with a CHECK constraint violation. Dropping and
-- re-adding the constraint widens it.
--
-- IDEMPOTENT: drop both known constraint names before re-adding, so a
-- re-run after a partial apply is safe.
-- ---------------------------------------------------------------------------

alter table public.video_work drop constraint if exists video_work_kind_allowed;
alter table public.video_work drop constraint if exists video_work_kind_check;

alter table public.video_work
  add constraint video_work_kind_allowed check (kind in (
    -- works
    'music_video', 'lyric_video', 'short_film', 'tour_film', 'documentary',
    'performance', 'visualizer',
    -- appearances
    'interview', 'award_speech', 'speech', 'press_event'
  ));
