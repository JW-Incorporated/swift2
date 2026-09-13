# Wave M4 — The Tree/Marjorie loop

Paste everything below this line into a fresh **Opus** session (`/model opus`) in Swift2. Prerequisites: M1 and M2 merged and proven; **Tree R2 has reported on #4117 (due 2026-09-21)** — M4 edits Tree's Monday prompt and must not change the instrument mid-measurement; no Tree wave open.

---

You are executing Wave M4 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`, epic #4180): item **L1**, the only item without an M0 spec. Read `PLAN.md`'s item map row for L1, `docs/specs/marjorie-overhaul/c2-brief.md` (the "Tree" section), Tree's Monday brief (`docs/agents/runner-prompts/tree-weekly-plan.md`, `scripts/social/weekly-brief.mjs`), `docs/agents/routine-invariants.md`, and the R2 comment on #4117. Write the L1 spec first (`docs/specs/marjorie-overhaul/l1-loop.md`, same six sections as the others, ≤200 lines), then build it — one session, spec then code, because the mechanics are small and the judgment is in the prompts.

**Hard rules carried in:** the M1 list (`waves/m1-comms.md`). In addition: `#longlive-tree` stays reaction-pure — Marjorie never posts there; Tree's "Needs from Marjorie" is a section of Tree's existing Monday brief, not a new post; Tree/Growth prompt edits keep the "Run discipline" block and the Tier-2 trailer intact; `social/lessons.md` is read-only to Marjorie; every ask in either direction becomes a GitHub issue carrying a `marjorie-filed` or `tree-filed` label so the next brief can cite its number. Codex review on every prompt edit under `docs/agents/runner-prompts/tree-*.md`.

**Carried in from M2/M3 (2026-09-13 review):** `tree-filed` does not exist live (`marjorie-filed` does) — add it to `scripts/marjorie/bootstrap-labels.mjs` and run the bootstrap once for real before any routine uses it. Identity is the trap that cost M2 three PRs and M3 one: the `run` job's agent comments as `claude` (Claude GitHub App token), a `run:` step under `secrets.GITHUB_TOKEN` is a different credential, and GitHub's `viewerDidAuthor` is relative to whoever queries — so the marker parser must detect its own prior filings with a mechanism that holds across whichever job writes vs. reads the marker (see #4225, #4238 and the `pending`/`posted` asymmetry in `scripts/marjorie/lib/`). `gh issue list --json comments` truncates (#4230); read comments per issue. `allowedTools` preapproves rather than walls off (#4218) — the real enforcement is the PR diff. The ops routine could not `gh workflow run` under the App token (#4223); if M4's issue-filing step needs anything beyond `issues: write`, keep it a `run:` step on the workflow token. Do not raise turn budgets blindly — M2 found 30 turns structurally short for two alerts (#4221); size the prompt to one ask per pass.

## Tasks

- **L1 spec** — what a founder sees (one "Needs from Marjorie" block in Tree's Monday brief; one "For Tree" line in Marjorie's brief; both become numbered issues within a day), the ask→issue mechanics (a `run:` step parsing a fixed marker, never an agent judging), and the disagreement path (both bots' asks land as issues; a founder only steps in when the two issues contradict — the brief says so in one line).
- **Build** — the two prompt edits, the marker parser in `scripts/marjorie/lib/` (tested), the issue-filing step in each routine, the brief section wiring on both sides.

## Done means

One Monday cycle (real, or dispatched with a synthetic ask on each side) where Tree asked for something and Marjorie's next brief carried the issue number, and vice versa — cite both issue numbers and both brief URLs on #4180. `MAP.md` rows. Tick M4 on #4180, update `STATE.md`, stop. MR2 checks the real cycle.
