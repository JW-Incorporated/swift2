# Tree Overhaul — plan of record

Epic: #4117. Source: "Long Live Machine Recheck" assessment (2026-09-11), which
rechecked the 2026-09-10 automation audit and found (a) the social approval
gate live-broken, (b) the feedback loop wired but fed nothing, (c) Tree not
the accountable owner of anything a founder sees.

**Goal state.** Tree is the single accountable social media manager. Every
brief and Reddit prompt in `#longlive-tree` comes from Tree with a stated
"why". A human gate stays before anything goes live. Every ✏️ or ❌ carries a
reason that Tree reads and distills into standing lessons. Tree posts a weekly
strategy brief in the channel, the founder answers in-thread, and next week's
calendar changes because of it. Per-post metrics drive the Monday audit.
Campaign types earn lighter review on measured approval rates. Zero rejections
is a tracked metric that trends down.

**Posture.** Aggressive. Zero users, so build the full end state now and test
after; observation gates apply only to things that need real run data (cron
reliability, API access, first Monday cycles). Each wave is ONE fresh session
with a paste-ready prompt in `waves/`. Humans run the `RUNBOOK.md`.

## Waves

| Wave | Session model | Depends on | Agent time | Output |
|---|---|---|---|---|
| 0 · Plan committed, recheck routine live | (done in the assessing session) | — | 1h | this dir, `plan-recheck.yml`, #4117 |
| 1 · Design | **Opus** (`/model opus`), optional Fable read-only review | — | 2–3h | `docs/specs/tree-overhaul/*.md`, `docs/decisions.md` entries |
| 2 · Unblock the gate + hygiene | **Sonnet**, up to 6 parallel executors | — (independent of Wave 1) | 2–3h | 8 PRs, `SOCIAL_FREEZE` off on evidence |
| 3 · Close the loop | **Sonnet**, up to 6 parallel executors, Codex review | Wave 1 specs approved, Wave 2 merged | 1 day | 7 PRs |
| 4 · Metrics, side doors, ladder *measurement*, sampling | **Sonnet** (researcher first for API scopes; Opus for A2 debug) | Wave 3 merged | 1–2 days | 6 PRs |
| 5 · Autonomy ladder — the *acting* half | **Opus** (authority change; Codex review mandatory) | **checkpoint R4 shows a campaign type at or near eligibility** | 1 day | 3 PRs |
| R1–R4 · Automated rechecks | **Opus** routine (`plan-recheck.yml`) | dates in `checkpoints.json` | 20 min each | comment on #4117 + PR updating this dir |

Wave 2 and Wave 1 are independent; run Wave 2 first (fast, mechanical, gets
the gate working today), then Wave 1.

