# Tracker

One row per work item. The project-manager session updates the Status, PR and Done columns as work lands, and mirrors the same values into the dashboard's `tracker` store. Status values: doing, doing, review, done, blocked, dropped (reason in the Log; mirrored to the dashboard as done with a note).

## P0 Stop the bleeding and measure

Goal: No more lost runs to the weekly limit, no CI storm, poster green, Awin sync finishes, push path safe, owner decisions recorded, baseline numbers captured.

Done when: Routines skip cleanly while the limit is hit and a single named alert exists; open social-poster state PRs <= 1; social-poster last 5 runs green; merch-awin-sync completes and saves its cache; held current_item rows emit no events; turn ledger JSON exists for the past 7 days; decisions D1 to D9 recorded in docs/decisions.md; TYPESAFE_API_KEY exists as doing |  |  || #5823 |  || #5822 |  || #5821 |  || #5818, #5817 | 2026-10-14 || #5816 | 2026-10-14 |Actions secret.

| Item | Title | Owner | Effort | Lane | Depends on | Status | PR | Done |
|---|---|---|---|---|---|---|---|---|
| P0-01 | Weekly-limit detection, one named alert and automatic pause | codex | M | L-ROUTINES | - | review | #5825 |  |
| P0-02 | Emergency model and cadence cuts plus all P0 clock-table edits | executor-claude-sonnet | S | L-ROUTINES | P0-01 | doing |  |  |
| P0-03 | Make draft-happy-path.test.ts hermetic and fix the CI paths filter | executor-claude-sonnet | S | L-SOCIAL | - | done | #5816 | 2026-10-14 |
| P0-04 | Unstick the 10-11 Instagram/X pair, reconcile the ledger, close the stale state PRs | executor-claude-sonnet | S | L-SOCIAL | P0-03 | review | #5824 |  |
| P0-05 | One rolling state PR and failure metadata for the poster | executor-claude-sonnet | S | L-SOCIAL | P0-04 | todo |  |  |
| P0-06 | Verify the X 403 claim (read-only) | executor-claude-sonnet | S | L-READONLY | - | done |  | 2026-10-14 |
| P0-07 | Measurement baseline: turn ledger, metered usage, clock fire rate | codex | M | L-OBS | - | review |  |  |
| P0-08 | Interim Facebook card link and mailer parity | codex | S | L-COMMUNITY | - | done | #5822 | 2026-10-14 |
| P0-09 | Repair merch-awin-sync (hang, lost cache, churn PRs) | codex | M | L-MERCH | - | review | #5821 |  |
| P0-10 | Fan-made discovery: scheduled runs actually file candidates | codex | S | L-MERCH-FAN | - | review | #5823 |  |
| P0-11 | Push safety before any automatic push | codex | M | L-NOTIFY | - | review |  |  |
| P0-12 | Worker Haiku 4.5 to Haiku 5.5 | codex | S | L-WORKER | - | dropped |  |  |
| P0-13 | Owner decision session (D1 to D9) | OWNER DECISION | S | L-OWNER | - | done |  | 2026-10-14 |
| P0-14 | Record decisions and draft the ruling PRs | claude-opus | S | L-DOCS | P0-13 | done | #5818, #5817 | 2026-10-14 |
| P0-15 | Jev key into a GitHub Actions secret | OWNER ACTION | S | L-OWNER | - | todo |  |  |
| P0-16 | Hermes session: confirm Tree and Marjorie loops, decide #5484 go-live | hermes-session | S | L-HERMES | - | todo |  |  |
| P0-17 | Dashboard corrections and the Plan and Tracking tabs | executor-claude-sonnet | M | L-DASH | - | done |  | 2026-10-14 |
| P0-18 | Anthropic Console monthly spend cap for the metered key | OWNER ACTION | S | L-OWNER | P0-13 | dropped |  |  |
| P0-19 | Backup-token switch: routines fall back to CLAUDE_CODE_OAUTH_TOKEN_BACKUP when the primary hits its weekly limit (no-op until the secret exists) | codex | S | L-ROUTINES | P0-01 | todo |  |  |

## P1 Foundations and re-homing

Goal: Jev client, seen store, Tidewatch collector and shadow classifier running; Claude burn moved off routing and single-shot drafting; Reddit read from home; Facebook permalinks; Vault Run split; merch matcher real; theories flowing.

