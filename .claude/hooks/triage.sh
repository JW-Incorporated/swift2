#!/usr/bin/env bash
# UserPromptSubmit hook — fires on EVERY prompt, no matter how it's phrased.
# Injects the triage rule as context alongside the message, so routing is
# always a conscious decision, never a default. Static by design: the routing
# intelligence lives in the model; this script only guarantees the rule is
# present every single turn. Keep it fast and dependency-free.

cat <<'EOF'
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"TRIAGE BEFORE ACTING — classify this message first, state the call in one line, then proceed: (1) Answerable from current context -> answer directly, no tools. (2) Needs facts from codebase/docs/web -> delegate to scout (quick lookup) or researcher (deep dive / repro); do not explore in your own context. (3) Mechanical work (renames, boilerplate, rote edits, well-defined commands) -> delegate to grunt. (4) Executing PLAN.md steps -> delegate to executor, then reviewer on the diff. (5) Architecture, planning, ambiguity, post-two-strike debugging, reviewing agent output -> handle yourself. (6) Ceiling judgment -> architect (Fable), per CLAUDE.md category 6: MANDATORY with no deliberation when DEBUG.md exists and a fresh-context agent returned without a fix; by judgment for a design fork costing days of rework that you already attempted yourself. Rare, and logged in STATE.md -> Architect invocations. Never delegate work smaller than its own brief — quick interactive exchanges are yours to answer. Casual or terse phrasing does not waive this rule. You own every outcome: verify agent results before treating them as done."}}
EOF
exit 0
