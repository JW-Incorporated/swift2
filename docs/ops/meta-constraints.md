# Meta-constraints — standing measurement for the limits that bite

**Owner: Joey.** Implementation:
`scripts/marjorie/meta-constraints.mjs`. Surfaced as one line in section 2 of
the daily Founders' Brief.

## Why this exists

Every meta-constraint failure so far was found by accident, after it hurt.

| When | What | How we found out |
|---|---|---|
| 2026-07-27 | Crossed 90% of included GitHub Actions minutes | GitHub told us |
| 2026-07-30 | `build` red on `main`, every merge frozen for 24h (#1641) | Merges stopped. Still open, still never root-caused. |
| 2026-07-25 | ~208 cloud agent sessions/day, ~69% of them agents re-reading their own unchanged PRs | A one-off human audit |

The audit that cut agent spend ~85% was a one-off human effort. Nothing has
measured it since. **The next drift will be found the same way — by accident —
unless something measures it on a schedule.**

## Design constraints

A monitor that burns the budget it monitors is self-defeating. So:

- **Zero LLM tokens.** It is a script.
- **Zero new GitHub Actions workflows.** Adding one would consume the very
  minutes being measured. It runs in-process during the brief assembly, a
  cloud session that was happening anyway.
- **Zero ledger files.** GitHub already stores the daily history. A ledger
  would only add something that can drift out of sync — the exact failure mode
  `docs/agents/runners.md` documents for the runner registry.
- **~5 REST calls**, all cheap list endpoints.

## What is measured

### 1 · GitHub Actions minutes against the billing cycle

**The access question, answered — and the common assumption here is wrong.**

```
GET /orgs/{org}/settings/billing/actions
    → 410 Gone ("This endpoint has been moved") AND requires admin:org
GET /organizations/{org}/settings/billing/usage?year=&month=
    → 200 OK on the CURRENT token (scopes: gist, read:org, repo, workflow)
```

Verified 2026-08-11 against `JW-Incorporated`. The enhanced billing platform
endpoint returns **per-day, per-repo, per-SKU line items** — strictly more
detail than the old aggregate it replaced.

**No new scope is required for Actions minutes.** Earlier notes in this repo
saying billing needs `admin:org` were describing the retired endpoint.

Raw minutes are converted to *included-minute equivalents* with GitHub's
multipliers (Linux ×1, Windows ×2, macOS ×10) before comparison, because the
allowance is spent in multiplied minutes. Reporting raw minutes against a
multiplied allowance is how you believe you are at 53% while GitHub thinks
you are at 90%.

**Thresholds:** `warn` at 70% consumed or a projection ≥90%; `alarm` at 90%
consumed or a projection >100% **and** GitHub has actually charged something.

### ⚠ One thing Joey needs to settle

Two signals currently disagree, and the collector reports the disagreement
rather than picking the comfortable one:

| Signal | July 2026 | Reading |
|---|---|---|
| Billable minutes vs the published GitHub **Team** allowance (3,000/mo) | 4,445 min = **148%** | badly over |
| `netAmount` — what GitHub actually charged | **$0.00** | nothing over |

The org is on `team` with 2 seats and `swift2` is a **private** repo, so
Actions minutes are not free and the 3,000 figure should apply. Either the
org has a larger allowance than the published tier, or the API's
discount fields do not mean what they appear to.

**Ask: Joey opens org → Settings → Billing → Actions once and reads off the
real included-minutes figure.** That is a two-minute lookup, it needs no new
token scope, and it converts a "the numbers disagree" line into a hard
threshold. If the true allowance is not 3,000, change
`INCLUDED_MINUTES_BY_PLAN` in `scripts/marjorie/meta-constraints.mjs`.

Until then the collector grades this case as `warn`, not `alarm` — an alarm
that might be arithmetic and not reality trains people to ignore alarms.

### 2 · Agent run volume

**Stated limitation, not papered over:** the authoritative count of scheduled
cloud sessions lives in the Claude Code routine list, not in GitHub. Nothing
in this repo can see a session that produced no artifact — and the 07-25
audit's worst offenders were exactly that: 144 sessions/day whose entire
output was "still open, still green, re-arm in 1h".

What **is** measurable, and what would still have caught that drift:
**artifacts per runner per day against the cadence the registry claims.**

- `Lex depth` was documented as disabled while running 12×/day →
  `running-while-disabled`.
- A duplicate Kevin fleet ran 8×/day where 4 were intended → `over-cadence`.
- A runner that has gone dark → `silent`.

Expectations live in `scripts/marjorie/runner-cadence.json`, deliberately
separate from `docs/agents/runners.md` so the check can be updated without
editing a doc another agent owns.

**Access Joey could grant to close the gap properly:** a periodic export of
the live routine list (name, schedule, enabled, model) into the repo — even a
weekly paste into a JSON file. That single artifact would make the registry
checkable against reality instead of against itself, and it is the root cause
the 07-25 audit named: *"treat the LIVE list as truth, not this file."*

**Also uncheckable today, and fixable cheaply:** Answerer, Rumor Desk,
Stylist, Cross-Link builder and Photo Enrichment all open PRs against
`supabase/seed/**` with no branch prefix and no distinguishing label, so no
query can tell them apart. Giving each a branch prefix (they already have
prompt files) makes them observable for free.

### 3 · PR / issue throughput and backlog age

From lists the brief already fetches, so it costs nothing extra:

- PRs merged/day vs opened/day. A close ratio below 1.0 means the open-PR pile
  grows every week — the merge-latency condition that caused the self-armed
  check-in loops in the first place.
- Issues closed/day vs opened/day.
- Backlog age p50 / p90 over open issues.

### 4 · Which workflow is eating the minutes

The billing API breaks usage down by repo and SKU but not by workflow, and the
exact per-run figure (`/actions/runs/{id}/timing`) costs one request per
run — 1,058 requests for a week, which is precisely the kind of monitor that
pays for itself in the wrong direction.

So `attributeRunMinutes()` approximates from wall clock over one page of
recent runs, and is used **only to rank workflows, never to state a total**.
It under-counts parallel jobs and over-counts queue waits; the billing API
owns the total.

## What is deliberately not built

- **A dollar figure for agent token spend.** It is not in GitHub and this repo
  should not be inventing one.
- **A new alerting channel.** `watchdog.yml` already owns paging, with real
  email and self-closing per-condition issues. When a constraint needs to page
  rather than appear in a brief, it belongs in the watchdog, as a step in the
  job that already runs.
