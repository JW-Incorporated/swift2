# Tier-2 optimization — cost/benefit analysis of every Claude desk routine

**Commissioned by Joey, 2026-08-31; analysis by Fable (claude-fable-5).**
Scope: **Tier 2 only** — the 24 Claude desk routine triggers indexed in
[`AUTOMATION.md`](AUTOMATION.md) § Tier 2 and registered in
[`agents/runners.md`](agents/runners.md). This is an **analysis document**:
nothing here has been executed, disabled, or edited. Each recommendation names
who may act on it — most are reversible agent calls; **four are founder
decisions** (T-6, T-7, T-11, T-16) and one more (T-12) needs a routine
founder-approved charter PR, and each says so inline. (Another, T-15, was
an open founder decision when this analysis began and was resolved by Joey
the same day — it is kept below for the record.)

Companions: the 2026-08-31 audit
([`automation/review-2026-08-31.md`](automation/review-2026-08-31.md), REC-1…7,
which covers all three tiers) and the doc-quality report
([`automation/doc-quality-2026-08-31.md`](automation/doc-quality-2026-08-31.md)).
Where a REC already covers a Tier-2 item, this file deepens it rather than
re-deriving it, and cross-references it by ID.

## Method and evidence base

Assessed against the project's actual goals, not generic best practice:

- [`vision.md`](vision.md) — recent-news + era time travel; **notifications are
  the differentiator and over-notifying is the named failure mode**.
- [`roadmap.md`](roadmap.md) — launch-ops goals: #1 growth, #2 keeping fans
  loving the app.
- [`decisions.md`](decisions.md) and every Tier-2 charter/prompt file under
  [`agents/`](agents/) and [`agents/runner-prompts/`](agents/runner-prompts/).

Hard cost evidence this repo actually records (used throughout; nothing else
is treated as a number):

| Evidence | Source | What it establishes |
|---|---|---|
| Self-armed PR check-ins were ~144 runs/day, **~69% of all scheduled agent token spend**, before 2026-07-25 | `runners.md` § Token-burn audit; `auto-merge-content.yml` header | Cold-boot session **count** is the dominant Tier-2 cost driver, not per-session verbosity |
| Post-cleanup fleet: **~15 Swift2 runs/day across 20+ runners** (2026-07-26 recount) | `runners.md` § Where the runs actually go now | The fleet is already near its floor; remaining wins are structural, not bulk cuts |
| The Vault Run consolidation would save **~3.9 cold-boot sessions/day** and is half-done | `runners.md` § "The Vault Run is LIVE"; `vault-run-plan.md` Phase 4; REC-2 | The single largest quantified Tier-2 saving still on the table |
| Karen Deep is costed at **≈1.0M tokens/night ≈ $114/month on Sonnet 5** (estimate from measured batch sizes) | `runners.md` § Karen Deep "What it costs" | The only routine with a written per-run cost model — and it has never been created |
| Every content PR costs two CI runs; CI was ~77% of Actions minutes at 90% of the included quota (2026-07-27) | `vault-run-plan.md` § Why | Tier-2 PR count has a real Tier-1 minutes cost attached |

**No per-routine token telemetry exists for anything else.** Every other cost
statement below is expressed in *sessions/day on a given model tier* — the one
unit the repo's own audits use — and marked estimable or not. The telemetry gap
itself is an actionable item (T-17).

Model-tier shorthand (cost ordering only, per `runners.md` § Model tiering):
**Haiku 4.5 < Sonnet 5 < Opus 4.8 ≈ Opus 5 ≲ Fable 5.** The 2026-07-25 tiering
rule stands: deterministic poll → Haiku; script-and-summarize → Sonnet; genuine
authoring/adjudication/security judgment → Opus+.

---

## Per-routine analysis

Routines are grouped as in `AUTOMATION.md`. Trigger IDs and live models are
from `runners.md`'s Live-trigger table (verified 2026-08-27). Recommendation
IDs are **T-1 … T-19**; the cost/benefit rows are consolidated in the table at
the end.

### A. Content lanes (9 triggers)

#### A1. The Vault Run — orchestrator (daily 16:07, Opus 4.8)

- **Current state.** Runs all six content lanes sequentially in one session,
  one PR, one commit per lane
  ([`vault-run.md`](agents/runner-prompts/vault-run.md), plan:
  [`vault-run-plan.md`](agents/vault-run-plan.md)). Reviewed by CI +
  auto-merge + post-merge audit (Karen/Nils). Historical ~25% miss rate
  (no PR on 08-01/02/08); `watchdog.yml`'s 36h `vault/` liveness check now
  covers that.
- **Assessment.** The design is correct and the rationale (one writer for the
  shared generated vault removes a conflict-by-construction bug class) is the
  strongest architecture argument in the fleet. The problem is that **Phase 4
  never landed**, so the orchestrator runs *in addition to* the six standalone
  lanes it replaces — every stated win is unrealized or inverted, and Rumor
  Desk (the highest privacy-liability lane, auto-merged with no human read)
  runs effectively **daily** across two schedulers instead of its designed
  every-other-day cadence. Per REC-2, everything Phase 4 was blocked on in
  August has since cleared; the two remaining preconditions are observations
  (confirm lane 2 ships; read each trigger back before writing).
- **Recommendation (T-1) — finish Phase 4: retire the standalone lanes one at
  a time, Rumor Desk first.** Disable (never delete) each standalone trigger
  after reading back its full `job_config`, watch one full cycle, proceed.
  Then delete the `content-shift/` row from `watchdog.yml`'s lane table as the
  plan prescribes. Saves **~3.9 cold-boot sessions/day** (three daily lanes +
  Rumor at ~0.52/day + Cross-Link 2/wk + Stylist 1/wk), cuts ~4.2 content
  PRs/day → ~1 (≈260 Actions min/month per the plan), and — the real point —
  restores the *designed* cadence of the privacy-sensitive lane. Reversible in
  two minutes per the plan's rollback section; agent call, not founder-gated.
  Joey should be *told* the Rumor Desk has been publishing daily, per REC-2.

#### A2. Content Shift — standalone (daily 17:00, Opus 4.8)

- **Current state.** Charter [`content-shift.md`](agents/content-shift.md);
  the core authoring desk — intake, experience tickets, current-tier
  promotions. Reviewed by CI + Codex-degradable + Karen/Nils post-merge.
