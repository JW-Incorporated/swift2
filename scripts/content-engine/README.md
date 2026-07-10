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

## Usage
```bash
node scripts/content-engine/run.mjs scan            # deterministic checkers → findings + report
node scripts/content-engine/run.mjs scan --no-images # skip the network image pass (fast)
node scripts/content-engine/run.mjs prep-agents      # write scoped inputs for the agent passes → .findings/agent-input/
# … agents review those inputs and drop findings JSON into .findings/ …
node scripts/content-engine/run.mjs ingest           # merge deterministic + agent findings
node scripts/content-engine/run.mjs issues           # DRY-RUN: show what would be filed
node scripts/content-engine/run.mjs issues --create  # file GitHub issues (idempotent via fingerprint)
```
Issues: P0/P1 get individual issues; P2/P3 roll up into one issue per checker.
A confidence floor (0.5) keeps "verify-this" routing signals out of the tracker —
those feed the agent passes, whose *confirmed* findings become the real tickets.

## Layout
```
scripts/content-engine/
  run.mjs                  CLI / orchestrator
  config.mjs               tiers, thresholds, image-host allowlist, safety pre-filters
  lib/{corpus,finding,visibility,report,issues}.mjs
  checkers/{numeric-date,redlines,image-liveness}.mjs   deterministic
  agent/{schema.md, prompts/*.md}                        the agent-review contract
  .findings/               per-run findings JSON + image cache (gitignored)
docs/audits/engine/<date>-cie-run.md                      committed run report
```

## Swapping agents → an API later
The agent layer today is executed by this session's subagents against the
prompts in `agent/prompts/`, writing findings JSON to `.findings/`. To automate,
replace that step with an API-backed runner that emits the identical `Finding`
JSON — nothing else changes.
