-- Retraction is operational state, distinct from the worker-owned status
-- field. The additive column and policy replacement are safe to re-apply.

alter table public.current_item
  add column if not exists retracted_at timestamptz;

drop policy if exists "current_item public read" on public.current_item;

create policy "current_item public read" on public.current_item
  for select using (redline_ok = true and (expires_at is null or expires_at > now()) and retracted_at is null);
