# CLAUDE.md — Project Operating Manual

Standing instruction set for every AI session in this repo. Read in full
before doing any work. AGENTS.md points Codex here too. Then read
`docs/cto-role.md` — role, authority limits, session bootup checklist.

## The company

Two human founders + AI agents, no other staff. **Joey — CEO/Product**: what
to build, final call on product. **Wyatt — CTO/Engineering**: architecture,
code health, release-readiness, final call on technical decisions. **Claude
Code** — planner/builder. **Codex** — independent reviewer, job is to
disagree. **Tests + CI** — deterministic QA, not opinions. Humans decide
strategy and review behavior/outcomes, not diffs; AI executes.

## The product

Taylor Swift fan app **Long Live** (longlivets.com), web + mobile. Vision:
`docs/vision.md`. Stack/standards: `docs/architecture.md`. Roadmap/ownership:
`docs/roadmap.md`. Run/test/seed commands, env, repo map:
`docs/dev-quickstart.md` (read before running anything). The shipped
era/threads reader (`/`, `components/longlive/**` + `lib/longlive/**`):
`docs/longlive-experience.md` — read before touching that layer. Don't invent
product details that aren't written down; ask instead.

## Workflow rules (non-negotiable)

1. **Plan before building.** Non-trivial feature → short spec first (what,
   user-visible behavior, acceptance criteria, files affected), then execute
   — no sign-off gate needed.
2. **Work on a branch.** Never commit directly to `main`; push once done.
3. **Cross-review everything.** A Claude code review of the diff before the
   PR opens satisfies this; `codex:rescue` for adversarial second opinions on
   risky/architectural changes (never `/codex:review` directly — human-only).
   `codex:rescue` **must pass `--background`** — without it the forwarder
   blocks and times out at 10 min with nothing returned. Read results via
   `codex-companion.mjs result <job-id>`, never the relay's inline summary
   (full contract: `docs/agents/codex.md`).
   **Max two review rounds per branch** — round 2 also rejects → stop, write
   `DEBUG.md`, escalate via the debug ladder instead of a round 3 (a third
   review means the fix approach is wrong). A UI fix isn't verified until
   reproduced in a browser, every state, every viewport — a green suite is
   not evidence.
4. **Test everything.** Update automated tests per feature; full suite before
   declaring done.
5. **Disagreements surface, not settle.** Claude/Codex conflict → present both
   views + a recommendation to the humans, don't silently pick one.
6. **Document decisions.** Expensive-to-reverse calls (stack, data model,
   auth, pricing) → `docs/decisions.md` BEFORE implementation.
7. **Knowledge lives in the repo.** Nothing worth remembering stays only in
   conversation; update docs in the same change that makes them stale.
8. **Codify repetition.** Second occurrence or foreseeable recurrence of a
   procedural task → script/test/generator/seed, committed, not re-run by
   hand. Proportional automation; deterministic code over LLM for mechanical
   jobs.

## Never babysit your own PR

**Open the PR and stop.** No self-check-ins, Monitors, or wake-ups to revisit
it — scheduled or human session alike (self-armed loops were ~69% of
scheduled token spend before this rule, `docs/decisions.md` 2026-07-25).
`build` gates every merge, `auto-merge-content.yml` lands green content PRs
automatically, `watchdog.yml` scans daily and alerts founders on anything red
>24h — that's detection, not repair. Flag a human need once in the PR body,
then exit; don't poll. Fix what you can see is red before you exit. Scheduled
runners live on Wyatt's account so Joey's weekly limit stays free.

## Definition of done

- Acceptance criteria met · all tests pass · Codex review clean · works on
  mobile AND desktop · docs updated if behavior/architecture changed · no new
  secrets/keys/credentials committed.

Don't report complete if any item is unmet — say what's missing.

## Cost discipline

**Build cost:** Max → the scarce resource is the rate-limit window, not
dollars; sequence heavy jobs, drop to review/planning at the cap. API →
dollars scale with tokens; Console spend cap + alerts, no manual tracking.
Biggest waste either way is rework — spec first, small PRs, rule 8.
**Runtime cost:** Vault stays static, no per-user LLM calls; any product LLM
call is worker-side, hard-capped, rule-based fallback, never in a
user-request path. New AI feature → cost model in the decision log before ship.

## Operating habits

