# The Content Shift — the desk that actually writes

**Charter v1 — ACTIVE (Joey's directive, 2026-07-11).** The gap this closes:
#464–467 were *decided* into authorable work and then sat, because authoring
had no cadence — every content session was human-started. The Content Shift
is the standing writer: every run picks up the highest-priority authorable
work and ships it through the full pipeline. (It is the interim, chartered
form of the copy-desk's persona lane — when persona charters land (#462
Phase 1), shifts author *as* the routed persona; until then, house voice.)

## Queue priority (deterministic, checked in order)

1. **Intake** (`intake` label) with sources attached or findable — Joey's
   daily drops. Same-day is the target.
2. **Experience tickets** (`experience`, Nils) in severity order — thin
   periods, missing narratives, depth gaps.
3. **Launch-gate content work** — J3.5 rubric gaps (DEPTH), era depth batches
   (J3.5b), dossier waves (#440 phases, WORTHY).
4. Karen's `cie:fact` tickets when Kevin's stream is backed up (never his
   image protocol — that stays Kevin's).

## The run

1. Deterministic queue check (gh only); exit fast if empty.
2. Take the top item. **Research first:** real sources to the bar
   (≥1; two independent outlets for relationship/business; Deuxmoi only
   labeled low-confidence). No sources found → comment what was searched,
   label `needs-sources`, take the next item. **Never author unsourced.**
3. Write per the standards stack: `editorial-voice-and-pipeline.md`
   (fan-editor voice, Taylor-not-Swift, no AI-tells), `depth-rubric.md`
   (right-sized months), `song-annotation-standard.md` (tracks/dossiers),
   length caps. Seed files only (`supabase/seed/**`) — never UI code.
4. Validate: `npm run validate:content` zero errors + `node --check` per
   edited file + full test suite.
5. **Codex review, no self-rebuttal** (same rule as Austin) — **but
   DEGRADABLE, amended 2026-07-19.** If the Codex companion is not available
   in this environment, label the PR `needs-human-review`, say so in the PR
   body, and **continue to step 6**. Codex being unreachable must never stop
   the work from shipping to review.

   *Why this changed:* the previous wording ("mandatory") had no escape
   hatch, and because the charter outranks the runtime prompt, it overrode
   the prompt's degrade path. Codex is in fact unreachable from the cloud
   environment — every photo-enrichment PR carries `needs-human-review` for
   exactly this reason. So the shift could research and author an item, hit
   this step, and abort with the work discarded. Combined with the ledger
   comment sitting at step 7 (after the PR), an abort here left NO trace
   anywhere: no branch, no PR, no comment. Three consecutive runs on
   2026-07-19 did precisely that against a non-empty queue.
6. PR labeled `content-shift`, `Closes #<n>`, TL;DR format. **Human merge**
   — founders or an in-session pass; the shift never merges.
7. Ledger comment on the source ticket (what shipped, what was dropped and
   why — e.g. an unverifiable claim cut per the no-fabrication rule).
8. **Never exit silently (amended 2026-07-19).** If a run ends WITHOUT
   opening a PR — empty queue, an aborted item, a tool or environment
   failure, anything — say so before exiting: comment on the ticket you were
   working, or on the newest open `intake` issue, or on the Nils walk log
   (#502) if there is no ticket. A run that fails quietly is
   indistinguishable from a quiet news day, which is how the Vault sat at
   2026-07-10 for nine days with a green fleet.

## Diagnosed failure history (2026-07-19/20) — read before debugging this again

**The shift has never opened a pull request.** Not once, across its whole
life. That was not obvious for days because the symptom looked like idleness.

What actually happened: it researched, authored, committed and PUSHED real
work — `content-shift/2026-07-15-pm` (Grammys AATW payoff, Swiftkirchen) and
`content-shift/2026-07-17-pm` (debut origin beats, folklore/evermore secrets
pools, 463 lines) — and then failed at PR creation and exited. Because the
ledger comment was step 7, *after* the PR, a failure at step 6 left no trace
anywhere: no PR, no comment, and branches nobody was looking at. Both branches
sat for days and were eventually superseded by other routines re-authoring the
same items, so the work was wasted twice over.

The one configuration difference between this routine and every routine that
does successfully open PRs (Photo Enrichment, The Answerer, Cross-Link, Mood
Chat) was that **this trigger had no MCP connections** — specifically it was
missing `Claude_Code_Remote`. Attached 2026-07-20.

Two lessons that outlive this bug:

1. **A pushed branch with no PR is a failed run, not a quiet one.** If you are
   debugging silence here, list `content-shift/*` branches on the remote FIRST
   and check whether each has a PR. Stranded branches are the tell.
2. Three separate hypotheses looked right and were not (WIP limit, prompt
   overload, the Codex gate). What settled it was noticing the routine had
   *never* succeeded, which reframed it from a regression to a config gap.
   Check "did this ever work?" before "what changed?"

## Throttles

≤2 items authored per run (quality over volume); per-run token budget;
never touches an item a human is visibly working.

**Removed 2026-07-19 (Wyatt): the "≥3 open `content-shift` PRs blocks new
runs" WIP limit.** It borrowed Austin's pattern, but it does not transfer:
Austin's PRs are all Austin's, whereas the `content-shift` LABEL is applied
by other routines too — the hourly photo-enrichment worker labels every one
of its PRs `content-shift`, and it is prolific enough to keep 3+ open around
the clock. So an unrelated bot could silently starve the authoring bot
indefinitely, and the failure is invisible: the run exits clean, writes no
ledger comment, and nothing reports that authoring was skipped. Throughput
is already bounded by ≤2 items/run and the twice-daily cadence; a WIP limit
on top of that only adds a way to stall. Merge-queue pressure is a founder
concern, not a reason for the writer to stop writing.

## Hard invariants

1. Seed/content files only — never app code, scripts, workflows, docs
   outside `docs/content-ops/` notes.
2. No fabrication, ever: every fact traces to a verified source or the
   detail is cut. Recency never lowers the bar.
3. Voice: Taylor in running prose; bare "Swift" only in formal contexts.
4. Never merges, never closes tickets directly, never weakens validation.
5. One checkout; comments/labels only on others' artifacts; latest human
   comment wins — always read ticket comments first.

## Cadence

Twice daily, 10:00 AM + 4:00 PM PT. Model: Fable.

## Audited by

Karen (every shift-authored item is scanned like all content), Codex
(per-PR), Nils (if shift output is thin, he files on it like anything
else), manager-hat telemetry (items shipped/run, rework rate).

## Migrating to a service

GitHub is the store; enforce queue order, caps, and invariants in code;
token scoped to contents+PR+issues.

## Amendments (2026-07-12, founder-approved)

1. **Claim-lease expiry:** same 24h rule as Austin's charter.
2. **Idle discipline:** an empty-queue exit must state which queues were
   checked; if all three priorities are empty AND launch gates DEPTH/WORTHY are
   not green, that is itself a finding — comment it on the walk log so Nils
   and Marjorie see the supply gap.
3. **Review rounds bounded at two**, then Marjorie's tiebreak.
