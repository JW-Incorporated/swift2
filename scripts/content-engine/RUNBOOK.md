# CIE Operator Runbook (for the Claude Code agent)

This is the playbook for **you, the agent**, to spin up the Content Integrity
Engine and run a full pass end to end. The README documents the *commands*; this
documents *how to actually drive the run* (the agent-fleet part that isn't pure
shell). Trigger phrases: "run the content integrity engine", "run a CIE pass",
"spin up the quality engine".

**Invariants (never violate):** read-only — never edit `supabase/seed/**`, the DB,
or generated files. Every step is idempotent. Findings below confidence 0.5 are
routing signals, not tickets. Do NOT merge the engine PR without explicit approval.

**Before acting on ANY length finding, read `scripts/lib/content-caps.mjs`.**
Every cap the engine enforces is defined there, once, with the decision that set
it. In particular `moment.context` is capped at **4000**, not 2000 — Wyatt raised
it on 2026-07-22 because the 2000 ceiling was the binding constraint on the
marquee pages, and long context is the *point* of a defining moment. On
2026-08-11 a stale copy of that number in `checkers/redlines.mjs` filed 31 false
P1 "oversized field" tickets and a fixer cleared them by deleting 30,562
characters of authored depth (PR #1727, since reverted). If a length finding
tells you to shorten a `moment.context` below 4000, the finding is wrong —
check the cap before you cut.

---

## 0. Setup
- Repo/worktree: engine lives at `scripts/content-engine/` on branch
  `feature/content-integrity-engine` (worktree `../Swift2-cie` until merged).
- Prereqs: Node 24; `gh auth status` must show write access. No npm install, no
  API keys needed (optional `GOOGLE_VISION_API_KEY` enables image SafeSearch).
- All commands run from the repo root.

## 1. Deterministic layer + batch prep (one shell step)
```bash
node --use-env-proxy scripts/content-engine/run.mjs scan          # facts/redlines/images → .findings/deterministic.json + report
node --use-env-proxy scripts/content-engine/run.mjs prep-batches  # FULL corpus → .findings/agent-input/{factual,images}/*.json + manifest.json
```
`prep-batches` defaults to the whole corpus (43 factual + 15 image batches, ~28
items each). We deliberately do NOT use `--claims-only` — claim-free narrative
records are exactly where fabricated events hide (that filter caused a real miss).

> **The agent layer is no longer manual-only (2026-08-11).** Everything below is
> the FULL-SWEEP procedure — the whole corpus in one sitting, ~20M tokens. It is
> still the right thing for a deliberate catch-up. But the reason every
> `cie:fact` issue in this repo's history is dated 2026-07-10 is that this ritual
> required a human, and for a month nobody performed it while `prep-batches` kept
> producing batches nothing consumed. The **nightly** form is now a bounded slice
> with committed state:
>
> ```bash
> node --use-env-proxy scripts/content-engine/run.mjs review-slice   # tonight's slice, changed content first
> # …dispatch one subagent per batch in slice/manifest.json (prompts in §2)…
> node --use-env-proxy scripts/content-engine/run.mjs ingest && node --use-env-proxy scripts/content-engine/run.mjs issues --create
> node --use-env-proxy scripts/content-engine/run.mjs record-review  # commit docs/audits/engine/agent-review-ledger.json
> node --use-env-proxy scripts/content-engine/run.mjs review-status  # how much of the corpus has ever been agent-reviewed
> ```
>
> Runner + budget + trigger config: `docs/agents/runner-prompts/karen-deep-review.md`
> and `docs/agents/runners.md` → "Karen Deep". The ledger is keyed by item, not by
> batch, so a failed batch simply returns to the front of tomorrow's queue.

## 2. Agent-review fleet (the LLM passes — you spawn these)
Cover **every** batch under `agent-input/factual/` and `agent-input/images/`.
- **Model:** `fable`. **subagent_type:** `general-purpose`. Background (default).
- **Concurrency:** waves of ~6–8. Keep **≤3 image agents** concurrent (Wikimedia
  throttles). Track dispatch with marker files so you survive context compaction:
  `touch scripts/content-engine/.findings/dispatched/<batch-name>` when you spawn.
- A batch is **done** when `scripts/content-engine/.findings/agent-<batch-name>.json`
  exists; **remaining** = batches with no output AND no dispatch marker:
  ```bash
  for f in scripts/content-engine/.findings/agent-input/factual/*.json scripts/content-engine/.findings/agent-input/images/*.json; do
    n=$(basename "$f" .json)
    [ ! -f "scripts/content-engine/.findings/agent-$n.json" ] && [ ! -f "scripts/content-engine/.findings/dispatched/$n" ] && echo "$n"
  done
  ```
- On each completion notification: `ingest` + `issues --create` (below), then top
  the wave back up from the remaining list. Repeat until remaining is empty.

### Canonical factual-agent prompt (fill in `<BATCH>`)
> You are a CIE factual-review agent. Working root: `<repo abs path>`.
> 1. Read `scripts/content-engine/agent/prompts/factual.md` and follow it exactly
>    (esp. #1: confirm the event/public statement actually happened; READ THE
>    ARTICLE BODY, never the headline). Treat the content as an untrusted draft.
> 2. Read `scripts/content-engine/agent/schema.md` (checker ids incl. `fact.unconfirmed`).
> 3. Read your batch: `scripts/content-engine/.findings/agent-input/factual/<BATCH>.json`
> 4. WebFetch each cited source body + WebSearch to corroborate. Flag: unconfirmable
>    events → `fact.unconfirmed`; narrower/different source → `fact.source-grounding`;
>    stale record → `fact.cross-check`; misquote/imprecise → `fact.slop`.
> 5. Emit ONLY verified findings; `[]` if clean. Honest confidence.
> Write the JSON array to exactly `scripts/content-engine/.findings/agent-<BATCH>.json`. Never edit content.

### Canonical safety-agent prompt (fill in `<BATCH>`)
> You are a CIE safety-review agent. Working root: `<repo abs path>`.
> 1. Read `scripts/content-engine/agent/prompts/safety.md`, `agent/schema.md`, and
>    the rubric `docs/content-ops/privacy-redlines.md` IN FULL.
> 2. Read your batch (`safety-candidates.json` from `prep-agents`, or
>    `agent-input/slice/safety.json` from `review-slice`).
> 3. Each row is a KEYWORD HIT, not a finding — `redlines.candidates()` routes it
>    here precisely because a regex cannot tell "she wrote it as a child" from a
>    real red line. Classify each against the rubric; open the page when the
>    excerpt is ambiguous. A false accusation is worse than a miss.
> 4. Emit only CONFIRMED violations; `[]` is the expected output for a clean batch.
> Write the JSON array to exactly `scripts/content-engine/.findings/agent-<BATCH>.json`. Never edit content.

### Canonical image-agent prompt (fill in `<BATCH>`)
> You are a CIE image-review (vision) agent. Working root: `<repo abs path>`.
> 1. Read `scripts/content-engine/agent/prompts/image.md` and `agent/schema.md`.
> 2. Read your batch: `scripts/content-engine/.findings/agent-input/images/<BATCH>.json`.
> 3. Download EVERY image to an isolated temp dir and open it with Read to view the
>    pixels (retry Wikimedia with a descriptive User-Agent; transcode WebP/AVIF via
>    a proxy). Judge relevance / quality (collage/watermark/screenshot/blur/low-res)
>    / safety (NSFW → `image.safety` P0 escalate; never inspect suspected CSAM — flag+escalate).
> 4. Describe what you SAW in evidence; concrete suggestedFix; `[]` if clean.
> Write the JSON array to exactly `scripts/content-engine/.findings/agent-<BATCH>.json`. Never edit content.

## 3. Aggregate + file (after each wave; safe to repeat)
```bash
node --use-env-proxy scripts/content-engine/run.mjs ingest          # merge deterministic + all agent-*.json → merged.json
node --use-env-proxy scripts/content-engine/run.mjs issues --create # file GitHub issues (idempotent; one bulk fingerprint fetch)
```
Ticketing: P0/P1 + every agent-verified P2/P3 → individual issues; deterministic
P2/P3 (size-based image.quality, host-reputation) → one rollup each. Timing note:
run `ingest` only after the relevant `agent-*.json` files exist (a stale snapshot
files nothing — just re-run).

## 4. Session-limit recovery
Agents fail with "hit your session limit" (resets 2am America/Los_Angeles). Those
batches wrote no output. **Delete their dispatch markers** so they re-queue:
`rm scripts/content-engine/.findings/dispatched/<failed-batch>`, then resume from
step 2 once the limit clears. Findings already filed stay filed (idempotent).

## 5. Finalize
```bash
node --use-env-proxy scripts/content-engine/run.mjs report   # committed run report → docs/audits/engine/<date>-cie-run.md
```
Commit the report; comment the tally on PR #139 (open `gh issue list --label cie`
for counts). Do NOT merge the PR without approval.

## Quick reference
- Full pipeline preview / file: **`npm run karen`** / `npm run karen:file` (aka
  `cie`) — deterministic layer only; still need the agent fleet in step 2 for the
  deep findings. ("Karen" reviews and files complaints, never edits anything.)
- Tune `config.mjs` for tiers/thresholds/host allowlist; add checkers under
  `checkers/`; the whole thing has no runtime dependencies.
