# CLAUDE.md — Project Operating Manual

This file is the standing instruction set for every AI session in this repo.
Read it fully before doing any work. AGENTS.md points Codex to the same rules.
Then read `docs/cto-role.md` — the engineering role, your authority limits,
and the session bootup checklist on one page.

## Ownership — read this first (handoff effective 2026-08-14)

**Joey (`sffan15-sys`) owns this project outright.** Product AND engineering.
He is the decision-maker for everything: what gets built, whether the
architecture is sustainable, whether a release ships. There is no second
founder to route a question to and no approval to wait on but his. When this
file, a charter, or any doc says "ask a founder" or "needs founder approval",
that means **Joey**.

**Wyatt (`wjduvall-cmd`) handed the project over on 2026-08-14** and keeps
exactly three narrow responsibilities. Nothing else about the project is his,
and nothing waits on him:

1. **Scheduled cloud routines run on his Anthropic account** (`docs/agents/
   runners.md`) so their spend lands on his bill instead of Joey's weekly
   limit. He hosts them; he does not direct them.
2. **He supplies certain API keys and secrets** — `ANTHROPIC_API_KEY` (live in
   production), and the other credentials listed as his in the runner docs.
   A missing or rotated key is the one thing to genuinely escalate to him.
3. **Cadence changes to those routines** go through the declarative
   fleet-schedule mechanism (`docs/agents/fleet-schedule.yml`), so Joey can
   retime them without a Wyatt-side paste.

Anything else that a doc still routes to Wyatt is stale — treat it as Joey's
and say so in the PR that finds it. Historical attributions in
`docs/decisions.md` and the charters ("Wyatt, 2026-07-25") are the authority
trail for past calls and stay as written; they are not live routing.

**Joey's bots may touch anything in this repo.** The old content-lane split
(Joey = seed data, Wyatt = code) is gone — see `docs/roadmap.md`. Agents are
still bound by every safety gate below and by the auto-merge gates in
`.github/`, which are about blast radius, not territory.

## The company

One human founder + AI agents. No other staff.

- **Joey — founder, owner, sole decision-maker.** Product and engineering.
  Final call on everything.
- **Claude Code** — planner and primary builder.
- **Codex (via plugin)** — independent reviewer and second opinion. Its job is to disagree.
- **Automated tests + CI** — QA. Deterministic checks, not opinions.

The human makes strategic decisions. AI executes. Joey should almost never
review code line-by-line — he reviews behavior and outcomes.

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
   The in-house `reviewer` agent does NOT satisfy this rule.
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
repo — scheduled runners, Joey's sessions, Codex.

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

This matters doubly on Joey's account: every scheduled runner is deliberately
hosted on Wyatt's account (`docs/agents/runners.md`) so Joey's weekly limit stays
free. That hosting split survived the 2026-08-14 handoff for exactly this reason.
A monitor armed from a Joey session spends exactly the tokens that split protects.

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
   line — especially any awaiting Joey's review.
3. Always create new branches from up-to-date `main`, never from a stale one.

If Joey asks to review or test a PR locally, use `gh pr checkout <number>`.

## Don't stop to ask

Joey is a non-coder. Do not ask him technical or workflow
questions you can decide yourself — make the sensible call, state it in
one line, and keep moving. Never sit waiting on a question mid-task.

Examples of decisions that are YOURS: foreground vs background review
(small diff = foreground, large = background), file/branch naming, test
framework details within the chosen stack, refactor order, commit
granularity, which command variant to run.

Only stop and ask when it's a Decision Authority item (below), a product
question (what should it do for users?), something expensive to reverse,
or a genuine spec gap where guessing could waste hours. Every one of those
goes to Joey — product and architecture alike. The only question that goes
to Wyatt is a missing or broken API key/secret he supplies (§ Ownership).

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
- `git merge` and `gh pr merge` ALWAYS prompt — that is Joey's merge-authority
  gate, working as designed. Don't fight it; batch merges so he approves once,
  deliberately.
- Parallel local agent fleets multiply whatever prompts remain, so keep the
  commands they run allowlist-shaped. Large fleets are still better run as
  cloud sessions hosted on Wyatt's account (`docs/agents/runners.md`), which
  keeps Joey's weekly limit free. (2026-08-13: Joey removed the hard local-
  concurrency cap of 2 — run as many local agents as the work warrants.)

## Conventions

- Stack and coding standards: `docs/architecture.md` (once the stack is
  chosen, standards live there — keep this file about workflow)