**Wave 1 is complete** (PR #4135, founder-approved 2026-09-11). A handoff for
any later review session is `WAVE-1-REVIEW-BRIEF.md` in this directory — what
was decided, by whom, on what evidence, and where the weak points are.

## Item map (IDs from the assessment)

Social gate: S1 poll retry · S2 pending-clock + on-demand poll · S3 reason
protocol + feedback ledger · S4 commit rulings, fix stale prompt · S5 Tree
identity on webhook · S6 Reddit completion tracking · S7 live proof + unfreeze
· S8 latency metrics.
Tree: T1 one charter · T2 self-critique + why · T3 per-post metrics · T4
weekly brief in channel, two-way · T5 lessons ledger · T6 side doors through
Tree · T7 autonomy ladder.
Hygiene: A1 watch all routines · A2 e2e quarantine then real fix · A3
telemetry thresholds · A4 quality sampling · A5 guard delete path.

| Wave | Items |
|---|---|
| 1 | specs for S3, T1, T2, T4, T5, T6, T7 (+ ladder policy → decisions.md). **S6 and T3 are deliberately NOT designed in Wave 1** — they are built directly in Waves 3/4 against S3's generic reaction table. R2/R3 must not expect a spec for either. |
| 2 | S1, S2, S4, S5, S7, A1, A2-quarantine, A5 |
| 3 | S3, T1, T2, T4, T5, S6, S8 |
| 4 | T3, T6, **T7-measure** (eligibility computation + the Monday ladder-standing block, read-only), A4, A3 (after 2 snapshots), A2-real-fix |
| 5 | **T7-act** (signed grants, approval schema `v: 3`, policy stamping, posted-under-policy notice, revocation + retraction) |

## Gates (a wave is done only when all hold)

- Every PR: real CI green confirmed by the orchestrator's own `gh pr checks`
  (never an agent's local claim), then merged by the orchestrator. Anything
  touching `scripts/social/**`, `social-approval-*.yml`, `post-queue.mjs`, or
  `auto-merge-content.yml` gets a `codex:rescue --background` review first,
  max two rounds.
- Wave 1: founder has read every spec's "Behavior you will see" section and
  said "approved" in chat; each spec carries a `docs/decisions.md` entry.
- Wave 2: `social-approval-poll.yml` has one scheduled run that completed
  (not just dispatched) with the retry path exercised or idle; PR #4108 (or
  its successor) stamped from a real founder ✅; `SOCIAL_FREEZE=false` set by
  the founder; e2e monitor green on its next scheduled run.
- Wave 3: a synthetic ❌ with a reply lands in `social/feedback/`; a dry-run of
  the daily draft prompt quotes that reason; the Monday brief format renders
  in Discord (dispatch once).
- Wave 4: at least one `social/metrics/posts/*.json` written from a real API
  call; ladder eligibility check runs in the gate and returns "not eligible"
  for everything (correct at day 0); the Monday brief carries the ladder
  standing block for every campaign family.
- Wave 5 **entry** (all three, or the wave does not start): R4 reports at
  least one campaign family at or within two briefs of eligibility; the X
  delete path (`DELETE /2/tweets/:id`) has been exercised successfully against
  a real throwaway post; the founder has re-confirmed the irrevocable-Instagram
  acceptance **at that time**, not on the strength of the 2026-09-11 approval.
- Wave 5 **done**: `eligibility()` still returns "not eligible" for anything
  that has not earned it; a forged unsigned grant produces no stamp and no
  post (the regression test); a synthetic revocation makes `approvalStatus` reject every
  unposted policy-stamped item of that type (no queue-file edit — `main` is
  branch-protected), files the Instagram `founder-task`,
  and posts a channel message that does **not** imply the Instagram post was
  removed.

## Why T7 is its own wave, gated on R4 (decided 2026-09-11, founder)

The founder approved T7 **for build**, not merely as a design, on 2026-09-11 —
superseding the "approve as a design, don't schedule" recommendation carried in
the spec and in `docs/decisions.md`. It is split across Waves 4 and 5 rather
than built whole in Wave 4, for reasons that are about evidence, not caution:

1. **T7 is the only item in this plan that is data-gated, not code-gated.**
   Everything else can be built and verified the day it ships. T7's first grant
   is impossible until a campaign family has a real trailing-28-day record, and
   that clock does not start until S3's ledger begins filling in Wave 3. Built
   whole in Wave 4, the riskiest code in the repo would sit unexercisable for
   at least a month.

2. **Its thresholds are invented numbers.** ≥8 briefs, ≥95% plain ✅, 0 ❌ over
   28 days were chosen with no data behind them — the spec says so. T2's Monday
   calibration and T5's ledger produce the first real edit/reject rates within
   2–4 weeks of Wave 3. Building the machinery that enforces those numbers
   before seeing them guarantees rework of exactly the code we least want to
   churn.

3. **R4 already asks the question.** Its brief includes "any campaign type
   eligible for ladder" on 2026-10-16. That checkpoint is the natural trigger,
   so Wave 5 costs nothing while nothing is close, and fires on evidence rather
   than on a date someone picked.

4. **The retraction path does not exist yet.** `DELETE /2/tweets/:id` is not
   implemented, and Instagram cannot be deleted at all. Shipping the policy
   stamp before the X delete is proven against a real post would ship the
   mitigation as a promise. That is also why the X delete proof is a Wave 5
   *entry* gate and not one of its deliverables.

**What goes where.** Wave 4 keeps the whole read-only half — `eligibility()`,
the Monday ladder-standing block — which was already its gate criterion and is
what produces the evidence R4 reads. Wave 5 adds only the acting half: signed
grants, approval schema `v: 3`, policy stamping, the posted-under-policy
notice, revocation and retraction.

**The standing constraint.** Wave 5 changes who may approve a post, so it is
the one wave that is Opus with a mandatory Codex review, and its entry gate
includes the founder re-confirming the irrevocable-Instagram acceptance *at
that time*. A month-old yes is not consent for an authority change whose worst
case cannot be reverted.

## Observation checkpoints (automated)

`checkpoints.json` holds due dates + checks. `plan-recheck.yml` runs daily;
when a checkpoint is due and `pending`, it runs the `plan-recheck` routine
(Opus), which verifies each check with `gh`, posts a report to #4117, writes
`rechecks/<id>.md`, flips the status, and — if anything is off — writes a
paste-ready follow-up prompt into the report for the founder's next session.

| Id | Due | Verifies |
|---|---|---|
| R1 | 2026-09-14 | poll runs completing on schedule; vault-run natural runs green; e2e green; output-sampling + telemetry first natural runs; SOCIAL_FREEZE off |
| R2 | 2026-09-21 | first Monday Tree brief posted as Tree; ≥1 feedback ledger entry with reason; daily draft PR quotes a reason or states none; approval latency in scorecard |
| R3 | 2026-10-02 | per-post metrics flowing; lessons ledger has ≥3 dated rules; telemetry week-over-week delta present; A4 sampling report has scores |
| R4 | 2026-10-16 | rejection + edit rate trend over 4 weeks; any campaign type eligible for ladder (**this is now Wave 5's entry gate — R4's answer decides whether Wave 5 runs at all**); founder thread replies ingested ≥2 weeks; propose plan close or extension |

## Non-negotiables carried into every wave prompt

Never `git restore`/`checkout --`/`reset --hard`/`clean`. Never run
`scripts/social/post-queue.mjs` or `delete-media.mjs`. Never write an
`approval` object into a queue file by hand. Never merge a PR that adds or
modifies `social/queue/**.json`. Branch per task in a worktree outside
`Documents\Claude\Projects\`. PR TL;DR first. Land it, don't watch it.
`gh variable set` is human-only — the founder flips `SOCIAL_FREEZE`.
