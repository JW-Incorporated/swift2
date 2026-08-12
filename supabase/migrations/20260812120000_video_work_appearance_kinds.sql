-- ---------------------------------------------------------------------------
-- video_work.kind — widen to cover APPEARANCES (2026-08-12)
--
-- WHY. 31 oEmbed-verified YouTube appearances (talk shows, award speeches,
-- podcasts, radio, commencement, premieres, red carpets) were folded into the
-- era timelines by PR #2035, but only 2 could reach the era Videos surface:
-- every remaining one is a real, official upload with no honest `kind` to sit
-- under. The old enum only described works Taylor MADE (a music video, a short
-- film, a tour film). Calling an acceptance speech a `performance` would have
-- made the rail lie about what the viewer is about to watch.
--
-- WHAT. Four new values, forming an "appearance" family alongside the existing
-- "works" family (rationale + the deliberate choice of four rather than one
-- per venue type: VIDEO_KINDS in packages/shared/src/vault-types.ts):
--
--   interview     talk show, podcast, or radio/streaming sit-down
--   award_speech  accepting or presenting at an awards show
--   speech        a standalone address outside an awards show
--   press_event   premiere Q&A, red carpet, news-segment reveal
--
-- IDEMPOTENT. The original constraint was declared inline and so carries
-- Postgres's generated name `video_work_kind_check`; this drops that (and its
-- own new name) before adding, so re-running the whole migration directory in
-- filename order is safe. Widening a CHECK never invalidates existing rows —
-- every value previously allowed is still allowed.
-- ---------------------------------------------------------------------------

alter table public.video_work drop constraint if exists video_work_kind_check;
alter table public.video_work drop constraint if exists video_work_kind_allowed;

alter table public.video_work
  add constraint video_work_kind_allowed check (kind in (
    -- works
    'music_video', 'lyric_video', 'short_film', 'tour_film', 'documentary', 'performance',
    -- appearances
    'interview', 'award_speech', 'speech', 'press_event'
  ));
