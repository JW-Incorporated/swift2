# MR2 — "Marjorie acted on real events" (+21d after M1)

- **Date run:** 2026-10-03 (due 2026-10-03)
- **Verdict:** ADJUST
- **Window:** 2026-09-19 → 2026-10-03 (MR1's report date → today)
- **Waves live:** M0–M8 all merged. M6 (`routine-*-ask-response.yml`) and M8
  (`build-ticket.mjs`, `chase-action.mjs`) are both proven live below, which
  PLAN.md's wave table does not yet mark with a ✓.

## Checks

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | ops resolved a real `watchdog-alert` (comment + dispatch/human action + close) | **PASS** | #4755: Marjorie comment 10-01T20:25 diagnosed `routine-vault-run.yml`, re-dispatched run `36921412349`, marker `<!-- marjorie-ops-handled date=2026-10-01`; closed 10-02T19:29. Second instance #4546: ten daily diagnoses, then at the 7-day threshold filed HA #87 (`162d2970`, PR #4629) → founder decision 09-30T15:06 → closed 10-01T19:46. |
| 2 | FB-export alert → HA with literal steps, filed by the routine via PR, visible as a card | **PASS** | HA #70 filed by the ops routine (M2, PR #4222); automated 09-30 (`478c145a`, PR #4642 "Automate weekly Facebook group export (HA #70)"); closed today — `e22dd6fd` 10-03T17:15 "close #70 and #88 (first automated FB export uploaded)". Card rendering is Discord-side; the HA file history is the proof available here. |
| 3 | triage handled ≥1 intake/feedback issue (build-desk issue w/ criteria, or founder question w/ recommendation) | **PASS** | intake #4885 labeled `intake` by `claude[bot]` 10-03T18:24 → its founder-decision half became HA #98 `[DECIDE]` "Scrub ~70 unhashed FB names … now, or wait?" via PR #4888, now on the status page's Needs-you list with a `decide #98 scrub` reply line. Build-desk side: #4778 (`marjorie-filed`, `desk:build`, 10-02) plus #4802/#4803/#4804 from alert #4801. |
| 4 | Nothing auto-closed by triage without a founder or a merged fix | **PASS** | #4807/#4808 closed 10-02T21:03 by `sffan15-sys` (timeline `closed sffan15-sys`), not by a routine. #4610 closed with PR #4611 cited in the closing comment. No routine-authored bare close found in the window. |
| 5 | M4: one Monday cycle produced an issue from a Tree ask and one from a Marjorie ask, both numbered in the next brief | **PASS / partly UNVERIFIABLE** | 09-28 Monday run `36461003031` filed `tree-filed` #4604 and #4605. Marjorie→Tree asks the same week: #4581, then #4675/#4676/#4722/#4724. Both directions produce numbered issues, no duplicates. The "numbered in the next brief" clause is **UNVERIFIABLE in its original form**: Bots v2 W4 retired the daily brief issue on 10-01, so there is no brief issue after that date to read. |
| 6 | M5 chat: a real founder message answered with ✅ in each of `#longlive-marjorie` and `#longlive-tree`; every `[chat failed]` notice has one ❌ and no second notice for the same message | **PASS (run-side)** | Marjorie: run [36923073539](https://github.com/JW-Incorporated/swift2/actions/runs/36923073539) `replied in 142s`, [36930044044](https://github.com/JW-Incorporated/swift2/actions/runs/36930044044) `replied in 123s`. Tree: [36924877012](https://github.com/JW-Incorporated/swift2/actions/runs/36924877012) `replied in 175s`, [36952490293](https://github.com/JW-Incorporated/swift2/actions/runs/36952490293) `replied in 176s`. The `replied in <n>s` line only prints on the success path. The ✅/❌ reactions themselves live in Discord and are **not readable from Actions** — that clause is UNVERIFIABLE by this routine, permanently. Duplicate-notice rule holds: the two 10-02 failures carry distinct message ids (`1555664731530989591`, `1555664880978362459`), so neither is a second notice for one message. |
| 7 | M7 doorbell: rang for a real founder message in each channel; 👀 from Long Live Doorbell; chat run's triggering actor is the key's owner, event `workflow_dispatch`; cite message-to-✅ time | **PASS (run-side)** | All four runs above: `event=workflow_dispatch`, `triggering_actor=sffan15-sys` — the doorbell key's owner. Latencies 123s / 142s / 175s / 176s sit inside the doorbell's 2.5–3.5 min band, not the 5-min poll's ~4.5 min, so the doorbell (not the fallback poll) started them. The 👀 reaction's author is Discord-side → UNVERIFIABLE here. |
| 8 | M8 chase: one `marjorie-filed` item nudged at 48 h, moved or `[DECIDE]`-actioned at 96 h; founder's one-word reply acted on; one nudge and one chase HA per item | **PASS** | #4559, full cycle: 48 h nudge 09-26T20:03 (`<!-- marjorie-chase: 48h -->`, "No activity for 2 days. Holder: unclaimed."); 96 h action 09-28T23:23 — HA #85 via PR #4612 (`<!-- marjorie-chase: 96h issue=4559 ha=85 pr=4612 -->`); founder reply acted on 09-30T15:58 ("Founder decision … assign — a session takes this now"); issue now CLOSED. Exactly one nudge and one chase HA on the item. Second instance: #4364 → PR #4456 (`b59422d8`, 09-19). |
| 9 | Every `routine-marjorie-brief.yml` run in the window reached a Discord post — deliver log shows `discord-message-id:` (absent = FAIL, two ids for one day = FAIL) | **FAIL (2 of 15 days) — and the check is stale again** | Real brief runs are the 12:00 UTC `workflow_dispatch` runs (every `schedule` run is a deliberate no-op). Markers present on 09-19→09-21, 09-23→09-25, 09-27→10-01 — never two for one day. **Lost: 09-22 (`35724597868`) and 09-26 (`36240546249`)** — both filed the brief and then blew the 40-turn cap, so `deliver` was skipped; 0 markers. 10-02 (`37004132345`) and 10-03 (`37121444407`) also show 0 — **not an outage**: Bots v2 replaced the once-a-day post with the status page, and the deliver script now says so in a comment ("No Discord message id any more: the ping is no longer a once-a-day post"). Both days logged `status ping: sent — 📋 Status updated … issues/4665`. |
| 10 | Tree's weekly plan PR renders a "From Marjorie" section naming each open `marjorie-filed` + `desk:tree` issue by number | **FAIL on the letter — the check is now vacuous** | #4603 (09-28, the only new plan PR in the window) scores **0** matches in body and diff, making it the fifth consecutive week. But **there were no open `marjorie-filed` + `desk:tree` issues to name**: all nine are CLOSED, and M6's `routine-tree-ask-response.yml` closes them in minutes — #4724 was filed 10-01T17:10:54 and closed 10-01T17:21:08, a **10-minute** turnaround. The Monday rendering was designed for a weekly backlog that M6 eliminated. |
| 11 | This routine can land a PR: `routine-template.yml` grants `contents: write`, and MR1's `rechecks/<id>.md` is on main with status `reported` | **MIXED** | Second half **PASS**: `rechecks/MR1.md` is on main and MR1's `status` is `"reported"` (PR #4763 landed 10-01 via the Contents API). First half **FAIL**: `routine-template.yml:175` still declares `contents: read`. Reusable-workflow permissions are the intersection, so `plan-recheck-marjorie.yml`'s own `contents: write` (lines 23–25) is still demoted and `git push` still 403s. #4462 open since 09-23. |
| 12 | Waiting-on-you matches the open HUMAN-ACTIONS.md numbers, read from the Discord message or the status-issue journal | **PASS** | Status issue #4665 "🙋 Needs you" lists exactly **#96, #97, #98** — and `HUMAN-ACTIONS.md` has exactly those three open (#96, #97 at this checkout's HEAD `88c6156`; #98 added at 18:52 by PR #4888, after the checkout, and already rendered on #4665). 3 for 3. |
| 13 | Recommend close or extend on #4180 | **Recommend CLOSE** | See judgment. |

## Judgment

**The plan is on track and essentially complete.** Every wave M0–M8 is
merged, and MR2's substantive question — *did Marjorie act on real events?*
— is answered yes on all four fronts with live evidence, not code reading:
she re-dispatched a stuck workflow and closed the alert (#4755), escalated a
7-day budget breach to a human action the founder then decided (#4546 → HA
#87), turned an intake report into a `[DECIDE]` human action within 30
minutes (#4885 → HA #98), and ran a complete 48 h/96 h chase to a founder's
one-word "assign" (#4559). The FB-export human action she filed in M2 is not
just a card any more — it got automated and closed today.

Two real defects remain, and neither is new.

**FAIL 9 — the 40-turn ceiling still costs the brief a whole day.** 2 of 15
days (09-22, 09-26) produced the brief and then failed the cap, so `deliver`
was skipped. *Most likely cause:* `routine-marjorie-brief.yml`'s `run` job
passes no `max_turns`, so it inherits `routine-template.yml`'s default of 40,
and `deliver` is gated on `needs.run.result == 'success'`. *Smallest fix:*
pass `max_turns: 80` on the brief's `run` job (one line), or gate `deliver`
on the artifact existing rather than the job conclusion. This is #4559's
exact class, and #4559 is now closed with a founder's "assign" — but the
brief's own cap was never raised. Note it has not recurred since 09-26.

**FAIL 11 — the routine still cannot `git push`.** `routine-template.yml:175`
caps every caller at `contents: read`. MR1's twelve-reports-zero-landings
problem is worked around (Contents API), not fixed. #4462, open 10 days.

**Not BLOCKED.** Nothing posted without approval, no `social-draft` PR was
touched, and the approval gate is not implicated anywhere in this window.

**One live ops gap worth a founder's eye, found while checking M7:** watchdog
alert **#4591** ("Chat reply stuck · Tree · 1553946010693144687") has been
**OPEN since 09-28** — six days. The M7 stuck-reply alarm fired correctly;
nothing resolved it. That is the one row where Marjorie is accountable for an
outcome and the outcome did not arrive.

### Plan edits (made in this PR)

1. **MR2 → `reported`.**
2. **Check 9 re-keyed, for the third time.** The marker moved twice —
   `discord-message-id` comments on the brief issue (retired 10-01), then
   `discord-message-id:` in the deliver log (retired 10-02 by the status
   page). Any future delivery check must key on **`status ping: sent`** in
   the deliver log plus the day's `status note: ping stamped on #<n>` line.
   Recorded here so a fourth checkpoint does not re-learn it.
3. **Check 10 retired, not carried.** The "From Marjorie" Monday section is
   dead by design: M6 answers and closes Marjorie→Tree asks in minutes
   (#4724, 10 min), so the Monday backlog it was meant to render is always
   empty. Carrying it forward would guarantee a FAIL that means nothing.
   The loop's real health metric is ask→answer latency, which is excellent.
4. **No new observation checkpoint.** MR1 cost twelve Opus runs to restate
   one answer; MR2's residuals are both tracked on open issues (#4462, and
   the brief cap as a sibling of #4559) and belong in the normal issue
   funnel, not in a daily gate. **MR3 (2027-08-13, doorbell key renewal)
   stays pending** — it must outlive the epic.
5. **#4180: close it.** M0–M8 built and proven; the goal state in PLAN.md is
   met. The three residuals above are ordinary open issues.

### Follow-up session prompt

```
Model: Sonnet (mechanical — two one-line workflow edits, no judgment)
Repo: JW-Incorporated/swift2 · branch fix/routine-turn-caps-and-template-write

Two independent one-line fixes, one PR.

1. .github/workflows/routine-template.yml line 175 declares `contents: read`.
   Reusable-workflow permissions are the INTERSECTION of caller and callee,
   so this demotes every calling routine — including
   plan-recheck-marjorie.yml, which declares `contents: write` and still
   403s on `git push` ("Permission to JW-Incorporated/swift2.git denied to
   github-actions[bot]"). Change it to `contents: write`. This is issue
   #4462, open since 2026-09-23.

2. .github/workflows/routine-marjorie-brief.yml: the `run` job passes no
   `max_turns`, so it inherits routine-template.yml's default of 40. Runs
   35724597868 (09-22) and 36240546249 (09-26) each produced the brief and
   then failed the cap, so the `deliver` job — gated at line ~106 on
   `needs.run.result == 'success'` — was skipped and nothing reached the
   founder. Pass `max_turns: 80` on that job (routine-tree-weekly-plan.yml
   did exactly this in PR #4293).

Verify: `node -e "const y=require('fs').readFileSync('.github/workflows/routine-template.yml','utf8'); console.log(/contents: write/.test(y))"`
then `npm run typecheck --workspace=@swift2/web` and the full suite. Do NOT
dispatch either workflow to test it — the next scheduled run is the test.

Hard rules: no `git restore` / `git checkout --` / `git reset --hard` /
`git clean`; never run scripts/social/post-queue.mjs or delete-media.mjs;
never hand-write an `approval` object or merge a social-draft PR. BOTH of
these touch a workflow that gates agent runs — get a codex:rescue review
(with `--background`, read the result via `codex-companion.mjs result <id>`)
before opening the PR. Founders flip variables and secrets, not you.
```

### Second follow-up (separate, judgment)

```
Model: Opus (judgment — a live ops alert nobody resolved)
Repo: JW-Incorporated/swift2

Watchdog alert #4591, "Chat reply stuck · Tree · 1553946010693144687", has
been OPEN since 2026-09-28. The M7 stuck-reply alarm fired as designed
(docs/specs/marjorie-overhaul/m7-doorbell.md: a reply stuck 6 min adds ⚠️
and opens an alert); nothing resolved it in six days. Separately, Marjorie
chat runs 37055196009 and 37055258752 (both 2026-10-02T19:36, message ids
...731530989591 and ...880978362459) FAILED after logging
`replied in 313s`, which is inside the 6-min alarm window but far above the
123–176s the other four runs in the window took.

Find out whether these are one mechanism or two, then decide: does the ops
routine's handler table have a row that should have closed #4591, or is
"chat reply stuck" a class Marjorie cannot act on and the alarm should route
somewhere else? Write the answer on #4591 and either close it with the fix
or file the build-desk issue. Do not dispatch the chat routines to
reproduce — read the run logs.

Hard rules: no `git restore` / `reset --hard` / `clean`; never run
post-queue.mjs or delete-media.mjs; Codex review on any poller/poster/gate
change; founders flip variables.
```
