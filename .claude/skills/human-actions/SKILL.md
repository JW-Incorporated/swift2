---
name: human-actions
description: Use whenever a session creates, reads, or updates HUMAN-ACTIONS.md (format v2), or discovers any action only the owner can perform.
version: 2.0.0
---

# HUMAN-ACTIONS.md — format v2

**Filename is always `HUMAN-ACTIONS.md`, project root, never a variant**
(`OWNER-ACTIONS.md`, `TODO.md`). Closed items live in a sibling
`HUMAN-ACTIONS-DONE.md` — a machine ledger the owner never opens.
**Presence in `HUMAN-ACTIONS.md` means open. There is no `Status:` field.**
An item is open because it is in this file — nothing else encodes it.

## Shape — every item, exactly

```markdown
## #<N> <glyph> [<KIND>] <title> (~<eta>)
<!-- ha filed=YYYY-MM-DD -->

**Why:** <≤300 chars — concrete consequence, not "this matters">
**Steps:**
1. <literal step, ≤200 chars>
...up to 10
**Worked if:** <one checkable signal, ≤200 chars>
```

No other `**Label:**` line is legal (`**Decision**`, `**Update**`,
`**Verified**`, a separate `**Filed**` field, `**Status**` — all rejected;
`filed=` lives only in the meta comment). Whole item ≤1,500 bytes. **A
write over any cap is linted and refused — never reaches the file.** Steps
are literal navigation (exact URL, menu path, filename) — never teach
basic computer skills.

`KIND` is exactly one of `BLOCKING` (🔴 stuck on this), `DECIDE` (🟡
answer is the whole action), `UPGRADE` (🟢 nothing halted) — glyph follows
`KIND`, never chosen independently. **Order: descending by `N`, newest at
top, everywhere — file and Discord alike.**

## Numbering
Never reused, never renumbered. Allocator is always `max(N in open file ∪
N in ledger) + 1` — never "next free-looking number." Duplicate `N` in the
open file, or the same `N` in both, is a lint error.

## Filing and closing

File via `ha add` on the VM; on the PC, write v2 directly and expect the
lint on the next sync/commit — it is the contract, not a courtesy.
Close: exactly two paths — `done`/`skip <why>` reply to the card in
Discord, or `ha close` run because the owner said so in chat. **Never an
agent's own judgment** — not "the owner seemed to say it was done," not
inferred from unrelated conversation. **`SKIP` is final** — never re-raise
or re-argue a skipped item.

## Never

Invent a filename variant · write a `**Status:**` line · renumber, reuse,
or hand-pick a number outside the allocator · add a `**Label:**` beyond
Why / Steps / Worked if · close an item on your own judgment · re-raise a
`SKIP` · write a secret value into the file.
