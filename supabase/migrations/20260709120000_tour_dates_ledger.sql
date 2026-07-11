-- Vault tour dates ledger (2026-07-09, T17 follow-up): a per-city `dates`
-- jsonb column on public.tour, DISTINCT from the curated `shows` column.
-- `shows` stays the hand-picked notable-moment model (surprise songs, guests,
-- per-claim confidence + sources); `dates` is the full factual per-city /
-- per-night ledger transcribed from each tour's Wikipedia "Tour dates" table
-- ([TourDate]: date/city/venue/country, optional note). High-volume factual
-- data must not be forced into the curated-highlights structure.
-- Additive; zero effect on existing rows. Reseed via npm run db:seed:tours.

alter table public.tour add column if not exists dates jsonb not null default '[]'::jsonb;  -- [TourDate] — full per-city ledger
