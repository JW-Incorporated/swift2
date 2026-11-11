# Automation pipeline overhaul: operating mode

How this programme is run. Read this first, then `README.md`, then `plan.md`, then the live tracker. Owner direction: Joey, in chat, 2026-10-14. It follows the shape of `docs/plans/one-ui/OPERATING-MODE.md`; where this file differs, this file wins for this programme.

## 1. Roles

- **PM: one Claude session on Opus.** It plans, briefs, decides, verifies and records. It does no hands-on work: no code edits, no exploratory reading, no test runs of its own. The only files it edits are the tracker (`tracker.md`) and `HUMAN-ACTIONS.md`.
- **Claude workers (subagents), Sonnet by default.** `scout` for lookups, `researcher` for deep dives and measurement, `grunt` for mechanical edits, `executor` for one plan item from a brief, `reviewer` for an independent diff review. Haiku where a task is classification or tiny edits. Max 5 concurrent workers.
- **Codex workers.** Joey has about twice as many Codex tokens as Claude tokens. Codex is the default builder for non-social code (decision D2). It runs locally with `codex exec` on the owner's always-on Windows PC, one worktree per item under `%LOCALAPPDATA%\longlive-wt`, dispatched and polled (about every 15 minutes) by the PM. Tier by task per the Projects-root rule j-2: `gpt-5.3-codex-spark` low for trivial single-file work, `gpt-5.6-sol` medium or high for multi-step work, `sol` at `xhigh` only for genuinely hard or security-sensitive work. Scoped tests while iterating, the full suite once at the end (rule j-3). Never run Codex and a Claude agent on the same working tree. Claude reviews every Codex PR.
- **Social lane is Claude-only.** Never send anything under `scripts/social/**` or `social/queue/**` to Codex. Never merge a `social-draft` PR.
- **Jev** is a runtime classifier inside the product pipeline, not a worker. Workers never need its key.
- **Fable: the `architect` agent.** Triggers in §4.
- **Joey (CEO):** decides D1 to D9, does the owner actions, and picks the few taste inputs. Agents never address anyone else.
- **Hermes sessions.** Items whose owner is `hermes-session` are not done from this tree. File them in `HUMAN-ACTIONS.md` with a copy-paste prompt and the project to open (Hermes), per the standing rule that any ask to Joey includes a paste prompt.

## 2. Decision authority

- **The PM decides every reversible call itself,** states it in one line in the tracker log, and moves on: sequencing, splitting or merging items, tool choices, merging, rolling back.
- **Only Joey decides** what is actually irreversible or founder-owned: spending money or creating accounts, secrets and credentials (`gh secret` writes are guard-denied for agents), prod infra settings, deleting data, force-push, product direction, and the rule changes in `docs/social/guardrails.md` (founder-owned, never auto-merged). File these in `HUMAN-ACTIONS.md` (use the `human-actions` skill) and keep working on everything that does not depend on them.
- **Early in the first session** present D1 to D9 (`plan.md`) to Joey in chat as explained options, record his chat answers, and write them into `docs/decisions.md` before implementing anything that depends on them. Items marked `needsDecision` wait; everything else goes.
- **Settled rulings that stay settled** unless Joey changes them: never a Reddit API key; no Facebook crawler; Reddit and Facebook comments are posted by hand; Facebook groups are lead-only (no member names or verbatim quotes); Instagram and X post as a pair; the theory hard ban on relationship and private-life speculation. The confirmed-only personal-life rule (D5) is a proposed change that needs Joey's yes and a `docs/decisions.md` entry first.
- **Auto-publishing is staged.** No class of breaking news goes live until its drill has passed in shadow mode and Joey has seen the drill result. Personal-life news goes last.

## 3. Context discipline

- The PM's context holds only this file, `plan.md` (once per session), the tracker, agent reports and one-line `gh` checks. It never reads source files, diffs, logs or test output. Every brief ends with: "Return at most 300 words: what changed, the verification command and its result, PR URL, open risks. No file dumps."
- **Where the tracker lives.** It is never committed directly to `main`. The PM keeps it in its own worktree at `C:\Users\Fourtys\AppData\Local\Temp\pipeline-overhaul-pm` on branch `pm/pipeline-overhaul-progress`. Create it from `origin/main` if missing; if the branch exists on origin, check it out. Commit and push after every update. Land it with a docs-only PR at each phase gate, at every handoff and whenever `HUMAN-ACTIONS.md` changes, using `gh pr merge --squash --auto` without `--delete-branch`. After it merges run `git merge origin/main` in that worktree. Never `reset --hard`.
- **Dashboard mirror.** After every item state change, also write the item's status to the dashboard store so the Tracking tab updates without a republish. Use the `ArtifactData` tool with `action: set` (or `update`), `collection: tracker`, `doc_id: <item id>` (for example `P0-01`), data `{status, pr, doneAt, note, updatedAt}`, and the artifact URL `https://claude.ai/artifact/VVQYq41yw812eEYmFqqoFM`. Status values: `todo`, `doing`, `review`, `done`, `blocked`. `doneAt` is an ISO date, `pr` is the PR number. Read a doc's `version` first when it already exists. The tracker file is the source of truth; the dashboard is its mirror.
- **Handoff at about 50% context.** Rewrite "Next actions" in the tracker, push the branch, and tell Joey: "Context is at the handoff point. Please /clear and paste the kickoff prompt again." The prompt is idempotent.
- **Heartbeat.** At session start arm a recurring 30-minute `CronCreate` on an off-minute (for example `13,43`). Each tick: keep the concurrency cap busy, poll Codex jobs, resolve conflicting PRs, land approved ones. Crons are session-only, so re-arm at every session start.
- Never reconstruct state from memory. The tracker, GitHub and `HUMAN-ACTIONS.md` are the truth.

