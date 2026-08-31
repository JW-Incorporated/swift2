# Runner registry — who runs where, on whose tokens

> **Index:** [`../AUTOMATION.md`](../AUTOMATION.md) is the one-page view of
> every automated routine in the project, including the GitHub Actions this
> file does not cover. This file remains the authoritative **cadence and
> trigger-ID registry** for the Claude desk routines.

## Which account the routines actually run on — current policy

**Resolved 2026-08-31 (Joey, D1=B, in response to the 2026-08-31 automation
audit — PR #3593):** the automated routine fleet correctly runs on **Joey's**
account. Do not migrate it to Wyatt's account; the lines below that used to
state a conflicting "Wyatt's account" policy were the stale half of this gap
and are corrected to match the live, verified state.

**Current state (this file's own audits, 2026-08-23 and 2026-08-27):** the
fleet was recreated on **Joey's** account after issue #2258 (the prior
account's routines were lost), and a live read of the routines API on
2026-08-27 found "All 24 triggers verified live … Nothing remains on the other
founder's account." Every trigger ID in the table below was fetched from
Joey's account.

**Requirement (Joey, corrected 2026-08-31 — supersedes the 2026-07-12 form
below): ALL scheduled agent spend runs on Joey's account.** The founder split
of labor: **Joey = vision, monitoring, and site QA** (10× Wyatt's testing
bandwidth), feeding the org through zero-token paths — the intake form,
experience reports, brief checkboxes; **Joey's account = every runner.**
Every scheduled runner is registered here with its owner; the prompt each
runner executes is versioned in `runner-prompts/` — **the repo file is the
source of truth**, and a trigger whose inline prompt drifts from its file is
a bug.

**Historical note — 2026-07-12 original requirement (superseded 2026-08-31):**
the original policy said all scheduled agent spend ran on **Wyatt's**
account, to keep Joey's weekly limit free, with the standing operational
assumption (Joey, 2026-07-11) that we had effective command-line access to
Wyatt's machine via Joey→Wyatt chat. The fleet was consolidated onto Joey's
account ~2026-08-23 after issue #2258 (the prior account's routines were
lost) and verified live 2026-08-27; Joey's 2026-08-31 decision (D1=B) makes
that the permanent, intended policy rather than a temporary gap.

**SUPERSEDED 2026-08-27, confirmed policy 2026-08-31** — the entire fleet (24
triggers) was consolidated to Joey's account ~2026-08-23 and verified live
2026-08-27; every scheduled runner today runs on Joey's account, and that is
now the stated policy, not just the observed state. See the "Live trigger
IDs" table below for the current, live configuration.

## Live trigger IDs (verified 2026-08-23, post-migration #2258)

**This table supersedes every trigger ID quoted elsewhere in this file.**
Everything below it is the historical record of how the fleet got here — real,
but describing IDs from before the routine migration (issue #2258, all 23
routines recreated after the prior account's routines were lost). Read via
`RemoteTrigger action:list` (confirmed broken cursor pagination — it repeats
page 1 forever, so the API alone under-counts) cross-checked against the
`claude.ai/code/routines` UI, which is authoritative. All UTC. Model column
is from a live `get` where fetched this pass; elsewhere see the Model
tiering table below (not re-verified per-trigger this pass — flag if it
drifts).

| Routine | Trigger ID | Cadence (UTC) | Enabled | Model |
|---|---|---|---|---|
| Photo Enrichment worker | `trig_01Vcz4iSM9NoUmt7CZ7pkHaB` | `21 6 * * *` | ✅ | `claude-sonnet-5` |
| News Triage — news_story to intake issues | `trig_019NuR7EpN7TA28yfmzKPAC7` | `40 15 * * *` | ✅ | `claude-opus-4-8` — **T-3 trigger update pending account access, see § News Triage below; not yet flipped by this PR** |
| Cross-Link builder | `trig_01FxMuDtwScPFvSgvhFCxdfP` | `51 9 * * 1,4` | ✅ | `claude-sonnet-5` |
| Stylist — shop-link sourcing & upkeep | `trig_011BiHZqLEVHAJ4chfaYfGZH` | `33 16 * * 0` | ✅ | `claude-sonnet-5` |
| Rumor Desk — sourcing & lifecycle | `trig_01GS6bcMsEQjXwmyxGr7S1js` | `47 14 */2 * *` | ✅ | `claude-opus-4-8` |
| Lex depth (sole instance) | `trig_01BoVCT67VbeLE8sRiaYPju4` | `20 */2 * * *` | ⛔ **disabled** (warm spare, intentional) | `claude-opus-4-8` |
| Answerer (sole instance) | `trig_016hygyYPEV9T7BunnTHAWbZ` | `50 13 * * *` | ✅ | `claude-opus-4-8` |
| Tree — weekly social plan | `trig_015YHCK6J3FwKLVn2oABUSic` | `0 10 * * 1` | ✅ | `claude-opus-5` |
| Growth — daily draft | `trig_01UBvxMi2Pz7x7qnsffLHAU3` | `0 11 * * *` | ✅ | `claude-opus-4-8` |
| Paul Blart — security patrol | `trig_01Px9HckABpWC4Bq1JQomfWT` | `20 22 * * 1` | ✅ | `claude-opus-4-8` |
| Laura — a11y walk | `trig_019aY4jhN6T9ZDAMve8YaRGw` | `20 18 * * 2,5` | ✅ | `claude-sonnet-5` |
| Austin — build runs | `trig_01FE8o9vscpHts7FwsVKGMZm` | `0 21 * * *` | ✅ | `claude-opus-4-8` — 2-week trial 2026-08-31→2026-09-14 (was `claude-fable-5`; Joey D5=A, `decisions.md`) |
| Nils — daily site walk | `trig_01WhgsVQFKMRGw2tfRg3i2rB` | `0 14 * * 1,5` | ✅ | `claude-opus-4-8` |
| Kevin — S3 comment radar (cloud) | `trig_01LaSLx4qzbsz68E6uRLkyDd` | `23 1,13 * * *` | ✅ | `claude-haiku-4-5-20251001` |
| Kevin — S3 eng triage (cloud) | `trig_01BRmPqZkLEcYKZhYPjypGMJ` | `43 15 * * *` | ✅ | `claude-sonnet-5` |
| Kevin — S2 user-feedback digest (cloud) | `trig_0136mXcpmzn6mYtYoUQC3eGP` | `13 15 * * *` | ✅ | `claude-sonnet-5` |
| Kevin — S1 Karen-ticket solver (cloud) | `trig_01QEvYmKcpyDJJ8ec81aBjCV` | `17 11 * * 0` | ✅ | `claude-opus-4-8` |
| Karen — nightly scan ⚠️ **RENAME PENDING (T-5, 2026-08-31)** — registered name not yet resynced to `Karen — weekly judgment slice`; prompt already judgment-only, see `runner-prompts/karen-nightly.md` and § T-5 below | `trig_01TmYaZgnecrEp9mkeV3Gq6X` | `0 9 * * 0` | ✅ | `claude-sonnet-5` |
| The Vault Run — all content lanes | `trig_01XKjJCfxyL2Bm24Ko4M4mWR` | `7 16 * * *` | ✅ | `claude-opus-4-8` |
| Content Shift — authoring runs | `trig_01PonDFeQCL4iRNzceGyAYrm` | `0 17 * * *` | ✅ | `claude-opus-4-8` |
| Marjorie — 6 AM Founders' Brief | `trig_018eDoH5pWRvwGMEg58aW4f3` | `0 12 * * *` | ✅ | `claude-opus-4-8` |
| Marjorie — 8 PM Evening Delta | `trig_01L2EG5veWBQwMowaykXAi6B` | `0 3 * * *` | ✅ (comment-only since 2026-08-23, not mailed — `docs/agents/marjorie.md` § Delivery) | `claude-fable-5` |
| Routine Auditor — fleet invariants | `trig_011p74968vLqMFeC8HzfCvAL` | `11 16 * * 0` | ✅ | `claude-haiku-4-5-20251001` |
| swift2 Getty purge — GitHub GC watch | `trig_018QuJozjMr1bYMPcqgKUmvL` | `0 3,15 * * *` | ✅ (self-retiring one-shot watchdog, not part of the standing fleet — created 2026-08-15, unrelated to #2258) | `claude-sonnet-5` |

**23 Swift2 routines total, 22 enabled** in the **standing fleet** (Lex depth
intentionally paused). The table above has 24 rows because it also carries
`swift2 Getty purge — GitHub GC watch`, a self-retiring one-shot deliberately
outside the fleet — which is why the 2026-08-27 audit note below says "all 24
triggers verified live" and why [`../AUTOMATION.md`](../AUTOMATION.md), which
counts every live trigger regardless of fleet membership, says 24/23. Both
scopes are correct; quote whichever one your question is about.
`bedrock nightly audit` also lives in this account's routine list but is a
different project (per `~/Projects/CLAUDE.md`'s ownership table) — excluded
here on purpose, not missed. **This table is live trigger IDs only** — Karen
Deep and the new Notification-quality desk are both approved-but-not-yet-
created (D3=A, D6=A), so neither has a row here; each is tracked in its own
"trigger config to create" section below with full config, consistent with
how Karen Deep has always been handled in this file.

### 2026-08-27 — Live fleet audit (Joey's account)

- All 24 triggers verified live via the routines API, fetched directly from Joey's account.
- Nothing remains on the other founder's account — fleet fully consolidated.
- Marjorie — 6 AM Founders' Brief ran successfully today, 2026-08-27 12:02 UTC.
- The list endpoint caps at 20/page and its cursor is broken (same page repeats) — consistent with the Routine Auditor's own prompt.
- The 4 triggers beyond page 1 (both Marjorie runs, Routine Auditor, Getty purge GC watch) were verified by direct per-trigger fetch instead.
- Table above updated to match: Photo Enrichment's trigger ID refreshed; Model column completed for every row.

## Token-burn audit + cost mode (2026-07-25, Wyatt — supersedes the sustainment table below)

An audit of the LIVE routine list (not this doc) found **97 routines** where
this registry described ~15, and **~208 cloud sessions/day**:

| Category | Runs/day | Share |
|---|---:|---:|
| `send_later` PR self-check-ins | ~144 | **~69%** |
| Swift2 scheduled runners | ~45 | ~22% |
| Foray routines (same account, left as-is by Wyatt) | ~19 | ~9% |

**The finding: ~7 in 10 cloud sessions were agents re-reading their own
unchanged PRs.** Eight concurrent hourly loops, one per open PR; PR #1527 ran
one from 18:11Z hourly, #1528 for 8+ hours, each a full cold-boot session whose
entire output was "still open, still green, re-arm in 1h". **Nothing in any
prompt file asked for this** — the agents self-armed it via the
`Claude_Code_Remote` meta MCP connector. The root cause was *merge latency*, not
missing monitoring: every open PR was green and clean, waiting on a human.

Fixes applied (see `docs/decisions.md` 2026-07-25 and PR #1539):

1. All 8 live check-in loops disabled; every prompt file and the inline trigger
   prompts for the Answerer and Content Shift now carry a **Run discipline**
   block — do the work, open the PR, exit.
2. `.github/workflows/auto-merge-content.yml` lands content-only PRs on green.
   **What counts as "content" is `.github/content-automerge-allowlist.txt`** —
   the workflow reads that file from `main` at run time; it is not written in
   the workflow. If a content PR is sitting open, read the workflow's job
   summary: it says `enabled` / `declined` / `held` / `frozen` and prints both
   the offending paths and the allowlist in effect (2026-08-11 — an inline copy
   of the list had fallen three generated files behind, stranding PRs while
   reporting success).
3. Social posts ship without per-item approval (`isDue` no longer checks
   `approvedBy`/`approvedAt`).

### Drift this audit exposed — treat the LIVE list as truth, not this file

- **A duplicate Kevin fleet.** Two full sets exist: the em-dash originals and a
  `(cloud)` set from the 2026-07-12 migration that was never deleted. ~8 runs/day
  where 4 were intended. Worse, **the sustainment throttle hit the wrong copy** —
  S1 was throttled to weekly on the `(cloud)` one while `Kevin — S1 Karen solver`
  kept running daily.
- **Lex was never actually paused.** This file said `enabled:false`; shards 1–19
  were paused but `Lex depth (sole instance)` was live every 2h — 12 runs/day
  this registry believed were zero. Now genuinely disabled
  (`trig_016VTco4fpekZbfs5kB8rNAz`).
- **Nine runners are unregistered here**: Answerer, Lex, Rumor Desk, Stylist,
  Cross-Link builder, Audio Curator, Mood Chat builder, Photo Enrichment worker,
  News Triage. Their prompts live ONLY inline in the trigger — there is no
  prompt file, so the "repo file is the source of truth" rule silently does not
  apply to them. That is the gap that let all of the above drift.
- **Every runner was on `claude-opus-4-8`**, including pure script-and-summarize
  jobs. This file's "Model: Fable" column was stale everywhere.

### Model tiering (2026-07-25)

| Tier | Runners | Rationale |
|---|---|---|
| **Haiku 4.5** | Kevin comment radar | Cheap poll / bucketing; the radar is already a lazy `gh` poll |
| **Sonnet 5** | Karen ✅, Stylist, Photo Enrichment, Audio Curator, Cross-Link, Mood Chat, Laura, Kevin S2/S3, News Triage (T-3 trial, pending account access — see § News Triage) | Deterministic script + summarize, or mechanical field-filling; News Triage is a bounded classify/redline-check/file job, not authoring |
| **Opus** | Content Shift, Answerer, Rumor Desk, Nils, Marjorie brief, Austin, Paul Blart, Growth | Genuine authoring, adjudication, or security judgment |

Deliberately NOT adopted: a "Sonnet drafts, Opus reviews" two-pass on the content
lane. It doubles session count to guard a failure mode `validate:content` already
catches. The one place it would earn its cost is Rumor Desk, where a privacy-redline
miss is a real liability — revisit if one ever ships.

### Applied so far

| Runner | Change | Trigger ID |
|---|---|---|
| Answerer (sole instance) | every 2h → **once daily** `50 13 * * *`; run-discipline block added | `trig_01TCMZrg6SXe9Gt1CURY9yyU` |
| Lex depth (sole instance) | **disabled** (was live despite this file saying otherwise) | `trig_016VTco4fpekZbfs5kB8rNAz` |
| Content Shift | run-discipline + auto-merge awareness; stop labelling `needs-human-review` for an unreachable Codex | `trig_01REc9iWzjGmKnoocxCACUV1` |
| Karen — nightly scan | Opus → **Sonnet 5**; run-discipline block | `trig_014HWuRmT2MFveDkPGwVDiQX` |
| 8 × `send_later` PR loops | **disabled** | (one-time triggers) |

### Where the runs actually go now (2026-07-26)

| Bucket | Runs/day | Share |
|---|---:|---:|
| **Foray** (6 classify shards ×3/day + nightly enrich) | **~19** | **~56%** |
| Swift2 scheduled runners | ~15 | ~44% |
| `send_later` self-check-ins | 0 | — |
| **Total** | **~34** | |

Down from ~208/day. **Foray is now the majority of all agent spend** — 6 shards
on an every-8-hours cron. Wyatt's call to leave it alone stands; flagged here
because any further meaningful cut is now a Foray decision, not a Swift2 one.
The Swift2 side is close to its floor: 15/day across 20 runners, most weekly or
sub-daily, with the only multi-run-per-day items being Content Shift (2, the
core content engine) and Kevin's comment radar (2).

### Deleted 2026-07-26 (not paused — deleted, Wyatt)

- **~250 dead `send_later` triggers** — expired one-time records from the
  check-in loops. NOTE: these were already `enabled:false` / `run_once_fired`
  and cost **zero** tokens; deleting them is hygiene, not savings. The saving
  came from disabling the 8 *live* loops.
- **9 Answerer shards** + **19 Lex shards** — superseded by their sole instances.
- **4 duplicate Kevin runners** (the em-dash set) — byte-identical prompts to the
  `(cloud)` set, which carries the throttles.
- **4 completed one-shots** — Shoppable links builder, Rumor tier builder,
  726-red-dossiers-retry, depth-fleet stand-down.

Kept deliberately (paused, not obsolete): **Marjorie 8 PM delta** and **Lex depth
(sole instance)** — both are warm spares whose prompts exist nowhere else.

### Remaining model downgrades — IDs captured, not yet applied

### ⚠️ The Vault Run is LIVE — and so are all six lanes it was meant to replace

**Status as of 2026-08-11: the consolidation is HALF-DONE, and the half that is
missing is the half that saves anything.** Read this before reasoning about
content PR volume or Actions minutes.

`trig_01EuLgUdMgbuqL51o3iWQfTL` (Opus, daily `7 16 * * *`) has been opening
`vault/<date>` PRs since 07-30. **Phase 4 — disabling the six standalone lane
runners — never happened.** So the orchestrator runs *in addition to* the six,
not instead of them, and every stated win is unrealized or inverted:

- **PR count went UP, not down.** ~4.2 content PRs/day + 1 orchestrator PR.
- **Actions minutes and tokens: no saving at all** — the six cold boots still
  happen, plus a seventh.
- **The cross-lane conflict bug class is not removed** — there are still up to
  seven writers regenerating the same vault on seven branches.
- **Rumor Desk now effectively runs DAILY.** Its standalone cron is
  `47 14 */2 * *` (odd days of the month); the orchestrator's lane 4 is due on
  **even** day-of-month. The two interleave to daily coverage of the highest
  privacy-liability lane in the system, which auto-merges with no human read.
  Nobody designed this; it is an artifact of Phase 4 not landing. Confirmed by
  branch history: `content/rumor-desk-` on 08-03/05/07/11 (odd),
  `lane(rumor-desk)` commits inside `vault/2026-08-10` (even).

**Do not "just disable the six" to fix this.** Four preconditions are unmet and
three of them are load-bearing — the standalone lanes are currently masking a
~25% Vault Run miss rate (no PR at all on 08-01, 08-02, 08-08) and are the only
thing draining the depth backlog. The full checklist, with evidence, is in
[`vault-run-plan.md`](vault-run-plan.md) § Phase 4. The first item is **merge
PR #1629** (Phase 3.5, open since 07-30) — until it lands, `main` has neither
stuck-red-PR detection nor a recovery path, and consolidation makes a stranded
red PR strictly worse (one red PR would strand all six lanes, not one).

Phase 1 (done): each lane's prompt now lives in
[`runner-prompts/vault-lanes/`](runner-prompts/vault-lanes/) instead of only
inside its trigger — which closes the drift gap recorded below.

Phase 2 (done): the orchestrator is
[`runner-prompts/vault-run.md`](runner-prompts/vault-run.md). It owns the shared
scaffolding (one clone, one `sync:content`, one gate, one PR) and reads each lane
file at the start of that lane rather than all six up front. Three properties are
deliberate and worth preserving if it is ever edited:

- **One commit per lane** (`lane(<name>): …`), so `git revert` undoes one lane
  without touching the others.
- **Per-lane failure isolation** — a failing lane is logged and the run
  continues. A single lane taking out the whole day would make this
  consolidation strictly worse than the six runs it replaces.
- **Trim volume, never silently skip a lane.** Silently dropping a lane is the
  failure mode that would make consolidation a regression, so the PR body must
  name every lane that was not due, no-opped, or failed, with the reason.

Remaining phases and the rollback are in the plan doc.

### 🔁 The block DECAYS — see [`routine-invariants.md`](routine-invariants.md)

Detaching the connector is **per-routine and point-in-time**. Every NEW routine
gets `Claude_Code_Remote` by default, so the hole reopens quietly as the fleet
grows. A weekly **Routine Auditor** now checks the invariants in
[`routine-invariants.md`](routine-invariants.md) and files a `routine-audit`
issue on violation. Read that file's checklist before creating any routine.

### ✅ Structural block ENABLED (2026-07-26) — the meta connector is detached

Self-armed `send_later` monitors are now **structurally impossible** on every
Swift2 runner, not merely forbidden by prompt text. The `Claude_Code_Remote`
meta MCP connector — the tool a run uses to create a new trigger — has been
removed from every routine that had it.

**This must be done in the routines UI, not the API.** Open the routine →
pencil (Edit) → Connectors tab → the `×` on the `Claude_Code_Remote` chip →
Save. The API silently ignores `mcp_connections: []` (returns 200, keeps the
connector). The UI's remove button carries `aria-label="Remove Claude_Code_Remote"`
if you ever need to script it.

Detached from: Answerer, Content Shift, Rumor Desk, Stylist, Cross-Link, Photo
Enrichment, Audio Curator, Mood Chat, News Triage, Growth, and all four Kevin
`(cloud)` streams.

Already had no connector (nothing to do): Karen, Laura, Austin, Nils, Paul
Blart, Marjorie 6 AM brief, Lex sole instance.

**Gmail connectors were deliberately left attached** — Marjorie and the Kevin
streams use them, and Gmail cannot create triggers.

Defence in depth now: (1) connector detached — cannot call `send_later`;
(2) `CLAUDE.md` § "Never babysit your own PR" — covers every session in the repo
including Joey's and Codex's; (3) per-runner prompt blocks; (4) auto-merge
removes the reason to wait in the first place.

### ✅ Marjorie moved off Fable 5 (2026-07-26, Wyatt)

`trig_01KJLFZpKaFV6jDVshMrHG3E` is now on **`claude-opus-4-8`**, matching the
rest of the fleet. It was the ONE runner never migrated on 2026-07-20 when
everything else moved after the scheduled fleet was found to be silently
failing on `claude-fable-5` — its `updated_at` had sat at 2026-07-17 ever since.
The four un-actioned "no Founders' Brief" watchdog alerts (#947, #1177, #1203,
#1224) fit that pattern.

Chose `claude-opus-4-8` over `claude-opus-5` deliberately: 4.8 is the model
empirically proven in this exact runner environment across the whole fleet, and
this is the runner with the worst reliability history — not the place to
introduce a new variable. Upgrading the fleet to Opus 5 is a separate,
deliberate decision.

Its prompt now carries a note saying Fable is ruled out, so a future missed
brief sends the investigation somewhere new instead of re-litigating this.

Two stale instructions fixed in the same edit:
- Step 3 said "requires gh — if gh is unavailable, stop and exit loudly." After
  #1552 that is wrong: `assemble-brief.mjs` falls back to the REST API. The step
  now says a failure there is a REAL failure, and explicitly forbids
  hand-assembling a brief that hides a broken pipeline.
- Step 7 (merge sweep) now notes that `auto-merge-content.yml` lands content-only
  PRs automatically, so fewer PRs waiting is expected, not a sign of a dead fleet.

### ✅ Marjorie's brief assembler runs in a cloud runner again (2026-08-11, #1869)

Five consecutive briefs (2026-08-06..11) were hand-assembled because
`node scripts/marjorie/assemble-brief.mjs` could not reach GitHub from a cloud
runner. **Two independent failures were stacked**, both in `scripts/lib/gh.mjs`'s
REST fallback, both now fixed:

1. **The proxy was bypassed.** The fallback used `fetch()`. Node's built-in
   fetch ignores `HTTPS_PROXY` unless the *process was booted* with
   `--use-env-proxy` / `NODE_USE_ENV_PROXY=1` — reproduced on Node v24.15
   against a real local CONNECT proxy: **0 tunnels opened**. Cloud `GH_TOKEN`s
   are proxy-scoped credentials, so going direct means `401 Bad credentials`.
   Setting `process.env.NODE_USE_ENV_PROXY` from inside the script does **not**
   work (undici reads it at bootstrap) — also verified, so the workaround
   suggested in #1869 would not have held. `gh.mjs` now speaks HTTPS over an
   explicit CONNECT tunnel of its own, which needs no boot flag, no re-exec and
   no new dependency.
2. **`/search/*` is forbidden.** Every list shape was
   `/search/issues?q=repo:…`. Repo-bound sessions get `403 "This GitHub API
   path is not available: sessions are bound to their configured repositories."`
   Lists are now `/repos/{owner}/{repo}/issues` and `/repos/{owner}/{repo}/pulls`,
   with the search-only qualifiers (`is:merged`, and hiding the PRs that
   `/repos/…/issues` mixes in) applied client-side.

Verified end-to-end: the assembler's output is byte-identical across the gh-CLI
path, the direct REST path, and the REST path forced through a CONNECT proxy —
**5 API requests, one page each**.

**Full-text search still has no repo-scoped equivalent.** Karen's
`cie-fp:` dedupe (`scripts/content-engine/lib/issues.mjs`) is the only caller
that needs it; it stays on `/search/issues` and now fails with an error that
names the limitation instead of a bare 403. Karen's cloud runs therefore still
risk re-filing duplicate tickets — tracked separately from #1869.

### ⚠️ Correction: fix 1 above never worked (2026-08-12, #2008)

**Run repo scripts that touch GitHub as `node --use-env-proxy <script>`.**
Every invocation site in this repo now does (`package.json` scripts,
`.github/workflows/{watchdog,unowned-sweep}.yml`, and the runner prompts).

The "explicit CONNECT tunnel" described in fix 1 opened a tunnel and then never
used it, so **every REST call went direct to `api.github.com` anyway** — past
the egress proxy that swaps the proxy-scoped placeholder `GH_TOKEN` for the
real credential. Result: an unbroken run of `401 Bad credentials`, Karen's
filing step down from 2026-08-02, and the assembler still failing in cloud
after #1887 and #1922 both claimed to have fixed it.

The Node-level cause: the request was built as

```js
https.request({ agent: false, createConnection: () => tls.connect({ socket }) })
```

With `agent: false` Node does **not** go agentless — it constructs a fresh
`https.Agent`, and the *agent's* `createConnection` (a plain, direct
`tls.connect`) is what runs. A request-level `createConnection` is only honoured
when there is no agent at all, so the closure holding the tunnelled socket was
never called.

How to tell this apart from a genuinely bad token, in one command: point
`HTTPS_PROXY` at a proxy that accepts `CONNECT` and then forwards **nothing**.
A client that really uses the tunnel must hang. The old transport returned a
live GitHub response; `fetch` with `--use-env-proxy` correctly timed out.

What changed:
- `httpsRequest()` prefers `fetch` when the process was booted proxy-aware (the
  configuration verified returning 200 in cloud), and otherwise falls back to a
  CONNECT tunnel that is genuinely used — printing a loud warning, because
  silence is what hid this for three weeks.
- A 401 from the REST fallback now says *"the proxy was probably bypassed"* and
  prints whether `HTTPS_PROXY` is set and whether fetch is proxy-aware, instead
  of a bare status.
- `scripts/marjorie/lib/gh-api.mjs` no longer uses a bare `fetch` (same silent
  bypass); it shares `httpsRequest()`. Its `ghApiSoft()` now **rethrows 401** —
  a credential failure is not an unavailable metric, and softening it produced
  a brief full of honest-looking "unavailable" lines that still exited 0.
- `scripts/lib/gh.test.ts` asserts the request **bytes traverse the tunnel**.
  The old test only asserted a CONNECT was *issued*, which the broken transport
  did — that is why this shipped twice.

> ⚠️ **Trigger drift to reconcile (Wyatt).** The 2026-07-26 edit below changed
> the *live* trigger's step 3 and step 7, but never landed in
> `runner-prompts/marjorie-brief.md` — the file still carried the pre-#1552
> "requires gh — stop and exit loudly" text until this change. Per this doc's
> own rule the FILE is the source of truth, so both steps are now corrected
> there; the live trigger `trig_01KJLFZpKaFV6jDVshMrHG3E` should be re-synced
> from the file. Not done here: this session runs under Joey's account and
> `RemoteTrigger` only reaches triggers on the account whose token it holds —
> a session on Wyatt's own account (or Wyatt himself) has to run the sync.
> **Correction (2026-08-22): "live triggers are founders-only" was wrong** —
> `RemoteTrigger` create/update/run works fine same-account; the only
> genuinely UI-only step is detaching the `Claude_Code_Remote` connector.

### ⚠️ RemoteTrigger API footgun — read before editing any trigger

**`job_config` updates are a FULL REPLACEMENT, not a merge.** Sending
`{"job_config":{"ccr":{"environment_id":"...","session_context":{"model":"..."}}}}`
to change only the model **silently destroys the trigger's `events` (its entire
prompt) and its `sources` (the git repo binding)** — the API returns HTTP 200.
This happened to the Cross-Link builder during this audit and was restored only
because its config had been fetched moments earlier.

**Always: `get` the trigger, modify the returned `job_config`, and PUT the whole
thing back.** Never send a partial `job_config`.

Two smaller gotchas: `environment_id` is required on every `job_config` update
(a 400 otherwise), and setting `mcp_connections: []` is silently ignored — the
`Claude_Code_Remote` meta connector (the thing that can arm `send_later`)
survives. Remove it from the routines UI if prompt text ever proves insufficient.

### Still to do

- Delete the duplicate Kevin set and consolidate the survivors S1+S2+S3 into ONE
  daily session (one clone, one charter read); radar separately on Haiku.
- Consolidate Cross-Link / Audio Curator / Mood Chat / Photo Enrichment into one
  "Vault Filler" on Sonnet with a rotating target — four cold boots for four
  variants of "fill a missing field".
- Apply the remaining model downgrades in the table above.
- Register the nine unregistered runners here, each with a prompt FILE.
  (Partial, 2026-08-23: all 23 live trigger IDs are now recorded in the
  "Live trigger IDs" table above — the still-missing piece is a
  `runner-prompts/*.md` file for each of the nine whose prompt exists only
  inline in the trigger.)
- **Note:** clearing `mcp_connections` via the RemoteTrigger API is silently
  ignored — the meta connector survives an update that sets it to `[]`. Prompt
  text is currently the only lever against self-armed check-ins; if they recur,
  remove the connector from the routines UI instead.

### Cadence contradiction — Karen (found 2026-08-14, resolved 2026-08-27)

This doc contradicts itself on Karen's cadence and has for a while:

- **The overrides table below** (dated from the 2026-07-25 sustainment pass)
  says her nightly `0 9 * * *` was overridden to **weekly** `0 9 * * 0` (Sun),
  "still in force."
- **The full split table further down** still lists her as **nightly**
  `0 9 * * *`.

They cannot both be true, and this repo cannot query the live trigger to
settle it — `CronList` only sees the current session, not Wyatt's routine
dashboard. The only evidence available from here is Karen's own PR dates:
07-18, 07-19, 07-22, 07-26, 08-09. That is irregular around the 07-25 override
date (tighter together before it, then a 14-day gap after — consistent with
one missed weekly run), and **2026-08-09, her last real run, was a Sunday**.
That evidence supports **weekly**, not nightly.

**This is not fixed here — it is flagged.** Whoever controls the routine
dashboard (Wyatt) needs to confirm which cadence is actually configured and
correct whichever line of this doc is wrong. Until then:
`.github/workflows/watchdog.yml`'s Karen staleness check (`STALE_DAYS=9`) is
built assuming **weekly** is the real cadence — if nightly turns out to be
correct instead, that threshold should shrink back down to match.

**Update 2026-08-24 — the cadence contradiction no longer gates FRESHNESS.**
Karen's routine went dark ~2026-08-14 → 08-24 (10+ days, no reports) and the
staleness check paged. Per CLAUDE.md's "Freshness on Actions, judgment on
routines" rule, the **deterministic** half of Karen — detect findings from the
seed corpus and file/dedupe the GitHub tickets — is now a GitHub Action,
`.github/workflows/cie-scan.yml` (`run.mjs all --no-images --create`, nightly at `9 9 * * *`, zero LLM, only `GITHUB_TOKEN` + the existing `SOCIAL_POSTER_PAT`
to land the report PR on protected `main`). That makes CIE report freshness
independent of Wyatt's Claude login and of this cadence question entirely. The
Wyatt routine is now only needed for the **judgment** half — `Karen Deep — agent
review` (fabricated events/quotes, wrong-subject images, safety) — which reads
the findings the Action produces. Follow-up for the routine dashboard: trim the
`Karen — nightly scan` routine to the Deep-review pass only (despite the registered name, it runs a bounded weekly judgment slice; see `runner-prompts/karen-nightly.md`; it no longer needs
to run the deterministic scan the Action now owns). The `STALE_DAYS=9` check
stays as the backstop for the Action itself. **(SUPERSEDED 2026-08-27 —
the fleet was consolidated to Joey's account ~2026-08-23, verified live
2026-08-27; "the Wyatt routine" above is historical phrasing, and any
routine running today, including Karen's, runs on Joey's account.)**

**Resolved 2026-08-27 — live audit.** The live trigger confirms **weekly**,
Sundays `0 9 * * 0` UTC, matching the overrides table below and the PR-date
evidence already gathered in this section. The word "nightly" in the
routine's name/title is historical — the cadence itself has been weekly since
the 2026-07-25 override.

### T-5 — trim routine + rename trigger (2026-08-31, `docs/TIER2-OPTIMIZATION.md`)

**Prompt file: already judgment-only.** `runner-prompts/karen-nightly.md` was
trimmed to the bounded judgment slice (review-slice + subagent dispatch +
ingest/issues/record-review + link-rot sweep) by PR #3445 (2026-08-29), which
also struck the old deterministic `run.mjs all --create` step now owned by
`.github/workflows/cie-scan.yml`. **Not accidentally bundled into #3601** —
that PR only touched Karen Deep (T-6, a separate not-yet-created routine),
Nils cadence, Austin's model trial, and the notification-quality desk; it
never edited this prompt file or this trigger.

**Remaining scope: rename the live trigger to match.** Tracked as
[#3616](https://github.com/JW-Incorporated/swift2/issues/3616) so this
doesn't strand as an untracked "whoever has access" note. The registered
name is still `Karen — nightly scan`, contradicting its own judgment-only
content and weekly cadence (documented above). Whoever next has account
access to <https://claude.ai/code/routines> should, in one `job_config`
round-trip (get → edit only `name` in the returned object → PUT the whole
thing back — **never a partial PUT**, per the RemoteTrigger footgun above):

| Field | Current | New |
|---|---|---|
| Name | `Karen — nightly scan` | `Karen — weekly judgment slice` |
| Trigger ID | `trig_01TmYaZgnecrEp9mkeV3Gq6X` — the live table above; recreated on Joey's account 2026-08-23 per `HUMAN-ACTIONS.md` #2, current and correct | unchanged |
| Prompt (`events`) | already judgment-only (PR #3445) | unchanged — do not re-paste, just preserve on the round-trip |
| Cadence, model, repo, connectors | `0 9 * * 0` UTC, `claude-sonnet-5`, `JW-Incorporated/swift2`@main | unchanged |

**Do not use `trig_014HWuRmT2MFveDkPGwVDiQX`** (the "Cadence overrides still
in force" table below and the historical split table further down) — that ID
predates the 2026-08-23 account migration (issue #2258), when Wyatt's entire
fleet was disabled and Karen was recreated fresh on Joey's account under
`trig_01TmYaZgnecrEp9mkeV3Gq6X`. It is very likely stale/orphaned rather than
the same routine under a second ID; whoever applies the rename should `get`
`trig_014HW...` first to confirm it no longer exists live before touching
anything, and if it turns out to still be live and enabled, flag that here as
a separate finding (a live duplicate), don't fold it into this rename.

Cross-checked against `runner-prompts/karen-nightly.md`: the file's own
opening line already reads "weekly content-safety judgment review," so a
rename to `Karen — weekly judgment slice` is a pure resync, not a new
decision — no founder call needed (T-5 is pre-approved,
standing-agent-authority per its Tier-2 entry). **This doc's live table
(above) still shows the current registered name with a RENAME PENDING flag,
not the new name** — the tables get updated to `Karen — weekly judgment
slice` outright only once the live rename actually lands, to avoid the
inventory drifting ahead of reality.

### Cadence overrides still in force (from the 2026-07-25 sustainment pass)

| Runner | Cadence | Trigger ID |
|---|---|---|
| Karen — nightly scan ⚠️ **trigger ID likely stale (predates the 2026-08-23 account migration, issue #2258) — see § T-5 above; use `trig_01TmYaZgnecrEp9mkeV3Gq6X` from the live table for any real action** | weekly `0 9 * * 0` (Sun) — registered name; bounded weekly judgment slice, see `runner-prompts/karen-nightly.md` | `trig_014HWuRmT2MFveDkPGwVDiQX` |
| Kevin — S1 Karen solver *(cloud copy only)* | weekly `17 11 * * 0` | `trig_01RurBLTvDN3K3oCjpH3SEFd` |
| ~~Nils — daily walk~~ **SUPERSEDED 2026-08-31 (Joey, D4=B)** — now twice weekly `0 14 * * 1,5` (Mon+Fri), see `nils.md` § Cadence and `decisions.md` § D3=A…D6=A | `trig_013xb8Stm7m2sB6dqGePKRtr` |
| Stylist | weekly `33 16 * * 0` | `trig_016RycwuFMr5BAxadu5ft2GG` |
| Rumor Desk | every other day `47 14 */2 * *` | `trig_01QqbHr7dyttr7qijGKmCn7n` |
| Marjorie — 8 PM delta | DISABLED | `trig_01G4GsUsphyz9LycqKjDEdi4` |

## The split (historical — superseded 2026-08-27)

> **SUPERSEDED 2026-08-27** — the account split below is historical. The
> entire fleet (24 triggers) was consolidated to Joey's account ~2026-08-23
> and verified live 2026-08-27; current trigger IDs are the ones in the main
> fleet table at the top of this file. The `trig_` IDs in this table are the
> retired pre-consolidation triggers and no longer exist as live schedules.

| Runner | Cadence (UTC) | Model | Prompt file | Account | Why this side |
|---|---|---|---|---|---|
| Marjorie — morning brief | `0 12 * * *` (was `0 13` — moved 2026-07-16 so the emailed brief is in founder inboxes **by 6:00 AM PT**, Joey's requirement; the 12:45 UTC mailer needs the brief posted by ~12:40) | Fable | [`runner-prompts/marjorie-brief.md`](runner-prompts/marjorie-brief.md) | **Wyatt** | Moved 2026-07-12: Joey near weekly limit; briefs deliver to both founders regardless of runner account |
| ~~Marjorie — 8 PM delta~~ **(DISABLED 2026-07-25, Wyatt)** | ~~`0 3 * * *`~~ | Fable | [`runner-prompts/marjorie-delta.md`](runner-prompts/marjorie-delta.md) | **Wyatt** | Cut to once-daily for sustainment mode — the morning brief stands alone. Trigger `trig_01G4GsUsphyz9LycqKjDEdi4` set `enabled:false` (not deleted; re-enable to restore). NOTE: the delta also ran an evening merge-sweep + founder-email-reply pass — those now happen only at the 6 AM brief (autonomous merge cycles cover the gap). |
| Growth — daily draft | `0 11 * * *` (1h before Marjorie's morning brief, so its Growth line reflects a fresh queue) | Fable | [`runner-prompts/growth-draft.md`](runner-prompts/growth-draft.md) | **Wyatt** | Added 2026-07-21: the charter (`docs/agents/growth.md`) and the shipping pipeline (`social-poster.yml`) existed, but nothing was ever scheduled to run the *drafting* half — issue #864 (empty queue) sat unactioned 3 days for exactly this reason. **Since 2026-08-11 it drafts Tree's calendar rather than inventing content** |
| Tree — weekly social plan | `0 10 * * 1` (Mondays, an hour before that day's Growth draft, so the fresh calendar is readable the same morning) | **Opus** — genuine strategy judgment; a script-and-summarize tier would restore the formula loop it exists to break | [`runner-prompts/tree-plan.md`](runner-prompts/tree-plan.md) | **Wyatt** | Added 2026-08-11 (Joey): posting was strategically random — 12 of 14 captions opened "did you know", every IG image a generic era tile, and feature launches / the six threads / Mood had never been posted about. Tree plans `social/calendar.md`; Growth executes it. Charter: [`tree.md`](tree.md) |
| Austin — build runs (historical ×2/day entry — **stale, fixed 2026-08-31 per T-19/T-11**; the charter's Cadence section correctly described the event/hourly poll all along, and the live registry above shows one daily trigger at `0 21 * * *`, now on `claude-opus-4-8` for the D5=A trial) | ~~`0 16 * * *`, `0 21 * * *`~~ superseded — see live table above | Fable (superseded — see live table above) | [`runner-prompts/austin-run.md`](runner-prompts/austin-run.md) | **Wyatt** (superseded — Joey per D1=B) | Solves work (code) |
| Nils — daily walk | `0 14 * * *` | Fable | [`runner-prompts/nils-walk.md`](runner-prompts/nils-walk.md) — needs WebFetch tool (live-site walks) | **Wyatt** | Heavy judgment over the whole site + SEO/discoverability lens |
| Content Shift ×2 | `0 17,23 * * *` | Fable | [`runner-prompts/content-shift-run.md`](runner-prompts/content-shift-run.md) | **Wyatt** | Heaviest: research + writing |
| Kevin — S1 Karen solver | `17 11 * * *` | Fable | [`runner-prompts/kevin-stream1-karen.md`](runner-prompts/kevin-stream1-karen.md) | **Wyatt** | Fixes cie tickets; runs after Karen, before the brief |
| Kevin — S2 user digest | `13 15 * * *` | Fable | [`runner-prompts/kevin-stream2-digest.md`](runner-prompts/kevin-stream2-digest.md) | **Wyatt** | Daily feedback digest for human accept/reject |
| Kevin — S3 eng triage | `43 15 * * *` | Fable | [`runner-prompts/kevin-stream3-triage.md`](runner-prompts/kevin-stream3-triage.md) | **Wyatt** | Buckets Joey's eng tickets → Austin intake |
| Kevin — S3 comment radar | `23 1,13 * * *` | Fable | [`runner-prompts/kevin-stream3-radar.md`](runner-prompts/kevin-stream3-radar.md) — lazy: cheap poll, loads charter only on a hit | **Wyatt** | Twice daily (~6am + 6pm PT); surfaces cross-session comments — cut from hourly 2026-07-24 to reduce token burn (Wyatt) |
| Karen — nightly scan | `0 9 * * *` — **contradicted, see "Cadence contradiction — Karen" above; evidence supports weekly** | Fable | [`runner-prompts/karen-nightly.md`](runner-prompts/karen-nightly.md) | **Wyatt** | Solves work (integrity + link-rot sweep); 2 AM PT |
| **Karen Deep — agent review** ⚠️ **APPROVED, NOT YET CREATED** (Joey, D3=A, 2026-08-31 — full dial; config below) | `40 9 * * *` (proposed) | **Sonnet 5** | [`runner-prompts/karen-deep-review.md`](runner-prompts/karen-deep-review.md) | **Wyatt** | The LLM half of Karen (fabricated events/quotes, wrong-subject images, safety classification). Dark 2026-07-10 → 2026-08-11 because it was a manual ritual |
| Paul Blart — security patrol | `7 12 * * 1` | Fable | [`runner-prompts/paul-blart-run.md`](runner-prompts/paul-blart-run.md) | **Wyatt** | Dependency/supply-chain security; weekly, judgment on Dependabot/CodeQL |
| Laura — a11y walk | `0 15 * * *` | Fable | [`runner-prompts/laura-walk.md`](runner-prompts/laura-walk.md) — needs Web tools + npx axe/pa11y | **Wyatt** | Accessibility (WCAG 2.2 AA); public-site legal + reach |
| watchdog / brief-mailer / CI / CodeQL / a11y | GitHub Actions | none | `.github/workflows/` | repo | Zero LLM (detection layer) |
| appearance-discovery | `40 13 * * *` (GitHub Actions) | none | `.github/workflows/appearance-discovery.yml` + `scripts/appearance-discovery/` | repo | **Zero LLM (detection layer).** Polls 14 curated YouTube channel RSS feeds and files `intake` issues for new Taylor appearances; the Content Shift is the judge. No new secrets (channel RSS is keyless; only `GITHUB_TOKEN`). Runs 06:40 PT, ahead of the 10:00 PT Content Shift so fresh intake is queued. Stateless dedupe — no state file, no state PR (#2031), repo-scoped issue list only, never `/search` (#2008) |

## Karen Deep — trigger config to create (2026-08-11; spend approved 2026-08-31, Joey, D3=A)

**Not created by this change.** Creating it requires a session (or human)
authenticated to the target Claude account — `RemoteTrigger` create/update/run
works fine same-account (confirmed 2026-08-22); the only genuinely UI-only step
is detaching the `Claude_Code_Remote` connector, which the API silently
no-ops. This is the exact config to use; nothing runs until someone with
account access creates it. **The spend question that gated creation is now
resolved** — Joey approved the full dial (D3=A, 2026-08-31,
`docs/decisions.md`) — so the only remaining blocker is the account-access
mechanic every other not-yet-created routine in this file shares (see "Tree's
routine does not exist yet" below), not a founder decision.

| Field | Value |
|---|---|
| Name | `Karen Deep — agent review` |
| Account | **Joey** (corrected 2026-08-31, D1=B — the fleet's account policy; was Wyatt when this spec was first drafted 2026-08-11, not yet created) |
| Model | `claude-sonnet-5` |
| Cron (UTC) | `40 9 * * *` — 40 min after Karen's nightly `0 9`, so the deterministic scan and its report have landed first; off the `:00`/`:30` cluster |
| Repo | `JW-Incorporated/swift2`, branch `main` |
| Prompt | the **full text** of `docs/agents/runner-prompts/karen-deep-review.md`, verbatim |
| MCP connectors | none |

**The file is the source of truth.** If the trigger's inline prompt ever drifts
from the file, that is a bug — re-sync from the file. And per the RemoteTrigger
footgun noted above, a partial `job_config` PUT destroys the prompt: send the
whole config or edit in the routines UI.

**Why it is a separate runner and not more steps in `karen-nightly.md`.** The
nightly is a deterministic script plus a summary — it finishes in minutes and
costs one session. This one fans out to subagents that fetch sources and
download images; folding it in would make a failure in the expensive half take
down the cheap half that files the tickets, which is exactly the coupling that
lost 1,220 findings on 2026-07-26 and 2026-08-09.

### What it costs, and the knob to turn

Budget is `--factual-batches 2 --image-batches 1` = **3 subagents/night**.

| Agent | Input it carries | Estimated tokens |
|---|---|---:|
| Factual batch (28 items) | ~50 KB batch JSON (~13k) + prompt/schema (~5k) + WebFetch of ~40–60 cited sources + WebSearch corroboration | ~400k |
| Image batch (40 images) | ~24 KB batch JSON (~6k) + 40 downloaded images at ~1.2k each + tool overhead | ~170k |
| Safety batch (121 candidates, only when changed) | ~1 batch + the redlines rubric; no fetching | ~60k |

≈ **1.0M tokens/night**, ~92% input. At Claude Sonnet 5 list ($3/MTok in,
$15/MTok out) that is **≈ $3.75/night ≈ $114/month** (≈ $2.50/night on the
introductory $2/$10 rate through 2026-08-31). On Fable it would be ~$10/night —
**Sonnet is the deliberate choice here**, matching the model tiering above,
which already puts Karen on Sonnet.

The token figures are **estimates from measured batch sizes plus a fetch-volume
assumption**, not from an observed run. `review-status` and the ledger make the
real number checkable after a week — re-baseline then.

**Coverage.** 56 items + 40 images/night against 1,137 items and 1,056 images:
a full first pass in **~20 nights (factual)** and **~27 nights (images)**, and
after that a standing ~3–4 week refresh cycle. Changed and never-reviewed
content jumps the queue, so newly merged content is reviewed within a day or two
regardless of where the rotation is.

**Dials, in order of preference:** `--factual-batches 1 --image-batches 1`
halves it to ≈ $66/month (slower rotation, changed-content priority unaffected);
raising both for a one-time catch-up sweep is fine and bounded — the ledger
records it, so the sweep pays down the backlog permanently rather than
re-reviewing.

**Rejected alternatives.** (a) *Full sweep weekly* — one ~20M-token night is
both a rate-limit-window problem and an all-or-nothing failure. (b)
*Changed-content-only* — cheapest, but the 1,137-item backlog that has never been
agent-reviewed would stay at zero forever, which is today's bug with extra steps.
(c) *`--claims-only` focusing* — RUNBOOK.md already records that this caused a
real miss: claim-free narrative records are exactly where fabricated events hide.

## Notification-quality desk — trigger config to create (2026-08-31, T-16, D6=A)

**Not created by this change** — same account-access mechanic as Karen Deep
and Tree above. **Sequencing precondition NOT yet met**: the analysis
(`TIER2-OPTIMIZATION.md` § T-16) says this desk should launch *after*
REC-1's notifications-dispatch watchdog heartbeat lands
(`docs/automation/review-2026-08-31.md#rec-1` — a `dispatch_runs` table +
a `watchdog.yml` freshness step), so it judges data a watchdog vouches for
rather than data from a dispatcher that could itself be silently dead.
Verified this pass: no `dispatch_runs` table exists in
`supabase/migrations/`, no notifications step exists in
`.github/workflows/watchdog.yml`, no `scripts/notifications-freshness.mjs`
exists. **Per the founder instruction not to block indefinitely**, the
charter, prompt file, and this registry row are created now; the live
trigger is not, and should not be, until REC-1 lands.

| Field | Value |
|---|---|
| Name | `Notification quality — weekly desk` |
| Account | **Joey** (fleet policy, D1=B) |
| Model | `claude-sonnet-5` |
| Cron (UTC) | `0 16 * * 2` — weekly, Tuesday, after a full week of Monday-anchored data is available and clear of the Sunday/Monday judgment-desk cluster (Karen, Nils, Kevin S1) |
| Repo | `JW-Incorporated/swift2`, branch `main` |
| Prompt | the **full text** of `docs/agents/runner-prompts/notification-quality-run.md`, verbatim |
| MCP connectors | none |
| **Environment secret (provision BEFORE creating)** | `NOTIFICATIONS_DASHBOARD_SECRET` must be added to the `job_config.ccr.environment_id` this trigger is created under (the same account-level Claude Code environment every other Joey-account routine's `GITHUB_TOKEN`/`SUPABASE_SERVICE_ROLE_KEY` already lives in — see `runners.md` § RemoteTrigger footgun for how `environment_id` works) — copy the value from Vercel (`SETUP_NOTIFICATIONS.md` § the dashboard secret). **This routine has no data source without it**: the metrics route (`apps/web/app/api/notifications/metrics/route.ts`) 401s on a missing/wrong secret, and the prompt file is written to treat that as a real failure, not a silent no-op — but a session that never gets the secret provisioned will 401 on every single run, forever, which the watchdog cannot distinguish from "the desk is broken" without a human reading the log issue. Provision this in the SAME session that creates the trigger, not as a follow-up. |

**Charter:** [`notification-quality.md`](notification-quality.md). Reads
`/api/notifications/metrics` (open rates, mute rates, flagged categories)
and the `deliveries` table pattern already established by that route; files
≤5 tickets/run on over-firing or under-performing categories, one log
issue, per the standard desk pattern. **Labels provisioned 2026-08-31** (PR
that adds this section) so issue filing does not fail on first run:
`notifications`, `notif:P1`, `notif:P2`, `notif:P3` — same pattern as the
`experience`/`exp:P*` and `cie`/`cie:P*` label sets Nils and Karen use.

**Why it is the one new-spend Tier-2 item besides Karen Deep.** Per
`TIER2-OPTIMIZATION.md` § T-16 / REC-7.3 and `vision.md`'s core promise
(never over-notify), the copy that reaches a user's lock screen is the only
user-facing surface with no judgment desk — Karen/Nils/Laura cover every
other one. ~4 Sonnet sessions/month.

### Tree's routine does not exist yet — needs creating on Joey's account (2026-08-11, account corrected 2026-08-31 D1=B)

The row above is the *specification*. **No routine was created by the session
that wrote it**, deliberately: creating it requires a session authenticated
to a Claude account. This spec originally named Wyatt's account per the
2026-07-12 policy; per Joey's 2026-08-31 decision (D1=B) the fleet's account
is now **Joey's**, so Tree should be created there like every other runner.
**Correction (2026-08-22): this is not a "humans only" limitation** —
`RemoteTrigger` create/update/run works fine same-account, confirmed against
Joey's account the same day. The one step that genuinely is UI-only is
`routine-invariants.md`'s connector removal (detaching `Claude_Code_Remote` —
the API silently no-ops `mcp_connections: []`).

To bring Tree live, from Joey's account: create a routine named
`Tree — weekly social plan`, cron `0 10 * * 1`, model `claude-opus-5` (or the
fleet's current Opus), prompt = the **exact contents** of
[`runner-prompts/tree-plan.md`](runner-prompts/tree-plan.md), then run the
`routine-invariants.md` checklist on it — remove the `Claude_Code_Remote`
connector (Edit → Connectors → `×` → Save; the API silently ignores
`mcp_connections: []`), `persist_session: false`, no `Task` in `allowed_tools`.

Until that paste happens, `social/calendar.md` is a static seed covering
2026-08-12 → 08-25 and the Growth daily run will fall back to heartbeat pillars
once it runs out — which it reports in its PR body, so the gap is visible rather
than silent.

## News Triage — model trial config to apply (2026-08-31, T-3, standing-agent-authority)

**Not applied by this PR.** `docs/TIER2-OPTIMIZATION.md` § T-3 recommends
moving News Triage's live trigger from `claude-opus-4-8` to
`claude-sonnet-5`. Two mitigations are required alongside the model change
(both landed in prompt-file form on PR #3608, ahead of this update, per T-18
prompt-file-first): the labeled-recall-check trial design and the digest
archive step (`.github/workflows/news-worker.yml`). Applying the change
itself — editing the live `job_config` — requires a session (or human)
authenticated to Joey's Claude account, the same account-access mechanic
every other not-yet-created/not-yet-updated routine in this file shares (see
"Tree's routine does not exist yet" above, Karen Deep and the
notification-quality desk below). **The kanban worker sandbox that authored
this change does not carry that account credential; tracked as
`HUMAN-ACTIONS.md` item #36.**

To apply, from a session authenticated to Joey's account — **in this exact
order**, so a Sonnet run is never live before the archive/audit
instrumentation exists (an unarchived, unaudited Sonnet run would violate
the trial's own zero-tolerance bar, since there would be nothing to check
it against):

1. Merge `docs/content-ops/news-triage-trial-active` (empty file is fine —
   its presence is the only thing checked) to `main` FIRST, on its own
   small PR, before touching the live trigger. This turns on the
   `news-worker.yml` digest-archive step so the archive starts filling
   ahead of the trial.
2. Create the recall-check trigger per the config below and confirm it
   ran once successfully (an early manual dispatch is fine even before
   News Triage flips — it just audits an empty/near-empty archive that
   first time). Record its returned trigger ID in this file's "Live
   trigger IDs" table (new row) — the recall-check prompt and this file's
   own closeout procedure both need that ID to disable the correct trigger
   when the trial ends. Do NOT record a trial start date yet — the trial
   clock starts at the model flip (step 6), not at trigger creation.
3. Only once 1 and 2 are confirmed live: `get` the News Triage trigger
   (`trig_019NuR7EpN7TA28yfmzKPAC7`) — per the RemoteTrigger footgun above,
   this is mandatory before any edit.
4. In the returned `job_config`, change only
   `ccr.session_context.model` from `claude-opus-4-8` to `claude-sonnet-5`.
   Leave `events` (the prompt) and `sources` (the repo binding) untouched —
   they must already match `docs/agents/runner-prompts/news-triage.md`
   verbatim (the T-3 trial addendum landed on PR #3608; re-sync from the
   file if the live trigger's inline prompt has drifted).
5. PUT the **whole modified `job_config` back**, never a partial object.
   The moment this PUT succeeds is the trial's actual start — record
   TODAY's date as the trial start date now (not earlier), since that is
   when Sonnet output actually begins.
6. Update this table's News Triage row to `claude-sonnet-5`, remove the
   "pending account access" note, and record the trial start date (from
   step 5) plus its exact 2-week end date (start + 14 days) next to the
   recall-check row added in step 2. Mark `HUMAN-ACTIONS.md` item #36
   `DONE`.

### News Triage recall check — trigger config to create (2-week trial, T-3)

**Also not created by this PR** — same account-access mechanic. Weekly
Opus audit; see `docs/agents/runner-prompts/news-triage-recall-check.md`
for the full trial design (labeled recall check against the archived
digests, zero-tolerance false-negative bar — any counted miss reverts the
model change).

| Field | Value |
|---|---|
| Name | `News Triage recall check — T-3 trial` |
| Account | **Joey** (fleet policy, D1=B) |
| Model | `claude-opus-4-8` |
| Cron (UTC) | `0 17 * * 2` — weekly, Tuesday, well clear of News Triage's own `40 15 * * *` daily run and the Sunday/Monday judgment-desk cluster |
| Repo | `JW-Incorporated/swift2`, branch `main` |
| Prompt | the **full text** of `docs/agents/runner-prompts/news-triage-recall-check.md`, verbatim |
| MCP connectors | none |
| Start / end | create alongside the News Triage model flip; disable (never delete — reversible record) once the trial concludes (2 weeks from the model-flip date) with a PASS or a revert |

**Trial window and disposition:** starts the day the model-flip is applied
and this trigger is created; runs for 2 weeks (14 days), audited by the
weekly Tuesday cadence above. **A clean PASS requires an audit that covers
every day through and including day 14 — not just the most recent weekly
run before day 14.** Because the fixed Tuesday cadence can land up to 6
days before the 14-day mark (e.g. a Wednesday start's day-13 audit leaves
day 14 itself unchecked), do NOT disable the trigger or declare PASS off
that near-final run alone: after day 14 passes, dispatch the recall-check
routine one more time (manual `workflow_dispatch`/trigger `run`, off its
normal cadence) covering the remaining unaudited days, and only close out
the trial once THAT run's verdict is in. Revert is NOT automatic —
it needs the same account-authenticated RemoteTrigger access as every step
above, so a FAIL cannot fix itself.** On the first FAIL (any counted false
negative), the recall-check issue IS the trigger for action, but action
still requires a human-account session: whoever reads the FAIL issue (Kevin
S3's comment radar/eng triage, Marjorie's brief, or a founder scanning
`intake`-adjacent issues) must escalate it as a new `HUMAN-ACTIONS.md` item
(same shape as #36) requesting an urgent revert of News Triage's model back
to `claude-opus-4-8` (full `job_config` round-trip) and disabling of this
recall-check trigger — do not assume the revert happens without that
explicit new item, and do not let the routine's own "any FAIL reverts"
framing above read as "reverts itself." On a clean 2-week PASS, disable
this recall-check trigger (its job is done — News Triage stays on
`claude-sonnet-5` permanently) and remove the
`docs/content-ops/news-triage-trial-active` marker in the same PR, which
also turns off the now-unneeded digest-archive step in `news-worker.yml`.
Record the outcome in `docs/decisions.md` either way.

## Maintenance fleet (2026-07-12)

Four site-maintenance additions, designed in
[`maintenance-bots-research.md`](maintenance-bots-research.md) on the principle
**detect deterministically, judge with an LLM, a human merges**:

- **Paul Blart** (new) — dependency & supply-chain security. Native detection:
  `.github/dependabot.yml` (grouped weekly bumps + a separate security lane) +
  `.github/workflows/codeql.yml` + secret scanning (enable in repo settings).
  Paul triages alerts + Dependabot PRs into a weekly `security` patrol issue and
  never merges. Charter: [`paul-blart.md`](paul-blart.md).
- **Laura** (new) — accessibility auditor to **WCAG 2.2 AA**. Native detection:
  `.github/workflows/a11y.yml` (axe/pa11y, non-blocking to start). Laura files
  `a11y` specs and always names the ~50% manual residual. Charter:
  [`laura.md`](laura.md).
- **Karen** (extended) — nightly now also runs `scripts/check-link-liveness.mjs`
  to sweep **every** source URL (not just images), suggesting archive.org/Wayback
  snapshots for dead links.
- **Nils** (extended) — daily walk now also judges **SEO/discoverability**
  (metadata / Open Graph / JSON-LD / sitemap), and its live-site target moved off
  the internal `swift2-ten` alias to the public domain **www.longlivets.com**
  (see [`../deploy.md`](../deploy.md)).

## Watchdog liveness checks (2026-07-23)

`watchdog.yml`'s cadence check (above) only sees GitHub-Actions-native
workflows — it's blind to the Wyatt-account cloud routines in the table
above, which have no workflow file in this repo. Confirmed this session:
Content Shift went silent for a full day+ with zero trace anywhere (no PR,
no stranded branch, no ticket comment), invisible to any existing check.

Added a per-agent liveness check for any cloud routine that reliably
branches its PRs with a fixed prefix. **Generalised 2026-08-11** from a single
hard-coded Content Shift check into a `check_lane` helper called once per
watched lane, each with its own window and its own alert title so they
self-heal independently:

| Branch prefix | Window | Lane |
|---|---:|---|
| `vault/` | 36h | The Vault Run (daily `7 16 * * *`, carries all six lanes) |
| `content-shift/` | 30h | Content Shift standalone (17:00/23:00 UTC) |

Why both, rather than moving the check: the Vault Run was always going to need
liveness cover, and a check hard-keyed to `content-shift/` **would alarm every
single day the moment Phase 4 disables that lane**. Watching both means the
check is correct before *and* after Phase 4, and the migration is deleting one
row rather than rewriting a step. **When the standalone lanes are disabled,
delete the `content-shift/` row.**

The 36h window is deliberate and should not be widened: the Vault Run carries
all six content lanes, so one missed day is a whole-day content outage, and
36h is the value that still alarms on it (healthy age at check time is ~22.5h;
a missed day is ~46h). Expect it to fire — the Vault Run had no PR on 08-01,
08-02 or 08-08, which nobody noticed precisely because this check did not exist.

Extending to another cloud-routine agent (Nils, Kevin, Karen, Laura, Paul
Blart, Austin, Growth) is now one more `check_lane` line, once/if one of them
is actually observed going dark — not pre-built speculatively for all of them.

Also fixed: every `watchdog-alert` issue is now real-emailed via
`scripts/watchdog/send-mail.py` (the same delivery path `brief-mailer.yml`
uses), not just GitHub-mentioned. `@sffan15-sys` / `@wjduvall-cmd` mentions
don't reach the founders' actual inboxes (see `marjorie.md` › Delivery) —
that gap is exactly why four consecutive daily "no Founders' Brief" alerts
(#947, #1177, #1203, #1224) sat open and uncommented-on for days. Alert
issues are now persistent (one evolving issue per condition, non-date-
titled) rather than minting a new disconnected one every day — see
`scripts/watchdog/upsert-alert.sh`'s header for the mechanism both new and
existing checks now share.

## Migration state (2026-07-12)

All five cloud routines currently exist under **Joey's** account (created
during bootstrap, 2026-07-11) and stay **enabled until Wyatt's replacements
are live** — no missed briefs, no dead cadences. Cutover:

1. Wyatt (or his Claude Code session) creates **all five** routines from
   this registry: same name, cron, model, and the prompt file's exact
   contents, via `/schedule` or the RemoteTrigger API.
2. Wyatt comments "live" on the handoff ticket (#504) with his routine IDs.
3. **Every** Joey-side routine gets **disabled** (kept as warm spares — the
   kill-switch doc covers both sets).

## Kevin cloud move (2026-07-12)

Kevin's four streams moved off the session-scoped cron onto cloud routines (rows
above), for durability. Design notes: S1 runs daily right after Karen (not
hourly — new cie tickets only appear once Karen's nightly scan files them); the
S3 comment radar runs TWICE DAILY (~6am + 6pm PT, `23 1,13 * * *`) as of 2026-07-24 — was hourly 06:00–22:00 PT, cut to reduce token burn (Wyatt) — because cross-session
comments are rare overnight, and its prompt is **lazy** (one cheap `gh` poll first;
loads `docs/kevin.md` and reasons only on a real new comment — the ~16 empty runs/
day stay cheap). Tradeoff vs. the old ~10-min session poll: up to ~1h surfacing
latency and a cloud cold-boot per run; the endgame in `docs/kevin.md` (webhooks)
removes both. Cron floor is 1 hour, so sub-hourly radar is not expressible in cloud.

## Rules

- **Changing a runner's behavior = PR to its prompt file first**, then
  update the trigger to match. Never edit only the trigger.
- New runners get a row here + a prompt file in the same PR that creates
  them, with an explicit account owner justified against the 1:10 split.
- The manager-hat telemetry reports tokens-per-account monthly so the split
  is measured, not assumed.
