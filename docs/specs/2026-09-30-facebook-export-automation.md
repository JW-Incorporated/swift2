# Weekly Facebook export automation

Owner decision: `docs/decisions.md` (2026-09-30).

## Behavior

A local Sunday task launches a dedicated, visible, persistent Chrome profile,
collects up to seven days of posts from every configured Facebook group,
validates each saved HTML file with the production parser, ingests it, uploads
only valid successfully-ingested files, and closes that week's reminder issue.
It never posts to Facebook. Non-membership and `no-recent-posts` are successful
skips. Login checkpoints, 2FA, CAPTCHA, missing credentials, selector drift,
parser failure, ingest failure, or upload failure stop/retain the affected data
and are reported on the reminder issue.

The password is user-scoped DPAPI data outside the repository. Only the
collector reads it, only into memory, and only to fill a password field. Dry
run performs collection and validation but never uploads or changes GitHub.
A per-week ledger outside the repository makes successful uploads and
non-member skips idempotent.

## Acceptance criteria

- Stable accessibility roles/names and URL parameters are used; hashed
  Facebook classes are not selectors.
- Collection uses **New posts (chronological)** because the seven-day stop is
  only sound in creation order. It expands every visible post and stops after
  a non-pinned post older than seven days, a bounded feed end, 250 scrolls, or
  20 minutes per group (whichever comes first).
- The age stop uses each unit's first top-level post timestamp, excluding
  pinned, featured, and announcement units from the stop calculation. Units
  whose own readable timestamp is older than seven days are not written.
- Scroll/time limits are valid partial coverage. Every upload candidate still
  contains at least one parser-kept post; zero recent posts are reported as a
  successful `no-recent-posts` skip. Real failures remain local.
- Validated files ingest before upload. Ingest failure is a group failure and
  prevents upload; dry-run performs a dry-run ingest and reports parsed counts.
- Upload output is verified before a group is recorded complete.
- The weekly issue closes only when every configured group uploaded or was
  successfully skipped. Its comment reports posts, stop reason, timestamp
  coverage, and an explicit partial-group list; failures get a credential-free
  status comment.
- Pure naming, age, stop, classification, gate, ledger, and issue-summary
  behavior is covered by unit tests with fake browser/process boundaries.

## Files

Collector/orchestrator/scheduler scripts and tests; package commands; the
Facebook parser/reminder/proposal headers; HUMAN-ACTIONS #70 plus one new v2
action; `docs/AUTOMATION.md`; and `MAP.md`.
