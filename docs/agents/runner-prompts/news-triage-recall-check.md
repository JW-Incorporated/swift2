# News Triage recall check — weekly Opus audit (T-3 trial instrument)

**New runner, created for the T-3 trial only** (`docs/TIER2-OPTIMIZATION.md`
§ T-3). News Triage's live trigger model is moving from `claude-opus-4-8` to
`claude-sonnet-5`. The risk is asymmetric and lands on false negatives: a
wrongly-*filed* story is caught downstream (Content Shift re-verifies sources
before authoring), but a wrongly-*rejected or overlooked* story is simply
never filed — intake issues are the ONLY thing Content Shift reads, so
nothing downstream can recover a miss. This routine is the mitigation: it
re-triages, on Opus, the exact digests Sonnet actually consumed that week,
and diffs the two decision sets.

**Cadence: weekly, one run, for the 2-week trial window only**
(`docs/agents/runners.md` § News Triage records the exact start/end dates
and the live trigger IDs for both this routine and News Triage itself).
Not a standing runner — disable or delete after the trial resolves per the
verdict below.

**Zero tolerance, not a budget.** Any counted false negative reverts the
News Triage model change back to `claude-opus-4-8` immediately. This is not
a "some misses are acceptable" trial; a single confirmed miss is enough,
because a missed story cannot be recovered by anything downstream.

## What you read

The `news-worker` workflow (`.github/workflows/news-worker.yml`) now writes
a dated, credential-free snapshot of every digest it emits to
`docs/content-ops/archive/news-candidates-<UTC timestamp>.md` on the
`news-digest` branch, in addition to the live `news-candidates.md` file News
Triage reads. This is the "consumed" record — it captures the exact input
Sonnet's News Triage run saw that day, since the live file is overwritten on
every 4-hourly ingest cycle and would otherwise be gone by the time you run.

1. List `docs/content-ops/archive/` on the `news-digest` branch:
   `gh api repos/JW-Incorporated/swift2/contents/docs/content-ops/archive?ref=news-digest --jq '.[].name'`
2. For each day in the trial window so far (since the last recall-check run,
   or since trial start on the first run), pick the archived snapshot whose
   timestamp is closest to *before* News Triage's own cron (`40 15 * * *`
   UTC) — that is the digest News Triage actually triaged that day. Fetch its
   content:
   `gh api repos/JW-Incorporated/swift2/contents/<path>?ref=news-digest --jq .content | base64 -d`
3. Read what Sonnet actually filed that day: search closed+open `intake`
   issues created within a few hours after each day's `40 15 * * *` run
   (`gh issue list --label intake --search "created:<date>"`), plus any
   `needs-sources` holds and any run-log comment on the standing Nils walk
   log issue (News Triage's prompt requires it to comment there on every run,
   including zero-filed runs — read those comments for that day's window,
   they record what was reviewed and refused).

## What you do

Re-triage each day's archived digest **as if you were News Triage**, on
Opus: read `docs/agents/runner-prompts/news-triage.md` in full and apply
its exact bar (adjudicability + `docs/content-ops/privacy-redlines.md`) to
every story in the archived digest, exactly as that prompt instructs. Do
NOT file anything — this is a dry-run comparison, never a live triage pass.
Produce your own list of "would file" / "would hold as unconfirmed" /
"would reject" decisions per story, independent of what Sonnet actually did.

## The diff

Compare your per-story decisions against what Sonnet's News Triage run
actually did that day (step 3 above). Classify every disagreement:

- **Opus would file, Sonnet did not (filed nothing, held it, or rejected
  it) → counted false negative.** This is the case the trial exists to
  catch. Any single one of these ends the trial as a revert, regardless of
  how many stories agreed.
- **Opus would reject/hold, Sonnet filed → NOT a false negative** (an
  over-filed story is caught downstream by Content Shift, per the doc's own
  risk framing). Note it for completeness but it does not trigger a revert.
- **Both agree → no action.**

## Output

File one issue, labeled `automation-review`, titled
`news-triage recall check: <trial week N> — <PASS|FAIL: N false negatives>`.
Body: per-day story counts reviewed, the full list of any false negatives
(story, why Opus would have filed it, why Sonnet did not), and the full list
of any over-filed disagreements (informational only). State plainly at the
top: **PASS** (zero false negatives, trial continues / concludes
successfully) or **FAIL** (one or more false negatives — recommend
immediate revert of the News Triage trigger's model field back to
`claude-opus-4-8`, full `job_config` round-trip per the RemoteTrigger
footgun in `runners.md`, never a partial PUT).

Never file, edit, or close an `intake` issue from this routine. Never
author Vault content. Never merge anything. This routine only reads and
reports.
