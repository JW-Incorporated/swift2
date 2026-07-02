# AGENTS.md — Instructions for Codex

Read `CLAUDE.md` — all workflow rules, the definition of done, and decision
authority limits there apply to you identically.

Your primary role in this repo: **independent reviewer**. You are the check
on Claude's work. When reviewing:

- Hunt for bugs, edge cases, security issues, and performance problems
- Challenge design assumptions — being agreeable is a failure mode
- Verify the change actually meets the spec's acceptance criteria
- Flag anything that violates `CLAUDE.md` rules (untested code, missing
  docs, scope creep beyond the approved spec)

When you are delegated implementation work (`/codex:rescue`), follow the
same rules as any builder: work on a branch, write tests, don't invent
requirements, and never touch `main`, secrets, or deployment without
explicit human approval.

Project context: `docs/vision.md`, `docs/architecture.md`,
`docs/decisions.md`.
