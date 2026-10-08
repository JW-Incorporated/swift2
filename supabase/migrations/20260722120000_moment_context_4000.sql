-- Raise the moment.context cap from 2000 to 4000 characters.
--
-- Why (founder decision, Wyatt, 2026-07-22): the 2000-char ceiling had become
-- the binding constraint on exactly the pages that matter most. Measured over
-- the 24-hour depth push of 2026-07-20/21: 91 curiosity ledgers were filed and
-- the marquee pages — the MSG wedding, the engagement, the 4.002-million debut
-- week — came out BYTE-IDENTICAL, because the field they would have grown into
-- was already full. Research kept arriving and had nowhere to land.
--
-- Scope of the problem when measured: 16 of 701 moments sat at 1900+ (the top
-- five at 1997, 1992, 1991, 1989, 1988 — pressed flat against the wall), 19
-- more between 1500-1899, and 666 comfortably under. So this is not a
-- corpus-wide squeeze; it is a small set of high-traffic pages hitting a hard
-- edge. 4000 gives them roughly one more section each while keeping a real
-- limit — the field is still a summary, not a rehosted article body, which is
-- what the original constraint was protecting.
--
-- Postgres re-validates the constraint against existing rows on ADD, which is
-- safe here: every current value is <= 2000 and therefore <= 4000. Widening a
-- CHECK can never fail on data that satisfied the narrower one.
--
-- The mirror of this rule in scripts/validate-content.mjs moves in the same
-- commit; if the two ever disagree, seeds pass CI and then fail at the database.

alter table public.moment
  drop constraint if exists moment_context_len;

alter table public.moment
  add constraint moment_context_len check (char_length(context) <= 4000);
