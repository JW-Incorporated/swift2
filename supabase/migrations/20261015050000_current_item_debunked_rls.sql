-- A retracted current item stays hidden even if a service-role writer later
-- changes redline_ok. Preserve the original public-read conditions and add
-- status as an independent visibility gate.

drop policy if exists "current_item public read" on public.current_item;

create policy "current_item public read" on public.current_item
  for select using (redline_ok = true and (expires_at is null or expires_at > now()) and coalesce(status, '') <> 'debunked');
