---
name: human-actions
description: Conventions for HUMAN-ACTIONS.md — invoke whenever a session creates, reads, or updates HUMAN-ACTIONS.md, or discovers any action only the owner can perform (login, payment, approval, UI click, guard-denied command).
---

# HUMAN-ACTIONS.md — the single place for anything the owner must do

**Every action that requires the owner goes in `HUMAN-ACTIONS.md` at the
project root. One file, that exact name, no exceptions.** If it needs his
identity, his login, his payment method, his approval, a click in a UI you
can't reach, or it hit the human-only guard list — it goes there. Not only in
chat, not only in `STATE.md`. Chat scrolls away and `STATE.md` is your
memory, not his queue.

Create the file the first time you need it. Never rename it, never invent a
variant (`OWNER-ACTIONS.md`, `TODO-JOEY.md`) — one predictable filename is
the whole point.

**Every entry carries five things, in this order:**
1. **A title** with a `[BLOCKING]` or `[UPGRADE]` tag and a rough time cost.
   `[BLOCKING]` = something is genuinely stuck; `[UPGRADE]` = improves things,
   nothing halted. Be honest — inflating everything to BLOCKING trains him to
   ignore the tag.
2. **Why**, in a sentence or two — enough to judge priority without asking.
3. **Steps** — numbered, light. Point him in the right direction; he is
   capable, he just needs the path.
4. **Every exact value written out literally** — URLs, secret names, file
   paths, menu labels, button text. This is what actually costs him time and
   must not be paraphrased. A wrong menu name sends him into the wrong flow;
   that has already happened once.
5. **"Worked if:"** — one concrete, checkable signal. Not "it should work."

**Conventions**
- Newest open action at the top of an `# OPEN` section.
- Done items move to `# DONE` with the date. **Never delete** — the history
  is how you stop re-asking him for things he already did.
- An action that turns out unnecessary moves to DONE marked "no longer
  needed", with why.
- If OPEN is empty, say so plainly — nothing is waiting on him.
- Include a short "How to mark something done" section at the top of the file
  itself, so the convention is discoverable without reading this skill.

## Closing the loop is your job, not his

Every entry carries a `**Status:** OPEN` line directly under its title. He
changes that one word:

| He writes | Means |
|---|---|
| `DONE` | He did it |
| `SKIP` | He chose not to, on purpose — plus a few words why |
| `BLOCKED` | He tried and something stopped him — plus what |

That is the entire interface. He never cuts, pastes, or moves a block, and
never has to be in a session to record progress.

**Every session that opens `HUMAN-ACTIONS.md` reconciles it**: move each
non-`OPEN` item into `DONE`, stamp the date, stop tracking it. "I did #2"
said in chat is identical to him editing the line.

**Item numbers are stable IDs, not ordering.** Never reuse, never renumber —
`#4` means the same thing forever, including after it is filed under DONE.

**`SKIP` is final.** Never re-raise a skipped item or re-argue the
recommendation behind it. His risk judgement is his; record the decision and
move on. Re-litigating settled judgement is how a useful file becomes one he
stops reading.

**Never let a human action exist only in conversation.** Write it down first,
then mention it.
