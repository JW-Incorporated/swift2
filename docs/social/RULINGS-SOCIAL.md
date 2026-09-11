# RULINGS-SOCIAL — architect (Fable) rulings A1-A6

Reconstructed 2026-09-11 from PR bodies (`gh pr view 4098 --json body`) and
`docs/decisions.md`. These rulings shaped the 2026-09-10/11 social approval
gate rebuild (issue #56 near-miss). **A2 and A5 are superseded** by
`RULINGS-SOCIAL-2.md` B1 and B4 respectively — kept here for history; follow
the `-2` file for current behavior.

## A1 — Pre-gate drafts don't grandfather; retire them

The four `social/queue/**.json` drafts that landed on `main` before the
2026-09-10 approval gate existed were retroactively invisible to the new
gate (their "approval" was inferred from being-already-merged, a state the
new mechanism doesn't recognize). Rather than force-fit them into the new
stamp format, they were retired (`chore: retire four pre-gate social drafts
(#4097)`). The unfreeze conditions (A5, later B4) require the queue to be
empty or fully stamped — A1 is what makes that true at gate-rebuild time
rather than deadlocking on drafts nothing can legitimately stamp.

## A2 — Approval is a stamped, content-bound data object (superseded by B1)

`approval` became a stamped object written ONLY by a merge-triggered
workflow (`social-approval-stamp.yml` + `stamp-approval.mjs`), checked
against a hardcoded approver list (`scripts/social/lib/approvers.mjs`), and
bound by a sha256 `contentHash` over platform/body/media/altText/
scheduledAt/campaign so editing any of those after the stamp voids it.
`post-queue.mjs` refuses anything without a currently-valid stamp — a loud
`unapproved` outcome, red past 24h overdue, retired to `social/failed/` at
48h — and stopped calling the GitHub API at post time. The dead
`lib/git-provenance.mjs` (which queried `commits/{sha}/pulls` for
`merged_by`, a field it never actually carried) was deleted. A pre-2026-09-11
draft has no `approval` key at all, so grandfathering is impossible by
construction. **Superseded 2026-09-11 by B1**: A2's merge-keyed stamp could
not distinguish the owner's own "Merge" tap from an agent's `gh pr merge`
running under the same shared `sffan15-sys` GitHub identity — B1 moves the
trust root to a Discord reaction only the owner can produce.

## A3 — Real Discord approval prompt: image, alt text, overdue state

`approval-prompt.mjs` was rebuilt around one Discord message per draft
carrying a real `image.url` embed (the same `MEDIA_BASE_URL`/`mediaUrlsFor`
path the poster itself publishes from), account handle, overdue annotation,
length vs. platform limit, alt text, credit, a truncated `why` plus file
link, and the Facebook cross-post disclosure. `sendApprovalPrompt` checks
the webhook's `?wait=true` response's `embeds.length` against what was sent
and logs `approval-prompt: embeds accepted: N` — the machine-verifiable half
of "the image shows," which the unfreeze conditions require. `altText`
became a required schema field, bound to a new `alt` field on every
`photo-library.json` entry, and sent to X (`media/metadata/create`),
Instagram (`alt_text`), and Facebook (`alt_text_custom`).

## A4 — Facebook cross-post stays, with a disclosed degradation

The Facebook cross-post continues per the owner's "everything should be the
same" directive. Every Instagram draft's approval brief discloses that the
cross-post is a degraded copy (image 1 only, caption verbatim, same alt
text) whenever the cross-post is armed, so an approver isn't approving a
post they haven't actually seen the shape of.

## A5 — Unfreeze conditions (superseded by B4)

`SOCIAL_FREEZE` stays `true` until all of: (1) the queue is empty or fully
stamped; (2) the gate PR is merged green with its named refusal tests
present and passing; (3) a real `social-approval-notify` run logs
`approval-prompt: embeds accepted: N` for a founder-visible brief with the
image; (4) the owner says in chat that he saw the image in
`#longlive-social`. No single PR flips the freeze itself or claims a
condition met without evidence. **Superseded 2026-09-11 by B4**, which
restates the same four-condition structure against the B1 Discord-poll
mechanism instead of the A2 merge-stamp mechanism.

## A6 — CI enforces the freeze; a watchdog catches aged blocking actions

`ci.yml`'s `build-full` job fails any PR touching the live posting path
while `SOCIAL_FREEZE` is off, making the freeze a merge precondition rather
than a memo. A watchdog step (`blocking-human-actions-check.mjs`) reddens
and alerts when an OPEN `[BLOCKING]` item in `HUMAN-ACTIONS.md` is older
than 24h — the exact single point of failure behind the issue #56 near-miss
(a filed-but-unexecuted freeze action sitting open looked identical to a
handled one). `validate-queue.mjs` prints every unstamped draft as a
warning, never a failure.
