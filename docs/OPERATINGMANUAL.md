# Operating Manual — Opus Orchestrator, Fable on Reserve (Max Plan)

This is the part that isn't a prompt. The prompt files (`CLAUDE.md`, `STATE.md`,
`MAP.md`, `PLAN.md`) plus the `.claude/` scaffold are maybe half the win. The
rest is how you run sessions.

The frame has changed since v1 of this system: you're on Max, so token
efficiency is no longer the survival constraint — but it's still the throughput
and *quality* constraint. A bloated orchestrator context doesn't just cost
money; it degrades judgment. Everything below is written for that trade.

---

## 1. The architecture: one good brain, many cheap hands, one genius on call

Every session starts on Opus (`settings.json` → `"model": "opus"`). The
orchestrator never grinds; it triages, plans, judges, and reviews. Everything
mechanical or exploratory runs in a subagent on a cheaper model, in disposable
context. And above the orchestrator sits Fable — invoked as the `architect`
agent, almost never, for the one call per week that genuinely needs it.

Why not Fable-first (the v2 design)? Because session usage is the real budget
on Max, and Fable burns it fastest. Running Fable as the main loop spends the
scarcest resource on triage calls, status summaries, and routine review —
work Opus does indistinguishably well. The v3 rule: **the most capable model
is an escalation target, not a default.** The invocation budget lives in one
place — `STATE.md`'s **Architect invocations** section — so it can't drift into
three different numbers. Over budget means escalation discipline slipped;
sustained zero on genuinely novel work means calls that deserved it are being
under-served. Both directions are triage failures.

Four layers make this stick:

**Layer 1 — `settings.json`.** Sets the main-loop model to Opus for every
session. No remembering, no `/model`.

**Layer 2 — agent definitions (`.claude/agents/*.md`).** Six roles, each with
a model tier and a description that tells Claude when to delegate proactively:

| Agent | Model | Job |
|---|---|---|
| `scout` | Haiku | Quick lookups: where does X live, what's the signature, find the config |
| `grunt` | Haiku | Renames, moves, boilerplate, rote edits, well-defined commands |
| `researcher` | Sonnet | Deep exploration, bug reproduction, approach evaluation, docs research |
| `executor` | Sonnet | Implements `PLAN.md` steps exactly, runs each verification |
| `reviewer` | Sonnet | Independent diff review against the plan, before "done" |
| `architect` | **Fable** | Escalation only: cross-cutting design calls, plans that resist decomposition, bugs that beat two strikes AND a fresh agent |

**Layer 3 — the triage hook (`.claude/hooks/triage.sh`).** A `UserPromptSubmit`
hook that fires on *every* prompt you type and injects the triage rule as
context alongside it. This is the piece that makes sloppy prompts safe:
`CLAUDE.md` is read once at session start and fades over a long session; the
hook is re-asserted every single turn, deterministically. The orchestrator
still makes the routing decision — the hook just guarantees the decision is
always made consciously instead of defaulted.

Honest caveat: the triage hook injects guidance, not enforcement. In practice a
per-turn instruction is followed very reliably, and the failure mode is benign
(Opus does work itself that Sonnet could have done). If you ever see chronic
non-delegation, tighten the hook text — it's one shell script. Watch the
opposite failure too: `architect` invocations for routine calls. Both are the
same disease — work running on a more expensive tier than it needs.

**Layer 4 — enforcement hooks.** Where guidance isn't enough, hooks are gates,
not advice. Current community consensus is blunt about this: prose in
`CLAUDE.md` is advisory (the model is even licensed to skip content it deems
irrelevant), while a hook's verdict is code. The kit ships **four hooks** in
total: `triage.sh` from Layer 3, plus these three gates.

| Hook | Event | What it enforces |
|---|---|---|
| `guard.sh` | PreToolUse (Bash) | Blocks rm -rf, force-push, hard reset, `--no-verify`, real `.env` access (`.env.example` and friends stay readable) — the human-only list, mechanically. Works even in skip-permissions sessions. |
| `checkpoint-gate.sh` | Stop | Blocks ending a turn when code changed but `STATE.md` is stale (>20 min). The 50% rule's enforcement arm. `STATE.md`/`MAP.md`/`PAUSE.md` don't count as code, so a pause turn is never blocked. |
| `post-edit.sh` | PostToolUse (Edit\|Write) | Auto-formats every edited file (fill in `FORMAT_CMD` at kickoff). Clean diffs mean agents never "fix" formatting they weren't asked to touch. |

