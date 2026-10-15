# Switch ledger

Append-only log written by `scripts/ops/set-switch.mjs` (decisions.md 2026-10-06).
Every agent flip of a repo variable lands here: UTC time, name, old -> new, reason.
Freeze switches include `SOCIAL_FREEZE`, `CONTENT_AUTOMERGE_FREEZE`,
`TIDEWATCH_FREEZE`, and the database-backed `PUSH_FREEZE`. Agents may only set
these to `true`; only the owner may lift them.

| UTC time | Variable | Change | Reason |
|---|---|---|---|
