# C2 — the Founders' Brief, rebuilt

Wave M1 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`,
epic #4180). Design only; M1 builds it.

## Behavior you will see

Every morning around 5 AM PT, one message from Marjorie in
`#longlive-marjorie`. Forty lines, maximum. It opens with **Waiting on you** —
every open human action by number, its title, and how many days it has been
sitting. Nothing else goes in that section, so the first thing you read is
always the list of things only you can do.

Then: what happened since yesterday, what runs today, whether the site is
healthy, one line about Tree, and how far the product is from the eight-item
Definition of Done you and Wyatt set on 2026-08-11.

You can reply in the thread. Your reply becomes a comment on that day's brief
issue within about fifteen minutes, so Marjorie reads it on her next run and
answers it. Replying is conversation, not approval — nothing is ever
authorised by a message in this channel.

The GitHub issue still exists, unchanged, as the durable searchable copy. The
change is that **you stop getting the brief by email**. The 12:45 UTC mailer
is switched off. If Discord is down you get one `[discord failed]` email
instead.

Two things get shorter: the brief drops from 100 lines to 40, and the
"distance to done" number finally measures the real bar instead of the
retired launch-readiness gates.

## Data

| Source | Feeds | Status today |
|---|---|---|
| `HUMAN-ACTIONS.md` via `scripts/marjorie/human-actions.mjs` | Waiting on you | **exists** — `readOpenActions()` already returns `{number, tag, title, eta, filed, ageDays}` (`human-actions.mjs:58,79-84`). No new parsing. |
| `gh pr list` / `gh issue list` | Since yesterday | exists |
| `watchdog-alert` issues opened/closed in 24 h | Since yesterday | exists (`standing-checks.mjs` `checkAlerts`) |
| `user-feedback` / `feedback` / `intake` / `link-submission` issues in 24 h | Since yesterday | **new** query; see `s1-triage.md` |
| `scripts/marjorie/runner-cadence.json` + `gh run list` | Today | exists |
| prod smoke, e2e, Vault Run freshness, content lanes | Site | exists (`standing-checks.mjs`) |
| `social/lessons.md` + the Tree scorecard | Tree | **read-only**, new read |
| `docs/definition-of-done.md` via `done-history.mjs` | Distance to done | exists (`done-history.mjs:25`) |

### The Definition of Done — which one, settled

There are three "definition of done" documents in this repo and they are
routinely conflated, including by the prompt that commissioned this spec:

1. `CLAUDE.md` § Definition of done — **six** dot-separated clauses, the
   *per-feature engineering* checklist (tests pass, review clean…). Applies to
   every PR. **Not what the brief scores.**
2. `docs/definition-of-done.md` — **eight** numbered items, "the founders'
   definition of done for LongLive", set by Joey and Wyatt in person
   2026-08-11. That file's own naming note says: *"If a founder says
   'definition of done' about the product, they mean this file."*
3. `docs/launch-readiness.md` — the retired **12-gate** tracker, still read by
   `gate-history.mjs:25-28` → `done-estimator.mjs`.

**Decision: the brief scores #2, the eight product items, and stops reading
#3 entirely.** The wave prompt said "the Definition of Done in `CLAUDE.md`
(eight items)"; `CLAUDE.md` has six clauses and they are the wrong kind of
thing to show a founder in a morning brief. "Eight items" unambiguously names
`docs/definition-of-done.md`. Section 3 of today's brief already reads it
correctly; only the *Distance to done* estimator is still on the 12 gates, and
`assemble-brief.mjs:645` carries an in-code disclaimer admitting it. This
spec closes that gap — the disclaimer is deleted along with the dependency.

## Mechanics

### Template — exact, with a filled example

Six sections, in this order, each heading exactly as written. Hard cap **40
lines** including headings and blank lines; the assembler truncates and says
so rather than overflowing.

