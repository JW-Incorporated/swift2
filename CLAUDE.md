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
   affected. Then execute it — the plan does not need a sign-off.
   (2026-08-13: Joey removed the spec sign-off gate — plan, then execute.
   Planning is still required; only the approval step is gone. Rule 5, rule 6
   and § Decision authority are unaffected.)
2. **Work on a branch.** Never commit directly to `main`.
3. **Cross-review everything.** After implementing, get a Codex review of the
   changes and fix every finding before declaring work done. For risky or
   architectural changes, ask for an adversarial review instead.
   **`/codex:review` is a HUMAN-ONLY command** (`disable-model-invocation`) —
   a session cannot run it and must not reproduce it by other means. Sessions
   use the `codex:rescue` skill → `codex:codex-rescue` subagent instead, and
   **must pass `--background`**: without it the forwarder blocks, times out at
   10 minutes, and returns nothing, while a real review takes ~15. Read the
   result with `codex-companion.mjs result <job-id>`, never from the relay's
   summary. Full contract, commands and traps: `docs/agents/codex.md`.
   Never hand a review back to a founder — agents deploy Codex themselves.

   *(2026-08-19, AI Dev OS migration: the sentence "the in-house `reviewer`
   agent does NOT satisfy this rule" was removed because that agent no longer
   exists — review is routed by AI Dev OS `review_convergence` /
   `delegate_review`. Joey's later ruling that Codex is out of the loop
   supersedes this rule's Codex requirement; see § OPEN below.)*

   **MAXIMUM TWO REVIEW ROUNDS PER BRANCH** (Joey, 2026-08-14, after a
   four-round loop). Round 1 reviews the work; if it rejects, you fix and run
   round 2. **If round 2 also rejects, STOP — do not run a round 3.** Escalate:
   write `DEBUG.md`, hand it to a fresh-context agent restricted to the 2–3
   relevant files, and if that does not settle it, escalate through AI Dev OS
   (`supervisor.bounded_model_escalation`, then the Fable decision authority in
   `decision_policy`) — the retired `architect` agent's job. A third
   review is a signal that the FIX approach is wrong, not that more review is
   needed. Reviews are cheap to run and expensive in wall-clock; a loop of them
   is a symptom.

   **Why the loop happened, and the rule that prevents it:** every failed fix
   verified the wrong thing — the container moved rather than what
   `elementFromPoint` returns; one scroll state rather than all of them. So:
   **a UI fix is not verified until it is reproduced in a browser, in every
   state the bug can occupy, at every viewport it targets.** For an
   interactive control that means a real tap and a hit-test, not geometry. A
   green suite is not evidence — 2,700 passing tests missed all four rounds.
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
runner goes dark. If something genuinely needs a human, say so once in the PR
body or one comment, then exit — never poll for the answer.

**What actually happens to a red PR — read this, it used to say something
false.** Until 2026-08-11 this section promised "the next scheduled run of that
agent picks it up." It did not. Every runner opens a BRAND NEW branch off `main`
each run and never revisits the previous one, so red PRs sat open for 3, 5 and
15 days with nobody looking. What is true now:

- `watchdog.yml` § "PRs stuck on failing or missing checks" scans **every** open
  non-draft PR once a day and emails the founders about any that has been open
  >24h with a failing check, or with no `build` check at all. That is the safety
  net — detection, not repair.
- It also re-runs a `build` that has been red >48h with no newer run, capped at
  2 re-runs per day, for the case where CI died of something unrelated to the PR.
- Only the Vault Run has a repair path (`runner-prompts/vault-run.md` STEP 0),
  and it adopts a stranded PR **at most once** before labelling it
  `founder-decision` and moving on.

So: opening the PR and exiting is still correct. Just do not assume anything
will fix a red PR for you — nothing will, beyond one Vault Run attempt. If you
can see why it is red before you exit, fix it in that same session.

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

## Agent shell discipline (added 2026-08-12 after the permission-prompt flood)

The project allowlist (`.claude/settings.json`) auto-approves simple, common
commands. It matches command PREFIXES — so write commands it can see, or you
will spray permission prompts at a founder (an audit found five parallel
agents doing exactly this — the "doom loop"):

- **One simple command per Bash call.** No `for`/`while` loops, no `$(...)`
  substitution chains, no multi-step `&&` trains mixing listed and unlisted
  commands. Chain only allowlisted commands, and only when necessary.
- **Prefer the dedicated tools** (Read/Grep/Glob/Edit) over `cat`/`grep`
  pipes — they never prompt.
- **Prefer `node -e` over `python -c`** for one-liners: `node *` is
  allowlisted, python is not.
- `git merge` and `gh pr merge` ALWAYS prompt — that is the founders'
  merge-authority gate, working as designed. Don't fight it; batch merges so
  a founder approves once, deliberately.
- Parallel local agent fleets multiply whatever prompts remain, so keep the
  commands they run allowlist-shaped. Large fleets are still better run as
  cloud sessions on Wyatt's account (`docs/agents/runners.md`), which keeps
  Joey's weekly limit free. (2026-08-13: Joey removed the hard local-
  concurrency cap of 2 — run as many local agents as the work warrants.)
