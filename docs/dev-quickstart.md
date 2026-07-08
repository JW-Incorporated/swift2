# Dev quickstart — cold-start reference

Everything needed to run, test, and change this repo from a fresh session.
Workflow + decision authority live in `CLAUDE.md`; stack rationale in
`docs/architecture.md`; the plan + who-owns-what in `docs/roadmap.md`.

## Repo map

| Path | What it is |
|------|-----------|
| `apps/web` | **Next.js (App Router) reader — the v1 product.** |
| `apps/mobile` | Expo / React Native app. Reuses `packages/*` **unchanged**. ⚠️ Lands with **PR #42** — may not be on `main` yet. |
| `apps/worker` | **Not code** — just holds a gitignored `.env` (`SUPABASE_DB_URL`) that the DB scripts read. No pipeline/worker in v1. |
| `packages/shared` | Portable types + domain/nav/snap math + budget & load state machines. **No I/O, no view code.** |
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
| `apps/mobile/.env` | `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` | mobile app (see `apps/mobile/.env.example`) |

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
```
**Database / seed — ⚠️ writes to PROD, needs `apps/worker/.env`:**
```
npm run db:migrate       # apply all supabase/migrations in order
npm run db:seed          # eras + milestones
npm run db:seed:content  # month items  (supabase/seed/content/*.mjs)
npm run db:seed:tracks   # song notes   (supabase/seed/tracks/*.mjs)
```
After any schema change: add a migration file, apply it, and update
`packages/shared` types + `packages/core/src/map.ts` to match.

## Run the apps

**Web:** `npm run dev --workspace @swift2/web` → http://localhost:3000
(reads `apps/web/.env.local`; pulls the live Vault via public RLS read).

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
- **Never fabricate content.** (Content must be real + sourced — this rule still stands.) On-site media/content is now **allowed** (`docs/decisions.md` 2026-07-08) — prefer licensed/embeddable sources + attribution. UNOFFICIAL — no affiliation copy.
- **Business logic goes in `packages/shared`/`core`, not the view layer** — that's what keeps the mobile app a thin reuse.
- **Two lanes:** ENGINE (Wyatt — all code) vs CONTENT (Joey — `supabase/seed/content/**`, `tracks/**`). Don't touch the other lane's files. See `docs/roadmap.md`.
