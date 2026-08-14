# Codex reviews — how a session actually runs one

**Workflow rule 3 requires Codex cross-review before work is declared done.** This is how to do it.

## The short version

- **Always pass `--background`.** Without it the forwarding subagent blocks, hits its own 10-minute cap, and returns nothing — while the Codex job keeps running fine underneath. A real review of a multi-commit diff takes ~15 minutes, so the default path times out by construction.
- **Always read results with `result <job-id>`**, never from the subagent's inline summary. The relay is not reliable; the job ledger is.
- **`--background` means NO completion notification.** The job runs in Codex's own runtime, not as a harness-tracked agent, so nothing wakes the session when it finishes. Capture the job id from the forwarder's immediate reply and poll `status <job-id>` yourself when you next have a reason to act. Without `--background` you get a notification but the forwarder times out at 10 minutes and returns nothing — so `--background` plus polling is the only combination that works.
- **A job can report `failed` after doing real work.** Round 3 on 2026-08-13 died at 9m52s having completed its corpus verification but before issuing verdicts. Always pull `result` on a failed job; partial findings are still findings. Treat a failed round as INCONCLUSIVE, never as clean.

## The path

- `/codex:review` (the SLASH COMMAND) is `disable-model-invocation` — a human must type it. A session cannot call it, and must not reproduce its workflow by other means.
- What a session CAN use: the `codex:rescue` skill, which routes to the `codex:codex-rescue` subagent through the `Agent` tool. That is the agent-facing path and it satisfies rule 3.
- Do NOT call `Skill(codex:codex-rescue)` — no such skill exists. Do NOT call `Skill(codex:rescue)` from inside the rescue command itself; it re-enters and hangs the session.
- Do not hand a review back to a founder. Agents deploy Codex themselves (Joey, 2026-08-13).

## Commands (the companion runtime)

The runtime lives in the plugin cache, not in this repo, and its version number is part of the path — re-check the path if the plugin updates:
`~/.claude/plugins/cache/openai-codex/codex/<version>/scripts/codex-companion.mjs`

| Purpose | Command |
|---|---|
| Check the CLI is installed and authenticated | `node <companion> setup --json` |
| List all jobs and their phase | `node <companion> status --all` |
| One job's detail | `node <companion> status <job-id>` |
| **Fetch a finished review** | `node <companion> result <job-id>` |
| Check for a resumable thread before starting | `node <companion> task-resume-candidate --json` |

## What a review is worth

On 2026-08-13 a Codex adversarial review of a seven-commit diff took 15m20s and returned five findings — one High — that a full 2600-test suite and a human review had both passed. It reproduced findings by EXECUTING the corpus, not just reading it. The wall-clock time is the point, not overhead.

State plainly that the in-house `reviewer` agent does NOT satisfy Workflow rule 3: it shares the blind spots of the agent that wrote the code. Only the independent reviewer counts.

## Traps

- "No jobs recorded yet" from `status --all` means no review has ever run in this environment — it does not mean a review failed. If someone says a review is complete, check the ledger before believing it.
- The forwarding subagent may report a timeout while the Codex job is still running normally. Check `status --all` before re-dispatching, or you will run two reviews of the same diff.
