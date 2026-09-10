# Can the Claude Routines live somewhere Hermes and Claude Code can both manage?

**Filed:** 2026-09-05 — Fable 5.1, low effort, kanban `t_6dcfb062` (board `swift2`).
**Asked by:** Joey, #long-live, 2026-09-05, verbatim: *"is there somewhere else
we can run & manage these same routines, somewhere not locked into my specific
account page, where Hermes (this OS) and claudecode can access the routines, add
new ones, delete old ones, and otherwise maintain the routines. I'm tired of all
the human actions associated with our current routines. I also have a feeling our
current routine set isn't maximally efficient."*

## Answer in one line

**Yes.** Move every routine to a scheduled GitHub Actions workflow in this repo
that runs the *same* prompt file via `claude-code-action` (Anthropic's official
action, MIT, already usable with the `ANTHROPIC_API_KEY` secret this repo has
had since 2026-08-24). Once a routine is a workflow file, adding / editing /
disabling / deleting it is an ordinary PR — which Hermes, Claude Code, Codex and
every kanban worker can already do today. The only thing that stays on a
personal account is the one-time `/install-github-app` (Joey, ~5 min, repo admin).

## What "Routines" actually are, and why they generate human actions

The 23 Swift2 runners (`docs/agents/runners.md` § Live trigger IDs) are
`claude.ai/code/routines` — a product feature of Joey's logged-in claude.ai
account, not the Anthropic API. Their live config (`job_config`: prompt, model,
cron, allowed tools, repo binding) is reachable only through the `RemoteTrigger`
tool, which exists solely inside a Claude Code session launched from that
account (`docs/agents/SYNC-T20-ROUTINE-PROMPTS.md` § "Why an agent session can't
just do this"). Every Hermes session and every kanban worker runs on an API key,
so none of them can touch a routine. That single fact is the root of the
recurring human-action items:

| HUMAN-ACTIONS.md | What Joey had to click | Why an agent couldn't |
|---|---|---|
| #41 | rename Karen's trigger (T-5) | no `RemoteTrigger` |
| #35 | disable 6 Vault lanes (Phase 4) | no `RemoteTrigger` |
| #38 | Kevin daily-desk cutover (T-10) | no `RemoteTrigger` |
| #37 | re-sync 22 prompts with the T-20 trailer | no `RemoteTrigger`; live prompt is a copy of the repo file that never self-updates |
| #10 / #11 | strip a connector / delete 6 duplicates | API cannot delete a routine or clear `mcp_connections` at all — UI only |
| #2258 (2026-08-23) | recreate all 23 after Wyatt's account lost them | routines are account-bound; the whole fleet vanished with the account |

Additional defects of the current surface, all verified in repo history:
`list` pagination is broken (repeats page 1, under-counts the fleet),
`job_config` PUT is a full replacement that has silently destroyed a trigger's
repo binding before (Cross-Link builder), there is no delete action, there is
no audit log or diff, and there is no way for a second person to see what runs
without being logged in as Joey. The "repo file is the source of truth" rule in
`runner-prompts/` is aspirational — the live copy is the one that runs, and the
two drift every time a prompt PR merges.

## The alternative: routines as scheduled workflows in this repo

This repo already runs **23 scheduled GitHub Actions workflows** (watchdog,
social-poster, news-worker, merch-*, brief-mailer, …) and one of them
(`appearance-discovery.yml`) already calls Anthropic with the repo secret. The
routines are the same shape — "on a cron, open a Claude session in this repo
with this prompt and these tools, let it open a PR" — just hosted on a different
scheduler. The mapping is 1:1:

| Routine field (`job_config`) | Workflow equivalent |
|---|---|
| `cron_expression` | `on.schedule.cron` (also UTC) |
| `prompt` (inline copy) | `prompt:` input reading `docs/agents/runner-prompts/<name>.md` **directly** — no copy, no drift, T-20-style resyncs disappear as a category |
| `session_context.model` | `claude_args: --model <id>` |
| `allowed_tools` | `claude_args: --allowedTools …` (same names) |
| git repo binding | implicit — the workflow runs in the checkout |
| `enabled` flag | `if:` guard on a repo variable, or comment out the schedule; either is a PR |
| `RemoteTrigger` manual run | `workflow_dispatch` — `gh workflow run <file>`, which Hermes can do today |
| Trigger ID | the file name; delete = `git rm` |

Managing the fleet then reduces to the operations every agent here already
has: `gh workflow list/enable/disable/run`, `gh run list --workflow`, and PRs.
The Routine Auditor's job (invariants in `docs/agents/routine-invariants.md`)
becomes a test over `.github/workflows/routine-*.yml` files instead of a
paginated API crawl, and every change to a routine gets a PR, a reviewer and a
diff.

### What it costs

- **Compute:** the repo is public, so GitHub-hosted runner minutes are free
  and unmetered. The ~15 enabled routines at ~30–90 min each are well inside
  the 6 h/job and 20 concurrent-job limits.
- **Tokens:** metered API usage on the same `ANTHROPIC_API_KEY`. This is the
  one genuine change: routines today run inside Joey's claude.ai plan (Max
  subscription allowance), so their tokens are effectively pre-paid; on
  Actions they bill per token. Order of magnitude for this fleet: Opus-class
  sessions with a repo checkout typically cost low single-digit dollars each;
  ~15 runs/day of mixed Opus/Sonnet/Haiku is plausibly **$1.5–4k/yr**. That
  crosses the >$100 commitment line, so it is a founder decision — and the
  single reason this document ends in a decision card instead of a migration
  plan. (A 3-day parallel pilot on two routines gives a real number before
  committing; see D1 below.)