- **Assessment.** The desk itself is well-designed and correctly on Opus
  (genuine research + writing). But as a *standalone trigger* it duplicates
  Vault lane 1, which runs 53 minutes before it every day.
- **Recommendation.** Covered by **T-1** — this is one of the six standalone
  lanes Phase 4 disables. The charter, prompt file, and queue mechanics all
  survive as Vault lane 1. No separate action.

#### A3. Answerer (daily 13:50, Opus 4.8)

- **Current state.** Depth-engine writer draining `curiosity-ledger` /
  CIE depth rollups
  ([`answerer.md`](agents/runner-prompts/answerer.md)); no charter. Cut from
  every-2h to daily in the 2026-07-25 sustainment pass.
- **Assessment.** Correct model tier (genuine authoring); correct cadence.
  Phase-4 precondition 3 recorded that Vault lane 2 was mis-gated and no-oped
  while the standalone did the real work; lane 2 has since been repointed and
  must be **observed shipping** before this one is disabled — the plan already
  says so.
- **Recommendation.** Covered by **T-1**, with the explicit ordering caveat
  above (this is the lane where "one at a time, watch a cycle" earns its
  keep). No separate action.

#### A4. Photo Enrichment worker (daily 06:21, Sonnet 5)

- **Current state.** Fills missing photos + embedded Instagram posts, queue
  driven by the deterministic `social-post-missing` checker
  ([`photo-enrichment-worker.md`](agents/runner-prompts/photo-enrichment-worker.md)).
- **Assessment.** Model tier right (mechanical field-filling with a
  vision-verify step, on Sonnet). Duplicates Vault lane 3. Historically the
  source of the stranded-red-PR class (#1545/#1565/#1585) — an argument *for*
  consolidation, since the Vault Run's STEP-0 adoption path is the recovery
  mechanism those standalone PRs lacked.
- **Recommendation.** Covered by **T-1**. The "Vault Filler" consolidation
  idea still listed in `runners.md` § Still-to-do (Cross-Link/Audio/Mood/Photo
  into one rotating runner) is **superseded** by the Vault Run and should be
  struck from that list when Phase 4 completes (doc fix, rides along).

#### A5. Rumor Desk (odd days 14:47, Opus 4.8)

- **Current state.** Highest privacy-liability lane: admits/adjudicates
  unsettled claims under `privacy-redlines.md`; auto-merges with no human
  read. Interleaves with Vault lane 4 (even days) into undesigned daily
  coverage — confirmed on `main` this week (standalone commits 08-25/29/31,
  lane commits on even days).
- **Assessment.** Opus is the *right* spend here — `runners.md` explicitly
  rejected a two-pass review everywhere else but named Rumor Desk as the one
  place it would earn its cost if a redline miss ever ships. The urgent defect
  is the double scheduler, which roughly doubles throughput on exactly the
  lane where volume × no-human-read = liability.
- **Recommendation.** Covered by **T-1** — and this is the lane to disable
  *first*, per REC-2. Additionally **(T-2)**: when Phase 4 lands, record in
  the lane file that Rumor Desk is the standing candidate for a
  Sonnet-drafts/Opus-reviews second pass *if a privacy miss ever ships* —
  keeping the 2026-07-25 "not adopted, revisit-if" decision attached to the
  lane that motivated it rather than buried in the registry. Doc-only,
  trivial.

#### A6. Cross-Link builder (Mon+Thu 09:51, Sonnet 5)

- **Current state.** Turns deterministic `crosslink-opportunity` findings into
  authored `relatedIds`
  ([`cross-link-builder.md`](agents/runner-prompts/cross-link-builder.md)).
- **Assessment.** Right tier, right cadence, exemplary
  Tier-1-detects/Tier-2-judges split. Duplicates Vault lane 5.
- **Recommendation.** Covered by **T-1**. No separate action.

#### A7. Stylist (Sun 16:33, Sonnet 5)

- **Current state.** Shop-link sourcing + liveness upkeep
  ([`stylist.md`](agents/runner-prompts/stylist.md)); exits quietly if the
  shoppable-links foundation isn't on `main`.
- **Assessment.** Right tier and cadence; ~1 session/week is near-free.
  Duplicates Vault lane 6. One design note: its liveness re-check batch (~15
  URLs/run) is a deterministic curl loop a Tier-1 Action could do —
  `merch-verify.yml` already does exactly this shape for merch links. Not
  worth a new workflow *while* the lane rides in the Vault Run for free; worth
  remembering if the product corpus grows.
- **Recommendation.** Covered by **T-1**. No separate action.

#### A8. News Triage (daily 15:40, **Opus 4.8**)

- **Current state.** Converts `news_story` rows (from Tier-1
  `news-worker.yml`, every 4h) into `intake` issues under the
  adjudicability bar + privacy redlines
  ([`news-triage.md`](agents/runner-prompts/news-triage.md)).
- **Assessment.** Cadence right (daily, downstream of a 4-hourly
  deterministic feed). **Model drifted from the tiering decision:** the
  2026-07-25 tiering table places News Triage on **Haiku** ("cheap poll /
  bucketing"), but the live trigger runs **Opus 4.8**. The job is real but
  bounded: classify, check redlines, file issues — it authors nothing that
  ships. Haiku is too thin for the redline/location-rule judgment (a
  misclassification here reaches authored content in one hop, as its own
  prompt warns), but Opus is over-tiered for it.
- **Recommendation (T-3) — move News Triage to Sonnet 5.** One trigger-model
  change (full `job_config` round-trip per the RemoteTrigger footgun). Saves
  one Opus session/day. The risk is **asymmetric and lands on false
  negatives**: a wrongly-*filed* story is caught downstream (Content Shift
  re-verifies sources before authoring), but a wrongly-*rejected or
  overlooked* story is simply never filed — intake issues are the ONLY thing
  Content Shift reads, so nothing downstream can recover a miss. Two
  mitigations, both required: (a) a **labeled-sample recall check against a
  replayable corpus**, not a volume comparison — filed-fraction varies
  legitimately with the news cycle, so it cannot distinguish a Sonnet miss
  from a quiet week. And a replay needs a snapshot, because the routine does
  not read `news_story` directly (it is deliberately denied the service-role
  key): it reads `docs/content-ops/news-candidates.md` on the `news-digest`
  branch, which `scripts/news/emit-candidate-digest.mjs` regenerates after
  every ingest, and the run log only *summarizes* refusals — the routine's
  exact inputs are not preserved anywhere today. So the trial design is:
  during the 2-week trial, archive each day's digest as consumed (a dated
  copy on the `news-digest` branch or an Actions artifact — a few lines in
  the digest-emit step, deterministic, zero LLM), then run one weekly Opus
  pass that re-triages the archived digests (including refusals) and diffs
  decisions. Any story Opus would have filed that Sonnet refused or
  overlooked is a counted false negative; **any counted false negative
  reverts the change** (missed stories are unrecoverable downstream, so the
  rollback bar is zero tolerance, not a budget). That is 2 extra Opus
  sessions plus a trivial archive
  step, against ~14 Opus sessions saved — the trial pays for itself even
  before the standing saving; (b) the prompt already requires stating what was
  reviewed-and-refused per run, which makes silent-drop auditable. Revert is
  one field. Update the tiering table's Haiku row to Sonnet in the same PR so
  the doc and the decision match (the table's original Haiku call predates
  the 2026-07-20 redline tightening that made this a judgment job).
  Reversible; agent call.

#### A9. Lex depth (disabled warm spare, Opus 4.8)

- **Current state.** Paused since 2026-07-25; five-plus weeks with no thaw
  condition recorded (REC-5). Zero token cost.
- **Assessment.** Costs nothing but is an undocumented live-able trigger — a
  liability by the audit's own standard. Its job (generate depth questions as
  issues) is subsumed by Karen's CIE depth rollups feeding the Answerer.
