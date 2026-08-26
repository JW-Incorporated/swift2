# Proposal: the Build desk's autonomous lane — Austin, the ticket builder

**Status: proposed (design-debate run 2026-07-11) — commissioned by Joey after
#470 exposed the gap. Activation gated on founder ticks (§8); nothing runs
until then.**

## 1. The gap, in plain language

The operating model solves coordination, not execution: Marjorie routes
decisions, Kevin triages Stream 3 and *explicitly must not auto-code it*
(`docs/kevin.md` — a sound unattended-loop concern), Karen only fixes her own
content findings, and the Build desk builds **when a human starts a session**.
Nobody's *job* is to pick up a queued, well-scoped eng ticket. Issue #470 — a
two-line rename plus an array reorder, filed, triaged tractable, fully
specified down to file and line numbers — sat unbuilt for hours because
picking it up was everyone's option and no one's cadence.

This proposal gives the Build desk an **autonomous lane**: a chartered agent
whose cadence is "take the next tractable ticket and build it properly." It
follows the model's own philosophy — narrow start, every safety rail a
human-driven change has tonight, autonomy earned class-by-class.

## 2. The agent

**Austin** — after Taylor's brother: the builder who does the work behind the
scenes and isn't the story. (Naming follows the Karen/Kevin/Marjorie
convention; Joey renames at will — the charter slug is what matters.)
Charter: `docs/agents/austin.md` (in this PR). Runner: scheduled session in
its own worktree, model pinned per charter, same pattern as Marjorie.

## 3. Scope v1 — deliberately narrow

A ticket is **in scope** only if ALL of these hold:

1. **Kevin triaged it tractable.** It sits in Kevin's Eng-Triage buckets
   `bug (small/pre-diagnosed)` or `ready/greenlit` — never `feature`,
   `major/overhaul`, `tooling/Karen`, or `content-ops/policy`. Kevin's
   human-judgment triage is the intake filter; Austin never self-selects
   from the raw backlog.
