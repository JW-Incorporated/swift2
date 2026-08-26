---
description: Marketing dept — market research + site review by both AIs, ends in a prioritized feature verdict
---

Act as this company's marketing department. Objective: figure out which
features the app needs next to attract, delight, and retain Swifties.
Optional focus from the human: $ARGUMENTS

Read CLAUDE.md first. No production code in this mode. Every run ends in
a verdict, not a discussion (see step 6 — it is mandatory).

## Step 1 — Understand the vision

Read docs/vision.md, docs/decisions.md, and docs/architecture.md.
If vision.md is still a stub, STOP and interview Joey right now — at most
five questions, one message: who the app is for, the core delight, how it
makes money, what's out of scope, success in 12 months. Draft vision.md
from his answers, get his approval, commit it. A marketing department
without a vision is guessing.

## Step 2 — Review the existing product

- Explore the codebase: what features actually exist today, in what state.
- If the app runs (check README / package.json), start the dev server and
  review the real user experience — pages, flows, dead ends, first-run
  experience. Note the gap between vision and current reality.
- Write down: what would a Swiftie say 30 seconds after opening this app
  today?

## Step 3 — Research the market (use web search)

- Competing / adjacent apps and what fans love or hate about them (app
  store reviews, Reddit r/TaylorSwift, fan forums are gold).
- What Swifties do online that no app serves well yet.
- Current moment: tours, releases, fandom events coming up that create
  windows of opportunity.
- Growth mechanics that work in fan apps: sharing, streaks, collections,
  friend features, live-event moments.
Cite sources in the brief.

## Step 4 — Draft the marketing brief

Write `docs/marketing/feature-brief-<date>.md`:
- Target user segments (2-4, concrete: "show-going superfan", "casual
  streamer", ...)
- Top pains/desires per segment, with evidence from research
- 5-10 candidate features. For each: what it is, which segment it serves,
  why it beats alternatives, expected impact on acquisition/retention/
  revenue, rough effort (S/M/L), and any runtime-cost implications
  (per CLAUDE.md cost discipline — flag anything needing per-user LLM
  calls).

## Step 5 — Codex challenge round

Run `/codex:adversarial-review` on the brief with focus text: attack the
market assumptions (would real fans actually use this?), the impact
claims, the effort estimates, and scope creep — which features are bloat
disguised as growth. One round. Accept or rebut every finding in the doc.

## Step 6 — Verdict (mandatory)

End the brief with "## Verdict": the 3 features we should build next, in
order, each justified in two sentences. One list, one order, no hedging.
Then present to Joey in plain language:
- The verdict and the one-line pitch for each feature
- What Codex killed or changed, and why
- At most 2 A-or-B questions if true 50/50 product calls remain
- Ask: "Approve all three, or tell me which to swap?"

## Step 7 — On approval

- Create a GitHub issue per approved feature (`gh issue create`) with the
  segment, rationale, and acceptance-criteria sketch — these become the
  specs for the build loop.
- Update docs/vision.md or docs/decisions.md if the debate changed
  direction.
- Commit the brief and updated docs on a branch, push, open a PR.
