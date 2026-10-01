---
name: prompting-bot1
description: Use whenever Marjorie (or any session) writes a prompt for bot1, the Hermes1 Discord bot in #longlive, or decides whether to prompt bot1 versus file a GitHub issue. Covers when to use it, how to word it, and what bot1 will do with it.
version: 1.0.0
---

# Prompting bot1

bot1 is the Hermes1 Discord bot. The owner types a free-text message in
`#longlive`; Hermes turns it into a Kanban card on the project board and
works it. Marjorie reaches the same door through
`scripts/marjorie/prompt-bot1.mjs` — a webhook post to `#longlive`, **off by
default** (`scripts/marjorie/marjorie-config.json` → `bot1Bridge.enabled`),
at most **3 prompts per UTC day**, every one logged on the issue labelled
`bot1-bridge`. A prompt costs a Hermes card and the owner's attention; treat
all 3 as scarce.

## When to prompt bot1 — and when not to

| Situation | Do this |
|---|---|
| Engineering change in this repo (bug, feature, content fix) | **File a GitHub issue** through the normal funnel (Kevin triages, Austin builds). Never bot1. |
| Social drafting or approval | Tree's lane: `marjorie-filed` + `desk:tree` via `loop-asks.mjs`. Never bot1. |
| A `marjorie-filed` issue stuck **more than 7 days** after her nudge and `[DECIDE]` item, and the blocker is outside GitHub | Prompt bot1 once for that issue, then wait for the card. |
| Work that lives on the Hermes side (Hermes config, its allowlists, cron, Discord/bot plumbing, the fleet VM) | Prompt bot1 — she cannot touch it from here, and a GitHub issue in this repo would be invisible to Hermes. |
| She is blocked on something bot1 can unblock (a secret to re-sync, a webhook to create, a channel permission) | Prompt bot1 — unless it needs the owner's own login or money, which is a `HUMAN-ACTIONS.md` item instead. |
| Anything needing a product, legal, pricing or spending decision | Neither. Bank a `founder-decision`. bot1 is not an approver. |

Before sending, check the log issue: if an open card for the same outcome
already exists, do not prompt again — add nothing, or note it in the weekly
plan.

## How to write the prompt

One message, **one outcome**, written so a stranger could finish it without
asking you a question. Plain text, no `@` mentions, under 1,500 characters
(the bridge rejects longer, and rejects secret-shaped text).

1. **Outcome first** — one sentence starting with a verb: what must be true
   when the card is done.
2. **Context links** — the swift2 issue/PR URL(s) and the one fact that made
   you ask (what is stuck, since when, what was already tried). Bare URLs; the
   bridge suppresses link previews.
3. **Acceptance criteria** — 1–3 checkable lines, "Done when …". Name the
   evidence you will look for (a merged PR, a green run, a comment).
4. **Constraints and guards** — state what is off-limits. For swift2 always:
   no force-push, no direct pushes to `main`, no `--no-verify`, no secrets in
   the repo or in chat, nothing under `social/queue/` merged by an agent, never
   run the social poster's real-send paths, no destructive git
   (`reset --hard`, `clean`, `restore`). Add any task-specific limit.
5. **Say who owns the follow-up** — "Reply on the issue when done; Marjorie
   reads it on her next run."

**Do not ask for:** several unrelated things in one message; open-ended
exploration ("look into growth"); anything that spends money or creates an
account; anything that needs the owner's identity; posting to IG/X/Discord on
her behalf; editing a charter; or a decision. Do not paste logs or long
quotes — link them.

## What to expect

- bot1 does not reply to a webhook post in-channel the way it does to the
  owner (it may ignore it entirely until the Hermes allowlist change lands —
  that is `HUMAN-ACTIONS.md`'s open item, not a bug in your prompt).
- When it works: a Kanban card appears with your outcome as its title, and bot1
  posts its progress there. Check by reading the log issue and the linked
  swift2 issue — never assume.
- Silence for 24h after a **sent** prompt is a finding: record it in the weekly
  plan and escalate to the owner; do not re-prompt the same text (the bridge
  refuses duplicates within a UTC day anyway).

## Examples

**1. Stuck issue, Hermes-side blocker**

```
Re-sync the DISCORD_LONGLIVE_INTAKE_WEBHOOK_URL secret check on the swift2 ops environment and confirm the #longlive webhook still exists. Context: https://github.com/JW-Incorporated/swift2/issues/<N> has waited 9 days because the weekly review cannot reach #longlive. Done when you reply with the webhook's channel name (never its URL) and whether bot1 now accepts webhook-authored messages from it. Constraints: do not print or paste any secret value; do not change any other webhook; no changes to swift2 main. Marjorie reads the reply on the issue.
```

**2. Unblocking a workflow**

```
Add the swift2 read bot to #longlive-tree with Add Reactions permission, and nothing else. Context: https://github.com/JW-Incorporated/swift2/issues/<N> — approval confirmations need the reaction. Done when you can show the bot's permission list for that channel with Add Reactions enabled and every other permission unchanged. Constraints: no other channel, no role edits, no messages posted in that channel. Reply here when finished.
```

**3. What not to send (file a GitHub issue instead)**

> "Make the site grow faster and fix the Patient Zero coverage."

Two outcomes, no acceptance criteria, repo work — it belongs in the weekly
plan and as a build issue with criteria (`marjorie-filed` + `desk:build`).