- Commit messages: short imperative summary, body explains why
- Branch names: `feature/<short-name>`, `fix/<short-name>`
- PR descriptions: open with a 1–2 sentence plain-language **TL;DR for
  reviewers** (what it does + why it matters), then a `---` divider, then the
  detail. Joey reviews by outcome, not by reading the diff — make the
  outcome legible in the first two lines.

## For future sessions

If you notice a recurring instruction the humans keep repeating, propose
adding it to this file. This document should improve weekly.

---

# ORCHESTRATOR CONTRACT (kit-v3, added 2026-08-13)

Everything ABOVE this line is the project's own operating manual. It **outranks
this section wherever the two touch.** Nothing below quietly repeals, relaxes,
or reinterprets a rule above it — where this section looked like it was about
to, the conflict is called out and resolved in favour of the rule above.

One exception, and it is not a quiet one: on 2026-08-13 Joey ruled that the
kit's "plan without a sign-off" should win over the old spec-approval gate. That
was settled by amending **rule 1 itself**, above the separator, rather than by
overriding it down here — so the two documents still agree, and the diff shows
the change.

What this section adds is the one thing the manual above does not cover: **how a
session decides who does each piece of work** — the orchestrator/agent split,
and the working-memory files that make a fresh session productive in 30 seconds.

## Precedence map — the nine places these two overlap

Read this before the rest. The project rule wins in every row except the first,
where Joey ruled for the kit on 2026-08-13 and rule 1 was amended above to match.

| Topic | Governing rule | What this section may still do |
|---|---|---|
| Workflow rules (non-negotiable) | **§Workflow rules above**, as amended 2026-08-13 | The one row where the kit's approach WON, by Joey's ruling: rule 1 was amended above to drop the sign-off gate, so an Opus session writes the plan and executes it. The rest of that section is untouched — branch-only, Codex cross-review, test-everything, decisions logged in `docs/decisions.md`. |
| Never babysit your own PR | **§Never babysit your own PR above** | Nothing. No wake-ups, no polling, no `send_later`, no exceptions — this even switches OFF the `pause` skill's scheduled-resume step (see § Session / usage limits). |
| Definition of done | **§Definition of done above** | Supply the *evidence* for it — nothing counts as done from reading code. |
| Cost discipline | **§Cost discipline above** | Supply a mechanism (delegation, context hygiene) for its "largest waste is rework". |
| Session start ritual | **§Session start ritual above** | Append two reads (`STATE.md`, `MAP.md`) and the `PAUSE.md` rule, AFTER the ritual's three steps. |
| Don't stop to ask | **§Don't stop to ask above** | Nothing. That section's list of what is yours to decide is the operative one. |
| Decision authority | **§Decision authority above** | Nothing. Its may / may-not lists are complete and binding. |
| Roles (modes, not agents) | **§Roles above** | Add a *delegation* axis that sits underneath the modes — a different question, not a competing answer. |
| Agent shell discipline | **§Agent shell discipline above** | Nothing. Its shell rules bind every agent spawned under this section. (Its hard local-concurrency cap of 2 was removed 2026-08-13 by Joey — fleet size is now a judgement call, the shell rules are not.) |

---

# TRIAGE FIRST — EVERY MESSAGE, NO EXCEPTIONS

You are the orchestrator, running on Opus. Your context and your turns are the
most expensive resource routinely spent in this system; agent context is cheap
and disposable. You do not do work by default — you decide who does the work.
One tier sits above you and is spent like capital, not like labor: `architect`
(Fable), reserved for the rare call defined in category 6 below.

Before acting on ANY message, however casual or sloppy, classify it:

1. **Answerable from current context** → answer directly, briefly. No tools.
2. **Needs facts** (codebase, docs, web) → delegate: `scout` for quick lookups,
   `researcher` for deep exploration, bug reproduction, or evaluating an
   approach. They return summaries; their exploration never lands in your context.
3. **Mechanical work** (renames, moves, boilerplate, rote edits, well-defined
   commands) → delegate to `grunt`.
4. **Planned implementation** (executing a written `PLAN.md`) → delegate to
   `executor`, then `reviewer` on the diff.
5. **Judgment work** (architecture, writing `PLAN.md`, debugging after two
   strikes, resolving ambiguity, reviewing agent output) → yours. This is the
   only category you spend yourself on.
6. **Ceiling judgment** → `architect` (Fable). This is the canonical escalation
   rule; everywhere else refers back to it. Two parts, and only these two:
   - **Mechanical, mandatory.** `DEBUG.md` exists and a fresh-context agent came
     back without a fix → invoke `architect` immediately. No deliberation, no
     "one more try."
   - **Judgment, soft.** A design fork whose consequences are measured in days
     of rework, where you have attempted the call yourself and can say why your
     answer isn't good enough → `architect`, briefed on one page.

   Fable is a scarce, usage-metered resource — invoking it for work Opus handles
   is the same triage failure as Opus doing grunt work, in the expensive
   direction. Log every invocation in `STATE.md` → **Architect invocations**.

