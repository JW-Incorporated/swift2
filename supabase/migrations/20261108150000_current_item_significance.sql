-- Significance verdict for a news item: {tier: 1|2|3, reason, model, at}
-- (docs/decisions.md 2026-11-08). Additive and re-runnable; nothing reads it yet.
alter table public.current_item add column if not exists significance jsonb;
