# Runner registry — who runs where, on whose tokens

**Requirement (Joey, final form 2026-07-12): ALL scheduled agent spend runs
on Wyatt's account** — Joey is near his weekly limit; his side spends zero
scheduled tokens. The founder split of labor: **Joey = vision, monitoring,
and site QA** (10× Wyatt's testing bandwidth), feeding the org through
zero-token paths — the intake form, experience reports, brief checkboxes;
**Wyatt's account = every runner.** Standing operational assumption (Joey,
2026-07-11): we have effective command-line access to Wyatt's machine via
Joey→Wyatt chat — any prompt/command Joey relays gets run there, so
Wyatt-side setup is a paste away, never a blocker. Every scheduled runner is registered here with
its owner; the prompt each runner executes is versioned in
`runner-prompts/` — **the repo file is the source of truth**, and a trigger
whose inline prompt drifts from its file is a bug.

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
| **Haiku 4.5** | Kevin comment radar, News Triage | Cheap poll / bucketing; the radar is already a lazy `gh` poll |
| **Sonnet 5** | Karen ✅, Stylist, Photo Enrichment, Audio Curator, Cross-Link, Mood Chat, Laura, Kevin S2/S3 | Deterministic script + summarize, or mechanical field-filling |
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

### 🏗️ The Vault Run is being built — see [`vault-run-plan.md`](vault-run-plan.md)

Six content lanes (Answerer, Content Shift, Photo Enrichment, Rumor Desk,
Cross-Link, Stylist) are being consolidated into ONE daily runner. They all edit
`supabase/seed/**` plus the same generated vault, so six separate PRs conflict by
construction — that is what the retired self-check-in loops were largely
resolving. Also ~4.2 PRs/day → 1, and each PR costs two CI runs.

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
- **Note:** clearing `mcp_connections` via the RemoteTrigger API is silently
  ignored — the meta connector survives an update that sets it to `[]`. Prompt
  text is currently the only lever against self-armed check-ins; if they recur,
  remove the connector from the routines UI instead.

### Cadence overrides still in force (from the 2026-07-25 sustainment pass)

| Runner | Cadence | Trigger ID |
|---|---|---|
| Karen — nightly scan | weekly `0 9 * * 0` (Sun) | `trig_014HWuRmT2MFveDkPGwVDiQX` |
| Kevin — S1 Karen solver *(cloud copy only)* | weekly `17 11 * * 0` | `trig_01RurBLTvDN3K3oCjpH3SEFd` |
| Nils — daily walk | weekly `0 14 * * 0` | `trig_013xb8Stm7m2sB6dqGePKRtr` |
| Stylist | weekly `33 16 * * 0` | `trig_016RycwuFMr5BAxadu5ft2GG` |
| Rumor Desk | every other day `47 14 */2 * *` | `trig_01QqbHr7dyttr7qijGKmCn7n` |
| Marjorie — 8 PM delta | DISABLED | `trig_01G4GsUsphyz9LycqKjDEdi4` |

## The split