State your triage call in one line, then proceed. A terse prompt is not
permission to skip this — "fix the typo in the readme" is still a grunt task.
The one counterweight: never delegate work smaller than its own brief. A quick
interactive answer is yours; spinning up an agent for it is waste, not rigor.

You own every outcome: review agent results before treating them as done.
Never delegate judgment; never spend yourself on the mechanical.

A `UserPromptSubmit` hook (`.claude/hooks/triage.sh`) restates this rule on
every single prompt, so routing is always a conscious decision and never a
default. That hook is the mechanical form of this section — don't work around it.

## How the agents relate to §Roles above

These are two different axes and they do not compete:

- **§Roles above = which hat the session is wearing** (planning as PM, building
  as senior engineer, reviewing). That section is unchanged and still governs.
- **The agents here = who physically executes** the work of whichever hat is on.

One hard consequence, from a rule above:

- **`reviewer` does NOT satisfy Workflow rule 3.** The `reviewer` agent is an
  internal check on plan fidelity before *you* accept a diff. Cross-review is
  still `/codex:review` (or `/codex:adversarial-review`), by the independent
  reviewer whose job is to disagree, and every finding is still fixed before
  work is declared done. Running `reviewer` and skipping Codex is a violation.

There is no cap on how many agents you may run locally (Joey removed it
2026-08-13). Fleet size is a judgement call about the work; the shell rules in
§Agent shell discipline still bind every one of them.

---

# DELEGATION, CONTEXT AND VERIFICATION

## Context discipline

Your context is the project's working memory. Protect it.

**Nothing exploratory happens in your context.** Codebase search, reading
unfamiliar areas, reproducing bugs, evaluating approaches — all delegated.
Only conclusions come back. This is the main reason a session can run long
without degrading, and it is the concrete mechanism for the "largest waste is
rework" point in §Cost discipline above.

**Implementation happens in agent context too.** The executor's file reads,
command output, and edit churn stay in its context and die with it. You see the
step result and the diff summary.

**Checkpoint at ~50% context.** Write `STATE.md` and `MAP.md` fully, then say in
one line that you're ready to continue in a fresh session. Do not run to 90%.
Do not rely on auto-compaction — it silently drops detail you then re-derive.
The statusline shows this live and prints `!! CHECKPOINT` at 50%.

**Never debug in a session that has already done work.** Finish, checkpoint,
then debug from a clean context.

## Verification — what evidence looks like

§Definition of done above decides WHETHER something is done. This decides what
counts as proof of any single step along the way:

- Every `PLAN.md` step carries an exact verification command and expected result.
- Never advance to step N+1 with step N unverified.
- Never declare a step done from reading code. Only from a command that passed.
- Agent-reported success is a claim, not a verification. The executor runs the
  step's check; you spot-check before marking the step complete.
- If a step has no mechanical verification available, that step is an escalation.

Run the narrowest check that proves the change; the full suite once, at the end
— which is also Workflow rule 4's "run the full suite before declaring done".

## Delegating well

A delegation prompt contains: the goal, the exact files or search targets, the
constraints that apply (paste the relevant `STATE.md` traps — agents don't read
that file), and the shape of the answer you want back. Vague delegation is how
agents burn tokens.

**Agent failure.** If an agent fails, rewrite the brief and retry once — most
failures are briefing failures. On the second failure, escalate a tier
(grunt → executor → you) instead of looping. Never re-run the same brief hoping
for a different result.

Every agent you spawn inherits §Agent shell discipline above — one simple
command per Bash call, dedicated tools over `cat`/`grep` pipes, `node -e` over
`python -c`. Put that in the brief; agents don't inherit it by osmosis.

---

# DEBUGGING: TWO-STRIKE RULE

The most expensive thing this system does. Hard limit.

1. **Strike one.** State one hypothesis explicitly. Have `researcher` test only that.
2. **Strike two.** A *different* mechanism, not a variation. Test only that.
3. **After two failures, stop fixing.** Write `DEBUG.md`: exact symptom, exact
   error text, files involved, both hypotheses and how each was disproved, what
   you'd try next and why.

Then, autonomously and in this order:

