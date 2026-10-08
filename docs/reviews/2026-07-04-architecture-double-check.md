# Architecture double-check — 2026-07-04

Reviewer: Claude (CTO track), with an independent **Codex** read-only audit of
`packages/shared` + `packages/core`. Scope: the shared/core platform boundary,
the Supabase data access + mappers, the two-tier serving model, and the web
API routes.

## Verdict

The architecture is sound. The expensive bet — a write-once `shared`/`core`
domain layer reused by both web and Expo — **holds empirically**: no
`window`/`document`/`fs`/`process.env`/`require` anywhere in `packages/`
(grep + Codex both confirm), and the new Expo app typechecks reusing both
packages unchanged under the React Native tsconfig. Two-tier serving, pure
defensive mappers, and the CI-enforced budget/content gates all check out.

Findings below were fixed in `fix/data-access-hardening` unless marked deferred.

## Fixed

| # | Sev | Finding | Fix |
|---|-----|---------|-----|
| 1 | Med | **Tier 0 used `select('*')`** — served the raw row (incl. `id`/`created_at`), and a future editorial column would silently bloat the payload and bypass the budget script (which measures the *mapped* shape). *(Codex)* | Explicit column lists per table, equal to what the mappers read. |
| 2 | Med | **Unstable ordering** — `month_item` ordered only by `year,month`; with 5–8 items/month and no tie-breaker, cards reshuffle between fetches. *(Codex)* | Added `id` as a stable tie-breaker (milestones too). |
| 3 | Med | **`createClient` with no auth options** baked Supabase Auth session/storage defaults (browser localStorage / RN AsyncStorage expectations) into portable `core`. *(Codex)* | `auth: { persistSession: false, autoRefreshToken: false }` — public read-only, no session machinery. |
| 4 | Med | **No Tier 0 row ceiling** — PostgREST's implicit cap could silently truncate the timeline as content scales (the budget gate wouldn't catch it: 1000 items ≈ 127 KB ≪ 2 MB). *(self)* | Explicit `.limit(TIER0_MAX_ROWS=2000)` + throw if `month_item` hits the cap — loud, not silent. |
| 5 | Low | **Mappers coerced non-string URLs** — `String({})` → `"[object Object]"` passed as a valid link. *(Codex)* | `asUrl()` accepts only real strings; malformed entries dropped. Test added. |
| 6 | Low | **API 500s echoed raw `err.message`** to clients (moment + tracks routes) — info leak. *(self)* | Log server-side; return a generic `"internal error"`. |

## Deferred (documented, not urgent)

- **Full windowed pagination for Tier 0.** The `.limit()` + guard (fix #4) turns
  silent truncation into a loud failure, but the real fix at very large scale is
  the windowed prefetch already contemplated in the roadmap (W6 fallback). Not
  needed at 100 items; the guard trips well before it matters.
- **`era.theme` runtime validation.** Still cast `as EraTheme` from `jsonb`.
  Themes are authored in seed files (controlled), so risk is low; a malformed
  theme would surface as a render glitch, not a data-integrity bug. Left as-is.
- **A `sort_order` column on `month_item`** would give editors explicit
  intra-month ordering control (the `id` tie-breaker only guarantees stability,
  not curation). Worth a migration if/when editors want to hand-order a month.
