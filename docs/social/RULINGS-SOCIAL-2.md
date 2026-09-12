# RULINGS-SOCIAL-2 — architect (Fable) rulings B1-B5

Reconstructed 2026-09-11 from PR bodies (`gh pr view 4104 --json body`) and
`docs/decisions.md`. These rulings supersede `RULINGS-SOCIAL.md` A2 and A5
after A2's merge-keyed stamp turned out unable to distinguish the owner's
own actions from an agent's, since both run under the shared `sffan15-sys`
GitHub identity.

## B1 — Approval is the owner's own Discord ✅, HMAC-signed

Social-post approval is no longer "a founder merged the draft PR" — it is
the owner's own ✅ reaction, on Discord, on the exact brief message that
names the PR/head-SHA/file (a `ref:` line every draft and header message
carries), verified by a read-only bot token and minted into an HMAC-SHA256
signed v2 stamp (`scripts/social/lib/queue.mjs`'s `signApproval`/
`verifyApprovalSig`, constant-time, keyed by `SOCIAL_APPROVAL_KEY`, an
environment secret restricted to `main`). `SOCIAL_APPROVERS`
(`scripts/social/lib/approvers.mjs`) is a hardcoded `discord:<snowflake>`
allowlist — `['discord:338508192755482626', 'discord:1421545239650238555']`
(the owner and Wyatt) — because a GitHub login can never again serve as the
approval identity: GitHub has exactly one identity for the owner
(`sffan15-sys`), the same login every agent session's `gh`, every content
routine's PAT, and the auto-merge actor also run as, so no GitHub-recorded
event (`merged_by`, a review, an environment approval) can distinguish his
own tap from an agent's `gh pr merge`. Discord is the only channel in this
system where the owner holds an identity no agent or routine holds — agents
have the write-only webhook URL, not his user account. Merging a
`social-draft` PR yourself does NOT approve it; it kills the draft (the poll
job, `social-approval-poll.mjs`, only ever stamps and merges an OPEN PR).
`approvalStatus` checks, in order: absent → malformed → not-a-`discord:`
identity → not-in-approvers → contentHash mismatch → signature. Supersedes
A2's merge-keyed stamp.

## B2 — No guard fence against an agent's `gh pr merge` on a social-draft PR

Ruled against adding a `.claude/hooks/guard.sh` deny rule for `gh pr merge`
on a PR that adds/modifies `social/queue/**.json`, even though A2's
decision entry had floated exactly that fence ("a Discord-reaction approval
mechanism... is deferred, not rejected — build it if the guard above ever
logs a denied queue-PR merge attempt by an agent"). Under B1, merging a
`social-draft` PR yourself no longer approves it — the poll job
(`social-approval-poll.mjs`) only ever stamps and merges an OPEN PR, so an
agent's premature merge just strands the draft as `unapproved` (red at 24h,
retired at 48h, a "merged before approval" notice to `#longlive-tree`),
not an unauthorized post. A guard fence would therefore imply a coverage
guarantee ("this can't be merged without approval") that no longer matches
what actually happens — the real protection is the poll job never stamping
an unsigned merge, not a pre-merge block. Source: `CLAUDE.md`'s "Never
babysit your own PR" exception, which states this directly ("not because a
guard denies it (B2 ruled against building that fence...)").

**Open discrepancy, not resolved by this doc:** roughly a dozen in-repo
code comments (`photo-library.json`'s `policy` field,
`scripts/social/lib/queue-schema.mjs`, `scripts/social/lib/photo-library.mjs`,
`scripts/social/lib/platforms.mjs`, `scripts/appearance-discovery/lib/
social-draft.mjs`, etc.) cite "RULINGS-SOCIAL.md A3/B2" for the alt-text
binding requirement (a draft's `altText[]` must copy the photo library's
`alt` field verbatim) — i.e., they use "B2" to mean the alt-text rule, not
the guard-fence rejection above. Neither PR #4098's nor PR #4104's body
names an alt-text ruling as "B2," and PR #4098 covers alt text under A3
only. This reconstruction follows the one traceable, quotable source for
what "B2" is (`CLAUDE.md:90`); the widespread "A3/B2" comments may be a
pre-existing mislabeling in the codebase, or B2 may cover both alt-text
binding AND the guard-fence rejection as two halves of one ruling — this
needs founder confirmation before those comments are treated as
authoritative.

## B3 — The merge-triggered stamper is deleted; stamping is now poll-driven

`stamp-approval.mjs` was rewritten as a pure signed library (`stampFiles`);
its CLI and `--merge-sha` flag were deleted. `.github/workflows/
social-approval-stamp.yml` (the merge-triggered stamper from A2) was
deleted outright and replaced by `.github/workflows/social-approval-poll.yml`
+ `scripts/social/social-approval-poll.mjs`, which polls Discord reactions
via a read-only bot token, verifies the `ref:` line came from the webhook's
own `webhook_id`, resolves ✅/❌ against `SOCIAL_APPROVERS`, stamps, and only
then merges the PR. `ci.yml`'s `POSTING_PATH` was updated to match. A merge
no longer produces a stamp under any code path.

## B4 — Unfreeze conditions, restated for the B1 mechanism (supersedes A5)

`SOCIAL_FREEZE` stays `true` until all of: (1) the queue is empty or fully
stamped; (2) the B1 gate PR is merged with `build` green and its named
tests present and passing; (3) a real `social-approval-notify` run logs
`approval-prompt: embeds accepted: N` with N ≥ 1; (4) a real
`social-approval-poll` run logs a stamp from an approver's Discord id. As of
PR #4104, `social-approval-poll.mjs` had never run against a real Discord
server or real credentials, and condition (4) requires the Discord bot
token setup, an owner action tracked in `HUMAN-ACTIONS.md`.

## B5 — A disjointness/non-empty test that would have caught A2's hole

`scripts/social/lib/approvers.test.ts` asserts `SOCIAL_APPROVERS` is
disjoint from `KNOWN_CONTENT_AUTHORS` and every other automation identity in
the system, that every entry matches `discord:<id>`, and that the list is
non-empty — an empty or misconfigured `SOCIAL_APPROVERS` is a total-refusal
state, not a silent bug. This is the check that, had it existed under A2,
would have caught `SOCIAL_APPROVERS = ['sffan15-sys']` sitting inside the
same identity set as `KNOWN_CONTENT_AUTHORS`. Companion coverage:
`post-queue.test.ts`/`queue.test.ts` assert a hand-crafted approval object
with every field matching but a fabricated `sig` is rejected (`ok: false`,
`fetch` never called, nothing moved to `social/posted/`), and
`stamp-approval.test.ts` feeds every content-author/automation identity
(`sffan15-sys`, `wjduvall-cmd`, `claude[bot]`, `github-actions[bot]`,
`app/claude`) into `stampFiles` and asserts refusal plus zero writes.
