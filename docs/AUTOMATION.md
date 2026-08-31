# AUTOMATION.md — everything that runs by itself

**Read this first for anything scheduled.** This is the index of every
automated routine keeping longlivets.com running. It tells you *what runs,
when, why, and where its real documentation lives* — it deliberately does
**not** duplicate that documentation, and it does **not** override any of it.
Each row links to the file that is the source of truth for that routine;
[`CLAUDE.md`](../CLAUDE.md) remains the authoritative operating manual, and
where this file records a conflict between two docs it says so rather than
picking a winner.

- Owner: the repo (any desk may propose changes by PR; no routine may edit
  this file's Efficiency Review section about itself).
- Last full audit: **2026-08-31**.
- Counted here: **37 GitHub Actions workflows**, **24 Claude desk routine
  triggers**, **1 Vercel Cron job**, **2 Dependabot update schedules** = **64
  automated routines**. The counting unit is *one independently-scheduled
  thing*, not one file — which is why `.github/dependabot.yml` contributes two
  (npm and github-actions are separate `updates:` entries with their own
  cadences) and why `watchdog.yml`'s two crons still count as one workflow.

> **On the routine count.** [`agents/runners.md`](agents/runners.md)'s summary
> line reads "23 Swift2 routines total, 22 enabled" while its own table has 24
> rows and its 2026-08-27 audit note says "all 24 triggers verified live". Both
> are right about different things: the 23/22 figure counts the **standing
> fleet** and excludes `swift2 Getty purge — GitHub GC watch`, which that same
> table flags as a self-retiring one-shot outside the fleet. This file counts
> **every live trigger**, so it says 24 (23 enabled — Lex depth is
> intentionally paused). Same underlying reality, two scopes; the registry's
> summary line has been annotated to say so.

---

## The three tiers (this is the architecture already in use)

The repo runs on a deliberate split, stated as a standing rule in
[`CLAUDE.md`](../CLAUDE.md) § Cost discipline:

> **Freshness on Actions, judgment on routines** — a scheduled GitHub Action
> keeps the site/bot's data current and never depends on a founder's Claude
> account being logged in; a Claude routine only ever adds judgment on top of
> data an Action already produced. A routine going dark must never make the
> site stale.

| Tier | What it is | Runs on | Costs | Fails how |
|---|---|---|---|---|
| **1 — Actions (deterministic)** | `.github/workflows/*.yml`. Zero or near-zero LLM. Detects, files tickets, ships queued work, commits state, alerts. | GitHub's scheduler | Actions minutes | Loudly — a red run is visible in the Actions tab |
| **2 — Desk routines (judgment)** | Scheduled Claude sessions, one per "desk". They read what Tier 1 produced and make calls a script cannot: is this rumor sourced, is this page thin, is this alert real. Charters in [`docs/agents/`](agents/), prompts in [`docs/agents/runner-prompts/`](agents/runner-prompts/), cadence registry in [`agents/runners.md`](agents/runners.md). | Joey's Claude account — see the note below | Claude tokens | **Silently** — this repo cannot see a routine's dashboard, which is why Tier 1 carries liveness checks for them |
| **3 — Product runtime** | Cron built into the deployed product, not into CI. Today: exactly one, the notifications dispatcher. | Vercel Cron | Vercel plan | Silently, and **currently unwatched** — see [REC-1](#rec-1) |

**Why Tier 1 exists even where Tier 2 could do the job:** Karen (the content
integrity engine) went dark for 10+ days in August 2026 and nobody noticed,
because a Claude routine leaves no trace in this repo when it doesn't run. The
deterministic half of Karen was moved to `cie-scan.yml` for exactly that
reason. When you add automation, put the *freshness* half on Actions and only
the *judgment* half on a routine.

**Kill switch:** [`agents/README.md` § The kill switch](agents/README.md#the-kill-switch--pausing-the-org-gap-analysis-g10).
Instant per-tier stops also exist: repo variable `SOCIAL_FREEZE` halts all
posting; `CONTENT_AUTOMERGE_FREEZE` halts all content auto-merge.

> ### Which account owns the routines
>
> **Joey's.** Two lines in `CLAUDE.md` still say otherwise, but `CLAUDE.md`
> resolves its own contradiction — no founder needs to be asked, and nothing
> here requires approval:
>
> - [`CLAUDE.md`](../CLAUDE.md) § Operating habits says *"Scheduled runners
>   live on Wyatt's account so Joey's weekly limit stays free"*, and § Parallel
>   fleets repeats it.
> - But [`CLAUDE.md`](../CLAUDE.md) § The team, which is the authoritative
>   statement of who does what, says Wyatt *"no longer takes actions or makes
>   decisions on this project"* and that **"where older docs say 'ask Wyatt' or
>   'Wyatt decides,' that means Joey now."** The two runner lines are exactly
>   that kind of older reference.
> - [`agents/runners.md`](agents/runners.md) agrees on the facts: the fleet
>   consolidated to **Joey's account ~2026-08-23**, re-verified against the
>   live routines API on **2026-08-27** ("All 24 triggers verified live …
>   Nothing remains on the other founder's account"), with per-trigger IDs.
>
> So: **operate routines on Joey's account, using the trigger IDs in the
> registry.** Provisioning, disabling, and kill-switching a routine are all
> reversible, so per § Decision authority they are agent calls — act, don't
> wait. Recommended cleanup: a one-line edit to those two `CLAUDE.md`
> sentences pointing at the registry, so the stale phrasing stops resurfacing.
> Not done here — `CLAUDE.md` is a protected agent-instruction file and this
> card's scope is a docs audit.

---

## Tier 1 — GitHub Actions (37)

Cadences are UTC. "LLM" = does this workflow itself call a model.
Minute offsets are deliberately non-`:00`/`:30` — see `watchdog.yml`'s header
on this repo's scheduling contention.

### Gates and merge machinery (3)

| Workflow | Trigger | LLM | Mutates | Reviewed by | Docs |
|---|---|---|---|---|---|
| [`ci.yml`](../.github/workflows/ci.yml) | every PR + push to `main` | no | nothing | it *is* the gate | header (cost model); the required check is `build` |
| [`codeql.yml`](../.github/workflows/codeql.yml) | PR, push `main`, Mon 12:27 | no | security alerts | Paul Blart | [`agents/paul-blart.md`](agents/paul-blart.md) |
| [`auto-merge-content.yml`](../.github/workflows/auto-merge-content.yml) | PR events | no | enables auto-merge on allowlisted PRs | path allowlist + branch/author gate | header + [`.github/content-automerge-allowlist.txt`](../.github/content-automerge-allowlist.txt) |

`auto-merge-content.yml` is the single most load-bearing workflow in the repo:
it is why desk routines can open a PR and exit instead of babysitting it
(which was ~69% of all agent token spend before 2026-07-25).

### Watchdogs and freshness (5)

| Workflow | Trigger | LLM | Mutates | Docs |
|---|---|---|---|---|
| [`watchdog.yml`](../.github/workflows/watchdog.yml) | daily 14:35 + **hourly :05** | no | opens/closes `watchdog-alert` issues, emails founders, can re-trigger `brief-mailer` | header (very thorough) |
| [`e2e.yml`](../.github/workflows/e2e.yml) | daily 13:05 + dispatch | no | nothing (Playwright against live prod) | header |
| [`a11y.yml`](../.github/workflows/a11y.yml) | daily 16:10 | no | nothing (axe/pa11y artifacts, non-blocking) | [`agents/laura.md`](agents/laura.md) |
| [`unowned-sweep.yml`](../.github/workflows/unowned-sweep.yml) | issue events + daily 15:20 | no | applies `needs-triage`, refreshes one ledger issue | [`ops/unowned-queues.md`](ops/unowned-queues.md) |
| [`backup-restore-drill.yml`](../.github/workflows/backup-restore-drill.yml) | monthly 1st 06:20 + PR touching `supabase/migrations/**` | no | nothing (scratch DBs only, no prod access) | [`backup-restore.md`](backup-restore.md) |

`watchdog.yml` is not one check but **fifteen steps**, and it is the only thing
watching Tier 2. In file order: brief exists → brief was actually mailed →
alert founders (brief missing) → brief recovered (self-close) → degraded
answer propagation → **hourly prod smoke check** → scheduled-workflow cadence
view → PRs stuck on failing/missing checks → Karen CIE ticket-filing freshness
(`STALE_DAYS=9`) → work-ownership → **Karen post-repair confirmation** →
**news-worker rotation confirmation** → content-lane liveness (`vault/` branch,
36h window) → Facebook export freshness → knowledge-engine current-tier
freshness.

⚠️ The two bolded steps are labelled in the workflow itself as *"self-limiting,
remove after 2026-08-22"* and are **still running daily, nine days past their
own expiry.** Each was a temporary confirmation added after a specific repair.
Neither is dangerous — both are read-only checks that self-close — but they
cost a step per run and, more importantly, they are exactly the kind of
temporary scaffolding that becomes permanent because nobody wrote down who
removes it. Their headers state the removal is safe and that nothing else
references their helper scripts. Recommended: delete both steps plus
`scripts/watchdog/karen-post-repair-check.mjs` and
`scripts/watchdog/news-worker-rotation-check.mjs` (reversible, agent call).

### Founder communications (3)

| Workflow | Trigger | LLM | Mutates | Docs |
|---|---|---|---|---|
| [`brief-mailer.yml`](../.github/workflows/brief-mailer.yml) | daily 12:45 | no | sends the Founders' Brief email | [`agents/marjorie.md`](agents/marjorie.md) § Delivery |
| [`marjorie-inbox.yml`](../.github/workflows/marjorie-inbox.yml) | **every 30 min** | no | posts founder email replies as issue/PR comments | header (DKIM + idempotency rules) |
| [`tree-mail.yml`](../.github/workflows/tree-mail.yml) | PR opened + dispatch | no | emails Tree's weekly plan; digest job applies `founder-mailed` | header — **but see [REC-5](#rec-5), the header is stale** |

Standing constraint (Joey, 2026-08-23): **at most 1–2 founder-facing report
emails total** — the morning brief and Tree's weekly report. Anything that
wants to email a founder must displace one of those, not add a third.

### Content engine (3)

| Workflow | Trigger | LLM | Mutates | Judgment partner (Tier 2) |
|---|---|---|---|---|
| [`appearance-discovery.yml`](../.github/workflows/appearance-discovery.yml) | daily 13:40 **and 21:40** | no | files `intake` issues; stages templated `social/queue/*.json` drafts | Content Shift / Vault Run lane 1 |
| [`cie-scan.yml`](../.github/workflows/cie-scan.yml) | daily 09:09 | no | files/dedupes `cie` tickets, commits the dated report to `docs/audits/engine/` | Karen (judgment half) |
| [`news-worker.yml`](../.github/workflows/news-worker.yml) | every 4h (`10 1,5,9,13,17,21`) | optional (OpenAI classifier; rule-based fallback) | `news_*` tables, `news-digest` branch | News Triage routine |

These three are the clearest illustration of the two-tier model: each one is
the deterministic detector for a desk that supplies the judgment.

### Social (5)

| Workflow | Trigger | LLM | Mutates | Docs |
|---|---|---|---|---|
| [`social-poster.yml`](../.github/workflows/social-poster.yml) | **every 30 min** | no | **posts live to X, Instagram, Facebook**; commits queue state | header (the `social-ledger` dedupe design) + [`agents/growth.md`](agents/growth.md) |
| [`growth-snapshot.yml`](../.github/workflows/growth-snapshot.yml) | daily 11:05 | no | commits `social/metrics/*.json` for the brief's Growth bullet | header |
| [`social-audit.yml`](../.github/workflows/social-audit.yml) | dispatch only | no | opens/refreshes one "IG media audit" issue (recommends, cannot delete) | header |
| [`social-delete-media.yml`](../.github/workflows/social-delete-media.yml) | dispatch only | no | **deletes live IG/FB posts** | header — ⚠️ agents are forbidden to run this |
| [`remove-x-site-screens.yml`](../.github/workflows/remove-x-site-screens.yml) | dispatch only | no | deletes two specific X posts | header — one-time cleanup, see [REC-5](#rec-5) |

`social-poster.yml` is the only workflow in the repo that takes an
irreversible public action on every scheduled run. Its safety model is the
`social-ledger` branch (dedupe correctness does not depend on any PR merging)
plus the `SOCIAL_FREEZE` repo variable.

### Merch autonomy engine (13)

Spec: [`SPEC.merch-autonomy.md`](SPEC.merch-autonomy.md) · plan:
[`PLAN.merch-autonomy.md`](PLAN.merch-autonomy.md) · acceptance receipt:
[`ops/MERCH-PHASE-4-ACCEPTANCE.md`](ops/MERCH-PHASE-4-ACCEPTANCE.md).
Every scheduled merch lane is zero-LLM by design (rule R1); every lane that
spends money or calls a model is a separate **manually confirmed** workflow.

| Workflow | Engine | Trigger | LLM / spend | Mutates |
|---|---|---|---|---|
| [`merch-awin-sync.yml`](../.github/workflows/merch-awin-sync.yml) | E0 | daily 07:53 | no | gated PR (advertiser map) + Actions cache |
| [`merch-verify.yml`](../.github/workflows/merch-verify.yml) | E1/E2 detect | daily 09:46 | no | artifacts only |
| [`merch-fanmade.yml`](../.github/workflows/merch-fanmade.yml) | E5 | daily 09:47 | no | files candidate issues |
| [`merch-official-sync.yml`](../.github/workflows/merch-official-sync.yml) | E4 | 08:17 + 20:17 | no | gated PR: catalog + store-drop `social/queue` pair |
| [`merch-audit-detect.yml`](../.github/workflows/merch-audit-detect.yml) | E3 detect | Mon 15:24 + push to content paths | no | scoring-queue artifact |
| [`merch-audit-authoring.yml`](../.github/workflows/merch-audit-authoring.yml) | E3 author | dispatch + typed `RUN_AUTHORED_VISION_AUDIT` | **vision model, $5/run cap** | artifacts + issues |
| [`merch-matcher.yml`](../.github/workflows/merch-matcher.yml) | E6 detect | dispatch | no | deterministic handoff plan |
| [`merch-matcher-authoring.yml`](../.github/workflows/merch-matcher-authoring.yml) | E6 author | dispatch + typed `RUN_MATCHER_AUTHORING` | **vision + paid search, per-run cap** | artifacts only |
| [`merch-revenue.yml`](../.github/workflows/merch-revenue.yml) | reporting | Mon 15:23 | no | gated PR (`docs/ops/MERCH-REVENUE.json`) |
| [`merch-terms-recheck.yml`](../.github/workflows/merch-terms-recheck.yml) | compliance | quarterly, 1st of Jan/Apr/Jul/Oct 15:17 | no | one review ticket per quarter |
| [`merch-e5-evidence.yml`](../.github/workflows/merch-e5-evidence.yml) | E5 evidence | dispatch + typed `COLLECT_E5_EVIDENCE` | no (Etsy API) | artifacts only |
| [`merch-awin-directory-shortlist.yml`](../.github/workflows/merch-awin-directory-shortlist.yml) | E0 join | dispatch + typed confirmation | no | artifacts only |
| [`merch-awin-directory-recommendations.yml`](../.github/workflows/merch-awin-directory-recommendations.yml) | E0 join | dispatch + typed confirmation | no | artifacts only |

### Database operations (3)

| Workflow | Trigger | Mutates production |
|---|---|---|
| [`db-migrate.yml`](../.github/workflows/db-migrate.yml) | dispatch + push to `main` touching `supabase/migrations/**` | **yes** — applies migrations, then re-runs to prove idempotency |
| [`db-seed.yml`](../.github/workflows/db-seed.yml) | dispatch only, `target` chosen from a fixed allowlist | **yes** — operator-triggered seeds |
| [`db-connectivity-check.yml`](../.github/workflows/db-connectivity-check.yml) | dispatch + PR touching itself | no — `SELECT 1` |

### Security and standing reminders (2)

| Workflow | Trigger | Docs |
|---|---|---|
| [`dependabot-alerts-snapshot.yml`](../.github/workflows/dependabot-alerts-snapshot.yml) | Mon 21:00 (one hour before Paul Blart's patrol) | header — exists because the routine's own token 403s on the alerts API |
| [`fb-export-reminder.yml`](../.github/workflows/fb-export-reminder.yml) | Sun 16:00 | header — Facebook has no API for non-administered groups, so this stays a human task |

### Dependabot update schedules (2) — config, not workflows

Counted separately from the 37 workflows above: these are `updates:` entries in
one config file, scheduled by GitHub itself rather than by a workflow.

| Schedule | Cadence | Docs |
|---|---|---|
| [`.github/dependabot.yml`](../.github/dependabot.yml) → **npm** | weekly Mon 05:00 America/Los_Angeles | [`agents/paul-blart.md`](agents/paul-blart.md) — grouped dev + production patch/minor bumps, max 5 open PRs; security updates ride their own immediate lane, deliberately un-batched |
| [`.github/dependabot.yml`](../.github/dependabot.yml) → **github-actions** | weekly Mon (no explicit time — GitHub picks) | [`agents/paul-blart.md`](agents/paul-blart.md) — one grouped PR for all Action version bumps, keeping the CI/security workflows current |

---

## Tier 2 — Claude desk routines (24 triggers, 23 enabled)

Cadence registry and live trigger IDs: **[`agents/runners.md`](agents/runners.md)**
— that table supersedes any trigger ID quoted elsewhere. Prompts live in
[`agents/runner-prompts/`](agents/runner-prompts/); **the repo file is the
source of truth**, and a trigger whose inline prompt drifts from its file is a
bug. Fleet invariants (what must always be true of every routine) are in
[`agents/routine-invariants.md`](agents/routine-invariants.md).

### Content lanes

| Routine | Cadence (UTC) | Model | Charter | Prompt file |
|---|---|---|---|---|
| The Vault Run (orchestrator, all six lanes) | daily 16:07 | Opus 4.8 | [`agents/vault-run-plan.md`](agents/vault-run-plan.md) | [`vault-run.md`](agents/runner-prompts/vault-run.md) + [`vault-lanes/`](agents/runner-prompts/vault-lanes/) |
| Content Shift | daily 17:00 | Opus 4.8 | [`agents/content-shift.md`](agents/content-shift.md) | [`content-shift-run.md`](agents/runner-prompts/content-shift-run.md) |
| Answerer | daily 13:50 | Opus 4.8 | *none* | [`answerer.md`](agents/runner-prompts/answerer.md) |
| Photo Enrichment worker | daily 06:21 | Sonnet 5 | *none* | [`photo-enrichment-worker.md`](agents/runner-prompts/photo-enrichment-worker.md) |
| Rumor Desk | 14:47 on **odd days of the month** (`47 14 */2 * *`) | Opus 4.8 | *none* | [`rumor-desk.md`](agents/runner-prompts/rumor-desk.md) |
| Cross-Link builder | Mon+Thu 09:51 | Sonnet 5 | *none* | [`cross-link-builder.md`](agents/runner-prompts/cross-link-builder.md) |
| Stylist | Sun 16:33 | Sonnet 5 | *none* | [`stylist.md`](agents/runner-prompts/stylist.md) |
| News Triage | daily 15:40 | Opus 4.8 | *none* | [`news-triage.md`](agents/runner-prompts/news-triage.md) |
| Lex depth | **disabled** (warm spare) | Opus 4.8 | *none* | [`lex-depth.md`](agents/runner-prompts/lex-depth.md) |

⚠️ **The six standalone lanes above (Content Shift, Answerer, Photo
Enrichment, Rumor Desk, Cross-Link, Stylist) run *in addition to* the Vault Run
that was built to replace them.** Phase 4 of the consolidation never landed, so
Rumor Desk content lands every day from two schedulers (standalone on odd days
of the month, Vault lane on even) rather than
on its designed every-other-day cadence. See [REC-2](#rec-2).

### Quality and integrity desks

| Routine | Cadence (UTC) | Model | Charter | Reads what Tier 1 produced |
|---|---|---|---|---|
| Karen — scan (registered name; weekly judgment slice) | Sun 09:00 | Sonnet 5 | [`scripts/content-engine/README.md`](../scripts/content-engine/README.md) | `cie-scan.yml`'s findings |
| Nils — site walk | Sun 14:00 | Opus 4.8 | [`agents/nils.md`](agents/nils.md) | live site |
| Laura — a11y walk | daily 18:20 | Sonnet 5 | [`agents/laura.md`](agents/laura.md) | `a11y.yml` artifacts |
| Paul Blart — security patrol | Mon 22:20 | Opus 4.8 | [`agents/paul-blart.md`](agents/paul-blart.md) | `dependabot-alerts-snapshot.yml` + `codeql.yml` |
| Routine Auditor — fleet invariants | Sun 16:11 | Haiku 4.5 | [`agents/routine-invariants.md`](agents/routine-invariants.md) | the routine fleet itself |

### Ticket operations and build

| Routine | Cadence (UTC) | Model | Charter |
|---|---|---|---|
| Kevin — S1 Karen-ticket solver | Sun 11:17 | Opus 4.8 | [`kevin.md`](kevin.md) |
| Kevin — S2 user-feedback digest | daily 15:13 | Sonnet 5 | [`kevin.md`](kevin.md) |
| Kevin — S3 eng triage | daily 15:43 | Sonnet 5 | [`kevin.md`](kevin.md) |
| Kevin — S3 comment radar | 01:23 + 13:23 | Haiku 4.5 | [`kevin.md`](kevin.md) |
| Austin — build runs | daily 21:00 | Fable 5 | [`agents/austin.md`](agents/austin.md) |

### Founder-facing and social planning

| Routine | Cadence (UTC) | Model | Charter |
|---|---|---|---|
| Marjorie — 6 AM Founders' Brief | daily 12:00 | Opus 4.8 | [`agents/marjorie.md`](agents/marjorie.md) |
| Marjorie — 8 PM Evening Delta | daily 03:00 (comment-only since 2026-08-23) | Fable 5 | [`agents/marjorie.md`](agents/marjorie.md) § Delivery |
| Tree — weekly social plan | Mon 10:00 | **Opus 5** | [`agents/tree.md`](agents/tree.md) |
| Growth — daily draft | daily 11:00 | Opus 4.8 | [`agents/growth.md`](agents/growth.md) |

### One-off / not part of the standing fleet

| Routine | Cadence (UTC) | Model | Docs |
|---|---|---|---|
| swift2 Getty purge — GitHub GC watch | 03:00 + 15:00 | Sonnet 5 | one table row in [`agents/runners.md`](agents/runners.md) — self-retiring one-shot, created 2026-08-15 |

### Specified but never created

| Routine | State | Docs |
|---|---|---|
| Karen Deep — agent review | ⚠️ **NOT CREATED** since it was specified 2026-08-11 | [`agents/runners.md`](agents/runners.md) § "Karen Deep — trigger config to create" + [`karen-deep-review.md`](agents/runner-prompts/karen-deep-review.md) |

---

## Tier 3 — Product runtime cron (1)

| Job | Where | Cadence | What it does |
|---|---|---|---|
| `/api/notifications/dispatch` | [`apps/web/vercel.json`](../apps/web/vercel.json) `crons` | **every 15 min** | fan-out + governor + digest merge + cooldown pass + FCM/web-push send + delivery logging. Entry point: [`apps/web/app/api/notifications/dispatch/route.ts`](../apps/web/app/api/notifications/dispatch/route.ts) |

Specs: [`NOTIFICATIONS_SPEC.md`](../NOTIFICATIONS_SPEC.md) §10 ·
[`NOTIFICATIONS_PLAN.md`](../NOTIFICATIONS_PLAN.md) ·
setup: [`SETUP_NOTIFICATIONS.md`](../SETUP_NOTIFICATIONS.md).

This is the only automated routine that **delivers directly to a user's own
device** on every run, and per [`vision.md`](vision.md) notifications are the
product's stated differentiator ("user notifications are presented as an
integral part of the experience"). `social-poster.yml` is the other routine
that acts irreversibly in public every run — but a bad or missing social post
is visible to the founders in the queue and the timeline, whereas a
notification that never fires is invisible to everyone. This job has no
watchdog. See [REC-1](#rec-1).

---

## Documentation quality assessment (2026-08-31)

Scored against one question: **could a founder or a brand-new agent understand
what this does and why, from the docs that exist today, without reverse-
engineering code?**

| Verdict | Count | Share |
|---|---:|---:|
| Well documented | 41 | 64% |
| Partially documented | 17 | 27% |
| Effectively undocumented | 6 | 9% |

**Well documented (41).** Twenty-two workflows — all five watchdog/freshness,
all three founder-comms, all three content-engine, all three DB, both security
reminders, two of the three gates (`codeql.yml`, `auto-merge-content.yml`) and
four of the five social — plus both `dependabot.yml` update schedules and the
Tier-3 notifications cron (25); and on the routine side, all sixteen desks that
have a charter: Marjorie ×2, Austin, Nils, Content Shift, Tree, Laura, Paul
Blart, Growth, Karen, Kevin ×4, the Vault Run, and the Routine Auditor. This
repo's workflow headers are genuinely unusual: most carry the incident that
caused them, the alternative that was rejected, and the date. That is the
standard to preserve.

**Partially documented (17).** Eleven of the thirteen merch workflows, whose
own headers are 1–3 lines and whose real explanation lives in
[`SPEC.merch-autonomy.md`](SPEC.merch-autonomy.md) — but **that spec's
workflow table (§ "Cadence") is stale**: it lists a `merch-audit.yml` that
does not exist (it was split into `-detect`/`-authoring`), and omits
`merch-terms-recheck`, `merch-e5-evidence`, both Awin directory workflows, and
both authoring lanes. Plus the six Tier-2 content lanes (Answerer, Photo
Enrichment, Rumor Desk, Cross-Link, Stylist, News Triage) which have a versioned
prompt file but **no charter** — so their mutation rights, budget, and "audited
by" are nowhere stated, which is exactly the gap `agents/README.md` § Charter
sections says every scheduled agent must close.

**Effectively undocumented (6).**

1. **`swift2 Getty purge — GitHub GC watch`** (routine) — one table row. No
   prompt file, no charter, no stated retirement condition beyond
   "self-retiring". Running twice a day.
2. **`Lex depth`** (routine) — disabled since 2026-07-25 with no recorded
   reason to keep it or kill it. A warm spare with no stated thaw condition is
   a dead entry.
3. **`ci.yml`** — has an excellent *cost* header and no *purpose* header. What
   the required `build` check actually gates (typecheck, lint, vitest,
   `validate:content`, `check:generated`, `check:content-inert`,
   `check:automerge-allowlist`, the clown red-team battery) is discoverable
   only by reading the steps.
4. **`remove-x-site-screens.yml`** — "two specified X site-screen posts". Which
   two, and did it run? Not recorded anywhere.
5. **`merch-awin-directory-shortlist.yml`** — one-line header, near-identical
   to the file below it, and nothing explains how they differ.
6. **`merch-awin-directory-recommendations.yml`** — same, in the other
   direction.

### Docs that reference routines which do not exist

| Reference | Where | Reality |
|---|---|---|
| **"Scheduled runners live on Wyatt's account"** | [`CLAUDE.md`](../CLAUDE.md) § Operating habits + § Parallel fleets | Stale phrasing. `CLAUDE.md` § The team already resolves it ("where older docs say 'ask Wyatt' … that means Joey now") and the registry records the live-verified move to Joey's account. Worth a one-line cleanup so it stops resurfacing; see the account note above. |
| `knowledge-engine.yml` | [`watchdog.yml`](../.github/workflows/watchdog.yml) alert text; knowledge-engine proposal + handoff | never created — `news-worker.yml` was never renamed. The alert tells a founder to check a file that isn't there. |
| `merch-audit.yml` | [`SPEC.merch-autonomy.md`](SPEC.merch-autonomy.md) § Cadence | split into `merch-audit-detect.yml` + `merch-audit-authoring.yml` |
| `appearance-discovery` at `40 13 * * *` | [`agents/runners.md`](agents/runners.md) | actual cron is `40 13,21 * * *` — twice daily |
| "Karen Deep — agent review" as pending | [`agents/runners.md`](agents/runners.md) | still not created, 20 days after specification |
| Tree "routine is a pending Wyatt-side paste" | [`agents/README.md`](agents/README.md) roster | Tree is live and shipped a plan on 2026-08-31 |
| "Kevin, on Wyatt's side: stop the session cron" | [`agents/README.md`](agents/README.md) kill switch | Kevin has been four cloud routines since 2026-07-12, so the kill-switch step as written does not stop it |
| Criterion 2 "`author-catalogs.mjs` is invoked by no workflow" | [`ops/MERCH-PHASE-4-ACCEPTANCE.md`](ops/MERCH-PHASE-4-ACCEPTANCE.md) | resolved — `merch-official-sync.yml`'s `author` job calls it (PR #3555) |
| `agents/README.md` roster table | [`agents/README.md`](agents/README.md) | lists 5 desks + "Phase 2 pending" for Karen; Laura, Paul Blart, Growth, Tree, the Vault Run and the Routine Auditor are all live and absent |
| "The job below still RUNS on schedule so `founder-mailed` bookkeeping stays current" | [`tree-mail.yml`](../.github/workflows/tree-mail.yml) header | the workflow's own `on:` block has had **no schedule since 2026-08-23** — the header contradicts the file it heads |

None of these is dangerous on its own. Together they are the failure mode
`routine-invariants.md` already names: *a point-in-time cleanup rots.*

---

## Efficiency & Quality Review (2026-08-31)

Assessed against the project's stated goals:
[`vision.md`](vision.md) (recent-news app + era time travel, with
**notifications as an integral part of the experience, never over-notifying**),
[`roadmap.md`](roadmap.md) (launch-ops track L1–L5: goal #1 growth, goal #2
keeping the fan base loving the app), and [`decisions.md`](decisions.md).

**Framing:** this fleet is in better shape than its size suggests. The
two-tier split is real and correctly reasoned, the headers record incidents
rather than intentions, and the deterministic-detection/LLM-judgment boundary
is held almost everywhere. The recommendations below are not "there are too
many routines" — they are the five places where the *implementation* has
drifted from the *design*.

Recommendations are ordered by expected impact. **Nothing here has been
executed** — each is a proposal for founder or desk action.

<a id="rec-1"></a>
### REC-1 — Put a watchdog on the notifications dispatcher (gap, highest value)

**Finding.** `vercel.json`'s `*/15` cron on `/api/notifications/dispatch` is
the delivery path for the feature `vision.md` names as the product's
differentiator, and **nothing checks that it ran** (verified: `watchdog.yml`
contains no reference to notifications or to the dispatch route). If Vercel
Cron stops, the `CRON_SECRET` rotates, or the route starts 500-ing, the first
signal is a fan noticing they stopped getting notified — there is no queue, no
branch, and no PR to inspect, unlike every other lane in this repo. Every other
critical path here has a freshness check; this one does not, and it is the
newest and least battle-tested of them.

**Recommendation.** Add a `Notifications dispatch freshness` step to
`watchdog.yml`, modelled byte-for-byte on the existing *Knowledge engine
freshness* step: a small `scripts/notifications-freshness.mjs` that exits
0 / 2 / 1 for healthy / not-applicable / stale, with the alert routed through
`scripts/watchdog/upsert-alert.sh`.

**Use an explicit per-run heartbeat, not inferred activity.** The tempting
cheap signal — "is `max(sent_at)` on `public.deliveries` recent?" — does not
work, and the reason is worth writing down so nobody re-derives it: a healthy
dispatcher legitimately writes **no rows at all** on a quiet cycle, and pairing
it with "is there a pending event waiting?" does not rescue it either.
`dispatchOneEvent` returns early without writing any delivery when an event has
no eligible devices (`allDeviceIds.length === 0` in
[`notification-router.ts`](../packages/core/src/notification-router.ts)), and
the governor can likewise suppress every send — so a perfectly-processed event
stays indistinguishable from an unprocessed one, and the check would alarm
forever on an event nobody was ever going to receive.

So have the dispatcher say so itself: on each run, after the pass completes,
write one row to a small `dispatch_runs` table (`ran_at`, plus the counters the
route already computes — events considered, sent, skipped, failed). The
watchdog then asks one unambiguous question — *is `max(ran_at)` older than a
few dispatch intervals?* — which is true only if the cron genuinely stopped,
regardless of how quiet the queue is. The counters make the same row useful for
"running but failing everything", which the freshness check alone would miss.

Note for whoever implements it: `public.deliveries` records its timestamp as
**`sent_at`**, not `created_at`
([`20260911000000_notifications_events.sql`](../supabase/migrations/20260911000000_notifications_events.sql)) —
worth knowing when wiring the counters, and a reason the naive query above
would have failed outright rather than merely misfired.

**No new secret is required** — `watchdog.yml` already has `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` for the knowledge check. Run it on the **hourly**
`:05` trigger, not the daily one: a 15-minute job that has been dead for 23
hours is not an acceptable detection window for the product's headline feature.

**Cost:** zero new spend and no new secret. Scope is slightly larger than a
watchdog step alone — one small migration (`dispatch_runs`), a few lines at the
end of the dispatch route to write the heartbeat row, and the watchdog step
itself — but all three are deterministic, and it is the cheapest honest signal
available: every inference-based alternative was tried above and each one
either false-alarms or fails silently.

<a id="rec-2"></a>
### REC-2 — Finish or abandon the Vault Run consolidation; the half-done state has a real correctness cost

**Finding.** The Vault Run orchestrator has been running daily since 07-30
**in addition to** the six standalone lane routines it was built to replace.
`vault-run-plan.md` documents this honestly, and the consequence is concrete
and still live: **Rumor Desk content now lands every day, from two independent
schedulers.** Neither runs twice in a day — the standalone cron is
`47 14 */2 * *`, which is a **day-of-month** expression (odd days: 1, 3, 5 …
31), and the orchestrator's lane 4 is due on even days, so between them the
lane is covered every day of the month instead of every other day as designed.
The month boundary is worse, not better: a 31-day month ends on an odd day and
the next month starts on one, so the standalone routine runs **two days
running** across 31 → 1 (e.g. Aug 31 → Sep 1) while the Vault lane covers the
even days on either side. This is the highest privacy-liability lane in the
system, and it auto-merges with no human read. Confirmed on `main` this week:
standalone `content(rumor-desk):` commits on 08-25, 08-29 and 08-31, and
`lane(rumor-desk)` commits inside `vault:` PRs on even days. **Nobody designed
a daily cadence for this lane.** It is an artifact of Phase 4 not landing, and
it roughly doubles the lane's throughput against a cadence that was
deliberately set to every-other-day.

Everything Phase 4 was blocked on in August has since cleared: Phase 3.5 is on
`main` (the stuck-red-PR check and the `check_lane` liveness helper are both
live in `watchdog.yml`), and the migration's own prescribed follow-up — deleting
the `content-shift/` lane row — was already executed on 2026-08-24. The two
remaining preconditions are *observations*, not code: confirm lane 2 ships, and
read each trigger's live config back before writing.

**Recommendation.** Execute Phase 4 **one lane at a time, starting with Rumor
Desk**, because that is the one where duplication is a liability question and
not just a cost question. For each lane: `get` the trigger, record the full
`job_config`, disable (do not delete — the triggers carry cadence history),
watch one full cycle, then move to the next. Honour the RemoteTrigger
full-replacement footgun documented in `runners.md` — a partial `job_config`
PUT silently destroys the prompt and returns 200.

**Value:** ends the two-scheduler daily coverage of a privacy-sensitive lane,
removes the cross-lane conflict bug class the consolidation was designed to
delete, and saves **~3.9 cold-boot Claude sessions/day** on average — three
daily lanes (Content Shift, Answerer, Photo Enrichment) plus Rumor Desk at
~0.52/day (odd days of month), Cross-Link at 2/week, and Stylist at 1/week.
Every step is reversible
(disable, don't delete — re-enabling is a two-minute operation), so this is an
agent call to execute, not a decision to route. Worth **telling** Joey that
Rumor Desk has been publishing daily rather than every other day, because it
is a content-cadence fact he'd want to know — but the fix does not wait on him.

<a id="rec-3"></a>
### REC-3 — Make the automation index self-checking (deterministic, zero tokens)

**Finding.** Seven documented references point at routines that do not exist
or cadences that are wrong (table above). The repo already solved this exact
class of problem once: the auto-merge allowlist used to be an inline copy that
fell three generated files behind and stranded content PRs for a week with a
green check — the fix was `npm run check:automerge-allowlist` in the required
`build` job. The same fix applies here.

**Recommendation.** Add `scripts/ops/check-automation-index.mjs` +
`npm run check:automation-index`, wired into the required `build` job, asserting:

1. Every `.github/workflows/*.yml` has exactly one row in this file.
2. Every `*.yml` filename referenced anywhere under `docs/` or
   `.github/workflows/` resolves to a real file **or** appears in an explicit
   `KNOWN_PROPOSED` list (so proposal docs can still name a future workflow).
3. Every cron string quoted in `agents/runners.md` or this file for a Tier-1
   workflow matches that workflow's actual `on.schedule`.

This would have caught `knowledge-engine.yml`, `merch-audit.yml`, and the
`appearance-discovery` cadence drift on the commit that introduced each.
Deliberately **not** an LLM routine: this is a string-matching job, and putting
a model on it would be exactly the anti-pattern `appearance-discovery.yml`'s
header argues against ("detection is a mechanical job, so it runs as dumb code
on a cheap schedule rather than burning a session's tokens").

**Cost:** a few seconds on every CI run; no tokens, no new secret.

<a id="rec-4"></a>
### REC-4 — Combine the three manually-confirmed merch evidence collectors into one

**Finding.** `merch-e5-evidence.yml`, `merch-awin-directory-shortlist.yml` and
`merch-awin-directory-recommendations.yml` are three near-identical files:
checkout → setup-node 24 → run one script → upload one artifact, gated on a
typed confirmation string. They differ only in the script path and the
confirmation word. Three files means three headers to keep honest, and two of
them are in the "effectively undocumented" bucket precisely because nothing
explains how they differ.

**Recommendation.** Collapse them into one `merch-evidence.yml` with a
`target` **choice** input mapped 1:1 to a fixed script allowlist — the exact
pattern [`db-seed.yml`](../.github/workflows/db-seed.yml) already uses for its
seven seed targets, including its "no interpolation, fixed allowlist" safety
property. Keep the typed confirmation. The safety posture is unchanged
(artifact-only, no writes, no auto-trigger); the surface to document drops from
three headers to one, and adding the *next* evidence collector becomes a
one-line allowlist entry instead of a fourth copy-pasted file.

**Deliberately excluded, and why each stays its own file:**

- `merch-matcher.yml` — despite looking similar, it is **not** an evidence
  collector: it has no typed confirmation, and its dispatch takes a
  caller-supplied `candidate_file` path to build a deterministic matcher
  handoff plan. A fixed target→script allowlist would either drop that input
  or misrepresent the workflow, so folding it in would change behaviour rather
  than just deduplicate boilerplate.
- `merch-audit-authoring.yml` and `merch-matcher-authoring.yml` — these spend
  money and call vision models. Their separateness is a deliberate rule
  (SPEC §8, R1), not incidental duplication.

<a id="rec-5"></a>
### REC-5 — Named retirement candidates (recommendations only, nothing retired here)

| Candidate | Why | Recommended action |
|---|---|---|
| `remove-x-site-screens.yml` | Self-described one-time, parameter-free cleanup for two specific posts. It is a permanently live dispatch button that **deletes real social posts** and whose purpose has passed. | Delete the workflow (reversible via git). Record in `decisions.md` whether it ran. |
| `tree-mail.yml`'s digest sweep job | Its mail send was retired 2026-08-23, its schedule was removed the same day, and its stated remaining purpose — keeping `founder-mailed` "current for any tooling that reads it" — does not hold: **nothing consumes that label** (verified repo-wide; the only references are the sweep's own helper `scripts/watchdog/build-founder-digest.mjs`, that helper's test, and the label bootstrapper that creates it). | Delete the `digest` job and the `founder-mailed` label; keep `tree-pr-mail`. Fix the contradicting header either way. |
| `Marjorie — 8 PM Evening Delta` routine | Email retired 2026-08-23 under the 1–2-email cap. It still burns a Claude session every day at 03:00 UTC to post a GitHub comment with no established reader. | Disable the trigger (reversible — it stays a warm spare) and let the next morning's brief carry the delta. Worth telling Joey it happened, since he set the email cap; not worth waiting on him. |
| `Lex depth` routine | Disabled warm spare since 2026-07-25, five weeks, with no thaw condition recorded. | Either write the one-line condition that would revive it into `runners.md`, or delete it. |
| `swift2 Getty purge — GitHub GC watch` routine | Created 2026-08-15 as a self-retiring one-shot for a completed purge; still listed as enabled at 2×/day with no prompt file and no retirement receipt. | Read the trigger; if the purge is complete, delete it and record the receipt. |
| `watchdog.yml`'s two expired confirmation steps | "Karen post-repair confirmation" and "news-worker rotation confirmation" are both labelled *"self-limiting, remove after 2026-08-22"* in the workflow and are still running daily, nine days late. Their own headers say removal is safe and that nothing else references their helper scripts. | Delete both steps and `scripts/watchdog/{karen-post-repair-check,news-worker-rotation-check}.mjs`. Reversible, agent call — the standing 9-day Karen check already covers the same question. |

None of these six is expensive. They are recommended for retirement because
**an undocumented live routine is a liability regardless of its cost** — it is
a thing that can fire, that nobody owns, and that the next auditor will have to
re-derive from scratch.

<a id="rec-6"></a>
### REC-6 — Two cadences that do not match their job

**`marjorie-inbox.yml` — every 30 minutes, 48 runs/day, to poll an inbox that
receives a founder reply on the order of once a week.** The latency this buys
is invisible: it is an email reply relay, not a paging path, and the brief it
feeds is assembled once daily at 12:00 UTC. This repo hit 90% of its included
Actions minutes on 2026-07-27 and treats minutes as a real constraint
everywhere else.
**Recommendation:** `*/30 11-20 * * *` (or hourly all day). Cuts ~60% of that
workflow's runs with no change to when a reply actually reaches Marjorie.

**`merch-verify.yml` — a full daily link-liveness + image sweep of the whole
product catalog.** Affiliate URLs and product images do not rot daily; the
catalog changes when a sync lands, not on a clock.
**Recommendation:** move to twice weekly **plus** a `paths` trigger on the
catalog and seed files it validates — the same "schedule + on-change" pattern
`merch-audit-detect.yml` and `backup-restore-drill.yml` already use, which
catches real changes *faster* than daily while running less often.

Deliberately **not** changed: `social-poster.yml` at `*/30` (it is the live
ship path, and its own dedupe ledger is built for that rate) and
`watchdog.yml`'s hourly smoke check (frequent uptime paging is the L1 ask in
`roadmap.md`).

<a id="rec-7"></a>
### REC-7 — Remaining gaps, in priority order

1. **Nothing verifies that what merged is what deployed.** `docs/deploy.md`
   names the canonical public URL, and `e2e.yml` + the hourly smoke check both
   test *the live site* — but no routine compares the deployed commit against
   `origin/main`. A merged-but-not-deployed state passes every check the repo
   has. Recommend a deterministic check (a build-stamp route or the Vercel
   deployments API) folded into the hourly watchdog step that already runs.
2. **`social/failed/` has no owner.** 25 dead posts, oldest 2026-07-21.
   `unowned-sweep.yml` lists them in a ledger issue — which is *reporting*, not
   ownership, and the ledger is itself the artifact `ops/unowned-queues.md`
   says nobody acts on. Recommend one rule, deterministic: retry once at next
   poster run, then close with a comment. A queue that only grows is a queue
   nobody reads.
3. **Notification *quality* has no judgment desk.** Every content surface has
   one — Karen for integrity, Nils for depth, Laura for accessibility — but the
   copy that actually reaches a user's lock screen has none, and `vision.md` is
   explicit that over-notifying is the failure mode that loses the user. The
   analytics to judge it now exist (`/api/notifications/metrics`, the
   `deliveries` table, the internal dashboard). Recommend a **weekly** slice on
   the existing desk pattern — read last week's sends and open rates, file
   tickets on categories that under-perform or over-fire. This is **new
   recurring token spend** and therefore a founder decision, not an agent one.
4. **Token/minute telemetry is a documented commitment that does not exist.**
   `agents/runners.md` § Rules states "the manager-hat telemetry reports
   tokens-per-account monthly so the split is measured, not assumed." No
   routine or workflow produces it. Every cost figure in this repo's docs is a
   point-in-time audit someone did by hand. Recommend a monthly **Action**
   (Tier 1, zero LLM) snapshotting Actions minutes, workflow run counts, and
   open-PR counts into `docs/audits/` — the same shape as
   `growth-snapshot.yml`.

### Explicitly not recommended

- **A "documentation truth" desk routine.** REC-3's deterministic check does
  the same job at zero token cost and fails the build instead of filing a
  ticket someone has to read.
- **Reducing the routine count as a goal.** The count is not the problem; six
  of the 64 are stale and two are duplicated. The rest each do one job the
  others do not.
- **A second uptime monitor.** `watchdog.yml`'s hourly prod smoke check is the
  uptime signal; `e2e.yml` is a deeper daily functional sweep. Adding a third
  would produce duplicate pages, which is the noise problem
  `tree-mail.yml`'s rewrite already fixed once.

---

## Adding a new routine — the checklist

1. **Which tier?** If it can be done deterministically, it goes on Actions.
   Put a routine on it only for the judgment half, and only on top of data an
   Action already produced.
2. **Add the row here** in the same PR (REC-3 will make this mechanical).
3. **Tier 1:** write a header that says *why it exists*, what incident caused
   it, and what was rejected. That is the house style and it is the reason this
   audit was possible at all.
4. **Tier 2:** a charter in `docs/agents/` **and** a prompt file in
   `docs/agents/runner-prompts/` **and** a row in `agents/runners.md`, in the
   PR that creates the trigger. Then run the
   [`routine-invariants.md`](agents/routine-invariants.md) checklist against it.
5. **New recurring spend is a founder decision**, not an agent one.
6. **Give it a retirement condition.** Every entry in this file's
   "effectively undocumented" list is a routine that outlived its reason
   because nobody wrote down what that reason was.
