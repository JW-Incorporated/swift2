# Wave 4 — Metrics, side doors, ladder measurement, quality sampling

Paste everything below this line into a fresh Sonnet session in Swift2. Prerequisite: Wave 3 merged.

---

**SCOPE CHANGE 2026-09-11 — T7 is now split; Wave 4 builds the READ-ONLY half only.** Build `eligibility()` in `scripts/social/lib/autonomy.mjs` and the Monday ladder-standing block in `weekly-scorecard.mjs`, and nothing else from T7. **Do NOT build in this wave:** signed grants, `social/autonomy.json` writes, approval schema `v: 3`/`kind`, `stampUnderPolicy`, the posted-under-policy notice, revocation, or the retraction workflow. All of that is **Wave 5**, gated on checkpoint R4 — see `PLAN.md` → "Why T7 is its own wave, gated on R4". If you find yourself editing `approvalStatus` or `approvalSigPayload` in this wave, stop: you are out of scope.

You are executing Wave 4 of the Tree Overhaul (`docs/plans/tree-overhaul/PLAN.md`, epic #4117). Read `PLAN.md`, `docs/specs/tree-overhaul/t6-side-doors.md`, `t7-autonomy-ladder.md`, and the Wave 3 comment on #4117. The owner authorizes up to 6 concurrent subagents. Same hard rules as every wave: no `git restore`/`reset --hard`/`clean`; never run `post-queue.mjs`/`delete-media.mjs`; never hand-write an `approval` object; never merge a `social/queue/**.json` PR; Codex review on anything touching the gate, poller, stamper or poster; you confirm real CI yourself before merging; `gh secret`/`gh variable` mutation is human-only → `HUMAN-ACTIONS.md` with exact steps.

## Step 0 — research before building (researcher agent, 30 min)

**T3 API access.** Determine what per-post metrics are actually retrievable with the credentials this repo already holds: Instagram Graph `/{media-id}/insights` (impressions, reach, saved, shares, likes, comments — which need `instagram_manage_insights`), X API v2 tweet `public_metrics`/`non_public_metrics` (free tier exposes public counts only; `non_public_metrics` needs user-context OAuth and paid tier). Check `growth-snapshot.yml` and `scripts/social/lib/growth.mjs` for how tokens are held today. Output: a table of metric × platform × available-now / needs-scope / needs-paid, and the exact `HUMAN-ACTIONS.md` steps for anything needing the founder's login. Do not spend money; if X metrics need a paid tier, record the price and stop at "founder decision", build IG only.

## Tasks (parallel where independent)

- **T3** per-post metrics: extend `growth-snapshot.yml`'s zero-LLM job to write `social/metrics/posts/<YYYY-MM>/<postId>.json` for every item in `social/posted/` from the last 30 days, using what Step 0 says is available now; `weekly-scorecard.mjs` adds engagement by campaign type and pillar; Tree's Monday prompt reads it. Never a per-post LLM call.
- **T6** side doors through Tree, per spec: merch-official-sync and appearance-discovery write `social/inbox/*.json` intents; Tree's daily run drafts fast-lane slots; the old direct-to-queue authoring paths are deleted, not left dormant. Codex review (touches the queue path).
- **T7** autonomy ladder, per spec: eligibility computed in `weekly-scorecard.mjs`, proposal rendered in the Monday brief, `social/autonomy.json` written by the poller on founder ✅, policy-stamp path in the poller, 24h ❌ pull-back with a lesson. At day 0 nothing is eligible; the acceptance test proves the check returns "not eligible" for every type and that a policy stamp verifies in `post-queue.mjs`. Codex review, and a `docs/decisions.md` entry is already there from Wave 1; link it in the PR.
- **A4** quality sampling: extend `output-sampling.yml` with a second job that picks ≤2 merged PRs per routine (≤30/week), has a Sonnet routine score each against the routine's charter on a 3-point rubric with one evidence sentence, and appends to the weekly report. Rubric per routine lives in `docs/agents/<persona>.md` under a `## Sampling rubric` heading; write those headings with an Opus subagent (judgment), keep each ≤6 lines.
- **A3** telemetry thresholds: only if `docs/audits/` holds ≥2 weekly usage snapshots by now; add week-over-week delta and a `⚠️ +50%` flag per routine and fleet-wide to `fleet-telemetry-snapshot.mjs`. Otherwise leave a dated TODO in the plan's `rechecks/` notes for R3.
- **A2 real fix**: the Track Guide button does not render on production (#4082, reopened in Wave 2). Invoke the `debug-protocol` skill, run it with an Opus subagent (`/model` is yours; the agent can be Opus), two strikes then `DEBUG.md`. When fixed and verified in a real browser on mobile and desktop, remove the `test.fixme` quarantine in the same PR and confirm `e2e.yml` green on a dispatch.

## Done means

All PRs merged with your own CI confirmation; at least one real `social/metrics/posts/*.json` written by a real snapshot run; ladder check returns not-eligible everywhere; a sampled report with scores exists in `docs/audits/`; #4082 fixed or `DEBUG.md` escalated with the ladder followed. Tick Wave 4 on #4117, list any `HUMAN-ACTIONS.md` items you created, update `STATE.md`, stop. R3 (2026-10-02) checks what you built against real data.