```markdown
**Founders' Brief — 2026-09-12** · [issue #4190](https://github.com/JW-Incorporated/swift2/issues/4190)

**Waiting on you (6)**
- #66 · 0d · Create a Discord webhook for #longlive-marjorie (~5 min)
- #61 · 1d · Set SOCIAL_FREEZE=false (~2 min)
- #54 · 8d · Turn on Code Scanning and set CODE_SCANNING_ENABLED (~5 min)
- #49 · 12d · Add the shared Community Tasks acknowledgement secret (~5 min)
- #43 · 19d · OS-004 — Push credentials on EAS (~15 min)
- +1 more in HUMAN-ACTIONS.md

**Since yesterday**
- 6 PRs merged (#4174 #4173 #4168 #4166 #4163 #4161), 0 reverted
- Alerts: 0 opened, 1 closed (prod smoke recovered)
- Submissions in: 2 feedback, 0 intake — both triaged, #4188 filed for the build desk

**Today**
- Runs: tree-daily-draft 04:00, vault-run 09:07, karen-nightly —, community-answerer 07:46
- Me: sweep the 2 open watchdog alerts, triage anything new, nudge #4157 (open 9d)

**Site**
- Prod smoke 🟢 · e2e 🟢 · Vault Run last PR 14h ago 🟢 · content lanes 🟢

**Tree**
- Lessons: "carousels outperform stills 2:1 on save-rate" (3rd firing — codify)
- Scorecard: 15 posts, 4.2% median engagement, week +0.4pt

**Distance to done** — 5/8 green (`docs/definition-of-done.md`)
- 🟡 #4 Marketplace + Community — Marketplace moving (agent); Community unspecced (nobody)
- 🟡 #5 Every link works — shop/product links not in Karen's sweep yet (agent)
- 🟡 #6 Videos chronological + filter — 3 catalog batches open, filter unbuilt (agent)
- Nothing moved since 2026-09-05. The two 🟡s blocked on `nobody` are the real distance.
```

Rules the assembler enforces:

- **Per-section caps, not one global truncation.** A single 40-line cut
  applied at the end always eats the last section, which is *Distance to
  done* — the most valuable thing in the brief and the one a founder cannot
  reconstruct from GitHub. Budget instead: Waiting on you 7, Since yesterday
  6, Today 4, Site 2, Tree 3, Distance to done 7, plus headings and blanks.
  Each section truncates itself with a `+N more` line and the total stays
  under 40 by construction.
- **Waiting on you** lists open human actions and *nothing else*. Sorted
  oldest-first by `ageDays` after any `[BLOCKING]` items. Over five, show five
  and a `+N more` line — the section must never eat the brief.
- **Since yesterday** carries one accountability line whenever Marjorie has
  open dispatched work: `dispatched: N open, oldest Xd (#…)`, counted from
  the `marjorie-filed` label (`s1-triage.md`). This is the only place
  "accountable for the outcome, not the ticket" becomes visible daily; a
  ticket she filed and forgot shows up here aging.
- Every other section: one line per bullet, no bullet over two sentences,
  issue numbers inside links.
- A section with nothing to say prints one line saying so. It is never omitted
  — a missing section reads as a broken assembler.
- **Distance to done** states the count against eight, names only the
  non-green items with their `Blocked on` value, and closes with one sentence
  of judgment. No invented ETA (unchanged rule).

### Delivery

`routine-marjorie-brief.yml` keeps its cron `0 12 * * *` and gains a
**second job**, not a final step:

```yaml
jobs:
  run:      # unchanged — routine-template.yml, the agent, posts the issue
  deliver:
    needs: run
    if: always() && needs.run.result == 'success'
    environment: ops          # the only way to see DISCORD_MARJORIE_WEBHOOK_URL
    steps:                    # plain run: steps, no agent
      - fetch today's `founders-brief` issue body via `gh issue view`
      - node scripts/marjorie/post-or-mail.mjs --subject "..." --body-file -
```

**A final step in the agent job is impossible.** An environment secret is
visible only to a job declaring that environment, `routine-template.yml`
has no `environment` key, and the routine is a single job. The two-job
shape is what `routine-tree-weekly-plan.yml:84-101` already does for its
own Discord post, so it is proven rather than invented. It also keeps the
webhook out of the agent context entirely, which is the same property that
makes the webhook the right credential in the first place (`c1-delivery.md`).

The issue is still the source of truth for what gets posted — `deliver`
re-reads it rather than passing text between jobs, so what lands in Discord
is byte-for-byte what landed on GitHub. There is no longer a 45-minute gap
to protect, because there is no second workflow.

`brief-mailer.yml` is deleted (see `c3-email-retired.md`). Its 12:45 UTC cron
and the watchdog step that re-dispatches it (`watchdog.yml:86-107`) go with
it.

The GitHub issue is unchanged: title `Founders' Brief — YYYY-MM-DD`, label
`founders-brief`, first line `cc @sffan15-sys @wjduvall-cmd`. That first line
stays even though the mailer that keyed on it is gone — the delta comment and
the reply poller both still locate the day's thread by it, and
`marjorie-delta.md` depends on it.

### Founder replies → issue comments

Mechanics are M4's to build; the contract is fixed here so M1 does not
foreclose it.

