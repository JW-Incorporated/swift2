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
3. **Launch-gate content work** — J3.5 rubric gaps (G-A), era depth batches
   (J3.5b), dossier waves (#440 phases, G-C).
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
5. **Codex review, mandatory, no self-rebuttal** (same rule as Austin).
6. PR labeled `content-shift`, `Closes #<n>`, TL;DR format. **Human merge**
   — founders or an in-session pass; the shift never merges.
7. Ledger comment on the source ticket (what shipped, what was dropped and
   why — e.g. an unverifiable claim cut per the no-fabrication rule).

## Throttles

≤2 items authored per run (quality over volume); ≥3 open `content-shift`
PRs blocks new runs (WIP limit, Austin's pattern); per-run token budget;
never touches an item a human is visibly working.

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
   checked; if all three priorities are empty AND launch gates G-A/G-C are
   not green, that is itself a finding — comment it on the walk log so Nils
   and Marjorie see the supply gap.
3. **Review rounds bounded at two**, then Marjorie's tiebreak.
