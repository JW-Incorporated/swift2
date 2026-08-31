# AUTOMATION.md — everything that runs by itself

**Read this first for anything scheduled.** The index of every automated
routine keeping longlivets.com running: *what runs, when, why, and where its
real documentation lives*. It duplicates none of that documentation and
overrides none of it — [`CLAUDE.md`](../CLAUDE.md) is the authoritative
operating manual, and where two docs conflict this file says so rather than
picking a winner.

- Owner: the repo (any desk may propose changes by PR).
- Last full audit: **2026-08-31**, written up in two companion files so this
  index stays a reference rather than a report:
  [`doc-quality`](automation/doc-quality-2026-08-31.md) (per-routine
  documentation quality + every doc reference pointing at a routine or cadence
  that no longer exists) and [`review`](automation/review-2026-08-31.md)
  (overlaps, retirement candidates, gaps, seven recommendations).
- **Fires on its own: 54 routines** — 27 GitHub Actions workflows (cron, PR,
  push, or issue triggered), 24 Claude desk routine triggers, the product's
  Vercel Cron job, 2 Dependabot update schedules. These run whether or not
  anyone is watching.
- **Manual-only: 10 workflows**, `workflow_dispatch` and nothing else, badged
  **MANUAL** below. They never fire by themselves and are **not** counted as
  scheduled routines; most sit behind a typed confirmation because they spend
  money, call a vision model, or delete something live. Indexed anyway,
  because what *can* run matters when auditing blast radius.
