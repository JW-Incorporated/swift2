# Runner registry — who runs where, on whose tokens

**Requirement (Joey, final form 2026-07-12): ALL scheduled agent spend runs
on Wyatt's account** — Joey is near his weekly limit; his side spends zero
scheduled tokens. The founder split of labor: **Joey = vision, monitoring,
and site QA** (10× Wyatt's testing bandwidth), feeding the org through
zero-token paths — the intake form, experience reports, brief checkboxes;
**Wyatt's account = every runner.** Standing operational assumption (Joey,
2026-07-11): we have effective command-line access to Wyatt's machine via
Joey→Wyatt chat — any prompt/command Joey relays gets run there, so
Wyatt-side setup is a paste away, never a blocker. Every scheduled runner is registered here with
its owner; the prompt each runner executes is versioned in
`runner-prompts/` — **the repo file is the source of truth**, and a trigger
whose inline prompt drifts from its file is a bug.

## The split

| Runner | Cadence (UTC) | Model | Prompt file | Account | Why this side |
|---|---|---|---|---|---|
| Marjorie — morning brief | `0 12 * * *` (was `0 13` — moved 2026-07-16 so the emailed brief is in founder inboxes **by 6:00 AM PT**, Joey's requirement; the 12:45 UTC mailer needs the brief posted by ~12:40) | Fable | [`runner-prompts/marjorie-brief.md`](runner-prompts/marjorie-brief.md) | **Wyatt** | Moved 2026-07-12: Joey near weekly limit; briefs deliver to both founders regardless of runner account |
| Marjorie — 8 PM delta | `0 3 * * *` | Fable | [`runner-prompts/marjorie-delta.md`](runner-prompts/marjorie-delta.md) | **Wyatt** | Same |
| Austin — build runs ×2 | `0 16 * * *`, `0 21 * * *` | Fable | [`runner-prompts/austin-run.md`](runner-prompts/austin-run.md) | **Wyatt** | Solves work (code) |
| Nils — daily walk | `0 14 * * *` | Fable | [`runner-prompts/nils-walk.md`](runner-prompts/nils-walk.md) — needs WebFetch tool (live-site walks) | **Wyatt** | Heavy judgment over the whole site + SEO/discoverability lens |
| Content Shift ×2 | `0 17,23 * * *` | Fable | [`runner-prompts/content-shift-run.md`](runner-prompts/content-shift-run.md) | **Wyatt** | Heaviest: research + writing |
| Kevin — S1 Karen solver | `17 11 * * *` | Fable | [`runner-prompts/kevin-stream1-karen.md`](runner-prompts/kevin-stream1-karen.md) | **Wyatt** | Fixes cie tickets; runs after Karen, before the brief |
| Kevin — S2 user digest | `13 15 * * *` | Fable | [`runner-prompts/kevin-stream2-digest.md`](runner-prompts/kevin-stream2-digest.md) | **Wyatt** | Daily feedback digest for human accept/reject |
| Kevin — S3 eng triage | `43 15 * * *` | Fable | [`runner-prompts/kevin-stream3-triage.md`](runner-prompts/kevin-stream3-triage.md) | **Wyatt** | Buckets Joey's eng tickets → Austin intake |
| Kevin — S3 comment radar | `23 0-5,13-23 * * *` | Fable | [`runner-prompts/kevin-stream3-radar.md`](runner-prompts/kevin-stream3-radar.md) — lazy: cheap poll, loads charter only on a hit | **Wyatt** | Hourly 6am–10pm PT (skips overnight); surfaces cross-session comments |
| Karen — nightly scan | `0 9 * * *` | Fable | [`runner-prompts/karen-nightly.md`](runner-prompts/karen-nightly.md) | **Wyatt** | Solves work (integrity + link-rot sweep); 2 AM PT |
| Abigail — CIE agent passes | `40 9 * * *` | Fable | [`runner-prompts/cie-agent-pass.md`](runner-prompts/cie-agent-pass.md) | **Wyatt** | Runs the CIE factual+image LLM review fleet Karen's nightly excludes; fires right after Karen's 09:00 scan so today's batches exist, before Kevin S1's 11:17 solver |
| Paul Blart — security patrol | `7 12 * * 1` | Fable | [`runner-prompts/paul-blart-run.md`](runner-prompts/paul-blart-run.md) | **Wyatt** | Dependency/supply-chain security; weekly, judgment on Dependabot/CodeQL |
| Laura — a11y walk | `0 15 * * *` | Fable | [`runner-prompts/laura-walk.md`](runner-prompts/laura-walk.md) — needs Web tools + npx axe/pa11y | **Wyatt** | Accessibility (WCAG 2.2 AA); public-site legal + reach |
| watchdog / brief-mailer / CI / CodeQL / a11y | GitHub Actions | none | `.github/workflows/` | repo | Zero LLM (detection layer) |

## Maintenance fleet (2026-07-12)

Four site-maintenance additions, designed in
[`maintenance-bots-research.md`](maintenance-bots-research.md) on the principle
**detect deterministically, judge with an LLM, a human merges**:

- **Paul Blart** (new) — dependency & supply-chain security. Native detection:
  `.github/dependabot.yml` (grouped weekly bumps + a separate security lane) +
  `.github/workflows/codeql.yml` + secret scanning (enable in repo settings).
  Paul triages alerts + Dependabot PRs into a weekly `security` patrol issue and
  never merges. Charter: [`paul-blart.md`](paul-blart.md).
- **Laura** (new) — accessibility auditor to **WCAG 2.2 AA**. Native detection:
  `.github/workflows/a11y.yml` (axe/pa11y, non-blocking to start). Laura files
  `a11y` specs and always names the ~50% manual residual. Charter:
  [`laura.md`](laura.md).
- **Karen** (extended) — nightly now also runs `scripts/check-link-liveness.mjs`
  to sweep **every** source URL (not just images), suggesting archive.org/Wayback
  snapshots for dead links.
- **Nils** (extended) — daily walk now also judges **SEO/discoverability**
  (metadata / Open Graph / JSON-LD / sitemap), and its live-site target moved off
  the internal `swift2-ten` alias to the public domain **www.longlivets.com**
  (see [`../deploy.md`](../deploy.md)).

## Migration state (2026-07-12)

All five cloud routines currently exist under **Joey's** account (created
during bootstrap, 2026-07-11) and stay **enabled until Wyatt's replacements
are live** — no missed briefs, no dead cadences. Cutover:

