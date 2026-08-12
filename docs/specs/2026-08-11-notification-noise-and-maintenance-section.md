# Spec: kill the vendor-email noise, route the surviving signal into the brief

**Date:** 2026-08-11 · **Author:** Claude (CTO session, Wyatt) · **Status:** repo-side change shipped in this PR; brief integration awaiting a founder-approved charter amendment + three tokens.

## TL;DR

The founder gets ~30 GitHub/Vercel/Supabase emails a day. Measured, the single
biggest contributor is `vercel[bot]` commenting on **100% of pull requests**, at
~14 PRs/day. This PR silences that at the repo level. The rest of the volume is
GitHub subscription behaviour that **can only be fixed in account settings** —
listed exactly in §4 so Wyatt can do it in one sitting.

Silencing is only half the job: three real signals were buried in the noise and
went unread. §5 specifies where they should arrive instead — a **maintenance
section at the top of the Founders' Brief**, fed by a deterministic collector
(shipped here as `scripts/ops/collect-maintenance.mjs`) rather than by an agent
reading dashboards.

---

## 1. The measurement

All figures taken 2026-08-11 against `JW-Incorporated/swift2` via the GitHub API.

| Source | Rate | Notes |
| --- | --- | --- |
| PRs opened | **14 / day** | 3-day window: 28 by `wjduvall-cmd`, 11 by `sffan15-sys`, 3 by `dependabot` |
| `vercel[bot]` PR comments | **1 per PR, 25/25 sampled** | one comment per PR, edited in place on later pushes |
| Merge notifications | ~1 per PR | every content PR auto-merges (`auto-merge-content.yml`) |
| Actions failure emails | **~1 / day** | 3 failures in 3 days — *not* a significant source, contrary to the initial hypothesis |

So the ~30/day decomposes as roughly **14 Vercel bot comments + 14 merge
notifications + ~1 CI failure + Dependabot**. Vercel is ~50% of the volume and
is the only piece fixable from inside the repo.

**Correction to the working assumption:** GitHub Actions run-failure email was
named as a dominant source. It is not — 3 failures in 3 days. Turning off
Actions email would save ~1 message/day and would cost real signal. Not
recommended; §5 routes those counts into the brief instead.

## 2. What this PR changes

### 2.1 `apps/web/vercel.json` — silence the bot

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "cd ../.. && npm ci",
  "github": { "silent": true }
}
```

`buildCommand` is still **deliberately absent** — Vercel must keep running
`npm run build`, which fires `prebuild`, which stamps the content vault's
generated-at timestamp. Nothing in this change touches the build path.

**The flag is deprecated, and that matters.** Vercel's current Git-configuration
reference lists `github.silent` under a **`## Legacy`** heading: *"The
`github.silent` property has been deprecated in favor of the new settings in the
dashboard."* It has not been removed, and Vercel's GitHub guide states: *"If you
had previously used the, now deprecated, `github.silent` property in your project
configuration, we'll automatically adjust the setting for you."* So the flag
still takes effect by migrating the dashboard toggle — but the **authoritative**
control is the dashboard (§4.1), and there is a standing bug report
(`vercel/vercel#7524`) of the flag not taking. Treat this file as the belt and
the dashboard toggle as the braces; verify per §7.

### 2.2 What is lost, and why it is safe

The bot comment carries the preview URL. Confirmed on live PR #1905 that the
preview URL survives silencing via **two independent paths**, neither of which is
a comment:

1. **The Vercel commit status.** `GET /repos/{repo}/commits/{sha}/status` returns
   `context: "Vercel"`, `state: "success"`, `target_url:
   https://vercel.com/wjduvall-cmds-projects/swift2-web/BXnfzEHpo8sQACYYtxwfb6NBTF2J`.
   Vercel documents commit statuses as a separate feature with its own settings
   from comments, so silencing comments does not touch it.
2. **The GitHub Deployments API**, which renders as the "Deployments" box in the
   PR UI: `GET /repos/{repo}/deployments?sha={sha}` → `environment: Preview`, and
   its status carries `environment_url:
   https://swift2-gy6xsdnk2-wjduvall-cmds-projects.vercel.app` — the direct
   preview link.

