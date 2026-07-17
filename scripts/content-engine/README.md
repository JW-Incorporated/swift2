# Content Integrity Engine (CIE)

A **read-only** content checker for the Vault. It reads `supabase/seed/**`,
reasons about it across three scopes — **factual integrity**, **safety /
red-lines**, **image quality & appropriateness** — and emits **fix-it tickets as
GitHub issues**. It never edits seed data, the DB, or generated files. Acting on
a ticket is a separate human (or apply-agent) step, out of scope by design.

## Why it's shaped this way
- **Tickets only, never mutations.** Safe to run unattended, nightly, at full
  corpus scale.
- **Outside the user request path.** The CIE is CI / cron / on-demand dev
  tooling, so the "worker-side, never-synchronous" rule that governs *user-facing*
  LLM features (`docs/architecture.md`) doesn't bind it. It still runs under
  incremental caching + (when an API is wired) a budget cap.
- **Two engines, one ticket stream.** Cheap **deterministic** checkers run in
  Node with no deps; the **agent** layer does the judgment work (fact-checking,
  safety classification, image vision). Both emit the same `Finding` shape.
- **Trust model (read before running with credentials):** the corpus loader
  dynamically imports `supabase/seed/**` — seed files are *executed*, exactly
  like the seed runner and `validate-content.mjs` do. "Read-only" means the
  engine never writes content; it does not sandbox the seeds. **Run only on
  `main` or your own branches, never on an unreviewed PR's checkout**, since
  the process carries `gh` write auth (and optionally a Vision API key). The
  planned content-inertness CI check (operating model §5.4, decisions.md
  2026-07-11) removes this caveat by making seed files provably data-only.

## Layers
| Layer | Checker | What it catches | Kind |
|---|---|---|---|
| Facts | `fact.claim-risk` | superlatives / records / dates most needing verification | deterministic (routes to agent) |
| Facts | `fact.source-grounding`, `fact.slop` | claim not backed by its source; casual/overstated wording on high-visibility items | **agent** |
| Safety | `safety.redline` | pasted lyrics, article/statement dumps, private-address/location | deterministic |
| Safety | `safety.sexualization`, `safety.illegal` | over-sexualization of Taylor; genuinely-unwanted content | **agent** (deterministic pre-filter routes candidates) |
| Image | `image.liveness`, `image.quality`, `image.host-reputation` | dead/rotted URLs, junk/low-res thumbnails, unvetted hosts | deterministic |
| Image | `image.relevance`, `image.safety` | image doesn't match its caption; NSFW/inappropriate imagery | **agent** (vision) |

**Visibility tiering** (`lib/visibility.mjs`) decides how hard each layer looks:
latest-news + marquee items (engagements, weddings, album drops, records, the
current era) get max scrutiny — multi-source verification, tone review, strict
image checks — because casual wording on the highest-visibility topics is the
worst failure mode.

## Safety escalation
`safety.*` P0 findings carry `escalate: true` — surfaced at the top of the run
report and pinned in the issue with a "human review required now" banner. For
**CSAM specifically the engine does NOT run a homegrown detector** (that's
irresponsible and legally fraught): it relies on the host-reputation allowlist
as the near-term mitigation and files an enrollment ticket for Microsoft
**PhotoDNA Cloud** + NCMEC reporting. Nudity/NSFW can later be handled locally by
**NudeNet** (self-hosted, no API) — a checker seam exists for it.

> **Driving a full run as the Claude Code agent?** Follow
> [`RUNBOOK.md`](./RUNBOOK.md) — the operator playbook for spinning up the whole
> engine (deterministic layer + the agent-review fleet) from a cold session.

## Run it — one command

```bash
npm run karen          # full pipeline; previews the issues it WOULD file (dry-run)
npm run karen:file     # …same, but actually files/updates the GitHub issues
```

The command is **`karen`** — she reviews the content and files complaints, but
never touches anything herself. (`npm run cie` is a synonym; equivalently
`node scripts/content-engine/run.mjs karen [--create]`.)