- Counting unit is *one independently-triggered thing*, not one file: the 37
  workflow files split 27 automatic / 10 manual, `.github/dependabot.yml`
  contributes two (separate `updates:` entries, own cadences), and
  `watchdog.yml`'s two crons are one workflow. On the desk-routine side,
  [`agents/runners.md`](agents/runners.md)'s "23 total, 22 enabled" counts the
  **standing fleet** and excludes `swift2 Getty purge`, a self-retiring
  one-shot; this file counts every live trigger, hence 24 (23 enabled — Lex
  depth is paused). Two scopes, same reality.

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
| **3 — Product runtime** | Cron built into the deployed product, not into CI. Today: exactly one, the notifications dispatcher. | Vercel Cron | Vercel plan | Silently, and **currently unwatched** — see [REC-1](automation/review-2026-08-31.md#rec-1) |

**Why Tier 1 exists even where Tier 2 could do the job:** Karen (the content
integrity engine) went dark for 10+ days in August 2026 and nobody noticed — a
Claude routine leaves no trace here when it doesn't run. Karen's deterministic
half became `cie-scan.yml` for that reason. Put the *freshness* half on
Actions, the *judgment* half on a routine.

**Kill switch:** [`agents/README.md` § The kill switch](agents/README.md#the-kill-switch--pausing-the-org-gap-analysis-g10).
Instant per-tier stops: repo variable `SOCIAL_FREEZE` halts all posting;
`CONTENT_AUTOMERGE_FREEZE` halts all content auto-merge.

> **Account note.** The live fleet runs on Joey's account (verified
> 2026-08-27), and Joey's 2026-08-31 decision (D1=B) confirms that as the
> permanent, intended policy — the prior stated policy naming Wyatt's account
> was the stale half of the gap and has been corrected. See
> [`agents/runners.md` § Which account the routines actually run on](agents/runners.md#which-account-the-routines-actually-run-on--current-policy).
> Trigger IDs in the registry resolve against the live account.

---

## Tier 1 — GitHub Actions (27 automatic + 10 manual)

Cadences are UTC. "LLM" = does this workflow itself call a model. Minute
offsets are deliberately non-`:00`/`:30` — see `watchdog.yml`'s header on this
repo's scheduling contention. **MANUAL** = `workflow_dispatch`-only; section
counts are `automatic + manual`.

### Gates and merge machinery (3)

| Workflow | Trigger | LLM | Mutates | Reviewed by | Docs |
|---|---|---|---|---|---|
| [`ci.yml`](../.github/workflows/ci.yml) | every PR + push to `main` | no | nothing | it *is* the gate | header (cost model); the required check is `build` |
| [`codeql.yml`](../.github/workflows/codeql.yml) | PR, push `main`, Mon 12:27 | no | security alerts | Paul Blart | [`agents/paul-blart.md`](agents/paul-blart.md) |
| [`auto-merge-content.yml`](../.github/workflows/auto-merge-content.yml) | PR events | no | enables auto-merge on allowlisted PRs | path allowlist + branch/author gate | header + [`.github/content-automerge-allowlist.txt`](../.github/content-automerge-allowlist.txt) |

`auto-merge-content.yml` is the single most load-bearing workflow here: it is
why desk routines can open a PR and exit instead of babysitting it (which was
~69% of all agent token spend before 2026-07-25).

### Watchdogs and freshness (5)

| Workflow | Trigger | LLM | Mutates | Docs |
|---|---|---|---|---|
| [`watchdog.yml`](../.github/workflows/watchdog.yml) | daily 14:35 + **hourly :05** | no | opens/closes `watchdog-alert` issues, emails founders, can re-trigger `brief-mailer` | header (very thorough) |
| [`e2e.yml`](../.github/workflows/e2e.yml) | daily 13:05 + dispatch | no | nothing (Playwright against live prod) | header |
| [`a11y.yml`](../.github/workflows/a11y.yml) | daily 16:10 | no | nothing (axe/pa11y artifacts, non-blocking) | [`agents/laura.md`](agents/laura.md) |
| [`unowned-sweep.yml`](../.github/workflows/unowned-sweep.yml) | issue events + daily 15:20 | no | applies `needs-triage`, refreshes one ledger issue | [`ops/unowned-queues.md`](ops/unowned-queues.md) |
| [`backup-restore-drill.yml`](../.github/workflows/backup-restore-drill.yml) | monthly 1st 06:20 + PR touching `supabase/migrations/**` | no | nothing (scratch DBs only, no prod access) | [`backup-restore.md`](backup-restore.md) |

`watchdog.yml` is not one check but **fifteen steps**, and it is the only
thing watching Tier 2. In file order: brief exists → brief was mailed → alert
founders → brief recovered → degraded answer propagation → **hourly prod smoke
check** → scheduled-workflow cadence view → PRs stuck on failing/missing
checks → Karen CIE ticket-filing freshness (`STALE_DAYS=9`) → work-ownership →
Karen post-repair confirmation → news-worker rotation confirmation →
content-lane liveness (`vault/`, 36h) → Facebook export freshness →
knowledge-engine freshness. Those two confirmations are expired scaffolding
still firing daily — see [the review](automation/review-2026-08-31.md#rec-5).

### Founder communications (3)

| Workflow | Trigger | LLM | Mutates | Docs |
|---|---|---|---|---|
| [`brief-mailer.yml`](../.github/workflows/brief-mailer.yml) | daily 12:45 | no | sends the Founders' Brief email | [`agents/marjorie.md`](agents/marjorie.md) § Delivery |
| [`marjorie-inbox.yml`](../.github/workflows/marjorie-inbox.yml) | **every 30 min** | no | posts founder email replies as issue/PR comments | header (DKIM + idempotency rules) |
| [`tree-mail.yml`](../.github/workflows/tree-mail.yml) | PR opened + dispatch | no | emails Tree's weekly plan; digest job applies `founder-mailed` | header — **but see [REC-5](automation/review-2026-08-31.md#rec-5), the header is stale** |

Standing constraint (Joey, 2026-08-23): **at most 1–2 founder-facing report
emails total** — the morning brief and Tree's weekly report. A new one must
displace one of those, not add a third.

### Content engine (3)

| Workflow | Trigger | LLM | Mutates | Judgment partner (Tier 2) |
|---|---|---|---|---|
| [`appearance-discovery.yml`](../.github/workflows/appearance-discovery.yml) | daily 13:40 **and 21:40** | no | files `intake` issues; stages templated `social/queue/*.json` drafts | Content Shift / Vault Run lane 1 |
| [`cie-scan.yml`](../.github/workflows/cie-scan.yml) | daily 09:09 | no | files/dedupes `cie` tickets, commits the dated report to `docs/audits/engine/` | Karen (judgment half) |
| [`news-worker.yml`](../.github/workflows/news-worker.yml) | every 4h (`10 1,5,9,13,17,21`) | optional (OpenAI classifier; rule-based fallback) | `news_*` tables, `news-digest` branch | News Triage routine |

These three are the clearest illustration of the two-tier model: each is the
deterministic detector for a desk that supplies the judgment.

### Social (2 automatic + 3 manual)

| Workflow | Trigger | LLM | Mutates | Docs |
|---|---|---|---|---|
| [`social-poster.yml`](../.github/workflows/social-poster.yml) | **every 30 min** | no | **posts live to X, Instagram, Facebook**; commits queue state | header (the `social-ledger` dedupe design) + [`agents/growth.md`](agents/growth.md) |
| [`growth-snapshot.yml`](../.github/workflows/growth-snapshot.yml) | daily 11:05 | no | commits `social/metrics/*.json` for the brief's Growth bullet | header |
| [`social-audit.yml`](../.github/workflows/social-audit.yml) | **MANUAL** | no | opens/refreshes one "IG media audit" issue (recommends, cannot delete) | header |
| [`social-delete-media.yml`](../.github/workflows/social-delete-media.yml) | **MANUAL** | no | **deletes live IG/FB posts** | header — ⚠️ agents are forbidden to run this |
| [`remove-x-site-screens.yml`](../.github/workflows/remove-x-site-screens.yml) | **MANUAL** | no | deletes two specific X posts | header — one-time cleanup, see [REC-5](automation/review-2026-08-31.md#rec-5) |

`social-poster.yml` is the only workflow that takes an irreversible public
action on a schedule. Its safety model is the `social-ledger` branch (dedupe
correctness does not depend on any PR merging) plus `SOCIAL_FREEZE`.

### Merch autonomy engine (7 automatic + 6 manual)

Spec: [`SPEC.merch-autonomy.md`](SPEC.merch-autonomy.md) · plan:
[`PLAN.merch-autonomy.md`](PLAN.merch-autonomy.md) · receipt:
[`ops/MERCH-PHASE-4-ACCEPTANCE.md`](ops/MERCH-PHASE-4-ACCEPTANCE.md). Every
scheduled merch lane is zero-LLM by design (R1); lanes that spend money or
call a model are separate **manually confirmed** workflows.

| Workflow | Engine | Trigger | LLM / spend | Mutates |
|---|---|---|---|---|
| [`merch-awin-sync.yml`](../.github/workflows/merch-awin-sync.yml) | E0 | daily 07:53 | no | gated PR (advertiser map) + Actions cache |
| [`merch-verify.yml`](../.github/workflows/merch-verify.yml) | E1/E2 detect | daily 09:46 | no | artifacts only |
| [`merch-fanmade.yml`](../.github/workflows/merch-fanmade.yml) | E5 | daily 09:47 | no | files candidate issues |
| [`merch-official-sync.yml`](../.github/workflows/merch-official-sync.yml) | E4 | 08:17 + 20:17 | no | gated PR: catalog + store-drop `social/queue` pair |
| [`merch-audit-detect.yml`](../.github/workflows/merch-audit-detect.yml) | E3 detect | Mon 15:24 + push to content paths | no | scoring-queue artifact |
| [`merch-audit-authoring.yml`](../.github/workflows/merch-audit-authoring.yml) | E3 author | **MANUAL** + typed `RUN_AUTHORED_VISION_AUDIT` | **vision model, $5/run cap** | artifacts + issues |
| [`merch-matcher.yml`](../.github/workflows/merch-matcher.yml) | E6 detect | **MANUAL** | no | deterministic handoff plan |
| [`merch-matcher-authoring.yml`](../.github/workflows/merch-matcher-authoring.yml) | E6 author | **MANUAL** + typed `RUN_MATCHER_AUTHORING` | **vision + paid search, per-run cap** | artifacts only |
| [`merch-revenue.yml`](../.github/workflows/merch-revenue.yml) | reporting | Mon 15:23 | no | gated PR (`docs/ops/MERCH-REVENUE.json`) |
| [`merch-terms-recheck.yml`](../.github/workflows/merch-terms-recheck.yml) | compliance | quarterly, 1st of Jan/Apr/Jul/Oct 15:17 | no | one review ticket per quarter |
| [`merch-e5-evidence.yml`](../.github/workflows/merch-e5-evidence.yml) | E5 evidence | **MANUAL** + typed `COLLECT_E5_EVIDENCE` | no (Etsy API) | artifacts only |
| [`merch-awin-directory-shortlist.yml`](../.github/workflows/merch-awin-directory-shortlist.yml) | E0 join | **MANUAL** + typed confirmation | no | artifacts only |
| [`merch-awin-directory-recommendations.yml`](../.github/workflows/merch-awin-directory-recommendations.yml) | E0 join | **MANUAL** + typed confirmation | no | artifacts only |

### Database operations (2 automatic + 1 manual)

| Workflow | Trigger | Mutates production |
|---|---|---|
| [`db-migrate.yml`](../.github/workflows/db-migrate.yml) | dispatch + push to `main` touching `supabase/migrations/**` | **yes** — applies migrations, then re-runs to prove idempotency |
| [`db-seed.yml`](../.github/workflows/db-seed.yml) | **MANUAL** — `target` from a fixed allowlist | **yes** — operator-triggered seeds |
| [`db-connectivity-check.yml`](../.github/workflows/db-connectivity-check.yml) | dispatch + PR touching itself | no — `SELECT 1` |

### Security and standing reminders (2)

| Workflow | Trigger | Docs |
|---|---|---|
| [`dependabot-alerts-snapshot.yml`](../.github/workflows/dependabot-alerts-snapshot.yml) | Mon 21:00 (one hour before Paul Blart's patrol) | header — exists because the routine's own token 403s on the alerts API |
| [`fb-export-reminder.yml`](../.github/workflows/fb-export-reminder.yml) | Sun 16:00 | header — Facebook has no API for non-administered groups, so this stays a human task |

### Dependabot update schedules (2) — config, not workflows

`updates:` entries scheduled by GitHub itself, counted apart from the 37
workflow files.

| Schedule | Cadence | Docs |
|---|---|---|
| [`.github/dependabot.yml`](../.github/dependabot.yml) → **npm** | weekly Mon 05:00 America/Los_Angeles | [`agents/paul-blart.md`](agents/paul-blart.md) — grouped dev + production patch/minor bumps, max 5 open PRs; security updates ride their own immediate lane |
| [`.github/dependabot.yml`](../.github/dependabot.yml) → **github-actions** | weekly Mon (no explicit time) | [`agents/paul-blart.md`](agents/paul-blart.md) — one grouped PR for all Action version bumps |

---

## Tier 2 — Claude desk routines (24 triggers, 23 enabled)

Cost/benefit optimization analysis (2026-08-31, Fable):
**[`TIER2-OPTIMIZATION.md`](TIER2-OPTIMIZATION.md)** — per-routine assessment
of all 24 triggers with 19 ranked recommendations (T-1…T-19), split into
pre-approved-reversible agent actions and founder-gated spend decisions.

Cadence registry and live trigger IDs: **[`agents/runners.md`](agents/runners.md)**
— that table supersedes any trigger ID quoted elsewhere. Prompts live in
[`agents/runner-prompts/`](agents/runner-prompts/); **the repo file is the
source of truth**, and a trigger whose inline prompt drifts from it is a bug.
Fleet invariants: [`agents/routine-invariants.md`](agents/routine-invariants.md).

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
| News Triage | daily 15:40 | Opus 4.8 (T-3 trial: Sonnet 5, pending account access — `docs/agents/runners.md` § News Triage) | *none* | [`news-triage.md`](agents/runner-prompts/news-triage.md) |
| Lex depth | **disabled** (warm spare) | Opus 4.8 | *none* | [`lex-depth.md`](agents/runner-prompts/lex-depth.md) |

⚠️ **The six standalone lanes above run *in addition to* the Vault Run built
to replace them** — Phase 4 never landed, so Rumor Desk content lands daily
(standalone on odd days of the month, Vault lane on even) rather than on its
designed every-other-day cadence. See
[REC-2](automation/review-2026-08-31.md#rec-2).

### Quality and integrity desks

| Routine | Cadence (UTC) | Model | Charter | Reads what Tier 1 produced |
|---|---|---|---|---|
| Karen — scan (registered name; weekly judgment slice) | Sun 09:00 | Sonnet 5 | [`scripts/content-engine/README.md`](../scripts/content-engine/README.md) | `cie-scan.yml`'s findings |
| Nils — site walk | Mon+Fri 14:00 | Opus 4.8 | [`agents/nils.md`](agents/nils.md) | live site |
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
| Austin — build runs | daily 21:00 | Opus 4.8 (2-week trial 2026-08-31→2026-09-14; was Fable 5) | [`agents/austin.md`](agents/austin.md) |

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
| Karen Deep — agent review | ⚠️ **APPROVED (D3=A, 2026-08-31), NOT CREATED** — spend question resolved; only the account-access mechanic remains | [`agents/runners.md`](agents/runners.md) § "Karen Deep — trigger config to create" + [`karen-deep-review.md`](agents/runner-prompts/karen-deep-review.md) |
| Notification quality — weekly desk | ⚠️ **APPROVED (D6=A, 2026-08-31), NOT CREATED** — sequence after REC-1's dispatch heartbeat lands ([REC-1](automation/review-2026-08-31.md#rec-1) not yet landed) | [`agents/runners.md`](agents/runners.md) § "Notification-quality desk — trigger config to create" + [`agents/notification-quality.md`](agents/notification-quality.md) + [`notification-quality-run.md`](agents/runner-prompts/notification-quality-run.md) |

---

## Tier 3 — Product runtime cron (1)

| Job | Where | Cadence | What it does |
|---|---|---|---|
| `/api/notifications/dispatch` | [`apps/web/vercel.json`](../apps/web/vercel.json) `crons` | **every 15 min** | fan-out + governor + digest merge + cooldown pass + FCM/web-push send + delivery logging. Entry point: [`apps/web/app/api/notifications/dispatch/route.ts`](../apps/web/app/api/notifications/dispatch/route.ts) |

Specs: [`NOTIFICATIONS_SPEC.md`](../NOTIFICATIONS_SPEC.md) §10 ·
[`NOTIFICATIONS_PLAN.md`](../NOTIFICATIONS_PLAN.md) · setup:
[`SETUP_NOTIFICATIONS.md`](../SETUP_NOTIFICATIONS.md). The only routine that
**delivers to a user's own device** on every run, and per
[`vision.md`](vision.md) notifications are the product's stated differentiator.
It has **no watchdog** — top recommendation of the 2026-08-31 review
([REC-1](automation/review-2026-08-31.md#rec-1)).

---

## Adding a new routine — the checklist

1. **Which tier?** If it can be done deterministically it goes on Actions; put
   a routine on it only for the judgment half, on top of data an Action
   already produced.
2. **Add the row here** in the same PR.
3. **Tier 1:** write a header saying *why it exists*, what incident caused it,
   and what was rejected — that house style is why this audit was possible.
4. **Tier 2:** a charter in `docs/agents/`, a prompt file in
   `docs/agents/runner-prompts/`, and a row in `agents/runners.md`, in the PR
   that creates the trigger. Then run the
   [`routine-invariants.md`](agents/routine-invariants.md) checklist on it.
5. **New recurring spend is a founder decision**, not an agent one.
6. **Give it a retirement condition** — every undocumented routine the audit
   found outlived its reason because nobody wrote it down.