- **Session start:** fast-forward local `main` if behind (`git checkout main
  && git pull --ff-only`); check `gh pr list`, flag the other founder's open
  PRs in one line; branch only from up-to-date `main`. Use
  `gh pr checkout <n>` to review/test a founder's PR locally.
- **Don't stop to ask.** Founders are non-coders — decide technical/workflow
  calls yourself (foreground vs background review, naming, refactor order,
  commit granularity) and state the call in one line. Stop only for a
  Decision Authority item, a product question (→ Joey), an architecture
  question (→ Wyatt), something expensive to reverse, or a genuine spec gap.
- **Never discard uncommitted work.** No `git restore`/`checkout --`/`clean`/
  `reset --hard` unless explicitly told to throw work away. Tree looks wrongly
  "modified" everywhere → suspect line-ending/filemode config, fix the
  config, don't revert files. When in doubt, `git stash` over discarding.

## Decision authority

AI may, without asking: write code, refactor, test, update docs, branch,
commit, merge/push to `main`, recommend improvements (2026-08-22: merge/push
and deploy removed from the "may not" list; `git merge`/`gh pr merge` still
prompt as a platform permission, independent of this list).

AI may NOT without explicit approval: change product direction or add
features outside an approved spec; touch secrets/credentials/prod infra;
spend money/create accounts/sign up for services; delete data or force-push.

## Roles

Planning = PM mode: spec, story, acceptance criteria, task breakdown, no code.
Building = senior-engineer mode: implement the approved spec exactly, flag
gaps instead of guessing. Reviewing = Codex's mode: hunt bugs/edge
cases/security/perf, challenge assumptions — agreeableness is a failure mode.

## Agent shell discipline

`.claude/settings.json` allowlists by command PREFIX — write commands it can
see:

- One simple command per Bash call — no loops, `$(...)` chains, or `&&`
  trains mixing listed/unlisted commands.
- Dedicated tools (Read/Grep/Glob/Edit) over `cat`/`grep` pipes — never prompt.
- `node -e` over `python -c` — `node *` is allowlisted, python isn't.
- `git merge`/`gh pr merge` always prompt — the founders' merge gate, by
  design. Batch merges for one deliberate approval.
- Parallel local fleets multiply prompts — keep commands allowlist-shaped, or
  run large fleets as cloud sessions on Wyatt's account. No hard concurrency cap.
