-- Seeds the initial news_source rows (V2 news pipeline, #468). Until this
-- ran, the worker authenticated fine and then no-opped every cycle with zero
-- sources, so the intake queue stayed empty and the Vault went stale.
--
-- SOURCE CHOICE (2026-07-19). Every row below is an outlet's OWN
-- Taylor-Swift tag feed — publisher-published RSS meant for syndication,
-- Taylor-filtered at the source (so ~100% relevance, not a firehose we
-- filter ourselves), and correctly attributable, which matters because
-- `tier` drives verification_status (packages/shared/src/news/credibility.ts):
-- a lone 'established' source => single_source, two distinct => corroborated.
--
-- DELIBERATELY NOT USED: Google News search RSS. It has by far the best
-- recall (100 Taylor items vs 10 here) and was the obvious pick, but its
-- own copyright notice restricts the feed to "personal, non-commercial use"
-- and states any other use "is expressly prohibited." This site carries
-- affiliate links, so that is squarely commercial. Verified 2026-07-19; do
-- not add it without counsel. If recall proves too low, the clean upgrades
-- are (a) more publisher tag feeds, or (b) a licensed news API.
--
-- Each URL below was fetched and verified 2026-07-19: HTTP 200, valid RSS,
-- 10 items, channel title confirming it is the Taylor-specific tag feed.
-- Adding a feed later is a data change (INSERT), never a deploy.

insert into public.news_source (name, source_type, tier, config, is_enabled)
select v.name, v.source_type, v.tier, v.config::jsonb, true
from (values
  ('Billboard — Taylor Swift tag', 'rss', 'established',
   '{"url":"https://www.billboard.com/t/taylor-swift/feed/"}'),
  ('Variety — Taylor Swift tag', 'rss', 'established',
   '{"url":"https://variety.com/t/taylor-swift/feed/"}'),
  ('Rolling Stone — Taylor Swift tag', 'rss', 'established',
   '{"url":"https://www.rollingstone.com/t/taylor-swift/feed/"}')
) as v(name, source_type, tier, config)
where not exists (
  -- Idempotent by name: scripts/migrate.mjs re-applies every file on every
  -- run, so a second run must not duplicate feeds (news_source has no unique
  -- constraint on name — the id is a generated uuid).
  select 1 from public.news_source s where s.name = v.name
);