Done when: Tidewatch shadow has logged >= 7 days and >= 500 decisions; estimated weekly OAuth turns down >= 50 percent vs baseline in the turn ledger; >= 90 percent of new Reddit cards carry title, age and engagement; >= 80 percent of new Facebook leads carry a post permalink; E6 merged >= 3 matched products in one week; theory miner finds > 0 theories on >= 5 of 7 days.

| Item | Title | Owner | Effort | Lane | Depends on | Status | PR | Done |
|---|---|---|---|---|---|---|---|---|
| P1-01 | Jev client library | codex | M | L-JEV | P0-15 | doing |  |  |
| P1-02 | Seen store, decision ledger and story timeline tables | codex | M | L-DB | P0-14 | doing |  |  |
| P1-03 | Taxonomy, question bank and thresholds config | claude-opus | S | L-TIDE-SPEC | P0-14 | doing |  |  |
| P1-04 | Replay set and labels for calibration | executor-claude-sonnet | M | L-TIDE-EVAL | P1-03 | todo |  |  |
| P1-05 | Tidewatch collector (pull adapters over existing stores) | codex | L | L-TIDE | P1-02 | todo |  |  |
| P1-06 | Tidewatch classifier in shadow mode | codex | L | L-TIDE | P1-01, P1-03, P1-05, P1-09 | todo |  |  |
| P1-07 | tidewatch.yml on the home clock with a freeze switch | codex | S | L-OPS | P1-06, P0-02, P0-07 | todo |  |  |
| P1-08 | Worker primary-source fast mode and official source list | codex | M | L-WORKER | P0-14 | todo |  |  |
| P1-09 | Shared Claude wrapper on subscription tokens (Claude Code headless): priority, caps, backup-token fallback (rescoped by D1 revised; Fable consult before brief) | codex | M | L-LLM | P1-01, P0-19 | todo |  |  |
| P1-10 | Answerers become scripted drafters with thread context | executor-claude-sonnet | M | L-COMMUNITY | P1-09, P1-01 | todo |  |  |
| P1-11 | marjorie-ops becomes code plus a Jev gate | codex | M | L-ROUTINES | P1-01, P0-02 | todo |  |  |
| P1-12 | marjorie-status-reply and kevin-radar to Jev plus code | codex | M | L-ROUTINES-B | P1-01 | todo |  |  |
| P1-13 | Codex worker on joey2023 and Austin retirement | codex | L | L-HOME-CODEX | P0-14 | dropped |  |  |
| P1-14 | Community engagement columns and outcome table | codex | S | L-DB | P1-02 | todo |  |  |
| P1-15 | Home Reddit reader on joey2023 | codex | L | L-HOME-REDDIT | P1-14, P0-14 | todo |  |  |
| P1-16 | Facebook export: permalinks, engagement counts, activity log, daily cadence | codex | L | L-FBEXT | P0-14, P1-14 | todo |  |  |
| P1-17 | Better Reddit and Facebook cards | executor-claude-sonnet | S | L-COMMUNITY | P1-10, P1-15 | todo |  |  |
| P1-18 | Vault Run split into judgment and craft jobs with yield records | executor-claude-sonnet | M | L-VAULT | P0-01, P0-02 | todo |  |  |
| P1-19 | Merch E6 for real: matcher, step-4 writer, E3 gate, schedule | codex | L | L-MERCH | P0-09, P0-14, P1-09 | todo |  |  |
| P1-20 | Fan-made merch auto-curation lane | codex | M | L-MERCH-FAN | P0-10, P1-01, P1-09 | todo |  |  |
| P1-21 | Theory yield: full threads, skip mined bundles, cheaper miner, promote at 2 | codex | M | L-THEORY | P1-15, P1-01 | todo |  |  |
| P1-22 | New-on-site feed for social | executor-claude-sonnet | S | L-SOCIAL | P0-05 | todo |  |  |
| P1-23 | Media gate gap audit and fixes | codex | M | L-MEDIA | - | todo |  |  |
| P1-24 | Voice critic module and exemplar corpus | executor-claude-sonnet | M | L-VOICE | P1-09 | todo |  |  |
| P1-25 | Hermes session: Tree reads the new-on-site feed and breaking flag | hermes-session | S | L-HERMES | P1-22, P0-16 | todo |  |  |
| P1-26 | Owner home-machine setup (one sitting) | OWNER ACTION | S | L-OWNER | P1-13, P1-15, P1-16 | todo |  |  |
| P1-27 | Owner affiliate accounts (whenever ready, blocks nothing) | OWNER ACTION | S | L-OWNER | - | todo |  |  |
| P1-28 | Move the existing ANTHROPIC_API_KEY callers (news-worker extract/theory/dedupe, theory-miner, merch audit) onto the P1-09 wrapper on Haiku 5.5 (absorbs P0-12) | codex | M | L-WORKER | P1-09 | todo |  |  |