| Runner | Cadence (UTC) | Model | Prompt file | Account | Why this side |
|---|---|---|---|---|---|
| Marjorie — morning brief | `0 12 * * *` (was `0 13` — moved 2026-07-16 so the emailed brief is in founder inboxes **by 6:00 AM PT**, Joey's requirement; the 12:45 UTC mailer needs the brief posted by ~12:40) | Fable | [`runner-prompts/marjorie-brief.md`](runner-prompts/marjorie-brief.md) | **Wyatt** | Moved 2026-07-12: Joey near weekly limit; briefs deliver to both founders regardless of runner account |
| ~~Marjorie — 8 PM delta~~ **(DISABLED 2026-07-25, Wyatt)** | ~~`0 3 * * *`~~ | Fable | [`runner-prompts/marjorie-delta.md`](runner-prompts/marjorie-delta.md) | **Wyatt** | Cut to once-daily for sustainment mode — the morning brief stands alone. Trigger `trig_01G4GsUsphyz9LycqKjDEdi4` set `enabled:false` (not deleted; re-enable to restore). NOTE: the delta also ran an evening merge-sweep + founder-email-reply pass — those now happen only at the 6 AM brief (autonomous merge cycles cover the gap). |
| Growth — daily draft | `0 11 * * *` (1h before Marjorie's morning brief, so its Growth line reflects a fresh queue) | Fable | [`runner-prompts/growth-draft.md`](runner-prompts/growth-draft.md) | **Wyatt** | Added 2026-07-21: the charter (`docs/agents/growth.md`) and the shipping pipeline (`social-poster.yml`) existed, but nothing was ever scheduled to run the *drafting* half — issue #864 (empty queue) sat unactioned 3 days for exactly this reason |
| Austin — build runs ×2 | `0 16 * * *`, `0 21 * * *` | Fable | [`runner-prompts/austin-run.md`](runner-prompts/austin-run.md) | **Wyatt** | Solves work (code) |
| Nils — daily walk | `0 14 * * *` | Fable | [`runner-prompts/nils-walk.md`](runner-prompts/nils-walk.md) — needs WebFetch tool (live-site walks) | **Wyatt** | Heavy judgment over the whole site + SEO/discoverability lens |
| Content Shift ×2 | `0 17,23 * * *` | Fable | [`runner-prompts/content-shift-run.md`](runner-prompts/content-shift-run.md) | **Wyatt** | Heaviest: research + writing |
| Kevin — S1 Karen solver | `17 11 * * *` | Fable | [`runner-prompts/kevin-stream1-karen.md`](runner-prompts/kevin-stream1-karen.md) | **Wyatt** | Fixes cie tickets; runs after Karen, before the brief |
| Kevin — S2 user digest | `13 15 * * *` | Fable | [`runner-prompts/kevin-stream2-digest.md`](runner-prompts/kevin-stream2-digest.md) | **Wyatt** | Daily feedback digest for human accept/reject |
| Kevin — S3 eng triage | `43 15 * * *` | Fable | [`runner-prompts/kevin-stream3-triage.md`](runner-prompts/kevin-stream3-triage.md) | **Wyatt** | Buckets Joey's eng tickets → Austin intake |
| Kevin — S3 comment radar | `23 1,13 * * *` | Fable | [`runner-prompts/kevin-stream3-radar.md`](runner-prompts/kevin-stream3-radar.md) — lazy: cheap poll, loads charter only on a hit | **Wyatt** | Twice daily (~6am + 6pm PT); surfaces cross-session comments — cut from hourly 2026-07-24 to reduce token burn (Wyatt) |
| Karen — nightly scan | `0 9 * * *` | Fable | [`runner-prompts/karen-nightly.md`](runner-prompts/karen-nightly.md) | **Wyatt** | Solves work (integrity + link-rot sweep); 2 AM PT |
| Paul Blart — security patrol | `7 12 * * 1` | Fable | [`runner-prompts/paul-blart-run.md`](runner-prompts/paul-blart-run.md) | **Wyatt** | Dependency/supply-chain security; weekly, judgment on Dependabot/CodeQL |
| Laura — a11y walk | `0 15 * * *` | Fable | [`runner-prompts/laura-walk.md`](runner-prompts/laura-walk.md) — needs Web tools + npx axe/pa11y | **Wyatt** | Accessibility (WCAG 2.2 AA); public-site legal + reach |
| watchdog / brief-mailer / CI / CodeQL / a11y | GitHub Actions | none | `.github/workflows/` | repo | Zero LLM (detection layer) |

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
titles its own PRs with a fixed prefix — currently just **Content Shift**
(`content(shift): ` prefix, checked against a 30h window — its cadence is
17:00/23:00 UTC, so 30h tolerates one missed slot before alerting). Extending
to another cloud-routine agent (Nils, Kevin, Karen, Laura, Paul Blart,
Austin, Growth) is a few-line addition to the same job in `watchdog.yml`,
once/if one of them is actually observed going dark the same way — not
pre-built speculatively for all of them now.

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
