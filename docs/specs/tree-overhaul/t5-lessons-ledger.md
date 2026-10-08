# T5 — The lessons ledger

**Status:** spec, awaiting founder approval · **Epic:** #4117 (Tree Overhaul — Wave 1 design, Wave 3 build)
**Depends on:** S3 (the feedback ledger is its raw material), T2 (`critique.rulesChecked`), T4 (proposals are how a strategy change reaches you).

---

## Behavior you will see

`social/lessons.md`, readable in one sitting: the things you have told Tree, in your own words, and what Tree now does about each.

```
### L004 — Don't open two posts in a row with a question
Status: active · Times fired: 3 · Last: 2026-10-01

You said: "this is the third question opener in a row, it reads like a quiz account."
So I: never open with a question when the last post on that platform did.
```

You don't write it. It's distilled every Monday from your ✏️ and ❌ reasons and your thread replies. Three things follow:

- **Tree reads it every morning before drafting.** A rule you gave once is applied every day after, not forgotten by Friday.
- **When you've had to say the same thing three times, Tree stops trusting itself** and files a ticket to turn that rule into an automated check — so the mistake becomes impossible, not merely discouraged.
- **When a lesson means the strategy is wrong**, Monday's brief carries it as a numbered proposal. React ✅ and Tree opens the change as a PR for you to merge — it never edits the strategy itself.

Retired rules stay, marked retired — nothing is quietly deleted.

---

## Data

### `social/lessons.md`

Human-first Markdown with a fixed, parseable shape. One `###` block per rule, newest first, retired rules in a trailing `## Retired` section.

```markdown
### L004 — Don't open two posts in a row with a question

- **Status:** active
- **First seen:** 2026-09-17 (PR #4130)
- **Times fired:** 3
- **Last fired:** 2026-10-01 (PR #4188)
- **Evidence:** [#4130 ✏️](https://github.com/JW-Incorporated/swift2/pull/4130#issuecomment-1), [#4155 ❌](…), [#4188 ✏️](…)
- **Codify:** #4201

**You said:** "this is the third question opener in a row, it reads like a quiz account."

**So I:** check the previous post on the same platform before drafting, and never open with a question twice running.
```

| Field | Type | Rule |
|---|---|---|
| id | `L###` | sequential, never reused, never renumbered |
| title | one line | imperative, ≤ 80 chars — what Tree does, not what went wrong |
| `Status` | `active` \| `retired` | |
| `First seen` | `YYYY-MM-DD (PR #n)` | the first feedback row that produced it |
| `Times fired` | integer ≥ 1 | see below — this is the count that triggers codification |
| `Last fired` | `YYYY-MM-DD (PR #n)` | |
| `Evidence` | list of links | one per firing, each to the `reject:`/edit comment on that PR |
| `Codify` | `#n`, `—`, or `done (#n)` | the codification issue, once filed |
| `Superseded by` | optional, retired only | `check-drafts.mjs:checkOpeners` or `L012` |
| **You said** | quote | the founder's own words, verbatim, from the most recent firing |
| **So I** | one or two sentences | the operative rule, written so a drafter can act on it |

**"You said" is verbatim and is never paraphrased into agent-speak.** A rule the founder can recognise as their own sentence is a rule they can correct; a rule laundered into "avoid interrogative openers in consecutive posts" is one they will not argue with and will therefore not fix.

### What "times fired" counts

`Times fired` = the number of distinct founder ✏️/❌ events attributed to this rule. It counts **the founder having to say it again**, not the number of times Tree consulted the rule.

That is the count worth acting on. A rule Tree has read every morning and still broken three times is a rule that cannot be trusted to a prompt — which is exactly `CLAUDE.md` rule 8's "second occurrence or foreseeable recurrence → script it, don't re-run it by hand". T2's `critique.rulesChecked` records consultation separately and deliberately does **not** feed this number.

### Attribution rules (how a feedback row becomes a firing)

The Monday run reads the week's `social/feedback/*.jsonl` rows and every ingested thread reply, and for each `edit`/`reject`:

1. Read **every active rule first**, and prefer incrementing an existing one. Two rules that mean the same thing are worse than one rule stated imperfectly.
2. A row maps to **at most one** rule. A reason covering two distinct problems increments the closer match and is quoted under the new rule only if the second problem is genuinely unrepresented.
3. A row that matches nothing creates a new rule — **at most 3 new rules per week**. A bad week must not generate twelve rules nobody will ever read; the overflow is named in the brief as "3 more things I haven't turned into rules yet" and re-considered next week.
4. `approve` rows never create or fire a rule.

This is judgment, and it is done by the Opus weekly run rather than by a matcher. Stated plainly because it is the one place in this design where a wrong call is invisible: the Monday brief must therefore list every rule it created or incremented that week, so the founder sees the attribution and can say "that's not what I meant."

