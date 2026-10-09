# Routine error metadata

The 2026-09-15 noon brief run and its controlled replacement both passed
checkout, prompt loading, and GitHub token setup, then Claude returned
`is_error=true` before a model turn. The existing routine usage artifact
reported turns and cost but retained no safe error category.

The telemetry helper now emits a `diagnostic` object only when the terminal
result has `is_error=true`. It contains `isError`, an allowlisted result
subtype, and an optional allowlisted SDK assistant error enum. Unknown values
become `unknown`; arbitrary provider text, prompt content, credentials, and
founder text are discarded. Successful records keep their prior shape.