**Therefore: safe to ship.** One caveat — Vercel's Git settings also expose a
*"disable `deployment_status` events"* toggle. Turning that on would remove path
(2). **Do not turn it on.** The activity-log entries it produces are in-page
noise, not inbox noise, and they are what keeps the preview URL one click away.

### 2.3 Everything else repo-side was already clean

Audited all 12 workflows in `.github/workflows/`. **No repo workflow posts a
routine PR comment.** `auto-merge-content.yml` deliberately writes its verdict to
`$GITHUB_STEP_SUMMARY` instead of commenting — the right pattern, already in
place. There is nothing else to silence from inside the repo.

Explicitly **not touched**, as required:

- **`watchdog.yml`** — sends real SMTP alerts on purpose, via
  `scripts/watchdog/send-mail.py`. That channel exists precisely because
  `@`-mentions of bot identities never reached the founders (four consecutive
  "no Founders' Brief" alerts sat unread). Untouched.
- **`brief-mailer.yml`** — delivers the brief itself. Untouched.

Also left alone, with reasons: `codeql.yml` creates ~113 immediately-skipped runs
per 3 days, but skipped runs cost zero minutes and send zero email, and the
`vars.CODE_SCANNING_ENABLED` gate is designed to self-enable. `ci.yml`'s
`concurrency` block already cancels superseded PR runs.

## 3. What this PR does **not** do

It does not touch `scripts/marjorie/**` or
`docs/agents/runner-prompts/marjorie-brief.md` — another agent owns those. §6 is
written as a hand-off contract for that agent.

## 4. Account-settings items — Wyatt only

Repo-side work cannot reach any of these.

### 4.1 Vercel dashboard — the authoritative comment silencer *(highest value)*

Project → **Settings** → **Git** → under **Connected Git Repository**, turn off
the comment toggles (comments on pull requests, comments on commits). Do this for
**`swift2-web` and `foray-web`** — both are on this account. This is the
supported mechanism; §2.1's `vercel.json` flag is the fallback.
**Expected saving: ~14 emails/day.**
Do **not** touch the `deployment_status` events toggle (§2.2).

### 4.2 GitHub notification settings — the merge/subscription noise *(second highest)*

`github.com/settings/notifications`:

- **Uncheck "Automatically watch repositories"** and set `swift2` to
  *Participating and @mentions* rather than *All Activity*. The watchdog reaches
  him by SMTP, not by GitHub notification, so this costs no real alerting.
- Under **Actions**, uncheck email (or set *Only notify for failed workflows*).
  Saving is only ~1/day; optional.

**Expected saving: most of the remaining ~14 merge notifications/day.**

### 4.3 The root cause of the merge noise, for later

Every automated PR is authored by **`wjduvall-cmd`** (the agents use his PAT,
`SOCIAL_POSTER_PAT`), and GitHub auto-subscribes an author to their own PR. The
durable fix is for automation to open PRs as a **dedicated bot identity** rather
than as a founder account. That is a token/identity migration with blast radius
across `auto-merge-content.yml`, `social-poster.yml` and `growth-snapshot.yml` —
worth doing, out of scope here, and it needs Wyatt's decision before anyone
starts.

### 4.4 Tokens the brief integration needs (§5 is inert without these)

Add as **repo-level Actions secrets** (Settings → Secrets and variables →
Actions). Note the trap already documented in `watchdog.yml`: *Vercel environment
variables are NOT GitHub Actions secrets.*

| Secret | Where from | Scope needed |
| --- | --- | --- |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens | read-only; scope to the team |
| `VERCEL_TEAM_ID` | Vercel team settings | — |
| `SUPABASE_ACCESS_TOKEN` | supabase.com/dashboard/account/tokens | needs `database:read` + `projects:read` |
| `SUPABASE_PROJECT_REF` | the project ref in the dashboard URL | — |

Per the Marjorie charter, secrets are a **non-ratchetable / founders-merge**
class — a founder sets these, no agent does.

## 5. The maintenance section — what is queryable, and how

The founder's ask: a **punchline up top — is everything green or not** — replacing
the mail. Per source, honestly:

### 5.1 Vercel

