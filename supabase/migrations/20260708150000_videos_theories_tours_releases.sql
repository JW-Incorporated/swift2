-- Vault new content types (2026-07-08 content audit §4): releases, tours,
-- theories, videos — all NON-month-scoped, same discipline as track_note:
-- reached from the era/album, loaded on demand, OFF the Tier-0 timeline
-- payload. Short sourced notes, links only, no fabrication, RLS public-read.
-- Also adds the `video` value to the month_item category CHECK (audit §4a) —
-- additive; zero effect on existing rows.
-- Ref: docs/content/content-audit-2026-07-08.md

-- ---------------------------------------------------------------------------
-- month_item: allow the new `video` category (music videos / lyric videos /
-- short films as first-class dated items).
-- ---------------------------------------------------------------------------
alter table public.month_item drop constraint if exists month_item_category_check;
alter table public.month_item add constraint month_item_category_check check (category in
  ('sighting','fashion','relationship','tour','business','music','release','video'));

-- ---------------------------------------------------------------------------
-- release: canonical discography — albums, re-recordings, EPs, deluxes.
-- ---------------------------------------------------------------------------
create table if not exists public.release (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  era_slug            text not null references public.era (slug) on delete cascade,
  kind                text not null check (kind in ('album','rerecording','ep','deluxe','single','live')),
  title               text not null,
  release_date        date not null,
  label               text,
  track_count         integer,
  parent_release_slug text,                                -- version-parent (deluxe/TV -> root), soft ref
  tracklist           jsonb not null default '[]'::jsonb,  -- [title, ...] — facts, never lyrics
  note                text not null default '',
  sources             jsonb not null default '[]'::jsonb,  -- [SourceRef]
  created_at          timestamptz not null default now(),
  constraint release_note_len check (char_length(note) <= 400)
);
create index if not exists release_era_idx on public.release (era_slug);
create index if not exists release_date_idx on public.release (release_date);

-- ---------------------------------------------------------------------------
-- tour: one row per headline tour; per-show depth lives in `shows` jsonb.
-- ---------------------------------------------------------------------------
create table if not exists public.tour (
  id                  uuid primary key default gen_random_uuid(),
  slug                text not null unique,
  era_slug            text not null references public.era (slug) on delete cascade,
  title               text not null,
  opened_on           date not null,
  closed_on           date,                                -- null while ongoing
  legs                jsonb not null default '[]'::jsonb,  -- [TourLeg]
  show_count          integer,
  surprise_songs_note text,
  shows               jsonb not null default '[]'::jsonb,  -- [TourShow] — notable documented shows
  note                text not null default '',
  sources             jsonb not null default '[]'::jsonb,  -- [SourceRef]
  created_at          timestamptz not null default now(),
  constraint tour_note_len check (char_length(note) <= 400)
);
create index if not exists tour_era_idx on public.tour (era_slug);

-- ---------------------------------------------------------------------------
-- theory: easter eggs + fan theories, ALWAYS labeled with confidence+outcome
-- so speculation never renders as fact.
-- ---------------------------------------------------------------------------
create table if not exists public.theory (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  era_slug      text not null references public.era (slug) on delete cascade,
  kind          text not null check (kind in ('easter_egg','theory')),
  title         text not null,
  claim         text not null default '',
  evidence      text,
  confidence    text not null check (confidence in
                  ('official','confirmed_interview','reputable_reporting','strong_fan_consensus',
                   'plausible','clowning','disproven','joke_meme')),
  outcome       text not null check (outcome in
                  ('confirmed','partially_confirmed','pending','debunked','abandoned','unfalsifiable')),
  related_slugs jsonb not null default '[]'::jsonb,        -- ['era:slug', ...]
  sources       jsonb not null default '[]'::jsonb,        -- [SourceRef]
  created_at    timestamptz not null default now(),
  constraint theory_claim_len check (char_length(claim) <= 400),
  constraint theory_evidence_len check (char_length(coalesce(evidence, '')) <= 2000)
);
create index if not exists theory_era_idx on public.theory (era_slug);

-- ---------------------------------------------------------------------------
-- video_work: official videos/visual media (music videos, short films, tour
-- films, documentaries). Media refs are rights-aware jsonb (MediaRef) —
-- typically an oEmbed of the official upload; nothing rehosted.
-- ---------------------------------------------------------------------------
create table if not exists public.video_work (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  era_slug      text not null references public.era (slug) on delete cascade,
  kind          text not null check (kind in
                  ('music_video','lyric_video','short_film','tour_film','documentary','performance')),
  title         text not null,
  director      text,
  released_on   date,
  related_songs jsonb not null default '[]'::jsonb,        -- [title, ...]
  summary       text not null default '',
  symbolism     text,
  easter_eggs   jsonb not null default '[]'::jsonb,        -- [short line, ...]
  official_url  text,
  media         jsonb not null default '[]'::jsonb,        -- [MediaRef]
  sources       jsonb not null default '[]'::jsonb,        -- [SourceRef]
  created_at    timestamptz not null default now(),
  constraint video_work_summary_len check (char_length(summary) <= 400),
  constraint video_work_symbolism_len check (char_length(coalesce(symbolism, '')) <= 2000)
);
create index if not exists video_work_era_idx on public.video_work (era_slug);

-- ---------------------------------------------------------------------------
-- RLS: public read-only, like the rest of the Vault (service_role bypasses
-- for seeding).
-- ---------------------------------------------------------------------------
alter table public.release enable row level security;
alter table public.tour enable row level security;
alter table public.theory enable row level security;
alter table public.video_work enable row level security;

drop policy if exists "release public read"    on public.release;
drop policy if exists "tour public read"       on public.tour;
drop policy if exists "theory public read"     on public.theory;
drop policy if exists "video_work public read" on public.video_work;

create policy "release public read"    on public.release    for select using (true);
create policy "tour public read"       on public.tour       for select using (true);
create policy "theory public read"     on public.theory     for select using (true);
create policy "video_work public read" on public.video_work for select using (true);
