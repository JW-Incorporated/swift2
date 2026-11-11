# Automation pipeline overhaul (2026-10-14)

Owner: Joey. Plan author: an Opus planning agent working from eight read-only research passes and a Fable audit. Status: plan written, nothing implemented yet.

## What this is
The effort to fix the content-generation, social and community automation and to meet the eleven goals ("true north"): critical news on the site within an hour with social and push, never missing news, the largest clowning database, no text-only content, new content first on social, a swifty voice, active and measured Reddit and Facebook participation, and automatic fan merch with affiliate links matched to photos. It also cuts Claude token use by moving routing to Jev and plain code, and building to Codex.

## Where things are
| Path | Contents |
|---|---|
| `plan.md` | The full plan: summary, phases, every item, classification taxonomy, token model, decisions D1-D9, owner actions |
| `plan-items.json` | The same plan as data (68 items, 15 classes, target flow). The dashboard reads this |
| `OPERATING-MODE.md` | How the project-manager session runs this programme: roles, decision authority, Codex and Claude split, tracker and dashboard updates, repo rules, kickoff prompt (section 8) |
| `tracker.md` | One row per item with status, PR and date. Kept current by the project-manager session |
| `research/` | Read-only research reports with file:line citations |
| `inputs/` | The briefs, the owner's instructions, Fable's full audit, and the metrics data the research used |
| `dashboard/` | Source for the Pipeline Atlas dashboard (an Artifact). `build.mjs` still points at the original working folders and needs its paths updated before it can be re-run |

## Reading order
1. `plan.md` executive summary and the decisions list.
2. `inputs/planning-brief.md` and its addenda for the facts and the corrections to earlier claims.
3. `research/` for the evidence behind any item.

## Caveats
- Several claims in `inputs/fable-output.md` were later disproven; the note at its top lists them. Prefer the research files.
- This folder lives in a public repo. Network addresses, secret locations and similar details were removed from the copies here. Do not add them back.
- Numbers are as of 2026-10-14 and the token figures are estimates until the usage ledger reports real turns.
- Dashboard: https://claude.ai/artifact/VVQYq41yw812eEYmFqqoFM (private to the owner).
