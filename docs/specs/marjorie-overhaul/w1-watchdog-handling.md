# W1 — Marjorie handles watchdog alerts

Wave M2 of the Marjorie Overhaul (`docs/plans/marjorie-overhaul/PLAN.md`, epic
#4180). Design only; M2 builds it. Depends on M1 merged.

## Behavior you will see

Today a watchdog alert opens a GitHub issue and nobody does anything until you
notice. Two are open right now: #4129 (a scheduled workflow not succeeding,
since 2026-09-11) and #4009 (no Facebook export closed in nine days, since
2026-09-07).

After M2, every alert gets a reply. Within the hour a line appears in
`#longlive-marjorie`: what broke, what Marjorie did, and whether it needs you.
Usually that is "a routine missed its run, I re-dispatched it, it's green
again" and the alert closes itself — two lines and you never think about it.

When it *does* need you, you get a numbered `HUMAN-ACTIONS.md` item with
literal steps, which becomes a card in your human-action channel within ten
minutes. Not "the FB export is stale" — the six groups to open, what to name
the files, and the command to run at the end.

An alert she cannot fix and cannot turn into a human action stays open and is
named in the next brief with what she tried. Nothing is closed for being
inconvenient.

## Data

| Input | Where |
|---|---|
| Open alerts | `gh issue list --label watchdog-alert --state open` |
| The alert's own body | `upsert-alert.sh` writes a diagnosis line per condition |
| Routine cadences | `scripts/marjorie/runner-cadence.json`; thresholds mirrored from `watchdog.yml:441-443` |
| Alert handling ledger | a comment on the alert issue — no new store |

No new persisted state. The alert issue is the state machine: open means
unresolved, her comment means attempted, closed means resolved.

## Mechanics

### `routine-marjorie-ops.yml` (new)

Calls `routine-template.yml` with:

```yaml
with:
  routine_name: "Marjorie — site ops"
  prompt_file: docs/agents/runner-prompts/marjorie-ops.md
  model: claude-sonnet-5
  allowed_tools: "Bash,Read,Grep,Glob"
  timeout_minutes: 20
  max_turns: 30
  checkout_token_secret: SOCIAL_POSTER_PAT   # only when filing a human action by PR
```

Triggers: `schedule: cron: "18 * * * *"` plus `workflow_dispatch` for manual
runs. **No per-alert dispatch from `watchdog.yml`.** Watchdog runs at `:05`
and the sweep at `:18` already follows it by thirteen minutes, so a
per-open dispatch adds a second concurrent run for no latency worth having —
and `routine-template.yml` sets `cancel-in-progress: false`, so the two
would queue rather than coalesce.

**A zero-cost `gate` job runs first**: one `gh issue list --label
watchdog-alert --state open` in a plain step (no agent, ~5 s), exposing a
`work` output; the `run` job carries `needs: gate` and
`if: needs.gate.outputs.work == 'yes'`. Most hours there are no open alerts
and the Sonnet job is skipped entirely, so an hourly cadence costs almost
nothing.

**Verify before relying on it:** a run whose `run` job is *skipped* must still
report `conclusion: success`, because watchdog's liveness check queries
`gh run list --status success` (`watchdog.yml:294`). It should — confirm on
the first real run rather than assuming.

**On scoping, stated honestly.** The commissioning brief asked for
`allowed_tools` scoped to `gh issue`/`gh run`/`gh workflow run`/`gh pr`.
`routine-template.yml:145` interpolates the value **unquoted** into
`claude_args`, and all 13 existing routines pass bare tool names, so a value
containing spaces would not survive. M2 should *try* the space-free form
`Bash(gh:*),Bash(git:*),Bash(node:*),Read,Grep,Glob` — genuinely narrower,
and it may interpolate cleanly — and fall back to the bare list if the runner
breaks, saying which it used.

Either way, three things are true and the prompt must not overstate them:

