# Architecture due-diligence review — Swift2 / LongLiveTS.com (2026-09-04)

Reviewer: Fable 5.1 (high effort), kanban `t_52a3be8a`. Read-only review of
`origin/main` at `497c71ce`. This describes what is **actually in the tree**,
not what `docs/architecture.md`, PLAN files, or commit messages say. Where a
pattern looks wrong but is a deliberate consequence of running ~20 autonomous
runners against one repo, that is called out as such rather than flagged as a
mistake. Business/product decisions in `docs/decisions.md` are treated as
settled and not re-argued.

Numbers below (line counts, file counts, churn) are from `git ls-files` /
`git log --since=2026-07-05` on that commit.

---

## 1. Actual structure map

### 1.1 Size and shape

| Area | Files | Code lines | What it really is |
|---|---:|---:|---|
| `apps/web` | 438 | ~81k (≈21k is `*.generated.ts`) | The product. One Next.js 16 page (`app/page.tsx` → `components/longlive/LongLive.tsx`), 17 route handlers, 87 `'use client'` modules |
| `scripts/` | 311 | ~57k | Thirteen sub-engines + 83 top-level scripts. This is the second product: the automation the runners execute |
| `supabase/` | 123 | ~95k | 33 migrations + **90 seed files (~93k lines)** — the hand/agent-authored content corpus is the biggest thing in the repo |
| `packages/core` | 40 | 7.6k | Supabase data access: vault (legacy), knowledge (Stage 9), **notifications (16 of 23 source files)** |
| `packages/shared` | 39 | 4.7k | Types + pure logic: vault types, redline gates, news clustering, mood matching, notification types |
| `apps/worker` | 49 | 4.7k | News/Current ingest pipeline. One-shot, run by `news-worker.yml` every 4h |
| `apps/mobile` | 35 | 2.2k | Expo app: Vault navigator + notification settings/inbox. 1 test file |
| `.github/workflows` | 39 | 5.4k | 29 scheduled/automatic + 10 manual workflows; 9 of them push commits / open PRs |
| `docs/` | 217 | — | `decisions.md` alone is 6,235 lines |

### 1.2 What the web app really is

`docs/architecture.md` describes a Supabase-backed two-tier Vault reader.
What ships is different, and the doc says so in its own preamble but the body
was never rewritten:

- The site is **one client-rendered page** over **build-time generated
  TypeScript**. `apps/web/lib/longlive/content.ts` imports
  `content-vault.generated.ts` (9,103 lines) which is emitted by
  `scripts/sync-longlive-content.mjs` from `supabase/seed/content/*.mjs`
  during `prebuild`. Same for tracks, theories, videos, era-secrets, and
  song-moods (six generated files, manifest in `scripts/lib/generated-content.mjs`).