| Signal | Queryable? | How |
| --- | --- | --- |
| Deployment failures (project, count, since when) | **Yes** | `GET https://api.vercel.com/v7/deployments?since={ms}&limit=100&teamId={id}` · `Authorization: Bearer $VERCEL_TOKEN` · filter `readyState === 'ERROR'`, group by `name`, split `target === 'production'` |
| On-demand / spend against plan | **Yes, with a caveat** | `GET https://api.vercel.com/v1/billing/charges?from={iso}&to={iso}&teamId={id}` — FOCUS v1.3, **streamed as JSONL**, 1-day granularity, max 1-year range. Gives `BilledCost` and `ListCost` per line |
| "% of included plan" | **Not directly** | No endpoint returns the plan's included allowance. The collector takes it as `VERCEL_INCLUDED_ALLOWANCE_USD` (a repo variable Wyatt sets once from the billing page); left unset, the field is `null` and the brief simply reports dollars |

`BilledCost > 0` is the exact signal behind the unread 2026-08-09 "Increased
On-Demand Usage" mail.

### 5.2 Supabase

| Signal | Queryable? | How |
| --- | --- | --- |
| Security advisories | **Yes — but it is an experimental endpoint** | `GET https://api.supabase.com/v1/projects/{ref}/advisors/security` · `Authorization: Bearer $SUPABASE_ACCESS_TOKEN` · OAuth scope `database:read`, FGA `advisors_read`. Returns `{lints:[{name,title,level:ERROR\|WARN\|INFO,categories,description,remediation}]}` |
| Project / service health | **Yes** | `GET https://api.supabase.com/v1/projects/{ref}/health?services=auth,db,pooler,realtime,rest,storage` · scope `projects:read`. Read `status` (`ACTIVE_HEALTHY` / `COMING_UP` / `UNHEALTHY`) — **not** the `healthy` boolean, which the spec marks deprecated |
| Database/storage usage against plan | **No** | No usage endpoint exists in the Management API (checked all 115 paths in `https://api.supabase.com/api/v1-json`). Dashboard only |

**Honesty flag:** the advisors path carries both an *experimental* notice and a
`deprecated: true` marker in Supabase's live OpenAPI spec, and **no replacement
path exists** in that spec. It is the only programmatic route to the advisory
class that went unread on 2026-08-04, so it is worth depending on — but it is the
most likely thing here to break, which is why the collector degrades it to `null`
rather than treating silence as green.

### 5.3 GitHub

| Signal | Queryable? | How |
| --- | --- | --- |
| Actions minutes + cost against the billing cycle | **Yes — and the known blocker is gone** | See below |
| Workflow failure counts | **Yes** | `GET /repos/{repo}/actions/runs?status=failure&per_page=100` |
| Dependabot alerts | **Yes** | `GET /repos/{repo}/dependabot/alerts?state=open&per_page=100` — currently returns 4 open (3 high, 1 medium) |
| Code-scanning alerts | **No** | `403: Code Security must be enabled for this repository`. Matches `codeql.yml`'s own note; needs a founder to enable Code Scanning + set `vars.CODE_SCANNING_ENABLED=true` |

**Correction to the brief's premise — this is the useful finding.** The
assumption was that Actions billing needs `admin:org`, which the current token
lacks. Verified live today:

- `GET /orgs/JW-Incorporated/settings/billing/actions` → **`410 Gone`**
  ("This endpoint has been moved"). That is the endpoint that needed `admin:org`.
- `GET /organizations/JW-Incorporated/settings/billing/usage?year=&month=` →
  **`200 OK` with the existing `repo` + `read:org` token.** No new scope, no
  founder action.

It returns per-day, per-repo, per-SKU rows:
`{product, sku, quantity, unitType, grossAmount, discountAmount, netAmount, repositoryName}`.
`netAmount > 0` means real money past the included allowance. Current state
(Aug 2026 to date): **1,399 min swift2 + 257 min foray, $11.76 gross, $0.00
net** — fully inside the allowance.

**So: no scope needs granting for GitHub.** The only GitHub gap is code scanning,
which is a feature toggle, not a token.

### 5.4 The verdict rules