1. Omitting `Write`/`Edit` is a **narrowing, not a guarantee** — `Bash` can
   write any file. The real enforcement that she edits no product code is
   acceptance criterion 5, checked on the PR diff.
2. `.claude/hooks/guard.sh` deterministically denies `gh secret`/`gh variable`
   on every Bash call. That is the one hard boundary, and it is not new.
3. `checkout_token_secret` is static per workflow, so the job holds the PAT on
   every run that gets past the gate, not only when filing a human action.
   Acceptable, but not implied away.

### Handler table

One row per condition. All 14 `ALERT_TITLE` assignments verified at
`93b93360`; two are dynamic, so the routine must **pattern-match**.

| Alert title | She checks | She may do | Human action if | Posts | Closes when |
|---|---|---|---|---|---|
| `Watchdog: no Founders' Brief` (`:124`) | last `routine-marjorie-brief` run + its failure reason | re-dispatch `routine-marjorie-brief.yml` once | the run fails on auth (`CLAUDE_CODE_OAUTH_TOKEN` expired) — literal steps to re-issue it | "brief missed 12:00, re-dispatched, posted 13:0x" | watchdog self-closes at `:149` — she never closes this one by hand |
| `Watchdog: prod smoke check failing` (`:216`) | `curl` the two URLs herself; last deploy | **nothing** — this is a site outage | always, immediately, `[BLOCKING]`, with the failing URL and last-good deploy SHA | the failing URL, the HTTP code, the last-good deploy, "you need to look" | watchdog self-closes at `:220` |
| `Watchdog: scheduled workflow(s) not succeeding` (`:306`) | which workflow, its last successful run, its cron | `gh workflow run <wf>` once per workflow per sweep | two consecutive re-dispatches both fail | "`<wf>` quiet 31h (max 24h), re-dispatched → green" | watchdog self-closes at `:310` |
| `Watchdog: ${WF} failed its last 2 scheduled runs` (`:339`, **dynamic**) | the two failed run logs; is it the same error twice | re-dispatch the workflow once (a fresh run, not a CI re-run) | same error three times — a real defect, so **a build-desk issue**, not a human action | the error's first line + what she did | watchdog self-closes at `:345`, or by hand if the workflow was deleted |
| `Watchdog: PR(s) stuck on a failing or missing check` (`:450`) | each named PR: is `build` missing or failing, and how old | comment on the PR naming the failing check. **No re-runs** — watchdog already spends the budget (below) | a PR red >7d, or red on a founder-only gate (e.g. `SOCIAL_FREEZE`) | PR numbers + why each is red | watchdog self-closes at `:530` |
| `Watchdog: Karen scanned but filed no tickets` (`:621`) | which of the three stages failed (staleness / provenance / filing) | re-dispatch `routine-karen-nightly.yml` on a staleness-only failure | a provenance or filing failure — that is a defect in Karen's filing path → build-desk issue | which stage failed | watchdog self-closes at `:691` |
| `Watchdog: routine-vault-run scheduled cadence` (`:782`) | `routine-vault-run.yml`'s last run | re-dispatch once | two failures in a row | last run + result | watchdog self-closes at `:785` |
| `Watchdog: an OPEN [BLOCKING] human action is aging silently` (`:809`) | nothing | **nothing** | never — a human action about a human action | **nothing.** The brief's *Waiting on you* already lists it with its age every morning; an in-channel duplicate is pure noise | watchdog self-closes at `:813` |
| `Watchdog: work is going unowned` (`:832`) | `check-work-ownership.mjs` output vs `.github/work-ownership-budget.json` | nothing this wave — ownership routing is `s1-triage.md`'s territory | if unowned count exceeds budget for 7 straight days | the count and the budget | watchdog self-closes at `:843` |
| `Watchdog: Karen post-repair still unconfirmed` (`:896`) | whether the self-limiting window (expired 2026-08-22) still applies | **propose deleting the step** — it is 3 weeks past its own expiry | no | one line saying the check is expired | build-desk issue to remove the step; watchdog self-closes at `:907` |
| `Watchdog: news-worker rotated key looks broken` (`:948`) | same — expired 2026-08-22 | same proposal | a confirmed auth failure → yes, key rotation is founder-only | one line | as above (`:952`) |
| `Watchdog: ${LANE} hasn't produced a PR in ${WINDOW}h` (`:1060`, **dynamic**) | that lane's routine's last run | re-dispatch the lane's routine once | two failures in a row | lane + hours quiet + what she did | watchdog self-closes at `:1064` |
| `Watchdog: no FB group export closed in 9 days` (`:1109`) | the open `FB group export due` issues | **nothing** — Facebook has no API and prohibits automated collection | **always** — this is the canonical human action; full text below | "this week's FB export is owed, filed as HA #NN" | when the export issue closes; watchdog self-closes at `:1124`/`:1147` |
| `Watchdog: knowledge engine current-tier data is stale` (`:1175`) | `scripts/knowledge-freshness.mjs` exit code and the worker's last run | re-dispatch the knowledge worker once | a missing/expired API key | staleness in hours + what she did | watchdog self-closes at `:1183`/`:1188` |

