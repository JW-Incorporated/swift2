-- Fast-follow to 20260901000000_knowledge_engine.sql: a retroactive Codex
-- review (task-mt6t7akh-a22733) found live_theory has no redline_ok column,
-- unlike current_item/fan_signal/knowledge_doc — its public-read policy
-- checked expiry only, no schema-level defense in depth against a future
-- writer (a site-authored theory, a later promotion path) that skips the
-- extract stage's theoryPassesScreen() gate (apps/worker/src/extract/
-- write-knowledge.ts). Every live_theory row today was already screened
-- BEFORE insert (theoryPassesScreen gates the write itself, not just a
-- flag), so backfilling existing rows to true is correct, not a guess.

alter table public.live_theory add column if not exists redline_ok boolean not null default false;

update public.live_theory set redline_ok = true where redline_ok = false;

drop policy if exists "live_theory public read" on public.live_theory;
create policy "live_theory public read" on public.live_theory
  for select using (redline_ok = true and (expires_at is null or expires_at > now()));
