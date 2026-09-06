# Dev quickstart — cold-start reference

Everything needed to run, test, and change this repo from a fresh session.
Workflow + decision authority live in `CLAUDE.md`; stack rationale in
`docs/architecture.md`; the plan + who-owns-what in `docs/roadmap.md`.

## Repo map

| Path | What it is |
|------|-----------|
| `apps/web` | **Next.js (App Router) reader — the v1 product.** `/` renders the static LongLive experience (`components/longlive/`, `lib/longlive/`) — see `docs/longlive-experience.md`. The old unmounted `VaultReader` UI was deleted 2026-08-11; the Supabase-backed `/vault/*` HTTP routes and `lib/vault.ts` remain. |
| `apps/mobile` | Expo / React Native app. Reuses `packages/*` **unchanged**. ⚠️ Lands with **PR #42** — may not be on `main` yet. |
| `apps/worker` | **Not code** — just holds a gitignored `.env` (`SUPABASE_DB_URL`) that the DB scripts read. No pipeline/worker in v1. |
| `packages/shared` | Portable types + domain/nav/snap math + budget & load state machines. **No I/O, no view code.** Also `src/news/` — dormant post-v1 news-pipeline domain behind the `@swift2/shared/news` subpath; nothing imports it (see `docs/proposals/2026-07-07-news-pipeline-architecture.md`). |
| `packages/core` | Supabase data access (Tier 0 skeleton / Tier 1 moment / track guide) + row→domain mappers. Portable (web + mobile). |
| `supabase/migrations` | Idempotent SQL, applied in filename order. |
| `supabase/seed` | Authored content: `eras-data.mjs`, `content/*.mjs` (month items), `tracks/*.mjs` (song notes), `candidates/` (staged, **not** seeded). |
| `scripts` | Migrate + seed + CI-gate scripts (`*.mjs`). |
| `docs` | architecture · decisions · roadmap · reviews · specs · marketing · copy. |

## Prerequisites & environment

- **Node ≥ 20 + npm.** `npm install` at the root (npm workspaces).
- **One shared PRODUCTION Supabase project** (same discipline as Orbit). Anything
  under `db:*` / seeds writes to **prod** — never run speculatively; say what
  you're about to run and why.
- Env files (all gitignored — never commit or print keys):

| File | Keys | Used by |
|------|------|---------|
| `apps/web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `…_PUBLISHABLE_KEY`) | web reader (public RLS read) |
| `apps/worker/.env` | `SUPABASE_DB_URL` (full Postgres connection string) | `db:migrate` + seeds (`pg` direct, bypasses RLS to write) |
| `apps/mobile/.env` | `EXPO_PUBLIC_CONTENT_BASE_URL` (optional) | mobile app content bundle override (see `apps/mobile/.env.example`; OS-015 — the app no longer reads Supabase directly) |

## Commands (from repo root)

**Quality — safe, no prod (run `typecheck` before every PR):**
```
npm run typecheck        # all workspaces
npm run lint             # eslint (web + mobile lint themselves)
npm run test             # vitest
npm run build --workspace @swift2/web
```
**CI gates — safe, no prod (these must pass; CI runs them):**
```
npm run validate:content # seed content vs DB constraints (category/month/length/era)
npm run check:budget:seed # Tier 0 payload budget from seed files (≤2 MB gz / ≤10 MB parsed)
npm run check:budget:bundle # apps/web shipped client bundle (.next/static): ≤8 MB. Detection
                             # only, no auto-remediation. Current build is ~4.9 MB (2026-09-04);
                             # 8 MB leaves ~60% headroom for organic growth while still catching a
                             # real regression (e.g. an unsplit dependency landing client-side).
                             # Run `npm run build --workspace @swift2/web` first — the check reads
                             # its output. Raise the threshold deliberately in
                             # scripts/check-bundle-size.mjs (with a comment) if legitimate growth
                             # needs more room; don't raise it to make a regression pass.
