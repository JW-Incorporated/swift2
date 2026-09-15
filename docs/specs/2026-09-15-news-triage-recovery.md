# News Triage recovery

## Problem and evidence

After the September 5 routine migration, News Triage ran green September
7–13 but produced no intake issues or mandatory run-log comments on #502.
Run 34774257278 finished in four turns. Vault PRs #4133, #4198 and #4268
explicitly report an empty/held authoring queue. The September 15 news
digest is fresh and content publication succeeds; the supply bridge is
silent. The active workflow loads an archival prompt verbatim, including
`Enabled: false` and a code fence around all operational instructions.
That is a plausible cause, not a proven account of the hidden transcript.

## Change

Make the News Triage prompt direct, active instructions, preserving its
editorial rules. Require a run-specific receipt on its existing #502 log
after every run, including runs that file issues. A deterministic follow-up
job checks that the current attempt actually left a receipt recording the
consumed digest and reviewed-story count. Missing, blocked, or unrelated
receipts fail the workflow; a verified empty editorial queue is acceptable.
This verifies execution, not the correctness of editorial judgment.

Expose the existing optional manual Claude budget input for a bounded
recovery check. Scheduled runs retain their current model, cadence and budget.

## Acceptance and scope

- No archival disabled flag or outer prompt fence in the executable prompt.
- Old attempts, unrelated authors, missing receipts and blocked runs fail.
- Legitimate current-run receipts pass, including explicit no-items results.
- A real bounded dispatch produces a receipt before recovery is claimed.
- Change only the News Triage workflow/prompt, receipt checker/tests and docs.

Validation: focused receipt/workflow tests, lint, typecheck, full suite, then
an independently reviewed change and one budget-authorized real dispatch.
Do not infer a shipped content item from a successful triage receipt.

## Local verification, September 15

- Receipt and routine-workflow tests: 37 passed; all 18 workflow invariants pass.
- Lint: no errors (five existing warnings). All workspace typechecks pass
  after `sync:content` generates the fresh checkout's ignored modules.
- Full Windows suite: 431 files pass, 12 fail; 6,441 tests pass, 14 fail,
  six skip. The failures are outside this change and include the known
  Windows line-ending/command-resolution failures tracked in #4358.
  Linux CI remains required before merge.
- Against real historical green run 34774257278/1, the receipt checker
  correctly exits nonzero because no completed receipt exists.
- Rebuilding the main seed corpus produces bundle version
  `6e6e6675edd1c570758c7c5c479ceae3b34ef5a873129ec319c4bc441ee34c90`,
  identical to the public website's `content/current.json`. Publication is
  current with the corpus; absence of new authored events is upstream.
- Independent code review: root Codex accepted the six-file change.