- **One working directory, one branch-writing session.** Twice in one session
  two agents sharing this checkout flipped HEAD under each other — a commit
  landed on the wrong branch (2026-08-13 incident). Any agent that will create
  branches or commit must run in its OWN `git worktree`, created outside
  `Documents\Claude\Projects\` — see `docs/agents/README.md` for the exact
  command. An orchestrator must never dispatch two branch-writing agents into
  the same checkout. Read-only agents (inspecting, searching, reading) may
  still share one freely. `.claude/hooks/guard.sh` enforces this with a
  session lock; it is not just a convention.

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

---

# ORCHESTRATION — AI Dev OS v3.2 (migrated 2026-08-19)

Everything ABOVE this line is the project's own operating manual. It **outranks
this section wherever the two touch**, exactly as it outranked the kit-v3
contract that used to sit here.

What changed on 2026-08-19: the kit-v3 ORCHESTRATOR CONTRACT — which defined
routing, delegation, model tiering, planning, working memory, debugging
escalation, checkpointing and pause/resume *inside this file* — was retired.
**AI Dev OS v3.2 is now the sole orchestration authority.** The full inventory,
the reasoning, and the reversible backup are in
`docs/migrations/2026-08-19-ai-dev-os-v3.2-inventory.md`.

## What this file no longer decides

Do not look here, and do not reinvent locally, any of the following. They are
owned by AI Dev OS and configured in
`!build_systems/AI-OS/ai_dev_os_v3_2/ai-dev-os/policy/routing-policy.yaml`:

| Concern | Owner |
|---|---|
| Task routing and model selection | `routing.*`, `workers.*` |
| Agent spawning and delegation | `delegate_task` / `create_task` (MCP) |
| Fable decision authority | `decision_policy.default_authority: fable` |
| Task and runtime state | AI Dev OS SQLite + GitHub (see `REPO-001`) |
| Review loops and convergence budgets | `review_convergence.*`, `delegate_review` |
| Checkpointing, pause and resume | `session_policy.*` |
| Supervisor and stall recovery | `supervisor.*` |
| Team coordination | `team_coordination.*` + the shared rule below |
| Provider health and billing safety | `provider_health.*`, `billing_safety.*` |

Its lead-behavior instructions live in `~/.claude/CLAUDE.md` (marker-delimited)
and apply in every repo. Its task hook fires on every prompt. If the
`ai-dev-os` MCP server is not available in a session, none of it applies —
but this file still does.

## The shared team rule — binding

@.claude/rules/ai-team-coordination.md

That file is installed and kept current by `ai-dev team-bootstrap`. **Do not
hand-edit it**; changes belong upstream in the AI Dev OS policy. It defines
`REPO-001`…`REPO-007`: GitHub is the shared truth, substantial work registers
as an Issue, one editing task gets one isolated branch/worktree, the default
branch is an integration lane, overlap is checked before integration, and
**no single mutable file is authoritative shared state**.

The last of those (`REPO-006`) is why `STATE.md`, `PLAN.md` and
`PLANtemplate.md` are gone from the repo root. They are preserved verbatim
under `docs/archive/kit-v3-2026-08-19/`.

## Precedence, when two rules touch

1. **A direct human ruling** (Joey on product, Wyatt on architecture) — always.
2. **This file above the separator** — project policy and safety: the
   human-only list in § Decision authority, § Never babysit your own PR,
   § Never discard uncommitted work, § Agent shell discipline, § GUARDS.
   AI Dev OS routing never licenses crossing one of these.
3. **`.claude/rules/ai-team-coordination.md`** (`REPO-*`) — team coordination.
4. **AI Dev OS global policy** — routing, models, budgets, recovery.

A conflict that is not resolved by that order is a `REPO-007` cross-cutting
decision: surface it, don't pick silently.

## Where the old working memory went

| Retired | Replacement |
|---|---|
| `STATE.md` — current focus, next step | GitHub Issues/PRs (`REPO-001`), AI Dev OS tasks |
| `STATE.md` — known traps | `docs/engineering-lessons.md` |
| `STATE.md` — settled decisions, merge authority | `docs/decisions.md` |
| `STATE.md` — paused work at migration time | `docs/handoff/2026-08-19-paused-work.md` |
| `PLAN.md` / `PLANtemplate.md` | AI Dev OS task records + task-local plans |
| `.claude/hooks/triage.sh` | AI Dev OS `UserPromptSubmit` hook |
| `.claude/hooks/checkpoint-gate.sh` | `session_policy.durable_state_outside_conversation` |
| `.claude/agents/{architect,executor,reviewer}.md` | AI Dev OS routing + `delegate_review` + Fable |
| `.claude/skills/pause/` | `session_policy.*` |
| `docs/OPERATINGMANUAL.md` | AI Dev OS policy + `inputs/` docs |

`MAP.md` **stays** — a read-only codebase map is explicitly permitted by
`REPO-006`, and it is the reason exploration is unnecessary here. Keep it
current when files are added, moved or deleted.

`.claude/agents/{scout,researcher,grunt}.md` **stay** — they carry no
orchestration authority, and `REPO-002` exempts internal read-only and
mechanical subagents from Issue registration.

## OPEN — one conflict this migration did not settle

`Workflow rule 3` above requires an independent **Codex** cross-review and
states the in-house `reviewer` agent does not satisfy it. Joey later ruled the
opposite — *"use claude code review… then just stop reminding me about it"* —
recorded in the archived `STATE.md` § Merge authorization, which also says not
to re-raise it with him.

Those two are contradictory as written, and the `reviewer` agent that the
ruling named as the substitute has itself now been retired in favour of AI Dev
OS review routing (`review_convergence`, `delegate_review`, `deepseek_pro`).
**A session should follow Joey's ruling** (rule 3's Codex requirement is
superseded) and use AI Dev OS review routing. This note exists so the
contradiction is visible in one place rather than rediscovered; per his
instruction, do not re-raise it with him.

---

# SCOPE TRIPWIRES — stop if any fires

Retained project hygiene. These are Swift2 failure patterns, not orchestration:

- Diff exceeds ~400 lines for a task planned as small
- An agent (or you) is editing a file outside the task's declared touch set
- You are about to change something settled in `docs/decisions.md`
- One task has consumed more than ~10 turns with nothing verified
- A second implementation of something that already exists is being written
  (**two mechanisms for one fact is this repo's recurring defect** — grep for
  other callers before declaring a fix done)
- You catch yourself doing mechanical work inline "because it's quicker"

Firing a tripwire means: stop, record what happened on the task, say so in two
sentences. Per § Don't stop to ask above, that is a notification, not a
question — keep moving unless what fired is a § Decision authority item.

# VERIFICATION — what evidence looks like

§ Definition of done above decides WHETHER something is done. This decides what
counts as proof of any single step along the way:

- Never declare a step done from reading code. Only from a command that passed.
- Agent-reported success is a claim, not a verification. Spot-check it.
- Run the narrowest check that proves the change; the full suite once, at the
  end — which is also Workflow rule 4.
- **A UI fix is not verified until it is reproduced in a browser, in every
  state the bug can occupy, at every viewport it targets** (Workflow rule 3).
  A green suite is not evidence — 2,700 passing tests missed four rounds.
- **A passing suite is not evidence; execution against the real corpus is.**
- `apps/web` **is not linted by anything** — the root config ignores it, so
  typecheck and the suite are the only real gates. Use
  `npm run typecheck --workspace=@swift2/web`.

# MECHANICS

§Agent shell discipline above governs how commands are written and always wins.
These are the reading and editing habits that go with it.

**Reading.** Search before you read: Grep/Glob to locate, Read for line ranges —
the dedicated tools, per §Agent shell discipline, not `cat`/`grep` pipes.
Line ranges, never whole files over ~150 lines.
Never re-read a file already in context. Never read lockfiles, `node_modules`,
build output, `.min.*`, generated code (`*.generated.ts`), or old migrations.

**Editing.** Surgical only. No rewriting a file to change five lines. Don't
reformat or clean up code you weren't asked to touch — most of this repo is not
prettier-clean, so a stray `--write` turns a one-line fix into a whole-file diff
(and on a `*.generated.ts` it turns `build` red). Format deliberately with
`npm run format:write`, scoped to files you actually meant to reformat, never as
a side effect. Auto-format-on-save is switched OFF here on purpose — see the
comment in `.claude/hooks/post-edit.sh` before turning it on. No comments
narrating what you did. Files stay under 300 lines; split and record in `MAP.md`.

**Commands.** Filter output at the source — `2>&1 | tail -30`,
`| grep -iE "error" | head -20`, or redirect to `.scratch/` (git-ignored) and
`rg` it. Installs get `--silent`. Raw output never enters context.

**Communication.** Don't preview what you're about to do. Don't recap. Don't
apologize. One-line triage call, then work. Report at checkpoints, in a few
lines — and per §Conventions above, a PR body opens with the plain-language
TL;DR for reviewers.

---

# GUARDS

`.claude/hooks/guard.sh` is the deterministic backstop for §Decision authority's
"AI may NOT" list — prose can be ignored, a `PreToolUse` hook cannot, including
in fully-autonomous sessions. It denies: recursive/forced `rm`, force push,
`git reset --hard`, `git clean`, `git restore`, `git checkout --`,
`--no-verify`, real `.env` files (`.env.example` and friends stay readable),
`chmod 777`, `gh secret`/`variable` mutation, and — specific to this repo —
**any local invocation or CI dispatch of the social poster's real-send paths**
(`scripts/social/post-queue.mjs`, `scripts/social/delete-media.mjs`).

Those two scripts publish to and delete from the live accounts the moment they
run, and neither has a dry-run flag; a duplicate publish is the exact mechanism
behind the 2026-07-17 triple-post incident (issue #2031).

The send check works out what a command actually EXECUTES rather than matching
the path as text, so it catches `cd scripts/social && node post-queue.mjs` and
`bash -c '...'` while leaving the script readable, greppable and unit-testable.
Every normal command stays allowed — `npm test`, `npm run check:*`,
`npm run validate:social`, `npm run db:migrate` and the `db:seed:*` scripts
(`--env-file=` is exempt from the `.env` deny), `next build`, `gh pr list`.

If the guard denies something, that is the human-only line firing. Do not look
for a workaround; escalate to a founder.

# HUMAN-ACTIONS.md — the standing record for anything Joey must do

**Every action requiring the owner goes in `HUMAN-ACTIONS.md`, always, the
moment you identify it.** Anything needing his identity, login, payment method,
approval, a click in a UI you can't reach, or anything the guard denies as
human-only. One file, that exact name, at the project root. Never a variant.

Entries carry: a `[BLOCKING]`/`[UPGRADE]` tag and rough time cost, why it
matters, light numbered steps, **every exact value written out literally** (URLs,
secret names, file paths, menu labels — paraphrasing is what actually costs him
time), and a concrete "Worked if:" signal.

Every entry carries a `**Status:** OPEN` line. Joey changes that one word to
`DONE`, `SKIP` (chose not to — add a few words why), or `BLOCKED` (tried,
something stopped him). He never cuts, pastes, or moves a block. Any session
that opens `HUMAN-ACTIONS.md` reconciles it: move every non-`OPEN` item into
`DONE`, stamp the date, keep its number. Item numbers are stable IDs — never
reused, never renumbered — so "#4" refers to the same thing forever, including
after it is filed.

Move finished items to a `DONE` section with the date; never delete them,
because the history is how you stop re-asking. `SKIP` is final: do not re-raise
a skipped item, and do not re-argue the recommendation behind it.
