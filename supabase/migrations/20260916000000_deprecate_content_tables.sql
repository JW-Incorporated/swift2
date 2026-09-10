-- OS-016 (docs/specs/2026-09-05-one-source-three-surfaces.md §6 Phase 1):
-- mark the Supabase content tables deprecated now that every surface (web,
-- OS-014; mobile, OS-015) reads the published content bundle instead of
-- these tables. NO DROP YET — per the card's Steps, tables are kept for one
-- release cycle so any missed reader/report is a loud "still readable", not
-- a silent break. A follow-up card drops them once that cycle has passed
-- with no code path outside `scripts/` (i.e. seed/backup-drill tooling)
-- reading them.
--
-- `on_this_day` is deliberately NOT included — it is a distinct, still-live
-- notification pool read by `packages/core/src/notification-fun.ts`, not
-- part of the retired content set (era/milestone/month_item/moment/
-- track_note/release/tour/theory/video_work).
comment on table public.era is
  'DEPRECATED (OS-016, 2026-09-06): content moved to the published bundle (packages/content). No code path outside scripts/ reads this table. Scheduled for drop after one release cycle — see docs/specs/2026-09-05-one-source-three-surfaces.md.';
comment on table public.milestone is
  'DEPRECATED (OS-016, 2026-09-06): content moved to the published bundle (packages/content). No code path outside scripts/ reads this table. Scheduled for drop after one release cycle — see docs/specs/2026-09-05-one-source-three-surfaces.md.';
comment on table public.month_item is
  'DEPRECATED (OS-016, 2026-09-06): content moved to the published bundle (packages/content). No code path outside scripts/ reads this table. Scheduled for drop after one release cycle — see docs/specs/2026-09-05-one-source-three-surfaces.md.';
comment on table public.moment is
  'DEPRECATED (OS-016, 2026-09-06): content moved to the published bundle (packages/content). No code path outside scripts/ reads this table. Scheduled for drop after one release cycle — see docs/specs/2026-09-05-one-source-three-surfaces.md.';
comment on table public.track_note is
  'DEPRECATED (OS-016, 2026-09-06): content moved to the published bundle (packages/content). No code path outside scripts/ reads this table. Scheduled for drop after one release cycle — see docs/specs/2026-09-05-one-source-three-surfaces.md.';
comment on table public.release is
  'DEPRECATED (OS-016, 2026-09-06): content moved to the published bundle (packages/content). No code path outside scripts/ reads this table. Scheduled for drop after one release cycle — see docs/specs/2026-09-05-one-source-three-surfaces.md.';
comment on table public.tour is
  'DEPRECATED (OS-016, 2026-09-06): content moved to the published bundle (packages/content). No code path outside scripts/ reads this table. Scheduled for drop after one release cycle — see docs/specs/2026-09-05-one-source-three-surfaces.md.';
comment on table public.theory is
  'DEPRECATED (OS-016, 2026-09-06): content moved to the published bundle (packages/content). No code path outside scripts/ reads this table. Scheduled for drop after one release cycle — see docs/specs/2026-09-05-one-source-three-surfaces.md.';
comment on table public.video_work is
  'DEPRECATED (OS-016, 2026-09-06): content moved to the published bundle (packages/content). No code path outside scripts/ reads this table. Scheduled for drop after one release cycle — see docs/specs/2026-09-05-one-source-three-surfaces.md.';