`statusline.sh` is *not* a hook — it's the `statusLine` setting in
`settings.json`, a command Claude Code runs to render the status bar. It prints
`[model] ctx N% lim N% ->HH:MM (branch)`: your 50% gauge, the usage-limit gauge
the pause protocol reads its reset time from, and a tripwire for silent model
reroutes (if it doesn't say opus, `/model opus`). Both percentages read `?` or
drop out before the first message of a session; that's expected.

`settings.json` also carries a `permissions.deny` list for secrets (real `.env`
files and `secrets/`) as a zero-cost native backstop under the guard hook. It
enumerates the real secret filenames rather than globbing `.env.*`, because deny
beats allow in Claude Code's permission precedence — a wildcard there would lock
out `.env.example` with no way to re-permit it.

---

## 2. Why long sessions still go non-linear

Unchanged physics, still worth knowing:

**Conversation replay.** Every turn resends the full transcript. A session of
N turns costs about N²/2 units instead of N. Turn 80 costs ~10x turn 8.

**Context reload.** A fresh session on a mature codebase re-reads files to
rebuild understanding you already paid for — unless it's externalized to
`STATE.md`/`MAP.md`.

**Rework loops.** A failed fix costs the attempt, the re-read, the diagnosis,
*and* lengthens the transcript, raising the price of every later turn.

**Output bloat.** Test runners, build logs, stack traces land in context at
full price forever after.

The orchestrator pattern attacks all four at once: exploration, implementation
churn, and command output now happen in agent contexts that get thrown away.
The orchestrator transcript stays short — triage calls, plans, summaries,
verdicts. That's also why it stays *smart*.

---

## 3. Session discipline

**One task per session. Clear between tasks.** Still the highest-leverage
habit, and still free.

**Clear at 50% context, not at 90%.** Auto-compaction silently drops detail
the agent then re-derives. A clean clear with a good `STATE.md` is strictly
better.

**Checkpoint before clearing.** `STATE.md` and `MAP.md` are what make clearing
free. If clearing feels expensive, those files are inadequate — fix them,
don't stop clearing.

**Never debug in a session that has already done work.** Finish, write the
symptom down, clear, debug fresh. A debugging session should start near-empty.

With delegation working, you'll hit 50% far later than you used to — the
orchestrator burns context slowly. Don't take that as license for marathon
sessions; the one-task rule is about coherence, not just cost.

---

## 4. Model tiering, v3

v1 said "plan on Opus, execute on Sonnet." v2 said "Fable never executes."
v3 says both, plus: **Fable never routines.** Capability flows downhill only
as far as it must; every task runs on the cheapest tier that does it well.

| Work | Who |
|---|---|
| Triage of every request; session orchestration | Opus (re-asserted every turn by hook; advisory) |
| Architecture, writing `PLAN.md`, taste, ambiguity | Opus |
| Debugging after two strikes; reviewing agent output | Opus |
| Cross-cutting design with lasting consequences; plans that resist decomposition; bugs that beat two strikes AND a fresh-context agent | `architect` (Fable, escalation only, logged in STATE.md) |
| Deep exploration, repro, approach evaluation | `researcher` (Sonnet) |
| Executing a written plan; CRUD, wiring, tests | `executor` (Sonnet) |
| Independent diff review | `reviewer` (Sonnet) |
| Lookups; where-does-X-live | `scout` (Haiku) |
| Renames, moves, mechanical edits, boilerplate | `grunt` (Haiku) |

The escalation test for `architect` is stated canonically in one place —
`CLAUDE.md` category 6 — and nowhere else, because three slightly different
phrasings of it collapse into never escalating. It has two parts: a *mechanical,
mandatory* one (DEBUG.md exists and a fresh-context agent came back without a
fix → escalate immediately, no deliberation) and a *judgment, soft* one (a
design fork costing days of rework, already attempted by the orchestrator, which
can say why its own answer isn't good enough → escalate with a one-page brief).
Read the rule there; don't paraphrase it into a third variant here.

The whole reason `PLAN.md` exists is unchanged: move thinking out of execution
so execution can be cheap and dumb. Plan once expensively, execute many times
cheaply — now inside one session instead of across two.

**The plan annotation loop** (the strongest single workflow pattern in current
practitioner writeups): treat `PLAN.md` as the steering surface, not chat.
The orchestrator drafts the plan; you annotate it inline ("NOTE: reuse the
existing helper", "NO — keep this sync"); it addresses all notes *without
implementing*; repeat until clean; then one mechanical execution pass. Files
survive compaction and session clears — chat steering doesn't. This is also
why the kit prefers its own `PLAN.md` over built-in plan mode for the
artifact, though starting a planning conversation in plan mode (Shift+Tab,
read-only) is a fine way to keep the orchestrator from jumping the gun.

---

## 5. Review and fresh eyes

**Review is the best tokens-per-value in the system.** After the executor
finishes, `reviewer` gets only `git diff` + `PLAN.md` — not the repo. A few
thousand tokens for a genuinely independent check that catches the class of
error that causes rework. Make it routine, not optional.

**The fresh-eyes handoff is your fix for bug loops.** When `DEBUG.md` gets
written, do not keep pushing in the same context. A stuck session is anchored
on disproven hypotheses and re-reads them at full price every turn. A fresh
agent with a clean symptom report and the 2–3 relevant files routinely solves
it for a fraction of the tokens. The two-strike rule automates the first
handoff; if you also run a second tool (Codex etc.), it makes a fine second
pair of fresh eyes with a genuinely independent prior — hand it `DEBUG.md`,
nothing else. Sequential, never parallel on one codebase: merge conflicts are
the most expensive artifact this system can produce.

---

## 6. Codebase rules that lower token cost

Your architecture *is* a token budget — and now it's also your agents' budget.
These aren't style preferences:

- **Files under 300 lines.** Reads are line-ranged and cheap; a 1,200-line
  file gets read whole, repeatedly, by every agent that touches it.
- **Feature slices that don't import each other.** Determines how much context
  a change requires, and what makes concurrent agent work safe if you ever
  need it.
- **Thin, explicit interfaces.** Wide implicit coupling means every change is
  a whole-repo read.
- **Colocate tests with source.** Halves the search cost of every change.
- **No clever indirection.** Registries, magic decorators, deep inheritance
  force exploration. Boring code is cheap code — and cheap-model-executable
  code, which is the new bar: if Sonnet can't execute it from a plan, it's
  too clever.
- **Keep the build quiet.** Warnings you've decided to ignore are pure tax —
  every agent reads them, every run, forever.

## 6b. Skills vs. subagents vs. MCP — where new capability goes

When you want to teach the system something new, current consensus routes it
by shape:

| It's a… | Package it as | Why |
|---|---|---|
| Connection to external data/APIs | MCP server | That's what MCP is for — but cap active servers at 2–3; unused schemas eat context before work starts. Prefer a CLI + skill for occasional integrations. |
| Multi-step work that would pollute context | Subagent | Disposable context, summary back. That's this kit's spine. |
| Reusable procedure ("how we do releases") | Skill (SKILL.md) | Progressive disclosure: ~100 tokens dormant, full text only when invoked. |
| A rule that must never be violated | Hook | Deterministic. Prose can be skipped; exit codes can't. |
| Standing fact about the project | CLAUDE.md / MAP.md | Loaded every session — keep it short (community bar: <300 lines total; models reliably follow only ~150–200 instructions). |

The kit ships exactly one skill — `.claude/skills/pause/SKILL.md`, the
session-limit protocol — precisely because it's a procedure that fires rarely
and costs ~30 lines of always-loaded contract otherwise. That's the pattern:
when a project develops a procedure (deploy ritual, release checklist, data
refresh), extract it from CLAUDE.md into `.claude/skills/<name>/SKILL.md`
rather than letting CLAUDE.md grow.

---

## 7. Measuring it

Track three numbers in a note. A week gives you a real answer.

1. **Tasks completed per session** (target: 1, cleanly).
2. **Orchestrator context % at task completion.** If the orchestrator routinely
   finishes above ~50%, delegation is leaking — work is happening inline that
   should be in agents.
3. **Two-strike escalations per week.** Your rework proxy. It should fall as
   `STATE.md`'s Known traps section grows.

A useful spot-check for #2: skim the transcript and count turns where the
orchestrator ran `grep`/`read`/edit loops itself. Each one is a triage miss.

The statusline is your live instrument for all of this: context % against the
50% rule, and the model name against silent reroutes (sessions can
occasionally get moved off opus — if the statusline shows the wrong model,
`/model opus` puts it back). Add a fourth tracked number while the v3 tiering
beds in: **architect invocations per week**, counted from STATE.md's Architect
invocations log and judged against the budget stated there.

One more loop worth running deliberately: **promote learnings upward.** When
the same trap appears twice in `STATE.md`, its fix belongs in `CLAUDE.md`, an
agent definition, or a hook — each promotion makes every future session
cheaper. The self-improving-agents crowd treats this as the core mechanic, and
they're right. (Claude Code's auto-memory feature can capture learnings
passively too; fine to enable, but `STATE.md` stays canonical — it's
git-tracked and machine-portable, memory isn't.)

---

## 8. Bootstrapping a new project (Step 1)

1. Copy this whole set — the `.md` files and the `.claude/` directory — into
   the repo root. `chmod +x .claude/hooks/*.sh .claude/statusline.sh`.
2. Fill in the Project facts block in `CLAUDE.md` by hand. Don't make an agent
   guess what you already know.
3. Amend for scope: prune the pre-authorized list, the tripwire thresholds,
   and the agent roster to fit the project. A static site doesn't need a
   `researcher`; a data pipeline might want a `validator`. Set `FORMAT_CMD`
   in `post-edit.sh`, and adjust `guard.sh` patterns to the project's real
   dangers.
4. On an existing codebase: one session, one job — "Have researcher read the
   repo and write `MAP.md` per the template. Change no code."
5. Seed `STATE.md` → Decisions that are settled with every architectural
   choice you're tired of re-explaining.
6. If you run a second tool, copy `CLAUDE.md` to `AGENTS.md`.
7. Commit all of it, including `.claude/`. Treat drift in these files as a bug.
8. First session: type something sloppy on purpose ("clean up the readme") and
   confirm you get a one-line triage call and a delegation. That's your smoke
   test that the hook is firing.

---

## 9. Running this autonomously

The honest trade first: **autonomy costs tokens unless verification density
goes up to match.** An unsupervised agent on a wrong path runs longer before
correction, and correction is the expensive part. The further you want the
system to run without you, the more of the work has to be mechanically
checkable.

**Four mechanisms replace the four things a human was doing:**

| Human was doing | Replaced by |
|---|---|
| Catching errors before they compound | Per-step verification commands in `PLAN.md` |
| Deciding small ambiguous things | Pre-authorized decision list in `CLAUDE.md` |
| Noticing scope creep | Diff-size and out-of-plan-file tripwires |
| Saying "clear and start over" | Delegation + self-checkpointing at 50% |

**Async review beats synchronous interruption.** The Autonomous decisions
block in `STATE.md` is the point. The orchestrator decides at full speed and logs; you
skim a dozen lines afterward. What you endorse gets promoted to settled
decisions (never re-litigated), what you reject gets reverted and written
into Known traps (never repeated). Both directions make the next session
cheaper. That's the compounding loop.

**Where you stay in the loop, honestly: product taste.** An agent will
generate plausible naming, copy, and visual direction for a week and none of
it will be yours. Cheap to answer, expensive to discover late. It's on the
human-only list — keep it there.

**Ramp it.** Autonomy amplifies whatever `MAP.md` and `STATE.md` contain,
including their gaps. Run supervised for a week, let Known traps and settled
decisions accumulate, then let it off the leash. If two-strike escalations
climb when you increase autonomy, your verification isn't dense enough yet.

---

## 9b. Session limits and the pause protocol

Usage limits are part of the operating environment, and the failure mode they
threaten is specific: work stranded uncommitted in a dying session, agents
stopped mid-task with their positions lost, and a restart that re-derives
everything. The `pause` skill (`.claude/skills/pause/SKILL.md`, triggered from
CLAUDE.md § SESSION / USAGE LIMITS) exists to make a limit cost *zero work* —
only time.

Your half of the contract as the human:
- **Confirm the reset time if it asks.** It reads the reset time off the
  statusline's `lim N% ->HH:MM` gauge when the payload carries it, so usually it
  won't need to ask. When the field is missing, "we're at the limit, resets at
  4pm" is a complete instruction.
- **Keep the session open if you can** — the scheduled resume is a session-local
  job and dies with the app. If you have to close it, the fallback is equally safe:
  `PAUSE.md` sits in the repo, and "resume" typed into any new session picks
  up from it (SESSION START reads PAUSE.md first, by rule).
- **Trust the file, audit the resume.** The first thing a resumed session does
  is verify PAUSE.md against the actual repo state — agents killed mid-write
  and background jobs that died are expected, detected, and redispatched, not
  assumed away.

What makes this reliable is the discipline the kit already enforces: STATE.md
current at every checkpoint, work committed early, agent positions captured
from their own reports. The pause protocol is just those habits executed on
demand, plus a wake-up call.

## 10. The short version

- Opus triages every message — the hook makes sure of it — and never does
  work a cheaper model could do from good instructions. But it never delegates
  work smaller than its own brief.
- Fable (`architect`) is reserve capacity: rare, logged, escalation-only.
  Invoking it for routine calls is the expensive twin of Opus doing grunt work.
- Rules that must hold go in hooks; rules that should hold go in CLAUDE.md.
- Steer plans by annotating `PLAN.md` inline, not in chat — files survive
  compaction.
- Autonomy is bought with verification, not permission. No mechanical check
  for a step means that step is the escalation.
- Three legitimate interrupts only: efficiency forks, scope boundaries,
  human-only actions. Everything else is decided and logged.
- All exploration and execution in agent context; only conclusions reach the
  orchestrator.
- Checkpoint at 50%. `STATE.md` + `MAP.md` make restarting free. Maintain
  them or nothing else works.
- At a usage limit: land the work, write `PAUSE.md`, schedule the resume,
  state the keep-the-session-open caveat. A limit should cost time, never work.
- Plan on Opus, escalate the rare ceiling call to Fable, execute on Sonnet,
  grunt on Haiku, from a written plan.
- Two strikes on any bug, then fresh-context agent, then revert to green,
  then the human.
- Review every diff against the plan with fresh eyes before it's "done."
- Filter every command's output before it reaches any context.