```
**Database / seed — ⚠️ writes to PROD, needs `apps/worker/.env`.** Content
seeding (eras/content/tracks/releases/tours/theories/videos) was retired
from the runbook and CI in OS-016
(`docs/specs/2026-09-05-one-source-three-surfaces.md`): the website and
mobile app now read the published content bundle
(`scripts/build-content-bundle.mjs` → `packages/content`'s `loadBundle`),
never Supabase's `era`/`milestone`/`month_item`/`track_note`/`theory`/
`video_work`/`release`/`tour` tables, so reseeding them no longer changes
what either surface shows. Those tables and their seed scripts
(`scripts/seed-eras.mjs`, `seed-content.mjs`, `seed-tracks.mjs`,
`seed-releases.mjs`, `seed-tours.mjs`, `seed-theories.mjs`,
`seed-videos.mjs`) still exist and still work (`supabase/migrations` marks
them deprecated, not dropped) — a follow-up will drop them after one
release cycle. Only the genuinely dynamic notification pools
(`lyrics`, `on_this_day`, still read live by
`packages/core/src/notification-fun.ts`) remain seedable below.
```
npm run db:migrate         # apply all supabase/migrations in order
npm run db:seed:lyrics     # notification lyric pool (supabase/seed/lyrics/*.mjs)
npm run db:seed:on-this-day # notification on-this-day pool (supabase/seed/on-this-day/*.mjs)
```
After any schema change: add a migration file, apply it, and update
`packages/shared` types + `packages/core/src/map.ts` to match.

**Backup / restore — safe, no prod.** The DB scripts above pick their SSL mode
from the connection string (`scripts/lib/pg.mjs`), so the same `db:migrate` and
`db:seed*` commands work against a local or scratch Postgres — that is what the
restore drill uses.
```
npm run test:backup-restore   # backup → restore → verify, into throwaway databases
```
Needs a Postgres to work in: `--cluster <url>` for one you already have, or
`npm i --no-save embedded-postgres` then `--cluster ephemeral` for none.
Runbook, recovery decision tree, and what is/isn't recoverable from git:
**`docs/backup-restore.md`**.

## Run the apps

**Web:** `npm run dev --workspace @swift2/web` → http://localhost:3000
renders `<LongLive/>` (`app/page.tsx`) — the shipped era/threads reader over
**static, in-repo mock data** (`apps/web/lib/longlive/*`). It does **not**
read Supabase. See `docs/longlive-experience.md` before touching the site UI.
`.env.local` / the Supabase RLS read path are still needed: `lib/vault.ts` and
the `/vault/*` HTTP routes read them, and so does the `prebuild` content sync
(`scripts/lib/longlive-sync-shared.mjs`) that generates the files the shipped
site imports. The old **UI** that consumed those routes (`VaultReader.tsx`,
`MomentDetail.tsx`, `TrackGuide.tsx`, `lib/useMoment.ts`, `lib/useTrackGuide.ts`,
`lib/theme.ts`, `lib/categoryBadges.ts`) was never mounted and was **deleted on
2026-08-11** — see `docs/decisions.md`. Nothing in the shipped UI calls the
`/vault/*` routes today; `npm run check:budget` still does.

**Mobile (Expo):**
```
npm install
cd apps/mobile && npx expo install --fix   # resolves an RN version clash (see apps/mobile/README.md)
cp .env.example .env                        # fill in EXPO_PUBLIC_* creds
npm run start --workspace @swift2/mobile    # open in Expo Go / emulator
```

## Data model (5 tables · RLS public-read)

- `era` — slug, album, start/end, sort_order, `theme` (jsonb), cover art.
- `milestone` — album releases + tours (the scrubber's wavetop nav anchors).
- `month_item` — the monthly moments on the timeline (category, title, snippet, source, thumbnail).
- `moment` — Tier 1 on-demand detail for a `month_item` (context + sources + photos).
- `track_note` — per-album song notes, **off** the Tier 0 payload.

**Two-tier serving:** Tier 0 = always-resident skeleton (eras + milestones + month
index, budget-gated) loaded up front so scrubbing never waits on the network;
Tier 1 = on-demand moment detail + track guide.

## Guardrails that bite

- **Never commit to `main`** — branch + PR. AI may not merge/deploy/spend without human OK (`CLAUDE.md`).
- **Never fabricate content.** (Real + sourced — still stands.) **Media policy** (`docs/decisions.md` 2026-07-09 "no rules against hosting photos"): original summaries in our own words + links (never paste bodies/lyrics — see the 2026-07-09 lyrics entry for that exception); **hosting real internet photos is unrestricted** — embed, hotlink, or rehost/CDN (paparazzi/press/agency all fine), with credit, a knowing risk acceptance. Only image bars: **no AI fakes**, and reference/comparable stand-ins must be visibly labeled as such. Monetization needs IP-counsel review. UNOFFICIAL — no affiliation copy.
- **Business logic goes in `packages/shared`/`core`, not the view layer** — that's what keeps the mobile app a thin reuse.
- **Two lanes:** ENGINE (Wyatt — all code) vs CONTENT (Joey — `supabase/seed/content/**`, `tracks/**`). Don't touch the other lane's files. See `docs/roadmap.md`.
