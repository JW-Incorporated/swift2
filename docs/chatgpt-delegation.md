# ChatGPT delegation

Purpose: a third parallel worker for content research/verification, alongside
Claude Code (this session) and Gemini. No new integration was needed — the
`codex` CLI (already set up for `/codex:review`) authenticates via a real
ChatGPT login (`codex doctor` shows `auth mode: chatgpt`, not a separate API
key), and `codex exec` runs it as a general-purpose agent, not just a code
reviewer. It has live web search built in and can read/edit files in this
repo directly.

## Usage

```
node scripts/ask-chatgpt.mjs "<prompt>"
```

Prints the response to stdout. For a bigger autonomous task (content
research, backfilling a seed file), just give it a full task prompt the same
way you would for Claude Code or Gemini — it can browse, read repo files, and
edit files on its own within the sandbox.

## When to use ChatGPT vs. Gemini vs. Claude Code

- **Gemini**: currently unreliable — free tier caps at 20 requests/day and
  fails hard after that (see `docs/gemini-delegation.md`). Fine for one-off
  mechanical asks; don't build a long-running loop on it until upgraded to a
  paid plan.
- **ChatGPT (via `codex exec`)**: same reliability tier as Claude Code —
  full agentic session, live web search, no known quota wall hit so far.
  Good for a genuine parallel content-research lane.
- **Claude Code**: orchestration, code changes, and anything needing the
  project's full established conventions/review workflow.

## Sandbox notes

`codex exec` defaults to `workspace-write` sandboxing (can edit files in this
repo, run shell commands, reach the network for its own web-search tool).
Same no-fabrication / 2-source / real-citation rules apply as any other
content-writing agent in this repo — see `docs/content-request-wyatt-2026-07-08.md`
and `docs/content-depth-audit-2026-07-08.md`.