## P2 Tidewatch live

Goal: Every class routes automatically; critical news reaches site, push and social within 60 minutes after code fact-check; a retraction path exists; duplicates feed the theory database; merch branches wired.

Done when: Breaking drill: 5 historical critical events replayed reach site in <= 45 min (dry run) with 0 false positives on 200 replayed non-critical items; all non-critical classes live; critical site and push live; personal-life live only after the owner signs the ruling; retraction drill passes.

| Item | Title | Owner | Effort | Lane | Depends on | Status | PR | Done |
|---|---|---|---|---|---|---|---|---|
| P2-01 | Shadow calibration review and per-class go/no-go | claude-opus | S | L-TIDE-SPEC | P1-06, P1-04, P1-07 | todo |  |  |
| P2-02 | Action router | codex | L | L-TIDE | P1-06 | todo |  |  |
| P2-03 | Fact-check module in code | codex | L | L-FACT | P1-01, P1-08, P1-09 | todo |  |  |
| P2-04 | Breaking path to the site with on-demand revalidation | codex | M | L-WEB | P2-03, P0-11, P1-23 | todo |  |  |
| P2-05 | Breaking and Baby Watch push categories | executor-claude-sonnet | M | L-NOTIFY | P0-11, P0-14 | todo |  |  |
| P2-06 | Breaking social fast path | executor-claude-sonnet | M | L-SOCIAL | P0-14, P1-24, P2-03, P0-05 | todo |  |  |
| P2-07 | Retraction path: site and push | codex | M | L-FACT | P0-11 | todo |  |  |
| P2-08 | Retraction path: social | executor-claude-sonnet | M | L-SOCIAL | P2-07, P2-06 | todo |  |  |
| P2-09 | Normal flow wiring and news-triage retirement | executor-claude-sonnet | M | L-SOCIAL | P2-02 | todo |  |  |
| P2-10 | Duplicate harvest into theory signals | codex | M | L-THEORY | P2-02, P1-21 | todo |  |  |
| P2-11 | Merch branch wiring | codex | S | L-MERCH | P2-02, P1-19, P1-20 | todo |  |  |
| P2-12 | Breaking and retraction drill | claude-opus | M | L-TIDE-SPEC | P2-03, P2-04, P2-05, P2-06, P2-07 | todo |  |  |
| P2-13 | Staged go-live by class | claude-opus | M | L-TIDE-SPEC | P2-01, P2-02, P2-12 | todo |  |  |
| P2-14 | Owner merges the guardrails and spec PR | OWNER ACTION | S | L-OWNER | P0-14 | todo | #5817 |  |

## P3 Measure, tune and grow

Goal: Outcomes for goals 8 and 9 measured; recall measured; voice scored; caps raised where quality holds; weekly scorecard automatic.

Done when: Scorecard JSON written weekly by code for all 11 goals; outcome rows exist for >= 90 percent of posted comments; recall audit runs weekly; Jev vs Haiku drift monitor live.

