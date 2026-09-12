# Marjorie Overhaul — founder runbook

Same rhythm as the Tree Overhaul: one fresh session per wave, paste the
prompt, walk away, gate on command output, checkpoint, `/clear`. The live
runbook page (the artifact) carries the same schedule with copy buttons.

## Before M1 can prove anything live

- **HA #51** done (routines run on the OAuth token). ✓ 2026-09-12.
- **HA #66**: a webhook for `#longlive-marjorie` deposited as
  `DISCORD_MARJORIE_WEBHOOK_URL` in a new `main`-only `ops` environment.
  The `ops` environment already exists and is locked to `main`; only the webhook secret is missing. M1 cannot be verified without it.

## Schedule

| When | You | Model | Then |
|---|---|---|---|
| Fri 09-12 ✓ done | M0 prompt (`waves/m0-design.md`) | Opus | Specs #4184, charter #4183, charter-merge rule #4185 merged; audit fixes + M1–M4 prompts followed |
| Sun 09-14 → Mon 09-15 | M1 prompt (`waves/m1-comms.md`), after HA #66 | Sonnet | Watch `#longlive-marjorie` for the first real brief the next morning |
| Tue 09-16 → Wed 09-17 | M2 (`waves/m2-watchdog-handling.md`), then M3 (`waves/m3-triage.md`), separate sessions | Sonnet | Do the FB export human action if it appears |
| Mon 09-22 (after Tree R2 reports) | M4 prompt (`waves/m4-loop.md`) | Opus | Reply in Tree's Monday thread as usual |
| M1 + 7d | Nothing. MR1 comments on #4180 | Opus (routine) | Run any follow-up prompt it includes |
| M1 + 21d | MR2 proposes close or extend | — | Decide in a comment on #4180 |

Never run a Marjorie wave while a Tree wave is open in the same checkout.
Tree has no open wave until R4 (10-16) at the earliest.

## Your standing job once M1 is live

| In `#longlive-marjorie` | Do | Why |
|---|---|---|
| Morning brief | Read it. Reply in-thread if something is wrong or missing | Replies become comments on the brief issue; Marjorie reads them the next morning |
| Alert line | Nothing, unless it says "needs you" | Then a human-action card is already in `#human-action-1` |
| Triage question | Reply with a decision in one sentence | Marjorie turns it into an issue or closes it, and says which |
| Tree/Marjorie thread | Read weekly | It is the two of them negotiating; you only step in on disagreement |

Email from a bot after M1 means the Discord call failed. Treat it as an alert
about Discord, not about the content.
