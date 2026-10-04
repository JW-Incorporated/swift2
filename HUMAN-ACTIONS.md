# Human actions — Swift2

<!-- ha-format: 2 -->

> **1 open.** Closed items are in `HUMAN-ACTIONS-DONE.md` — you never need it.
> To close one: reply `done` (or `skip <why>`) to its card in the project's human-action channel.
> Anything else you reply is forwarded to a thread on the card.

## #98 🟡 [DECIDE] Scrub ~70 unhashed FB names leaked into engagement_lead now, or wait? (~5 min)
<!-- ha filed=2026-10-03 -->

**Why:** #4885 found two bugs in `facebook-groups-parser.ts` that stored real Facebook group members' names unhashed in ~70 `engagement_lead` rows, breaking the documented "hashed authors" guarantee (`docs/decisions.md` 2026-08-25).

**Steps:**
1. Decide: `scrub` — delete/rehash the ~70 contaminated rows now; `wait` — leave them until the ingestion fix ships.
2. Reply with your choice in chat, or comment it on issue #4885.

**Worked if:** issue #4885 has a founder comment recording `scrub` or `wait`.
