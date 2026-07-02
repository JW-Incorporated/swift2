# Swift2 (working title)

A Taylor Swift fan app for web + mobile, built by two founders and their AI
team.

## How this repo works

- `CLAUDE.md` — operating manual for AI agents (workflow, definition of done,
  decision authority). Start here.
- `AGENTS.md` — Codex-specific instructions (reviewer role).
- `docs/` — vision, architecture, decision log.
- `.claude/settings.json` — shared Claude Code permissions (identical setup on
  both founders' machines). Includes a `SessionStart` hook that auto-runs
  `git fetch origin` so Claude always starts a session with fresh remote info.

## Getting started (founders)

1. Clone the repo
2. Install Claude Code and Codex CLI, sign in to both
3. In Claude Code: `/plugin marketplace add openai/codex-plugin-cc`,
   `/plugin install codex@openai-codex`, `/reload-plugins`, `/codex:setup`
4. Codex config (`~/.codex/config.toml`):

   ```toml
   approval_policy = "never"
   sandbox_mode = "workspace-write"
   ```

5. Describe a feature to Claude Code and let the loop run.
