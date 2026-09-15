# Claude OAuth probe

The manual `claude-auth-probe.yml` workflow checks the same OAuth and
`anthropics/claude-code-action@v1` path as the scheduled routines without
running a routine. It permits one Haiku turn, no tools, and at most $0.05 of
model usage. The prompt returns a fixed sentinel.
The attached empty `--tools=` value is intentional: it survives the action's
shell argument parser while disabling Claude Code's built-in and MCP tools.

The workflow exposes no completion text or execution artifact. Its verifier
reads the runner-local execution file and reports only a fixed pass or failure
message. A pass proves OAuth and basic Haiku inference at that time. It does
not prove another model, routine tools, Discord delivery, or any M7/M8 live
acceptance criterion.