That single command runs the whole **deterministic** layer end-to-end — scan →
prepare agent batches → ingest → write the run report → file issues — and then
prints how to run the **agent** layer (the LLM review passes). It is **idempotent
and read-only**: re-run it any time; it never edits content, and it never opens a
duplicate issue (each is fingerprinted).

### Prerequisites
- **Node 24** (repo default).
- **`gh` CLI authenticated** with issue-write access to the repo (`gh auth status`)
  — only needed for `--create`; the dry-run needs nothing.
- No npm install and no API keys required for the deterministic layer. (An optional
  `GOOGLE_VISION_API_KEY` turns on automated image SafeSearch — see below.)

### The two-step reality (why it's not *only* shell)
The deterministic checks run in Node. The **agent passes** (factual verification,
image vision) need an LLM, so `npm run cie` prepares their inputs and stops there.
To run them, open this repo in **Claude Code** and say:

> "run the content integrity engine agent passes"

Claude reads `agent/prompts/{factual,image}.md` + the batch inputs under
`.findings/agent-input/`, writes findings JSON back into `.findings/`, and then you
re-run `npm run cie:file` to fold those in and file the tickets. (To fully automate
later, replace that step with an API-backed runner emitting the same `Finding`
JSON — nothing else changes.)

### Individual phases (if you don't want the wrapper)
```bash
node scripts/content-engine/run.mjs scan [--no-images]  # deterministic checkers → findings + report
node scripts/content-engine/run.mjs prep-batches        # scoped inputs for the agent passes
node scripts/content-engine/run.mjs ingest              # merge deterministic + agent findings
node scripts/content-engine/run.mjs report              # write the committed run report
node scripts/content-engine/run.mjs issues [--create]   # dry-run, or file (idempotent via fingerprint)
```

**Ticketing:** confirmed/agent-verified defects each get their own actionable
issue; mechanical deterministic P2/P3 (size-based image quality, unvetted hosts)
roll up into one tracking issue per checker. A confidence floor (0.5) keeps
"verify-this" routing signals out of the tracker — those feed the agent passes,
whose *confirmed* findings become the real tickets.

### Optional: automated image moderation
Set `GOOGLE_VISION_API_KEY` in the environment and the `image.safety` checker runs
Google Cloud Vision **SafeSearch** over every hotlinked image, filing a P0
escalation for anything LIKELY/VERY_LIKELY adult/racy/violent. Without the key it
cleanly no-ops (the host-reputation allowlist remains the near-term net). The seam
is provider-agnostic — swap for AWS Rekognition or Hive by editing one function in
`checkers/image-moderation.mjs`. CSAM is deliberately **not** handled here; that's
the PhotoDNA/NCMEC enrollment ticket.

## Layout
```
scripts/content-engine/
  run.mjs                  CLI / orchestrator (`all` = one-command pipeline)
  config.mjs               tiers, thresholds, image-host allowlist, safety pre-filters
  lib/{corpus,finding,visibility,report,issues}.mjs
  checkers/
    numeric-date.mjs       deterministic: claim-risk router (superlatives, records,
                           dates, AND attributed events/public statements)
    redlines.mjs           deterministic: pasted lyrics / dumps / private info
    image-liveness.mjs     deterministic: dead URLs, junk/low-res, unvetted hosts
    image-moderation.mjs   API-gated: Google Vision SafeSearch (no-op without key)
  agent/
    schema.md              the Finding JSON contract every agent emits
    prompts/factual.md     factual-review agent instructions (read bodies, confirm
                           events actually happened — not headline-matching)
    prompts/image.md       image vision-review agent instructions
  .findings/               per-run findings JSON, batch inputs, image cache (gitignored)
docs/audits/engine/<date>-cie-run.md                      committed run report
```

## Swapping agents → an API later
The agent layer today is executed by this session's subagents against the
prompts in `agent/prompts/`, writing findings JSON to `.findings/`. To automate,
replace that step with an API-backed runner that emits the identical `Finding`
JSON — nothing else changes.
