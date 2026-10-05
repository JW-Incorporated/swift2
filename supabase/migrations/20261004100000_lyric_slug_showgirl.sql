-- #5044: the seeded lyric for "The Life of a Showgirl" carried the wrong track
-- slug (the track's slug is 'the-life-of-a-showgirl-title-track'). Renamed in
-- place so ids and lyric_history are preserved (the seed runner deletes and
-- reinserts, which would cascade lyric_history). Re-run-safe: a second run
-- matches no row. No event rows are touched.
do $$
begin
  if exists (select 1 from public.lyrics where slug = 'the-life-of-a-showgirl')
     and exists (select 1 from public.lyrics where slug = 'the-life-of-a-showgirl-title-track') then
    raise exception '#5044: both lyric slugs present; reconcile by hand before deploy';
  end if;
  update public.lyrics set slug = 'the-life-of-a-showgirl-title-track'
   where slug = 'the-life-of-a-showgirl';
end $$;