- **Recommendation (T-4) — write the one-line thaw condition into
  `runners.md`, or propose deleting the trigger (founder-gated).** Suggested condition, grounded in
  what actually replaced it: "revive only if the Answerer's queue
  (curiosity-ledger + CIE depth rollups) is empty for 14+ consecutive days
  while DEPTH gates remain unmet." If nobody will sign that line, propose
  deleting the trigger to Joey with the other founder items — its prompt is
  preserved verbatim in
  [`lex-depth.md`](agents/runner-prompts/lex-depth.md), so deletion loses
  nothing and it can be recreated from the file, but removing the persistent
  trigger record still sits under `CLAUDE.md`'s data-deletion gate (same
  ruling as T-14). Writing the thaw condition is trivial and agent-callable;
  it already resolves the audit finding on its own.

### B. Quality and integrity desks (5 triggers)

#### B1. Karen — weekly judgment slice (Sun 09:00, Sonnet 5)

- **Current state.** The registered name says "nightly scan" but the live
  cadence is weekly (resolved 2026-08-27); the deterministic half now lives in
  Tier-1 `cie-scan.yml` (daily, zero LLM). `runners.md` already prescribes the
  follow-up: trim the routine to the judgment pass only.
- **Assessment.** This is the repo's own poster child for the
  Freshness-on-Actions/judgment-on-routines split, executed after the 10-day
  dark incident. What remains mis-fitted: the routine still runs a bounded
  version of the scan the Action now owns — duplicated deterministic work
  inside an LLM session — and the *actual* judgment half (Karen Deep) has
  never been created (see B6/T-6).
