# STATE — t_cc9863cb (Notifications Phase 5: Remaining categories + governor polish)

## Current task

Notifications Phase 5 implementation complete, scoped strictly to
NOTIFICATIONS_PLAN.md's Phase 5 line item: producer wiring for
`relationship_news`, `public_appearance`, `award_news`, `fan_merch`, and
instant-tier `easter_egg`; the auto-cooldown job (30-day non-openers
downgraded Instant→Daily plus one notice push, spec §6); and enforcement of
the 6/day hard ceiling (instant + scheduled combined) with tests. Phases
0-4 (foundations, prefs, instant pipeline, digests, fun notifications) were
already merged to `origin/main`.

## Producer wiring (spec §4 categories)

- **`relationship_news`, `public_appearance`, `award_news`** — extended the
  SAME Phase 2 seam (`apps/worker/src/extract/write-knowledge.ts`'s
  `writeCurrentItem()` → `emitLaunchCategoryEvent()`). The
  news/extraction pipeline already classifies `current_item.category` as
  `relationship`/`award`, and `sighting`/`statement` both map to
  `public_appearance` per spec §4 ("public_appearance intentionally
  absorbs TV/interview appearances"). No new detector — this is the "map
  each to whatever existing detection pipeline is closest" case, gated on
  `statusHint === 'confirmed'` exactly like the Phase 2 launch categories
  (T1/T2/T3 tier doesn't change the confirmed-only discipline; a false
  "confirmed" push on relationship news is the highest-harm case in the
  whole taxonomy).
- **`easter_egg` instant tier** — wired into `upsertLiveTheory()`'s
  fresh-insert branch only (never on a heat/last-seen bump), so a theory
  that gets re-mentioned notifies once per theory lifetime, not on every
  re-observation. The Weekly Clown Report digest (Phase 3) is unaffected —
  this only adds the Instant cadence option spec §4 lists for `easter_egg`.
- **`fan_merch`** — new producer script
  (`scripts/merch-engine/emit-fanmade-event.mjs`), mirroring
  `emit-official-merch-event.mjs`'s Phase 2 seam one level up:
  `authorFanmadeCatalog()` (`scripts/merch-engine/author-catalogs.mjs`) now
  returns a `socialDraft` and calls the emitter from its CLI `main()`.
  **FLAGGED**: unlike `official_merch`, there is no scheduled GitHub
  Actions workflow that invokes the fanmade authoring lane today (grep of
  `.github/workflows/*.yml` confirms `merch-fanmade.yml` only files
  candidate issues and `merch-e5-evidence.yml` only collects raw evidence;
  neither calls `author-catalogs.mjs --fanmade-curation`). The producer
  code is real (not a fake stub) and fires correctly whenever a founder or
  a future workflow runs the authoring CLI — it just isn't on a cron yet.
  Flagged here and in the PR body per this task's instruction to flag
  rather than invent a fake automated detector.

## Auto-cooldown job (spec §6)

New module `packages/core/src/notification-cooldown.ts`:
`isCooldownEligible()` is a pure decision function (device has >=1
`instant` pref, has delivery history older than 30 days, and zero
`opened_at` within the last 30 days); `runCooldownPass()` is the DB
orchestration — downgrades every `instant` pref to `daily` and sends the
one required "We've quieted things down" notice push. Wired into
`/api/notifications/dispatch` alongside every other pass.

**FLAGGED**: `deliveries.opened_at` (the column this job reads) already
exists in the schema (Phase 2 migration) but the client callback that
SETS it on a real notification open is Phase 6 scope
(NOTIFICATIONS_PLAN.md Phase 6: "notification-open callback →
deliveries.opened_at") and is not wired yet. This job is written against
the correct spec §6 semantic (not a last-seen-at proxy) so it needs no
rework once Phase 6 lands the callback; until then every delivery's
`opened_at` is null, so any device with an `instant` pref and 30+ days of
delivery history is cooldown-eligible in production today. Flagged here,
in the module's own header comment, and in the PR body.

## Hard ceiling (spec §6.4, "combined instant+scheduled can never exceed
6/day, hard ceiling")

New Governor gate 6 (`packages/core/src/notification-governor.ts`):
`gateHardCeiling()` + `HARD_CEILING_PER_DAY = 6`, run last in
`evaluateGovernor()` (after master/snooze, quiet hours, coalescing, and
the existing per-category daily cap). Counts EVERY delivery kind (instant
+ digest + fun), not just instant — `totalDeliveriesToday()` (also in
notification-governor.ts, to avoid a router↔digest circular import) is the
shared counter, called by the router's instant-send path, the digest
dispatch loop, the Weekly Clown Report send, the fun-notification
dispatch loop, and the countdown dispatch loop. A ceiling-blocked digest's
queued rows stay queued (same "wait, don't drop" posture as the existing
send-window hold) rather than being lost.

## Non-negotiable acceptance test

`notification-cooldown.test.ts`'s "ACCEPTANCE: a seeded stale device (old
deliveries, zero opens in 30d) is eligible" / "ACCEPTANCE: downgrades a
seeded stale device and sends exactly one notice push" tests are the
plan's stated Phase 5 acceptance criterion ("cooldown job verified against
a seeded stale device"), plus adversarial cases: an engaged device
(recent open) is never downgraded, a fresh device (no delivery history
yet) is never downgraded, and an open exactly at the 30-day cutoff still
counts as recent.

## Scope note

Phase 6 (web push + analytics) NOT started — out of this task's scope per
NOTIFICATIONS_PLAN.md. The `deliveries.opened_at` write path (notification-
open callback) and web push registration remain Phase 6 work; the
auto-cooldown job above is correctly written against that eventual state
but degrades gracefully (never throws, never fabricates opens) until then.

## Verification

- `npm run typecheck` — clean across all 5 workspaces.
- `npm run lint` — 0 errors (2 pre-existing unrelated warnings in
  scripts/merch-engine/*.test.ts, untouched by this PR).
- `npm test` (`vitest run`) — 4360 passed, 2 skipped, 2 pre-existing
  failures in `scripts/lib/gh.test.ts` (`Promise.withResolvers`, the same
  Node-version/sandbox issue Phases 0-4 already documented as unrelated to
  notifications work).
- `npm run build --workspace=@swift2/web` — production build succeeds;
  `/api/notifications/dispatch` route unchanged in shape, now also runs
  the cooldown pass.

## Architect invocations

None this task.
