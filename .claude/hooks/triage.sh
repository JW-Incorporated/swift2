#!/usr/bin/env bash
# UserPromptSubmit hook — fires on EVERY prompt, no matter how it's phrased.
# Injects the triage rule as context alongside the message, so routing is
# always a conscious decision, never a default. Static by design: the routing
# intelligence lives in the model; this script only guarantees the rule is
# present every single turn. Keep it fast and dependency-free.

cat <<'EOF'
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"TRIAGE FIRST: classify per CLAUDE.md categories 1-6, state the call in one line. Exploration you can't name a file for -> subagent. Max 3 concurrent subagents. Agent success is a claim — verify it."}}
EOF
exit 0
