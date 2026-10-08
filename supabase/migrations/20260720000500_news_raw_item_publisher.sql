-- Records the actual PUBLISHER of a raw news item, separate from the feed it
-- arrived through.
--
-- The bug this fixes: news_story_source.outlet_name was set from the FEED name
-- (news_source.name), so every Google News item was attributed to
-- "Google News — <query> search" rather than Forbes, Billboard, Variety, etc.
-- Two consequences, the second much worse than the first:
--
--   1. Attribution was wrong, and the stored URL is an opaque
--      news.google.com/rss/articles/CBMi... redirect — not a citable source.
--
--   2. recordStorySource() skips inserting when a row already exists for
--      (story_id, outlet_name). With outlet_name always equal to the feed
--      name, a story could hold exactly ONE source row per feed no matter how
--      many independent publishers covered the event. source_count was pinned
--      at 1 across the entire table, which made `corroborated` unreachable and
--      left every story sitting at `rumor`/`single_source` forever.
--
-- Google News RSS carries <source url="https://www.forbes.com">Forbes</source>
-- on every item, so the publisher is already in the feed we parse — we were
-- discarding it. Additive and nullable: non-Google feeds simply leave it null
-- and fall back to the source name, exactly as before.
alter table public.news_raw_item
  add column if not exists publisher     text,
  add column if not exists publisher_url text;

comment on column public.news_raw_item.publisher is
  'Originating outlet as reported by the feed (RSS <source> element), e.g. "Forbes". Null when the feed does not say, in which case the news_source name is used.';