| Item | Title | Owner | Effort | Lane | Depends on | Status | PR | Done |
|---|---|---|---|---|---|---|---|---|
| P3-01 | Outcomes reader live with automatic comment capture | codex | M | L-HOME-REDDIT | P1-15, P1-14 | todo |  |  |
| P3-02 | Thread ranking v2 from outcomes | executor-claude-sonnet | M | L-COMMUNITY | P3-01 | todo |  |  |
| P3-03 | Weekly recall audit | codex | M | L-RECALL | P1-05, P1-06 | todo |  |  |
| P3-04 | Weekly scorecard collector | codex | M | L-OBS | P0-07, P1-02, P3-01 | todo |  |  |
| P3-05 | Voice weekly sample and owner rating loop | executor-claude-sonnet | S | L-VOICE | P1-24 | todo |  |  |
| P3-06 | Drift monitor and Jev 1.14 evaluation | codex | S | L-TIDE | P2-13 | todo |  |  |
| P3-07 | Raise caps where quality holds | claude-opus | S | L-VAULT | P3-04 | todo |  |  |
| P3-08 | GitHub Reddit scan to automatic fallback only | codex | S | L-COMMUNITY | P1-15 | todo |  |  |
| P3-09 | Funding pool review | claude-opus | S | L-DOCS | P3-04 | todo |  |  |

## Decisions (P0-13: Joey in chat, 2026-10-14 21:05 to 21:13 PDT)