- **Recommendation (T-5) — trim the weekly routine to the judgment-only pass
  `runners.md` already prescribes**, and rename the trigger to match reality
  ("Karen — weekly judgment slice") so the next audit doesn't re-litigate the
  nightly/weekly contradiction. Token impact: down slightly (shorter
  sessions); quality neutral (the Action covers detection daily, better than
  the routine's weekly slice ever did). Trivial-to-moderate; agent call.

#### B2. Nils — site walk (Sun 14:00, Opus 4.8)

- **Current state.** Charter [`nils.md`](agents/nils.md) says **daily**; the
  2026-07-25 sustainment override made it **weekly**, still in force. Walks
  the live site with a rotating slice, files ≤5 `experience` tickets/run.
- **Assessment.** Opus is right — this is the "is it worthy" judgment desk,
  and vision/roadmap put experience quality at the center. Weekly cadence is
  defensible in sustainment mode but sits oddly against a content engine that
  ships daily via auto-merge with *no human read*: Nils and Karen are the
  stated post-merge audit that replaced pre-merge founder review
  (Marjorie charter, amendment 6). At weekly cadence, auto-merged content can
  be live for up to 7 days before any judgment desk sees it.
- **Recommendation (T-7) — reconcile the charter to the live weekly cadence
  (doc fix), and put the cadence question itself to Joey as a cheap,
  explicit dial** (Joey is the sole active decision-maker per `CLAUDE.md`;
  no call routes to Wyatt): weekly (status quo, ~4 Opus sessions/month) vs. twice
  weekly (~9/month) vs. restore daily (~30/month). This is a
  quality-vs-token tradeoff on the site's core experience — **product-
  direction-adjacent, so the dial setting is flagged for a founder pick**, but
  the recommendation is twice-weekly (Mon+Fri): it halves the worst-case
  window on auto-merged content for ~1 extra Opus session/week. Moderate
  benefit, trivial effort.

#### B3. Laura — a11y walk (daily 18:20, Sonnet 5)

- **Current state.** Charter [`laura.md`](agents/laura.md). Daily walk
  reading Tier-1 `a11y.yml` artifacts (also daily), ≤5 tickets/run; the
  manual-AT queue (`docs/a11y-manual-queue.md`) historically accumulated
  without closure.
- **Assessment.** The deterministic/judgment split is right. The **cadence is
  over-fitted**: axe/pa11y regressions are caught daily by the Action either
  way, and Laura's judgment adds interpretation + spec-writing on top — but
  the UI surface she audits changes on code merges, which are far rarer than
  content merges (content changes rarely alter the DOM patterns a11y findings
  key on). A daily Sonnet session re-reading a mostly-unchanged artifact set
  is script-and-summarize work at judgment cadence.
- **Recommendation (T-8) — cut Laura to twice weekly (Tue+Fri), keeping
  `a11y.yml` daily — WITH a matching slice redesign, not a cadence flip
  alone.** Her walk is a rotating slice sized so that *daily* runs cover the
  whole site weekly (marquee surfaces every run); halving the run count
  without re-slicing would silently break that whole-site-per-week guarantee
  and leave non-marquee pages unreviewed for weeks. So the change is two
  edits in one PR: (a) cadence to `2×/wk`, (b) each run's slice widened
  ~3.5× (the walk is engine-driven — axe/pa11y over more pages is minutes of
  runtime, not a proportional token increase, since the judgment pass reads
  violation lists, not pages). Marquee-every-run is preserved. What genuinely
  lengthens: the window for *new automated regressions on non-marquee pages*
  (the daily Action covers only its configured pages, not the whole site) and
  for manual-residual flagging — worst case moves from ~1 to ~4 days.
  Net saving is the ~5 Sonnet cold-boot sessions/week; per the fleet's own
  evidence, session count is the cost driver, so fewer-but-wider runs keep
  most of the saving. Reversible; agent call. Risk if wrong: a code merge
  introducing a subtle a11y regression on a non-marquee page waits up to 4
  days for a *spec* (not for marquee detection) — acceptable against WCAG
  deadlines measured in months.

#### B4. Paul Blart — security patrol (Mon 22:20, Opus 4.8)

- **Current state.** Weekly triage of Dependabot/CodeQL/snapshot output
  ([`paul-blart.md`](agents/paul-blart.md)); Tier-1 lanes (Dependabot ×2,
  CodeQL, `dependabot-alerts-snapshot.yml`) do all detection.
- **Assessment.** Textbook-correct design: weekly cadence matched to
  Dependabot's weekly grouped bumps, security lane arrives on its own faster
  Tier-1 path regardless, Opus justified by the charter's reachability /
  supply-chain-tell judgment (the tiering table explicitly keeps security
  judgment on Opus). ~4 sessions/month.
- **Recommendation — keep as-is.** The only cheaper design (Sonnet) trades
  against the one desk where a subtle miss (maintainer-identity change,
  reachability call) has security consequences, to save ~4 Opus→Sonnet deltas
  a month. Not worth it.

#### B5. Routine Auditor — fleet invariants (Sun 16:11, Haiku 4.5)

- **Current state.** Weekly invariant check
  ([`routine-invariants.md`](agents/routine-invariants.md)); cheapest model in
  the fleet; list/get only; reports to one evolving issue.
- **Assessment.** Keep — it is the only detection layer for a failure class
  the repo cannot see (the 2026-07-25 runaway loops left no git/issue/CI
  trace). Its risk surface *widened* on 2026-08-23 when the
  `Claude_Code_Remote` exclusivity invariant was removed by founder decision:
  every routine can now mint triggers, and the auditor's remaining tripwire
  is the ≤35 enabled-count ceiling.
- **Recommendation (T-9) — extend the auditor's checklist (prompt-file PR,
  then re-sync the trigger) with two cheap checks:** (a) flag any enabled
  trigger not present in `runners.md`'s live table, and any trigger whose
  *name* is absent from `AUTOMATION.md` — the drift class that produced nine
  unregistered runners; (b) flag any routine past a recorded retirement
  condition (Getty purge is the live example). Costs nothing at run time
  (same Haiku session, a few more list/greps); closes the "undocumented live
  routine" gap at the layer that already runs weekly. Respecting invariants:
  this *adds* checks, changes none; the auditor's own operating limits
  (list/get only, no create/update) are untouched. Trivial; agent call.
  **Landed 2026-08-31** — checklist in
  [`routine-invariants.md`](agents/routine-invariants.md#additional-checks-t-9-2026-08-31--docstier2-optimizationmd--b5).

#### B6. Karen Deep — agent review (SPECIFIED, NEVER CREATED)

- **Current state.** Fully specified 2026-08-11 with prompt file, cron, model,
  and the fleet's only written cost model (≈$114/month on Sonnet at list;
  dials documented down to ≈$66/month) — and it has sat uncreated for three
  weeks. It is the *judgment* half of Karen: fabricated events/quotes,
  wrong-subject images, safety classification, against a 1,137-item backlog
  that has never been agent-reviewed.
