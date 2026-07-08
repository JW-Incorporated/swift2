# Swift2 (working title)

A Taylor Swift fan app for web + mobile, built by two founders and their AI
team.

## How this repo works

- `CLAUDE.md` — operating manual for AI agents (workflow, definition of done,
  decision authority). Start here.
- `AGENTS.md` — Codex-specific instructions (reviewer role).
- `docs/cto-role.md` — the CTO/engineering role + new-session bootup checklist.
- `docs/` — vision, architecture, decision log.
- `.claude/settings.json` — shared Claude Code permissions (identical setup on
  both founders' machines).

## Getting started (founders)

1. **Clone the repo.** Easiest way: install Claude Code, open cmd in the
   folder where you want the project, run `claude`, and say
   "Clone our private Swift2 repo from GitHub and set it up." It walks you
   through GitHub sign-in the first time.
2. **Install the Codex plugin.** Inside Claude Code, run these one at a time:

   ```
   /plugin marketplace add openai/codex-plugin-cc
   /plugin install codex@openai-codex
   /reload-plugins
   /codex:setup
   ```

   When `/codex:setup` asks questions: YES to installing Codex if offered;
   sign in with your **ChatGPT account** (not an API key); do NOT enable the
   "review gate" (it auto-reviews everything Claude does and drains usage
   limits — we turn it on manually for big features only).
3. **Stop Codex's permission prompts.** Tell Claude Code:

   > Create a file at ~/.codex/config.toml (create the folder if needed)
   > containing exactly:
   > approval_policy = "never"
   > sandbox_mode = "workspace-write"

   (That file lives at `C:\Users\YOURNAME\.codex\config.toml` — the `~` is
   shorthand for your user folder.)
4. **Verify.** In Claude Code, type `/codex:review` — if it runs instead of
   erroring, the loop is wired up.
5. Describe a feature to Claude Code and let the loop run.