Implemented in `rollUp()` in `scripts/ops/lib/maintenance.mjs`:

- **🔴 red** — any Supabase advisor at `ERROR`; any Supabase service not
  `ACTIVE_HEALTHY`; any failed **production** Vercel deploy; ≥3 failed previews
  for one project in 24h; any high/critical Dependabot alert open >7 days.
- **🟡 amber** — Supabase `WARN`s; 1–2 failed previews; any Vercel on-demand
  spend, or ≥80% of a configured allowance; Actions `netAmount > 0`; any workflow
  failure in 24h; any open Dependabot alert.
- **🟢 green** — none of the above **and every source answered**.

**A source that could not be reached can never produce green.** It is named in
`verdict.unknown` and forces amber, so a missing token surfaces as *"cannot
confirm"* rather than as a false all-clear. This is the same rule
`scripts/social/lib/growth.mjs` applies to follower deltas, and it is the
specific failure mode the unread Supabase advisory demonstrates.

## 6. Hand-off contract for the brief-v2 agent

Shipped here, ready to call — **nothing under `scripts/marjorie/**` was touched**:

| File | What it is |
| --- | --- |
| `scripts/ops/collect-maintenance.mjs` | The collector. Writes `ops/metrics/YYYY-MM-DD.json`. `--print` emits the rendered markdown to stdout instead |
| `scripts/ops/lib/maintenance.mjs` | Pure, I/O-free summarisers + `rollUp()` + `formatMaintenanceSection()` |
| `scripts/ops/lib/maintenance.test.ts` | 20 unit tests, all green |

`ops/metrics/` is the directory the operating model
(`docs/proposals/2026-07-11-agentic-operating-model.md` §4.2b) already reserves
for deterministic collectors, and the charter's *manager hat* section already
promises *"deterministic scripts writing `ops/metrics/` — Marjorie interprets
numbers she cannot edit."* This is that.

**To wire it in, mirroring the Growth-line precedent exactly:**

1. Add `.github/workflows/ops-maintenance.yml` on cron **`15 11 * * *`** — after
   `growth-snapshot` (11:05) and comfortably before the 12:00 UTC brief run, and
   off the `:00`/`:30` contention cluster that `watchdog.yml` documents. Commit
   the JSON via throwaway branch + auto-merge PR with `SOCIAL_POSTER_PAT`, the
   same as `growth-snapshot.yml`.
2. Add `fetchMaintenanceSnapshot(dir = OPS_METRICS_DIR)` and
   `formatMaintenanceLine(snapshot)` to `assemble-brief.mjs`; add the key to
   `fetchState()`; add it to the `emptyState` fixture in
   `assemble-brief.test.ts`.
3. In the runner prompt, use the **same wording as the Growth line**: *copy the
   pre-formatted maintenance lines as-is; do not re-derive them.* This is the
   2026-07-18 queue-incident lesson and it applies here with force — the whole
   point is that the numbers come from an API, not from an agent's impression of
   a dashboard.
4. Budget: the section is **1 line green, at most 4 lines red**. The brief's
   ≤75-line / ≤550-word cap is unchanged.

