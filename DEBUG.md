# DEBUG — S3 reason protocol, PR #4139, branch feat/tree-s3-reason-protocol

## Symptom

The mandatory adversarial Codex review of this PR (Tree Overhaul Wave 3,
epic #4117) has now failed twice. Per `CLAUDE.md` Workflow rule 3 ("Max two
review rounds per branch — round 2 also rejects → stop, write DEBUG.md,
escalate via the debug ladder instead of a round 3"), stopping here rather
than sending it back for a third fix-and-review cycle.

Both reviews were real traced/simulated adversarial passes against the
actual code (mocked filesystem/Git/Discord, not a static read), not shallow
opinions. Both times, real gaps were found in the same subsystem:
`scripts/social/social-approval-poll.mjs`'s honouring/stale-SHA/merge logic
(the mechanism that lets a Discord reaction approve, edit, or reject a
social-media draft PR, closing race conditions from issue #4127).

## Round 1 — findings and fix attempt

Codex round 1 (full report in PR #4139's body, "Codex round 1 fixes"
section): 4 HIGH + 6 MEDIUM findings. Summary: privileged code execution
(the edit path ran the PR branch's own possibly-modified `check-drafts.mjs`
with the poll's signing-key environment); an unclosed merge-time SHA race;
pending/rejected reactions not actually blocking stamp/merge in several
sequences; honouring silently dropping valid header rejections and
mis-attributing all approved files to one message id; a field-level gap in
the stale-diff restriction; a poster/ledger cross-workflow race; ledger rows
lost on a later failure; a header reject writing no ledger row; the poll's
own reject commits defeating retry matching; an edit reapplied on every
retry.

**Fix attempt (hypothesis: each finding has an independent, local root
cause; fix each surgically):** the executor rewrote the relevant sections
of `social-approval-poll.mjs` (see git log on this branch, commit `6d7f8822`
and its parents) plus `check-drafts.mjs` (pure export additions),
`.github/workflows/social-poster.yml`, and extended
`social-approval-poll.test.ts` with 13 new regression tests. Verification
included reverting each fix to prove its regression test failed pre-fix,
then restoring and re-confirming green — genuinely rigorous, not just
re-reading the diff. Full methodology in the PR body.

**Disproved by round 2:** this hypothesis was too narrow. Fixing each
finding as a locally-scoped patch left (or created) adjacent gaps in the
*same* underlying mechanism — see below. The individual fixes are not wrong
in isolation; the mechanism they're patching (which Discord messages/refs
are "honoured" vs "current," and which one governs which file) has more
interacting cases than either round's fix pass modeled.

## Round 2 — still blocked

Full report: see this session's transcript / Codex job (thread
`01a09278-2f01-7f91-85af-e884b17fd349`, resumed for round 2). Verdict:
**"blocked — not ready to merge."** Per-finding: 2 of 10 fully closed (#2
merge-SHA guard, #8 header-reject ledger row locally), 1 closed-for-its-
stated-case-only (#10 retry short-circuit doesn't recover missing rows), 6
partial, 1 still unsafe (#9). New/surviving issues, in priority order:

1. **HIGH — stale PR-header refs bypass the round-1 field-level safety
   check.** `poll.mjs:371-377,543-546,927-948`. Round 1's fix (#5,
   `honouredFieldChangeOk`) requires the changed-field set to be exactly
   `{approval}` or `{body,edit}` for a **per-file** stale ref to be
   honoured — but the **header** (`*`) ref still enters `honoured`
   unconditionally, with no equivalent field-level check, and the merge
   phase doesn't require every file's own reference to independently pass
   that check when a header ref is present. Reproduced: changing only `why`
   after header approval still merges.

2. **HIGH — header-level approval stamps orphan individual per-file
   reactions that arrive afterward.** `poll.mjs:386,569-578`. When the PR
   header (`*`) is approved, `approval.message` is stamped with the
   *header's* message id. That stamp commit advances HEAD. On the next run,
   each individual draft's own brief message no longer exact-matches
   anything (the file is now associated with the header's id, not its own
   brief's id), so a founder's later ❌-with-reason on that one draft's
   brief is never read — it silently vanishes from consideration rather
   than blocking merge. This defeats round 1 fix #3 (the `prBlockedByPending`
   gate) for exactly the cases it was built to catch, because the target
   disappears before pending-detection runs at all.

3. **HIGH — concurrent (not just sequential) ledger-write race between
   `social-poster.yml` and the poll.** `social-poster.yml:131,242-251,
   352-358` vs. `social-approval-poll.yml:60` — separate concurrency
   groups. Round 1 fix #6 made the poster's ledger overlay/write include
   the `social/feedback` namespace, closing the *sequential* overwrite case,
   but not a genuine concurrent one: poster reads ledger tip L → poll
   advances it → poster publishes and its L-parented push non-fast-forwards
   → until the (visibility-only) fold-back PR merges, a subsequent poster
   run can republish the same item.

4. **MEDIUM — round 1 fix #9's authorization check is spoofable.**
   `poll.mjs:298-308`. `isPollAuthorizedDeletion` checks git author
   name/email and commit-message text — all attacker-settable by anyone
   with branch-write access, not a real authentication signal. The
   exception this was meant to narrowly permit (the poll's own prior reject
   commit) is currently indistinguishable from a forged one.

5. **MEDIUM — resolved feedback can still be permanently lost**, a
   narrower survival of round-1 finding 7: a rejection now pushes the file
   deletion and posts a GitHub comment **before** writing its ledger row: a
   comment-post failure leaves nothing for the `finally` block to persist.
   Also, closed PRs are still never re-scanned, so an already-stamped
   approval whose ledger push failed cannot self-heal on a later run — the
   spec's "rows are re-derivable from Discord" premise doesn't hold for
   this path as built.

6. **MEDIUM — newly discovered: replacement captions silently truncate at
   2,000 characters.** `scripts/social/lib/feedback.mjs:57-60,133-136`.
   `cleanReplyText`'s 2,000-char cap (correct for the `reason` field per
   spec §Data-1) is also applied to `editedBody` — the actual replacement
   caption text. Instagram permits 2,200. A founder's reply between 2,001
   and 2,200 characters silently ships with its ending cut off. The cap
   needs to apply to `reason` only; `editedBody` needs its own validation
   (or none beyond what `checkDraft`'s existing per-platform length check
   already provides).

## Files involved (the minimal set — hand these to the next agent, not "the repo")

- `scripts/social/social-approval-poll.mjs` — the core of every finding above except #6.
- `scripts/social/lib/feedback.mjs` — finding #6 (`cleanReplyText`).
- `.github/workflows/social-poster.yml` and `.github/workflows/social-approval-poll.yml` — finding #3 (concurrency groups).
- `docs/specs/tree-overhaul/s3-reason-protocol.md` — the spec these findings are checked against; §3 (reaction table + honouring), §"The stale-SHA problem," and §Data-1's field rules are the relevant sections.
- `scripts/social/social-approval-poll.test.ts` — existing + round-1 regression tests; extend, don't replace.

## What I'd try next, and why

The recurring pattern across both rounds is that **"honoured" is being
treated as one flat set with one set of rules, when the real system needs
at least two axes that the current code conflates**: (a) *which specific
message/reaction governs a given file* (header vs. per-file — finding #2
above), and (b) *what diff is safe to ride along with an honoured
reference* (finding #1 — the field-level check needs to apply uniformly
regardless of whether the governing ref is a header or a per-file message).
A surgical per-finding patch approach (both rounds so far) keeps discovering
one more case this conflation produces. **The next attempt should start from
redesigning the data model** — e.g., resolve every file to its own single
authoritative governing message *first* (never falling back to a header id
for a file that has its own brief), and run the field-level safety check
against *that* resolution uniformly — rather than patching the existing
control flow again. This is a different mechanism, not a variation: model
the resolution as a pure function from (file, all current+historical refs)
→ one governing message, testable in isolation, before touching the
poll's I/O/merge logic at all.

Finding #3 (concurrent ledger writers) and #4 (spoofable authorization) are
narrower and more separable — they don't obviously need the same redesign,
but should be re-verified once the header/per-file resolution is fixed,
since #2's fix will change which commits exist at all.

## Escalation ladder (per `debug-protocol` skill)

1. ~~Codex fix attempt~~ — **attempted, structurally blocked, not a content
   rejection.** The `codex-companion.mjs task --write` harness's workspace is
   fixed to the primary checkout (`Documents\Claude\Projects\Swift2`, on
   `main`, Git metadata read-only) and has no GitHub network access in this
   mode — it cannot operate on this worktree/branch at all, regardless of
   prompt phrasing ("Blocked by this session's workspace permissions — not
   by another review failure... No code changed, tests ran, commits were
   created"). Not re-attempted further; this is a tooling limitation, not
   evidence the fix is hard. Proceeding to step 2.
2. ~~Fresh-context Claude agent, same brief~~ — **done, see "Round 3" below.**
3. If that returns without a fix: `architect` (Fable), mandatory, no
   deliberation — log in `STATE.md` → Architect invocations.
4. If still unfixed: revert this branch's approval/merge-logic changes to
   last-green (the pre-S3 poll.mjs), keep the parts of S3 that don't touch
   this mechanism (the ledger schema, `pillarOf`, `isoWeek`, the ✏️/⏭️
   reaction vocabulary), and note the gap rather than ship a broken gate.
5. Escalate to the owner with this file.

## Round 3 (fresh-context, this session) — resolution

Took the redesign direction seriously for findings 1+2, which share the root
cause: added `resolveGoverningRef(file, refs)` to `lib/feedback.mjs` — a
pure function resolving one authoritative governing message per file (its
own per-file brief when the PR has one, never falling back to the header),
unit-tested in isolation before touching the poll's control flow.

- **Finding 1** — `partitionCurrentHonoured` now also returns `unsafeFiles`
  (per-file refs that failed the stale-diff safety check this run). The
  merge phase gates on it independently of whether a header ref happens to
  also be `honoured` on the same PR, closing the gap where the header's
  unconditional-honour (needed for finding-4a's stale-header-❌ case) used
  to let the whole-PR "anything honoured?" bail-out skip past a sibling
  file's own, independently-failed safety check. Cleared for any file
  freshly re-stamped in the same run, so a genuine fresh header ✅ against
  current head is never wrongly stranded by an unrelated stale flag.
- **Finding 2** — stamping now writes `resolveGoverningRef`'s result into
  `approval.message`, not the reacted-on message's id. A header-driven
  approve no longer overwrites a file's identity with the header's id, so a
  later ❌/✏️ placed on that file's own brief message is never orphaned.
  `message` was never part of the signed payload (spec §Data-2), so this
  changes nothing about what a stamp attests to.
- **Finding 3** — `social-poster.yml`'s ledger push now retries (bounded,
  re-fetching and re-parenting on each attempt) instead of failing on the
  first non-fast-forward against `social-approval-poll.yml`'s own writer.
- **Finding 4** — `isPollAuthorizedDeletion` now additionally requires a
  corroborating `action: "reject"` row already durable on `social-ledger`
  for that exact `(pr, file)` — a branch the commit's own author could not
  also have written to — closing the pure-shape (author+message text)
  forgery gap.
- **Finding 5** — the reject loop now queues its ledger row before the
  GitHub comment call, not after, so a comment failure can't cost the row.
  Added a bounded self-heal: a PR found `MERGED` (not just non-`OPEN`, so a
  header-rejected PR's superseded stamps are never recorded as "approved")
  re-derives any missing `approve` row straight from the file's own signed
  `approval` at its merge-time ref.
- **Finding 6** — `editedBody` no longer shares `reason`'s 2000-char cap;
  only `reason` is capped per spec §Data-1, `editedBody` relies on
  `checkDraft`'s own per-platform length check.

All 6 re-verified with tests that fail when the corresponding fix is
reverted (see `social-approval-poll.test.ts` "round 2" cases and
`feedback.test.ts`/`social-poster-workflow.test.ts`). Full rationale and
verification commands in the PR body's "Debug-ladder escalation" section.
