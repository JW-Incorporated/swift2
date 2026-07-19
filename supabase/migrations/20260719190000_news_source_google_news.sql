-- Adds Google News search RSS as a fourth source (Wyatt, 2026-07-19).
--
-- CONTEXT / REVISIT TRIGGER. The seed migration one file earlier deliberately
-- excluded this feed: Google's own copyright notice on it restricts use to
-- "personal, non-commercial use" and states any other use "is expressly
-- prohibited." Wyatt's call is that the project is personal use today, which
-- is a founder business-risk decision, recorded here rather than silently
-- buried. Noted for whoever revisits: the affiliate-link seam (#867) is
-- already merged and live, the site is publicly launched with social
-- accounts and a marketing plan, and it operates under a company — so the
-- "personal use" reading gets harder to sustain as monetization turns on.
-- Re-evaluate when affiliate links actually start earning, or if counsel
-- reviews the launch (docs/launch-readiness.md LEGAL row, #800).
--
-- WHY IT IS WORTH THE RISK OPERATIONALLY: recall. The three publisher tag
-- feeds return 10 items each and only cover outlets we thought to add; this
-- query returned 100 Taylor-specific items on the same day, including
-- stories none of the three carried. Those publisher feeds stay in place as
-- the backbone, so if Google blocks or rate-limits us the pipeline degrades
-- to lower recall instead of dying.
--
-- TIER = 'unverified', deliberately. Tier drives verification_status
-- (packages/shared/src/news/credibility.ts): a lone 'unverified' source
-- yields 'rumor', a lone 'established' yields 'single_source'. Google News
-- is an AGGREGATOR — the row cannot know whether a given item came from
-- Billboard or a content farm, and the underlying outlet identity is not
-- captured on the item. Calling it 'established' would silently launder
-- tabloid copy into single_source. 'unverified' means a Google-only story
-- stays flagged until a real outlet corroborates it, which is exactly the
-- existing sourcing bar (two independent outlets for relationship/business).
--
-- Verified 2026-07-19: HTTP 200, valid RSS, 100 items, first item a genuine
-- Taylor story.

insert into public.news_source (name, source_type, tier, config, is_enabled)
select v.name, v.source_type, v.tier, v.config::jsonb, true
from (values
  ('Google News — "Taylor Swift" search', 'google_news', 'unverified',
   '{"url":"https://news.google.com/rss/search?q=%22Taylor+Swift%22&hl=en-US&gl=US&ceid=US:en"}')
) as v(name, source_type, tier, config)
where not exists (
  select 1 from public.news_source s where s.name = v.name
);
