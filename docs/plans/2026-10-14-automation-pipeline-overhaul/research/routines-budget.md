# Research: routines, budget pool, why the answerer fails (2026-10-14 ~19:50 PDT)
Produced by a sub-agent that the stopped Opus planner had launched before it was killed. Read-only; nothing was written to the repo. Treat as a research report (claims are the sub-agent's; items marked UNVERIFIED were not confirmed). Supplements planning-brief.md and its addenda.

## 1. Root cause of the answerer (and other routine) failures: the weekly Claude plan limit
- All five failing logs pulled (awareness-answerer, marjorie-ask-response, community-answerer, kevin-daily-desk, tree-daily-draft) end with: `session result subtype=success is_error=true - routine step failed - reason: You've hit your weekly limit - resets Oct 14, 11pm (UTC)`. It is the shared `CLAUDE_CODE_OAUTH_TOKEN` Max pool running dry. marjorie-ask-response failed 31 of its last 40 runs.
- The `prompt_file ... does not exist` line is a red herring: it is the text of an `echo` inside a `run:` block at routine-template.yml:226-229 and also appears in successful runs (run 38241949823 succeeded on 2026-10-12 11:19Z with the identical line). The prompt file docs/agents/runner-prompts/awareness-answerer.md exists on origin/main; failing run 38310444964 loaded the full prompt, then the Claude step returned `num_turns: 1, is_error: true`.
- No file moved: last commits touching the prompt/workflow are Oct 9 (#5458, #5415), before the failures.
- Nothing in code is broken; runs recover after the reset at 2026-10-14 23:00Z. Without a pause switch the fleet will trip the limit again.
- Gap: scripts/routines/session-outcome.mjs:44 only matches `/usage limit reached\|?(\d{10,13})?/i`. The new "You've hit your weekly limit - resets ..." wording does not match, so `failureHint` returns null, the run stays red, and bot-failure-triage spams issues.

## 2. routine-template.yml (322 lines) facts
- Inputs (lines 31-160): routine_name, prompt_file (required), model, allowed_tools (required), disallowed_tools, timeout_minutes (30), max_turns (40), max_budget_usd (default 0 = uncapped; if >0 passes `--max-budget-usd`, line 252), checkout_token_secret, environment, expose_dispatch_token, pre_run_artifact, post_run_artifact, concurrency_key, allowed_bots.
- Secrets (166-178): CLAUDE_CODE_OAUTH_TOKEN, SOCIAL_POSTER_PAT, ANTHROPIC_API_KEY (declared, never wired to the action), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL. Auth: `claude_code_oauth_token: secrets.CLAUDE_CODE_OAUTH_TOKEN` (line 249).
- Guard step (~195-205) only skips when the OAuth secret is empty; later steps are gated on `steps.guard.outputs.skip == 'false'`.
- Limit detection exists only in session-outcome.mjs via the "Decide routine outcome" step (262-270). scripts/routine-usage-report.mjs writes routine-usage.json (num_turns, duration, list-price cost equivalent, usage, SDK error metadata including rate_limit) as an artifact with 90-day retention; its header says dollar hard-capping is impossible under OAuth.
- Pause switch design: extend the Guard step with `vars.ROUTINES_PAUSED == 'true'` (optionally a time variable ROUTINES_PAUSED_UNTIL) so every routine skips in one place; bot-chat-poll.yml already uses `vars.BOT_CHAT_ENABLED`. Post-run: add "hit your weekly limit" / "resets <time>" to `failureHint` (session-outcome.mjs:42-52) and make "Decide routine outcome" exit 0 with a `::warning::` for limit hits (also stops bot-failure-triage noise). Auto-setting the pause variable needs a PAT; GITHUB_TOKEN almost certainly cannot write repo variables (UNVERIFIED); `gh variable` writes are off-limits to agents.

## 3. Routine table (callers use workflow_dispatch; cadence decoded from cron; blank = template default turns 40 / budget 0)
| Routine | Cron / cadence | Model | max_turns | budget | timeout | Shell |
|---|---|---|---|---|---|---|
| austin-build | 0 21 daily | fable-5 | 80 | - | 45 | yes |
| awareness-answerer | 41 */3 (every 3 h) | sonnet-5 | 30 | $1 | 15 | no |
| community-answerer | 46 14 daily | sonnet-5 | 80 | - | 30 | yes |
| fable-strategy-update | dispatch-only | fable-5 | 40 | $6 | 25 | yes |
| fable-taste-ruling | dispatch-only | fable-5 | 30 | $4 | 20 | no |
| karen-nightly | 0 9 * * 0 weekly | sonnet-5 | - | - | 45 | yes |
| kevin-daily-desk | 13 15 daily | sonnet-5 | 80 | - | 60 | yes |
| kevin-radar | 23 1,13 twice daily | haiku-4-5 | - | - | 15 | yes |
| kevin-s1-karen-solver | 17 11 * * 0 weekly | opus-4-8 | 80 | - | 30 | yes |
| laura-a11y-walk | 20 18 * * 2,5 | sonnet-5 | 80 | - | 25 | yes |
| marjorie-ask-response | dispatch-only | opus-5 | 60 | $6 | 30 | yes |
| marjorie-brief | 0 12 daily | opus-4-8 | - | dispatch-only | 40 | yes |
| marjorie-chat | dispatch (poll) | opus-5 | 35 | - | 15 | yes |
| marjorie-ops | 18 * * * * hourly | sonnet-5 | 90 | - | 30 | yes |
| marjorie-status-reply | dispatch-only | opus-5 | 25 | - | 15 | yes |
| marjorie-triage | 27 16 daily | sonnet-5 | 40 | dispatch-only | 25 | yes |
| marjorie-weekly-review | 13 20 * * 0 weekly | fable-5 | 90 | $12 | 45 | yes |
| news-triage | 40 15 daily | sonnet-5 | - | dispatch-only | 30 | yes |
| nils-walk | 0 14 * * 1,5 | opus-4-8 | - | - | 35 | yes |
| ops-fix | dispatch-only | opus-5 | 80 | - | 60 | yes |
| paul-blart | 20 22 * * 1 weekly | opus-4-8 | - | - | 30 | yes |
| tree-ask-response | dispatch-only | opus-5 | 70 | $7 | 35 | yes |
| tree-chat | dispatch (poll) | opus-5 | 25 | - | 15 | yes |
| tree-daily-draft | 0 11 daily | opus-4-8 | 50 | - | 30 | yes |
| tree-event-draft | dispatch-only | opus-4-8 | 30 | - | 20 | yes |
| tree-weekly-plan | 0 10 * * 1 weekly | opus-5 | 80 | - | 45 | yes |
| vault-run | 7 16 daily | opus-4-8 | 200 | - | 90 | yes |
Prompt files are docs/agents/runner-prompts/<name>.md except: kevin-daily-desk -> kevin-desk.md, kevin-radar -> kevin-stream3-radar.md, kevin-s1-karen-solver -> kevin-stream1-karen.md, laura-a11y-walk -> laura-walk.md, austin-build -> austin-run.md, paul-blart -> paul-blart-run.md. Cron runs of marjorie-brief, marjorie-triage and news-triage are uncapped (max_budget_usd 0); the cap applies only on dispatch.
- PR #5484 is OPEN: deletes routine-marjorie-brief, -chat, -triage, routine-tree-ask-response, -chat, -daily-draft and tree-mail.yml; modifies routine-tree-weekly-plan.yml (-282/+14), bot-chat-poll.yml (-59/+23), watchdog.yml, doorbell code; adds social-retire-stale-drafts.yml. marjorie-ask-response, marjorie-ops and the rest are untouched. Edits to deleted routines should wait for or rebase onto it.

## 4. bot-chat-poll.yml and the clock
- Cron */5 plus manual dispatch (dry_run). Step 1 `node scripts/marjorie/chat-poll.mjs poll` (guarded by vars.BOT_CHAT_ENABLED != 'false') claims Discord messages with an eyes reaction and dispatches routine-marjorie-chat and routine-tree-chat (both deleted by #5484). Step 2 `node scripts/ops/clock-dispatch.mjs` (always) reads scripts/ops/clock-table.json and runs `gh workflow run <wf> --ref main`, each row with minGapMinutes. Rows today: bot-failure-triage 25, watchdog 55 (hourly), routine-marjorie-ops 55, marjorie-status 55, auto-merge-keepup 14, merch-awin-sync 360, social-approval-poll 14, social-poster 28, concert-photo-sourcing 1380.
- Doorbell: non-AI relay on the Hermes VM (docs/decisions.md:941, docs/ops/doorbell.md); the 5-minute poll stays as fallback; scripts/doorbell/schedule.json holds its clock (a new row needs a reviewed tag and a founder decision); installed doorbell-v3, v4 pending (PR #5014 mentioned); schedule.json contents not read.
- A 10-minute breaking-lane job: add a row to clock-table.json with minGapMinutes ~9-10 (poll fires every 5 min, effective cadence 10). The target must be a plain `run:` workflow (no agent) or it burns the limit. The table is shared and runs under `if: always()`; dispatch always uses `--ref main`.

## 5. Direct Anthropic API key path (separate from the OAuth pool)
- Workflows passing ANTHROPIC_API_KEY: concert-photo-sourcing.yml:246, content-backfill.yml:56, dedupe-current-items.yml:46, merch-audit-authoring.yml:116, merch-matcher-authoring.yml:70, news-worker.yml:62, output-sampling.yml:141, theory-miner.yml:96. routine-template.yml:170 declares it but never wires it to the action.
- Direct API callers: apps/web/lib/longlive/mood-client.ts:37 (claude-sonnet-5, usage cap reserved before the call, lines 15-24), apps/worker/src/extract/haiku-client.ts:32 and theory-haiku-client.ts:28 (claude-haiku-4-5, per-cluster and comment budgets), scripts/social/photo-qc.mjs:13,18,124 (@anthropic-ai/sdk, claude-sonnet-5-5, max_tokens 800), photo-qc-eval.mjs:13, and the shared wrapper scripts/lib/anthropic.mjs:11,29 used by scripts/merch-engine/audit-matches-authoring.mjs, match-moments-authoring.mjs and scripts/routine-quality-sample.mjs. UNVERIFIED which have a hard USD cap besides the mood-client usage cap.
- So an API key already exists in GitHub secrets (used by these workflows) and in Vercel. A separate content-producer path through the API key would need the routine template to use it instead of the OAuth token (not currently supported).

## 6. Codex and OpenAI in workflows
- No `codex exec` in .github/workflows; "Codex" appears only in comments and routine-template.yml:282 (pointer to docs/agents/codex.md). The only OpenAI secret is OPENAI_API_KEY in news-worker.yml:13,63, optional, for the classifier (heuristic fallback if unset).

## Traps and unverified
- Local main is stale; use origin/main. The prompt_file log line misleads. session-outcome.mjs misses the new limit wording.
- UNVERIFIED: whether interactive Max sessions consume the same pool (logs do not show the split); schedule.json rows; whether ROUTINES_PAUSED or similar already exists as a repo variable; logs of routines other than the five sampled.
