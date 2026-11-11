# R3b — Finished work reaches the founder (delivery, not production)

- **Date run:** 2026-10-15 (checkpoint was due 2026-10-13; this routine could not
  run on 10-13 or 10-14 — see check 2, same root cause as check 3)
- **Verdict:** **ADJUST**
- **Checks:** 4 PASS · 5 FAIL · 0 UNVERIFIABLE

## Headline

Delivery is late, not dead. One capacity fault — the routine Claude account's
**weekly usage limit**, which reset Oct 14 11pm UTC — took out the Monday brief
(10-12), this recheck's own two runs (10-13, 10-14) and three daily draft runs.
It is already mitigated in-tree (auto-pause, #5825), and the brief did reach the
channel on 10-15.

The thing worth a founder's attention is different: **two real fixes and one
tracking issue were swept away unmerged in the 2026-10-10 bulk close**, and both
bugs are live today. One of them (#4727) corrupts exactly the campaign-family
data that **R4, due tomorrow, reads to decide whether Wave 5 starts at all.**

## Checks

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | plan-recheck opened its own PR on its last due run | **PASS** | `gh pr list --label routine-audit --state all` → #5372 `plan-recheck: R1/R2/R3 reported, R3b appended`, created 2026-10-08, merged 2026-10-09. R1.md Fault A (the push fault) is fixed. |
| 2 | plan-recheck's last 3 scheduled runs completed | **FAIL** | `gh run list --workflow plan-recheck.yml` → 10-12 success, **10-13 failure**, **10-14 failure**. Both logs: `##[error]session result subtype=success is_error=true — routine step failed · reason: You've hit your weekly limit · resets Oct 14, 11pm (UTC)`. Each run died in ~70s, before the routine body. |
| 3 | A Monday brief reached #longlive-tree on 2026-10-12 | **FAIL** | `gh run list --workflow routine-tree-weekly-plan.yml` → 10-12 **schedule run failed**, same `You've hit your weekly limit` error. A brief did land, 3 days late: the 2026-10-15 14:25 `workflow_dispatch` run succeeded with step `Send the weekly brief to …` = **success** (not skipped), plus `Write the Discord permalink into the PR body` = success. |
| 4 | PR #5171 (undelivered 10-05 brief) merged, closed, or superseded | **PASS** | `gh pr view 5171` → `state CLOSED`, `closedAt 2026-10-09T12:55:22Z`, `mergedAt null`. Superseded by #5874 (week of 2026-10-15). |
| 5 | PR #4727 merged **and** scorecard prefix warnings = 0 | **FAIL** | `gh pr view 4727` → `state CLOSED`, `mergedAt null`, closed 2026-10-09T12:55:18Z. `node scripts/social/weekly-scorecard.mjs 2>&1 \| grep -c 'unrecognised campaign prefix'` → **9**. Live examples: `anniversary:`, `era-deep-cut:`, `on-this-day:`, `track-fact:` — all `pillar set to null`. |
| 6 | output-sampling's 2026-10-12 scheduled run succeeded | **FAIL** | `gh run list --workflow output-sampling.yml` → 10-05 failure, **10-12 failure**, 10-15 dispatch failure. Failing step `Sample the last 7 days of routine PR/issue output`. Log: `[routine-output-sample] error: Error: Command failed: gh search issues --repo JW-Incorporated/swift2 Tier-2: Nils — site walk --limit 100 --json number,state,createdAt` → **the unquoted search query named in R3b is still live**; it then also hit `HTTP 403: API rate limit exceeded for installation`. |
| 7 | Something published since 2026-10-02 | **PASS** | `ls social/posted/` → `2026-10-09-easter-eggs-karma-unconfirmed-{ig,x}.json`, `2026-10-11-speaknow-million-week-{ig,x}.json`. The stall *after* 10-11 is explained in PR #5874's body: daily draft runs failed 10-12/13/14 on the weekly limit. |
| 8 | lessons.md gained L002 from the 2026-10-06 Reddit-reply reason | **PASS** | `gh pr diff 5874` → `+### L002 — Never surface a Reddit target whose reply-eligibility is unconfirmed`, `Times fired: 1`, sourced verbatim from the 10-06 rejection *"Don't show me posts that I can't reply to"* (`social/feedback/2026-W41.jsonl`). Delivered in open PR #5874, not yet on `main`. L001 retires as codified into `check-drafts.mjs:checkPhotoReuse`. |
| 9 | #4889 (brief delivery) has an owner or a priority label | **FAIL** | `gh issue view 4889` → `state CLOSED`, labels `intake` + `bulk-closed-2026-10-10` ("Closed in owner-requested bulk cleanup"). No assignee, no priority label. Closed without a fix, not resolved. |

## Judgment — is the plan on track?

**The plan's production half is working; its delivery half is one bulk-close
away from quietly rotting.** Posts shipped (10-09, 10-11), the ledger took a
real founder reason and turned it into L002, the brief renders and reaches
Discord, and the recheck loop's own push fault from R1 is genuinely fixed. None
of the failures is the approval gate, and nothing has posted without approval —
so this is ADJUST, not BLOCKED.

The five FAILs are two causes, not five.

**Cause 1 — the weekly usage cap (checks 2, 3).** The routine account exhausted
its weekly allotment around 10-12 and stayed dead until the Oct 14 11pm UTC
reset. Three separate scheduled routines died in that window. Smallest fix:
none needed from this routine — the auto-pause shipped in #5825 and Tree already
filed #5600/#5687/#5766 with watchdog #5697. The structural observation worth
keeping is that **checkpoint dates are not self-healing by luck but by design**:
this routine recovered because it selects on `due <= today`, so a missed day
catches up. The Monday brief has no such catch-up — it needed a human dispatch
on 10-15. That asymmetry is the one durable lesson here.

**Cause 2 — the 2026-10-10 bulk close swept unmerged fixes (checks 5, 6, 9).**
This is the real finding. #4727 and #4889 were closed within the same cleanup,
and #4727's fix was never merged, so the campaign-prefix table still disagrees
with the code: 9 campaign instances resolve to `pillar = null` right now.
Smallest fix: re-land #4727's content on a fresh branch and fix the one
unquoted `gh search` argument in `scripts/routine-output-sample.mjs`.

### Why this matters for R4, due tomorrow

R4 asks for "approval rate, edit rate, rejection rate" and "any campaign type
meets the T7 eligibility bar" — and **Wave 5 does not start unless R4 says a
family is at or near eligibility** (PLAN.md Wave 5 entry gate). With #4727
unmerged, `pillarOf` returns `null` for `anniversary:`, `era-deep-cut:`,
`on-this-day:` and `track-fact:`, so those families are invisible to any
eligibility computation and the per-family rates R4 reports will be computed
over a partial corpus. R4's note already flags `launch:shop-the-look` at 8
briefs / 1 rejection as a live decision. **An authority change should not be
decided on a corpus with 9 null pillars.**

### Proposed plan edit (R4 checks)

Add a precondition to R4's checks in `checkpoints.json`, as the **first** entry
of its `checks` array:

```
"PRECONDITION (added by R3b, 2026-10-15): `node scripts/social/weekly-scorecard.mjs 2>&1 | grep -c 'unrecognised campaign prefix'` returns 0. If it returns non-zero, the per-family rates below are computed over a corpus with null pillars — report them, but mark the T7 eligibility answer UNVERIFIABLE and do NOT let it satisfy the Wave 5 entry gate until the prefix table is merged (PR #4727 was closed unmerged 2026-10-09).",
```

No new checkpoint is recommended: R4 is due 2026-10-16 and closes or extends the
epic on its own terms.

## Follow-up session prompt

```
Model: Sonnet (both tasks are mechanical — a known-good diff to re-land and a
one-argument quoting fix). Work in a git worktree outside Documents\Claude\Projects\.

Two live bugs, both from fixes swept unmerged in the 2026-10-10 bulk close.
Re-land them as TWO separate PRs, TL;DR first.

TASK 1 — campaign-prefix table (re-land closed PR #4727)
Read the diff of closed PR #4727 (`gh pr diff 4727`) and its body; it was closed
2026-10-09 without merging and the bug is live. Re-apply its content on a fresh
branch `fix/campaign-prefix-table`:
  - docs/marketing/social-strategy.md §1 — the family column becomes the single
    recognised-prefix list, gaining the live families that are missing and
    renaming the news family to the identifier the code actually uses.
  - the consumers that depend on it: `pillarOf`/`PILLAR_ARITY` in
    scripts/social/lib/feedback.mjs, the rollups in scripts/social/post-metrics.mjs,
    and the scorecard.
  - #4727's body notes "one line of engineering is still needed to fix the
    historical numbers" — do that backfill too, and say in the PR body what it
    changed.
VERIFY: `node scripts/social/weekly-scorecard.mjs 2>&1 | grep -c 'unrecognised
campaign prefix'` must print 0 (it prints 9 today). Also run
`npm run typecheck --workspace=@swift2/web` and the suite.
This touches scripts/social/** → `codex:rescue --background` review is MANDATORY
before the PR opens; read the result with `node scripts/agents/codex-companion.mjs
result <job-id>`, never the relay's inline summary. Max two review rounds.

TASK 2 — output-sampling unquoted search query
scripts/routine-output-sample.mjs builds `gh search issues --repo
JW-Incorporated/swift2 <query> --limit 100 --json ...` with the query
interpolated unquoted, so a title like `Tier-2: Nils — site walk` is parsed as
multiple bare args and the command fails. Seen in the 10-05, 10-12 and 10-15
runs of output-sampling.yml. Quote/escape the query argument properly (prefer
passing argv as an array via execFile rather than a shell string). The same runs
also hit `HTTP 403: API rate limit exceeded for installation` — add a single
retry with backoff on 403/rate-limit, and make a rate-limit failure a warning
that still writes a partial report rather than exiting 1.
VERIFY: run the script locally with `DRY_RUN=true` and a title containing a
colon, an em dash and spaces; it must complete and write
routine-output-raw.json. Do NOT dispatch output-sampling.yml to test.
Branch `fix/output-sample-query-quoting`.

STANDING HARD RULES (non-negotiable):
- Never `git restore` / `git checkout --` / `git reset --hard` / `git clean`.
  Never discard uncommitted work; `git stash` if you must.
- Never run scripts/social/post-queue.mjs or scripts/social/delete-media.mjs.
- Never write an `approval` object into a queue file by hand. Never merge a PR
  that adds or modifies social/queue/**.json.
- `gh variable set` is founder-only — the founder flips SOCIAL_FREEZE and every
  other switch. Do not flip variables.
- Codex review is mandatory on anything touching scripts/social/**,
  social-approval-*.yml, post-queue.mjs or auto-merge-content.yml (Task 1 does).
- Land it, don't watch it: open each PR, then either merge if green
  (`gh pr merge <n> --squash --delete-branch`) or set auto-merge
  (`gh pr merge <n> --squash --auto --delete-branch`), and exit.
```

## Also worth a line

`#4889` was closed by the bulk cleanup while still describing a live symptom
("daily drafter succeeds without drafting"). It is not re-filed here because
this routine does not open issues outside `docs/plans/tree-overhaul/`, but the
next session should reopen it or fold it into the Task 1 PR body — the delivery
gap it tracked is the subject of this entire checkpoint.

Tier-2: Plan recheck — Tree Overhaul
