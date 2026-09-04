-- video_work: add watch_url + platform (#3476)
--
-- WHY. 8 video_work rows (tour films, documentaries, the Showgirl release
-- party) exist only on Netflix/Disney+/Apple Music/theatrical/DVD — never a
-- YouTube embed — so `youtubeId` is null and the playable-first filter
-- (docs/decisions.md, 2026-08-13) hides them from every reader-facing
-- surface. That rule is right for a record with NOTHING to watch; it is
-- wrong for one that is legitimately watchable somewhere else. These two
-- new columns give the UI an honest, non-embed "watch on {platform}"
-- affordance for that case, without weakening playable-first for the
-- records that genuinely have nothing (see videos.ts's `isWatchable`).
--
-- Both nullable, both optional: a record with neither `youtubeId` nor
-- `watch_url` stays hidden exactly as before — this is additive.
alter table public.video_work add column if not exists watch_url text;
alter table public.video_work add column if not exists platform text;
