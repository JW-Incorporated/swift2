# Weekly Facebook export automation

Owner decision: `docs/decisions.md` (2026-09-30).

## Behavior

A local Sunday task launches a dedicated, visible, persistent Chrome profile,
collects seven days of posts from every configured Facebook group, validates
each saved HTML file with the production parser, uploads only valid files, and
closes that week's reminder issue. It never posts to Facebook. Non-membership
is a successful skip. Login checkpoints, 2FA, CAPTCHA, missing credentials,
selector drift, parser failure, or upload failure stop/retain the affected
data and are reported on the reminder issue.

The password is user-scoped DPAPI data outside the repository. Only the
collector reads it, only into memory, and only to fill a password field. Dry
run performs collection and validation but never uploads or changes GitHub.
A per-week ledger outside the repository makes successful uploads and
non-member skips idempotent.

## Acceptance criteria

- Stable accessibility roles/names and URL parameters are used; hashed
  Facebook classes are not selectors.
- Collection expands every visible post, stops after a visible post older
  than seven days or a bounded feed end, and has a hard scroll cap.
- Every upload candidate contains at least one parser-kept post and has met
  the seven-day stop rule; failed files remain local.
- Upload output is verified before a group is recorded complete.
- The weekly issue closes only when every configured group uploaded or was
  skipped as not joined; failures get a credential-free status comment.
- Pure naming, age, stop, classification, gate, ledger, and issue-summary
  behavior is covered by unit tests with fake browser/process boundaries.

## Files

Collector/orchestrator/scheduler scripts and tests; package commands; the
Facebook parser/reminder/proposal headers; HUMAN-ACTIONS #70 plus one new v2
action; `docs/AUTOMATION.md`; and `MAP.md`.
