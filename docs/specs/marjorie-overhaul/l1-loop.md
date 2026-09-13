# L1 — the Tree/Marjorie loop

Wave M4 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`,
epic #4180). The only item without an M0 spec. It was written and built in
the same session, because the mechanics are small and the judgment lives in
the two prompts.

## Behavior you will see

**In Tree's Monday brief (`#longlive-tree`)**, the header message gets two
short blocks above the "Proposals below are ✅/❌" line:

```
**Needs from Marjorie**
- [#4301](<…>) — The daily-draft run has failed 3 mornings running; get it green before Thursday's launch arc.

**From Marjorie**
- [#4290](<…>) — The /shop links in Friday's queued pair 404 since #4288 · closed
```

**In Marjorie's daily brief (`#longlive-marjorie`)**, the **Tree** section
grows from two lines to four:

```
**Tree**
- Lessons: "…" (3rd firing — codify)
- Scorecard: 15 posts this week …
- From Tree: [#4301](<…>) The daily-draft run has failed 3 mornings running… · 0d
- For Tree: The /shop links in Friday's queued pair 404 since #4288 → [#4290](<…>)
```

Both bots' asks turn into numbered GitHub issues within minutes of their
brief. Tree's are filed before its brief posts, and Marjorie's before hers is
delivered, so the number is already in the brief you read. Each bot answers
the other's asks on its next run: it does the work if its charter allows,
comments on the issue saying what it did, and closes it. If it can't, it
comments why and leaves the issue open, and the issue keeps showing in both
briefs as it ages.

**You only step in when two asks contradict.** A bot that files an ask which
would undo one of the other bot's open asks marks it, and the brief line then
ends `⚠️ contradicts #N — your call`. That one line is the whole escalation
path. There is no new post, no new channel, and nothing posted to
`#longlive-tree` by Marjorie.

## Data

| Source | Written by | Read by |
|---|---|---|
| `social/calendar.brief.json` → new `needsFromMarjorie: [{ask, why, contradicts?}]` (≤2) | Tree's weekly agent, on its plan PR branch | `send-brief` job, as data via the Contents API (unchanged fetch) |
| The brief issue body's `- For Tree:` line | Assembler prints `- For Tree: —`, and Marjorie's agent replaces the `—` (at most one ask) | `deliver` job |
| Issues labelled `tree-filed` + `desk:ops` | `send-brief` `run:` step | Marjorie's assembler (open ones) and Marjorie's agent |
| Issues labelled `marjorie-filed` + `desk:tree` | `deliver` `run:` step | `send-brief` (open, plus closed within 7 days) and Tree's agent |
| `<!-- loop-ask: <key>[ contradicts=N] -->` in each filed issue body | the filing step | the filing step (idempotency) and both renderers |

`tree-filed` is new in `bootstrap-labels.mjs`. `marjorie-filed`, `desk:ops`
and `desk:tree` already exist. A loop ask carries exactly one `desk:*`
label, so `check-work-ownership.mjs` counts it as routed. `marjorie-filed`
asks also count toward the brief's existing `dispatched: N open` line, and
that is intended: an ask Marjorie forgot to follow up on shows up there as
it ages.

`social/lessons.md` stays read-only to Marjorie. Nothing in L1 writes to it.

## Mechanics

