# Wave M6 — Live asks between the bots (event-driven L1 answers)

Paste everything below this line into a fresh **Opus** session (`/model opus`) in Swift2.

**Prerequisites:**
- M5 merged (done 09-13).
- **The 2026-09-14 Monday L1 cycle has run and is recorded.** Tree's `routine-tree-weekly-plan.yml` (10:00Z) and Marjorie's `routine-marjorie-brief.yml` (12:00Z) runs have finished, and their evidence is on #4180. MR1 checks that cycle unmodified, so do not merge anything that touches L1 before then.
- If the cycle failed, fix L1 first (debug-protocol) and say so on #4180.

The spec is already written; this session builds and proves it.

---

You are executing Wave M6 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`, epic #4180): live answers to L1 asks, spec `docs/specs/marjorie-overhaul/m6-live-asks.md`. Read it in full first; it is the contract. If the build must deviate, amend the spec in the same PR and say why in one line.

Also read:
- `docs/specs/marjorie-overhaul/l1-loop.md` and `m5-chat.md`
- `scripts/marjorie/lib/loop-asks.mjs` (+ CLI)
- `.github/workflows/routine-marjorie-chat.yml`, `routine-tree-weekly-plan.yml` (`send-brief`), `routine-marjorie-brief.yml` (`deliver`)
- `docs/agents/runner-prompts/marjorie-chat.md`, `tree-weekly-plan.md` step 0.7, `marjorie-brief.md` step 3a
- the `docs/decisions.md` entry "The bots answer each other's asks within minutes"

**Hard rules carried in:**
- The M1 list (`waves/m1-comms.md`).
- `DISCORD_BOT_TOKEN` and every webhook URL live only in `run:` steps under `environment: social`/`ops`; no agent job holds one (the PR diff and a workflow text test are the proof).
- Approvals stay reaction-only; nothing touches `social/queue/`; nothing new posts in `#longlive-tree`.
- The repo is PUBLIC: no founder text in issues, comments, PRs or artifacts that outlive the run.
- Answer runs never file an ask.
- Codex review (`codex:rescue --background`, results via `codex-companion.mjs result <id>`, or `codex exec -s read-only` if the forwarder fails) on every PR that adds a workflow or touches `routine-template.yml`, max two rounds, then the debug ladder.
- Charter edits merge on green (#4185 rule).

**Carried in from M5 (2026-09-13):**
- A workflow dispatched by another workflow's `GITHUB_TOKEN` runs as the `github-actions` bot. claude-code-action refuses that unless the caller passes `allowed_bots: github-actions` (`routine-template.yml` input).
- **GitHub starts no workflow from events a `GITHUB_TOKEN` created**, so dispatch explicitly from the filing step, never `on: issues`.
- Gate agent and webhook jobs on `github.run_attempt == '1'`.
- Every write path re-checks what it may write for; see `lib/chat-delivery.mjs writtenByFounder`.
- GitHub cron can stall for hours; dispatch is push and unaffected.
- The Temp directory was wiped mid-session once: commit WIP after every green step and push often.
- In a junctioned worktree, run vitest with a scratch config without the repo `globalSetup`, and always run `npm run lint` before pushing.
- The guard denies `rm -f`; write scratch files under the gitignored `.scratch/` and leave them.
- Work in a worktree outside `Documents\Claude\Projects\`.

## Tasks (in order; one PR each unless trivially coupled)

1. **L1 filing reports and dispatches.**
   - `lib/loop-asks.mjs` + CLI: the `thread=` marker field, `file-marjorie` reports the filed number, new `file-chat` (caps: ≤1 per founder message, ≤3 per 24 h).
   - Dispatch steps in `send-brief` and `deliver`; `deliver` gains `actions: write`.
   - Tests.
2. **The answer routine.**
   - `routine-loop-answer.yml` (`gate` → agent → `post` → `echo`).
   - `scripts/marjorie/loop-answer.mjs` + tests.
   - `runner-prompts/loop-answer-marjorie.md` and `loop-answer-tree.md` (Tree: answer now, act Monday via a plan-PR proposal comment).
   - A workflow text test.
3. **Chat-originated asks.**
   - Marjorie's chat prompt writes `chat-ask.json` instead of `gh issue create` for `desk:tree`.
   - `finish` files it with `file-chat` and dispatches.
   - Tests.
4. **Live proof.**
   - Ask Joey (YOU:) to ask Marjorie in `#longlive-marjorie` for something that needs Tree (his call what). Watch the ask get filed, Tree's answer land on the issue within 10 minutes, and the echo line appear in his thread.
   - For Tree → Marjorie, run a synthetic `[M6 check]` ask through `send-brief`'s dispatch path (no Discord post), or use the next real Monday ask.
5. **Docs.**
   - `l1-loop.md` amendment, `MAP.md` rows, `checkpoints.json` MR2 line, one charter line each.

## Done means

- A real Marjorie → Tree ask from a founder's chat was answered by Tree on the issue within 10 minutes, with the echo line in the thread.
- A Tree → Marjorie ask was answered by Marjorie within 10 minutes.
- No answer run filed anything.
- Issue links, run URLs and timings are on #4180.
- Unit tests are green, lint has 0 errors, and no secret is in an agent environment.
- Tick M6 on #4180 and in `PLAN.md`, update `STATE.md`, stop.