- **Assessment.** This is the largest *quality* gap in Tier 2. The fan site's
  credibility claim in `vision.md` is "stories are real"; nothing currently
  reviews the merged corpus for fabrication at depth (the weekly Karen slice
  is bounded and the deterministic scan can't judge). But it is **new
  recurring spend with a written price tag**, and the checklist in
  `AUTOMATION.md` § Adding-a-routine says new recurring spend is a founder
  decision.
- **Recommendation (T-6, founder-gated: spend) — put Karen Deep to Joey
  as a yes/no with the recorded dials** (all founder decisions route to Joey
  per `CLAUDE.md`): full spec exists; ≈$114/mo
  (or ≈$66/mo at half-batch) on Sonnet; ~20-27 nights to first full corpus
  pass, then a 3-4-week standing refresh. If approved, creation is mechanical
  (config table in `runners.md` § Karen Deep). If declined, record the
  decline in `decisions.md` and delete the "NOT CREATED" warning rows so the
  registry stops advertising a phantom routine. Either outcome beats the
  current state (a specified, costed, un-decided routine).

### C. Ticket operations and build (5 triggers)

#### C1-C3. Kevin — S1 Karen solver (Sun 11:17, Opus 4.8), S2 user digest (daily 15:13, Sonnet 5), S3 eng triage (daily 15:43, Sonnet 5)

- **Current state.** Contract in [`kevin.md`](kevin.md). Three separate
  cold-boot sessions; S2 and S3 run 30 minutes apart every day, each cloning
  and reading the same charter. `runners.md` § Still-to-do has already named
  the fix: consolidate S1+S2+S3 into ONE daily session (one clone, one
  charter read), radar staying separate.
- **Assessment.** Models are right per tier (S1 applies sourced fixes —
  Opus; S2/S3 are digest/bucketing — Sonnet). The waste is structural: three
  boots where one serves. The streams are read/write-disjoint (different
  labels, different outputs), so sequential execution in one session carries
  no coupling risk beyond session length — and the streams are individually
  small.
- **Recommendation (T-10) — execute the registry's own consolidation: one
  daily "Kevin desk" session running S2 + S3 (+ S1 on Sundays), on Sonnet,
  with per-stream failure isolation on the Vault Run pattern** (a failing
  stream is logged, the run continues). S1's Opus assignment can be preserved
  by keeping S1 as its own weekly trigger if mixed-model matters, but the
  simpler shape — S1's "apply the ticket's suggested fix verbatim,
  verify-first" work is Sonnet-shaped by the tiering table's own definition
  ("mechanical field-filling"), with Karen's ticket carrying the judgment —
  is one trigger, all-Sonnet. Saves ~1 session/day + 1 Opus→Sonnet
  substitution/week. Moderate effort (one merged prompt file + trigger
  round-trips); reversible; agent call.

#### C4. Kevin — S3 comment radar (01:23 + 13:23, Haiku 4.5)

- **Current state.** Lazy poll: one repo-wide API call, loads context only on
  a real hit. Cheapest possible LLM shape; the contract's own endgame
  (webhooks, zero-LLM until an event fires) is recorded in `kevin.md`.
- **Assessment.** At 2 Haiku runs/day with an early-exit prompt this is
  near-floor. A Tier-1 replacement (Action on `issue_comment` events posting
  to the radar issue) would be strictly cheaper and *faster* (event-driven
  vs. up-to-12h latency) — but it needs judgment for the "is this a review
  finding / a decision answer" bucketing, so the Action could at most
  *detect-and-wake*, and GitHub Actions can't wake a Claude routine. Not
  worth building scaffolding for ~2 Haiku sessions/day.
- **Recommendation — keep as-is**; fold into the service-port endgame when
  Kevin ports. No action now.

#### C5. Austin — build runs (daily 21:00, Fable 5)

- **Current state.** Charter [`austin.md`](agents/austin.md) (its Cadence
  section correctly describes an event/hourly deterministic poll with a
  2-starts/day cap; the stale "×2/day `0 16, 0 21`" entry lives in
  `runners.md`'s historical split table — live registry shows one daily
  trigger at
  21:00). Implements small pre-triaged eng tickets + P2/P3 a11y specs;
  WIP-capped; never merges. The one routine on Fable 5.
- **Assessment.** The most expensive model in the fleet on a daily cadence is
  the largest single *model-tier* line item in Tier 2. Is it earning it?
  Austin's scope fence is deliberately narrow — ≤5 files, ≤150 lines,
  pre-diagnosed tickets, no API routes/migrations/deps — i.e. the charter
  itself engineers the judgment *out* of the task. A bounded, spec-following
  implementation job with mandatory independent Codex review behind it is
  the profile the tiering table assigns to Opus at most. Counter-argument:
  code defects are costlier than content defects, and the 2026-07-20
  incident where the fleet silently failed *on* Fable argues for stability
  wherever it now works. That incident is 6 weeks old and Austin has run on
  Fable since — the reliability question is settled; the price question
  isn't, and no telemetry exists to quantify it (see T-17).
- **Recommendation (T-11, founder-gated: model pin in charter) — propose a
  two-week Austin trial on Opus 4.8 to Joey**, judged
  by the metrics his charter already names (Codex findings-per-PR, rework
  rate) against the Fable baseline weeks. If findings-per-PR degrades,
  revert — a one-field trigger change either way. This cannot be a bare
  agent call: the charter pins the lane to Fable "unless founders say
  otherwise" (`austin.md` § Cadence), so the trial starts only on a recorded
  founder yes (a one-line Joey approval satisfies it; the charter text
  itself already anticipates the override). Also fix the stale ×2/day
  `0 16, 0 21` entry — which lives in `runners.md`'s historical split
  table, *not* the charter (the charter's Cadence section correctly
  describes the event/hourly poll with a 2-starts/day cap) — to match the
  live single daily run (registry doc fix, rides along with T-19).
  Reversible; token impact: down (Fable→Opus delta ×
  ~30 sessions/month); quality risk: bounded by the mandatory Codex review
  gate that already exists.

### D. Founder-facing and social planning (4 triggers)

#### D1. Marjorie — 6 AM Founders' Brief (daily 12:00, Opus 4.8)

- **Current state.** Deterministic skeleton
  (`assemble-brief.mjs`) + judgment curation pass; mailed by Tier-1
  `brief-mailer.yml`; the fleet's worst reliability history, now stable on
  Opus 4.8 after the deliberate 2026-07-26 move *off* Fable.
- **Assessment.** Right design (script computes, model curates), right
  cadence (founder-set), and the model choice is a documented deliberate
  decision with a reliability rationale. One drift: the charter still says
  "**pin to Fable**" (Joey's 2026-07-11 call) while the live trigger runs
  Opus 4.8 per the 2026-07-26 decision that superseded it in practice — the
  charter was never amended, and charters outrank prompts.
- **Recommendation (T-12) — reconcile the charter's model line to the
  2026-07-26 decision** (founder-approved charter PR, since charter changes
  are founder-approved by the charter's own rule — flag as
  **founder-gated: product_direction-adjacent governance**, though it is a
  paperwork ratification of a decision already made and referenced in
  `runners.md`). Otherwise keep as-is; this desk is load-bearing for the
  founder-visibility requirement and is not a place to save tokens.

#### D2. Marjorie — 8 PM Evening Delta (daily 03:00, Fable 5, comment-only)

- **Current state.** Email retired 2026-08-23 under Joey's 1-2-email cap;
  the trigger still burns a **Fable** session every day to post a GitHub
  comment with no established reader (REC-5 finding). Note the irony: the
  fleet's most expensive model, on the fleet's least-read artifact.
- **Assessment.** The delta *comment* has no reader — the morning brief's
  "Last 24 hours" section carries the same information a day later, and the
  watchdog carries anything urgent via T3 paging. But the run is not only
  the comment: `marjorie-delta.md` also has it (a) process founder checkbox
  decisions and 📧 email replies posted since the morning run, (b) run an
  evening merge sweep over qualifying green PRs, and (c) recreate a missing
  morning brief in degraded mode. Disabling it removes the fleet's second
  daily execution window for those duties: founder decisions/replies posted
  after ~6 AM LA would wait until the next morning run, and in-envelope PRs
  going green in the afternoon would wait overnight for merge (though
  `auto-merge-content.yml` already lands green *content* PRs on its own, so
  the gap is non-content in-envelope PRs only). This is a real latency
  trade, not a free deletion — the precedent is the 2026-07-25 sustainment
  pass, which disabled this same trigger and explicitly accepted that
  "autonomous merge cycles cover the gap."
- **Recommendation (T-13) — disable the trigger (warm spare, prompt preserved
  in `marjorie-delta.md`), per REC-5, explicitly re-accepting the same
  overnight-latency trade the 2026-07-25 sustainment pass made:** founder
  decisions/replies and non-content merge sweeps posted after the morning
  run wait for the next morning run (auto-merge covers green content PRs;
  the watchdog covers urgent breakage; degraded-mode brief creation moves
  back to the morning run that already owns it). Saves ~30 Fable
  sessions/month — in model-tier terms plausibly the second-largest single
  saving in this document after T-1. Tell Joey it happened *and name the
  latency trade in that note* (he set the email cap; the delta comment's
  retirement follows his own directive's logic — but the evening
  decision-processing window is his to veto); do not wait on
  him. Trivial; reversible in two minutes; agent call.

#### D3. Tree — weekly social plan (Mon 10:00, Opus 5)

- **Current state.** Charter [`tree.md`](agents/tree.md); one Opus session
  weekly; owns `social/calendar.md`; its own budget section calls it the
  cheapest standing desk, and its report is one of exactly two founder emails.
- **Assessment.** Correct in every dimension: genuine strategy judgment
  (the charter's own argument against a cheaper tier — restoring the formula
  loop — is empirically grounded in the 2026-08-11 audit), minimal cadence,
  14-day calendar buffer making missed runs non-events, founder feedback loop
  wired in.
- **Recommendation — keep as-is.** The only note: it is the fleet's sole
  Opus **5** runner while everything else judgment-tier sits on 4.8;
  harmonizing is *not* recommended — upgrading the fleet is a separate
  deliberate decision per the 2026-07-26 note, and downgrading Tree to match
  would spend reliability-risk to save ~4 sessions/month on the desk whose
  drift the founders literally noticed from a screenshot.

#### D4. Growth — daily draft (daily 11:00, Opus 4.8)

- **Current state.** Charter [`growth.md`](agents/growth.md). Since
  2026-08-11 it *drafts Tree's calendar* rather than inventing strategy; but
  since 2026-07-25 there is **no human between its captions and the live
  timeline** — the desk's judgment is the only editorial gate on a public,
  reputational surface (its charter says exactly this).
- **Assessment.** The drafting task narrowed (calendar says what; the desk
  writes it), which superficially argues Sonnet. But the charter's
  "What this moves onto the drafting run" section is explicit that the
  blocklist, sourcing, and never-invent rules are now enforced *only* by this
  run's judgment before text ships publicly under the product's name. A
  caption that hits the #36/Clownbot blocklist or asserts an unsourced claim
  is a public-facing incident, and `check-drafts.mjs` checks structure, not
  truth.
- **Recommendation — keep on Opus 4.8.** This is the same reasoning the
  tiering table already applied ("Growth — genuine authoring"), and it has
  strengthened, not weakened, since per-item human approval was removed. Flag
  only for re-evaluation if a deterministic fact-gate (e.g. captions
  restricted to Vault-sourced strings) ever lands.

### E. One-off / outside the standing fleet (1 trigger)

#### E1. swift2 Getty purge — GitHub GC watch (03:00 + 15:00, Sonnet 5)

- **Current state.** Self-retiring one-shot created 2026-08-15 for a
  completed purge; still enabled at **2 sessions/day** with no prompt file
  and no retirement receipt (REC-5).
- **Assessment.** At ~60 Sonnet sessions/month it is likely the most
  expensive *stale* item in the fleet — a watchdog for an event that has
  passed, running more often than most live desks.
- **Recommendation (T-14) — read the trigger; if the purge is confirmed
  complete, archive its full configuration in-repo, then DISABLE it
  (`enabled:false`, the same reversible mechanism the sustainment pass used)
  and record the receipt in `decisions.md`**, per REC-5. Because this trigger
  has **no prompt file**, its live `job_config` is the *only* record of what
  it does — copy the full config (prompt text, schedule, model) into the
  receipt or a `docs/agents/runner-prompts/` archive entry *before* touching
  it, so the action stays auditable per `CLAUDE.md`'s
  knowledge-lives-in-the-repo rule. Disabling captures the full ~60
  sessions/month saving and is inside standing agent authority; *permanent
  deletion* of the trigger record is a separate, optional hygiene step that
  falls under `CLAUDE.md`'s data-deletion gate and needs Joey's sign-off —
  batch it with the other founder items rather than blocking the saving on
  it. If the purge is somehow still pending, register a prompt file +
  retirement condition on the spot. Trivial; agent call (disable) +
  optional founder item (delete).

---

## Fleet-level items (not per-routine)

#### T-15 — Account placement: RESOLVED 2026-08-31 (Joey, D1=B, PR #3598)

When this analysis began, the live fleet ran on **Joey's** account while the
stated spend policy (`CLAUDE.md`, `runners.md`) said **Wyatt's** — a drift
from the #2258 incident, not a decision (REC-7.5). Joey resolved it the same
day: **D1=B, amend the docs to match reality** — the gap was flagged by the
2026-08-31 audit (PR #3593); the decision record and the doc amendments
landed in PR #3598 ("docs: correct automation account-ownership policy to
Joey (D1=B)", merged to `main` 2026-08-31; see `decisions.md` § 2026-08-31
D1=B). `runners.md` now states plainly that ALL scheduled agent spend
runs on Joey's account and is not to be migrated. No founder gate remains;
kept here for the record because every token recommendation in this file
counts against that (now-canonical) account limit.

**Residual drift #3598 missed:** `CLAUDE.md` still carries the old rule in
two places ("Scheduled runners live on Wyatt's account so Joey's weekly
limit stays free", lines 76–77, and the Wyatt's-account fleet line near
line 164). Until those lines are amended, the root operating manual
contradicts `runners.md`'s now-canonical statement. The decision itself is
made and recorded — this is purely a docs-completion follow-up, and it is
folded into **T-19**'s consolidated drift-fix pass below (the CLAUDE.md
lines are governance text, so that PR takes the routine founder sign-off
T-19 already requires). Operators in the interim: `runners.md` +
`decisions.md` (D1=B, 2026-08-31) are the fresher, controlling record.

#### T-16 — Notification-quality desk: the one justified NEW routine (founder-gated: spend)

Per REC-7.3 and `vision.md`'s core promise (never over-notify), the copy that
reaches a user's lock screen is the only user-facing surface with **no
judgment desk** — Karen/Nils/Laura cover every other one. The analytics to
judge it now exist (`/api/notifications/metrics`, `deliveries`). Proposed
shape: **weekly, Sonnet 5**, on the standard desk pattern (read last week's
sends/open-rates, file tickets on over-firing or under-performing categories,
≤5 tickets, one log issue, prompt file + registry row + invariants checklist).
~4 Sonnet sessions/month — roughly what T-8 alone frees weekly. New recurring
spend → founder yes/no. If approved, it should launch *after* REC-1's
dispatch heartbeat lands, so it judges data a watchdog vouches for.

#### T-17 — Instrument before optimizing further (the audit's own limit)

Every session-count figure above is hand-derived; `runners.md` § Rules
promises monthly tokens-per-account telemetry that has never existed
(REC-7.4). Recommend the Tier-1 shape REC-7.4 proposes (monthly zero-LLM
Action snapshotting run counts into `docs/audits/`), **plus one Tier-2-specific
line**: have the Routine Auditor's weekly issue comment include the enabled
trigger count and per-routine cadence sum (it already lists triggers — this is
arithmetic, not new capability). This is what turns the next optimization
pass from archaeology into a diff. Trivial-to-moderate; zero tokens for the
Action; agent call. **Landed 2026-08-31** — Actions half:
[`fleet-telemetry-snapshot.yml`](../.github/workflows/fleet-telemetry-snapshot.yml)
+ [`fleet-telemetry-snapshot.mjs`](../scripts/fleet-telemetry-snapshot.mjs),
monthly, writing `docs/audits/fleet-telemetry/`. Auditor-arithmetic half:
[`routine-invariants.md`](agents/routine-invariants.md#auditor-arithmetic-t-17-2026-08-31--docstier2-optimizationmd--t-17).

#### T-18 — Re-sync prompts and registry after the changes land

Several recommendations above (T-1, T-3, T-5, T-9, T-10, T-11, T-13) edit
triggers. The standing rules that must be honored on every one: prompt-file PR
first, then trigger update (`runners.md` § Rules); full `job_config`
round-trip, never a partial PUT (the documented footgun that destroyed
Cross-Link's config once); `Claude_Code_Remote` detachment is UI-only. Budget
this as real execution effort in the action list — it is why "trivial" trigger
changes are honest-trivial only one at a time.

#### T-19 — Fix the known charter/registry drift in one docs pass

Collected above: Nils daily-vs-weekly (T-7), Austin's stale ×2/day entry in
`runners.md`'s historical split table (T-11 — the charter's Cadence section
is already correct),
Marjorie Fable-vs-Opus (T-12), Karen "nightly" naming (T-5), the superseded
"Vault Filler" still-to-do row (A4), Laura's charter cadence if T-8 lands,
and the two `CLAUDE.md` Wyatt's-account lines that PR #3598 missed (T-15's
residual drift — amend to Joey's account per the recorded D1=B decision).
One documentation PR, founder-approved where charters require it. The
doc-quality companion grades these files; stale governance text is how the
last two audits found their worst surprises. Trivial-to-moderate.

---

## Cost/benefit summary table

Token impact is in sessions/day (sd) or sessions/month (sm) on the named
tier — the only unit the repo's evidence supports. "—" = no cost telemetry
exists for a finer number (see T-17). Gate categories — product_direction /
secrets_or_prod_infra / spend / data_deletion_or_force_push — come from the
JW Labs project registry (`policy/project-registry.yaml` in the JW Labs
**policy repository**, not a file in this repo; this task was commissioned
under it, and its gate set is consistent with `CLAUDE.md`'s standing rules on
spend, product direction, and destructive actions). **None of the
recommendations below touches secrets_or_prod_infra or
data_deletion_or_force_push** (Phase 4 disables, never deletes; T-4/T-14's
*agent-authorized* actions likewise only disable stale triggers — T-14's
optional permanent deletion of the trigger record is explicitly
founder-gated under that category, and T-14 requires archiving its config
in-repo first because no prompt file exists for it).

| ID | Recommendation | Token/cost impact | Quality/goal impact | Effort | Risk if wrong | Human gate |
|---|---|---|---|---|---|---|
| T-1 | Finish Vault Phase 4: retire 6 standalone lanes, Rumor first | **▼▼ ~3.9 sd** (mixed Opus/Sonnet) + ~260 Actions min/mo | **▲** ends undesigned daily rumor cadence; removes conflict bug class | Moderate (6 careful trigger cycles) | A masked Vault-Run miss becomes a real content gap — mitigated by one-lane-at-a-time + 36h watchdog | none (reversible) |
| T-2 | Attach the "Sonnet-drafts/Opus-reviews if a redline ever ships" note to the Rumor lane file | neutral | ▲ preserves a liability decision where it's needed | Trivial | none | none |
| T-3 | News Triage Opus → Sonnet (2-week trial, labeled-sample recall check via weekly Opus re-triage diff) | **▼ 1 Opus→Sonnet sd** | ≈neutral if recall holds (false negatives are unrecoverable downstream — hence the labeled check) | Trivial | a missed story is never filed; revert on any counted false negatives | none |
| T-4 | Lex depth: write thaw condition (agent) or propose deletion (founder-gated) | neutral (already disabled) | ▲ audit hygiene | Trivial | none (prompt preserved in-repo) | none for thaw line; **data_deletion** for optional delete |
| T-5 | Trim Karen weekly to judgment-only; rename | ▼ slight (shorter sessions) | neutral (Action owns detection daily) | Trivial-moderate | none | none |
| T-6 | Karen Deep: founder yes/no on the costed spec | **▲ ≈$66–114/mo NEW** if yes | **▲▲** only fabrication-depth review of the merged corpus ("stories are real" is the vision) | Trivial to decide; creation mechanical | spend without measured yield — mitigated by the documented re-baseline after week 1 | **spend** |
| T-7 | Nils: fix charter; founder picks weekly / 2×wk / daily dial (rec: 2×wk) | ▲ ~1 Opus sm/wk at rec setting | ▲ halves worst-case unreviewed-content window | Trivial | slightly more spend | **product_direction** (quality dial) |
| T-8 | Laura daily → 2×/week with widened slices (Action stays daily) | **▼ ~5 Sonnet s/wk** | ≈neutral (whole-site-weekly preserved via re-slicing; non-marquee detection window +≤3d) | Trivial-moderate (cadence + slice redesign together) | slower a11y detection/spec turnaround on non-marquee pages | none |
| T-9 | Routine Auditor: +2 checklist items (unregistered triggers; passed retirement conditions) | neutral (same Haiku session) | ▲ closes the drift class behind past incidents | Trivial | none | none |
| T-10 | Kevin S1+S2+S3 → one daily session | **▼ ~1 sd** + 1 Opus→Sonnet/wk | neutral (streams disjoint; per-stream isolation) | Moderate | one stream's failure noise obscuring another — mitigated by Vault-style isolation | none |
| T-11 | Austin: propose 2-week Fable → Opus trial to Joey, judged by existing metrics | **▼ ~30 Fable→Opus sm** if approved and it sticks | neutral if metrics hold (Codex gate unchanged) | Trivial | findings-per-PR degrades → revert | **charter model pin** — founder yes required (austin.md § Cadence) |
| T-12 | Marjorie brief: ratify Opus 4.8 in charter | neutral | ▲ charter/reality coherence | Trivial | none | founder-approved charter PR |
| T-13 | Disable Marjorie 8 PM delta (re-accepting the 2026-07-25 overnight-latency trade) | **▼▼ ~30 Fable sm** | ≈neutral for the comment (no established reader); real but precedented latency cost: evening founder-decision processing + non-content merge sweep wait for the morning run | Trivial | evening window turns out load-bearing — re-enable in 2 min | none (tell Joey after, naming the latency trade) |
| T-14 | Getty purge: verify complete, archive config in-repo, disable, receipt (optional later deletion = founder-gated) | **▼ ~60 Sonnet sm** | ▲ hygiene | Trivial | purge not actually complete → check first; no prompt file exists → archive before touching | none for disable; **data_deletion** for optional permanent delete |
| T-15 | Account placement — RESOLVED (D1=B, PR #3598: docs amended to Joey's account); residual `CLAUDE.md` drift folded into T-19 | neutral | ▲ policy coherence (decision done; CLAUDE.md lines pending in T-19) | — (decision landed) | interim readers of CLAUDE.md see the stale rule until T-19 lands | ~~spend~~ resolved 2026-08-31 |
| T-16 | NEW weekly notification-quality desk (Sonnet) | **▲ ~4 Sonnet sm NEW** | **▲▲** guards the product's stated differentiator | Moderate (new desk, full checklist) | ticket noise if analytics too thin — start after REC-1 heartbeat | **spend** |
| T-17 | Token/run telemetry (Tier-1 Action + auditor arithmetic) | ▼ enables future cuts; 0 tokens itself | ▲ next audit is a diff, not archaeology | Trivial-moderate | none | none |
| T-18 | Honor prompt-file-first + full-PUT discipline on all trigger edits | n/a (process) | protects against the documented config-destruction footgun | — | — | none |
| T-19 | One drift-fix docs pass (charters/registry) | neutral | ▲ governance accuracy | Trivial-moderate | none | charter lines need founder-approved PR |

**Net direction if the pre-approved set (T-1,3,5,8,10,13,14) all lands**, in
this table's own figures: T-1 ~3.9 + T-8 ~0.7 + T-10 ~1 + T-13 ~1 + T-14 ~2
≈ **8.5-9 fewer LLM sessions/day**, plus T-3's daily model-tier downgrade,
T-11's ~30/month if Joey approves the trial, and T-5's slightly shorter sessions. The honest
baseline: the 2026-07-26 recount measured ~15 Swift2 runs/day, *before* three
post-recount additions: the Vault Run (+1/day), the Getty purge watch
(+2/day), and the re-enabled Marjorie 8 PM delta (+1/day — disabled in the
2026-07-25 sustainment pass the day before the recount, later re-enabled
under a new trigger id, `runners.md` live table vs. overrides table). So
today's fleet is **~19 sessions/day** (plus weekly cadences), and the
pre-approved set cuts roughly **45-47% of Tier-2 session count**. About a
third of that cut is retiring stale/dead
weight (T-13's reader-less delta comment — with its evening duties
consciously deferred to the morning run — T-14's completed one-shot); the rest is the
Vault consolidation and cadence/structure fixes. Quality-relevant coverage
(Rumor cadence, detection layers, review gates, Laura's whole-site week)
is *improved or preserved* throughout, not traded away. The
two founder-gated spend adds (T-6, T-16) would reinvest a fraction of that in
the two places `vision.md` actually stakes its identity: content truth and
notification quality.

---

## Prioritized action list (benefit-per-effort, work top to bottom)

1. **T-13** — disable the Marjorie 8 PM delta, re-accepting the 2026-07-25
   overnight-latency trade (evening decision-processing and non-content
   merge sweeps wait for the morning run). Biggest single premium-model
   saving available for one trigger flip. *(agent)*
2. **T-14** — verify + archive config in-repo + disable the Getty purge
   one-shot, with receipt (optional permanent deletion goes to Joey with
   the other founder items). *(agent)*
3. **T-1** — execute Vault Phase 4, Rumor Desk first, one lane per cycle. The
   structurally largest win in Tier 2; do it before any other content-lane
   tuning so later measurements reflect the consolidated fleet. *(agent, tell
   Joey about the rumor-cadence fact)*
4. **T-3** — News Triage → Sonnet. *(agent)*
5. **T-9** — extend the Routine Auditor's checklist. *(agent)*
6. **T-8** — Laura to 2×/week. *(agent)*
7. **T-10** — consolidate Kevin's streams. *(agent)*
8. **T-5** — trim + rename Karen's weekly slice. *(agent)*
9. **T-17** — land the telemetry Action so everything above becomes
   measurable. *(agent)*
10. **T-11** — put the Austin Fable→Opus trial to Joey once telemetry exists
    (the trial needs the baseline; the charter's Fable pin makes this a
    founder yes/no). *(founder — charter model pin)*
11. **T-6** — founder decision: Karen Deep, yes at which dial, or recorded
    no. *(founder — spend)*
12. **T-16** — founder decision: notification-quality desk. *(founder —
    spend; sequence after REC-1's dispatch heartbeat)*
13. **T-7** — founder pick on the Nils cadence dial; fix the charter either
    way. *(founder — product quality dial)*
14. ~~**T-15** — fleet account placement~~ — **already resolved** (Joey,
    D1=B, PR #3598, 2026-08-31). Nothing to do.
15. **T-19 + T-12 + T-2 + T-4** — the consolidated docs/governance drift
    pass, batched into one PR (charter lines founder-approved). *(agent +
    founder sign-off)*
16. **T-18** — standing discipline on every trigger edit above, not a
    separate task.

---

*Every routine named in this document traces to a row in
[`AUTOMATION.md`](AUTOMATION.md) § Tier 2, a trigger in
[`agents/runners.md`](agents/runners.md)'s live table, and — with one
exception — a file under
[`agents/`](agents/) or [`agents/runner-prompts/`](agents/runner-prompts/).
The exception is E1, the Getty purge watch, which has **no prompt file**
(that gap is itself part of finding T-14, which requires archiving its
config in-repo before any action).
Nothing was executed. Recommendations marked founder-gated require a founder
decision per the JW Labs policy registry's human_gates (see the note above
the summary table); everything else is
reversible and inside standing agent authority.*
