-- Retraction corrections are not a preference category: they may only go to
-- devices whose delivery log proves receipt of the original event.
-- The normal router still applies the governor, so corrections consume both
-- the per-device instant cap and the combined hard ceiling.
alter table public.events
  add column if not exists target_device_ids uuid[];

alter table public.events
  drop constraint if exists events_correction_targets_check;

alter table public.events
  add constraint events_correction_targets_check check (
    (category = 'correction' and coalesce(cardinality(target_device_ids), 0) > 0)
    or (category <> 'correction' and target_device_ids is null)
  );

comment on column public.events.target_device_ids is
  'Correction-only audience copied from instant deliveries of the retracted story; normal events are preference-routed.';
