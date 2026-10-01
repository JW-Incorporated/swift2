# Chat poll — concurrency, stuck runs, and what a cut-short poll leaves behind

`bot-chat-poll.yml` (and `marjorie-reply-poll.yml`, same group `bot-chat-poll`) claims
founder messages in `#longlive-marjorie` and `#longlive-tree` with 👀 and dispatches the chat
routines (`scripts/marjorie/chat-poll.mjs`). Mechanics: `docs/specs/marjorie-overhaul/m5-chat.md`,
`m7-doorbell.md`.

## Why `cancel-in-progress: true` (2026-10-01)

With `false`, run 35225911621 (2026-09-17, stuck "waiting" on the `social` environment) held the
`bot-chat-poll` group for two weeks. Every doorbell dispatch (about every 5 minutes) sat
`pending` and was replaced by the next, so the poll never ran again from 2026-09-17 13:15Z until the
stuck run was cancelled by hand (2026-10-01, ~16:20Z). A new run now cancels a stuck or in-flight
one, so the same fault clears itself at the next dispatch. Still only one poll runs at a time, and
the brief-reply relay is idempotent on its `<!-- relay-id: ... -->` marker.

## The claimed-not-dispatched window

The poll adds 👀 first, then dispatches `routine-marjorie-chat.yml`. If a newer run cancels this one
in between (a few seconds wide; schedule and doorbell dispatches are normally minutes apart), the
message is claimed but has no chat run. **Claims are never removed or re-dispatched.** Once the
claim is 45 minutes old (`STALE_CLAIM_MS`) with no active run, the reconcile reads Discord
(`lib/chat-delivery.mjs`) and, finding no reply, posts one referenced `[chat failed]` notice and marks
the message ❌. The founder sees the failure notice and resends; nothing is answered twice and nothing
is silently lost. The doorbell (`docs/ops/doorbell.md`) dispatches the routine on its own path as well,
so a message it rang usually gets its run regardless.

## Checking it

- Is the poll running? `gh run list --workflow bot-chat-poll.yml -L 5` should show `success`, not a
  column of `cancelled`.
- A run sitting `waiting`/`pending` for hours is the stuck-run signature:
  `gh api repos/<owner>/<repo>/actions/workflows/bot-chat-poll.yml/runs?status=waiting`, then
  `gh run cancel <id>`.
