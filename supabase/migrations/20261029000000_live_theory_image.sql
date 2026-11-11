-- Every published card carries media (owner rule). `live_theory` rendered
-- text-only; it now carries an evidence image like `current_item`.
--
-- image_url: hotlinked, allowlisted image taken from the theory's cited
-- current_item evidence (validated by @swift2/shared's evaluateImageUrl at
-- write time). quality_hold_reason records WHY a row is held
-- (`missing_image` / `image_host_not_allowlisted`), same diagnostic role as
-- current_item.quality_hold_reason (20261013000000).
--
-- Fail closed at the database: the anon read policy now also requires a
-- non-null image_url, so legacy imageless rows (and any writer that forgets
-- the gate) are invisible without mutating a single existing row. The worker's
-- held-image pass backfills image_url from evidence when one is available.
-- Additive: new nullable columns only; the policy is the one behavior change.
alter table public.live_theory add column if not exists image_url text;
alter table public.live_theory add column if not exists quality_hold_reason text;

drop policy if exists "live_theory public read" on public.live_theory;
create policy "live_theory public read" on public.live_theory
  for select using (
    redline_ok = true
    and image_url is not null
    and (expires_at is null or expires_at > now())
  );
