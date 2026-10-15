# Tracker

One row per work item. The project-manager session updates the Status, PR and Done columns as work lands, and mirrors the same values into the dashboard's `tracker` store. Status values: todo, doing, review, done, blocked.

## P0 Stop the bleeding and measure

Goal: No more lost runs to the weekly limit, no CI storm, poster green, Awin sync finishes, push path safe, owner decisions recorded, baseline numbers captured.

Done when: Routines skip cleanly while the limit is hit and a single named alert exists; open social-poster state PRs <= 1; social-poster last 5 runs green; merch-awin-sync completes and saves its cache; held current_item rows emit no events; turn ledger JSON exists for the past 7 days; decisions D1 to D9 recorded in docs/decisions.md; TYPESAFE_API_KEY exists as an Actions secret.

| Item | Title | Owner | Effort | Lane | Depends on | Status | PR | Done |
|---|---|---|---|---|---|---|---|---|
| P0-01 | Weekly-limit detection, one named alert and automatic pause | codex | M | L-ROUTINES | - | todo |  |  |
| P0-02 | Emergency model and cadence cuts plus all P0 clock-table edits | executor-claude-sonnet | S | L-ROUTINES | P0-01 | todo |  |  |
| P0-03 | Make draft-happy-path.test.ts hermetic and fix the CI paths filter | executor-claude-sonnet | S | L-SOCIAL | - | todo |  |  |
| P0-04 | Unstick the 10-11 Instagram/X pair, reconcile the ledger, close the stale state PRs | executor-claude-sonnet | S | L-SOCIAL | P0-03 | todo |  |  |
| P0-05 | One rolling state PR and failure metadata for the poster | executor-claude-sonnet | S | L-SOCIAL | P0-04 | todo |  |  |
| P0-06 | Verify the X 403 claim (read-only) | executor-claude-sonnet | S | L-READONLY | - | todo |  |  |
| P0-07 | Measurement baseline: turn ledger, metered usage, clock fire rate | codex | M | L-OBS | - | todo |  |  |
| P0-08 | Interim Facebook card link and mailer parity | codex | S | L-COMMUNITY | - | todo |  |  |
| P0-09 | Repair merch-awin-sync (hang, lost cache, churn PRs) | codex | M | L-MERCH | - | todo |  |  |
| P0-10 | Fan-made discovery: scheduled runs actually file candidates | codex | S | L-MERCH-FAN | - | todo |  |  |
| P0-11 | Push safety before any automatic push | codex | M | L-NOTIFY | - | todo |  |  |
| P0-12 | Worker Haiku 4.5 to Haiku 5.5 | codex | S | L-WORKER | - | todo |  |  |
| P0-13 | Owner decision session (D1 to D9) | OWNER DECISION | S | L-OWNER | - | todo |  |  |
| P0-14 | Record decisions and draft the ruling PRs | claude-opus | S | L-DOCS | P0-13 | todo |  |  |
| P0-15 | Jev key into a GitHub Actions secret | OWNER ACTION | S | L-OWNER | - | todo |  |  |
| P0-16 | Hermes session: confirm Tree and Marjorie loops, decide #5484 go-live | hermes-session | S | L-HERMES | - | todo |  |  |
| P0-17 | Dashboard corrections and the Plan and Tracking tabs | executor-claude-sonnet | M | L-DASH | - | todo |  |  |
| P0-18 | Anthropic Console monthly spend cap for the metered key | OWNER ACTION | S | L-OWNER | P0-13 | todo |  |  |

## P1 Foundations and re-homing

Goal: Jev client, seen store, Tidewatch collector and shadow classifier running; Claude burn moved off routing and single-shot drafting; Reddit read from home; Facebook permalinks; Vault Run split; merch matcher real; theories flowing.

Done when: Tidewatch shadow has logged >= 7 days and >= 500 decisions; estimated weekly OAuth turns down >= 50 percent vs baseline in the turn ledger; >= 90 percent of new Reddit cards carry title, age and engagement; >= 80 percent of new Facebook leads carry a post permalink; E6 merged >= 3 matched products in one week; theory miner finds > 0 theories on >= 5 of 7 days.

| Item | Title | Owner | Effort | Lane | Depends on | Status | PR | Done |
|---|---|---|---|---|---|---|---|---|
| P1-01 | Jev client library | codex | M | L-JEV | P0-15 | todo |  |  |
| P1-02 | Seen store, decision ledger and story timeline tables | codex | M | L-DB | P0-14 | todo |  |  |
| P1-03 | Taxonomy, question bank and thresholds config | claude-opus | S | L-TIDE-SPEC | P0-14 | todo |  |  |
| P1-04 | Replay set and labels for calibration | executor-claude-sonnet | M | L-TIDE-EVAL | P1-03 | todo |  |  |
| P1-05 | Tidewatch collector (pull adapters over existing stores) | codex | L | L-TIDE | P1-02 | todo |  |  |
| P1-06 | Tidewatch classifier in shadow mode | codex | L | L-TIDE | P1-01, P1-03, P1-05, P1-09 | todo |  |  |
| P1-07 | tidewatch.yml on the home clock with a freeze switch | codex | S | L-OPS | P1-06, P0-02, P0-07 | todo |  |  |
| P1-08 | Worker primary-source fast mode and official source list | codex | M | L-WORKER | P0-12, P0-14 | todo |  |  |
| P1-09 | Shared direct-call Claude wrapper with caps and caching | codex | M | L-LLM | P1-01 | todo |  |  |
| P1-10 | Answerers become scripted drafters with thread context | executor-claude-sonnet | M | L-COMMUNITY | P1-09, P1-01 | todo |  |  |
| P1-11 | marjorie-ops becomes code plus a Jev gate | codex | M | L-ROUTINES | P1-01, P0-02 | todo |  |  |
| P1-12 | marjorie-status-reply and kevin-radar to Jev plus code | codex | M | L-ROUTINES-B | P1-01 | todo |  |  |
| P1-13 | Codex worker on joey2023 and Austin retirement | codex | L | L-HOME-CODEX | P0-14 | todo |  |  |
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
| P2-14 | Owner merges the guardrails and spec PR | OWNER ACTION | S | L-OWNER | P0-14 | todo |  |  |

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

