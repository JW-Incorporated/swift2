# S1 — submission triage

Wave M3 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`,
epic #4180). Design only; M3 builds it. Depends on M1 merged. Independent of
M2 — either order, never the same checkout.

## Behavior you will see

When someone uses the feedback box on the site, or the "Help us verify"
button, or submits a link, it files a GitHub issue. Today those issues sit
there. Four have been open and untouched since 2026-09-02 (#3677, #3678,
#3679, #3681) — three of them are penetration-test junk somebody typed into
the box, and one is a real message.

After M3, each new submission is read within a few hours and sorted into one
of five outcomes:

- **A bug** we can act on → an issue for the build desk with acceptance
  criteria and the reporter's own words quoted.
- **A content correction** → the same, aimed at the content desk.
- **A feature request** → an issue on the roadmap pile with Marjorie's
  one-paragraph read on whether it's worth doing.
- **Spam or a test string** → closed, labelled `spam`, visible forever in a
  search. Never silently deleted.
- **Needs you** → a question in `#longlive-marjorie` with her recommendation.
  If you don't answer, she asks again once after seven days, then stops.

You can overrule any of it with one reply. Marjorie never edits product code
or content — she reads, sorts, and writes tickets.

## Data

### Scope — by title prefix, not by label

Each of the three site routes stamps an unambiguous title prefix. **This, not
the label, is the selector**, and getting it wrong matters:

| Route | Title | Labels applied | Fields |
|---|---|---|---|
| `apps/web/app/api/feedback/route.ts:213` | `[Feedback] …` | `user-feedback`, `feedback` | free-text `message` (≤5000), `location` (era/mode/view/url/viewport/UA/ts) |
| `apps/web/app/api/intake/route.ts:137` | `[Intake] …` | `intake` | fixed: `headline`, `summary`, `itemId`, `eraId`, `status`, `sources[]` — no free text |
| `apps/web/lib/longlive/submit-link.ts:251` | `[Link submission] <section>: <domain>` | `link-submission` | `url`, `domain`, `platformGuess`, `section`, `clientHash`, `sourcePage` |

