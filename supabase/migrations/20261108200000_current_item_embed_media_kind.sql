-- Video-first slice 3 (docs/plans/2026-10-31-video-first.md, docs/decisions.md
-- 2026-11-08): current_item carries an optional verified embed and a media_kind.
-- Additive only and fully re-runnable (db-migrate has no ledger: if-not-exists
-- columns, drop/add constraints, create-or-replace function, drop/create
-- trigger, and a backfill that matches 0 rows on the second pass).
-- Reads need no new policy or grant: the existing
-- "current_item public read" row policy covers every column, same as image_url.
--
-- embed: null, or {provider, videoId, title?, channelId?, verifiedAt?}.
-- media_kind: 'video' | 'image' | 'text'. Rows written before this migration
-- are backfilled below; the trigger keeps unchanged writers (and the held-image
-- pass that sets image_url later) correct without a worker change.
alter table public.current_item add column if not exists embed jsonb;
alter table public.current_item add column if not exists media_kind text not null default 'text';

update public.current_item set media_kind = 'image' where image_url is not null and embed is null and media_kind = 'text';

alter table public.current_item drop constraint if exists current_item_media_kind_check;
alter table public.current_item add constraint current_item_media_kind_check check (media_kind in ('video', 'image', 'text'));

alter table public.current_item drop constraint if exists current_item_embed_shape_check;
alter table public.current_item add constraint current_item_embed_shape_check check (
  embed is null or (
    jsonb_typeof(embed) = 'object'
    and embed->>'provider' = 'youtube'
    and coalesce(embed->>'videoId', '') <> ''
  )
);

create or replace function public.current_item_derive_media_kind() returns trigger
language plpgsql as $$
begin
  if new.embed is not null then
    new.media_kind := 'video';
  elsif new.media_kind = 'text' and new.image_url is not null then
    new.media_kind := 'image';
  end if;
  return new;
end;
$$;

drop trigger if exists current_item_derive_media_kind on public.current_item;
create trigger current_item_derive_media_kind
  before insert or update on public.current_item
  for each row execute function public.current_item_derive_media_kind();