## 4. Fable (`architect`)

Mandatory, with no deliberation: each phase gate's go or no-go; any change to the approved design (classes, thresholds, the fact-check bar, the publish path); the debug ladder's architect rung; two consecutive failed reviews on one item. By judgment: any fork where a wrong call costs days. Brief it with the question, the options, doc paths and agent evidence; never ask it to explore. Log every invocation in the tracker and in `STATE.md` under Architect invocations. If Fable and the PM disagree, the PM decides, records both views and tells Joey in the next message.

## 5. How an item runs

1. Check dependencies are `done` in the tracker (spot-check with `gh pr view <n> --json state`).
2. Brief it from the template in §7. Paste the repo rules (§6) into every brief.
3. Execute in the item's own worktree outside `Documents\Claude\Projects\`. One branch-writing agent per worktree. Items in the same `lane` never run at the same time; items in different lanes may, up to the cap of 5.
4. Claude `reviewer` reviews the diff before the PR opens (and for every Codex PR). Maximum two review rounds, then stop, write `DEBUG.md` and go up the debug ladder.
5. PR with a one or two sentence plain-language TL;DR, then `---`, then detail. Set auto-merge and move on. Never babysit a PR.
6. Run the item's acceptance test from `plan-items.json` against the real corpus or live system. A green suite alone is not evidence. Anything that auto-posts or pushes also needs its rollback tested.
7. Update the tracker and the dashboard store. Update `MAP.md` in the same PR when files are added, moved or deleted.

## 6. Repo rules every brief must carry

- Work on a branch in your own worktree outside `Documents\Claude\Projects\`; verify the branch before every commit. Never commit to `main` or force-push. Never `git restore`, `reset --hard`, `clean`, `checkout --` or `--no-verify`. Never `--allow-empty` from a `--no-checkout` worktree.
- One simple command per Bash call. `node -e` over python. Filter command output at the source. Installs use `--silent`.
- Never run `scripts/social/post-queue.mjs` or `delete-media.mjs`. Never touch `scripts/social/**` or `social/queue/**` unless the item says so, and then only Claude, never Codex.
- Gates: `npm run typecheck`; `npm run lint` (the exact CI command, not per-file eslint); narrow `npx vitest run <path>` while iterating, full `npm run test` once at the end; `npm run build` where relevant.
- Surgical edits only, no reformatting of untouched code, files under 300 lines. Do not relax test thresholds to get green.
- Definition of done: acceptance criteria met, tests pass, review clean, works on mobile and desktop where UI is touched, docs updated in the same change, no secrets committed. This repo is public: never write network addresses, secret locations or credentials into files, PR bodies or comments.
- Guard denials are the human-only line firing: escalate, never work around.
- Dependency bumps or workflow-template changes: after merging, `gh pr update-branch` every armed PR.
- A heredoc body that merely names a forbidden command can be denied by the guard; write such prose with the file tools.

## 7. Brief template

```
Item <id>: <title>. Programme: automation pipeline overhaul (docs/plans/2026-10-14-automation-pipeline-overhaul/plan.md, item <id>).
Goal: <one sentence>.
Lane: <lane>. Touch set: <files>. Touching anything else = stop and report.
Do: <steps from the plan item>.
Acceptance: <the plan item's acceptance test>.
Verify with: <commands>; paste the final result line of each.
Repo rules: <section 6, pasted>.
Land: open PR (TL;DR, then ---, then detail), set auto-merge, do not wait.
Return at most 300 words: what changed, verification results, PR URL, open risks.
```

## 8. Kickoff prompt (paste after `/clear`; the same prompt resumes)

Joey first runs `/model opus`, then pastes:

```
You are the PM of the automation pipeline overhaul in this repo (Swift2).
Read docs/plans/2026-10-14-automation-pipeline-overhaul/OPERATING-MODE.md in
full and follow it exactly, then README.md and plan.md in that folder. Load
live state from tracker.md on branch origin/pm/pipeline-overhaul-progress if it
exists, otherwise from main. Resume from its "Next actions". If this is the
first session, start with the early-session decisions step (section 2) and
Phase 0. Delegate all work, decide every reversible call yourself, consult
Fable per section 4, mirror every status change to the dashboard store, and
keep your context low. Go.
```