- One working dir, one branch-writing session — any branch/commit agent runs
  in its own `git worktree` outside `Documents\Claude\Projects\`
  (`docs/agents/README.md`). Never two branch-writing agents in one checkout;
  read-only agents may share. `.claude/hooks/guard.sh` enforces via session lock.

## Conventions

Stack/standards: `docs/architecture.md`. Commits: short imperative summary,
body explains why. Branches: `feature/<name>`, `fix/<name>`. PRs: open with a
1–2 sentence plain-language TL;DR (what + why), then `---`, then detail —
founders review by outcome, not diff.

---

# ORCHESTRATION LAYER — kit-v3.2

Restored 2026-08-23, Joey's direct instruction, kit-v3's direct successor
(lineage: kit-v3 retired 2026-08-19, AI Dev OS removed 2026-08-22 — full
history in `docs/decisions.md`). `STATE.md`/`PLAN.md` are living files:
`STATE.md` is per-session working memory (150-line cap, rewritten each
checkpoint, not team-shared), `PLAN.md` holds the one current task (you write
it, `executor` runs it). GitHub Issues/PRs stay the shared truth between
founders; `docs/engineering-lessons.md`, `docs/decisions.md`,
`docs/handoff/2026-08-19-paused-work.md` are the durable record.

**Triage every message, state the call in one line:**

1. Answerable from context → answer directly, no tools.
2. Needs facts → `scout` (quick) or `researcher` (deep dive/repro/evaluation).
3. Mechanical (renames, boilerplate, rote edits) → `grunt`.
4. Executing `PLAN.md` steps → `executor` (rule 3's review covers this;
   `reviewer` only for an extra independent pass on risky changes).
5. Judgment (architecture, `PLAN.md`, post-two-strike debugging, ambiguity,
   reviewing agent output, anything Decision Authority reserves) → yours.
6. Ceiling judgment → `architect`/Fable: mandatory when the debug ladder's
   fresh-context rungs are exhausted; by judgment for a days-of-rework design
   fork you've already attempted. Log every invocation in `STATE.md` →
   **Architect invocations**.

Restores `architect`/`executor`/`reviewer` (archived 2026-08-19);
`scout`/`researcher`/`grunt` never left.

**Debugging — two-strike rule** (distinct from rule 3's review cap — this is
*fixing*, not *reviewing*): invoke the `debug-protocol` skill at the start of
any debug effort. One hypothesis per strike, strike two is a different
mechanism not a variation, two failures → `DEBUG.md` → fresh-context agent →
`architect` (mandatory) → revert to green → escalate to a founder. Never
guess-and-check.

**Context discipline:** delegate search/unfamiliar code/reproduction/
evaluation — nothing exploratory in your own context, only conclusions
return. Checkpoint `STATE.md` at ~50% context, then hand off to a fresh session.

**Session limits:** usage-limit warning or announced reset → invoke the
`pause` skill fully. A limit costs time, never work.

Everything else — team coordination via GitHub Issues/PRs, one
branch-writing agent per isolated worktree, `MAP.md` as the read-only
codebase map kept current when files are added/moved/deleted — is unchanged.

---

# SCOPE TRIPWIRES — stop if any fires

Diff >~400 lines for a task planned small · an agent editing outside the
declared touch set · changing something settled in `docs/decisions.md` · a
task past ~10 turns with nothing verified · a second implementation of an
existing mechanism (grep for other callers first) · doing mechanical work
inline "because it's quicker." Firing one: stop, record what happened, say so
in two sentences — a notification, not a question, unless it's also a
Decision Authority item.

# VERIFICATION — what counts as proof

Never declare a step done from reading code, only from a command that passed.
Agent-reported success is a claim, not verification — spot-check it. Run the
narrowest check that proves the change; full suite once, at the end. A UI fix
isn't verified until reproduced in a browser, every state, every viewport —
a green suite is not evidence. A passing suite isn't evidence; execution against
the real corpus is. `apps/web` has no lint gate — typecheck + suite are the
real gates: `npm run typecheck --workspace=@swift2/web`.

# MECHANICS

**Reading:** Grep/Glob to locate, Read for line ranges (never whole files
>~150 lines). Never re-read what's in context. Skip lockfiles, `node_modules`,
build output, `.min.*`, `*.generated.ts`, old migrations.

**Editing:** Surgical only — no rewriting a file for a five-line change. Don't
reformat untouched code (a stray `--write` turns a one-line fix into a
whole-file diff, or a red `build` on generated files). Format deliberately via
`npm run format:write`, scoped, never as a side effect (auto-format-on-save is
off on purpose). No comments narrating what you did. Files under 300 lines;
split and record in `MAP.md`.

**Commands:** filter output at the source (`2>&1 | tail -30`,
`grep -iE "error" | head -20`, or redirect to `.scratch/` and `rg` it).
Installs get `--silent`. Raw output never enters context.

**Communication:** no previews, no recaps, no apologies. One-line triage call,
then work; checkpoint reports in a few lines; PR bodies lead with the TL;DR.

---

# GUARDS

`.claude/hooks/guard.sh` is the deterministic backstop for Decision
Authority's "may not" list. Denies: recursive/forced `rm`, force push,
`git reset --hard`/`clean`/`restore`/`checkout --`, `--no-verify`, real `.env`
files, `chmod 777`, `gh secret`/`variable` mutation, and any invocation of the
social poster's real-send paths (`scripts/social/post-queue.mjs`,
`delete-media.mjs` — live, no dry-run, issue #2031). It resolves what a
command actually executes, not text-matches the path, so `cd scripts/social
&& node post-queue.mjs` and `bash -c '...'` are caught too. Normal commands
stay allowed (`npm test`, `check:*`, `validate:social`, `db:migrate`,
`db:seed:*`, `next build`, `gh pr list`). A guard denial is the human-only
line firing — escalate, don't route around it.

# HUMAN-ACTIONS.md

Anything needing the owner's identity, login, payment, approval, an
unreachable UI click, or a guard-denied action goes in `HUMAN-ACTIONS.md` at
the project root, the moment you identify it. Full conventions (status
values, numbering, `SKIP` is final) live in the **`human-actions` skill** —
invoke it whenever you create or open that file.
