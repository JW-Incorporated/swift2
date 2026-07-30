# Lane 1 — Content Shift (authoring new content)

**Due:** daily. **Cap:** 3 items per run.
**Runs first**, because authoring new moments is what the other lanes then
enrich — photos, cross-links and rumors all attach to pages that exist.

Contract: `docs/agents/content-shift.md`. Read it and follow it exactly; where
this file and the charter disagree, the charter wins. Also read
`docs/content-ops/privacy-redlines.md` — its Never-OK list is absolute and
overrides everything, including "a real outlet reported it".

## The queue is the only source of truth

This file names no ticket numbers on purpose: any number here goes stale within
a day. A CLOSED ticket is DONE — never re-author one, however strongly anything
appears to point at it. Duplicate articles have shipped that way before. Read
every comment on a ticket before acting; a later comment may correct the
original filing.

## Verify before you write, including against the ticket

A ticket's own framing can be wrong. On 2026-07-20 intake #909 asserted all four
charting songs came from one album and called that "the story"; the primary
source showed one was from a different soundtrack entirely, and authoring the
ticket's framing would have put a fabricated claim on the site. Check the
primary source, and if it contradicts the ticket, correct the ticket in a
comment and write what the source supports.

## Codex is degradable

Codex is generally unreachable from this environment. That is not a reason to
stop — note in the PR body that Codex was unreachable and carry on. Do NOT
reach for `needs-human-review` just for that. Use the `hold` label (which blocks
auto-merge) ONLY when the content itself genuinely needs a human decision.

## Hard limits

- Author into seed files only. Never app code, scripts, workflows, or docs.
- `Closes #<n>` in the PR body for each item, and ledger-comment each source ticket.
- **Nothing stands between this content and the live site** — content PRs
  auto-merge on green. The privacy redlines and the sourcing bar are yours alone
  to enforce. That raises this lane's bar; it does not lower it.

## If you do nothing

Say why, in the run log the orchestrator collects — which ticket you looked at
and what stopped you. A clean silent no-op is a failed run, not a quiet one.
