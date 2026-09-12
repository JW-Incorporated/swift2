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

## Codex review of Round 3 — still BLOCKED. Escalating to architect now.

Fresh Codex thread, 12 in-memory scenarios against the actual code (commit
`58f6fc6e`). Verdict: **BLOCKED.** 5 of 6 original findings only
**partially** closed (only #6 fully closed); **3 new HIGH findings the
redesign itself introduces or leaves open**, plus 2 new MEDIUM:

- **HIGH (finding 1 residual)** — an unsigned `approval.message` can still
  be hand-edited to point at the header id (alongside a `why` change);
  `partitionCurrentHonoured` skips the real per-file ref *before* marking it
  unsafe, so the honoured header still permits merge without ever reading
  the file's actual ❌.
- **HIGH (new) — `resolveGoverningRef` has no way to disambiguate duplicate
  briefs.** It picks the *first* matching per-file ref; with two same-SHA
  briefs for one file, approving the older one can stamp the newer
  message's id, silently skipping a rejection placed on the message that
  was actually acted on.
- **HIGH (new) — governing identity isn't stable across runs.** A file
  first stamped via the header, which later gains its own per-file brief,
  keeps the header's id (`needsStamp` stays false) — a rejection on that
  later brief is skipped. The reverse also reproduces: a fresh header
  approval can stamp a file despite an existing rejection sitting on that
  file's own stale brief.
- **MEDIUM (new)** — the Finding-5 `MERGED` self-heal always synthesizes an
  `approve` row even when a correct `edit` row already exists for that
  file, corrupting the edit-rate/approval denominator T7 will eventually
  read.
- **MEDIUM (new)** — a fresh, valid header approval cannot clear
  `unsafeFiles` for a file whose own signature still validates unchanged
  (`needsStamp` false) — it stays wrongly stranded pending indefinitely,
  with no path to recovery.

**This is the second consecutive attempt — a narrow patch, then a genuine
redesign — to leave new adjacent gaps in the same mechanism.** Per
`debug-protocol`: "If the fresh-context agent returns without a fix →
architect (Fable), immediately... no deliberation." Escalating now. See
"Synthesis for architect" below for the one cross-attempt pattern worth
naming, offered as a hypothesis for architect's own judgment, not an
instruction.

## Synthesis across all 3 attempts, for architect

Every attempt — a narrow patch, then a full redesign — has modeled "which
message/commit is authoritative for a file" as something **re-derivable
fresh from this run's own snapshot** (this run's fetched Discord messages,
this run's diff from a stale SHA), rather than as a genuinely stateful
property that must stay consistent *across* runs, duplicate notifications,
retries, and two independent workflows (`social-approval-poll.yml` +
`social-poster.yml`) writing the same `social-ledger` branch. Each fix adds
one more rule for resolving that snapshot correctly in one more case
Codex's simulation found, and each new rule opens exactly one new seam
(duplicate briefs, identity-not-preserved-across-runs, an unsigned field
surviving a valid signature). The `social/feedback` ledger this same spec
already builds is an append-only, durable, write-once record — the
governing-message resolution problem looks structurally like the same kind
of problem, currently solved the opposite way (re-derived each run instead
of recorded once and trusted thereafter). Whether that's the right
direction, and what the minimal correct version of it looks like, is
exactly the judgment this escalation is for.

## Architect (Fable) verdict — implement this, do not re-litigate it

**Delete the "governing message" concept entirely.** Three attempts failed
on one design decision, not three separate bugs: the poll gates *listening*
(which reactions it reads) on message identity (`approval.message === ref.
message.id`, then round 3's `resolveGoverningRef`). But messages are
ephemeral and multiply by construction — `social-approval-notify.yml`
re-posts the header and every unstamped brief on every `synchronize`
(including the poll's own stamp/edit/reject pushes), the daily digest
re-posts at the same SHA, and the 100-message window drops old ones. Every
finding across all 3 attempts (header vs per-file, duplicate briefs,
identity not preserved across runs, hand-edited unsigned `message`,
stranded `unsafeFiles`) is one more way for the recorded id not to be the
one the founder actually reacted on. That class is unbounded — no 4th
implementation pass closes it by adding one more rule. **This is
architectural, and the fix is a simplification, not more rules.**

Explicitly rejected: (A) a more careful implementation of the current
model — proven insufficient 3 rounds running; (B) this file's own
"synthesis" hypothesis above (a durable record of the governing message) —
**wrong**, because it makes the blind spot *permanent* instead of
transient: every other message for that file becomes permanently unread by
construction. The durable-record instinct is right for the **SHA**, wrong
for the **message id**. (Dropping honouring entirely was also considered
and rejected: ✏️ makes stale-SHA a certainty, so S3 without honouring isn't
S3.)

### The design — two axes, cleanly separated

**Listening axis (Discord):** read reactions on *every* window message
whose ref is `(pr, *)` or `(pr, file)`, any SHA. Union reactions and
replies per target; classify the union (❌ anywhere wins; latest reply
anywhere wins, by timestamp). `approval.message` becomes **audit-only** —
nothing gates on it, ever again.

**Safety axis (git):** mint **v3 stamps** whose signed payload adds the
head SHA the poll stamped on: `${v}|${by}|${at}|${pr}|${sha}|${contentHash}`
(currently v2 has no `sha`; `lib/queue.mjs`'s `approvalStatus` hard-codes
`v === 2` — dispatch on `v` so v2 stamps on already-merged content stay
valid, poll mints v3 only, going forward). One predicate now decides both
"may this ✅/✏️ mint" and "may this stamp merge":

```
cleanSince(execGit, S, head, key) → {ok, offending[]}
  for every path in `git diff --name-only S head`:
    must be social/queue/**.json
    absent at head → OK (a deletion cannot publish unseen content —
      this deletes finding-9's whole authorization machinery entirely,
      isPollAuthorizedDeletion/ledgerHasRejectRow go away)
    present at head → must be validly stamped at head
  fetch --depth=100 pull/<n>/head, fallback fetch --depth=1 origin <S>;
  unreadable → fail closed

selfClean(F): F's bytes at approval.sha vs head differ only in
  approval/body/edit (existing honouredFieldChangeOk logic, reused).
  Per-file, self-anchored — sibling drift never permanently strands an
  untouched file.

mintable(m, F): m.sha === head OR (cleanSince(m.sha, head).ok AND F not
  in that diff). Applies to ✅ AND ✏️ alike. A header ✅ at head expands to
  every queue file that still needs a stamp.

needsStamp(F): !approvalStatus.ok || !cleanSince(approval.sha, head).ok
  || !selfClean(F) — drift is recoverable by a fresh ✅ on the newest
  header; no separate stamp-stripping write path is needed.

MERGE iff: every queue file at head is validly stamped AND for every F:
  cleanSince(approval_F.sha, head).ok AND selfClean(F). Otherwise post one
  notice per PR per 24h naming the offending paths (a `notice:` trailer,
  same dedupe pattern as the existing nudge).
```

**Ledger rows are derived from state every run, never only from this run's
own actions** — approve/edit rows from each valid stamp (`ts =
approval.at`; `action = 'edit'` iff `edit.at === approval.at`, since the
code already sets both from one `nowIso`; add `edit.reply` for `replyId`);
reject rows from a ❌+reason on a file now absent at head (`originalBody`
via `git show m.sha:F`). Dedupe against the week file matching the row's
own `ts`. **Delete the MERGED-only self-heal entirely** — it's now
unnecessary (derivation happens every run, not just once).

### Findings closure — verify each of these when done

| Finding | Closed by |
|---|---|
| R2-1 header bypasses field check | no honoured set at all; merge is per-file `cleanSince`+`selfClean`, header-independent |
| R2-2 header stamp orphans per-file ❌ | all messages read (union), nothing gates on `approval.message` |
| R2-3 concurrent ledger writers (poster vs poll) | **poster-side fix required too**: round 3's retry re-pushed a fixed `NEW_TREE`, silently reverting feedback rows the poll pushed in between — each retry attempt must re-read the fresh tip and stage only `social/queue\|posted\|failed`, never a stale full-tree snapshot |
| R2-4 spoofable deletion auth | deletions are always safe now (a deletion can't publish unseen content) — delete `isPollAuthorizedDeletion`/`ledgerHasRejectRow` outright |
| R2-5 lost feedback rows | state-derived rows + dedupe — convergent within the message window, no longer dependent on one run's in-memory state surviving to the ledger push |
| R2-6 caption truncation cap | already closed (round 3), keep as-is |
| R3-H1 hand-edited `approval.message` | not a gate any more; `sha` is the signed, load-bearing field |
| R3-H2 duplicate briefs / R3-H3 identity-not-stable-across-runs (both directions) | union across all window messages; ❌ on ANY of them wins |
| R3-M1 self-heal duplicates an edit row | the derivation rule above (one edit row OR one approve row per stamp, never both) |
| R3-M2 stranded `unsafeFiles` | no sticky/persistent flag at all — re-evaluated fresh every run via `needsStamp` |

**Residuals to state plainly in the PR, not hide:** the 100-message window
is still a real (spec-accepted) limit; a non-queue-path drift (e.g. only
image bytes changing) doesn't itself fire `notify`, so no fresh header
appears until the next daily digest cycle — the notice text must say this
explicitly rather than imply an immediate fix path; ✏️ on a stale message
now needs to pass `mintable` too (a real tightening of spec §"the stale-SHA
problem", not a bug).

### Spec defects found along the way (contributed to this, distinct from an implementation gap)

1. Spec's "no change to the signature payload… none should be made" is
   **wrong now** — a **versioned** v3 leaves v2 signatures valid; this
   needs a `docs/decisions.md` entry (data-model/auth change) before
   implementation, per this repo's rule 6.
2. Spec's honouring rule keys on "an `approval` naming that exact
   message" — message identity as the anchor is the actual root cause.
3. Spec's "every diff path… validly stamped at head" is over-strict for a
   deletion (this is what spawned finding 9's whole ledger-corroboration
   workaround) and for cross-file drift (a permanent strand after any
   sibling's unrelated change).
4. Spec's "freshness required to create" as strict SHA-equality silently
   discards a ✅ on a brief the poll's own sibling stamp made stale, with
   zero founder-visible feedback that anything was dropped.
5. Spec models one message per target; multiples are the *normal* state
   given how notify re-posts. It must say: union across every message.
6. Spec's workflow section claims "nothing races `social-ledger`" — false,
   the poster is a second independent writer to that branch. State
   namespace ownership explicitly.
7. This whole change (v3 payload) is a data-model/auth change — needs a
   `docs/decisions.md` entry BEFORE implementation, not after.

### Execution notes for whoever implements this

**Touch set:** `scripts/social/lib/queue.mjs` (payload/verifier/
`stampFiles` gains `sha`), `scripts/social/lib/feedback.mjs` (delete
`resolveGoverningRef` entirely; add pure `groupTargets`/`classifyTarget`
functions operating over unions, returning ✅/❌/✏️-bearing messages *with
their SHAs* for `mintable` to consume, plus per-message pending states for
nudges), `scripts/social/social-approval-poll.mjs` (delete
`partitionCurrentHonoured`, every `honoured*` name, `unsafeFiles`,
`POLL_COMMIT_AUTHOR`, both deletion-auth functions, the MERGED self-heal;
fetch reactions for **every** ref belonging to the PR, not a filtered
subset), `.github/workflows/social-poster.yml` (the ledger push step —
re-read-tree per retry attempt), plus tests throughout.

**Per-PR order, unchanged in overall shape:** classify unions → header
reject → nudges → checkout + TOCTOU guard (keep this — it's a different,
already-correctly-closed race) → rejects (file absent at head: no `git rm`
needed since it's already gone, no comment needed if already commented,
row still emitted from state) → edits (`mintable` else post a notice) →
stamps → merge with `--match-head-commit` (keep this too) → ledger write in
a `finally`.

**Regression tests that MUST fail against the pre-this-fix code, then pass
after:** a ❌+reason on a stale duplicate brief blocks a header ✅ from
merging; a hand-edited `approval.sha` fails signature verification; a
`why`-only drift produces no merge + a notice, then a fresh header ✅
re-mints only that file and merges; a deletion within the diff range with
no ledger row still merges cleanly; a poster retry that races an
interleaved poll push preserves the poll's feedback rows; a lost approve
row re-derives on the next run with no duplicate; an edit-stamped file
yields exactly one edit row and zero approve rows for that same stamp.

**One more real bug found along the way, worth a one-line fix regardless
of this redesign:** `social-approval-notify.yml`'s jq projection omits
`approval` from what it emits, so `scripts/social/filter-already-stamped.mjs`
may be filtering nothing at all. Verify and fix if confirmed — separate
from this redesign but cheap to fix in the same PR since you'll be reading
this exact code path anyway.

**Consequences of this call, stated plainly:** this commits to v3 stamps
(the poster keeps verifying v2 for already-merged historical items; the
poll mints v3 only, going forward — a v2 stamp still sitting on an open PR
at the moment this lands needs one fresh re-✅ to become a v3 stamp,
mention this in the PR body as a known one-time transition cost). This
forecloses ever treating message id as authoritative state — S6 and T4
(later Wave 3 stages, already built or in flight) must not be built
assuming otherwise. The cheapest signal this call was wrong: a later
adversarial review finds a merge where a ❌ on any window-visible message
for that file went unread, or where `diff approval.sha head` contains a
non-`social/queue/**` path — either means the two axes leaked back
together.
