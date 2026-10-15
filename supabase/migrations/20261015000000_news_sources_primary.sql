-- Primary-source fast lane (Tidewatch P1-08). This is a data-only migration:
-- existing news_source/source_type constraints already admit every adapter.
-- config.primary is the worker's explicit selector; the normal cycle ignores it.

-- Repair a database where the pre-review version of this migration already
-- marked the normal Google News row primary. Once the dedicated row exists,
-- later migrate runs leave any operator-owned config alone.
update public.news_source
set config = config - 'primary' - 'newestFirst'
where name = 'Google News — "Taylor Swift" search'
  and config ->> 'primary' = 'true'
  and not exists (
    select 1 from public.news_source s
    where s.name = 'Google News — "Taylor Swift" fast lane'
  );

insert into public.news_source (name, source_type, tier, config, is_enabled)
select v.name, v.source_type, v.tier, v.config::jsonb, v.is_enabled
from (values
  ('Taylor Swift — official YouTube channel', 'rss', 'official',
   '{"url":"https://www.youtube.com/feeds/videos.xml?channel_id=UCqECaJ8Gagnn7YCbPEzWH6g","primary":true}', true),
  ('Taylor Swift — official site', 'site_diff', 'official',
   '{"url":"https://www.taylorswift.com/","primary":true}', true),
  ('Taylor Swift — official store', 'site_diff', 'official',
   '{"url":"https://store.taylorswift.com/","primary":true}', true),
  ('Google News — "Taylor Swift" fast lane', 'google_news', 'unverified',
   '{"url":"https://news.google.com/rss/search?q=%22Taylor+Swift%22&hl=en-US&gl=US&ceid=US:en&scoring=n","primary":true,"newestFirst":true}', false),
  ('Republic Records — press feed', 'rss', 'established',
   '{"url":"https://www.republicrecords.com/blogs/news.atom","primary":true,"requiredMention":"Taylor Swift"}', true),
  ('Universal Music Group — press feed', 'rss', 'established',
   '{"url":"https://www.universalmusic.com/feed/","primary":true,"requiredMention":"Taylor Swift"}', true)
) as v(name, source_type, tier, config, is_enabled)
where not exists (
  select 1 from public.news_source s where s.name = v.name
);

-- Correct a row created by the pre-review migration. Primary mode selects
-- config.primary explicitly and intentionally bypasses the enabled filter.
update public.news_source
set is_enabled = false
where name = 'Google News — "Taylor Swift" fast lane'
  and is_enabled = true;

-- Add primary defaults only when the key is absent. In particular, never
-- reset an operator's explicit {"primary":false} on a later db:migrate run.
update public.news_source
set config = config || '{"primary":true,"newestFirst":true}'::jsonb
where name = 'Google News — "Taylor Swift" fast lane'
  and not (config ? 'primary');
