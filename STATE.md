# STATE — t_c41f475d (Notifications Phase 2: Instant pipeline + onboarding)

## Current task

Notifications Phase 2 implementation complete: `events`/`deliveries`
migrations, the `insertEvent()` producer seam with dedupe + T1 5-min delay,
Governor v1 (all four spec §6 gates, exhaustively unit-tested incl.
adversarial coalescing/cap-overflow cases), the router (fan-out + governor
+ delivery logging + invalid-token pruning), a batched FCM sender with
retry, wiring for all five Phase 2 launch categories into their existing
detection pipelines, deep links + "Mute this type"/"Settings" notification
actions, the pre-permission onboarding screen with spec §7's three presets
verbatim, and the T1 kill-switch script. All typecheck/lint/build gates
pass; full test suite passes except the same 2 pre-existing, unrelated
Node-version failures Phase 0/1 already documented.

## Producer seam map (per this task's instruction to document it)

- `song_drop` / `album_news` / `tour_news` (T1) — `apps/worker/src/extract/
  write-knowledge.ts`'s `writeCurrentItem()`, gated on `category` mapping +
  `statusHint === 'confirmed'`. The news/extraction pipeline (news-worker.yml,
  every 4h) is the only existing detector for these.
- `official_merch` — `scripts/merch-engine/emit-official-merch-event.mjs`,
  called from `merch-official-sync.yml`'s `author` job right after it builds
  the existing store-drop social draft, reading the same artifact.
- `official_youtube` — `scripts/appearance-discovery/lib/
  emit-official-youtube-event.mjs`, called from `discover.mjs`'s FILE_MODE
  loop for candidates tagged `rule: 'all-uploads'` (Taylor's own channel).

Every seam is exactly one `insertEvent()` call site per pipeline, per this
task's instruction ("keep coupling to one helper call, do not scatter
insertEvent() calls").

## Scope note

Phase 3+ (digest engine and beyond) NOT started — out of this task's scope
per NOTIFICATIONS_PLAN.md. Phases 3-6 are pre-queued as separate kanban
tasks with their own gating; this task does not touch them.

## Architect invocations

None this task.
