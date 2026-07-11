# Gemini delegation

Purpose: hand off cheap, mechanical tasks to the Gemini CLI instead of
spending Claude/API tokens on them. This is a dev-tooling convenience, not a
product feature — no product spec/approval needed to use or extend it.

## Setup (one-time, per machine)

1. `npm install -g @google/gemini-cli`
2. Get a free API key at https://aistudio.google.com/apikey
   (the old "sign in with Google" flow for individuals is deprecated —
   Google now points that path to their separate Antigravity product).
3. Set `GEMINI_API_KEY` in your shell profile so it persists.
4. Verify: `gemini -p "say hi"`

## Usage

```
node scripts/ask-gemini.mjs "<prompt>"
```

Prints Gemini's response to stdout.

## When to delegate to Gemini vs. do it in Claude

Delegate: simple factual lookups, boilerplate generation, mechanical
rewrites/renames, first-draft doc text, straightforward one-off scripts with
no repo-specific context needed.

Keep in Claude: anything touching architecture, security, auth, data models,
or requiring deep context about this repo's conventions/history — i.e.
anything covered by the review/spec rules in `CLAUDE.md`.
