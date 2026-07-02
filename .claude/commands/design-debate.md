---
description: Claude proposes a design, Codex attacks it, iterate, surface disagreements to humans
---

Run a structured design debate on: $ARGUMENTS

Protocol (read CLAUDE.md first; no production code in this mode):

1. **Propose.** Write a concrete proposal as a new file in `docs/proposals/`
   (kebab-case name, dated). Include: the goal in plain language, the
   proposed design, key tradeoffs, alternatives you rejected and why, and
   open questions. Ground it in docs/vision.md and docs/architecture.md —
   flag any conflicts with them.
2. **Challenge.** Run `/codex:adversarial-review` on the proposal file,
   with focus text telling Codex to attack the design itself: hidden
   assumptions, failure modes, scalability, cost, and whether a simpler
   approach achieves the same user experience.
3. **Respond.** For every Codex finding: accept it (revise the doc) or
   rebut it (add a short rebuttal note in the doc). No silent dismissals.
4. **Round two.** Run the adversarial review once more on the revised doc.
   Stop after two rounds — do not loop further without human approval.
5. **Conclude — this step is mandatory.** The proposal doc must end with a
   section titled "## Verdict" containing ONE recommended design, stated as
   the answer, not an option: what we will build and why it won the debate.
   Debate content moves to an appendix. A deliverable that ends in "it
   depends" or a list of options with no pick is a failed run — if inputs
   were genuinely missing, the Verdict states the recommendation anyway,
   with the assumptions it rests on.
6. **Report to the humans**, in plain non-technical language:
   - The verdict in three sentences ("We recommend X. Here's why.")
   - What Codex changed your mind about
   - At most 2-3 true 50/50 calls, each framed as a concrete A-or-B
     question a non-coder can answer — never an open-ended question
   - Default action if they say nothing: proceed with the verdict
7. If the humans approve, update docs/architecture.md and add the entry to
   docs/decisions.md before any implementation starts.