A poller job (C1 § *Reading replies*: plain `run:` step, `main`-only
environment, bot token, never an agent) runs every 15 minutes, reads the
thread on the day's brief message, and posts each new founder reply to the
brief issue as a comment prefixed `💬 Reply from <founder>`. Idempotent by an
embedded `<!-- relay-id: <discord message id> -->` marker — exactly the scheme
`marjorie-inbox.yml:110` uses today for email, carried over intact.

`marjorie-brief.md` step 3 currently instructs Marjorie to read
`📧 Reply from …` comments. It is re-pointed to `💬 Reply from …`. The
authority boundary is unchanged and restated: a relayed reply is
conversation-grade, never decision-grade.

**M1 leaves the read side unbuilt.** Between M1 and M4 a thread reply is
visible to a human and invisible to Marjorie. That is stated in the M1 PR body
so it is a known gap, not a surprise.

### Code changes

| File | Change |
|---|---|
| `scripts/marjorie/assemble-brief.mjs` | six sections replace five; drop `done-estimator`/`gate-activity` imports; 40-line cap; new submissions + Tree reads. Currently 739 lines — the Tree read and the submissions read go in `scripts/marjorie/lib/` so it **shrinks**, not grows |
| `scripts/marjorie/lib/tree-line.mjs` | **new** — one line from `social/lessons.md` + scorecard, read-only |
| `scripts/marjorie/lib/submissions.mjs` | **new** — 24 h counts by label |
| `scripts/marjorie/assemble-brief.test.ts` | `:238-243` asserts the five v3 headings in order — **must** be updated in the same PR or CI goes red |
| `scripts/marjorie/done-estimator.mjs`, `gate-history.mjs`, `gate-activity.mjs` | no longer imported by the brief. **Leave the files** — deleting them is a separate call once nothing else reads them |
| `docs/agents/runner-prompts/marjorie-brief.md` | new section list, 40-line cap, `💬` replaces `📧`, mailer references removed |
| `docs/agents/runner-prompts/marjorie-delta.md` | mailer references removed; the delta stays a comment |

## Acceptance criteria

1. `node scripts/marjorie/assemble-brief.mjs 2026-09-12 | wc -l` ≤ 40, and
   with deliberately oversized fixture data every section still appears —
   truncation is per-section, so *Distance to done* is never the thing cut.
2. Output contains all six headings in the specified order; the test file
   asserts this and passes.
3. `git grep -n 'launch-readiness\|gate-history\|done-estimator' scripts/marjorie/assemble-brief.mjs`
   returns nothing.
4. `git grep -n 'still measures the 12 historical launch-readiness gates' scripts/`
   returns nothing.
5. Waiting-on-you, on the day it runs, lists exactly the open items in
   `HUMAN-ACTIONS.md` at that SHA — the MR1 check. Each line carries number,
   age in days, and title.
6. Distance to done reports `N/8` and cites `docs/definition-of-done.md`.
7. A real scheduled run posts one message to `#longlive-marjorie` (2xx in the
   log) **and** opens the `founders-brief` issue — from two jobs, with the
   webhook visible only to `deliver`.
7b. The `deliver` job posts the issue body verbatim: diff the Discord message
   against the issue body at that SHA.
8. `.github/workflows/brief-mailer.yml` does not exist on `main`.
9. `npm test -- scripts/marjorie` passes.

## Files affected

The table above, plus `MAP.md` rows for the two new `lib/` modules, and
`docs/agents/marjorie.md` § Brief format / § Cadence / § Delivery — amended in
PR 2 (`docs/marjorie-charter-amendment`), not here, because the charter may
only change by founder-approved PR.

## Open questions

None blocking. Decisions made here, all reversible:

- **Score `docs/definition-of-done.md`, not `CLAUDE.md`, not the 12 gates** —
  reasoning above; this corrects the commissioning prompt.
- **Keep the retired estimator modules on disk.** They are still imported by
  tests and possibly elsewhere; deleting them is a separate cleanup with its
  own grep.
- **Keep the `cc @…` first line** despite the mailer's removal — two other
  consumers still key on it.
- **40 lines counted including headings and blanks**, truncate-and-say-so
  rather than silently drop a section — and budgeted per section, so the
  cut never lands entirely on the last one.
- **Delivery is a second job, not a step**, because the environment secret
  is unreachable from the agent job.

Genuinely for a founder, not blocking M1: the 8 PM Evening Delta still exists
as a GitHub comment and is not part of this rebuild. If the brief is now the
one daily surface, the delta arguably belongs in the channel too — or belongs
retired. M1 changes neither; worth one line of your answer whenever you next
look at the channel.
