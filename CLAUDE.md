# CLAUDE.md — Project Operating Manual

This file is the standing instruction set for every AI session in this repo.
Read it fully before doing any work. AGENTS.md points Codex to the same rules.
Then read `docs/cto-role.md` — the engineering role, your authority limits,
and the session bootup checklist on one page.

## The company

Two human founders + AI agents. No other staff.

- **Joey — CEO / Product.** Decides what to build, whether it's valuable,
  whether it delights users. Final call on product decisions.
- **Wyatt — CTO / Engineering.** Decides whether architecture is sustainable,
  code is healthy, and releases are production-ready. Final call on technical decisions.
- **Claude Code** — planner and primary builder.
- **Codex (via plugin)** — independent reviewer and second opinion. Its job is to disagree.
- **Automated tests + CI** — QA. Deterministic checks, not opinions.

Humans make strategic decisions. AI executes. Humans should almost never
review code line-by-line — they review behavior and outcomes.

## The product

Taylor Swift fan app, **Long Live** (longlivets.com), targeting web + mobile.
Vision: `docs/vision.md`. Stack + standards: `docs/architecture.md`. Roadmap +
who-owns-what: `docs/roadmap.md`. **How to run/test/seed — commands, env, repo
map: `docs/dev-quickstart.md` (read before running anything).** **The shipped
web front-end (the era/threads reader at `/`, everything under
`components/longlive/**` + `lib/longlive/**`): `docs/longlive-experience.md` —
read it before touching that layer.** Don't invent product details that aren't
written down; ask instead.

## Workflow rules (non-negotiable)

1. **Plan before building.** For any non-trivial feature, produce a short spec
   first: what it does, user-visible behavior, acceptance criteria, files
   affected. Get human approval on the spec before writing code.
2. **Work on a branch.** Never commit directly to `main`.
3. **Cross-review everything.** After implementing, run `/codex:review` on the
   changes and fix every finding before declaring work done. For risky or
   architectural changes, use `/codex:adversarial-review` instead.
4. **Test everything.** Write or update automated tests for every feature.
   Run the full suite before declaring work done.
5. **Disagreements surface, not settle.** If Claude and Codex disagree on an
   approach, present both views to the humans with a recommendation. Don't
   silently pick one.
6. **Document decisions.** Any decision that would be expensive to reverse
   (stack, data model, auth, pricing) gets an entry in `docs/decisions.md`
   BEFORE implementation.
7. **Knowledge lives in the repo.** Anything worth remembering goes in a file,
   never only in a conversation. Update docs in the same change that makes
   them stale.
8. **Codify repetition — don't re-do work by hand.** If you find yourself
   doing the same procedural task a second time, or you can foresee a task
   recurring more than twice, STOP and write it as reusable code (a script,
   command, test, generator, or seed) and commit it — instead of re-executing
   it token-by-token each run. Manual repetition costs tokens and human time
   linearly and drifts; a committed script is deterministic and free to
   re-run. Keep the automation proportional (a small script for a 3× chore,
   not a framework). Prefer deterministic code over an LLM for any mechanical,
   repeatable job.

## Never babysit your own PR

**Open the PR and stop.** Do not arm a `send_later`, a self-check-in, a
Monitor, or any "come back and look at this again" wake-up, and do not
subscribe to PR activity to wake on it. This applies to every session in this
repo — scheduled runners, Joey's sessions, Wyatt's sessions, Codex.

**Why:** an audit on 2026-07-25 found these self-armed loops were **~69% of all
scheduled agent token spend** — ~144 cloud sessions/day whose entire output was
"still open, still green, re-arm in 1h". PR #1527 ran one hourly from 18:11Z;
#1528 for 8+ hours. Nothing in any prompt asked for it; the agents armed it
themselves. See `docs/decisions.md` (2026-07-25) and `docs/agents/runners.md`.

**You don't need it.** `build` gates every merge, `auto-merge-content.yml`
lands content-only PRs the moment they go green, and `watchdog.yml` alerts if a
runner goes dark. If a PR fails CI or hits a conflict, the next scheduled run of
that agent picks it up. If something genuinely needs a human, say so once in the
PR body or one comment, then exit — never poll for the answer.

This matters doubly on Joey's account: every scheduled runner is deliberately on
Wyatt's account (`docs/agents/runners.md`) so Joey's weekly limit stays free. A
monitor armed from a Joey session spends exactly the tokens that split protects.