1. Wyatt (or his Claude Code session) creates **all five** routines from
   this registry: same name, cron, model, and the prompt file's exact
   contents, via `/schedule` or the RemoteTrigger API.
2. Wyatt comments "live" on the handoff ticket (#504) with his routine IDs.
3. **Every** Joey-side routine gets **disabled** (kept as warm spares — the
   kill-switch doc covers both sets).

**Abigail — CIE agent passes (2026-07-18):** repo half is done (registry row +
[`runner-prompts/cie-agent-pass.md`](runner-prompts/cie-agent-pass.md)); the
remaining step is external — her cloud routine still needs to be **created on
Wyatt's account** via `/schedule` or the RemoteTrigger API (cron `40 9 * * *`,
Fable, prompt = that file's exact contents), same as every other runner here.

## Kevin cloud move (2026-07-12)

Kevin's four streams moved off the session-scoped cron onto cloud routines (rows
above), for durability. Design notes: S1 runs daily right after Karen (not
hourly — new cie tickets only appear once Karen's nightly scan files them); the
S3 comment radar runs hourly and is capped to 06:00–22:00 PT because cross-session
comments are rare overnight, and its prompt is **lazy** (one cheap `gh` poll first;
loads `docs/kevin.md` and reasons only on a real new comment — the ~16 empty runs/
day stay cheap). Tradeoff vs. the old ~10-min session poll: up to ~1h surfacing
latency and a cloud cold-boot per run; the endgame in `docs/kevin.md` (webhooks)
removes both. Cron floor is 1 hour, so sub-hourly radar is not expressible in cloud.

## Rules

- **Changing a runner's behavior = PR to its prompt file first**, then
  update the trigger to match. Never edit only the trigger.
- New runners get a row here + a prompt file in the same PR that creates
  them, with an explicit account owner justified against the 1:10 split.
- The manager-hat telemetry reports tokens-per-account monthly so the split
  is measured, not assumed.