Three rules that cut across every row:

- **She almost never closes an alert.** `watchdog.yml` self-closes each
  condition when it clears, on its own next run. Marjorie closing one by hand
  would assert a fix she has not observed. Two exceptions, both "the
  condition can no longer recur", each with a stated reason in the closing
  comment: (a) the two expired self-limiting checks, once their steps are
  removed; (b) **a dynamic per-workflow alert (`:339`) naming a workflow that
  no longer exists** — that loop only visits files on disk, so a deleted
  workflow's alert can never self-close. This matters immediately: C3
  deletes `brief-mailer.yml` and `marjorie-inbox.yml`. (Checked — the
  currently-open #4129 names five live workflows, so it is not affected, but
  the next one might be.)
- **`upsert-alert.sh` fires on close as well as open** (`:67-69`, unchanged by
  C3). The routine must ignore close events, or every recovery would trigger a
  handling pass with nothing to handle.
- **One in-channel line per alert per 24 hours.** A condition that stays broken
  for a week must not produce seven identical posts. Dedupe on
  (alert title, calendar day) via her own prior comment. (The open/clear posts
  come from `upsert-alert.sh`, which posts only on state change per
  `c3-email-retired.md`; this rule governs only her handling lines.)
- **"I already acted, watchdog has not caught up yet" is a real state and
  must be deterministic.** The cadence check only *closes* on the daily
  14:35 pass (`watchdog.yml:264`), so an alert she fixed at 09:18 stays open
  for up to 23 hours while her hourly sweep keeps seeing it. An LLM
  re-deriving state from comment text every hour will eventually act twice.
  So `alert-router.mjs` parses her own ledger comment and returns one of
  `unhandled` / `handled-awaiting-watchdog` / `escalated`; **the prompt acts
  only on `unhandled`.** This is a pure function with tests, not a judgment
  call made hourly.

### The re-run budget

`watchdog.yml:441-443` sets `RED_AFTER_H=6`, `STALE_H=48`, `RERUN_BUDGET=2` as
local bash variables inside one step — nothing to import, and **Marjorie
spends no CI re-runs at all.** Watchdog already spends that budget on exactly
the qualifying PRs; having her read its run log to count what it spent is
fragile bookkeeping for a capability already exercised. Her value on a stuck
PR is the comment naming the failing check and the escalation when it stays
red. The thresholds are cited here only so the prompt uses the same
definition of "stuck".

`gh workflow run` re-dispatches of a *quiet routine* are a different thing,
capped separately: **one per workflow per sweep, two per day.** Beyond that it
is a defect, not a blip.

### Will the new routine itself be watched?