**Blocker to name explicitly:** the brief's five sections are fixed by the
Marjorie charter, and an agent may not edit the charter (invariant #5). Adding a
maintenance section is a **founder-approved charter amendment** — the
`## Amendment (YYYY-MM-DD, founder-approved): <Name>` pattern, continuing the
clause numbering. Until that lands, the collector still runs and the snapshot
still exists; it just is not rendered. The cheap interim: fold the one-line
punchline into the existing `⚙️ Systems` bullet of *Today in 30 seconds*, which
needs no amendment at all. **Recommended: do the interim now, amendment later.**

## 7. Acceptance criteria

1. `apps/web/vercel.json` has `github.silent: true` and still has **no**
   `buildCommand`. ✅ in this PR
2. On the next PR after merge: **no `vercel[bot]` comment**, and the `Vercel`
   commit status still present and linking the deployment. — *verify manually*
3. `GET /repos/{repo}/deployments?sha={head}` still returns an
   `environment_url`. — *verify manually*
4. `node scripts/ops/collect-maintenance.mjs --print` with **no** tokens set
   exits 0 and prints *"cannot confirm — no data from Vercel, Supabase,
   GitHub"*. ✅ verified
5. Same command with only `GH_TOKEN` set reports live workflow/Dependabot/billing
   numbers and names Vercel + Supabase as unchecked. ✅ verified
6. `npm run test` passes. ✅ 20/20
7. `watchdog.yml` and `brief-mailer.yml` are byte-identical to `main`. ✅

## 8. The three buried signals — disposition

Not acted on here, as instructed. Each needs an owner.

| Signal | Owner | Next step |
| --- | --- | --- |
| **Supabase, Aug 4 — "security vulnerabilities detected in your projects"** | **Wyatt** | Open the project's Advisors → Security tab and read the `ERROR`-level lints. The likely class, given this schema, is `rls_disabled_in_public` / `rls_enabled_no_policy` on Vault tables — which would be a **live data-exposure issue on a public-read app**, not a hygiene nit. Treat as urgent until proven otherwise. Once `SUPABASE_ACCESS_TOKEN` exists (§4.4) this class can never go unread again. |
| **Vercel, Aug 9 — "Increased On-Demand Usage"** | **Wyatt** (cost) | Vercel dashboard → Usage, identify which resource crossed. Worth correlating with the `<Analytics />` mount added in PR #1607 and with `foray-web`'s repeated rebuilds. Then set `VERCEL_INCLUDED_ALLOWANCE_USD` so §5.1 can report a percentage rather than a bare dollar figure. |
| **`foray-web` preview deployments failing (5+ on Aug 4, 5+ on Aug 9)** | **Wyatt**, but **not in this repo** | ⚠️ **`foray` is a different repository** on the same org — confirmed independently: it appears in this org's Actions billing (257 min in Aug, and the only consumer of macOS minutes). Nothing in this PR can fix it and nothing in it should try. Two consequences worth knowing: it burns shared org Actions minutes, and its `vercel[bot]` comments are a *second* stream into the same inbox — so §4.1's dashboard toggle should be applied to `foray-web` too. |

## 9. Files affected

- `apps/web/vercel.json` — modified (silence flag; `buildCommand` still absent)
- `scripts/ops/collect-maintenance.mjs` — new
- `scripts/ops/lib/maintenance.mjs` — new
- `scripts/ops/lib/maintenance.test.ts` — new
- `docs/specs/2026-08-11-notification-noise-and-maintenance-section.md` — this file

Not modified: `.github/workflows/**` (all 12), `scripts/marjorie/**`,
`docs/agents/**`.

## 10. Draft decision-log entry (copy to `docs/decisions.md` on approval)

> **2026-08-11 — Vendor notification email is silenced at the source; surviving
> signal goes to the brief, not the inbox.** Measured 14 PRs/day each carrying
> exactly one `vercel[bot]` comment — ~50% of the founder's ~30 vendor emails/day.
> `github.silent` is set in `apps/web/vercel.json` (deprecated but still honoured;
> the authoritative control is the Vercel dashboard toggle, which is a founder
> action). Verified that the preview URL survives via the Vercel commit status
> and the GitHub Deployments API's `environment_url`, so nothing is lost.
> Actions-failure email was hypothesised as a major source and measured at
> ~1/day — **not** silenced, because that is real signal. The remaining volume is
> GitHub author-subscription behaviour, fixable only in account settings; the
> durable fix is for automation to open PRs as a bot identity instead of
> `wjduvall-cmd`, which is deferred. Three signals had been buried and unread
> (Supabase security advisory, Vercel on-demand spend, `foray-web` preview
> failures), so silencing alone was rejected as insufficient: a deterministic
> collector (`scripts/ops/collect-maintenance.mjs` → `ops/metrics/`) now produces
> a green/amber/red verdict for the brief's maintenance section. **A source that
> cannot be reached never reports green** — it reports "cannot confirm". Also
> established: the `admin:org` blocker on Actions billing no longer exists —
> `/orgs/{org}/settings/billing/actions` is `410 Gone` and its replacement,
> `/organizations/{org}/settings/billing/usage`, reads fine with the existing
> `repo` + `read:org` token.
