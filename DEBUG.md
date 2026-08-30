# E3 authoring workflow review escalation

## Review rounds

1. The first independent review found missing GitHub issue authentication and a generated freshness timestamp. Both were repaired before the second review.
2. The second independent review found two workflow defects: a failed cap-follow-up issue could discard the completed paid artifact, and restored receipts could retain stale detector metadata.

## Binding ruling

`ARB-t_1b8847f3-E3-01` authorizes only these repairs:

- Preserve an emitted authoring artifact, cache receipt, and upload when the authoring step fails after writing its artifact; do not mask the authoring failure.
- On every run, merge the fresh detector metadata and unscored values into the receipt while retaining cached judgments.
- Keep the manual confirmation, Actions-only secret use, $5 cap, and no-product-write constraints unchanged.

The reviewer-round cap forbids a third Codex review. Required verification is the focused E3 tests, workflow YAML validation, and the full suite once. The PR body must cite both review objections and this ruling.
