-- News post quality engine (docs/decisions.md 2026-11-03): store the pass-A
-- fact list and the 1-5 judge writing score on current_item, plus a copy
-- snapshot table so the backfill rewrite is reversible. Additive.

-- pass-A fact list [{id,claim,attribution,confidence}]; nullable.
alter table public.current_item add column if not exists facts jsonb;
alter table public.current_item add column if not exists writing_score smallint;
alter table public.current_item drop constraint if exists current_item_writing_score_range;
alter table public.current_item add constraint current_item_writing_score_range check (writing_score between 1 and 5);

create table if not exists public.current_item_copy_snapshot (
  id               bigint generated always as identity primary key,
  current_item_id  uuid not null references public.current_item (id) on delete cascade,
  headline         text,
  summary          text,
  detail           text,
  facts            jsonb,
  reason           text not null default 'backfill',
  snapshot_at      timestamptz not null default now()
);
create index if not exists current_item_copy_snapshot_item_at_idx
  on public.current_item_copy_snapshot (current_item_id, snapshot_at desc);

-- No policies on purpose: service role only.
alter table public.current_item_copy_snapshot enable row level security;