| Id | Answer |
|---|---|
| D1 | REVISED by Joey: no Anthropic API at all. Every model call runs on Joey's Claude subscription (OAuth) through Claude Code; news worker and breaking checks get first claim; automatic switch to a backup subscription token `CLAUDE_CODE_OAUTH_TOKEN_BACKUP` (HA #127) when the primary hits its weekly limit. Jev prepaid for routing and Codex for building are unchanged. Existing API-key callers migrate (P1-28). P0-18 and the spend-cap answer are moot. |
| D2 | Codex for this build only. Austin stays a Claude routine (P0-02 still moves it to Opus 5.5 M/W/F); P1-13 dropped; no root rule-j amendment needed (OPERATING-MODE already makes Codex the programme's builder). |
| D3 | As recommended: home Reddit reader on joey2023 (anonymous, read-only, slow), GitHub RSS as automatic fallback. |
| D4 | As recommended: confirmed critical work news auto-publishes after the code fact-check and the Sonnet verifier agree; kill window and freezes; staged go-live after a drill Joey sees. |
| D5 | As recommended: confirmed-only personal life on the site and an opt-in "Baby Watch: official announcements only" push; no rumor, countdown or clue content; theory ban stays; owner merges the rules PR; goes live last. |
| D6 | As recommended: breaking campaign type, up to 2 extra posts per platform per day, one Sonnet draft, tree-auto stamp, immediate dispatch, IG and X paired. |
| D7 | As recommended: store post permalinks and read the owner's activity log (no names or quotes); daily for the top 3 groups, weekly for the rest. |
| D8 | As recommended: E6 twice weekly, $3 per run cap, 5 paid searches; weekly fan-made auto-curation; no typed confirmation on schedule. Model calls in E6 now run on the subscription (D1 revised). |
| D9 | Merge #5484 once a Hermes session confirms both loops (HA #125). |
| Open Q2 | joey2023 may run home tasks 24/7. |
| Open Q3 | $50 a month metered ceiling chosen, then made moot by D1 revised. |

## Log

- 2026-10-14 21:15 PM: D1 to D9 recorded above. HA #124 to #127 filed. Reversible calls: P0-12 folded into new P1-28 (the worker leaves the API key, so the model swap rides the migration); P1-08 no longer waits on P0-12; new P0-19 backup-token switch after P0-01; P1-09 rescoped to a subscription wrapper, with a Fable consult before it is briefed (§4, a change to the funding and verifier path); P0-18 and P1-13 dropped; no `docs/projects/tidewatch/` copy (the plan already lives in this folder). This branch is based on the plan branch while #5813 auto-merges.

- 2026-10-14 21:25 PM: wave 1 dispatched, 5 in flight. Codex (sol high, worktrees under %LOCALAPPDATA%\longlive-wt): P0-01, P0-09. Claude: P0-14 (executor, Opus), P0-03 (executor, Sonnet), and a grunt fixing the failing checks on plan-docs PR #5813 (build-full, CodeQL), which also blocks this branch's PR #5815. Flow for every item: worker pushes its branch, a Claude reviewer reviews the branch, then the reviewer opens the PR and arms auto-merge. Heartbeat cron armed at :13 and :43 (session-only).

- 2026-10-14 21:24 PM: #5813 red fixed by grunt (eslint ignore for `docs/plans/**/dashboard/**`, a7e97fc6f; CodeQL regex `i` flag in dashboard/build.mjs, e4cdb2358); CI rerun pending. P0-11 dispatched (Codex sol xhigh). Call: P0-11's second opinion is an adversarial Claude reviewer, not `codex:rescue`, because Codex wrote it (a Codex second opinion would be self-review).
- 2026-10-14 21:27 PM: P0-03 reviewer APPROVE → PR #5816, auto-merge armed (verified). Post-merge: confirm a social-only PR runs build-content, then `gh pr update-branch` armed PRs (ci.yml change). P0-07 dispatched (Codex sol medium). P0-17 marked done: the planning session already published Artifact v4 with the Plan and Tracking tabs, target flow and corrections (jsdom smoke, per STATE.md 21:40); the store write path is proven by this session's ArtifactData writes. Follow-up only: the Decisions tab does not show Joey's answers yet.
- 2026-10-14 21:30 PM rulings on Codex stops (all resumed in-session): (a) tests use the repo's `scripts/**/*.test.ts` convention, never edit vitest.config.ts (P0-01, P0-07); (b) the `sync:content` side effect on docs/audits/theory-resolutions.md is never committed and is not a tripwire; stage by explicit path; (c) P0-07: the ops-ledger workflow uploads budget.json as an artifact plus a step summary instead of opening a PR, because the content auto-merge gate (branch prefix + author allowlist) is not worth widening for a weekly report; P3-04 decides how reports land. P0-14 pushed both branches → reviewer running. P0-14 follow-ups logged for later items: P2-06 must run as the committed Tree identity for the tree-auto stamp (guardrail 1); P1-16 must respect the existing 80-char Facebook excerpt rule; P2-04/P2-05: with the 15-minute Vercel push cron the 5-minute kill window is a minimum (worst case about 20 minutes); P1-02's PR writes the Tidewatch data-model decisions.md entry and P1-08's writes the widened OFFICIAL_DOMAINS entry.
- 2026-10-14 21:33 PM: P0-14 review: rulings branch APPROVE → PR #5817 (label founder-decision, no auto-merge; HA #128 filed for the owner). Decisions branch REQUEST CHANGES (D7 wording must keep the 2026-10-04 80-char excerpt and 2026-08-25 hashed-authors rules) → exact reviewer text sent back to the executor, who lands it (round 2 = verbatim application of the reviewer's text). Call: the spec's "agents may switch PUSH_FREEZE on; only the owner lifts it" stays, because it matches the existing SOCIAL_FREEZE on-only convention. Merged the plan-branch CI fixes into this branch so #5815 can go green.
- 2026-10-14 21:38 P0-06 FINDING: no X 403 found in 200 social-poster runs (Oct 11 to 14; 5 logs read; runs before Oct 9 unchecked). Both halves of the 2026-10-11 speaknow-million-week pair POSTED in run 38184243025 at 2026-10-11T23:26:07Z (X post id 2109425402762682594; IG 18107359273946758); records verified on origin/social-ledger social/posted/ (PM spot-check). Real failure loop: the queue files stayed in social/queue/ (fold-back state PRs never merged), so every run since Oct 12 23:06Z skipped them as already posted and raised "blocked >24h"; on Oct 14 the poster also wrote a social/failed record for the IG half that did post. Implication for P0-04: nothing needs re-posting; remove both queue files, keep both posted records, drop the stray failed IG record. Side finding filed as #5820: the FB Page cross-post fails on every post (publish_actions deprecated).
- 2026-10-14 21:42 PM: P0-09 reviewer APPROVE → PR #5821, auto-merge armed (verified). Follow-up after it merges (L-MERCH, small Codex item): advertiser-map PR step gets `if: ${{ !cancelled() }}`; add an FTS rollback-path test (zero-row guard); budget check inside a single huge feed. `gpt-5.3-codex-spark` returns 400 on this ChatGPT-account Codex, so trivial items run on `gpt-5.6-sol` low (P0-08 relaunched, P0-10 dispatched).
- 2026-10-14 21:47 PM: P0-01 review round 1 REJECT (blocker: template `issues: write` exceeds some callers' permissions → startup_failure; limit-gate throws on API errors; limit-hit text match ignores is_error; MAP.md filename). Round 2 (final) sent to the same Codex session: add `issues: write` to every routine caller + a check:routines invariant, fail-open gate, require is_error, issue dedupe. A round-2 reject means DEBUG.md and the debug ladder. P0-11 resumed: sync:content before gates, report how migrations reach production (its router fails closed without the new table, so merge order matters).
- 2026-10-14 21:55 PM: MERGED (verified): #5813 plan docs, #5816 P0-03, #5818 P0-14 decisions, #5821 P0-09. #5815 had an add/add conflict on tracker.md (main held the untouched original, verified identical to 8fc7b00cf) → kept the PM version, merged main, pushed. P0-08 APPROVE → #5822 armed. P0-10 APPROVE → #5823, but auto-merge DISABLED by the PM: no per-run issue cap, so the first live run could spam issues; Codex is adding a cap of 10 (round 2), then re-arm. P0-11: gates green after sync:content except one branch-specific test (apps/mobile/lib/notification-link-producers.test.ts fixtures were non-servable) → fixture fix authorized; migrations reach prod via .github/workflows/db-migrate.yml on main changes under supabase/migrations/**. Open question for its review: whether a freeze defers or drops events, and the deploy-vs-migration race. P0-09 live acceptance: dispatched merch-awin-sync run 38683186140 (check: success in under 30 min, cache entry saved, then a no-change rerun opens no PR). P0-14 done (decisions merged; the rulings PR #5817 is the owner's, HA #128). P0-04 dispatched (Claude executor; reviewer before any bulk PR closing). Removed merged worktrees p0-03, p0-09, p0-14, fix-5813 (disk 90 GB free).
- 2026-10-14 22:00 PM: P0-04 reviewer APPROVE → #5824 armed (two queue deletions only; the poster reads posted from social-ledger and never reads social/failed). Call: leave the stray social-ledger `social/failed/2026-10-11-speaknow-million-week-ig.json` (and a stale ledger copy of the X queue file) in place: functionally inert, and pushing to the live ledger branch races the poster. Metrics caveat: P3-04's scorecard must not count it as a failure. After #5824 merges, the P0-04 executor closes all 163 social-poster/state-* PRs (branches kept), including #5819 (red, carries the stray record). P0-10 cap (10 per run) pushed 01b4989d8 → round-2 check running; re-arm #5823 on APPROVE.
- 2026-10-14 22:05 PM: P0-10 round 2: the reviewer (Haiku) said REJECT because `FANMADE_MAX_ISSUES_PER_RUN` of `0` or empty means file nothing. PM OVERRIDE, both views recorded: this fails safe (nothing filed; the overflow is logged as capped), the variable is set nowhere (default 10), and a third round would breach the two-round rule for a non-defect → #5823 re-armed at 01b4989d8. P0-11: full suite green (12,200), and freeze DEFERS events (router returns before selecting). Finding: after a long freeze, stale events would send (expiry defaults to 30 days) → PM added a 3h staleness cutoff (expire, don't send) to P0-11 before review; a reversible safety refinement of PUSH_FREEZE, not a change to the publish bar. ARCHITECT INVOCATION #1 (mandatory, §4: design change): Fable consulted on the D1-revised wrapper (P1-09), the verifier-unavailable publish path, and P1-06/P1-28/P1-04/P0-19 impacts. Pulling P1 items with met dependencies forward is a PM sequencing call (P1-01 can be built against mocks before the Jev key lands; live acceptance after HA #124).
- 2026-10-14 22:08 ARCHITECT #1 RESULT (Fable; the PM agrees, so no disagreement to surface). P1-09 becomes a thin `claude -p` runner (`scripts/lib/claude-call.mjs`: `callClaude({caller, priority P0-P3, model, system, user, schema, maxInputTokens})` returning ok, capped, unavailable or invalid; never throws; flags `--max-turns 1 --output-format json`, tools off, no session persistence; CLI flags must be verified against the installed version). claude-code-action per call is rejected (30-60 s harness per step). Token choice lives in one shared `claude-token.mjs` = P0-19, used by routines and P1-09: primary until the limit is detected (also the 5-hour window), then the backup for P0 and P1 callers only; P2 and P3 pause until the reset. Both exhausted → `unavailable`, recorded on the P0-01 issue, callers hold. llm_usage unit = tokens per model plus calls, reported as SET, not dollars. P2-03: verifier `unavailable` → HOLD, route to the owner queue with a loud Discord ping, and record the SLA miss in story_timeline (never publish on the code check alone, never use Jev as the verifier: D4's AND stands). P1-06: batch uncertain items N per call (the CLI system prompt overhead is about 10K tokens a call, to verify) and cap the escalation rate. P1-28 lands before the P1-06 shadow starts so the week-1 ledger is honest. P1-04: no Batch API; label in about 25-item chunks right after a reset. Top risks: (1) harness overhead burns the limit faster than estimated (week-1 signal: usage.input per 2K-token prompt above about 5K); (2) the terms risk of driving two subscriptions from one automation (already told Joey; his call before HA #127); (3) end-of-week verifier starvation holds breaking news, so measure how often `unavailable` fires. Item edits: P0-19 = the token primitive (P1-09 depends on it); P1-09 drops cache_control and MAX_RUN_COST_USD and adds per-run max calls.
- 2026-10-14 22:10 PM: migrations are one lane (L-DB). The llm_usage table moves from P1-01 into P1-02's migration, so P1-01 (Jev client) builds with an injected usage logger and no migration, and the two run in parallel. P1-01 and P1-02 pulled forward (dependencies met; P1-01 live acceptance waits for HA #124).
- 2026-10-14 22:15 HB: #5822 (P0-08) MERGED → done. P0-09 live acceptance: run 38683186140 succeeded in 4.6 min (it used to time out at 45), cache entry merch-awin-sync-38683186140 saved, no Awin PR opened; no-change rerun 38684071906 dispatched (expect success and no PR). P0-07 stopped on the ~400-line tripwire (665 lines, 232 of them generated budget.json) → ruled: it's a medium item, so no budget.json commit; baseline copied to the scratchpad. #5815 waiting on build-full.
- 2026-10-14 22:20 PM: P0-01 round 2 APPROVE → #5825 armed (29 callers checked; nits: plan-recheck*.yml sit outside the invariant; the gate reads the oldest issue only). After it merges: `gh pr update-branch` the armed PRs (template change), then P0-02, then P0-19 (L-ROUTINES, sequential). P0-11 (stale cutoff 3h added, suite 12,203) → adversarial reviewer on Opus. P0-07 pushed 35a22a16c → reviewer. MEASURED BASELINE (7 days, from P0-07's live dry run; NOT yet verified): Marjorie site ops 170 runs, 3,308 turns, 58 limit failures; Vault Run 8 runs, 685 turns, 3 limit failures; ops-fixer 10, 582; Community Answerer 7, 220; Marjorie ask-response 28, 195, 23 limit failures; Founders' Brief 7, 178; Tree weekly plan 2, 168; Tree daily draft 7, 140; News Triage 7, 131; Kevin desk 7, 113. Clock: bot-chat-poll 10 actual vs 576 expected in 48 h, which contradicts marjorie-ops' run count, so the P0-07 reviewer must explain it. Implication: marjorie-ops is about 55 percent of measured routine turns, so P0-02 (every 3 h, max_turns 40) and P1-11 (code plus Jev gate) are the biggest levers. P1-03 dispatched (Claude executor, Opus).

## Next actions

1. On each completion: dispatch a `reviewer` on the pushed branch (it opens the PR with TL;DR and arms auto-merge if clean; P0-14's rulings PR gets label `founder-decision`, no auto-merge, then file HA for OA-7).
2. When #5813 is green and merged: `git merge origin/main` here; check #5815 lands.
3. Next to dispatch as slots free (lanes free): P0-11 (Codex sol xhigh, plus `codex:rescue --background` second opinion), P0-17 (dashboard: build HTML with an agent, PM publishes), P0-06 (researcher, read-only), P0-07 (Codex sol medium), P0-08 (Codex spark low), P0-10 (Codex spark low); after P0-01 merges: P0-02 (executor Sonnet) then P0-19 (Codex). After any ci.yml or routine-template change merges: `gh pr update-branch` the armed PRs.
4. Post-merge live acceptance (step 6): P0-01 (kevin-radar dispatch with a test limit issue), P0-09 (awin dispatch under 30 min, cache entry, no-change rerun opens no PR), P0-03 (next social state PR runs build-content).
5. Before briefing P1-09: Fable (`architect`) consult on the D1-revised wrapper (subscription headless calls, priority, fallback token, verifier availability at the limit); log it here and in STATE.md.

