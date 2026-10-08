-- Per-item tier override for resolved Google News redirects (proposal
-- §4.1.2, PLAN.md Stage 1). Before this, tier was only ever read from the
-- *source* row (`news_source.tier`) — fine for a publisher's own feed, but
-- wrong for `google_news`, an aggregator whose items are individually
-- resolvable to real, individually-tier-able publisher domains.
--
-- Additive and nullable, same pattern as the 20260720000500 migration's
-- `publisher`/`publisher_url` columns: null means "not (yet) resolved,"
-- and `recordStorySource` falls back to the source row's tier exactly as
-- before — non-Google feeds are unaffected.
alter table public.news_raw_item
  add column if not exists resolved_tier text
    check (resolved_tier in ('official', 'established', 'fan', 'unverified'));

comment on column public.news_raw_item.resolved_tier is
  'Tier earned by resolving this item''s URL (Google News redirect -> publisher domain -> domain tier map). Null when not applicable/not resolved, in which case news_source.tier is used.';
