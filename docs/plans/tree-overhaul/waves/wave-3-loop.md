# Wave 3 — Close the loop

Paste everything below this line into a fresh Sonnet session in Swift2. Prerequisites: Wave 1 specs merged and approved; Wave 2 merged.

---

You are executing Wave 3 of the Tree Overhaul (`docs/plans/tree-overhaul/PLAN.md`, epic #4117). Read `PLAN.md`, then every spec in `docs/specs/tree-overhaul/` (they are the source of truth; this brief only sequences them). The owner authorizes up to 6 concurrent subagents. Write a `PLAN.md`-style step list per task for the executor, in the task's worktree, then run `executor`; you orchestrate, review, confirm real CI with your own `gh pr checks`, merge, exit.

**Hard rules carried in:** never `git restore`/`checkout --`/`reset --hard`/`clean`; never run `scripts/social/post-queue.mjs` or `delete-media.mjs`; never write an `approval` object into a queue file; never merge a PR touching `social/queue/**.json`; `codex:rescue --background` on every PR touching `scripts/social/**`, `social-approval-*.yml`, `routine-tree-*.yml`, or `auto-merge-content.yml`, max two rounds, then `DEBUG.md` and the debug ladder. Files under 300 lines; `MAP.md` for new files; docs updated in the same PR that changes behavior. Growth/Tree prompt edits must keep the "Run discipline" block and the Tier-2 trailer intact (`docs/agents/routine-invariants.md`).

## Order

**Batch 1 (parallel):**
- **#4127 + #4131 first, inside S3's worktree** (Wave 2 carry-over, 2026-09-11): the poller cannot finish a merge unattended after its own stamp commit advances the PR head SHA, so the S3 poller work must land the #4127 fix (match by PR number, not head SHA, or re-read the SHA after checkout) before the founder test below can prove a full cycle without a manual merge. #4131 is a one-line watchdog list fix; fold it into T1's PR.
- **S3** reason protocol + `social/feedback/` ledger, per `s3-reason-protocol.md`. Includes the generic reaction→action table in the poller. Tests: 429 path still passes; ❌ without reply stays pending; ❌ with reply writes ledger + comment; ✏️ rewrites caption, restamps, keeps both bodies.
- **T1** one charter, per `t1-one-charter.md`. Renames, docs, `runners.md`, Tier-2 trailers, Discord username already "Tree" from Wave 2. **Two Wave 1 carry-overs land here:** (1) `social/queue/` is not empty — check it, and backfill `lane: "calendar"` into any live draft in the same PR that makes `lane` required; (2) T1/T2 make `lane` and `critique` required while the side doors cannot supply them until T6, so **pull T6's "stop writing captions" half forward into this wave** (merch-official-sync and appearance-discovery write `social/inbox/*.json` intents and zero `social/queue/` files, per `t6-side-doors.md` §Mechanics; the fast-lane drafting, rubric `v: 2` and `inbox.mjs` selection stay in Wave 4). Codex review — it touches the queue path.
- **T5** lessons ledger file + Monday distillation step in `tree-plan.md` + daily-draft read step, per `t5-lessons-ledger.md`. Seed `social/lessons.md` with the rules already implied by the checker (banned openers, opener reuse, wire attribution) so it is not empty on day one.

**Batch 2 (after Batch 1 merges, parallel):**
- **T2** self-critique + why in the daily draft prompt and queue schema; `approval-prompt.mjs` renders the why as the first paragraph; `check-drafts.mjs` validates the `critique` object, per `t2-self-critique.md`.
- **T4** weekly brief: Monday post from Tree, thread ingestion in the poller, Wednesday re-plan dispatch, per `t4-weekly-brief.md`. Dispatch the plan routine once against a scratch branch to render a real brief in the channel (mark it "TEST — ignore" in the first line) and screenshot-equivalent: paste the Discord message JSON the notifier sent into the PR body.
- **S6 + S8** Reddit ✅/⏭️ completion via the reaction table (S3's `reddit` row: ✅ = replied, ⏭️ = skipped with no reason asked, ❌ = dropped with a reason; the prompt message must carry a `ref:` line whose scope token names the Reddit item); approval latency, expired-while-pending, Reddit-replies-done added to `weekly-scorecard.mjs`.

## Founder test at the end

Tell the founder: "**YOU:** in #longlive-social there is a TEST brief. React ❌ and reply to it with the words `test reason: too generic`." Dispatch the poll, then show them the resulting `social/feedback/<week>.jsonl` line and the PR comment. Then remove the test artifacts via a small PR.

## Done means

All PRs merged with your own CI confirmation; Codex clean; the founder's ❌ produced a ledger line; a dry-run of the daily draft prompt (`workflow_dispatch` on a scratch branch or a local run with the prompt) shows it quoting that reason; Monday brief rendered once in the channel. Tick Wave 3 on #4117 with PR numbers, update `STATE.md`, stop. Note for R2: the first real Monday brief is 2026-09-21 if this wave lands after Monday 09-14 10:00 UTC; say which in the #4117 comment.