2. **It passes the reversibility test** (decisions.md 2026-07-11, #482):
   reversible within a reasonable window — a revert PR fully undoes it —
   **and** outside the non-ratchetable set (product direction/scope, brand
   voice/public posting, legal, pricing, spending, merge/deploy authority,
   charter changes).
3. **It passes the Definition of Ready:** concrete expected behavior stated
   (or trivially inferable), files identifiable from the ticket, no
   unresolved question to a founder in the comments (latest human comment
   wins — Kevin's invariant 7, inherited verbatim).
4. **It stays inside the change-type allowlist — semantic, not just paths**
   (tightened in Codex round 1; the first draft's "source, tests, docs" was
   bypassable):
   - **Allowed:** UI/domain source under `apps/web/**` (excluding
     `apps/web/app/api/**` — server routes carry auth/data risk),
     `packages/**` pure logic, colocated tests, and plain docs.
   - **Excluded regardless of triage:** DB migrations/schema,
     `package.json`/lockfiles (dependencies), `.github/**`, auth/secrets/
     env, API routes, and the **governance class of docs** — CLAUDE.md,
     `docs/agents/**`, `docs/decisions.md`, `docs/architecture.md`,
     `docs/specs/**`, `docs/proposals/**` (docs that *are* rules aren't
     "docs").
   - **Tests may be added or strengthened, never weakened:** a diff that
     deletes or loosens an existing assertion is out of scope, and Austin's
     Codex review pass is explicitly instructed to check for it.
   - **Diff bounds (machine-checkable):** ≤5 files, ≤150 changed lines. A
     ticket that needs more is by definition not this lane's class — stop,
     unclaim, tag for humans.
5. **The ticket's author is a founder or a chartered desk.** Tickets
   originating from outside (user feedback, future public intake) never
   route here — they go through Kevin's human-gated Stream 2. This plus
   human merge (below) is the confused-deputy defense: **Kevin's triage is
   intake, not authorization — the founder's merge click is the
   authorization** in v1, and unattended shipping only ever arrives later,
   per class, through the §5.4 gate.

**#470 is the canonical example:** rename two thread titles, reorder an
array, verify the fact-check flag in the ticket (Blank Space vs "Blank
Spaces" — Austin asks on the ticket rather than guessing, exactly because a
comment already flagged it as a real content-accuracy question for Joey).

## 4. The pipeline — same rails as a human-driven change

For each claimed ticket, in a dedicated worktree:

1. **Claim atomically, not just visibly** (Codex round 1: a comment is not a
   lock): (a) skip any ticket with an assignee, an open linked PR, or an
   existing claim comment; (b) **self-assign the issue** (the closest thing
   GitHub has to compare-and-set) + post the claim comment naming the
   branch; (c) **revalidate after 60s** — re-read the ticket; if another
   actor's assignment/claim predates ours, back off and unclaim. Only one
   Austin runner exists (single scheduled session; the runner refuses to
   start if its own lock marker shows a live run), so Austin-vs-Austin
   races are structural, not probabilistic. Read every comment first; the
   most recent human comment overrides the body.
2. **Branch** `austin/issue-<n>` from up-to-date `origin/main`. Never main,
   never someone else's branch, never a branch with an open PR.
3. **Implement against mechanics, not vibes** ("exactly what the ticket
   says" isn't enforceable on its own — Codex round 1): the PR body must
   echo the ticket's expected behavior as a checklist; the diff must stay
   inside §3.4's file allowlist and size bounds; and these **stop triggers**
   abort the attempt into a comment + unclaim: a needed file outside the
   allowlist, a needed dependency, any ambiguity a founder should resolve,
   or any judgment call beyond the ticket text.
4. **Test:** run the full suite + typecheck + lint. **Bug fixes add a
   regression test** (or the PR states concretely why the change isn't
   testable — a gap-analysis adoption, §7 of the review doc).
5. **Codex review, mandatory — and Austin may not self-rebut.** Every
   finding is either fixed, or the PR is labeled `needs-human-review` with
   the disagreement stated plainly (rule 5: disagreements surface, never
   settle). An autonomous builder accepting its own rebuttals is no review
   at all (Codex round 1). Codex's prompt for these reviews includes:
   verify the diff matches the ticket (no scope creep), and verify no
   existing test got weakened.
6. **PR** with the standard TL;DR-for-reviewers format + `Closes #<n>`,
   labeled `austin-built`.
7. **Merge is not Austin's.** v1: every Austin PR is human-merged. Later:
   qualifying classes can ride the §5.4 deterministic merge gate **only**
   via an explicit founder grant per class — never Austin merging, same as
   never-Marjorie, never-Kevin.

**Thrash guards, defined mechanically (Codex round 1):**
- An **attempt** = one implementation cycle ending in either a pushed branch
  submitted to Codex review or a full-suite failure after implementation.
  Each attempt is ledgered as a ticket comment ("attempt 1: <outcome>") so
  the count survives session restarts. **Max 2 attempts**, then unclaim +
  tag for human pickup with what was tried.
- A per-ticket **token budget** (charter) caps burn *inside* an attempt —
  hitting it ends the attempt.
- Never re-claim a ticket a human has touched since Austin's unclaim.
- **WIP limit, not just a start cap** (Codex round 1: a daily cap alone lets
  unmerged PRs pile up): **≥3 open `austin-built` PRs blocks all new
  claims**, and the daily start cap is 2. Queue depth, open-PR count, and
  oldest-PR age all report in the brief's Health section — if founders
  aren't merging, Austin stops producing, visibly, instead of flooding.

## 5. Cadence

Deterministic poll (zero LLM): after each Kevin Eng-Triage lands, and hourly
otherwise, a script checks for in-scope, unclaimed tickets; the Austin
session wakes only when the queue is non-empty. Queue depth + oldest-item
age go into the Founders' Brief Health section (backlog aging is a gap the
review doc formalizes).

## 6. Earned autonomy — the ladder, stated up front

- **Rung 0 (this proposal):** tractable bugs/greenlit small changes,
  human-merged, cap 2/day.
- **Rung 1 (after ~2 weeks + manager-hat metrics):** founders may raise the
  cap and/or grant §5.4 merge-gate coverage for a *class* of Austin PRs
  (e.g. docs-only, or test-only) — each grant a decision entry.
- **Rung 2 (later, explicit proposal required):** small `feature`-bucket
  tickets with written acceptance criteria. Not granted here; listed so the
  direction is visible.

Manager-hat telemetry makes the track record legible: Codex findings per
Austin PR, rework/revert rate, cycle time, human-edit-after-merge rate. If
Austin's numbers are worse than session-driven changes, founders see it in
the brief and the lane pauses (Marjorie flags; founders decide).

## 7. What this changes in existing charters

- **`docs/kevin.md` Stream 3** currently ends: "a human / in-session Claude
  picks what to build." Updated (this PR): the **tractable subset** flows to
  Austin on a defined cadence; everything else stays human/session-driven.
  Kevin's own invariants are untouched — he still never codes.
- **Org chart:** Austin joins the Build desk as its standing lane; the
  session-driven path (humans saying "start working") is unchanged and
  always takes precedence — Austin never claims a ticket a session is
  visibly working (assignee set, open PR, or claim comment).

## 8. Founder decisions (banked; activation waits on these)

1. **Activate the lane?** (This whole proposal — recommended yes, **after**
   the two preconditions below.)
2. **Name:** Austin stands unless renamed.
3. **Daily cap / WIP limit:** 2 starts/day, 3 open PRs, recommended.

**Activation preconditions (from the gap analysis, Codex-round-hardened):**
- **G3 branch protection ON** (require PR + green build to touch `main`) —
  the never-merge invariants become mechanical before an autonomous coder
  exists, not after. 3-minute founder settings change.
- **G10 kill switch documented** — the one-paragraph "pause the org"
  procedure lands in `docs/agents/README.md` before any agent that writes
  code runs unattended.

## 9. Decision-log entry (in this PR, marked pending the §8 ticks)

Included in `docs/decisions.md`; records scope v1, the rails, the ladder,
and that activation is gated on the brief ticks — consistent with "entry
BEFORE implementation."

---

## Verdict

**Build the autonomous lane as specced: Austin, rung 0.** Kevin's triage as
the only intake, reversibility + the change-type allowlist as the scope
fence, every rail a human-driven change has (branch → tests + regression
test → Codex review → human merge), two-attempt thrash guard, 2/day cap, and
a pre-stated ladder so autonomy expands by founder-granted class instead of
scope creep. It wins because it fixes the real gap (#470-class tickets
having no owner) while adding zero new merge/deploy authority and reusing
every mechanism the model already has — triage, reversibility, the merge
gate, manager-hat telemetry, the brief.

**Assumptions:** Kevin's triage keeps running (Austin is blind without it);
founders actually merge Austin PRs (else the queue just moves to PR-limbo —
the brief's carry-over makes that visible).

---

## Appendix A — design-debate record

**Codex round 1 (2026-07-11) — 8 proposal findings, all accepted:** missing
referenced artifacts → charter/kevin-update/decision entry actually written
into this PR; path-based allowlist bypassable → semantic allowlist +
API-route/governance-doc exclusions + no-test-weakening rule + diff bounds
(§3.4); Kevin-triage-as-authorization (confused deputy) → author allowlist +
"triage is intake, merge is authorization" (§3.5); claim-comment race →
assign-based claim + 60s revalidation + single-runner lock (§4.1);
"implement exactly" unenforceable → checklist echo + stop triggers + scoped
Codex review prompt (§4.3); attempt undefined → mechanical definition +
ticket-comment ledger (§4); self-rebuttal → banned, needs-human-review path
(§4.5); start cap ≠ WIP limit → 3-open-PR claim blocker + brief visibility
(§4). Gap-analysis findings from the same round are recorded in that doc's
appendix.
