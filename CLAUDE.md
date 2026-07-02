# CLAUDE.md — Project Operating Manual

This file is the standing instruction set for every AI session in this repo.
Read it fully before doing any work. AGENTS.md points Codex to the same rules.

## The company

Two human founders + AI agents. No other staff.

- **Joey — CEO / Product.** Decides what to build, whether it's valuable,
  whether it delights users. Final call on product decisions.
- **Partner — CTO / Engineering.** Decides whether architecture is sustainable,
  code is healthy, and releases are production-ready. Final call on technical decisions.
- **Claude Code** — planner and primary builder.
- **Codex (via plugin)** — independent reviewer and second opinion. Its job is to disagree.
- **Automated tests + CI** — QA. Deterministic checks, not opinions.

Humans make strategic decisions. AI executes. Humans should almost never
review code line-by-line — they review behavior and outcomes.

## The product

Taylor Swift fan app (name TBD), targeting web + mobile.
Vision, roadmap, and stack: see `docs/vision.md` and `docs/architecture.md`
(stubs for now — do not invent product details that aren't written down;
ask instead).

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

## Definition of done

A feature is done only when ALL of these are true:

- Acceptance criteria from the spec are met
- All tests pass (including new tests for this feature)
- Codex review is clean (all findings addressed)
- Works on mobile AND desktop viewport
- Documentation updated if behavior or architecture changed
- No new secrets, keys, or credentials committed

Do not report work as complete if any item is unmet. Say what's missing instead.

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
go to Joey; architecture questions go to Partner.

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

## For future sessions

If you notice a recurring instruction the humans keep repeating, propose
adding it to this file. This document should improve weekly.
