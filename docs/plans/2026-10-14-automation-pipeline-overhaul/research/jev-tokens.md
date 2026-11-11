# Jev + routine token burn (read-only research, 2026-10-14)

## Part 1: Jev
Case-insensitive search for "jev" over swift2 (excl node_modules/.git), swift2 memory dir, Projects root CLAUDE.md: ZERO real hits (only base64 noise in package-lock.json, font CSS). Near-spellings (jeb/jef/gev/J.E.V/jeeves/ollama/qwen/llama.cpp/gemma/local model): nothing relevant. The garage-fleet folder was NOT read (isolation rule). Jev is not defined in swift2 or root rules. UNKNOWN.
Candidates (no evidence): (1) an agent/local model in the garage fleet; (2) a Codex/OpenAI model alias (root rule j-2 names gpt-5.6-sol, gpt-5.3-codex-spark; neither is Jev); (3) a mis-transcribed tool name.

## Part 2: assumptions
Window ~31 days (daily crons=31 runs); runs/wk = runs/4.4; typical turns = 50% of max_turns; no actual turns data committed (routine-usage-report.mjs only uploads a per-run routine-usage.json artifact). Template defaults: max_turns 40, timeout 30. Auth: CLAUDE_CODE_OAUTH_TOKEN via anthropics/claude-code-action@v1. max_budget_usd set only: awareness-answerer 1, fable-strategy 6, fable-taste 4, marjorie-ask 6, tree-ask 7.

routine | model | max_turns | runs30 | est turns/wk | app content | class | candidate home
marjorie-ops (hourly) | sonnet-5 | 60 | 364 (89 fail) | 600-2500 (LLM-vs-skip split unknown) | no | routing/decision | plain code / Jev
vault-run | opus-4-8 | 200 | 33 | ~750 | YES | drafting | keep; trial sonnet-5
marjorie-status-reply | opus-5 | 25 | ~107 | ~290 | no | classification | sonnet / Jev
marjorie-ask-response | opus-5 | 60 | 44 (30+ fail) | ~300 | no | judgment | fix failures; sonnet
marjorie-brief | opus-4-8 | 40 | 65 | ~295 | no | summary | sonnet / template code
community-answerer | sonnet-5 | 80 | 31 | ~280 | no | drafting | haiku / Jev
kevin-radar | haiku | 40 | 62 | ~280 | no | classification | plain code
tree-daily-draft | opus-4-8 | 50 | 32 | ~180 | no | drafting | keep / sonnet
awareness-answerer | sonnet-5 | 30 | 48 | ~165 | no | classification | haiku / Jev
marjorie-triage | sonnet-5 | 40 | 33 | ~150 | yes | routing | Jev / code
news-triage | sonnet-5 | 40 | 32 | ~145 | yes | routing | Jev / haiku
austin-build | fable-5 | 40 | 32 | ~145 | yes | judgment | keep, cut cadence
kevin-daily-desk | sonnet-5 | 40 | 31 | ~140 | no | mechanical | codex exec / code
marjorie-chat | opus-5 | 35 | 26 | ~100 | no | conversational | sonnet
tree-chat | opus-5 | 25 | 27 | ~75 | no | conversational | sonnet
tree-weekly-plan | opus-5 | 80 | 8 | ~75 | no | judgment | keep
tree-ask-response | opus-5 | 70 | 9 | ~70 | no | judgment | keep
laura-a11y-walk | sonnet-5 | 40 | 10 | ~45 | no | mechanical | codex exec
nils-walk | opus-4-8 | 40 | 9 | ~40 | no | judgment | sonnet
marjorie-weekly-review | fable-5 | 90 | 4 | ~40 | no | judgment | keep
tree-event-draft | opus-4-8 | 30 | 7 | ~25 | no | drafting | keep
paul-blart | opus-4-8 | 40 | 5 | ~23 | no | review | sonnet
karen-nightly | sonnet-5 | 40 | 4 | ~18 | yes | mechanical | codex exec
kevin-s1-karen-solver | opus-4-8 | 40 | 4 | ~18 | yes | fixing | keep
fable-strategy/taste | fable-5 | 40/30 | 1/0 | ~0 | no | judgment | keep

## Codex in Actions
No workflow uses codex exec / codex-action. routine-template.yml hard-wires claude-code-action + OAuth token; no Codex variant. Social work is never dispatched to Codex (project CLAUDE.md). Root rules j/j-2/j-3: Codex only for grunt/executor-class work.

## Unverified
Real turns/cost; marjorie-ops LLM-vs-skipped split; exact window; whether an OpenAI secret exists for Actions; what Jev is.