**Yes, automatically, with one condition.** `watchdog.yml:274-289` globs
`.github/workflows/routine-*.yml`, derives each file's max-age from its own
cron (`cron-maxage-hours.mjs`), and skips anything with no `schedule:` block.
`routine-marjorie-ops.yml` matches the glob — no registration step —
**provided it declares `on.schedule`**, which the sweep gives it. A
dispatch-only routine would be silently unwatched; that is why the sweep is a
cron and not just a dispatch target.

Two fixes while here: remove `marjorie-inbox.yml` from the explicit extras
(`:280`) since C3 deletes it; and **add `plan-recheck-marjorie.yml`, which is
not watched today** — it has a cron (`48 15 * * *`) but does not match
`routine-*.yml`, and unlike `plan-recheck.yml` was never added to the extras
at `:275-281`. Otherwise the Marjorie plan's own recheck can go dark
unnoticed, which is the precise failure this wave exists to prevent.

### The FB export human action — final text

Filed by the routine as a v2 item, verbatim. Not a template.

```markdown
## #NN 🟡 [DECIDE] Save this week's Facebook group pages and upload them (~30 min)
<!-- ha filed=YYYY-MM-DD -->

**Why:** The fan-signal engine reads what Swifties are actually saying in six
Facebook groups. Facebook has no API for groups you don't run and forbids
automated collection, so this is the one step a person has to do. Nothing has
been exported yet — the watchdog has been flagging it since 2026-09-07
(issue #4009) and two weekly reminders are open (#3911, #3536). Until one
export lands, nobody knows whether the parser works.
**Steps:**
1. In a normal logged-in browser (never a bot), open each group below in turn.
   All six were found by desk research and **nobody has confirmed you are a
   member** — if you are not in one, skip it and say which in your reply:
   - Taylor Swift's Vault → `taylor-swifts-vault`
   - Friendship Bracelet Making and Trading → `friendship-bracelet-making-trading`
   - Swiftie Super Worldwide Friendship Bracelet Trade → `swiftie-super-worldwide-bracelet-trade`
   - Kulto ni TAYLOR SWIFT → `kulto-ni-taylor-swift`
   - Taylor Swift Swifties → `taylor-swift-swifties`
   - Friendship Bracelets Buy/Sell/Trade → `friendship-bracelets-buy-sell-trade`
2. In the group, sort posts by **New activity** (not Top).
3. Scroll down until the posts you can see are older than 7 days. Click
   "See more" on any long post so its full text is on screen. Do not open
   comment threads one by one.
4. Press `Ctrl+S` (Windows) or `Cmd+S` (Mac). In the save dialog choose
   **"Webpage, Complete"**. Name the file exactly
   `fb-<slug>-<YYYY-MM-DD>.html` using the slug from step 1 and today's date —
   for example `fb-taylor-swifts-vault-2026-09-14.html`. Save to Downloads.
5. Repeat steps 2-4 for each group you are a member of.
6. Open a terminal in the project folder and run, exactly:
   `npm run knowledge:fb-upload -- ~/Downloads/fb-*.html`
   It prints one line per file. Each says either `uploaded, local copy
   deleted` or gives a reason and `local copy KEPT`. A kept file was not
   uploaded — re-run that one file by name.
7. Close the open reminder issues #3911 and #3536.
**Worked if:** step 6 ends with `knowledge:fb-upload: N/N uploaded` where N is
the number of groups you saved, and no line says `local copy KEPT`.
```

Provenance, all verified: the six slugs and labels come from
`scripts/knowledge/fb-groups-checklist.mjs:16-51` (seeded 2026-09-06 in #3919,
all six still `candidate: true`); the command, filename pattern and output
strings from `scripts/knowledge-fb-upload.mjs`. The routine regenerates the
group list from the checklist at filing time, so a later change needs no spec
edit. Step 6 needs `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` in
`apps/worker/.env`; if absent the script exits 1 with a clear message, which
the "Worked if" line catches.