- **The Supabase Vault tables are not on the web read path.** The `/vault/tier0`,
  `/vault/moment/[id]`, `/vault/album/[slug]/tracks` routes and
  `apps/web/lib/vault.ts` → `packages/core/src/vault.ts` still exist, ISR-cached,
  and are consumed only by `apps/mobile/lib/vault.ts` and by `npm run check:budget`.
  The seed→DB direction (`scripts/seed-*.mjs`, `db-seed.yml`) is therefore
  load-bearing for **mobile and Clownbot's knowledge index only**, not for the
  website. `docs/decisions.md` 2026-07-17 records this ("build reads repo seeds;
  DB read is opt-in") and 2026-08-23 admits web and mobile read the Vault
  differently — it is a known, recorded fork, not an accident. But
  `architecture.md` § "Hard boundary: new business logic goes in packages/*"
  is not what happened: the entire reader domain layer (`lib/longlive/*`,
  201 files) lives in the app, and `packages/shared`/`packages/core` hold
  almost none of it.
- The only genuinely live-from-DB surfaces on the web are the **Current tier**
  (`/vault/current/[eraId]`, `/vault/live-theories`, ISR 900s, read via
  `packages/core/src/knowledge/client.ts` and — separately — a raw `fetch()`
  in `apps/web/lib/live-theories-data.ts`) and the **notifications** routes.

### 1.3 The real dependency graph (web)

```
app/page.tsx ─► components/longlive/LongLive.tsx
                  ├─► lib/longlive/store.tsx      (822 lines; 33 importers)   ─┐
                  ├─► TopBar / EraStream / ThreadsMode / MoodChat / ClownChat  │ all import
                  └─► ~80 components                                          ├─► lib/longlive/types.ts (1,220 lines; 80 importers)
lib/longlive/content.ts  ◄── content-vault.generated.ts                       │   ▲
lib/longlive/tracks.ts   ◄── tracks.generated.ts  ─────────────────────────────┘   │
lib/longlive/theories.ts ◄── theories.generated.ts   (types.ts imports THESE   ────┘
lib/longlive/videos.ts   ◄── videos.generated.ts      generated files back)
lib/longlive/lenses.ts   (2,650 lines of hand-authored thread/egg data; 19 importers)
lib/longlive/merch.ts    ─► ../../../../supabase/seed/merch/{official,fanmade}.mjs   ← reaches OUT of the app into seed
```

Two things contradict the documented layering:

1. **`types.ts` is not a leaf.** It imports from `videos.generated.ts`,
   `tracks.generated.ts`, `song-moods.generated.ts`, `theories.generated.ts`,
   and `era-secrets.generated.ts` (to derive literal union types). So the
   "types" module depends on the content corpus, and every one of its 80
   importers transitively depends on ~20k lines of generated data. Any seed
   change re-typechecks the whole app.
2. **`merch.ts` imports `supabase/seed/merch/*.mjs` directly** (relative path
   out of `apps/web`), bypassing the sync-script pattern every other content
   type uses. It works because Next transpiles it, but it is the one content
   type that has no generated artifact, no `check:generated` coverage, and no
   entry in `generated-content.mjs`.

### 1.4 The automation side (`scripts/` + workflows + desk routines)

This is where the repo's real complexity is. Three tiers, per `docs/AUTOMATION.md`:

- **Tier 1 — GitHub Actions** (deterministic). 39 workflow files. Nine
  commit to the repo (`appearance-discovery`, `cie-scan`, `fleet-telemetry-snapshot`,
  `growth-snapshot`, `merch-audit-authoring`, `merch-awin-sync`, `merch-official-sync`,
  `merch-revenue`, `social-poster`). Each re-implements the same "checkout →
  setup-node → npm ci → run script → git commit → gh pr create" sequence inline
  (37 `setup-node` steps across 15 workflows; zero composite actions).
- **Tier 2 — Claude desk routines** (judgment). 23 registered triggers, 15
  enabled (`docs/agents/runners.md`). They open PRs against
  `supabase/seed/**`, `social/queue/**`, `docs/**`, and `HUMAN-ACTIONS.md`.
- **Tier 3 — product cron.** One: `/api/notifications/dispatch` on Vercel Cron.

The merge gate for all of this is `auto-merge-content.yml` +
`.github/content-automerge-allowlist.txt` + `scripts/automerge-content-guard.mjs`
+ `scripts/check-automerge-allowlist.mjs` (NEVER_ALLOWLIST). Everything under
`supabase/seed/`, `social/`, `docs/audits/`, `apps/web/app/`, `apps/web/components/`,
`apps/web/lib/longlive/`, and `packages/` auto-merges on green CI. That is the
single most important architectural fact about this repo: **CI (`ci.yml` job
`build`) is the only reviewer for most of what lands.** 764 PRs merged in the
last 30 days.

### 1.5 `scripts/` sub-engines

| Engine | Files | Entry | Notes |
|---|---:|---|---|
| `content-engine/` (Karen/CIE) | 57 | `run.mjs` (618 lines) | 20+ checkers over the seed corpus; files GitHub issues via `lib/issues.mjs` |
| `merch-engine/` | 50 | many | Awin feed sync, official-store sync, fan-made discovery, vision-model authoring (Sonnet). Most files ship a `.test.ts` (23/24) |
| `social/` | 44 | `post-queue.mjs`, `check-drafts.mjs` (746) | Live posting; ledger on an unprotected `social-ledger` branch (decisions 2026-08-25) |
| `marjorie/` | 21 | `assemble-brief.mjs` (581) | Founders' Brief collectors; has its **own** GitHub REST caller (`lib/gh-api.mjs`) |
| `appearance-discovery/` | 15 | `discover.mjs` (492) | YouTube channel polling + Sonnet vision verify |
| `lib/` | 20 | — | `gh.mjs` (796), `rumor-redlines.mjs` (583), `sourcing-gate.mjs` (410), `content-caps.mjs`, `pg.mjs`, `longlive-sync-shared.mjs`, `knowledge-rows.mjs` |
| top-level | 83 | `sync-*`, `seed-*`, `check-*`, `validate-*` | 62 use the `invokedDirectly`/`import.meta.url` guard so they double as importable modules; 37 do not |

`scripts/lib/gh.mjs` deserves a call-out: it is a 796-line reimplementation of
the `gh` CLI over REST with a hand-rolled HTTPS CONNECT proxy tunnel, because
cloud runners lack `gh` on PATH and Node `fetch` ignores `HTTPS_PROXY`. Its
header documents three successive bugs in its own transport. 19 scripts import
it. It is the single highest-blast-radius file in `scripts/`.

---

## 2. Inconsistent patterns

### 2.1 Six ways to talk to Supabase

| Style | Where |
|---|---|
| `@supabase/supabase-js` `createClient` inlined per route (copy-pasted `supabaseAdmin()` with identical 6 lines) | `app/api/devices/register`, `devices/[id]/prefs`, `notifications/{dispatch,inbox,metrics,open}`, `app/internal/notifications/page.tsx` — **7 copies** |
| `createClient` behind a factory in `packages/core` | `packages/core/src/vault.ts`, `packages/core/src/knowledge/client.ts` |
| `createClient` inlined in scripts (identical `{ auth: { persistSession:false, autoRefreshToken:false } }`) | `scripts/appearance-discovery/discover.mjs`, `knowledge-fb-upload.mjs`, `merch-engine/{author-catalogs,emit-fanmade-event,emit-official-merch-event}.mjs`, `notifications-kill-t1.mjs` — **6 copies** |
| Raw `fetch()` against PostgREST `/rest/v1/...` with hand-built query strings | `apps/web/lib/live-theories-data.ts`, `lib/longlive/clown-memory.ts` (7 endpoints), `clown-pins.ts`, `clown-predictions.ts`, `clown-session.ts`, `scripts/knowledge-freshness.mjs`, `scripts/news/emit-candidate-digest.mjs` |
| Direct Postgres via `pg` (`scripts/lib/pg.mjs`) | all `seed-*.mjs`, `migrate.mjs`, `sync-clown-knowledge.mjs`, `clown-eval.mjs`, `backup-restore-test.mjs` |
| Inline `new Client({...})` in YAML | `.github/workflows/db-connectivity-check.yml` |

The raw-`fetch` PostgREST style in `clown-*.ts` was a deliberate choice
(MAP.md: "not `@supabase/supabase-js`, not in `apps/web`'s deps") — but
`apps/web` **does** now depend on `@supabase/supabase-js` transitively via
`@swift2/core`, and seven route handlers import it directly. The original
reason is gone; the two styles now coexist in the same app with different
error-handling, auth-header, and abort-signal semantics. `clown-memory.ts`
builds PostgREST filters by string interpolation of `session.userId` — safe
today because the id is a UUID from Supabase Auth, but it is the one place in
the repo where a query is assembled by concatenation.

Env-var naming is also split three ways: `NEXT_PUBLIC_SUPABASE_URL` (14
files), `SUPABASE_URL` (9), and `SUPABASE_DB_URL` (15); anon key as
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? NEXT_PUBLIC_SUPABASE_ANON_KEY`
in four separate copies of the same `supabaseEnv()` helper
(`lib/vault.ts`, `lib/current.ts`, `lib/live-theories-data.ts`,
`scripts/lib/longlive-sync-shared.mjs`).

### 2.2 Three ways to call GitHub

- `scripts/lib/gh.mjs` — argv-to-REST translator (19 importers).
- `scripts/marjorie/lib/gh-api.mjs` — separate raw-path GET caller, built
  because widening `gh.mjs` "would conflict with PR #1887". Reuses
  `httpsRequest` from `gh.mjs`, so it is half-shared.
- Bare `fetch('https://api.github.com/...')` — `scripts/merch-engine/fanmade-discovery.mjs`
  (4 call sites), `scripts/ops/collect-maintenance.mjs` (3). These bypass the
  proxy-correctness logic `gh.mjs`'s header spends 60 lines explaining, and
  will hit the exact `401 Bad credentials` failure (#1869/#2008) if ever run in
  a Claude cloud session rather than an Action.

### 2.3 Six Anthropic clients, six usage-cap implementations

Every LLM call site hand-writes its own `fetch('https://api.anthropic.com/v1/messages')`
with its own headers, model constant, `max_tokens`, retry, and cap:

| Call site | Model | Cap mechanism |
|---|---|---|
| `apps/web/lib/longlive/clown-client.ts` | sonnet-5 | `clown-usage.ts` → re-exports `MoodUsage` class (in-process, per cold start) + `clown-memory.ts` per-user via `usage_daily` RPC |
| `apps/web/lib/longlive/mood-client.ts` | sonnet-5 | `mood-usage.ts` in-process counter, 200/day **per serverless instance** |
| `apps/worker/src/extract/haiku-client.ts` | haiku-4-5 | `extract/usage-store.ts` (per-run + daily, DB-backed) |
| `apps/worker/src/classify/openai-client.ts` | OpenAI | `classify/usage-store.ts` (a **second** UsageStore class with the same interface) |
| `scripts/appearance-discovery/lib/social-draft.mjs` | sonnet-5 vision | module-level counter `MAX_VERIFY_CALLS_PER_PROCESS` |
| `scripts/merch-engine/audit-matches-authoring.mjs` | sonnet-5 vision | dollar cap in the run artifact (`capUsd`) |
| `scripts/merch-engine/match-moments-authoring.mjs` | sonnet-5 (two call sites, `anthropic-version` hardcoded inline) | integer call cap passed in |

The in-process caps (`mood-usage.ts`, `clown-usage.ts`) are documented as
"per cold start" — on Vercel that means the 200/day ceiling is per lambda
instance, i.e. effectively unbounded under load. The worker's DB-backed
`usage_daily` table is the correct primitive and already exists (migration
`20260902000000_usage_daily.sql`); the web routes just don't use it for the
global cap.

### 2.4 Rate limiting: one helper, eleven copies

`trustedClientIp()` was correctly centralised in `lib/longlive/client-ip.ts`
(#1973). But the sliding-window limiter around it — `const HITS = new Map<string, number[]>()`
/ `WINDOW_MS` / `MAX_PER_WINDOW` / `rateLimited(ip)` — is copy-pasted into
**11 files**: every `app/api/*/route.ts` plus `clown-route-helpers.ts`. Each
copy has its own window/limit constants and its own comment explaining that it
is "best-effort per-instance". The honeypot check is likewise duplicated in
`feedback`, `mood`, and `submit-link`.

### 2.5 Content validation: three independent rule engines over the same corpus

- `scripts/validate-content.mjs` — CI blocking gate over `supabase/seed/**`.
- `scripts/content-engine/checkers/*.mjs` (Karen) — 20+ checkers over the same
  files, files issues instead of failing.
- `scripts/check-*.mjs` — voice, filter-coverage, content-inert, crosslink,
  link-liveness, each a separate CI step with its own corpus loader.

`scripts/lib/rumor-redlines.mjs` correctly models the intended pattern ("one
rule engine, two consumers": `validate-content` blocks, `rumor-redline.mjs`
checker reports). Most other rules do **not** follow it — e.g. `check-voice.mjs`
and `content-engine/checkers/voice.mjs` are separate implementations of the
"Taylor, not Swift" rule; `content-caps.mjs` is the single source for caps but
`content-engine/config.mjs` carries its own `safety.*` term lists that
`packages/shared/src/redline.ts` then hand-mirrors.

### 2.6 Error/exit conventions in scripts

76 scripts use `process.exit(1)` / `process.exitCode = 1` with their own
message formats. `apps/worker/src/index.ts` introduces a regex-based
`isSchemaPending` classifier to decide which errors are "degraded no-op" vs
real. `content-engine/lib/issues.mjs` has `errText()`; `marjorie/lib/gh-api.mjs`
has `GhApiError`; nothing is shared. Each workflow then re-derives "did this
fail" from exit code + grep of the log.

---

## 3. Tangled dependencies

### 3.1 God files (by importer count and churn)

| File | Lines | Importers | Commits since 07-05 | Why it hurts |
|---|---:|---:|---:|---|
| `apps/web/lib/longlive/types.ts` | 1,220 | 80 | **52** | Imports five generated files; every seed change touches it transitively. Holds `CONFIRMED_TIER`, `RumorNote`, `Product`, `TrackNote`, `Era`… — six unrelated domains in one module |
| `apps/web/lib/longlive/store.tsx` | 822 | 33 | 29 | One React context with ~24 state fields (mode, era, lens, overlays, return-point stack, deep-link, share, search, clown, mood). Every overlay re-renders on any state change |
| `apps/web/lib/longlive/lenses.ts` | 2,650 | 19 | 30 | Hand-authored data (`THREADS`, `EGG_NODES`, `CLUE_PAIRS`) that should be seed, living as TS in the app. Not covered by `check:generated`, `validate:content`, or Karen |
| `apps/web/components/longlive/MomentDetail.tsx` | 1,198 | — | **38** | 4× the repo's 300-line guideline; the single most-edited component |
| `scripts/sync-longlive-content.mjs` | 930 | 4 (validate-content, content-engine corpus, check scripts) | 32 | Generator **and** the exporter of `RUMOR_STATUSES`, `slugify`, `RUMOR_SOURCE_TIERS`, `LOCATION_SPECIFICITY` that validators import. Importing the generator to get a constant means `import`-ing a 930-line module with a `@supabase/supabase-js` dependency for a `Set` |
| `scripts/lib/gh.mjs` | 796 | 19 | — | See §1.5. A transport bug here silently breaks Marjorie, Karen, CIE issue filing, fleet telemetry |
| `scripts/content-engine/run.mjs` | 618 | — | 21 | Checker registry + CLI parsing + reporting + issue filing in one file |

### 3.2 Layer violations

- **App → seed:** `apps/web/lib/longlive/merch.ts` → `supabase/seed/merch/*.mjs` (§1.3).
- **Types → data:** `types.ts` → `*.generated.ts` (§1.3). The intent (literal
  union types derived from the corpus) is reasonable; the placement is not — a
  `content-ids.generated.ts` emitted by the sync scripts would give the same
  type safety without making `types.ts` depend on 20k lines of data.
- **Validator → generator:** `scripts/validate-content.mjs` and
  `scripts/content-engine/lib/corpus.mjs` import enums from
  `scripts/sync-longlive-content.mjs` (which itself imports `sync-longlive-theories.mjs`
  for `CONFIDENCE_VALUES`). The shared vocabulary should live in
  `scripts/lib/`, next to `content-caps.mjs`, which already does this correctly.
- **Shared package → app constants, by hand:** `packages/shared/src/redline.ts`
  mirrors `scripts/content-engine/config.mjs` `sexualizationTerms`;
  `apps/worker/src/extract/run-extract-stage.ts` mirrors `apps/web/lib/longlive/eras.ts`
  `CURRENT_ERA_ID`; `scripts/content-engine/checkers/hot-thin-topic.mjs` mirrors
  `apps/web/lib/longlive/types.ts` `CONFIRMED_TIER`; `packages/shared/src/current-types.ts`
  mirrors something in the same way. The repo has adopted "MIRROR, NOT IMPORT"
  as a named precedent with pointer comments. **This is a deliberate tradeoff**
  — `packages/shared` must stay portable and `.mjs` scripts can't import `.ts`
  without a loader — and the comments are honest about it. But the number of
  mirrors is now ≥6 and none has a test asserting the two sides agree, so the
  precedent is drifting from "known cost" to "latent bug".
- **Route → route:** `app/api/intake/route.ts` copies its shape from
  `app/api/feedback/route.ts`; `feedback/route.ts` re-exports `trustedClientIp`
  "so any existing importer of this route's trustedClientIp" keeps working —
  route handlers are being used as libraries.

### 3.3 Circular-ish coupling

- `sync-longlive-content.mjs` ⇄ `sync-longlive-theories.mjs` (content imports
  `CONFIDENCE_VALUES` from theories; theories reads track seeds that content's
  `slugify` produced). Works only because of the `invokedDirectly` guard.
- `types.ts` → `theories.generated.ts` → (emitted by) `sync-longlive-theories.mjs`
  → `validate-content.mjs` → `sync-longlive-content.mjs` → … The typecheck of
  the app depends on scripts having run; `check:generated` exists precisely to
  catch when they haven't.
- `packages/core/src/knowledge/client.ts` is consumed by both `apps/web/lib/current.ts`
  (server) and `apps/web/lib/longlive/clown-agent-tools.ts` (server, inside the
  agent loop), each constructing a **new** `createClient` per call. `knowledgeClient()`
  in `clown-agent-tools.ts` is called once per tool invocation — up to 7 clients
  per chat request.

---

## 4. Duplicated logic (every instance found)

| Logic | Instances |
|---|---|
| `supabaseAdmin()` service-role client factory (identical body) | `app/api/devices/register/route.ts`, `app/api/devices/[id]/prefs/route.ts`, `app/api/notifications/dispatch/route.ts`, `…/inbox/route.ts`, `…/metrics/route.ts`, `…/open/route.ts`, `app/internal/notifications/page.tsx` (7) |
| `supabaseEnv()` public-key env detection with the PUBLISHABLE/ANON fallback | `apps/web/lib/vault.ts`, `apps/web/lib/current.ts`, `apps/web/lib/live-theories-data.ts`, `scripts/lib/longlive-sync-shared.mjs`, `apps/mobile/lib/vault.ts` (5) |
| Script-side `createClient(url, key, { auth: {persistSession:false, autoRefreshToken:false} })` | `scripts/appearance-discovery/discover.mjs`, `scripts/knowledge-fb-upload.mjs`, `scripts/merch-engine/author-catalogs.mjs`, `scripts/merch-engine/emit-fanmade-event.mjs`, `scripts/merch-engine/emit-official-merch-event.mjs`, `scripts/notifications-kill-t1.mjs` (6) |
| Sliding-window per-IP rate limiter (`HITS` map + `rateLimited`) | 11 files (§2.4) |
| Honeypot field check | `app/api/feedback`, `app/api/mood`, `app/api/submit-link` (3) |
| Anthropic Messages API `fetch` + headers + `anthropic-version` | 6 files, 7 call sites (§2.3) |
| Daily/run usage cap class | `mood-usage.ts` (reused by `clown-usage.ts`), `worker/classify/usage-store.ts`, `worker/extract/usage-store.ts`, `clown-memory.ts` per-user, `social-draft.mjs` module counter, `audit-matches-authoring.mjs` dollar cap (6 distinct implementations) |
| `sleep(ms)` | `packages/core/src/notification-sender.ts`, `scripts/appearance-discovery/discover.mjs`, `scripts/backup-restore-test.mjs`, `scripts/check-link-liveness.mjs`, `scripts/content-engine/checkers/image-liveness.mjs`, `scripts/content-engine/checkers/image-moderation.mjs` (6) |
| GitHub REST caller | `scripts/lib/gh.mjs`, `scripts/marjorie/lib/gh-api.mjs`, inline in `fanmade-discovery.mjs` and `collect-maintenance.mjs` (4) |
| Source-tier vocabulary (`official/established/fan/unverified` + domain→tier) | `packages/shared/src/news/outlet-tiers.ts`, `scripts/lib/reputable-sources.mjs`, `scripts/lib/knowledge-rows.mjs` `SOURCE_TIER_BY_TYPE`, `scripts/sync-longlive-content.mjs` `RUMOR_SOURCE_TIERS`, `packages/shared/src/news/credibility.ts` (5 partially-overlapping lists) |
| Era slug ↔ EraId mapping | `scripts/lib/longlive-sync-shared.mjs` `SLUG_TO_ERA_ID`; `apps/web/lib/longlive/eras.ts` `ERAS`; `supabase/seed/eras-data.mjs`; hardcoded `'tloas'` in `apps/worker/src/extract/run-extract-stage.ts` and `content-engine/config.mjs` (5) |
| Voice rule ("Taylor, not Swift") | `scripts/check-voice.mjs`, `scripts/content-engine/checkers/voice.mjs` (2) |
| Sexualization/safety term lists | `scripts/content-engine/config.mjs`, `packages/shared/src/redline-gates.ts` (2, hand-mirrored) |
| `CONFIRMED_TIER` | `apps/web/lib/longlive/types.ts`, `scripts/content-engine/checkers/hot-thin-topic.mjs` (2, hand-mirrored) |
| `CURRENT_ERA_ID` | `apps/web/lib/longlive/eras.ts`, `apps/worker/src/extract/run-extract-stage.ts` (2, hand-mirrored) |
| `neutralizeCell` (sheet-injection guard) | `apps/web/lib/longlive/submit-link.ts`, `scripts/apps-script/submissions-doPost.gs` (2 — **deliberately** duplicated across a trust boundary; correct) |
| Mood battery case list | `apps/web/lib/longlive/mood-battery.ts`, `scripts/check-mood-battery.mjs` (2, "edit both") |
| `.env.local` loader | `scripts/lib/longlive-sync-shared.mjs` `loadWebEnvLocal`; every other script relies on `node --env-file` — two mechanisms for the same thing |
| Fallback base URL `https://swift2-web-nine.vercel.app` | `apps/web/lib/vault.ts`, `apps/mobile/lib/{inbox-client,prefs-client,push-registration}.ts` (4) |
| Workflow "checkout/setup-node/npm ci/commit/PR" boilerplate | 9 committing workflows, 15 with `npm ci`, no composite action |
| Source-level "assert the file contains this string" tests | 27 of 39 component test files read `readFileSync(...tsx)` and grep it — the same harness reinvented per file (see §5) |

---

## 5. Change-risk hotspots

Ranked by (churn × fan-in × test thinness × runner write pressure).

1. **`apps/web/lib/longlive/types.ts`** — 52 commits/60d, 80 importers,
   depends on generated data. Any agent adding a field to any content type
   edits this file; concurrent runner PRs collide here first. No test can
   cover it because it is types — but its import of generated data means a
   corrupt seed fails typecheck in a 1,220-line file with an opaque error.
2. **`supabase/seed/content/the-life-of-a-showgirl.mjs`** — 12,688 lines,
   **216 commits in 60 days**, written by The Vault Run (all six lanes), Rumor
   Desk, Content Shift, Karen fix-PRs, Stylist, and human sessions. This is
   the intended design (one seed file per era, agents append), and the
   auto-merge + `validate:content` + `check:generated` triad exists precisely
   to make that safe. The risk is not correctness — it's **merge conflicts and
   CI queue time**: every one of the ~5 daily content PRs re-runs the full
   `build` job (typecheck + all tests + six sync scripts + `next build`),
   and two PRs touching the same era file must rebase. `ci.yml`'s own header
   says CI is 77% of Actions minutes.
3. **`apps/web/components/longlive/MomentDetail.tsx`** (1,198 lines, 38 commits)
   and **`TimelineScrubber.tsx`** (789), **`ClueWeb.tsx`** (866),
   **`Crossings.tsx`** (621), **`TrackDetail.tsx`** (583) — the five biggest
   components. **63 of 81 components have no test**, and of the 39 component
   test files, 27 are `readFileSync` string-greps against the `.tsx` source
   (e.g. `MomentDetail.test.ts` asserts `src.toContain('alt={img.caption ?? …}')`).
   There is no jsdom / testing-library render harness in the repo. A UI
   regression is caught only by `e2e/vault.spec.ts` (one file, runs daily
   against prod, and the allowlist notes E2E "is 100% red (#669)"). This is
   the area where the auto-merge grant to `apps/web/components/` is thinnest.
4. **`scripts/lib/gh.mjs`** — 19 importers, three transport rewrites in its
   own history, tested only by `gh.test.ts` mocks (the failure modes it fixes
   are environment-specific and can't be unit-tested). Every desk routine
   that files an issue or reads PRs routes through it.
5. **`scripts/sync-longlive-content.mjs`** — 930 lines, 32 commits, emits the
   9k-line generated file, and is also the vocabulary module for validators.
   A change here touches build, CI, Karen, and the web bundle simultaneously.
6. **`apps/web/lib/longlive/store.tsx`** — 822 lines, one context, 33
   consumers. No reducer tests; behaviour is pinned only by the string-grep
   tests above and by `docs/longlive-experience.md`.
7. **`apps/web/lib/longlive/lenses.ts`** — 2,650 lines of hand-authored
   narrative data inside the app tree, outside every content gate.
   `check:filter-coverage` and `scrubber-anchor-corpus.test.ts` catch structural
   breakage; nothing checks voice, sourcing, or redlines on it.
8. **`.github/workflows/watchdog.yml`** (28 commits) and **`ci.yml`** (20) —
   the two most-edited workflows. `watchdog.yml` has a "very thorough" header
   because it encodes liveness expectations for every runner; each runner
   cadence change requires a matching edit here or `check:launch-gates` goes red.
9. **The "MIRROR, NOT IMPORT" set** (§3.2) — six hand-kept pairs with no
   consistency test. The next era (`CURRENT_ERA_ID` changes) requires edits in
   `eras.ts`, `run-extract-stage.ts`, `content-engine/config.mjs`, and
   `longlive-sync-shared.mjs`; missing one silently mis-files Current-tier rows.
10. **`apps/mobile`** — 19 source files, 1 test, reads Supabase Vault tables
    directly (the path the web abandoned), and its `NotificationSettingsScreen.tsx`
    (478 lines) is the largest mobile file. It is the only consumer keeping
    `packages/core/src/vault.ts` and the `db-seed.yml` → Supabase path alive.

---

## 6. Runtime inefficiency

### 6.1 Web request path

- **Clownbot chat (`/api/clown`)** — per request: `resolveScopeSignal` does a
  DB FTS search **and** a compile-time index scan; then `resolveClownSession`
  (Supabase Auth round-trip); then `loadClownHistory` (2 PostgREST calls);
  then the agent loop, where each of up to 6 tool calls constructs a fresh
  `createClient` (`clown-agent-tools.ts:50`) and issues its own query. On
  completion: `persistPrediction`, `recordClownMemory` (insert + optional
  fold RPC), `incrementUserUsage` (RPC). That is **≥8 and up to ~15 Supabase
  round-trips per chat turn**, each a cold HTTP request with no connection
  reuse. The abort-signal threading is careful; the connection count is not.
- **`allClownDocs()`** memoises the compile-time index per lambda, but
  `buildClownDocs()` walks all of `CONTENT` + `THEORIES_RAW` + `LORE` and runs
  `screenTopic()` regex over every doc on every cold start. On Vercel that is
  per-instance, per-deploy.
- **Mood (`/api/mood`)** — `scoredSongs()` filters and (in `matchSongs`)
  rescales the full `SONG_MOODS` catalogue per request. Small today (~hundreds
  of songs); linear in catalogue size. Fine until the catalogue grows 10×.
- **Search (`SearchOverlay` → `search.ts`)** — client-side. The doc list is
  correctly memoised (`getSearchIndex()`), but `searchDocs` still scores
  **every** doc per debounced keystroke with no token index. Linear in corpus
  size × query terms; the corpus is already ~1,100 moments plus tracks,
  theories, videos. Fine today; worth a posting list before the corpus
  doubles.
- **Client bundle** — the reader is `'use client'` top to bottom and
  `types.ts` pulls all six generated files, so **the entire content corpus
  (~20k lines of TS) ships in the JS bundle** to every visitor. This is the
  documented "static, CDN-cached, zero network on scrub" tradeoff from
  `architecture.md` and is intentional — but it means bundle size grows
  linearly with content, and nothing in CI measures it (`check:budget` measures
  the Tier-0 JSON, not the page bundle).
- **Two independent live fetches per page** — `useCurrentItems` (EraStream)
  and `useLiveTheories` (ClownBoard + TheoryGuide, mounted separately) each
  call their own ISR route; `live-theories-data.ts` fetches `live_theory` and
  `fan_signal` with two raw REST calls. Cheap (ISR 900s) but three routes where
  one would do.
- **Per-instance rate limits and usage caps** (§2.3/§2.4) — not an
  inefficiency, an *ineffectiveness*: the 200/day model caps on `/api/mood`
  and `/api/clown` reset per cold start.

### 6.2 Worker (`apps/worker`, every 4h)

- **N+1 in clustering.** `run-cycle.ts` attaches raw items to stories in a
  `for` loop with one `update` per item, then `recordStorySource` does a
  `select` + conditional `insert` per item, then `recomputeVerification` does a
  `select` + `update` per touched story. For `MAX_UNCLUSTERED_PER_CYCLE = 200`
  items that is ~600–800 sequential round-trips per cycle where three batched
  statements would do. The `news_story_source` dedupe (`select … maybeSingle`
  then `insert`) is also racy: `20260718120000_news_init.sql` creates only a
  `story_id` index, no unique `(story_id, outlet_name)` constraint.
- **Reddit comment fetch per raw item per cluster.** `loadCommentThreads`
  calls `fetchPostComments(item.url)` for every `reddit_rss` item in every
  pending story (≤20 items × ≤50 stories), gated only by
  `ANTHROPIC_API_KEY` being set. No cache, no dedupe across cycles, and Reddit
  RSS is documented in `reddit-rss.ts` as fragile (403 bot challenges). This is
  the most likely thing to trip a rate limit as source count grows.
- **`symbol_lexicon` full table load** per cycle, and `refreshSymbolActivity`
  is a full recompute (RPC `20260902020000_refresh_symbol_activity.sql`) — fine
  at current scale, quadratic-ish later.
- **Classify** is sequential per story with one OpenAI call each, then a
  second Haiku call per story in extract. Two vendors, two usage stores, two
  passes over the same rows. `docs/decisions.md` 2026-08-23 explicitly chose
  "additive, not a replacement" — recorded, but it doubles LLM cost per story.

### 6.3 CI / automation

- **`build` runs everything on every PR** (~20 steps including six sync scripts,
  the full vitest suite, `next build`, and `check:budget:seed`). Content-only
  PRs (the majority: `content`, `vault`, `social-poster`, `growth-snapshot` ≈
  180 of 764 last month) could skip the typecheck/test/build half if
  `check:generated` + `validate:content` passed — nothing is path-filtered.
- **Social poster and growth snapshot each open a PR every 30 min / daily**
  purely to record state (70 + 33 merges last month). The `social-ledger`
  unprotected-branch fix (2026-08-25) removed the *correctness* dependency but
  the PR churn remains.
- **No composite action**: 37 `setup-node` + 15 `npm ci` steps, each a fresh
  install (cached, but still ~40s each).

---

## 7. Overall coherence rating

**5.5 / 10 — "coherent by convention, not by structure."**

For Joey and Wyatt: this repo has *two* products in it. The website itself is
small, fast, and honestly simple — one page, static content baked in at build,
a handful of API routes. That half is in decent shape and is well-documented
(`MAP.md`, `longlive-experience.md`). The *other* product is the factory around
it: ~57k lines of scripts, 39 workflows, and 23 scheduled Claude routines that
write content, file issues, post to social, and merge their own PRs. That
factory works — 764 PRs merged in 30 days with CI as the only reviewer is real
evidence — but it was built one runner at a time, and each runner brought its
own copy of the plumbing: its own Supabase client, its own GitHub client, its
own LLM caller, its own rate limiter, its own daily cap. Nothing is *wrong* in
any single copy; the cost is that a fix (a proxy bug, a cap that resets per
lambda, a new era id) has to be applied in six to eleven places and there is no
test telling you when you missed one. The codebase's coherence lives in
comments ("MIRROR, NOT IMPORT", "edit both", "same shape as feedback/route.ts")
rather than in shared modules. That is survivable with the current team of
agents because the comments are unusually honest, but it is the thing a new
team will trip on first, and it is what makes every change slower than it
looks. The remediation list below is mostly consolidation, not redesign — the
right shape is already present in the best-written corners
(`content-caps.mjs`, `rumor-redlines.mjs`, `generated-content.mjs`,
`client-ip.ts`) and just needs to be applied everywhere else.

---

## 8. Prioritised remediation list

Each task is bounded to be handed to one agent. `parallel_group` is the
dispatch wave: everything in group 1 runs together; group 2 starts when group
1 is done; and so on. "Serial after" names the specific dependency. Sizes:
S ≤ half a day, M ≤ 2 days, L > 2 days.

### Wave 1 — shared primitives (all independent; unblock everything below)

| id | Title | Scope (files) | Pri | Size |
|---|---|---|---|---|
| R1 | One Supabase service-role/public client factory for `apps/web` | New `apps/web/lib/supabase-server.ts` (`supabaseAdmin()`, `supabasePublicEnv()`); replace the 7 inline `supabaseAdmin` copies in `app/api/devices/*`, `app/api/notifications/*`, `app/internal/notifications/page.tsx`; replace the 3 `supabaseEnv()` copies in `lib/vault.ts`, `lib/current.ts`, `lib/live-theories-data.ts`. Behaviour-preserving | 1 | S |
| R2 | One rate-limit + honeypot helper | New `apps/web/lib/longlive/rate-limit.ts` (`makeRateLimiter({windowMs,max})`, `isHoneypotTripped`); adopt in the 11 route/helper files listed in §2.4 with each route's existing constants. Keep `client-ip.ts` as-is | 1 | S |
| R3 | One Anthropic Messages client for the repo | New `packages/shared/src/llm/anthropic-messages.ts` (fetch + headers + `anthropic-version` + typed usage block + one retry policy); a `.mjs`-importable twin `scripts/lib/anthropic.mjs` if TS import is impractical for scripts. Migrate `clown-client.ts`, `mood-client.ts`, `worker/extract/haiku-client.ts`, `social-draft.mjs`, `audit-matches-authoring.mjs`, `match-moments-authoring.mjs`. Model constants stay per-caller | 1 | M |
| R4 | Script-side shared Supabase + GitHub callers | `scripts/lib/supabase.mjs` (`serviceClient()`), replace 6 inline `createClient` copies; move `fanmade-discovery.mjs` and `ops/collect-maintenance.mjs` bare `api.github.com` fetches onto `scripts/lib/gh.mjs`'s `httpsRequest`/`ghApi`; fold `marjorie/lib/gh-api.mjs` into `gh.mjs` as an exported `ghApi(path)` | 1 | M |
| R5 | Mirror-consistency test | New `scripts/lib/mirrors.test.ts` that imports both sides of each hand-mirrored pair (`redline.ts`/`config.mjs` sexualization terms; `types.ts`/`hot-thin-topic.mjs` CONFIRMED_TIER; `eras.ts`/`run-extract-stage.ts`/`config.mjs`/`longlive-sync-shared.mjs` CURRENT_ERA_ID + SLUG_TO_ERA_ID; `mood-battery.ts`/`check-mood-battery.mjs`) and asserts equality. Zero production code changes | 1 | S |
| R6 | Workflow composite action | `.github/actions/setup-repo/action.yml` (checkout+setup-node+npm ci) and `.github/actions/commit-and-pr/action.yml` (branch/commit/push/`gh pr create` with the existing branch-author gate); adopt in the 9 committing workflows and the 15 `npm ci` workflows. No behaviour change; `.github/**` is human-merge by design | 2 | M |
| R7 | Bundle-size gate | Add `next build` output size assertion (or `@next/bundle-analyzer` JSON) to `ci.yml` with a threshold; document in `docs/dev-quickstart.md`. Detection only | 2 | S |

### Wave 2 — vocabulary & data boundaries (serial after wave 1 where noted)

| id | Title | Scope | Pri | Size | Serial after |
|---|---|---|---|---|---|
| R8 | Extract content vocabulary out of the generator | New `scripts/lib/content-vocab.mjs` holding `RUMOR_STATUSES`, `RUMOR_SOURCE_TIERS`, `LOCATION_SPECIFICITY`, `RESOLVED_RUMOR_STATUSES`, `MILESTONE_KINDS`, `CONFIDENCE_VALUES`, `slugify` re-export; `sync-longlive-content.mjs`, `sync-longlive-theories.mjs`, `validate-content.mjs`, `content-engine/lib/corpus.mjs`, `lib/knowledge-rows.mjs` import from it. Breaks the content⇄theories import cycle | 1 | S | R5 (so the test catches drift) |
| R9 | One source-tier map | Consolidate `outlet-tiers.ts`, `reputable-sources.mjs` domain lists, `knowledge-rows.mjs` `SOURCE_TIER_BY_TYPE`, `news/credibility.ts` into `packages/shared/src/source-tiers.ts` + a generated `.mjs` twin (emit via a tiny sync script, add to `generated-content.mjs`). Consumers switch imports; no rule changes | 2 | M | R8 |
| R10 | Generate content-id unions instead of importing data into `types.ts` | Sync scripts additionally emit `apps/web/lib/longlive/content-ids.generated.ts` (era ids, track keys, theory ids, video ids, song slugs as `const` arrays); `types.ts` imports only that; `check:generated` and the allowlist gain the new file. Cuts `types.ts` fan-in to data | 1 | M | R8 |
| R11 | Move `merch` onto the sync-script pattern | `scripts/sync-longlive-merch.mjs` → `apps/web/lib/longlive/merch.generated.ts`; `merch.ts` imports the generated file; add to `generated-content.mjs`, allowlist, `prebuild`, `check:generated`. Removes the app→seed relative import | 2 | S | R10 (shares the manifest edit) |
| R12 | Move `lenses.ts` data under the content gates | Split `THREADS`/`EGG_NODES`/`CLUE_PAIRS` into `supabase/seed/lenses/*.mjs` + `sync-longlive-lenses.mjs` → `lenses.generated.ts`; keep `lenses.ts` as the typed accessor. Extend `validate-content.mjs` with the structural checks `scrubber-anchor-corpus.test.ts` already encodes | 2 | L | R10, R11 |

### Wave 3 — runtime correctness/efficiency (independent of each other; serial after named wave-1 items)

| id | Title | Scope | Pri | Size | Serial after |
|---|---|---|---|---|---|
| R13 | DB-backed global caps for `/api/mood` and `/api/clown` | Replace `mood-usage.ts`/`clown-usage.ts` in-process counters with `usage_daily` RPC (`increment_usage_daily`, already used by `clown-memory.ts`) as the global gate, keeping the in-process counter as a fast pre-check. Keep `CLOWN_MODEL_DISABLED`; add the same kill switch to mood | 1 | M | R1 |
| R14 | One Supabase client per Clownbot request | `clown-agent-tools.ts`: construct `KnowledgeDataSource` once per request and pass it through `runClownAgent`/`resolveScopeSignal`; `clown-memory.ts`/`clown-pins.ts`/`clown-predictions.ts`/`clown-session.ts` migrate from string-built PostgREST URLs to `@supabase/supabase-js` (already a dependency) with `.abortSignal()`. Preserve cookie/session semantics exactly | 1 | M | R1 |
| R15 | Batch the worker's cluster writes | `run-cycle.ts`: single `upsert` for raw-item→story attachments; single `insert … on conflict do nothing` for `news_story_source` (add unique `(story_id, outlet_name)` index in a new migration); one `select … in (…)` + one batched update in `recomputeVerification`. Migration is additive | 2 | M | — |
| R16 | Cache Reddit comment fetches | `run-extract-stage.ts`/`reddit-rss.ts`: memoise `fetchPostComments` per URL for the run and persist a `fetched_comments_at` on `news_raw_item` (additive column) so a post is fetched at most once across cycles; add a per-run cap | 2 | S | — |
| R17 | Merge the two live-data client fetches | Single `/vault/live/[eraId]` ISR route returning current items + live theories + fan signals; `use-current-items.ts` and `use-live-theories.ts` read from one hook. Keep old routes as thin aliases for one release (additive-only contract for mobile) | 3 | S | R1 |
| R18 | Search index built once | `search.ts`: build the `SearchDoc[]` and a token→doc posting list at module load (or `useMemo` in `SearchOverlay`), score only candidate docs. Pure refactor with existing tests | 3 | S | — |

### Wave 4 — tests and structure (serial after wave 2 for the big-component work)

| id | Title | Scope | Pri | Size | Serial after |
|---|---|---|---|---|---|
| R19 | Real component render harness | Add `@testing-library/react` + `jsdom` env to `vitest.config.ts` for `apps/web/components/**`; convert the 5 highest-churn string-grep tests (`MomentDetail`, `TopBar`, `TimelineScrubber`, `EraSection`, `ClownChat`) into render tests asserting the same behaviour. Leave the other 22 grep tests in place | 1 | M | — |
| R20 | Split `MomentDetail.tsx` | 1,198 → ≤4 files (`MomentDetail`, `MomentLightbox`, `MomentRumors`, `MomentSources`), each under 300 lines, behaviour-identical; update MAP.md. Requires R19's harness to be safe | 2 | M | R19 |
| R21 | Split `store.tsx` into slices | `store.tsx` → `store/{navigation,overlays,return-points,search-share}.tsx` composed by one provider; `useAppState()` signature unchanged. Add reducer unit tests | 2 | L | R19 |
| R22 | Path-filter CI for content-only PRs | `ci.yml`: a `changes` job (`dorny/paths-filter`) so PRs touching only `supabase/seed/**`, `social/**`, `docs/**`, `*.generated.ts` run `validate:content` + `validate:social` + `check:generated` + `check:voice` + `content:coverage` and skip typecheck/vitest/`next build`; the `build` required-check name is preserved via a final aggregating job. `.github/**` is human-merge | 2 | M | R6 |
| R23 | Unify the three script exit/error conventions | `scripts/lib/cli.mjs` with `runMain(fn)` (uniform `[script] error:` prefix, exit codes, `isSchemaPending` classifier moved out of `worker/index.ts`); adopt in the 37 unguarded top-level scripts and the 13 sub-engine entry points. Mechanical | 3 | M | R4 |
| R24 | Retire or adopt the Supabase Vault read path | Decision-ready doc (not code): either (a) mobile reads the same generated JSON the web ships (drop `db-seed.yml` Vault tables + `packages/core/src/vault.ts`), or (b) web reads Tier-0 from Supabase. Cost/impact per option for Joey; **this one is a product/architecture decision and stops at the doc** | 3 | S | — |
| R25 | Rewrite `docs/architecture.md` to match reality | Replace the two-tier Vault reader narrative with §1 of this review as the baseline; keep the stack table and the mobile-lag contract; link `longlive-experience.md` and `AUTOMATION.md` as the two live manuals | 2 | S | R24 |

### Dependency graph (dispatch order)

```
wave 1: R1 R2 R3 R4 R5 R6 R7          (all parallel)
wave 2: R8 ─► R9, R10 ─► R11 ─► R12    (R8 after R5; R9/R10 after R8; R11 after R10; R12 after R10+R11)
wave 3: R13 R14 R17 (after R1) · R15 R16 R18 (independent)   — may overlap wave 2
wave 4: R19 ─► R20, R21 · R22 (after R6) · R23 (after R4) · R24 ─► R25
```

`.github/**`, `scripts/**`, `supabase/migrations/**`, and `package.json` are
in NEVER_ALLOWLIST — R4, R6, R8, R9, R15, R16, R22, R23 will each need a human
merge. Everything else can auto-merge on green.

---

*Read-only review. No source files, workflows, or config were changed. This
document and its PR are the only artifact.*