### Retirement

A rule is retired when either holds, and only in the Monday run:

- **Codified** — the `check-drafts.mjs` check landed. `Status: retired`, `Superseded by: check-drafts.mjs:<checkName>`. The rule is now enforced, so keeping it as a prompt instruction is duplicated truth.
- **Stale** — no firing in **8 consecutive weeks** *and* at least **10 briefs** went to the founder in that window. `Superseded by: —`, with a note: `no firings since <date>`. The brief-count condition matters: eight quiet weeks during a posting freeze is not evidence of anything.

Retired rules move to the `## Retired` section, keep their ids, and are not read by the daily drafter. A retired rule that fires again is **reactivated** rather than re-created, with its history intact.

---

## Mechanics

### The Monday distillation — `docs/agents/runner-prompts/tree-weekly-plan.md`

A new step, after the audit and before writing the calendar:

1. Read `social/lessons.md` in full (active rules).
2. Read `social/feedback/<this week>.jsonl` and last week's, plus the ingested thread replies on the previous plan PR.
3. For each `edit`/`reject` row, attribute it per the rules above: increment (bumping `Times fired`, `Last fired`, appending to `Evidence`, replacing **You said** with the newest quote) or create.
4. Apply retirement checks.
5. For any active rule now at `Times fired ≥ 3` with `Codify: —`, file the codification issue and write its number into the field.
6. For any lesson that implies the *strategy* is wrong rather than the drafting, write it as one of Monday's ≤3 proposals (T4). The proposal text states the exact change; **no diff to `docs/marketing/social-strategy.md` is staged in the plan PR** (see *The strategy diff* below for why).
7. List every rule created, incremented or retired in the brief's "what changed and why".

Tree writes `social/lessons.md` directly — it is added to Tree's mutation rights in `docs/agents/tree.md` alongside `social/calendar.md`.

### The strategy diff

Tree's invariant 2 stands: **Tree may propose a strategy change, never merge one.** The mechanism:

- The strategy diff lives in **its own PR**, never in the plan PR. The plan PR carries the calendar, which must land the same day so the daily drafter has slots to fill; a strategy diff inside it would either hold the calendar hostage until the founder decides, or — worse — be merged along with the calendar by a founder who never ✅-ed the proposal. The two decisions have different reviewers and different clocks, so they get different PRs.
- The ✅ on `proposal:N` in Discord is ingested by the poll as a comment on the plan PR (T4). **The next Tree run** (the Wednesday re-plan if the ✅ lands before the cut-off, else next Monday) reads that comment and opens `tree/strategy/<ISO-week>-<n>` with the diff to `docs/marketing/social-strategy.md` and a body quoting the proposal and the founder's reaction. Tree never opens the strategy PR before the ✅ — an open PR is a standing invitation to merge, and the proposal is the thing being decided.
- `auto-merge-content.yml` must **not** auto-merge that PR. **This already holds and needs no change**: the gate reads `.github/content-automerge-allowlist.txt`, which is a strict allow-list (a file must match an allow prefix and no `!` deny prefix), and no `docs/` prefix other than `docs/audits/` and `docs/ops/MERCH-REVENUE.json` is on it. The build adds a test asserting that `docs/marketing/social-strategy.md` matches no allow prefix, so a future widening of the allowlist cannot silently hand Tree the ability to merge its own strategy change.
- **The founder merges the strategy PR themselves.** Tree does not merge it and the poll does not merge it. The social-draft poll merges *draft* PRs only, never plan or strategy PRs — a strategy change is not a caption, and the one-tap mechanism built for captions should not silently acquire the power to rewrite the strategy it implements.
- A ❌ on the proposal: the poll comments the reason on the plan PR; no strategy PR is ever opened, so there is nothing to revert. Tree records the ❌ as a firing against the lesson that produced the proposal, and does not re-propose the same change without new evidence.

### The codification issue

Title `codify: L004 — don't open two posts in a row with a question`, labels `intake`, `social`. Body carries: the rule's **So I** text; all three evidence links; the suggested check name and where it belongs in `check-drafts.mjs`'s `checkDraft` orchestrator; and acceptance criteria written as "a draft that does X fails the checker." Filed once — the non-empty `Codify:` field is the guard.

When that issue's PR merges, the implementing change sets `Codify: done (#n)` and retires the rule, in the same PR. That is stated in the issue body as part of its definition of done, so the ledger cannot drift from the checker.

### The daily drafter — `docs/agents/runner-prompts/tree-daily-draft.md`

Before drafting, read `social/lessons.md` and take every `active` rule as binding. After drafting, list the ids actually checked in `critique.rulesChecked` (T2). A draft that violates an active rule is not queued — it goes through T2's one-rewrite path like any other failure.

