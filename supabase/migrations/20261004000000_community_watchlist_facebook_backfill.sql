-- Backfill `community_watchlist` rows for the Facebook groups that are
-- already producing `engagement_lead` rows but have no watchlist entry
-- (issue #4885's last bullet).
--
-- The P0-1 seed (20260917000000_community_engine.sql) only seeded
-- `facebook:taylor-swifts-vault` and `facebook:friendship-bracelet-trading`,
-- because those were the only two groups verified at the time. Since then
-- the export checklist (scripts/knowledge/fb-groups-checklist.mjs) grew to
-- 8 groups through #4690/#4691, and the fb-export ingest writes
-- `community='facebook:<slug>'` for each — so 6 slugs were landing leads
-- with no watchlist row describing them at all.
--
-- Values mirror the checklist's `label` per slug exactly (the checklist is
-- the source of truth for group identity; this table is what the Answerer
-- desk and the mailer read for posture).
--
-- POSTURE, deliberately conservative and identical for all six: scan=true
-- (they are in the weekly export run), crawl=false (no Facebook crawler
-- exists or is planned — decisions.md 2026-08-11), allows_links=false
-- (nobody has confirmed any of these groups' self-promo norms from a real
-- export; a no-link default can only cost us an opportunity, while a wrong
-- link default costs a ban). Flip `allows_links` per group by hand once Joey
-- confirms that group's norms, exactly as the Reddit rows document.
insert into public.community_watchlist (id, platform, name, scan, crawl, allows_links, notes)
values
  ('facebook:kulto-ni-taylor-swift', 'facebook', 'Kulto ni TAYLOR SWIFT', true, false, false, 'Backfilled from the export checklist (issue #4885) — was producing engagement_lead rows with no watchlist row. No-link default until Joey confirms group norms from a real export.'),
  ('facebook:taylor-swifts-vault-2-0', 'facebook', 'Taylor Swift''s Vault 2.0', true, false, false, 'Backfilled from the export checklist (issue #4885). No-link default until Joey confirms group norms from a real export.'),
  ('facebook:taylor-swift-group-563881396975983', 'facebook', 'Taylor Swift fans club', true, false, false, 'Backfilled from the export checklist (issue #4885); name resolved in #4691. No-link default until Joey confirms group norms from a real export.'),
  ('facebook:taylor-swift-group-458298915485042', 'facebook', 'Otro Grupo De Taylor Swift Para Swifties Tercermundistas', true, false, false, 'Backfilled from the export checklist (issue #4885); name resolved in #4691. No-link default until Joey confirms group norms from a real export.'),
  ('facebook:taylor-swift-swifties', 'facebook', 'Taylor Swift- swifties', true, false, false, 'Backfilled from the export checklist (issue #4885). Membership was pending approval as of 2026-09-30. No-link default until Joey confirms group norms from a real export.'),
  ('facebook:taylor-swift-swifties-2', 'facebook', 'Taylor Swift (Swifties)', true, false, false, 'Backfilled from the export checklist (issue #4885). No-link default until Joey confirms group norms from a real export.'),
  ('facebook:the-swifties-society', 'facebook', 'The Swiftie''s Society', true, false, false, 'Backfilled from the export checklist (issue #4885). No-link default until Joey confirms group norms from a real export.')
on conflict (id) do nothing;
