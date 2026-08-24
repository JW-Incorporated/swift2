-- Grows the publisher tag feed backbone 3 -> 10 (proposal §4.2 layer 1,
-- PLAN.md Stage 1). Same verification bar as the 7/19 seed
-- (20260719180000_news_sources_seed.sql): each URL below was fetched
-- 2026-08-23, HTTP 200, valid RSS, >=10 items, channel title/description
-- confirming it is the Taylor-specific tag/topic/spotlight feed, not a
-- general section feed.
--
-- Tried and skipped (no working Taylor-specific feed found, do not add a
-- guessed URL later without re-verifying it the same way):
--   People, Entertainment Tonight — Dotdash/Meredith tag pages carry no
--     per-tag RSS link anymore; the only discoverable feed was a generic
--     "Celebrity" feed, not Taylor-specific.
--   Vogue, Elle, Harper's Bazaar — Conde Nast/Hearst sites expose no
--     /tag/taylor-swift/feed/ endpoint (404); Elle/Harper's Bazaar's
--     /rss/search.xml accepts a query param but returns 0 items regardless
--     of the query, so it is not usable as a topic feed.
--   The Tennessean — no tag/topic RSS discoverable (404s, no <link
--     type="application/rss+xml"> on the search results page).
--   Kansas City Star — Akamai bot mitigation drops the TLS connection
--     before any response; not fetchable from this environment.
--   Pitchfork — no /tag/taylor-swift/feed/ or equivalent artist-scoped RSS
--     found; only whole-site news RSS exists.

insert into public.news_source (name, source_type, tier, config, is_enabled)
select v.name, v.source_type, v.tier, v.config::jsonb, true
from (values
  ('The Hollywood Reporter — Taylor Swift tag', 'rss', 'established',
   '{"url":"https://www.hollywoodreporter.com/t/taylor-swift/feed/"}'),
  ('WWD — Taylor Swift tag', 'rss', 'established',
   '{"url":"https://wwd.com/tag/taylor-swift/feed/"}'),
  ('Deadline — Taylor Swift tag', 'rss', 'established',
   '{"url":"https://deadline.com/tag/taylor-swift/feed/"}'),
  ('Stereogum — Taylor Swift tag', 'rss', 'established',
   '{"url":"https://www.stereogum.com/tag/taylor-swift/feed/"}'),
  ('The Guardian — Taylor Swift tag', 'rss', 'established',
   '{"url":"https://www.theguardian.com/music/taylor-swift/rss"}'),
  ('BBC News — Taylor Swift topic', 'rss', 'established',
   '{"url":"https://feeds.bbci.co.uk/news/topics/c5elz99kyrgt/rss.xml"}'),
  ('NYT — Taylor Swift spotlight', 'rss', 'established',
   '{"url":"https://www.nytimes.com/svc/collections/v1/publish/https://www.nytimes.com/spotlight/taylor-swift/rss.xml"}')
) as v(name, source_type, tier, config)
where not exists (
  select 1 from public.news_source s where s.name = v.name
);
