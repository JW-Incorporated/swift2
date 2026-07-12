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
| Marjorie — 6 AM brief | `0 13 * * *` | Fable | [`runner-prompts/marjorie-brief.md`](runner-prompts/marjorie-brief.md) | **Wyatt** | Moved 2026-07-12: Joey near weekly limit; briefs deliver to both founders regardless of runner account |
| Marjorie — 8 PM delta | `0 3 * * *` | Fable | [`runner-prompts/marjorie-delta.md`](runner-prompts/marjorie-delta.md) | **Wyatt** | Same |
| Austin — build runs ×2 | `0 16 * * *`, `0 21 * * *` | Fable | [`runner-prompts/austin-run.md`](runner-prompts/austin-run.md) | **Wyatt** | Solves work (code) |
| Nils — daily walk | `0 14 * * *` | Fable | [`runner-prompts/nils-walk.md`](runner-prompts/nils-walk.md) | **Wyatt** | Heavy judgment over the whole site |
| Content Shift ×2 | `0 17,23 * * *` | Fable | [`runner-prompts/content-shift-run.md`](runner-prompts/content-shift-run.md) | **Wyatt** | Heaviest: research + writing |
| Kevin (hourly + daily streams) | session cron | — | `docs/kevin.md` | **Wyatt** | Already his |
| Karen nightly (once wired, G-E) | nightly | — | `scripts/content-engine` RUNBOOK | **Wyatt** | Solves work |
| watchdog / brief-mailer / CI | GitHub Actions | none | `.github/workflows/` | repo | Zero LLM |

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

## Rules

- **Changing a runner's behavior = PR to its prompt file first**, then
  update the trigger to match. Never edit only the trigger.
- New runners get a row here + a prompt file in the same PR that creates
  them, with an explicit account owner justified against the 1:10 split.
- The manager-hat telemetry reports tokens-per-account monthly so the split
  is measured, not assumed.
