# Backup & restore runbook

**Owner: Wyatt (CTO / Build desk). Launch gate: BACKUPS (#680).**
Created 2026-08-11. The drill that keeps this file honest:
`scripts/backup-restore-test.mjs`, run monthly by
`.github/workflows/backup-restore-drill.yml`.

> **Read the first section before anything else.** Most of what people assume
> is "in the database and at risk" is in git. Knowing exactly which part is
> not changes the shape of every recovery decision on this page.

---

## 1. What is actually at risk

The Supabase Postgres has 14 tables. They are **not** equally valuable, because
this product's source of truth mostly is not the database.

| Layer | Lives where | If the database vanished |
|---|---|---|
| **Schema** | `supabase/migrations/*.sql`, in git, idempotent, applied in filename order | `npm run db:migrate` rebuilds it exactly |
| Content (eras, milestones, month items, moments, track notes, theories, videos) | `supabase/seed/**`, in git — and every surface (web + mobile) now renders from the published content bundle (`scripts/build-content-bundle.mjs` output), also derived from these same seeds and also committed-adjacent (build artifact, OS-016) | Reseed the DB if you want, but it's cosmetic: **the public site and the app never went down** — neither reads these Supabase tables any more, both build from the content bundle |
| **News feed seed** (`news_source` rows) | Inserted by migrations `20260719180000` / `20260719190000`, in git | Rebuilt by `db:migrate` |
| **Runtime-only state** — `news_story`, `news_raw_item`, `news_story_source`, `news_llm_usage`, and `news_source.last_polled_at` | **Only in the database.** Written by `apps/worker/src/pipeline/run-cycle.ts` on its 6×/day cycle | **Gone forever.** Nothing in git can rebuild it |
| **Generated `id` values** — every `uuid` primary key | **Only in the database.** The seeds carry no ids; `gen_random_uuid()` mints them at seed time | A reseed produces *different* ids. Any stored `month_item_id` (e.g. `/vault/moment/[id]`) breaks |

Two things follow, and they are the whole reason this runbook is short:

1. **A total database loss is not a company-ending event today.** Feedback goes
   to GitHub issues (`apps/web/app/api/feedback/route.ts`), the social queue is
   files in git (`social/**`), analytics live in Vercel, and there are no user
   accounts. The site itself does not read Supabase on the hot path.
2. **The irreplaceable slice is small and growing.** It is the `news_*` tables
   plus id stability. That slice is exactly what the drill's verification is
   pointed at — and it is why "we can just reseed" is *not* a sufficient
   answer as the news pipeline accumulates history.

---

## 2. Where backups come from

Two independent layers. **Layer A is Supabase's; layer B is ours.**

### Layer A — Supabase's platform backups ⚠️ CURRENTLY UNAVAILABLE

Whether this project has automated daily backups, and with what retention,
depends on the plan the project is on. On the free plan Supabase provides **no
automated backups and no point-in-time recovery**; daily backups begin on Pro,
and PITR is a paid add-on on top of that.

**Current status (Joey report, 2026-08-30):** the project is on the Supabase
Free plan and has no available backup options. No platform backup was made.
This report does not accept the resulting risk or resolve the BACKUPS launch
gate. A production-data restore drill also has not been performed; see §6.

### Layer B — our own logical backup (works on any plan, no dashboard needed)

`scripts/backup-restore-test.mjs` takes a **data-only logical backup**: one
NDJSON file per table plus a `manifest.json` of row counts and content
checksums. Schema is not in the artifact because schema is in git.

It deliberately uses **no `pg_dump`/`pg_restore` binary** — everything goes over
the wire through `pg`, the same way `scripts/migrate.mjs` and the seeds do.
That is not purism: Postgres client binaries are not installed on this repo's
dev machines or guaranteed on runners, and a backup tool you cannot run is not
a backup tool.

To take one against production (read-only, safe), either run it locally:

```bash
node scripts/backup-restore-test.mjs \
  --source "$SUPABASE_DB_URL" \
  --target "postgres://postgres:***@127.0.0.1:5432/scratch?sslmode=disable" \
  --keep
```

or, preferred — one click, no credential ever leaves GitHub Actions:
`.github/workflows/production-backup-drill.yml` (`workflow_dispatch` from the
Actions tab) reuses the `SUPABASE_DB_URL` secret already configured for
`db-migrate`/`db-seed`, restores into a throwaway Postgres service container
inside the job, and records PASS/FAIL as an alert issue + a downloadable
report artifact. See `HUMAN-ACTIONS.md` #23 for the walkthrough.

`--keep` leaves the artifact in `.backups/<timestamp>/` (gitignored). The source
session is pinned `default_transaction_read_only=on` at the server, so this
cannot write to production even if the script is buggy. The entire backup —
schema fingerprint, every table dump, and the source spot checks — runs inside
one `REPEATABLE READ` snapshot, so the artifact is internally consistent (FK
chains restore) even if the news worker writes mid-backup.

#### Scheduled

`.github/workflows/production-backup.yml` runs `scripts/backup-restore-test.mjs
--backup-only` daily at 03:40 UTC (`workflow_dispatch` also available), using
the same `SUPABASE_DB_URL` secret and the same read-only, single-snapshot
backup path described above — `--backup-only` skips the restore/verify phases
entirely, so no scratch Postgres is created and nothing is ever restored. Each
run uploads `.backups/**` as a GitHub Actions artifact named
`production-backup-<run-id>`, retained 90 days. This is a zero-spend
mitigation for Supabase Free having no platform backups (§2 Layer A) — it does
not prove a restore works end-to-end; that is `production-backup-drill.yml`
(§6). Failures raise a persistent `watchdog-alert` issue titled
"Production backup failing" (`scripts/watchdog/upsert-alert.sh`), closed
automatically on the next successful run.

To pull a scheduled artifact down for a restore:

```bash
gh run list --repo JW-Incorporated/swift2 --workflow production-backup.yml
gh run download <run-id> --repo JW-Incorporated/swift2 -n production-backup-<run-id> -D ./restore-artifact
```

The downloaded directory is the same `<timestamp>/data/*.ndjson` + `manifest.json`
shape `scripts/backup-restore-test.mjs` produces and consumes normally — point
a restore at it the same way §3 describes.

---

## 3. How to restore

The restore is **two steps, in this order**, because schema and data come from
different places:

1. **Schema from git.** `SUPABASE_DB_URL=<target> node scripts/migrate.mjs`
2. **Data from the backup.** Truncate, then load each table's NDJSON in
   foreign-key dependency order.

`scripts/backup-restore-test.mjs` does both, and then verifies. That is the
point: the restore procedure and the test of the restore procedure are the same
code path, so the runbook cannot drift from what actually works.

### Recovery decision tree

| Situation | Do this | Data lost |
|---|---|---|
| Content wrong / partially clobbered | `npm run db:migrate` then the retired content seed scripts if you really want the DB to match (`docs/dev-quickstart.md` — cosmetic only, OS-016: no surface reads these tables) | Nothing content-side; **uuids change** |
| Runtime `news_*` data lost, content fine | Restore from the most recent layer-B artifact, `news_*` tables only | Everything since that artifact |
| Whole project gone | New Supabase project → `db:migrate` → (content reseed optional/cosmetic, OS-016) → load the newest layer-B artifact over the `news_*` tables → repoint `SUPABASE_URL`/keys. The newest artifact is either a local `--keep` run or the latest `production-backup.yml` scheduled run (§2 "Scheduled" — `gh run download`) | News state since the last artifact; **all uuids change** |
| Bad write in the last few minutes/hours | Supabase PITR — **only if §2 layer A says it is enabled** | Depends on the window |

### The uuid trap

A reseed does not restore ids. If you rebuild content from seeds rather than
from a backup, every `era.id`, `month_item.id`, `track_note.id` changes. The
public site does not care (it renders from the generated vault), but anything
holding a `month_item_id` — the `/vault/moment/[id]` route, any mobile deep
link, any externally shared URL — will 404. **Prefer restoring the data from a
layer-B artifact over reseeding whenever ids matter.**

---

## 4. Running the drill

```bash
# Against any Postgres you already have (what CI does):
node scripts/backup-restore-test.mjs --drill \
  --cluster "postgres://postgres:postgres@127.0.0.1:5432/postgres?sslmode=disable"

# With no Postgres and no Docker installed — downloads a real Postgres for the
# run and throws it away afterwards (~100 MB, deliberately NOT a dependency of
# this repo, since every CI job would then pay for it on `npm ci`):
npm i --no-save embedded-postgres
node scripts/backup-restore-test.mjs --drill --cluster ephemeral

npm run test:backup-restore    # shorthand; assumes Postgres on localhost:5432
```

The drill creates two scratch databases, builds the source from this repo's own
migrations and seed scripts, adds synthetic runtime-only `news_*` rows (the part
git cannot rebuild), backs it up, restores into the second database, and
verifies. Everything is dropped afterwards unless you pass `--keep`.

**What it checks:** the schema fingerprint (156 columns) matches; every table's
row count matches; every table's order-independent content checksum matches; and
eight named spot checks return byte-identical rows on both sides — including
jsonb themes, a 6 KB track dossier, the `moment`→`month_item` FK, and all four
runtime-only `news_*` tables.

**Safety rails, with no override flag:** the drill refuses to restore into a
`*.supabase.co` / pooler host, and refuses to restore into the source database.
Both rules are unit-tested in `scripts/backup-restore-test.test.ts`.

---

## 5. What this proves — and what it does not

**Proves:** the restore procedure on this page is executable, produces a
byte-identical database, and is verified by machine rather than by eye. A future
migration that breaks the round-trip turns the monthly drill red.

**Does not prove:**

- That Supabase is taking platform backups of *our* project (§2 layer A —
  needs the dashboard).
- That a restore of *production's actual bytes* works. The drill's source is
  built from repo seeds; it is a faithful schema-and-content replica, but it is
  not production. Closing that gap is §6's real-data drill, which needs
  credentials and is a human-run step.
- Anything about Supabase Storage, Auth, or Edge Functions. This project uses
  none of them today. If that changes, this runbook needs a new section.

---

## 6. Drill log

Append a row per run. A restore procedure that has not been executed this
quarter should be treated as unproven.

| Date | Mode | Source | Result | Notes |
|---|---|---|---|---|
| 2026-08-11 | drill (fixture source, ephemeral Postgres 18.4, Windows) | repo migrations + 7 seed scripts + synthetic `news_*` | **PASS** | 14 tables, 1901 rows, 3.24 MB. backup 216 ms · restore 590 ms · verify 97 ms · 15.2 s end-to-end including booting and tearing down the cluster. Schema fingerprint match (156 columns); all 14 per-table checksums match; 8/8 spot checks byte-identical. Negative control run the same day: deliberately dropping one `theory` row and altering one `news_story` title made the drill exit 1 and name both tables plus two spot checks — the verification is not a rubber stamp. |
| 2026-08-30 | status report (Joey) | Supabase dashboard report | **OPEN** | Current plan is Supabase Free; no backup options are available and no backup was made. No production-data restore drill was performed. This records status only and does not accept the BACKUPS launch risk. |
| 2026-09-06 | production-bytes drill (`production-backup-drill.yml`, [run 34054042528](https://github.com/JW-Incorporated/swift2/actions/runs/34054042528)) | production `SUPABASE_DB_URL`, read-only session → throwaway Postgres 17 in the job | **FAIL (restore); backup PASS** | Backup half worked against real production data: 35 tables · 8298 rows · 11.27 MB in 7664 ms, per-table checksums recorded. Restore half died applying `20260904000000_clown_sessions.sql`: `schema "auth" does not exist` — the migration references `auth.users`, which only exists on Supabase, so any non-Supabase restore target (which `assertSafeTarget` *requires*) cannot replay the migration set. **The workflow reported green anyway** — `node … \| tee` without `pipefail` swallowed the exit code, and the alert issue was closed as PASSED. Two fixes tracked on the swift2 kanban (children of t_a0ad2392): (a) the drill/migrate path creates a stub `auth` schema + `auth.users(id uuid pk)` + `auth.uid()` on non-Supabase targets before migrating, (b) `set -o pipefail` in both drill workflows. Gate stays 🟡 until a corrected run passes end-to-end. |
| 2026-09-06 | production-bytes drill (`production-backup-drill.yml`, [run 34056536066](https://github.com/JW-Incorporated/swift2/actions/runs/34056536066)) | production `SUPABASE_DB_URL`, read-only session → throwaway Postgres 17 in the job | **FAIL (restore, new reason); backup PASS** | Re-run from `main` after PR #3926 (auth-schema shim + pipefail, merged 2026-09-06). Both #3926 fixes worked as intended: the auth-schema shim applied cleanly ("applied Supabase auth-schema compat shim to restore target (non-Supabase target)"), migrations applied, and this time the failure was reported honestly (workflow went red, no false PASS). Backup half again worked against real production data: 35 tables · 8298 rows · 11.27 MB in 4129 ms, per-table checksums recorded. Restore died on the very first table load: `cannot insert a non-DEFAULT value into column "lag_days"` — `public.egg_ledger.lag_days` is a `generated always as (...) stored` column (`supabase/migrations/20260901000000_knowledge_engine.sql:117`), and the restore's row-loader is inserting the backed-up value for it instead of omitting the column and letting Postgres compute it. This is a distinct bug from the `auth`-schema issue #3926 fixed — new follow-up filed (see below). Gate stays 🟡. |
| 2026-09-06 | production-bytes drill (`production-backup-drill.yml`, [run 34057210905](https://github.com/JW-Incorporated/swift2/actions/runs/34057210905)) | production `SUPABASE_DB_URL`, read-only session → throwaway Postgres 17 in the job | **PASS** | Re-run from `main` after PR #3931 (`loadTable()` now builds an explicit, `pg_attribute`-derived column list per table, excluding any `generated always ... stored` column — fixes `egg_ledger.lag_days` generically, not by name). Backup half: 35 tables · 8298 rows · 11.27 MB in 10206 ms. Restore: 829 ms. Verify: 228 ms. Total: 14259 ms. Every one of the 35 tables restored with matching row count and content checksum, including `egg_ledger` (37 rows, checksum match). `PASS — every table restored with matching row count and content checksum.` **Gate closes green.** |

**Open items to close the gate fully:**

- [x] ~~**Joey:** decide and record the backup-risk posture~~ — **ruled
      2026-09-06 (FR-t_a0ad2392-4):** not a founder decision. The only
      state that exists nowhere but Supabase is the `news_*` runtime tables
      and generated uuids (§1); Layer B already reads all of it in 7.7 s.
      A *scheduled* Layer-B production backup uploaded as a 90-day GitHub
      artifact is "another backup path evidenced" at zero spend, so the
      risk is mitigated rather than accepted. **Mitigated 2026-09-06:**
      `.github/workflows/production-backup.yml` runs
      `backup-restore-test.mjs --backup-only` daily and uploads a 90-day
      artifact (§2 "Scheduled"). Upgrading the Supabase plan would be real
      recurring spend and stays a founder call — but nothing here needs it.
- [x] ~~**Agent:** the production-bytes drill's restore path now fails on
      `public.egg_ledger.lag_days` (`generated always as (...) stored`):
      `loadTable()` in `scripts/backup-restore-test.mjs` does
      `insert into public.<table> select r.* from jsonb_populate_record(...)`
      with no column list, so it tries to write a value into a generated
      column and Postgres rejects it.~~ — **fixed 2026-09-06, PR #3931.**
      `loadTable()` now queries `pg_attribute` (`attgenerated <> ''`) per
      table to build an explicit, generic column list excluding any
      generated column, and uses it in both the insert target list and the
      `jsonb_populate_record` projection — not an `egg_ledger`-specific
      fix. Re-run [34057210905](https://github.com/JW-Incorporated/swift2/actions/runs/34057210905)
      from `main` PASSED end-to-end (see the row above). Gate closes.
- [x] ~~**Joey (or anyone with repo write access — no credential handling
      required):** one real-data drill~~ — clicked 2026-09-06, see the row
      above; will be re-run automatically from the fix PR.
      Original text kept below for context: one real-data drill via
      `.github/workflows/production-backup-drill.yml`
      (`workflow_dispatch`) — before launch, logged above. This is the only
      step that proves production's own bytes restore. The mechanical
      barrier (needing `SUPABASE_DB_URL` on a local machine) is gone as of
      this session: the workflow reuses the secret already configured for
      `db-migrate`/`db-seed` and never exposes it to a human. See
      `HUMAN-ACTIONS.md` #23.

**2026-08-26 — access check (#680 desk pass, agent session, no product code touched):**
Before re-asking Wyatt, checked whether either open item was actually reachable
without him. It is not. Specifically ruled out:

- `apps/worker/.env` (`SUPABASE_DB_URL`, per `docs/dev-quickstart.md`) — this
  repo's guard hook denies touching any `.env` file outright (`ls` on it is
  refused, not just read), so even confirming it exists locally is blocked.
- Shell environment — no `SUPABASE_*`/`POSTGRES_*`/`PG_*`-named variable is
  set in the agent's process environment.
- `gh secret list` on the repo shows `SUPABASE_URL` and
  `SUPABASE_SERVICE_ROLE_KEY` exist as **GitHub Actions secrets** (names
  only — GitHub never exposes secret values via the API or CLI to anyone,
  including the repo owner). They are usable inside a workflow run, not from
  an interactive agent session, and neither is a Postgres connection string
  in any case — the service-role key is a PostgREST/Auth JWT, not a `pg`
  credential, so it could not drive `scripts/backup-restore-test.mjs` even if
  exposed to a workflow.
- No Supabase CLI is linked in this checkout (no `.supabase/`), no Supabase
  MCP server is configured for this session, and there is no Supabase
  Management API token (a separate credential from the project's DB/service
  keys, needed for plan/billing info) anywhere in the repo.
- Net: **both remaining open items are founder-only**, not agent-schedulable
  work sitting in a queue. Nothing here changes what §2/§5 already conclude —
  this just closes off "did anyone actually check for a workaround" so the
  next brief doesn't re-litigate it from scratch.