**No agent files an issue and no agent judges a marker.** The agent's only
job is to write the ask into its fixed slot. From there,
`scripts/marjorie/loop-asks.mjs` (CLI) and `lib/loop-asks.mjs` (pure, tested)
parse the slot, look for an earlier filing, file one if none exists, and
render the brief lines. Both run as `run:` steps on `secrets.GITHUB_TOKEN`,
which needs only `issues: write` and no App token (#4223).

**Tree → Marjorie** (`routine-tree-weekly-plan.yml`, `send-brief`, mode≠replan):
after the existing hand-off fetch, run `loop-asks.mjs file-tree --plan
/tmp/calendar.brief.json --pr <N> --pr-url <url> --out /tmp/loop.json`, then
`weekly-brief.mjs … --loop /tmp/loop.json`, which puts `loop.json`'s `lines`
into the header message. The job gains `issues: write`. A replan run files
nothing, because its hand-off carries only `replanSummary`.

**Marjorie → Tree** (`routine-marjorie-brief.yml`, `deliver`): after fetching
the brief body and before `post-or-mail.mjs`, run `loop-asks.mjs
file-marjorie --issue <N> --issue-url <url> --body-file /tmp/brief-body.md
--out /tmp/brief-body.md`. If the line holds an ask, the step files it,
rewrites the line to `… → [#M](<url>)`, and writes the corrected body back
to the brief issue. Discord and the durable copy then carry the same
number. That edit is made by the deterministic job, not the agent. The
charter's "never edit the brief body after posting" still binds Marjorie.

**Parsing is fixed-format.** On Tree's side the input is a JSON array: entries
with no `ask` are skipped, and anything past two is not filed (the brief
says so). On Marjorie's side it is the first `- For Tree:` line *inside the
`**Tree**` section*; a quoted line elsewhere is ignored. `—`, `-`, `none` or
`nothing` mean no ask, and a trailing `(contradicts #N)` sets `contradicts`.
Only the exact generated suffix ` → [#N](<…/issues/N>)` counts as filed, so
ask text containing an arrow still files. Asks are capped at 300 characters.
`@login` gets a zero-width space after its `@` and `<!--` becomes `&lt;!--`, so an ask can
neither ping anyone nor forge a marker.

**Idempotency and the identity trap.** Each filing gets a key:
`<side>-<source#>-<sha1(ask, lowercased)[0:8]>`. The source is the plan PR
number or the brief issue number. Before filing, the step lists the most
recent 200 issues carrying both its `*-filed` and its `desk:*` label
(REST issues list with full bodies — not `gh issue list`, whose search index missed a 1 s-old filing live, #4253). It then matches
the key in the body's last marker, which always comes after all content. **Trust uses the author's login, not
`viewerDidAuthor`.** Both filers are `run:` steps on the workflow token, so
the author is always the same absolute login, `app/github-actions` (from
`gh --json`) or `github-actions[bot]` (from REST), whichever credential
reads it. `viewerDidAuthor` is relative to the reader and broke M2/M3
(#4225, #4238). Unlike M3's `pending`/`posted` pair, L1 needs no asymmetric
trust, because writer and reader are the same credential type on both
sides. An issue a human wrote with a copied marker never suppresses a
filing. Re-dispatching either job refiles nothing, and a changed ask text
files a new issue.

**Filing never blocks a brief.** Every GitHub failure is logged as a
`::warning::` and the CLI still exits 0. Tree's brief then shows `N asks
couldn't be filed — see the send-brief log`. Marjorie's line keeps the
unfiled ask text, so the next day's re-read still sees it. Each `gh` call is
capped at 30 s, the step runs under `timeout 120`, and `deliver` has a
concurrency group so two deliveries of one brief cannot both file. Output files are replaced atomically, and CRLF bodies parse.

**Receiving side, prompt-level (judgment).** Tree's weekly run gets a new step
0.7: read each open `marjorie-filed` + `desk:tree` issue with its comments
(`gh issue view N --json comments`, one issue at a time, #4230). An ask
marked `⚠️ Contradicts #N` is held untouched until a founder comments on
either issue. Otherwise Tree acts inside its hard limits (usually a calendar
change) and closes the ask only once its plan PR is open, citing that PR. If
it can't act, it comments why and leaves the ask open. Marjorie's brief run gets the same step for `tree-filed` + `desk:ops`,
inside her charter: file a human action, route a desk, or fix via PR. Both
charters' mutation rights gain exactly that comment-and-close right on asks
addressed to them. The filer never needs to close its own ask. One ask per
pass is the norm: Tree may file up to two a week and Marjorie one a day.
Answering an ask costs about three tool calls, so neither turn budget moves.

**What each bot may ask.** Tree asks Marjorie for ops work: a failing
workflow, a human action that needs filing, a desk ticket for a bug that
blocks a post. Tree never asks her for a strategy change (that is a
proposal) or a founder task (that is `founder-task`). Marjorie asks Tree for
calendar or drafting changes that follow from the site: a shipped feature
that needs an arc, a broken link in a queued post, a paused content lane.
Neither bot asks for anything only a founder can decide.

## Acceptance criteria

1. `bootstrap-labels.mjs` registers `tree-filed`, and the bootstrap has run
   for real (`gh label list --search tree-filed` shows it) before any
   routine files under it.
2. `lib/loop-asks.test.ts` covers all of the following: tree parsing (the
   cap, invalid entries, `contradicts`); For Tree parsing (placeholder,
   `none`, an ask, arrow text, a quoted line outside the Tree section, a
   contradicts suffix, already-filed, a missing line); a forged marker; a
   `gh` timeout; key
   stability; author trust (a human-authored copied marker is ignored, and
   both bot login forms are accepted); issue rendering (labels, marker,
   Tier-2 trailer, `@` neutralised); `fileAsk` finding an existing issue
   versus creating one; line rewrite being idempotent; the incoming
   selection (desk filter, marker required, 7-day closed window); and both
   renderers.
3. `weekly-brief.test.ts` confirms that loop lines land in the header above
   the proposals line and pass through ref-line escaping. The
   assemble-brief tests confirm the Tree section's four lines survive
   `capSection`.
4. The assembler stays at 40 lines or fewer by construction with every
   section maxed. Tree goes 2→4, Today 4→3 and Site 2→1 (both pure slack),
   and the six headings lose their trailing blank line, matching
   `c2-brief.md`'s exact template: 28 + 6 headings + 5 separators = 39.
5. Both prompt edits keep the "Run discipline" block and the Tier-2 trailer
   byte-identical. The Tree prompt edit gets a Codex review.
6. Live proof, cited on #4180: a real `tree-filed` issue and a real
   `marjorie-filed` + `desk:tree` issue, both filed by the workflow token
   through the shipped code paths; a second pass that files nothing; a
   Marjorie brief issue whose Tree section carries the `tree-filed` number;
   and a Tree Monday brief carrying the `marjorie-filed` number (first real
   run 2026-09-14, checked by MR2 if not seen this session).

## Files affected

| File | Change |
|---|---|
| `scripts/marjorie/lib/loop-asks.mjs` (+ `.test.ts`) | new: parser, key/marker, trust, issue render, `fileAsk`, incoming select, both renderers |
| `scripts/marjorie/loop-asks.mjs` | new: CLI `file-tree` / `file-marjorie`, soft-fail |
| `scripts/marjorie/bootstrap-labels.mjs` | `tree-filed` |
| `scripts/marjorie/lib/brief-state.mjs`, `lib/brief-sections.mjs` | From Tree + For Tree lines, budgets |
| `scripts/social/weekly-brief.mjs` (+ test) | `--loop` → header lines |
| `.github/workflows/routine-tree-weekly-plan.yml` | `send-brief`: `issues: write`, file step, `--loop` |
| `.github/workflows/routine-marjorie-brief.yml` | `deliver`: file step before post |
| `.github/workflows/marjorie-discord-smoketest.yml` | `mode: loop`, both filings twice with synthetic asks and no Discord post (the live proof) |
| `docs/agents/runner-prompts/tree-weekly-plan.md`, `marjorie-brief.md` | step 0.7 / receive step; `needsFromMarjorie`; For Tree slot |
| `docs/agents/tree.md`, `docs/agents/marjorie.md` | mutation rights: comment-and-close asks addressed to them |
| `MAP.md` | rows |

## Open questions

- **Tree runs weekly and Marjorie daily**, so an ask to Tree can wait up to
  6 days. A same-day social problem is a founder ❌ in `#longlive-tree`, not
  a loop ask. Revisit at MR2 if an ask outlived its usefulness.
- **The 200-issue lookup window** (filed label and desk label together) excludes M3's
  build-desk filings. At today's volume (<10 a week) a same-day re-dispatch
  always falls inside it. The structural cap is the same class as #4239.