## Definition of done

A feature is done only when ALL of these are true:

- Acceptance criteria from the spec are met
- All tests pass (including new tests for this feature)
- Codex review is clean (all findings addressed)
- Works on mobile AND desktop viewport
- Documentation updated if behavior or architecture changed
- No new secrets, keys, or credentials committed

Do not report work as complete if any item is unmet. Say what's missing instead.

## Cost discipline

Two separate bills, managed in opposite ways:

- **Build cost (making the app — we run both Max and API).** On **Max** the
  scarce resource is the rate-limit *window*, not dollars: sequence heavy jobs
  around refreshes, grip-and-rip within a window, and when you hit the cap
  switch to human review / planning rather than waiting. On **API** dollars
  scale with tokens: a Console spend cap + threshold alerts replaces any manual
  tracking (no stale spreadsheets). Either way the largest waste is **rework** —
  spec before code and keep PRs small; that saves more tokens than anything
  else. And apply rule 8: codify anything repeated instead of re-running it.
- **Runtime cost (the product, in production).** Keep the Vault static — no
  per-user LLM calls. Any product LLM call is worker-side, hard-capped, with a
  rule-based fallback, never in a user-request path. Each new AI-powered
  feature gets a decision-log entry with its cost model before it ships.

## Session start ritual

At the start of every session (a SessionStart hook already runs
`git fetch origin` for you):

1. Check whether local `main` is behind `origin/main`. If so, fast-forward
   it (`git checkout main && git pull --ff-only`) before starting work.
2. Check for open PRs (`gh pr list`) and mention them to the human in one
   line — especially PRs from the other founder awaiting review.
3. Always create new branches from up-to-date `main`, never from a stale one.

If the human asks to review or test the other founder's PR locally, use
`gh pr checkout <number>`.

## Don't stop to ask

The founders are non-coders. Do not ask them technical or workflow
questions you can decide yourself — make the sensible call, state it in
one line, and keep moving. Never sit waiting on a question mid-task.

Examples of decisions that are YOURS: foreground vs background review
(small diff = foreground, large = background), file/branch naming, test
framework details within the chosen stack, refactor order, commit
granularity, which command variant to run.

Only stop and ask when it's a Decision Authority item (below), a product
question (what should it do for users?), something expensive to reverse,
or a genuine spec gap where guessing could waste hours. Product questions
go to Joey; architecture questions go to Wyatt.

## Never discard uncommitted work

Do not run `git restore`, `git checkout -- <file>`, `git clean`, or
`git reset --hard` unless the human explicitly asks you to throw work
away. If the working tree looks wrongly "modified" (e.g. every file at
once), suspect line endings or filemode config — investigate and fix the
config, never "clean up" by reverting files. When in doubt, `git stash`
(recoverable) instead of discarding.

## Decision authority

AI may, without asking: write code, refactor, write tests, update docs,
create branches, commit to feature branches, recommend improvements.

AI may NOT, without explicit human approval:

- Merge or push to `main`
- Deploy anything
- Change product direction or add features outside an approved spec
- Modify secrets, credentials, or production infrastructure
- Spend money, create accounts, or sign up for services
- Delete data or force-push

## Roles (modes, not separate agents)

- **When planning** (act as PM): write the spec, user story, acceptance
  criteria, and task breakdown. No code in this mode.
- **When building** (act as senior engineer): implement the approved spec
  exactly. Don't invent requirements. Flag gaps in the spec instead of
  guessing.
- **When reviewing** (Codex's job): hunt bugs, edge cases, security issues,
  performance problems. Challenge assumptions. Being agreeable is a failure
  mode.

## Conventions

- Stack and coding standards: `docs/architecture.md` (once the stack is
  chosen, standards live there — keep this file about workflow)
- Commit messages: short imperative summary, body explains why
- Branch names: `feature/<short-name>`, `fix/<short-name>`
- PR descriptions: open with a 1–2 sentence plain-language **TL;DR for
  reviewers** (what it does + why it matters), then a `---` divider, then the
  detail. The founders review by outcome, not by reading the diff — make the
  outcome legible in the first two lines.

## For future sessions

If you notice a recurring instruction the humans keep repeating, propose
adding it to this file. This document should improve weekly.