### `watchdog.yml` gets smaller

Per C3 it loses the brief-mailer catch-up block (`:86-107`) and the
`marjorie-inbox.yml` watch line; the two expired self-limiting checks
(`:886-952`, ~67 lines) go once Marjorie's proposal lands. The Discord leg is
added in `upsert-alert.sh`, not here, so it only loses lines — ~1,200 today,
and the M2 gate is "shorter than before".

## Acceptance criteria

1. `.github/workflows/routine-marjorie-ops.yml` exists, calls
   `routine-template.yml`, declares `on.schedule` and `on.workflow_dispatch`,
   and passes an `allowed_tools` list with no `Write`, no `Edit`, no `Task`.
2. With zero open `watchdog-alert` issues, a scheduled run **skips** the
   agent job and still reports `conclusion: success` — confirmed against
   `gh run list --status success`, the query watchdog's liveness check uses.
2b. `git grep -n 'routine-marjorie-ops' .github/workflows/watchdog.yml`
   returns nothing — there is no per-alert dispatch.
3. A synthetic quiet-routine alert is resolved by a real run: the issue shows
   her comment and a `gh workflow run` dispatch, and watchdog closes it next pass.
4. The prompt covers all 14 conditions and pattern-matches the two dynamic
   titles.
5. A synthetic FB alert files a `HUMAN-ACTIONS.md` v2 item **by PR** whose Steps
   match the text above with the live group list, touching no other file.
6. Both `routine-marjorie-ops.yml` and `plan-recheck-marjorie.yml` appear in
   watchdog's `WATCHED` list on its next run (check the run log).
8. `wc -l .github/workflows/watchdog.yml` is lower than 1200.
9. Two runs against the same still-open alert on the same day produce exactly
   one in-channel post.
9b. `alert-router.mjs` returns `handled-awaiting-watchdog` for an alert
   carrying her ledger comment, and the prompt takes no action on that state —
   unit-tested, and confirmed on a real alert she resolved earlier the same
   day.
10. `git grep -n 'gh secret\|gh variable' docs/agents/runner-prompts/marjorie-ops.md`
    returns nothing.

## Files affected

| File | Change |
|---|---|
| `.github/workflows/routine-marjorie-ops.yml` | **new** |
| `docs/agents/runner-prompts/marjorie-ops.md` | **new** — the handler table as instructions |
| `scripts/marjorie/lib/alert-router.mjs` + `.test.ts` | **new** — title → handler (incl. the two dynamic patterns) and handled-state; pure and tested, so matching is deterministic rather than judged hourly |
| `.github/workflows/watchdog.yml` | watch-list fixes (drop `marjorie-inbox.yml`, add `plan-recheck-marjorie.yml`); remove the two expired checks. **No dispatch step** |
| `MAP.md` | rows for the new files |

## Open questions

None blocking. Decisions made here, all reversible:

- **She does not close alerts** (two narrow exceptions above) — watchdog
  self-closes each condition, and closing by hand asserts an unobserved fix.
- **Hourly sweep on a cron**, gated by a zero-cost job, so most runs cost
  nothing and the routine is itself watchable.
- **No per-alert dispatch and no CI re-runs by Marjorie** — both duplicate
  capability that watchdog already has.
- **Title matching and handled-state live in a tested pure module**, not in
  prompt judgment: two of the fourteen titles are dynamic, and an hourly LLM
  re-deriving "did I already act?" from prose will eventually act twice.
- **The two expired self-limiting checks get a build-desk issue**, not silent
  deletion by Marjorie — she does not write code.

One genuine gap for a founder: `Watchdog: prod smoke check failing` means the
site is down, and the current design's fastest path to you is a Discord post
plus a `[BLOCKING]` card. There is no page. The charter's Paging section still
says SMS becomes primary "when the provider account exists". If site-down
should wake you at 3 AM, that is a paging decision and a spend decision, and
it is yours — not something M2 should invent.
