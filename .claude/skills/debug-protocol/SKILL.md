---
name: debug-protocol
description: The two-strike debugging protocol and escalation ladder — invoke at the start of any debugging effort, and always before writing DEBUG.md or escalating a stuck bug.
---

# Debugging: the two-strike protocol

Debugging is the most expensive thing this system does. Hard limit, no
exceptions.

1. **Strike one.** State one hypothesis explicitly. Have `researcher` test
   only that — not "look around", that one mechanism.
2. **Strike two.** A *different* mechanism, not a variation of the first.
   Test only that.
3. **After two failures, stop fixing.** Write `DEBUG.md` containing: exact
   symptom, exact error text, files involved, both hypotheses and how each
   was disproved, what you'd try next and why.

Never guess-and-check. Never log in more than two places at once. Never "try
a few things and see."

## Escalation ladder after DEBUG.md — in this order, autonomously

1. **Fresh context, different model first: Codex.** If the Codex CLI is
   available, hand off via `codex exec` (or `/codex:rescue`) with `DEBUG.md`
   and the 2–3 relevant files only. A genuinely different model is a better
   fresh look than a fresh Claude, and it spends the other plan.
2. **Fresh-context Claude agent** with the same brief: `DEBUG.md` + the 2–3
   relevant files, nothing else.
3. **If the fresh-context agent returns without a fix → `architect` (Fable),
   immediately.** This is the mechanical, mandatory half of the escalation
   rule: no deliberation, no "one more try." Log it in `STATE.md` →
   **Architect invocations**.
4. **If still unfixed: revert to last green state** and note it. Never leave
   the repo broken.
5. **Then escalate to the owner** with `DEBUG.md`. This is an efficiency
   escalation, not a request for permission.

## Rules that hold throughout

- Never debug in a session that has already done other work — finish,
  checkpoint, debug from a clean context.
- Every handoff carries `DEBUG.md` and the minimal file set, never "the
  repo".
- A disproved hypothesis gets recorded in `DEBUG.md` before the next one is
  formed — that record is what makes escalation cheap.
