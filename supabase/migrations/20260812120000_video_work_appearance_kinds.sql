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
-- Postgres's generated name `video_work_kind_check` (see
-- 20260708150000_videos_theories_tours_releases.sql); this drops that name AND
-- its own new one before adding, so re-running the whole migration directory in
-- filename order is safe.
--
-- ATOMICITY: scripts/migrate.mjs sends each file as ONE `client.query(sql)`, and
-- Postgres runs a multi-statement simple query as a single implicit
-- transaction. The drop and the add therefore commit together — the table is
-- never left unconstrained by a partial failure.
--
-- WHY NOT `NOT VALID` + `VALIDATE CONSTRAINT` (raised in review, 2026-08-12):
-- that pattern exists to move a full-table validation scan OUT of the
-- ACCESS EXCLUSIVE lock window. It buys nothing here, for two reasons.
--   1. Both statements would land in the SAME implicit transaction (above), so
--      the exclusive lock is held until commit either way.
--   2. This constraint is WIDENED: the new predicate is a strict superset of
--      the old one, so every existing row already satisfies it by construction.
--      The scan cannot fail, and it covers a table currently holding ~85 rows.
-- If video_work ever grows large AND a future migration NARROWS this predicate,
-- that one does need the two-step, in two separate migration files.
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
