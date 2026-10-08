-- Vault (time-machine) v1 schema.
-- Static, read-only, editorially authored. Titles/snippets/links/metadata only —
-- NO article bodies, images are hotlinked URLs (never rehosted). CHECK
-- constraints below enforce the "no bodies" rule; RLS makes the Vault public-read.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- era: one per Taylor era, ordered along the timeline, carries its theme tokens.
-- ---------------------------------------------------------------------------
create table if not exists public.era (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  album           text not null,
  start_date      date not null,
  end_date        date not null,
  sort_order      integer not null,
  theme           jsonb not null,          -- EraTheme: bg/surface/ink/accent/heroGradient/eyebrow…
  cover_image_url text,                     -- hotlink or null; never rehosted
  created_at      timestamptz not null default now(),
  constraint era_dates_ordered check (end_date >= start_date)
);
create index if not exists era_sort_order_idx on public.era (sort_order);

-- ---------------------------------------------------------------------------
-- milestone: wavetop events (album releases, tours) rendered as timeline markers.
-- ---------------------------------------------------------------------------
create table if not exists public.milestone (
  id         uuid primary key default gen_random_uuid(),
  era_slug   text not null references public.era (slug) on delete cascade,
  type       text not null check (type in ('album_release', 'tour')),
  title      text not null,
  date       date not null,
  created_at timestamptz not null default now()
);
create index if not exists milestone_era_slug_idx on public.milestone (era_slug);
create index if not exists milestone_date_idx on public.milestone (date);

-- ---------------------------------------------------------------------------
-- month_item: one line in the always-resident month index (Tier 0).
-- ---------------------------------------------------------------------------
create table if not exists public.month_item (
  id            uuid primary key default gen_random_uuid(),
  era_slug      text not null references public.era (slug) on delete cascade,
  year          integer not null,
  month         integer not null check (month between 1 and 12),
  category      text not null check (category in
                  ('sighting','fashion','relationship','tour','business','music','release')),
  title         text not null,
  snippet       text not null default '',
  source_url    text,
  thumbnail_url text,                       -- hotlink or null; never rehosted
  created_at    timestamptz not null default now(),
  -- enforce "no article bodies": a snippet is a short preview, not full text.
  constraint month_item_snippet_len check (char_length(snippet) <= 400)
);
create index if not exists month_item_era_idx on public.month_item (era_slug);
create index if not exists month_item_ym_idx on public.month_item (year, month);

-- ---------------------------------------------------------------------------
-- moment: on-demand detail (Tier 1) behind a single month item. 1:1 with item.
-- ---------------------------------------------------------------------------
create table if not exists public.moment (
  month_item_id uuid primary key references public.month_item (id) on delete cascade,
  context       text not null default '',
  sources       jsonb not null default '[]'::jsonb,  -- [{outlet,url}]
  photos        jsonb not null default '[]'::jsonb,  -- [{url,credit}] hotlinked
  created_at    timestamptz not null default now(),
  -- still metadata, not a rehosted article body.
  constraint moment_context_len check (char_length(context) <= 2000)
);

-- ---------------------------------------------------------------------------
-- RLS: the Vault is public and read-only. Anyone may SELECT; nobody may write
-- through the anon/authenticated roles (service_role bypasses RLS for seeding).
-- ---------------------------------------------------------------------------
alter table public.era enable row level security;
alter table public.milestone enable row level security;
alter table public.month_item enable row level security;
alter table public.moment enable row level security;

drop policy if exists "era public read"        on public.era;
drop policy if exists "milestone public read"  on public.milestone;
drop policy if exists "month_item public read" on public.month_item;
drop policy if exists "moment public read"     on public.moment;

create policy "era public read"        on public.era        for select using (true);
create policy "milestone public read"  on public.milestone  for select using (true);
create policy "month_item public read" on public.month_item for select using (true);
create policy "moment public read"     on public.moment     for select using (true);