**The `intake` label is overloaded and must not be swept.** It has three live
producers: the "Help us verify" route above, the content desk's real-world
event drops (`.github/ISSUE_TEMPLATE/intake.yml`, e.g. #3907), and — in
practice — general engineering chores filed by agents and founders (#4119,
#4134, #4136). A routine selecting `--label intake` would pull the content
desk's authoring queue and a pile of agent chores into user-submission triage.
Selecting `[Intake] ` in the title takes exactly the reader reports.

Selector: open issues whose title **starts with** one of the three prefixes
and which do not carry `marjorie-triaged`.

**Filter in code, not in the search query.** GitHub's issue search strips
punctuation, so `"[Feedback]" in:title` also matches any title merely
containing the word "feedback" — the same fuzzy-search trap
`upsert-alert.sh:33-38` already documents and works around with a second
exact-match pass. `submissions.mjs` does the same: fetch with
`gh issue list --state open --limit 200 --json number,title,labels`, then
`startsWith` in JS. A search-only selector would sweep unrelated issues into
triage, and the failure would be silent.

`link-submission` does not exist in the live label list — GitHub auto-creates
it on first use, so nothing is broken, but nothing provisioned it either. Add
it to `scripts/marjorie/bootstrap-labels.mjs` so it has a colour and a
description like every other label the desks own.

### Labels

Four new, everything else already live:

| Label | New? | Meaning | Applied by |
|---|---|---|---|
| `spam` | **new** | A submission that is abuse, a test string, or empty. Closed, kept searchable | Marjorie |
| `marjorie-triaged` | **new** | Bookkeeping: this submission has been classified. Never apply or remove by hand | Marjorie, machine-only |
| `marjorie-filed` | **new** | Bookkeeping: Marjorie opened this issue by dispatching work. Machine-only — it is how "accountable for the outcome" is counted | Marjorie |
| `link-submission` | **provision** | Already used by `submit-link.ts`; give it a colour and description | bootstrap |
| `bug`, `enhancement`, `content`, `needs-triage`, `user-feedback`, `feedback`, `intake`, `duplicate` | live | unchanged | various |
| `founder-decision` | **not live** (verified 2026-09-12) | created by `bootstrap-labels.mjs` in M3 | needs-founder |

**Do not use the `desk:*` taxonomy.** `bootstrap-labels.mjs:21-32` defines
`desk:build`, `desk:ops`, `desk:content` and seven more, and **none of them
exist in the live repo** (`gh label list` at `93b93360`). Either the script
was never run here or the scheme was retired. Building routing on a label that
does not exist would silently drop every dispatched ticket.

## Mechanics

### `routine-marjorie-triage.yml` (new)

```yaml
with:
  routine_name: "Marjorie — submission triage"
  prompt_file: docs/agents/runner-prompts/marjorie-triage.md
  model: claude-sonnet-5
  allowed_tools: "Bash,Read,Grep,Glob"
  timeout_minutes: 25
  max_turns: 40
on:
  schedule:
    - cron: "27 16 * * *"   # 09:27 PT, after the morning brief has already reported yesterday's
  workflow_dispatch:
```

No `Write`, no `Edit` — same reasoning as W1, and the same honest caveat:
that is a narrowing, not a guarantee, since `Bash` can write any file.
Everything she produces is a `gh issue create`, a `gh issue comment`, a label,
or a Discord post. The enforcement that she edits no product code or content
is acceptance criterion 10, checked on the diff.

A daily cron rather than per-submission: volume is low (six user-feedback
issues total in the repo's history), and a batch pass lets her spot duplicates
across a day's submissions.

### Classification

Five classes. She assigns exactly one and **must** record it in a comment
naming the class and the evidence — not optional, and not merged into
another comment. This is the only audit trail for a judgment made on
anonymous input, and it is also the mitigation for the obvious risk here: a
routine with `gh` write access reading arbitrary free text from the public
internet. A submission that tries to instruct her is data, and the comment
is where a human can see she treated it that way.

| Class | Test | Action |
|---|---|---|
| **spam** | abuse, an obvious injection/test string (`<script>`, `{{7*7}}`, repeated-character strings), or empty after defanging | comment naming the class, add `spam` + `marjorie-triaged`, **close**. Never delete, never close without the comment |
| **bug** | describes behavior that is wrong, **and** carries enough to act: a surface, a reproduction or a clear expectation. `location` from `/api/feedback` usually supplies the surface | build-desk issue (below); comment on the original linking it; `marjorie-triaged`; leave the original **open** until the fix merges |
| **content correction** | asserts a fact on the site is wrong | same, aimed at content; **must** cite what the site currently says and what the submitter says it should be. She does not judge which is right |
| **request** | asks for something that does not exist | issue labelled `enhancement`, with her one-paragraph UX recommendation; `marjorie-triaged` |
| **needs-founder** | product-direction, legal/safety, money, or a bug whose fix is a product decision | in-channel question with a recommendation; `founder-decision` on the original; `marjorie-triaged` |

A submission that looks like a bug but lacks evidence is **not** downgraded to
spam. It gets one comment asking the reporter for the missing detail (they may
never see it — these are anonymous), stays open, and is counted in the brief
as "1 unactionable". Being unable to act is not the same as the report being
worthless, and closing it would hide a real signal.

### Staying accountable for what she dispatched

"Accountable for the outcome, not the ticket" needs a mechanism or it is a
slogan. Every issue Marjorie opens — build-desk, content, roadmap — carries
`marjorie-filed`. Two consequences:

- The brief's *Since yesterday* carries one line whenever any are open:
  `dispatched: N open, oldest Xd (#…)` (`c2-brief.md`). A ticket she filed
  and forgot ages in public, every morning.
- When a `marjorie-filed` issue closes as completed, the next triage run
  closes the original submission with a comment naming the fix. That is the
  one case besides spam where she closes a submission, and it is not her
  judgment — it is a merged fix.

Without this, S1 files tickets and forgets them, and W1 does the same with
build-desk issues; nothing would ever notice a dispatch that went nowhere.

### The build-desk issue

There is no `desk:build` route. The live path is **Kevin's Eng-Triage → Austin**
(`docs/agents/austin.md:14-21`: Austin takes tickets "Kevin's triage has
already judged tractable", from the `bug (small/pre-diagnosed)` or
`ready/greenlit` buckets). So a dispatched issue must be good enough that
Kevin greenlights it. Required shape:

```markdown
**From a site submission** — #<original>, filed <date> by an anonymous visitor.

**What they said**, verbatim:
> <the reporter's own words, defanged, unedited>

**Where:** era `<era>`, view `<view>`, `<url>`, viewport `<w>×<h>`
**Expected:** <one sentence>
**Actual:** <one sentence>

**Acceptance criteria**
1. <testable>
2. <testable>
3. A test covers it.

_Triaged by Marjorie. She did not diagnose the cause or propose a fix._
```

Labels `bug` + the relevant `exp:P1|P2|P3`. The reporter's words are quoted
**verbatim and never paraphrased** — a paraphrase is Marjorie's interpretation
presented as a user's report, and the whole point of the quote is that it
isn't.

A direct Marjorie→Austin lane, like the one Laura has for `a11y:P2|P3`
(`austin.md:27-32`), would be faster. It needs Austin's charter amended by a
separate PR, so it is out of scope here. Named as the obvious next
step once M3 has produced a few tickets worth judging.

### The founder branch, and overruling in one reply

The in-channel question is one message: what was submitted, the two or three
options, her recommendation, and the issue number. She nudges **once** at
seven days and never again — the item stays in the brief's Waiting-on-you
until it resolves.

**Overruling.** Any founder reply in the thread that names a class overrides
her call:

> `spam` · `bug` · `content` · `request` · `founder` · `close` · `reopen`

The reply reaches her as an issue comment via the M4 poller (`c2-brief.md`).
On her next run she reverses whatever she did — reopens what she closed,
re-labels, files or closes the dispatched issue — and comments on the original
saying a founder overruled her and how. No form, no syntax beyond the word.

**Until M4 lands the poller, thread replies are invisible to her.** In the M1→M4
window, overruling means commenting on the issue directly. That is stated in
the in-channel message itself so the founder is never guessing.

Her classification is never authority-bearing. A `founder-decision` label she
applies is a request for an answer, not a decision, and nothing she does
merges, deploys, or spends.

### Backlog

The first run has a backlog: four open `[Feedback]` issues from 2026-09-02,
plus whatever `[Intake]`/`[Link submission]` items are open. It processes them
in the same pass under the same rules. Three of the four are visibly test
strings and will close as `spam`; #3679 ("legit test message") is a real
message with nothing actionable in it and will get the unactionable treatment,
not a spam close. That distinction on the first run is the honest test of
whether the classifier is calibrated — check it.

## Acceptance criteria

1. `.github/workflows/routine-marjorie-triage.yml` exists, declares
   `on.schedule`, passes `allowed_tools: "Bash,Read,Grep,Glob"`.
2. Selection is by title prefix, filtered with `startsWith` **in code**, not
   by search query. Unit test: an issue titled `Feedback on the new landing
   page` is **not** selected; `[Feedback] the page is blank` is.
2b. `git grep -n '\-\-label intake' docs/agents/runner-prompts/marjorie-triage.md`
   returns nothing.
3. A synthetic `[Feedback]` bug is classified, a build-desk issue is filed with
   all four required blocks and verbatim quoted words, and the original is
   commented, labelled `marjorie-triaged`, and left open.
4. A synthetic `[Feedback]` containing `<script>alert(1)</script>` is closed
   with a comment, `spam`, and `marjorie-triaged`.
5. A synthetic needs-founder submission produces one in-channel message with a
   recommendation, and no issue is closed.
6. **Nothing is auto-closed except `spam`** — over the MR2 window, every closed
   submission is either `spam`-labelled or closed by a merged fix or a founder.
7. `spam`, `marjorie-triaged` and `link-submission` exist with descriptions,
   created by `bootstrap-labels.mjs`.
8. `git grep -n 'desk:' docs/agents/runner-prompts/marjorie-triage.md` returns
   nothing.
9. A founder comment saying `spam` on an issue she filed as a bug causes the
   next run to reverse it and say so.
9b. Every issue she opens carries `marjorie-filed`, and the brief shows
   `dispatched: N open, oldest Xd` on a day when at least one is open.
9c. Every classified submission carries her audit comment naming class and
   evidence — zero exceptions in the MR2 sample.
10. No commit from the routine touches `apps/web/**`, `data/**`, or
    `social/**`.

## Files affected

| File | Change |
|---|---|
| `.github/workflows/routine-marjorie-triage.yml` | **new** |
| `docs/agents/runner-prompts/marjorie-triage.md` | **new** — classification rules, the issue template, the overrule vocabulary |
| `scripts/marjorie/lib/submissions.mjs` | extended (created in `c2-brief.md`) — prefix selector + counts, pure and tested |
| `scripts/marjorie/lib/submissions.test.ts` | classification-boundary cases |
| `scripts/marjorie/bootstrap-labels.mjs` | add `spam`, `marjorie-triaged`, `marjorie-filed`, `link-submission`, `founder-decision` |
| `docs/agents/README.md` § Labels the desks own | three new rows |
| `MAP.md` | rows for the new files |

## Open questions

None blocking. Decisions made here, all reversible:

- **Select by title prefix, not by label** — `intake` has three producers.
- **Four new labels, not a `desk:*` revival** — that taxonomy is dead in this
  repo and building on it would drop tickets silently.
- **`marjorie-filed` + the brief line** is how accountability is measured;
  without it "accountable for the outcome" has no mechanism.
- **`enhancement` is the roadmap lane**; no `roadmap` label is minted.
- **Daily batch, not per-submission** — volume is tiny and a batch catches
  duplicates.
- **Originals stay open until a fix merges**; only `spam` closes on her word.
- **No direct Marjorie→Austin lane this wave** — it needs a charter amendment.

One genuine product question, for a founder, not blocking M3: the feedback box
is anonymous, so a bug report missing a repro can never be followed up. If you
want a reply path, that is an optional email field on the form and a privacy
decision — a change to `apps/web`, outside Marjorie's scope entirely, and not
something this wave should decide for you.
