-- #5044: notification producers now emit the site's deep-link vocabulary.
-- Backfills what they already stored. Idempotent (new values match none of
-- the WHERE clauses), updates only, never deletes.

-- 1. The seeded lyric for "The Life of a Showgirl" carried the wrong track
--    slug. Renamed in place so ids and lyric_history are preserved (the seed
--    runner deletes + reinserts and would cascade lyric_history).
update public.lyrics
   set slug = 'the-life-of-a-showgirl-title-track'
 where slug = 'the-life-of-a-showgirl'
   and not exists (
     select 1 from public.lyrics where slug = 'the-life-of-a-showgirl-title-track'
   );

-- 2. Stored events (30-day retention) whose deep_link the site cannot open.
update public.events
   set deep_link = 'https://www.longlivets.com/?mode=threads'
 where deep_link = 'https://www.longlivets.com/?current=theories';

update public.events
   set deep_link = 'https://www.longlivets.com/?mode=merch'
 where deep_link = 'https://www.longlivets.com/?current=merch'
    or deep_link like 'https://www.longlivets.com/?utm_source=push%#merch-new-drops';

-- countdowns and ?current=<current_item id> have no site destination: front door.
update public.events
   set deep_link = 'https://www.longlivets.com/'
 where deep_link = 'https://www.longlivets.com/?current=countdowns'
    or (deep_link like 'https://www.longlivets.com/?current=%'
        and deep_link <> 'https://www.longlivets.com/?current=inbox');
