-- Primary-source fast lane (Tidewatch P1-08). This is a data-only migration:
-- existing news_source/source_type constraints already admit every adapter.
-- config.primary is the worker's explicit selector; the normal cycle ignores it.

update public.news_source
set config = config || '{"primary":true,"newestFirst":true}'::jsonb
where name = 'Google News — "Taylor Swift" search';

insert into public.news_source (name, source_type, tier, config, is_enabled)
select v.name, v.source_type, v.tier, v.config::jsonb, true
from (values
  ('Taylor Swift — official YouTube channel', 'rss', 'official',
   '{"url":"https://www.youtube.com/feeds/videos.xml?channel_id=UCqECaJ8Gagnn7YCbPEzWH6g","primary":true}'),
  ('Taylor Swift — official site', 'site_diff', 'official',
   '{"url":"https://www.taylorswift.com/","primary":true}'),
  ('Taylor Swift — official store', 'site_diff', 'official',
   '{"url":"https://store.taylorswift.com/","primary":true}'),
  ('Republic Records — press feed', 'rss', 'official',
   '{"url":"https://www.republicrecords.com/blogs/news.atom","primary":true}'),
  ('Universal Music Group — press feed', 'rss', 'official',
   '{"url":"https://www.universalmusic.com/feed/","primary":true}')
) as v(name, source_type, tier, config)
where not exists (
  select 1 from public.news_source s where s.name = v.name
);