- **Human setup:** one `/install-github-app` by a repo admin (Joey), one time.
  `ANTHROPIC_API_KEY` is already in repo secrets (HUMAN-ACTIONS.md #13).
- **Engineering:** one reusable workflow template + one thin file per routine,
  mechanical enough to be a single kanban card per batch.

### What does NOT carry over (be honest about it)

- **Session persistence / the `Claude_Code_Remote` connector.** Actions
  sessions are stateless; nothing can self-arm a follow-up run. Given that the
  2026-07-25 audit found 69 % of cloud sessions were exactly that failure mode,
  this is a feature, not a loss.
- **The routines dashboard UI.** Replaced by the Actions tab, which is visible
  to both founders and every agent, not just the account owner.
- **Plan-covered tokens.** See cost above.
- **Two-way parity with `bedrock nightly audit`** — that routine belongs to
  another project on the same account and is out of scope here.

### Risks and mitigations

| Risk | Mitigation |
|---|---|
| Double-running a routine during migration | Pilot with `SOCIAL_FREEZE`-style repo variable; disable the claude.ai trigger only after the workflow's second clean PR |
| A runner without the tools a prompt assumes (`gh`, `node`, DB URL) | `ubuntu-latest` has `gh`/`node`; DB-touching lanes get the same `SUPABASE_*` secrets the existing workflows use |
| Secrets exposure to a coding agent on CI | Scope per workflow with `permissions:` and only the secrets that lane needs — strictly tighter than today, where every routine shares Joey's whole session |
| Runaway spend | `concurrency:` groups + a per-workflow `timeout-minutes` cap + the existing watchdog; Anthropic console spend limit on the key |
| Losing the fleet again | Impossible in the new model — the repo *is* the fleet; a lost account loses nothing |

## Second question: is the current routine set efficient?

Low-effort verdict, from the record rather than a fresh audit: the fleet has
been trimmed hard and recently — Vault Run consolidated 6 lanes into 1 session
(2026-09-01), Kevin's 4 streams into 1 desk (T-10), Karen to judgment-only
(T-5), Marjorie's evening delta and the Getty watch retired (T-13/T-14). 15
enabled of 23 is about right. What remains inefficient is **structural, not
per-routine**, and every item is a symptom of the hosting surface:

1. **Prompt drift** — live prompt vs repo file (T-20 needed a 22-routine manual
   resync). Gone when the workflow reads the file.
2. **Warm spares** — 8 disabled triggers kept alive "just in case" because
   recreating one is manual and delete is UI-only. Gone: git history *is* the
   warm spare.
3. **The Routine Auditor itself** (weekly Haiku session to crawl a broken list
   endpoint) exists only to police drift the new model can't have. Retire it
   and replace with a ~50-line test over the workflow files in CI.
4. **Model-tier trials** (Austin, News Triage) need a human to flip the model
   back on a date. On Actions that is a dated PR any agent can open and merge.
5. **Cadence is still one-fits-all per routine.** With `workflow_dispatch`
   inputs, Hermes could trigger a lane on demand (e.g. "run Photo Enrichment
   now, top-of-feed pages only") instead of waiting for 16:07 UTC — the
   2026-09-05 no-images incident would have been a same-hour fix.

Deeper per-prompt optimisation (token budgets, tool allowlists, Opus→Sonnet
downgrades) is worth a separate normal-effort pass **after** the move, when
Fable can read the exact config and run history it is judging.

## Recommendation

Migrate. Do it as a pilot first so the cost line is measured, not guessed.

### Decision D1 — authorise the pilot (founder-only: new metered spend)

- **A — pilot two routines on Actions for 3 days (recommended):** Marjorie 6 AM
  brief (Opus, the noisiest) and Laura a11y walk (Sonnet, the quietest), run in
  parallel with the claude.ai copies, tokens measured from the Anthropic
  console. Cost: whatever those 6 runs bill, expected well under $50.
  Reversible: yes — delete two files. Then: a costed go/no-go for the full
  fleet, with the real annual number.
- **B — migrate the whole fleet now:** fastest end to the human-action stream;
  commits to the estimated $1.5–4k/yr without a measurement. Reversible: yes
  (re-enable the claude.ai triggers, which are left disabled, not deleted).
- **C — stay on claude.ai routines:** zero new spend; the #35/#37/#41-class
  human actions continue, and `SYNC-T20`-style docs remain the workflow.
- **Recommendation:** A, because the *only* unknown is money and a 3-day pilot
  converts it into a fact before Joey commits.
- **Reply with:** `D1=A`, `D1=B` or `D1=C`.
- **Then Hermes will:** on A or B, open the migration card(s): a reusable
  `routine.yml` template, the pilot workflow files, a CI test replacing the
  Routine Auditor, and the one-line human item "run `/install-github-app`";
  on C, close this card and file nothing.

## Sources checked

`docs/agents/runners.md` (live trigger table, 2026-08-27 audit, 2026-07-25
token-burn audit), `docs/agents/SYNC-T20-ROUTINE-PROMPTS.md`,
`docs/handoff/2026-08-23-routine-migration-handoff.md`, `HUMAN-ACTIONS.md`
items #10, #11, #13, #35, #37, #38, #41, `docs/agents/runner-prompts/vault-run.md`,
`.github/workflows/*.yml` (23 scheduled; `appearance-discovery.yml` uses
`ANTHROPIC_API_KEY`), `gh secret list` / `gh repo view` (public repo),
`anthropics/claude-code-action` README (MIT, API-key auth, `/install-github-app`).
