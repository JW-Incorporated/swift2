# STATE — t_1b319c32 (Notifications Phase 3: Digest engine)

## Current task

Notifications Phase 3 implementation complete: `digest_queue` migration;
router update so daily/weekly-pref devices enqueue into the digest instead
of sending instantly (and instant-tier cap-overflow events roll into the
next daily digest, per spec §6 gate 4); a DST-safe digest scheduling module
(`notification-digest-schedule.ts`) computing the next daily/weekly send
instant per device timezone; the digest dispatch job
(`notification-digest.ts`) that merges ALL of a device's due queued events
into exactly ONE push per (device, cadence) pair; the digest copy generator
(`@swift2/shared/notification-digest-copy.ts`) with the required "Manage
notifications" footer; the Weekly Clown Report branding for the weekly
`easter_egg` send (curated via a clearly-flagged STUB —
`notification-clownbot-source.ts` — since no real Clownbot top-theories
ranking pipeline exists in this repo yet; see that file's header); the
global in-app inbox (`GET /api/notifications/inbox`,
`packages/core/src/notification-inbox.ts`, mobile's
`NotificationInboxScreen.tsx`, reachable from the bell → Notifications →
Inbox) showing every event regardless of push prefs. All typecheck/lint/
build gates pass; full test suite passes except the same 2 pre-existing,
unrelated Node-version failures Phases 0-2 already documented.

## Non-negotiable acceptance test

`notification-digest.test.ts` — "NON-NEGOTIABLE: a device with 4 categories
queued on Daily gets exactly ONE merged push, never 4" — asserts exactly
one `sendPushBatch` call, one delivery row, and a merged body mentioning
every queued category.

## Timezone / DST tests

`notification-digest-schedule.test.ts` — 21 tests covering America/
Los_Angeles, Asia/Tokyo (no DST), and Australia/Sydney (southern-hemisphere
DST), plus BOTH the 2026-03-08 spring-forward and 2026-11-01 fall-back
transition days for America/Los_Angeles, verifying no double-send and no
zero-send across each transition. Required a one-step fixed-point offset
refinement in `localDateHourToUtc()` (a single offset probe can land on the
wrong side of a transition on the transition day itself); documented in
that function's comment.

## Weekly Clown Report — curation is a documented stub, not fake data

`packages/core/src/notification-clownbot-source.ts`'s `getTopTheories()` is
NOT the "real" Clownbot-curated top-theories ranking the plan describes —
that pipeline doesn't exist anywhere in this repo (confirmed by search).
It queries the real, already-screened `live_theory` table (heat-ordered,
`outcome = 'pending'`) as a reasonable interim rule — every theory surfaced
is real content, never fabricated — but is explicitly flagged (module
header + SETUP_NOTIFICATIONS.md) as a placeholder ranking pending a real
Clownbot scoring pipeline.

## Scope note

Phase 4+ (fun notifications, remaining categories, web push) NOT started —
out of this task's scope per NOTIFICATIONS_PLAN.md. Phases 4-6 are
pre-queued as separate kanban tasks with their own gating.

## Architect invocations

None this task.