`rulesChecked` must be non-empty whenever `social/lessons.md` has at least one active rule; `validateQueueItem` enforces exactly that (it cannot check whether the rules were *honestly* applied, and does not pretend to — it catches the failure mode of the step being skipped entirely).

### New — `scripts/social/lib/lessons.mjs`

`parseLessons(markdown)` → `{ active: Rule[], retired: Rule[] }`; `renderLessons(rules)` → markdown; `nextId(rules)`. Round-tripping is tested: `renderLessons(parseLessons(x)) === x` for a fixture with active and retired rules. Tree edits the file through these helpers in the Wave 3 build so the format cannot drift; the format stays hand-editable by a human regardless, because a founder correcting a rule directly is a feature.

---

## Acceptance criteria

1. `parseLessons` round-trips a fixture containing an active rule, a retired rule with `Superseded by`, and a rule with `Codify: done (#n)`, byte-for-byte.
2. `nextId` returns `L005` for a ledger whose highest id is `L004`, including when `L003` has been retired.
3. `validateQueueItem` rejects an item with empty `critique.rulesChecked` when the fixture ledger has ≥1 active rule, and accepts an empty array when it has none.
4. A simulated Monday run over a fixture week with 4 unmatched reject reasons creates exactly 3 rules and names the 4th in the brief text.
5. A rule reaching `Times fired: 3` with `Codify: —` produces exactly one `codify:` issue with the `intake` and `social` labels; a second run over the same ledger files no second issue.
6. A rule with no firing for 8 weeks **and** ≥10 briefs in the window is retired; one with 8 quiet weeks and 2 briefs is **not**.
7. A retired rule that fires again is reactivated with its `Evidence` history intact and its original id.
8. The allowlist test asserts `docs/marketing/social-strategy.md` matches no allow prefix in `.github/content-automerge-allowlist.txt`, so a plan PR touching it can never auto-merge.
9. A ✅ on a strategy proposal results in a separate `tree/strategy/*` PR on the next run, quoting the proposal, that the auto-merge gate declines; a ❌ opens no PR and records a firing. The plan PR's diff never touches `docs/marketing/social-strategy.md` in either case.
10. The daily draft run's PR body lists the active rule ids it read.

---

## Files affected

| Path | Change |
|---|---|
| `social/lessons.md` | **new** — created empty with its format documented in a leading comment |
| `scripts/social/lib/lessons.mjs` | **new** — `parseLessons`, `renderLessons`, `nextId` |
| `docs/agents/runner-prompts/tree-weekly-plan.md` | the distillation step, attribution rules, retirement, codification |
| `docs/agents/runner-prompts/tree-daily-draft.md` | read the ledger; populate `rulesChecked` |
| `scripts/social/lib/queue-schema.mjs` | `rulesChecked` non-empty when active rules exist |
| `docs/agents/tree.md` | `social/lessons.md` added to mutation rights; invariant 2 restated with the propose-never-merge mechanism |
| `tests/` (automerge) | assertion that `docs/marketing/social-strategy.md` matches no allow prefix |
| `scripts/social/social-approval-poll.mjs` | a plan PR is never auto-merged (explicit, tested) |
| `tests/` | round-trip, id allocation, retirement windows, codify-once |

---

## Open questions

None blocking. Decided here — all reversible:

- **Markdown, not JSON.** The founder is the primary reader. A JSON ledger would be read by nobody and corrected by nobody, and a rule the founder cannot argue with is a rule that stays wrong.
- **"You said" is verbatim.** Paraphrase is how feedback becomes unrecognisable to the person who gave it.
- **`Times fired` counts founder repetitions, not Tree's consultations** — it is a measure of what needs automating, not of diligence.
- **3 firings triggers codification**, matching `CLAUDE.md` rule 8's threshold rather than inventing a new one.
- **≤3 new rules per week.** A ledger nobody finishes reading enforces nothing.
- **Attribution is judgment, done by the Opus weekly run**, and every attribution is surfaced in the brief so a wrong one is visible and correctable.
- **Retirement needs 8 quiet weeks *and* 10 briefs**, so a posting freeze cannot quietly retire the rule set.
- **The founder merges the strategy PR themselves.** The one-tap Discord mechanism was built to approve captions; letting it also rewrite the strategy document would widen a narrow, carefully-reasoned gate by accident.
- **The strategy diff gets its own PR, opened only after the ✅.** Bundling it into the plan PR would hold the week's calendar hostage to a strategy decision, or let a merge of the calendar silently carry an unapproved strategy change. *(Corrected 2026-09-11, Wave 1 review — the spec previously staged the diff in the plan PR, contradicting its own Behavior section and T4's proposal shape.)*
