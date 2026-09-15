# Optional routine budget control

The reusable routine accepts an optional numeric `max_budget_usd`. Its default
of zero produces the existing Claude argument list byte-for-byte. A positive
value appends Claude Code's `--max-budget-usd` ceiling.

Only manual Marjorie brief and triage dispatches expose and forward this input. Scheduled
and clock dispatches keep zero, so their behavior is unchanged. The ceiling
limits model spend; it does not make a partial brief an acceptance proof.
The callers convert dispatch text through `fromJSON(format(...))` before it
crosses the reusable workflow's typed-number boundary; decimal caps therefore
arrive as numbers while omitted scheduled and clock inputs remain numeric zero.
