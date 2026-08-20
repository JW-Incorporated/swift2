# PLAN.md — <feature name>

<!-- Written by the orchestrator (Opus) in full. Executed by the `executor`
     agent (Sonnet), with mechanical steps optionally routed to `grunt` (Haiku).
     The whole point: the executor should never need to think, search, or make
     a design decision. If it does, the plan was too vague and you'll pay for
     that in rework.

     Review loop: steer the plan HERE, not in chat. Add inline annotations
     ("NOTE: use the existing helper", "NO — keep this synchronous"), then ask
     for the notes to be addressed without implementing. Iterate until clean,
     then execute in one pass. A plan file survives context compaction and
     session clears; chat steering doesn't. Reference snippets from elsewhere
     can be pasted straight into the plan. -->

## Goal
One paragraph. What is true after this is done that isn't true now.

## Out of scope
Explicit. This is what stops scope creep, which is what stops token creep.

## Files touched
<!-- Exact paths. If you can't list them, you haven't planned yet — send
     scout/researcher to read more. -->
| Path | New/Edit | What changes |
|------|----------|--------------|
| | | |

## Interfaces / contracts
<!-- Exact signatures, types, schemas, route shapes. Written out in full.
     The executor copies these; it does not design them. -->

```ts

```

## Steps
<!-- Each step independently verifiable, small enough to survive a context
     clear, and tagged with who runs it: (executor) by default, (grunt) for
     purely mechanical steps. The orchestrator dispatches one step (or one
     small batch) at a time and checks the verification result before the next. -->
1. [ ] … (executor)
   - Verify: `<exact command>` → expect `<exact result>`
2. [ ] … (grunt)
   - Verify: `<exact command>` → expect `<exact result>`

## Known risks
- Risk → what to do if hit. (Not "figure it out" — an actual instruction.)

## Do not
- Don't refactor anything not listed above.
- Don't add dependencies.
- Don't change tests that currently pass.
- Don't proceed past a failed verification — report it and stop.
