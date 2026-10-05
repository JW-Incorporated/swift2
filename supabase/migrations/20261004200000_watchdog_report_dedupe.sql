-- Durable dedupe for [watchdog] reports (#4874, follow-up to #4867). The
-- in-memory flood caps in apps/web/app/api/feedback/watchdog-report.ts are per
-- serverless instance. This table is the global source of truth: one row per
-- (UTC day, buildKey, category), so a widespread failure posts at most one
-- GitHub comment per build+category per day, and the row count per day is the
-- durable global cap. Service-role only: RLS on, no policies.
create table if not exists public.watchdog_report_dedupe (
  day date not null,
  build_key text not null,
  category text not null,
  created_at timestamptz not null default now(),
  primary key (day, build_key, category)
);

alter table public.watchdog_report_dedupe enable row level security;
