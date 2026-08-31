# STATE — t_bc017313 (Notifications Phase 4: Fun notifications)

## Current task

Notifications Phase 4 implementation complete, scoped strictly to
NOTIFICATIONS_PLAN.md's Phase 4 line item: `lyrics`/`lyric_history`/
`on_this_day` migrations (`supabase/migrations/20260913000000_
notifications_fun.sql`, also adding `countdown_sends` + `events.drop_at`
for the countdown scheduler in the same table family); a starter lyric
pool (`supabase/seed/lyrics/starter-pool.mjs`, 224 entries across all 12
eras in the repo's track catalogue) explicitly marked DRAFT / pending
founder review, with a `verified` flag defaulting false that the
production dispatch job gates on; `on_this_day` seed content
(`supabase/seed/on-this-day/starter-pool.mjs`, 37 entries) derived
directly from the repo's real `MILESTONES` timeline data (`apps/web/lib/
longlive/content.ts`), not invented; the fun-notification scheduling math
(`notification-fun-schedule.ts`, DST-safe, mirrors
`notification-digest-schedule.ts`'s technique) and dispatch orchestration
(`notification-fun.ts`) for lyric_of_day/on_this_day at Daily/Weekly/
Monthly cadence; the 12-month per-device lyric no-repeat rule
(`lyric_history` + `selectLyricForDevice`); `on_this_day` silently skipping
dates with no entry (`selectOnThisDayEntry` returns null, no filler ever
sent); the countdown scheduler (`scheduleCountdowns`/
`scheduleCountdownsForPendingEvents`/`dispatchDueCountdowns`) creating
T-7d/T-1d/release-hour sends from `events.drop_at` for opted-in devices,
self-limiting for short-notice drops; a new `countdowns` category (On/Off
cadence variant, spec §4) with its own `EVENT_CADENCES` pill set
(`CadencePills.tsx` now supports 'steady'/'fun'/'event' variants) and Fun
section settings row. All wired into the existing `/api/notifications/
dispatch` cron route alongside Phases 2/3's router/digest/clown-report
passes. Typecheck/lint/build/tests all pass (see Verification below).

## Non-negotiable acceptance test

`notification-fun.test.ts`'s "30-day simulation" describe blocks
(NOTIFICATIONS_PLAN.md Phase 4 acceptance): a 30-day simulated daily/
weekly/monthly run produces the correct send count per cadence with ZERO
lyric repeats (asserted via `Set` size == array length across the whole
window, including the small-pool-exhaustion case where sends correctly
stop rather than repeat), and on_this_day sends nothing on dates with no
entry while still sending on dates that do have one — including an
entirely-empty-pool case that sends nothing across all 30 days.

## DRAFT content flags — do not treat as final

- **Lyrics** (`supabase/seed/lyrics/starter-pool.mjs`): 224 single-line
  excerpts, one per released track in this repo's catalogue, written from
  general knowledge of the discography — NOT verified against a licensed
  lyrics source line-by-line. Every row's `verified` field is `false`
  until a human confirms the exact wording; the dispatch job
  (`selectLyricForDevice(..., requireVerified: true)`) never sends an
  unverified row in production. **Founder must review before any real
  device receives lyric_of_day content** — flag repeated in the PR body.
- **Legal position** (recorded, not re-litigated): short lyric excerpts
  may proceed per the 2026-08-31 founder decision on this task
  (NOTIFICATIONS_SPEC.md §12 Q3 is resolved, not open).
- **on_this_day**: derived directly from the shipped `MILESTONES` timeline
  (real, already-published site content) — no separate founder review
  gate needed the way the lyric pool has one, since nothing here is new
  content, just a repackaging of what's already live on the site.

## Countdown scheduler design note

`events.drop_at` (new nullable column) is only ever set by a producer that
knows a firm announced date — Phase 4 does NOT wire any new producer to
set it (that's a Phase 5+/future concern); the scheduler and its tests
prove the MATH is correct (`scheduleCountdowns`) and the DB orchestration
runs safely with zero eligible events today (empty result, no error).

## Scope note

Phase 5+ (remaining categories, governor polish, web push) NOT started —
out of this task's scope per NOTIFICATIONS_PLAN.md. `swiftie_trivia` (also
a Fun-group category in spec §4) was NOT wired to send this phase — Phase
4's scope per NOTIFICATIONS_PROMPTS.md is explicitly `lyric_of_day` +
`on_this_day` + the countdown scheduler; `swiftie_trivia`'s settings row
already existed (Phase 1) and continues to accept prefs with no send path
yet, same as before this task.

## Verification

- `npm run typecheck` — clean across all 5 workspaces.
- `npm run lint` — 0 errors (2 pre-existing unrelated warnings in
  scripts/merch-engine/*.test.ts, untouched by this PR).
- `npm test` (`vitest run`) — 4347 passed, 2 skipped, 2 failed — the 2
  failures are the same pre-existing `scripts/lib/gh.test.ts`
  `Promise.withResolvers` Node-version issue Phases 0-3 already
  documented as unrelated to notifications work.
- `npm run build --workspace=@swift2/web` — production build succeeds;
  `/api/notifications/dispatch` route unchanged in shape, now also runs
  the fun + countdown passes.
- Three existing tests' hardcoded category counts (13 → 14) updated for
  the new `countdowns` category:
  `apps/mobile/lib/notification-actions.test.ts`,
  `packages/core/src/notification-prefs.test.ts`,
  `packages/shared/src/notifications-onboarding.test.ts`.

## Architect invocations

None this task.