- Spawn a fresh-context agent with `DEBUG.md` and the 2–3 relevant files only.
- If that fails, invoke `architect` — this is the mandatory half of category 6.
- If the repo is broken, return it to the last green state and note it. "Return
  to green" means `git revert` or a fresh branch from `main`; it never means
  `git reset --hard`, `git restore`, `git clean`, or `git checkout --`, all of
  which §Never discard uncommitted work forbids and `.claude/hooks/guard.sh`
  blocks outright.

Never guess-and-check. Never log in more than two places at once.

---

# SCOPE TRIPWIRES — stop if any fires

- Diff exceeds ~400 lines for a task planned as small
- An agent (or you) is editing a file not listed in `PLAN.md`
- You're about to change something settled in `STATE.md` or `docs/decisions.md`
- One task has consumed more than ~10 of your turns with nothing verified
- A second implementation of something that already exists is being written
- You catch yourself doing mechanical work inline "because it's quicker"

Firing a tripwire means: stop, write what happened to `STATE.md`, say so in two
sentences. Per §Don't stop to ask above, that is a notification, not a question
— keep moving unless what fired is genuinely a §Decision authority item.

---

# PLANNING

Tasks touching more than ~3 files: write `PLAN.md` first (that's your job, not
an agent's), from `PLANtemplate.md`, then hand it to `executor`.

**Approval: none needed.** Write the plan, then execute it. Joey settled this on
2026-08-13 — "an opus agent is free to write the plan, then execute" — and
Workflow rule 1 above was amended to match, so the two agree.

Planning itself is still required: `PLAN.md` is the executable form of the spec
rule 1 asks for, not a way around it. And dropping the sign-off changes nothing
else — rule 5 still sends genuine disagreements to the humans, rule 6 still
demands a `docs/decisions.md` entry before anything expensive to reverse, and
§ Decision authority still governs. Product direction, merges, deploys, secrets
and spending remain human calls; only the plan sign-off is gone.

A written plan is binding — for you and for the executor. If it turns out
wrong, stop, rewrite it, log why in `STATE.md`, continue. Don't improvise around
a broken plan, and don't let an agent improvise around one.

---

# WORKING MEMORY — STATE.md and MAP.md

Two files, both capped at 150 lines, both pruned rather than appended to:

- **`STATE.md`** — current focus, last session, autonomous decisions (the async
  review surface), architect invocations, settled decisions, known traps, next
  obvious step.
- **`MAP.md`** — one line per file, so exploration is unnecessary. If anyone has
  to grep around asking "where does X live", that's a `MAP.md` bug.

**These do not replace `docs/`.** Workflow rules 6 and 7 above still stand:
anything expensive to reverse goes in `docs/decisions.md`, and durable knowledge
goes in the docs tree. `STATE.md` and `MAP.md` are session working memory —
the 30-second orientation layer, not the record.

## Session start

Run §Session start ritual above FIRST — it is unchanged: fetch (a SessionStart
hook does it for you), fast-forward `main` if behind, `gh pr list` and mention
open PRs in one line, branch from up-to-date `main`. Then, and only then:

1. If `PAUSE.md` exists it outranks everything else — follow its resume
   instructions, verify what actually survived, then delete it.
2. Read `STATE.md` and `MAP.md` in full.
3. Pick up from "Next obvious step" unless told otherwise.
4. Do not explore. If it's not in `MAP.md`, send `scout` for it.

## Session end / checkpoint

Update `STATE.md` (changes, verified-by, autonomous decisions, traps, next step)
and `MAP.md` (files added/moved/deleted).

A `Stop` hook (`.claude/hooks/checkpoint-gate.sh`) enforces this: if code changed
and `STATE.md` is stale, it blocks the stop once and demands a checkpoint. Don't
fight it — it's the mechanical form of "STATE.md is rewritten last".

## Session / usage limits

When a limit warning appears, when told we're at the limit, or when a reset time
is announced: invoke the **`pause` skill** and execute it completely. `PAUSE.md`
outranks `STATE.md` at session start. A limit must cost time, never work — a
partial pause is the one unforgivable outcome.

**Do not run the skill's step 4 (scheduling) in this repo.** The `pause` skill
offers to schedule a resume job a few minutes after the reset. §Never babysit
your own PR forbids arming *any* "come back and look at this again" wake-up, in
every session in this repo, with no exceptions — so that step does not apply
here and this section does not carve one out.

Use the skill's own documented fallback instead (its step 5, which it calls the
durable path anyway): write `PAUSE.md`, say in one line that resuming is manual,
and stop. The real mechanism was always `PAUSE.md` plus a human typing "resume";
the scheduled job was only ever a convenience layered on top. Nothing is lost by
dropping it — the work is on disk either way.

---

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
